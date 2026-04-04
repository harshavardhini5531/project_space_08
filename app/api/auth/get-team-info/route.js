import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // Get team membership — verify this is a leader
    const { data: memberRow, error: memberErr } = await supabase
      .from('team_members')
      .select('serial_number, is_leader')
      .eq('roll_number', rollNumber)
      .single()

    if (memberErr || !memberRow) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    if (!memberRow.is_leader) {
      return Response.json({ error: 'Only team leaders can fetch info' }, { status: 403 })
    }

    // Get team info with project data from teams table
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('serial_number, technology, leader_roll, mentor_assigned, team_number, registered, project_title, project_description, problem_statement, ai_usage')
      .eq('serial_number', memberRow.serial_number)
      .single()

    if (teamErr || !team) {
      return Response.json({ error: 'Team data not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      team: {
        serialNumber: team.serial_number,
        technology: team.technology,
        leaderRoll: team.leader_roll,
        mentorAssigned: team.mentor_assigned,
        teamNumber: team.team_number,
        registered: team.registered,
        projectTitle: team.project_title || '',
        projectDescription: team.project_description || '',
        problemStatement: team.problem_statement || '',
        aiUsage: team.ai_usage || 'No',
      }
    })

  } catch (err) {
    console.error('get-team-info error:', err)
    return Response.json({ error: 'Failed to fetch team info' }, { status: 500 })
  }
}