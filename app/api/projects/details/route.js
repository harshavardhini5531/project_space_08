import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const teamNumber = body.teamNumber
    const serialNumber = body.serialNumber

    if (!teamNumber && !serialNumber) {
      return Response.json({ error: 'Team number or serial number required' }, { status: 400 })
    }

    // Get team info
    let teamQuery = supabase.from('teams').select('*')
    if (teamNumber) teamQuery = teamQuery.eq('team_number', teamNumber)
    else teamQuery = teamQuery.eq('serial_number', serialNumber)

    const { data: team, error: teamErr } = await teamQuery.single()

    if (teamErr || !team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // Fetch mentor details if mentor is assigned
    let mentorData = null
    if (team.mentor_assigned) {
      const { data: mentor } = await supabase
        .from('mentors')
        .select('name, email, image_url, technology, emp_id, batch')
        .eq('name', team.mentor_assigned)
        .single()
      if (mentor) mentorData = mentor
    }

    // Get registration data
    const { data: registration } = await supabase
      .from('team_registrations')
      .select('*')
      .eq('serial_number', team.serial_number)
      .single()

    // Get members from team_members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('roll_number, is_leader, short_name')
      .eq('serial_number', team.serial_number)

    // Get student details for all members
    const rollNumbers = (teamMembers || []).map(m => m.roll_number)
    let studentsMap = {}
    if (rollNumbers.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name, email, phone, branch, college, image_url, gender')
        .in('roll_number', rollNumbers)
      if (students) students.forEach(s => { studentsMap[s.roll_number] = s })
    }

    const members = (teamMembers || []).map(m => ({
      rollNumber: m.roll_number,
      shortName: m.short_name,
      isLeader: m.is_leader,
      name: studentsMap[m.roll_number]?.name || m.roll_number,
      email: studentsMap[m.roll_number]?.email || '',
      phone: studentsMap[m.roll_number]?.phone || '',
      branch: studentsMap[m.roll_number]?.branch || '',
      college: studentsMap[m.roll_number]?.college || '',
      imageUrl: studentsMap[m.roll_number]?.image_url || '',
      gender: studentsMap[m.roll_number]?.gender || ''
    })).sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1
      if (!a.isLeader && b.isLeader) return 1
      return 0
    })

    // Parse tech_stack, ai_tools, project_area, members JSON
    const parseJsonField = (v) => {
      if (!v) return []
      if (Array.isArray(v)) return v
      try { return JSON.parse(v) } catch { return [] }
    }

    return Response.json({
      success: true,
      project: {
        serialNumber: team.serial_number,
        teamNumber: team.team_number,
        technology: team.technology,
        batch: team.batch,
        registered: team.registered,
        mentor: team.mentor_assigned,
        mentorDetails: mentorData,
        leaderRoll: team.leader_roll,
        projectTitle: registration?.project_title || team.project_title || '',
        projectDescription: registration?.project_description || team.project_description || '',
        problemStatement: registration?.problem_statement || team.problem_statement || '',
        projectArea: parseJsonField(registration?.project_area),
        techStack: parseJsonField(registration?.tech_stack),
        aiUsage: registration?.ai_usage || team.ai_usage || 'No',
        aiCapabilities: registration?.ai_capabilities || '',
        aiTools: parseJsonField(registration?.ai_tools),
        registeredAt: registration?.registered_at,
        members
      }
    })

  } catch (err) {
    console.error('projects/details error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}