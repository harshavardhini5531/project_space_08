import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { mentorEmail } = await request.json()
    const token = request.headers.get('x-mentor-token')

    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!mentorEmail) return Response.json({ error: 'Email required' }, { status: 400 })

    // Get mentor info
    const { data: mentor } = await supabase
      .from('mentors')
      .select('*')
      .eq('email', mentorEmail)
      .single()

    if (!mentor) return Response.json({ error: 'Mentor not found' }, { status: 404 })

    // Get teams assigned to this mentor
    const { data: teams } = await supabase
      .from('teams')
      .select('serial_number, technology, leader_roll, registered, team_number, project_title, project_description, problem_statement, ai_usage, mentor_assigned')
      .eq('mentor_assigned', mentor.name)
      .order('serial_number')

    // Get registrations
    const { data: registrations } = await supabase
      .from('team_registrations')
      .select('serial_number, team_number, project_title, technology, leader_roll, project_area, tech_stack, ai_tools, ai_usage, ai_capabilities, registered_at')

    const regMap = {}
    if (registrations) registrations.forEach(r => { regMap[r.serial_number] = r })

    // Get all members for mentor's teams
    const serialNumbers = (teams || []).map(t => t.serial_number)
    let allMembers = []
    if (serialNumbers.length > 0) {
      const { data } = await supabase
        .from('team_members')
        .select('serial_number, roll_number, is_leader, short_name')
        .in('serial_number', serialNumbers)
      allMembers = data || []
    }

    // Get student names
    const rollNumbers = allMembers.map(m => m.roll_number)
    let studentMap = {}
    if (rollNumbers.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name, email')
        .in('roll_number', rollNumbers)
      if (students) students.forEach(s => { studentMap[s.roll_number] = s })
    }

    // Build team list
    const teamList = (teams || []).map(t => {
      const reg = regMap[t.serial_number]
      const members = allMembers
        .filter(m => m.serial_number === t.serial_number)
        .map(m => ({
          rollNumber: m.roll_number,
          name: studentMap[m.roll_number]?.name || m.roll_number,
          email: studentMap[m.roll_number]?.email || '',
          isLeader: m.is_leader,
          shortName: m.short_name || ''
        }))
        .sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0))

      return {
        serialNumber: t.serial_number,
        teamNumber: reg?.team_number || t.team_number || null,
        technology: t.technology,
        registered: !!reg,
        registeredAt: reg?.registered_at || null,
        projectTitle: reg?.project_title || t.project_title || '',
        projectDescription: t.project_description || '',
        problemStatement: t.problem_statement || '',
        projectArea: reg?.project_area || [],
        techStack: reg?.tech_stack || [],
        aiTools: reg?.ai_tools || [],
        aiUsage: reg?.ai_usage || t.ai_usage || 'No',
        aiCapabilities: reg?.ai_capabilities || '',
        leaderRoll: t.leader_roll,
        leaderName: studentMap[t.leader_roll]?.name || t.leader_roll,
        members,
        memberCount: members.length
      }
    })

    // Stats
    const totalTeams = teamList.length
    const registeredCount = teamList.filter(t => t.registered).length
    const pendingCount = totalTeams - registeredCount
    const totalMembers = teamList.reduce((sum, t) => sum + t.memberCount, 0)

    return Response.json({
      mentor: {
        name: mentor.name,
        email: mentor.email,
        technology: mentor.technology
      },
      stats: {
        totalTeams,
        registeredCount,
        pendingCount,
        totalMembers,
        progressPercent: totalTeams > 0 ? Math.round(registeredCount / totalTeams * 100) : 0
      },
      teams: teamList
    })

  } catch (err) {
    console.error('Mentor dashboard error:', err)
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}