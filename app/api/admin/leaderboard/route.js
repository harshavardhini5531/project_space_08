// app/api/admin/leaderboard/route.js
//
// Admin Leaderboard endpoint — aggregates 6 scoring sources per team into a
// weighted total out of /100.
//
// SCORING (total 100):
//   AI Review Score     60   = (latest_score / 100) × 60       — 60% weight
//   Mentor Evaluation   20   = (mentor_score / 10) × 20        — 20% weight
//   ─── Remaining 20% split fairly: ───
//   Stages               8   = (approved / 7) × 8
//   Attendance           6   = (full_days / (members × 7)) × 6
//   Certificates         4   = (uploaded / (members × 4)) × 4
//   PPT                  2   = 2 if uploaded else 0
//   ──────────────────────────
//   TOTAL              100

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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const r = await fetch(`${DEV_API_BASE}/api/projects`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return []
    const d = await r.json()
    const projects = Array.isArray(d?.data) ? d.data : []
    devCache = { at: now, data: projects }
    return projects
  } catch (e) {
    console.error('[leaderboard] dev API fetch failed:', e.message)
    return devCache.data || []
  }
}

function computeOverallScore(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const round1 = n => n == null ? null : Math.round(n * 10) / 10

export async function POST(request) {
  try {
    const { adminEmail } = await request.json().catch(() => ({}))
    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [
      teamsRes, membersRes, certsRes, pptsRes,
      attendanceRes, mentorEvalsRes, stagesRes,
      reviewSubsRes, devProjects,
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
    ])

    const teams = teamsRes.data || []
    if (teams.length === 0) {
      return Response.json({ ok: true, teams: [], summary: { total_teams: 0, max_total: 100 }, rules: getRules() })
    }

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m.roll_number)
    })

    const certsByTeam = {}
    ;(certsRes.data || []).forEach(c => {
      certsByTeam[c.team_number] = (certsByTeam[c.team_number] || 0) + 1
    })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => {
      pptByTeam[p.team_number] = !!p.uploaded_at
    })

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

    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      const d = a.punch_date
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][d]) modesByRollDate[r][d] = new Set()
      modesByRollDate[r][d].add(a.punch_mode)
    })
    // OPTION B — proportional: count distinct modes hit per day per student
    const modesHitByRoll = {}
    for (const roll of Object.keys(modesByRollDate)) {
      let totalModes = 0
      for (const date of Object.keys(modesByRollDate[roll])) {
        totalModes += modesByRollDate[roll][date].size
      }
      modesHitByRoll[roll] = totalModes
    }

    const devById = {}
    ;(devProjects || []).forEach(p => { devById[p._id] = p })
    const reviewScoreByTeam = {}
    ;(reviewSubsRes.data || []).forEach(s => {
      if (!s.dev_api_id) return
      const proj = devById[s.dev_api_id]
      if (!proj) return
      const overall = computeOverallScore(proj.latestScore)
      if (overall != null) reviewScoreByTeam[s.team_number] = overall
    })

    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4
    const TOTAL_STAGES = 7
    const MAX_REVIEW = 60
    const MAX_MENTOR = 20
    const MAX_STAGES = 8
    const MAX_ATT = 6
    const MAX_CERTS = 4
    const MAX_PPT = 2

    const result = teams.map(t => {
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1

      const reviewScore = reviewScoreByTeam[t.team_number]
      const reviewPoints = reviewScore != null ? round1((reviewScore / 100) * MAX_REVIEW) : 0

      const mentorScore = mentorEvalByTeam[t.team_number]
      const mentorPoints = mentorScore != null ? round1((mentorScore / 10) * MAX_MENTOR) : 0

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

      const grandTotal = round1(reviewPoints + mentorPoints + stagePoints + attendancePoints + certPoints + pptPoints)

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        member_count: memberCount,
        certs_uploaded: certsUploaded,
        certs_expected: certsExpected,
        attendance_full_days: teamModesHit,
        attendance_max_days: maxModes,
        review_score_raw: reviewScore != null ? round1(reviewScore) : null,
        mentor_score_raw: mentorScore != null ? round1(mentorScore) : null,
        stages_approved: stagesApproved,
        has_ppt: !!pptByTeam[t.team_number],
        review_points: reviewPoints,
        mentor_points: mentorPoints,
        stage_points: stagePoints,
        attendance_points: attendancePoints,
        cert_points: certPoints,
        ppt_points: pptPoints,
        grand_total: grandTotal,
      }
    })

    result.sort((a, b) => b.grand_total - a.grand_total)
    result.forEach((r, idx) => { r.rank = idx + 1 })

    const summary = {
      total_teams: result.length,
      max_total: 100,
      avg_total: round1(result.reduce((s, r) => s + r.grand_total, 0) / Math.max(result.length, 1)),
      teams_with_certs: result.filter(r => r.certs_uploaded > 0).length,
      teams_with_ppt: result.filter(r => r.has_ppt).length,
      teams_with_review: result.filter(r => r.review_score_raw != null).length,
      teams_with_mentor_eval: result.filter(r => r.mentor_score_raw != null).length,
    }

    return Response.json({ ok: true, teams: result, summary, rules: getRules() })
  } catch (err) {
    console.error('[leaderboard] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

function getRules() {
  return [
    {
      id: 'review', label: 'AI Review Score', max: 60, weight: '60%',
      formula: '(latest_score ÷ 100) × 60',
      explainer: 'Largest weight. Latest AI review score (0–100), averaged across 5 dimensions: problem statement, architecture, requirements, code quality, future scope.',
    },
    {
      id: 'mentor', label: 'Mentor Evaluation', max: 20, weight: '20%',
      formula: '(mentor_score ÷ 10) × 20',
      explainer: 'Mentor\'s evaluation score (0–10) — average of 6 sub-scores: innovation, technical, UI/UX, relevance, demo, documentation.',
    },
    {
      id: 'stages', label: 'Project Stages', max: 8, weight: '8%',
      formula: '(approved ÷ 7) × 8',
      explainer: 'Number of milestone stages with status "completed" (out of 7).',
    },
    {
      id: 'attendance', label: 'Attendance', max: 6, weight: '6%',
      formula: '(modes hit ÷ (members × 7 × 4)) × 6',
      explainer: 'Each mode punched counts proportionally. A day where the member hit 2 of 4 modes = 2 mode-points (not zero). Max = members × 7 days × 4 modes.',
    },
    {
      id: 'cert', label: 'Claude Certificates', max: 4, weight: '4%',
      formula: '(uploaded ÷ (members × 4)) × 4',
      explainer: 'Each member uploads 4 Claude certs (agent_skills, api, mcp, code_in_action). Proportional to completion.',
    },
    {
      id: 'ppt', label: 'PPT Submission', max: 2, weight: '2%',
      formula: '2 if uploaded else 0',
      explainer: 'Binary — full points if team has submitted PPT, else 0.',
    },
  ]
}