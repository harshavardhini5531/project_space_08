import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = body.rollNumber?.trim().toUpperCase()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // Verify the requesting user exists and get their team
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('team_number, is_leader')
      .eq('roll_number', rollNumber)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'You are not assigned to any team' }, { status: 403 })
    }

    // Get team data
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', memberRow.team_number)
      .single()

    if (teamErr || !team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get all team members with student details
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('roll_number, is_leader')
      .eq('team_number', memberRow.team_number)

    let members = []
    if (teamMembers && teamMembers.length > 0) {
      const rolls = teamMembers.map(m => m.roll_number)
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name, email, phone, branch, college, technology')
        .in('roll_number', rolls)

      members = (students || []).map(s => ({
        ...s,
        is_leader: teamMembers.find(m => m.roll_number === s.roll_number)?.is_leader || false
      }))
    }

    return Response.json({
      success: true,
      team: {
        id: team.id,
        teamNumber: team.team_number,
        teamName: team.team_name,
        technology: team.technology,
        projectTitle: team.project_title,
        projectDescription: team.project_description,
        problemStatement: team.problem_statement,
        projectArea: team.project_area,
        aiUsage: team.ai_usage,
        aiCapabilities: team.ai_capabilities,
        aiTools: team.ai_tools,
        techStack: team.tech_stack,
        leaderRoll: team.leader_roll,
        credits: team.credits,
        registeredAt: team.registered_at
      },
      members,
      isLeader: memberRow.is_leader
    })

  } catch (err) {
    console.error('team-data error:', err)
    return Response.json({ error: 'Failed to load team data' }, { status: 500 })
  }
}