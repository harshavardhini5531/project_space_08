import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // Get team membership — use serial_number for linking
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('team_number, serial_number, is_leader')
      .eq('roll_number', rollNumber)
      .single()

    if (!memberRow || !memberRow.is_leader) {
      return Response.json({ error: 'Not a team leader' }, { status: 403 })
    }

    // Get team info — by team_number if assigned, otherwise by serial_number
    let team = null
    if (memberRow.team_number) {
      const { data } = await supabase.from('teams').select('*').eq('team_number', memberRow.team_number).single()
      team = data
    } else {
      const { data } = await supabase.from('teams').select('*').eq('serial_number', memberRow.serial_number).single()
      team = data
    }

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get all team members with student details
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('roll_number, is_leader, short_name')
      .eq('serial_number', memberRow.serial_number)

    const rolls = (teamMembers || []).map(m => m.roll_number)
    let members = []
    if (rolls.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name, email, phone, branch, college, technology, image_url')
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
        teamNumber: team.team_number || null,
        serialNumber: team.serial_number,
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
        registeredAt: team.registered_at,
        mentorAssigned: team.mentor_assigned
      },
      members,
      isLeader: memberRow.is_leader
    })

  } catch (err) {
    console.error('team-data error:', err)
    return Response.json({ error: 'Failed to load team data' }, { status: 500 })
  }
}