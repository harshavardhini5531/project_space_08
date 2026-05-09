// app/api/mentor/evaluations/teams/route.js
//
// Returns list of teams assigned to the authenticated mentor,
// each annotated with their evaluation status (submitted or pending).
//
// Method: POST (follows existing mentor API pattern)
// Auth: x-mentor-token header + body.mentorEmail
// Body: { mentorEmail: string }
//
// Response:
//   {
//     ok: true,
//     mentor: { id, name, email, technology },
//     stats: { total, evaluated, pending },
//     teams: [
//       { team_number, project_title, leader_roll, leader_name,
//         technology, evaluated, average_score, evaluated_at }
//     ]
//   }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    // ── 1. Auth ──
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Parse body ──
    const { mentorEmail } = await request.json()
    if (!mentorEmail) {
      return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })
    }

    // ── 3. Lookup mentor ──
    const { data: mentor, error: mentorErr } = await supabase
      .from('mentors')
      .select('id, name, email, technology')
      .eq('email', mentorEmail)
      .single()

    if (mentorErr || !mentor) {
      return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })
    }

    // ── 4. Fetch assigned teams ──
    const { data: teamsData, error: teamsErr } = await supabase
      .from('teams')
      .select('team_number, technology, leader_roll, project_title, project_description, registered')
      .eq('mentor_assigned', mentor.name)
      .order('team_number')

    if (teamsErr) {
      console.error('[mentor-eval-teams] Teams query error:', teamsErr)
      return Response.json(
        { ok: false, error: 'Failed to fetch teams', detail: teamsErr.message },
        { status: 500 }
      )
    }

    const teams = teamsData || []

    if (teams.length === 0) {
      return Response.json({
        ok: true,
        mentor,
        stats: { total: 0, evaluated: 0, pending: 0 },
        teams: [],
      })
    }

    // ── 5. Fetch existing evaluations by this mentor for these teams ──
    const teamNumbers = teams.map(t => t.team_number)
    const { data: evaluations } = await supabase
      .from('mentor_evaluations')
      .select('team_number, average_score, created_at, updated_at')
      .eq('mentor_id', mentor.id)
      .in('team_number', teamNumbers)

    const evalMap = {}
    ;(evaluations || []).forEach(e => {
      evalMap[e.team_number] = e
    })

    // ── 6. Fetch leader names ──
    const leaderRolls = teams.map(t => t.leader_roll).filter(Boolean)
    const studentMap = {}
    if (leaderRolls.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name')
        .in('roll_number', leaderRolls)
      ;(students || []).forEach(s => {
        studentMap[s.roll_number] = s.name
      })
    }

    // ── 7. Build response ──
    const enrichedTeams = teams.map(t => {
      const ev = evalMap[t.team_number]
      return {
        team_number: t.team_number,
        project_title: t.project_title || '(Untitled)',
        project_description: t.project_description || '',
        technology: t.technology,
        leader_roll: t.leader_roll,
        leader_name: studentMap[t.leader_roll] || '—',
        registered: t.registered,
        evaluated: !!ev,
        average_score: ev?.average_score ?? null,
        evaluated_at: ev?.updated_at ?? ev?.created_at ?? null,
      }
    })

    const stats = {
      total: enrichedTeams.length,
      evaluated: enrichedTeams.filter(t => t.evaluated).length,
      pending: enrichedTeams.filter(t => !t.evaluated).length,
    }

    return Response.json({
      ok: true,
      mentor,
      stats,
      teams: enrichedTeams,
    })
  } catch (err) {
    console.error('[mentor-eval-teams] Unhandled error:', err)
    return Response.json(
      { ok: false, error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}