// app/api/admin/leaderboard/route.js
//
// Admin Leaderboard endpoint — aggregates 6 scoring sources per team into a single
// fair points total out of /150 (with 50 pts reserved for future), grand total /200.
//
// Auth: POST with { adminEmail } body; only ADMIN_EMAILS allowed.
//
// Points breakdown (all proportional / fair to team size):
//   1. Certificates    /20   = (uploaded / (members × 4)) × 20
//   2. Attendance      /30   = (sum_full_days / (members × 7)) × 30
//   3. Review Score    /30   = (latest_score / 100) × 30
//   4. Mentor Eval     /25   = (avg_score / 10) × 25
//   5. Stages          /35   = (approved / 7) × 35
//   6. PPT             /10   = 10 if uploaded else 0
//   ──────────────────────
//   Subtotal           /150
//   Reserved           /50    (TBD — column shows "—")
//   GRAND TOTAL        /200

import { supabase } from '@/lib/supabase'

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 30000

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

// ── Cache dev API response for 60s to avoid hammering on every leaderboard load ──
let devCache = { at: 0, data: null }
const DEV_TTL_MS = 60 * 1000

async function fetchDevProjects() {
  const now = Date.now()
  if (devCache.data && (now - devCache.at) < DEV_TTL_MS) {
    return devCache.data
  }
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

// Average the 5 latestScore dimensions into one 0-100 overall
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

    // ── Fetch all required tables in parallel ──
    const [
      teamsRes,
      membersRes,
      certsRes,
      pptsRes,
      attendanceRes,
      mentorEvalsRes,
      stagesRes,
      reviewSubsRes,
      devProjects,
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
      return Response.json({
        ok: true,
        teams: [],
        summary: { total: 0, max_total: 200 },
        rules: getRules(),
      })
    }

    // ── Index lookups for O(1) access ──
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
      // If multiple evaluations exist somehow, keep the latest non-null
      if (e.average_score != null) mentorEvalByTeam[e.team_number] = Number(e.average_score)
    })

    const stagesApprovedByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (s.status === 'completed') {
        stagesApprovedByTeam[s.team_number] = (stagesApprovedByTeam[s.team_number] || 0) + 1
      }
    })

    // ── Attendance: compute "full days" per student (day where they hit all 4 modes) ──
    // attendance_logs has punch_mode = 'light' | 'bright' | 'dark' | 'moon'
    const fullDaysByRoll = {}
    const modesByRollDate = {} // { ROLL: { '2026-05-06': Set('light','bright',...) } }
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      const d = a.punch_date
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][d]) modesByRollDate[r][d] = new Set()
      modesByRollDate[r][d].add(a.punch_mode)
    })
    // Tally: how many days each roll hit all 4 modes
    for (const roll of Object.keys(modesByRollDate)) {
      let fullDays = 0
      for (const date of Object.keys(modesByRollDate[roll])) {
        if (modesByRollDate[roll][date].size >= 4) fullDays++
      }
      fullDaysByRoll[roll] = fullDays
    }

    // ── Review score: map dev_api_id → submission team_number, then look up dev score ──
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

    // ── Compute points per team ──
    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4
    const TOTAL_STAGES = 7

    const result = teams.map(t => {
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1

      // 1. Certificates /20
      const certsUploaded = certsByTeam[t.team_number] || 0
      const certsExpected = memberCount * CERTS_PER_STUDENT
      const certsPct = certsExpected > 0 ? (certsUploaded / certsExpected) : 0
      const certPoints = round1(certsPct * 20)

      // 2. Attendance /30
      // Sum of all members' full-days, divided by (members × 7) max possible
      const teamFullDays = members.reduce((sum, r) => sum + (fullDaysByRoll[r.toUpperCase()] || 0), 0)
      const maxFullDays = memberCount * EVENT_DAYS
      const attPct = maxFullDays > 0 ? (teamFullDays / maxFullDays) : 0
      const attendancePoints = round1(attPct * 30)

      // 3. Review Score /30
      const reviewScore = reviewScoreByTeam[t.team_number] // 0-100 or undefined
      const reviewPoints = reviewScore != null ? round1((reviewScore / 100) * 30) : 0

      // 4. Mentor Eval /25
      const mentorScore = mentorEvalByTeam[t.team_number] // 0-10 or undefined
      const mentorPoints = mentorScore != null ? round1((mentorScore / 10) * 25) : 0

      // 5. Stages /35
      const stagesApproved = stagesApprovedByTeam[t.team_number] || 0
      const stagePoints = round1((stagesApproved / TOTAL_STAGES) * 35)

      // 6. PPT /10
      const pptPoints = pptByTeam[t.team_number] ? 10 : 0

      const subtotal = round1(certPoints + attendancePoints + reviewPoints + mentorPoints + stagePoints + pptPoints)
      const grandTotal = subtotal // reserved 50 = 0 for now

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        member_count: memberCount,

        // Raw values for transparency
        certs_uploaded: certsUploaded,
        certs_expected: certsExpected,
        attendance_full_days: teamFullDays,
        attendance_max_days: maxFullDays,
        review_score_raw: reviewScore != null ? round1(reviewScore) : null,
        mentor_score_raw: mentorScore != null ? round1(mentorScore) : null,
        stages_approved: stagesApproved,
        has_ppt: !!pptByTeam[t.team_number],

        // Computed points (rounded to 1 decimal)
        cert_points: certPoints,
        attendance_points: attendancePoints,
        review_points: reviewPoints,
        mentor_points: mentorPoints,
        stage_points: stagePoints,
        ppt_points: pptPoints,
        reserved_points: 0,

        subtotal,     // out of 150
        grand_total: grandTotal, // out of 200 (reserved excluded for now)
      }
    })

    // ── Rank by grand_total descending ──
    result.sort((a, b) => b.grand_total - a.grand_total)
    result.forEach((r, idx) => { r.rank = idx + 1 })

    // ── Summary stats ──
    const summary = {
      total_teams: result.length,
      max_total: 200,
      max_subtotal: 150,
      avg_subtotal: round1(result.reduce((s, r) => s + r.subtotal, 0) / Math.max(result.length, 1)),
      teams_with_certs: result.filter(r => r.certs_uploaded > 0).length,
      teams_with_ppt: result.filter(r => r.has_ppt).length,
      teams_with_review: result.filter(r => r.review_score_raw != null).length,
      teams_with_mentor_eval: result.filter(r => r.mentor_score_raw != null).length,
    }

    return Response.json({
      ok: true,
      teams: result,
      summary,
      rules: getRules(),
    })
  } catch (err) {
    console.error('[leaderboard] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

function getRules() {
  return [
    {
      id: 'cert', label: 'Claude Certificates', max: 20,
      formula: '(uploaded ÷ (members × 4)) × 20',
      explainer: 'Each member is expected to upload 4 Claude certificates. Points are proportional to upload completion, so all team sizes are scored fairly.',
    },
    {
      id: 'attendance', label: 'Attendance', max: 30,
      formula: '(member full-days ÷ (members × 7)) × 30',
      explainer: 'A "full day" means a member hit all 4 modes (Light, Bright, Dark, Moon) on that day. Total full-days across all members, normalized by team size × event days.',
    },
    {
      id: 'review', label: 'AI Review Score', max: 30,
      formula: '(latest_score ÷ 100) × 30',
      explainer: 'Latest AI review score (0–100) from the project-review system, averaged across 5 dimensions: problem statement, architecture, requirements, code quality, future scope.',
    },
    {
      id: 'mentor', label: 'Mentor Evaluation', max: 25,
      formula: '(mentor_score ÷ 10) × 25',
      explainer: 'Mentor\'s evaluation score (0–10) — average of 6 sub-scores: innovation, technical, UI/UX, relevance, demo, documentation.',
    },
    {
      id: 'stages', label: 'Project Stages', max: 35,
      formula: '(approved stages ÷ 7) × 35',
      explainer: 'Number of completed milestone stages (out of 7). Only stages with status "completed" count.',
    },
    {
      id: 'ppt', label: 'PPT Submission', max: 10,
      formula: '10 if uploaded else 0',
      explainer: 'Binary — full points if team has submitted their project PPT, else 0.',
    },
    {
      id: 'reserved', label: 'Reserved', max: 50,
      formula: 'TBD',
      explainer: 'Reserved for additional scoring criteria to be added later.',
    },
  ]
}