import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { mentorEmail } = await request.json()
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (!mentorEmail) return Response.json({ error: 'Email required' }, { status: 400 })

    const { data: mentor } = await supabase.from('mentors').select('*').eq('email', mentorEmail).single()
    if (!mentor) return Response.json({ error: 'Mentor not found' }, { status: 404 })

    // Get teams assigned to this mentor
    const { data: myTeams } = await supabase
      .from('teams')
      .select('serial_number, technology, leader_roll, registered, team_number, project_title, project_description, problem_statement, ai_usage, mentor_assigned')
      .eq('mentor_assigned', mentor.name)
      .order('serial_number')

    // Get ALL teams of mentor's technology (for tech overview page)
    const { data: techTeams } = await supabase
      .from('teams')
      .select('serial_number, technology, leader_roll, registered, team_number, project_title, project_description, problem_statement, ai_usage, mentor_assigned')
      .eq('technology', mentor.technology)
      .order('serial_number')

    // Get registrations
    const { data: registrations } = await supabase
      .from('team_registrations')
      .select('serial_number, team_number, project_title, technology, leader_roll, project_area, tech_stack, ai_tools, ai_usage, ai_capabilities, registered_at')

    const regMap = {}
    if (registrations) registrations.forEach(r => { regMap[r.serial_number] = r })

    // Get all members for both my teams and tech teams
    const allSerials = [...new Set([...(myTeams||[]).map(t=>t.serial_number), ...(techTeams||[]).map(t=>t.serial_number)])]
    let allMembers = []
    if (allSerials.length > 0) {
      for (let i = 0; i < allSerials.length; i += 100) {
        const batch = allSerials.slice(i, i + 100)
        const { data } = await supabase.from('team_members').select('serial_number, roll_number, is_leader, short_name').in('serial_number', batch)
        if (data) allMembers.push(...data)
      }
    }

    // Get student details (name, email, phone)
    const rollNumbers = allMembers.map(m => m.roll_number)
    let studentMap = {}
    if (rollNumbers.length > 0) {
      for (let i = 0; i < rollNumbers.length; i += 100) {
        const batch = rollNumbers.slice(i, i + 100)
        const { data: students } = await supabase.from('students').select('roll_number, name, email, phone').in('roll_number', batch)
        if (students) students.forEach(s => { studentMap[s.roll_number] = s })
      }
    }

    // Build team list helper
    function buildTeamList(teams) {
      return (teams || []).map(t => {
        const reg = regMap[t.serial_number]
        const members = allMembers
          .filter(m => m.serial_number === t.serial_number)
          .map(m => ({
            rollNumber: m.roll_number,
            name: studentMap[m.roll_number]?.name || m.roll_number,
            email: studentMap[m.roll_number]?.email || '',
            phone: studentMap[m.roll_number]?.phone || '',
            isLeader: m.is_leader,
            shortName: m.short_name || ''
          }))
          .sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0))

        const leader = members.find(m => m.isLeader)

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
          leaderPhone: leader?.phone || studentMap[t.leader_roll]?.phone || '',
          leaderEmail: leader?.email || studentMap[t.leader_roll]?.email || '',
          mentorAssigned: t.mentor_assigned || '',
          members,
          memberCount: members.length
        }
      })
    }

    const myTeamList = buildTeamList(myTeams)
    const techTeamList = buildTeamList(techTeams)

    // Stats for my teams
    const totalTeams = myTeamList.length
    const registeredCount = myTeamList.filter(t => t.registered).length
    const pendingCount = totalTeams - registeredCount
    const totalMembers = myTeamList.reduce((sum, t) => sum + t.memberCount, 0)

    // Stats for tech teams
    const techTotal = techTeamList.length
    const techRegistered = techTeamList.filter(t => t.registered).length

    return Response.json({
      mentor: { name: mentor.name, email: mentor.email, technology: mentor.technology },
      stats: {
        totalTeams, registeredCount, pendingCount, totalMembers,
        progressPercent: totalTeams > 0 ? Math.round(registeredCount / totalTeams * 100) : 0
      },
      teams: myTeamList,
      techProjects: {
        technology: mentor.technology,
        total: techTotal,
        registered: techRegistered,
        pending: techTotal - techRegistered,
        teams: techTeamList
      }
    })

  } catch (err) {
    console.error('Mentor dashboard error:', err)
    return Response.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}