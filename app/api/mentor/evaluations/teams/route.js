// app/api/mentor/evaluations/teams/route.js
//
// Returns list of teams assigned to the authenticated mentor,
// each annotated with their evaluation status + project review submission data.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { mentorEmail } = await request.json()
    if (!mentorEmail) {
      return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })
    }

    const { data: mentor, error: mentorErr } = await supabase
      .from('mentors')
      .select('id, name, email, technology')
      .eq('email', mentorEmail)
      .single()

    if (mentorErr || !mentor) {
      return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })
    }

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

    const teamNumbers = teams.map(t => t.team_number)

    // Pending edit requests per team
    const { data: pendingEdits } = await supabase
      .from('project_review_edit_requests')
      .select('team_number')
      .in('team_number', teamNumbers)
      .eq('status', 'pending')
    const pendingEditMap = {}
    ;(pendingEdits || []).forEach(r => {
      pendingEditMap[r.team_number] = (pendingEditMap[r.team_number] || 0) + 1
    })

    // Mentor's own evaluations
    const { data: evaluations } = await supabase
      .from('mentor_evaluations')
      .select('team_number, average_score, created_at, updated_at')
      .eq('mentor_id', mentor.id)
      .in('team_number', teamNumbers)

    const evalMap = {}
    ;(evaluations || []).forEach(e => { evalMap[e.team_number] = e })

    // Project review submissions — ALL fields needed for "View Documentation" modal
    const { data: submissions } = await supabase
      .from('project_review_submissions')
      .select(`
        team_number,
        name,
        github_url,
        description,
        requirements,
        problem_statement,
        proposed_solution,
        technologies_used,
        system_architecture,
        in_scope,
        out_scope,
        future_enhancements,
        conclusion,
        project_type,
        status,
        submitted_at,
        submitted_by_name
      `)
      .in('team_number', teamNumbers)

    const submissionMap = {}
    ;(submissions || []).forEach(s => {
      // Keep latest per team if duplicates
      if (!submissionMap[s.team_number] ||
          new Date(s.submitted_at) > new Date(submissionMap[s.team_number].submitted_at)) {
        submissionMap[s.team_number] = s
      }
    })

    // Leader names
    const leaderRolls = teams.map(t => t.leader_roll).filter(Boolean)
    const studentMap = {}
    if (leaderRolls.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name')
        .in('roll_number', leaderRolls)
      ;(students || []).forEach(s => { studentMap[s.roll_number] = s.name })
    }

    const enrichedTeams = teams.map(t => {
      const ev = evalMap[t.team_number]
      const sub = submissionMap[t.team_number]
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
        pending_edit_requests: pendingEditMap[t.team_number] || 0,
        // Project review submission (null if team hasn't submitted)
        submission: sub ? {
          name: sub.name,
          github_url: sub.github_url,
          description: sub.description,
          requirements: sub.requirements,
          problem_statement: sub.problem_statement,
          proposed_solution: sub.proposed_solution,
          technologies_used: sub.technologies_used || [],
          system_architecture: sub.system_architecture,
          in_scope: sub.in_scope,
          out_scope: sub.out_scope,
          future_enhancements: sub.future_enhancements,
          conclusion: sub.conclusion,
          project_type: sub.project_type,
          status: sub.status,
          submitted_at: sub.submitted_at,
          submitted_by_name: sub.submitted_by_name,
        } : null,
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