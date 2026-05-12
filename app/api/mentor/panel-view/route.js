// app/api/mentor/panel-view/route.js
//
// Mentor Panel View endpoint — read-only rich detail for ALL finalist teams.
// Used by the "Panel View" tab in mentor dashboard (panelists only).
//
// Returns per-team: project docs, AI review score + dimensions, mentor evaluation,
// project stages with comments, attendance summary, claude certs count, PPT, github.

import { supabase } from '@/lib/supabase'

const FINALIST_TEAMS = ['PS-002', 'PS-007', 'PS-008', 'PS-012', 'PS-014', 'PS-016', 'PS-018', 'PS-022', 'PS-024', 'PS-027', 'PS-028', 'PS-032', 'PS-033', 'PS-034', 'PS-035', 'PS-036', 'PS-039', 'PS-040', 'PS-045', 'PS-047', 'PS-048', 'PS-050', 'PS-052', 'PS-054', 'PS-055', 'PS-057', 'PS-061', 'PS-065', 'PS-079', 'PS-081', 'PS-089', 'PS-103', 'PS-107', 'PS-109', 'PS-112', 'PS-113', 'PS-115', 'PS-119', 'PS-120', 'PS-130', 'PS-131', 'PS-132', 'PS-133', 'PS-134', 'PS-135', 'PS-139', 'PS-142', 'PS-144', 'PS-147', 'PS-149', 'PS-154']

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 25000

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
    console.error('[panel-view] dev API fetch failed:', e.message)
    return devCache.data || []
  }
}

