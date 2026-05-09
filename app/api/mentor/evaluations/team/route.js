// app/api/mentor/evaluations/team/route.js
//
// Returns full team details + existing evaluation by this mentor (if any).
// Used to pre-fill the evaluation form when editing.
//
// Method: POST
// Auth: x-mentor-token + body.mentorEmail
// Body: { mentorEmail: string, teamNumber: string }
//
// Response:
//   {
//     ok: true,
//     team: { team_number, project_title, project_description,
//             problem_statement, technology, leader_name, members, ... },
//     evaluation: { ...all 6 scores + comments } | null
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
    const { mentorEmail, teamNumber } = await request.json()
    if (!mentorEmail) {
      return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })
    }
    if (!teamNumber) {
      return Response.json({ ok: false, error: 'teamNumber required' }, { status: 400 })
    }

    // ── 3. Lookup mentor ──
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email, technology')
      .eq('email', mentorEmail)
      .single()

    if (!mentor) {
      return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })
    }

    // ── 4. Fetch team — must be assigned to this mentor ──
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('team_number, serial_number, technology, leader_roll, registered, project_title, project_description, problem_statement, ai_usage, mentor_assigned')
      .eq('team_number', teamNumber)
      .eq('mentor_assigned', mentor.name) // Authorization: must be your team
      .single()

    if (teamErr || !team) {
      return Response.json(
        { ok: false, error: 'Team not found or not assigned to you' },
        { status: 404 }
      )
    }

    // ── 5. Fetch team registration (for richer project info) ──
    const { data: registration } = await supabase
      .from('team_registrations')
      .select('project_title, project_area, tech_stack, ai_tools, ai_usage, ai_capabilities')
      .eq('serial_number', team.serial_number)
      .maybeSingle()

    // ── 6. Fetch members ──
    const { data: members } = await supabase
      .from('team_members')
      .select('roll_number, is_leader, short_name')
      .eq('serial_number', team.serial_number)
      .order('is_leader', { ascending: false })
      .order('roll_number')

    const rolls = (members || []).map(m => m.roll_number)
    const studentMap = {}
    if (rolls.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name')
        .in('roll_number', rolls)
      ;(students || []).forEach(s => {
        studentMap[s.roll_number] = s.name
      })
    }

    const enrichedMembers = (members || []).map(m => ({
      roll_number: m.roll_number,
      name: studentMap[m.roll_number] || m.short_name || '—',
      is_leader: m.is_leader,
    }))

    // ── 7. Fetch existing evaluation by this mentor ──
    const { data: evaluation } = await supabase
      .from('mentor_evaluations')
      .select('*')
      .eq('team_number', teamNumber)
      .eq('mentor_id', mentor.id)
      .maybeSingle()

    // ── 8. Build response ──
    return Response.json({
      ok: true,
      team: {
        team_number: team.team_number,
        technology: team.technology,
        registered: team.registered,
        leader_roll: team.leader_roll,
        leader_name: studentMap[team.leader_roll] || '—',
        project_title: team.project_title || registration?.project_title || '(Untitled)',
        project_description: team.project_description || '',
        problem_statement: team.problem_statement || '',
        ai_usage: team.ai_usage || registration?.ai_usage || '',
        project_area: registration?.project_area || '',
        tech_stack: registration?.tech_stack || [],
        ai_tools: registration?.ai_tools || [],
        ai_capabilities: registration?.ai_capabilities || [],
        members: enrichedMembers,
      },
      evaluation: evaluation || null,
    })
  } catch (err) {
    console.error('[mentor-eval-team] Unhandled error:', err)
    return Response.json(
      { ok: false, error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}