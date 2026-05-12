// app/api/mentor/leaderboard/route.js
//
// Mentor Leaderboard endpoint — same scoring formula as admin route, but:
//   • Auth by mentor email (verified against `mentors` table, must be active)
//   • Teams filtered to mentor's `technology` only
//   • Mentor sees ALL teams in their tech (not just teams they personally mentor)
//
// Same /100 scoring as admin:
//   AI Review Score 60 + Mentor Eval 20 + Stages 8 + Attendance 6 + Certs 4 + PPT 2

import { supabase } from '@/lib/supabase'

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 30000

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
    console.error('[mentor leaderboard] dev API fetch failed:', e.message)
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
    const { mentorEmail } = await request.json().catch(() => ({}))
    if (!mentorEmail || typeof mentorEmail !== 'string') {
      return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })
    }

    // ── Verify mentor & get their technology ──
    const { data: mentor, error: mErr } = await supabase
      .from('mentors')
      .select('id, name, email, technology, is_active')
      .eq('email', mentorEmail.toLowerCase())
      .maybeSingle()

    if (mErr || !mentor) {
      return Response.json({ ok: false, error: 'Mentor not found' }, { status: 401 })
    }
    if (mentor.is_active === false) {
      return Response.json({ ok: false, error: 'Mentor account is inactive' }, { status: 403 })
    }
    if (!mentor.technology) {
      return Response.json({ ok: false, error: 'No technology assigned to this mentor' }, { status: 403 })
    }

    const tech = mentor.technology

    // ── Fetch all data in parallel (same as admin) ──
    const [
      teamsRes, membersRes, certsRes, pptsRes,
      attendanceRes, mentorEvalsRes, stagesRes,
      reviewSubsRes, devProjects,
    ] = await Promise.all([
      supabase.from('teams')
        .select('team_number, project_title, technology, batch, mentor_assigned, leader_roll')
        .eq('technology', tech),
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
      return Response.json({
        ok: true,
        mentor: { name: mentor.name, technology: tech },
        teams: [],
        summary: { total_teams: 0, max_total: 100, technology: tech },
        rules: getRules(),
      })
    }

    const teamNumbers = new Set(teams.map(t => t.team_number))

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!teamNumbers.has(m.team_number)) return
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m.roll_number)
    })

    const certsByTeam = {}
    ;(certsRes.data || []).forEach(c => {
      if (!teamNumbers.has(c.team_number)) return
      certsByTeam[c.team_number] = (certsByTeam[c.team_number] || 0) + 1
    })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => {
      if (!teamNumbers.has(p.team_number)) return
      pptByTeam[p.team_number] = !!p.uploaded_at
    })

    const mentorEvalByTeam = {}
    ;(mentorEvalsRes.data || []).forEach(e => {
      if (!teamNumbers.has(e.team_number)) return
      if (e.average_score != null) mentorEvalByTeam[e.team_number] = Number(e.average_score)
    })

    const stagesApprovedByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (!teamNumbers.has(s.team_number)) return
      if (s.status === 'completed') {
        stagesApprovedByTeam[s.team_number] = (stagesApprovedByTeam[s.team_number] || 0) + 1
      }
    })

    // ── Attendance: only for rolls in our filtered teams ──
    const rollsToTrack = new Set()
    Object.values(membersByTeam).forEach(arr => arr.forEach(r => rollsToTrack.add(r.toUpperCase())))

    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      if (!rollsToTrack.has(r)) return
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
      if (!teamNumbers.has(s.team_number)) return
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

      // OPTION B: sum modes hit across members, divide by max possible (members × 7 × 4)
      const teamModesHit = members.reduce((sum, r) => sum + (modesHitByRoll[r.toUpperCase()] || 0), 0)
      const maxModes = memberCount * EVENT_DAYS * 4
      const attPct = maxModes > 0 ? (teamModesHit / maxModes) : 0
      const attendancePoints = round1(attPct * MAX_ATT)

      const certsUploaded = certsByTeam[t.team_number] || 0
      const certsExpected = memberCount * CERTS_PER_STUDENT
      const certsPct = certsExpected > 0 ? (certsUploaded / certsExpected) : 0
      const certPoints = round1(certsPct * MAX_CERTS)

      const pptPoints = pptByTeam[t.team_number] ? MAX_PPT : 0

      const grandTotal = round1(
        safe(reviewPoints) + safe(mentorPoints) + safe(stagePoints) +
        safe(attendancePoints) + safe(certPoints) + safe(pptPoints)
      )

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
        review_points: safe(reviewPoints),
        mentor_points: safe(mentorPoints),
        stage_points: safe(stagePoints),
        attendance_points: safe(attendancePoints),
        cert_points: safe(certPoints),
        ppt_points: safe(pptPoints),
        grand_total: safe(grandTotal),
      }
    })

    result.sort((a, b) => b.grand_total - a.grand_total)
    result.forEach((r, idx) => { r.rank = idx + 1 })

    const summary = {
      total_teams: result.length,
      max_total: 100,
      technology: tech,
      avg_total: round1(result.reduce((s, r) => s + r.grand_total, 0) / Math.max(result.length, 1)),
      teams_with_certs: result.filter(r => r.certs_uploaded > 0).length,
      teams_with_ppt: result.filter(r => r.has_ppt).length,
      teams_with_review: result.filter(r => r.review_score_raw != null).length,
      teams_with_mentor_eval: result.filter(r => r.mentor_score_raw != null).length,
    }

    return Response.json({
      ok: true,
      mentor: { name: mentor.name, technology: tech },
      teams: result,
      summary,
      rules: getRules(),
    })
  } catch (err) {
    console.error('[mentor leaderboard] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

function getRules() {
  return [
    {
      id: 'review', label: 'AI Review Score', max: 60, weight: '60%',
      formula: '(latest_score ÷ 100) × 60',
      explainer: 'Largest weight. Latest AI review score (0–100), averaged across 5 dimensions.',
    },
    {
      id: 'mentor', label: 'Mentor Evaluation', max: 20, weight: '20%',
      formula: '(mentor_score ÷ 10) × 20',
      explainer: 'Mentor\'s evaluation score (0–10) — average of 6 sub-scores.',
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
      explainer: 'Each member uploads 4 Claude certs. Proportional to completion.',
    },
    {
      id: 'ppt', label: 'PPT Submission', max: 2, weight: '2%',
      formula: '2 if uploaded else 0',
      explainer: 'Binary — full points if team has submitted PPT, else 0.',
    },
  ]
}