function computeOverallScore(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

async function verifyPanelMentor(mentorEmail) {
  if (!mentorEmail) return { ok: false, error: 'mentorEmail required', status: 400 }
  const email = String(mentorEmail).toLowerCase().trim()

  const { data: mentor } = await supabase
    .from('mentors')
    .select('id, name, email, technology, is_active')
    .eq('email', email)
    .maybeSingle()
  if (!mentor) return { ok: false, error: 'Mentor not found', status: 401 }
  if (mentor.is_active === false) return { ok: false, error: 'Mentor inactive', status: 403 }

  const { data: assignment } = await supabase
    .from('panel_assignments')
    .select('id, panel_name, is_active')
    .eq('mentor_email', email)
    .maybeSingle()
  if (!assignment || assignment.is_active === false) {
    return { ok: false, error: 'You are not assigned to a panel. Contact admin.', status: 403 }
  }

  return { ok: true, mentor, panel: assignment }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorEmail = searchParams.get('mentorEmail')

    const verify = await verifyPanelMentor(mentorEmail)
    if (!verify.ok) return Response.json({ ok: false, error: verify.error }, { status: verify.status })

    const { mentor, panel } = verify

    // Fetch all data in parallel
    const [
      teamsRes, submissionsRes, membersRes,
      stagesRes, mentorEvalsRes, certsRes, pptsRes,
      attendanceRes, reviewSubsRes, panelScoresRes, devProjects,
    ] = await Promise.all([
      supabase.from('teams')
        .select('team_number, project_title, technology, batch, mentor_assigned, leader_roll')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('project_review_submissions')
        .select('*')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('team_members')
        .select('team_number, roll_number, short_name, is_leader')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('milestone_submissions')
        .select('team_number, stage_number, status, mentor_comment, submitted_at, reviewed_at, reviewed_by_name, credits_earned')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('mentor_evaluations')
        .select('*')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('team_certificates')
        .select('team_number, roll_number, cert_type')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('team_ppts')
        .select('team_number, file_name, storage_path, uploaded_at, uploaded_by_name')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('attendance_logs')
        .select('roll_number, punch_date, punch_mode'),
      supabase.from('project_review_submissions')
        .select('team_number, dev_api_id')
        .in('team_number', FINALIST_TEAMS),
      supabase.from('panel_scores')
        .select('team_number, mentor_email, total_score'),
      fetchDevProjects(),
    ])

    const teams = teamsRes.data || []
    if (teams.length === 0) {
      return Response.json({
        ok: true,
        mentor: { name: mentor.name, technology: mentor.technology },
        panel: { name: panel.panel_name },
        teams: [],
        summary: { total_finalists: 0 },
      })
    }

    // ── Build indexes ──
    const submissionsByTeam = {}
    ;(submissionsRes.data || []).forEach(s => { submissionsByTeam[s.team_number] = s })

    const membersByTeam = {}
    ;(membersRes.data || []).forEach(m => {
      if (!membersByTeam[m.team_number]) membersByTeam[m.team_number] = []
      membersByTeam[m.team_number].push(m)
    })

    const stagesByTeam = {}
    ;(stagesRes.data || []).forEach(s => {
      if (!stagesByTeam[s.team_number]) stagesByTeam[s.team_number] = []
      stagesByTeam[s.team_number].push(s)
    })

    const mentorEvalByTeam = {}
    ;(mentorEvalsRes.data || []).forEach(e => { mentorEvalByTeam[e.team_number] = e })

    const certsByTeamRoll = {}
    ;(certsRes.data || []).forEach(c => {
      if (!certsByTeamRoll[c.team_number]) certsByTeamRoll[c.team_number] = {}
      if (!certsByTeamRoll[c.team_number][c.roll_number]) certsByTeamRoll[c.team_number][c.roll_number] = new Set()
      certsByTeamRoll[c.team_number][c.roll_number].add(c.cert_type)
    })

    const pptByTeam = {}
    ;(pptsRes.data || []).forEach(p => { pptByTeam[p.team_number] = p })

    // Build dev API map
    const devById = {}
    ;(devProjects || []).forEach(p => { devById[p._id] = p })

    const devApiIdByTeam = {}
    ;(reviewSubsRes.data || []).forEach(s => {
      if (s.dev_api_id) devApiIdByTeam[s.team_number] = s.dev_api_id
    })

    // Attendance: only rolls for finalist teams
    const rollsToTrack = new Set()
    Object.values(membersByTeam).forEach(arr => arr.forEach(m => rollsToTrack.add(m.roll_number.toUpperCase())))

    const modesByRollDate = {}
    ;(attendanceRes.data || []).forEach(a => {
      if (!a.roll_number || !a.punch_date || !a.punch_mode) return
      const r = a.roll_number.toUpperCase()
      if (!rollsToTrack.has(r)) return
      if (!modesByRollDate[r]) modesByRollDate[r] = {}
      if (!modesByRollDate[r][a.punch_date]) modesByRollDate[r][a.punch_date] = new Set()
      modesByRollDate[r][a.punch_date].add(a.punch_mode)
    })

    const modesHitByRoll = {}
    for (const roll of Object.keys(modesByRollDate)) {
      let total = 0
      for (const date of Object.keys(modesByRollDate[roll])) total += modesByRollDate[roll][date].size
      modesHitByRoll[roll] = total
    }

    // Panel scoring stats per team (from all mentors)
    const panelStatsByTeam = {}
    ;(panelScoresRes.data || []).forEach(ps => {
      if (!panelStatsByTeam[ps.team_number]) panelStatsByTeam[ps.team_number] = { count: 0, total: 0 }
      panelStatsByTeam[ps.team_number].count += 1
      panelStatsByTeam[ps.team_number].total += Number(ps.total_score)
    })

    // Did THIS mentor score this team?
    const myScoredTeams = new Set()
    ;(panelScoresRes.data || [])
      .filter(ps => ps.mentor_email === mentor.email.toLowerCase())
      .forEach(ps => myScoredTeams.add(ps.team_number))

    // ── Build result ──
    const EVENT_DAYS = 7
    const CERTS_PER_STUDENT = 4

    const result = teams.map(t => {
      const submission = submissionsByTeam[t.team_number] || {}
      const members = membersByTeam[t.team_number] || []
      const memberCount = members.length || 1
      const leader = members.find(m => m.is_leader) || members[0]

      // Project stages
      const stages = stagesByTeam[t.team_number] || []
      const stageMap = {}
      for (let i = 1; i <= 7; i++) stageMap[i] = null
      stages.forEach(s => {
        if (s.stage_number >= 1 && s.stage_number <= 7) stageMap[s.stage_number] = s
      })
      const stagesCompleted = stages.filter(s => s.status === 'completed').length

      // AI review
      const devApiId = devApiIdByTeam[t.team_number]
      const devProj = devApiId ? devById[devApiId] : null
      const aiScore = devProj ? computeOverallScore(devProj.latestScore) : null
      const aiDimensions = devProj?.latestScore || null
      const aiFeedback = devProj?.latestReview || null

      // Mentor eval
      const mentorEval = mentorEvalByTeam[t.team_number] || null

      // Attendance summary (team-level)
      const teamMembersAttendance = members.map(m => {
        const roll = m.roll_number.toUpperCase()
        const modes = modesHitByRoll[roll] || 0
        const maxModes = EVENT_DAYS * 4
        return {
          roll: m.roll_number,
          short_name: m.short_name,
          is_leader: m.is_leader,
          modes_hit: modes,
          max_modes: maxModes,
          pct: maxModes > 0 ? Math.round((modes / maxModes) * 100) : 0,
        }
      })
      const teamTotalModes = teamMembersAttendance.reduce((s, m) => s + m.modes_hit, 0)
      const teamMaxModes = memberCount * EVENT_DAYS * 4

      // Certs summary
      const teamMembersCerts = members.map(m => {
        const types = certsByTeamRoll[t.team_number]?.[m.roll_number] || new Set()
        return {
          roll: m.roll_number,
          short_name: m.short_name,
          uploaded: types.size,
          max: CERTS_PER_STUDENT,
          types: Array.from(types),
        }
      })
      const totalCerts = teamMembersCerts.reduce((s, c) => s + c.uploaded, 0)
      const maxCerts = memberCount * CERTS_PER_STUDENT

      // Panel scoring stats
      const panelStats = panelStatsByTeam[t.team_number] || { count: 0, total: 0 }
      const panelAvg = panelStats.count > 0 ? Math.round((panelStats.total / panelStats.count) * 10) / 10 : null

      // PPT
      const ppt = pptByTeam[t.team_number]

      return {
        team_number: t.team_number,
        project_title: t.project_title || '—',
        technology: t.technology || '—',
        batch: t.batch || '—',
        mentor: t.mentor_assigned || '—',
        leader: leader ? { roll: leader.roll_number, short_name: leader.short_name } : null,
        members: members.map(m => ({ roll: m.roll_number, short_name: m.short_name, is_leader: m.is_leader })),
        member_count: memberCount,

        // Project documentation
        documentation: {
          name: submission.name || t.project_title,
          description: submission.description || null,
          problem_statement: submission.problem_statement || null,
          proposed_solution: submission.proposed_solution || null,
          requirements: submission.requirements || null,
          technologies_used: submission.technologies_used || null,
          system_architecture: submission.system_architecture || null,
          in_scope: submission.in_scope || null,
          out_scope: submission.out_scope || null,
          future_enhancements: submission.future_enhancements || null,
          conclusion: submission.conclusion || null,
          github_url: submission.github_url || null,
          submitted_at: submission.submitted_at || null,
        },

        // AI analysis
        ai_review: {
          score: aiScore,
          dimensions: aiDimensions,
          feedback: aiFeedback,
          has_data: !!devProj,
          status: submission.status || null,
        },

        // Mentor evaluation
        mentor_evaluation: mentorEval ? {
          mentor_name: mentorEval.mentor_name,
          average: Number(mentorEval.average_score),
          innovation: Number(mentorEval.innovation_score),
          technical: Number(mentorEval.technical_score),
          uiux: Number(mentorEval.uiux_score),
          relevance: Number(mentorEval.relevance_score),
          demo: Number(mentorEval.demo_score),
          documentation: Number(mentorEval.documentation_score),
          comments: mentorEval.comments || null,
          updated_at: mentorEval.updated_at,
        } : null,

        // Project stages
        stages: Object.entries(stageMap).map(([num, s]) => ({
          stage_number: Number(num),
          status: s?.status || 'not_started',
          mentor_comment: s?.mentor_comment || null,
          submitted_at: s?.submitted_at || null,
          reviewed_at: s?.reviewed_at || null,
          reviewed_by: s?.reviewed_by_name || null,
          credits_earned: s?.credits_earned || 0,
        })),
        stages_completed: stagesCompleted,
        stages_total: 7,

        // Attendance
        attendance: {
          members: teamMembersAttendance,
          total_modes: teamTotalModes,
          max_modes: teamMaxModes,
          pct: teamMaxModes > 0 ? Math.round((teamTotalModes / teamMaxModes) * 100) : 0,
        },

        // Claude Certificates
        certificates: {
          members: teamMembersCerts,
          total: totalCerts,
          max: maxCerts,
          pct: maxCerts > 0 ? Math.round((totalCerts / maxCerts) * 100) : 0,
        },

        // PPT
        ppt: ppt ? {
          file_name: ppt.file_name,
          storage_path: ppt.storage_path,
          uploaded_at: ppt.uploaded_at,
          uploaded_by: ppt.uploaded_by_name,
        } : null,

        // Panel scoring
        panel_stats: {
          mentor_count: panelStats.count,
          avg_score: panelAvg,
          i_scored: myScoredTeams.has(t.team_number),
        },
      }
    })

    // Sort by team number
    result.sort((a, b) => a.team_number.localeCompare(b.team_number))

    const summary = {
      total_finalists: result.length,
      with_ai_score: result.filter(r => r.ai_review.score != null).length,
      with_mentor_eval: result.filter(r => r.mentor_evaluation).length,
      with_ppt: result.filter(r => r.ppt).length,
      i_scored: result.filter(r => r.panel_stats.i_scored).length,
    }

    return Response.json({
      ok: true,
      mentor: { name: mentor.name, technology: mentor.technology, email: mentor.email },
      panel: { name: panel.panel_name },
      teams: result,
      summary,
    })
  } catch (err) {
    console.error('[mentor/panel-view] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}