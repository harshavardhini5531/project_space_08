// app/api/admin/project-leaders/route.js
//
// Final ranking endpoint — admin sees grand total /150 per team.
//
//   For each team:
//     Panel scores: average all mentors' total_score → final /50
//     Leaderboard score: same /100 from /api/admin/leaderboard
//     Grand total: panel_avg + leaderboard = /150
//
// Returns one row per team with full breakdown including per-mentor panel scores.

import { supabase } from '@/lib/supabase'

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 30000

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

let devCache = { at: 0, data: null }
const DEV_TTL_MS = 60 * 1000

async function fetchDevProjects() {
  const now = Date.now()
  if (devCache.data && (now - devCache.at) < DEV_TTL_MS) return devCache.data
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), FETCH_TIMEOUT_MS)
    const r = await fetch(`${DEV_API_BASE}/api/projects`, { signal: c.signal })
    clearTimeout(t)
    if (!r.ok) return []
    const d = await r.json()
    const projects = Array.isArray(d?.data) ? d.data : []
    devCache = { at: now, data: projects }
    return projects
  } catch (e) {
    return devCache.data || []
  }
}

function computeOverallScore(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const safe = n => (typeof n === 'number' && !isNaN(n)) ? n : 0
const round1 = n => n == null || isNaN(n) ? null : Math.round(n * 10) / 10

export async function POST(request) {
  try {
    const { adminEmail } = await request.json().catch(() => ({}))
    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── Pull all the data we need ──
    const [
      teamsRes, membersRes, certsRes, pptsRes,
      attendanceRes, mentorEvalsRes, stagesRes,
      reviewSubsRes, devProjects,
      panelScoresRes, panelAssignmentsRes,
    ] = await Promise.all([
      supabase.from('teams').select('team_number, project_title, technology, batch, mentor_assigned, leader_roll'),
      supabase.from('team_members').select('team_number, roll_number'),
      supabase.from('team_certificates').select('team_number, roll_number'),
      supabase.from('team_ppts').select('team_number, uploaded_at'),
      supabase.from('attendance_logs').select('roll_number, punch_date, punch_mode'),
      supabase.from('mentor_evaluations').select('team_number, average_score'),
      supabase.from('milestone_submissions').select('team_number, status'),
      supabase.from('project_review_submissions').select('team_number, dev_api_id'),
      fetchDevProjects(),
      supabase.from('panel_scores').select('*').order('updated_at', { ascending: false }),
      supabase.from('panel_assignments').select('panel_name'),
    ])

    const teams = teamsRes.data || []
    if (teams.length === 0) {
      return Response.json({ ok: true, teams: [], summary: { total_teams: 0 }, allPanels: [] })
    }

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m.roll_number)
    })

    const certsByTeam = {}
    ;(certsRes.data || []).forEach(c => { certsByTeam[c.team_number] = (certsByTeam[c.team_number] || 0) + 1 })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => { pptByTeam[p.team_number] = !!p.uploaded_at })

    const mentorEvalByTeam = {}
    ;(mentorEvalsRes.data || []).forEach(e => {
      if (e.average_score != null) mentorEvalByTeam[e.team_number] = Number(e.average_score)
    })

    const stagesApprovedByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (s.status === 'completed') {
        stagesApprovedByTeam[s.team_number] = (stagesApprovedByTeam[s.team_number] || 0) + 1
      }
    })

    // Attendance (Option B — proportional)
    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      const d = a.punch_date
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][d]) modesByRollDate[r][d] = new Set()
      modesByRollDate[r][d].add(a.punch_mode)
    })
    const modesHitByRoll = {}
    for (const roll of Object.keys(modesByRollDate)) {
      let total = 0
      for (const date of Object.keys(modesByRollDate[roll])) total += modesByRollDate[roll][date].size
      modesHitByRoll[roll] = total
    }

    const devById = {}
    ;(devProjects || []).forEach(p => { devById[p._id] = p })
    const reviewScoreByTeam = {}
    ;(reviewSubsRes.data || []).forEach(s => {
      if (!s.dev_api_id) return
      const proj = devById[s.dev_api_id]
      if (!proj) return
      const o = computeOverallScore(proj.latestScore)
      if (o != null) reviewScoreByTeam[s.team_number] = o
    })

    // Panel scores grouped by team
    const panelScores = panelScoresRes.data || []
    const panelByTeam = {}
    for (const ps of panelScores) {
      if (!panelByTeam[ps.team_number]) panelByTeam[ps.team_number] = []
      panelByTeam[ps.team_number].push(ps)
    }

    // All known panel names (for the column header in admin view)
    const allPanelsSet = new Set()
    ;(panelAssignmentsRes.data || []).forEach(a => { if (a.panel_name) allPanelsSet.add(a.panel_name) })
    panelScores.forEach(p => { if (p.panel_name) allPanelsSet.add(p.panel_name) })
    const allPanels = Array.from(allPanelsSet).sort()

    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4
    const TOTAL_STAGES = 7
    const MAX_REVIEW = 60
    const MAX_MENTOR = 20
    const MAX_STAGES = 8
    const MAX_ATT = 6
    const MAX_CERTS = 4
    const MAX_PPT = 2
    const MAX_PANEL = 50
    const MAX_GRAND = 150

    const result = teams.map(t => {
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1

      // ── Auto-score /100 ──
      const reviewScore = reviewScoreByTeam[t.team_number]
      const reviewPoints = reviewScore != null ? round1((reviewScore / 100) * MAX_REVIEW) : 0

      const mentorEvalScore = mentorEvalByTeam[t.team_number]
      const mentorEvalPoints = mentorEvalScore != null ? round1((mentorEvalScore / 10) * MAX_MENTOR) : 0

      const stagesApproved = stagesApprovedByTeam[t.team_number] || 0
      const stagePoints = round1((stagesApproved / TOTAL_STAGES) * MAX_STAGES)

      const teamModesHit = members.reduce((sum, r) => sum + (modesHitByRoll[r.toUpperCase()] || 0), 0)
      const maxModes = memberCount * EVENT_DAYS * 4
      const attPct = maxModes > 0 ? (teamModesHit / maxModes) : 0
      const attendancePoints = round1(attPct * MAX_ATT)

      const certsUploaded = certsByTeam[t.team_number] || 0
      const certsExpected = memberCount * CERTS_PER_STUDENT
      const certsPct = certsExpected > 0 ? (certsUploaded / certsExpected) : 0
      const certPoints = round1(certsPct * MAX_CERTS)

      const pptPoints = pptByTeam[t.team_number] ? MAX_PPT : 0

      const autoScore = round1(
        safe(reviewPoints) + safe(mentorEvalPoints) + safe(stagePoints) +
        safe(attendancePoints) + safe(certPoints) + safe(pptPoints)
      )

      // ── Panel scoring (average of all panels' totals) ──
      const teamPanels = panelByTeam[t.team_number] || []
      const panelBreakdown = teamPanels.map(p => ({
        panel_name: p.panel_name,
        mentor_name: p.mentor_name,
        mentor_email: p.mentor_email,
        scores: {
          project_idea: Number(p.score_project_idea),
          ai_usage: Number(p.score_ai_usage),
          presentation: Number(p.score_presentation),
          technical: Number(p.score_technical),
          qa_defense: Number(p.score_qa_defense),
        },
        total: Number(p.total_score),
        updated_at: p.updated_at,
      }))

      const panelCount = panelBreakdown.length
      const panelSum = panelBreakdown.reduce((s, p) => s + p.total, 0)
      const panelAvg = panelCount > 0 ? round1(panelSum / panelCount) : 0  // /50

      // ── Grand total /150 ──
      const grandTotal = round1(safe(autoScore) + safe(panelAvg))

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        member_count: memberCount,

        // Auto-score subscores
        review_points: safe(reviewPoints),
        mentor_eval_points: safe(mentorEvalPoints),
        stage_points: safe(stagePoints),
        attendance_points: safe(attendancePoints),
        cert_points: safe(certPoints),
        ppt_points: safe(pptPoints),
        auto_score: safe(autoScore),  // /100

        // Panel data
        panel_count: panelCount,
        panel_breakdown: panelBreakdown,
        panel_avg: safe(panelAvg),  // /50

        // Grand total
        grand_total: safe(grandTotal),  // /150
      }
    })

    // Rank by grand_total descending
    result.sort((a, b) => b.grand_total - a.grand_total)
    result.forEach((r, idx) => { r.rank = idx + 1 })

    const summary = {
      total_teams: result.length,
      total_panels: allPanels.length,
      max_total: MAX_GRAND,
      max_auto: 100,
      max_panel: MAX_PANEL,
      teams_with_panel_scores: result.filter(r => r.panel_count > 0).length,
      avg_panel: round1(result.filter(r => r.panel_count > 0).reduce((s, r) => s + r.panel_avg, 0) / Math.max(result.filter(r => r.panel_count > 0).length, 1)),
      avg_grand: round1(result.reduce((s, r) => s + r.grand_total, 0) / Math.max(result.length, 1)),
    }

    return Response.json({ ok: true, teams: result, summary, allPanels })
  } catch (err) {
    console.error('[project-leaders] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}