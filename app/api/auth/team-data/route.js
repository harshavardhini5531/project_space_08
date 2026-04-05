import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // Get team directly by leader roll number
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('leader_roll', rollNumber)
      .single()

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    const serialNumber = team.serial_number

    // Get all team members with student details
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('roll_number, is_leader, short_name')
      .eq('serial_number', serialNumber)

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
        aiUsage: team.ai_usage,
        leaderRoll: team.leader_roll,
        registered: team.registered,
        mentorAssigned: team.mentor_assigned
      },
      members,
      isLeader: team.leader_roll === rollNumber
    })

  } catch (err) {
    console.error('team-data error:', err)
    return Response.json({ error: 'Failed to load team data' }, { status: 500 })
  }
}