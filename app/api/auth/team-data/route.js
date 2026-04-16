import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // First, find which team this user belongs to (leader OR member)
    const { data: myMemberRow } = await supabase
      .from('team_members')
      .select('serial_number')
      .eq('roll_number', rollNumber)
      .single()

    if (!myMemberRow) {
      return Response.json({ error: 'You are not part of any team' }, { status: 404 })
    }

    const serialNumber = myMemberRow.serial_number

    // Get team details by serial_number
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('serial_number', serialNumber)
      .single()

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get all team members with short_name and is_leader
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

      members = (students || []).map(s => {
        const tm = teamMembers.find(m => m.roll_number === s.roll_number)
        return {
          ...s,
          is_leader: tm?.is_leader || false,
          short_name: tm?.short_name || ''
        }
      })

      // Handle members in team_members but missing from students
      const missingRolls = rolls.filter(r => !members.find(m => m.roll_number === r))
      missingRolls.forEach(roll => {
        const tm = teamMembers.find(m => m.roll_number === roll)
        members.push({
          roll_number: roll,
          name: roll,
          email: '',
          phone: '',
          branch: '',
          college: '',
          technology: team.technology,
          image_url: '',
          is_leader: tm?.is_leader || false,
          short_name: tm?.short_name || ''
        })
      })
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