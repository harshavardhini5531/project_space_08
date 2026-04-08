import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    // Verify admin token from header
    const token = request.headers.get('x-admin-token')
    if (!token || !token.startsWith('admin_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all teams
    const { data: teams } = await supabase
      .from('teams')
      .select('serial_number, technology, leader_roll, mentor_assigned, registered, team_number, project_title, project_description, problem_statement, ai_usage')
      .order('serial_number')

    // Fetch all registrations
    const { data: registrations } = await supabase
      .from('team_registrations')
      .select('serial_number, team_number, project_title, technology, leader_roll, project_area, tech_stack, ai_tools, ai_usage, registered_at')
      .order('registered_at', { ascending: false })

    // Fetch all team members
    const { data: allMembers } = await supabase
      .from('team_members')
      .select('serial_number, roll_number, is_leader')

    // Fetch student names
    const rollNumbers = (allMembers || []).map(m => m.roll_number)
    let studentMap = {}
    if (rollNumbers.length > 0) {
      // Batch in groups of 100
      for (let i = 0; i < rollNumbers.length; i += 100) {
        const batch = rollNumbers.slice(i, i + 100)
        const { data: students } = await supabase
          .from('students')
          .select('roll_number, name, email, phone')
          .in('roll_number', batch)
        if (students) students.forEach(s => { studentMap[s.roll_number] = s })
      }
    }

    // Fetch user passwords (to know who created accounts)
    const { data: accounts } = await supabase
      .from('user_passwords')
      .select('roll_number')

    const accountSet = new Set((accounts || []).map(a => a.roll_number))

    // Build stats
    const totalTeams = (teams || []).length
    const registeredSerials = new Set((registrations || []).map(r => r.serial_number))
    const registeredCount = registeredSerials.size
    const pendingCount = totalTeams - registeredCount

    // Technology breakdown
    const techBreakdown = {}
    for (const t of (teams || [])) {
      if (!techBreakdown[t.technology]) techBreakdown[t.technology] = { total: 0, registered: 0, pending: 0 }
      techBreakdown[t.technology].total++
      if (registeredSerials.has(t.serial_number)) techBreakdown[t.technology].registered++
      else techBreakdown[t.technology].pending++
    }

    // Mentor breakdown
    const mentorBreakdown = {}
    for (const t of (teams || [])) {
      const mentor = t.mentor_assigned || 'Unassigned'
      if (!mentorBreakdown[mentor]) mentorBreakdown[mentor] = { total: 0, registered: 0, pending: 0, teams: [] }
      mentorBreakdown[mentor].total++
      if (registeredSerials.has(t.serial_number)) mentorBreakdown[mentor].registered++
      else mentorBreakdown[mentor].pending++
      mentorBreakdown[mentor].teams.push({
        serialNumber: t.serial_number,
        teamNumber: t.team_number,
        technology: t.technology,
        projectTitle: t.project_title,
        registered: registeredSerials.has(t.serial_number),
        leaderRoll: t.leader_roll,
        leaderName: studentMap[t.leader_roll]?.name || t.leader_roll,
        leaderPhone: studentMap[t.leader_roll]?.phone || '',
        accountCreated: accountSet.has(t.leader_roll)
      })
    }

    // Full team list with details
    const teamList = (teams || []).map(t => {
      const reg = (registrations || []).find(r => r.serial_number === t.serial_number)
      const members = (allMembers || []).filter(m => m.serial_number === t.serial_number).map(m => ({
        rollNumber: m.roll_number,
        name: studentMap[m.roll_number]?.name || m.roll_number,
        email: studentMap[m.roll_number]?.email || '',
        isLeader: m.is_leader,
        accountCreated: accountSet.has(m.roll_number)
      }))

      return {
        serialNumber: t.serial_number,
        teamNumber: reg?.team_number || t.team_number || null,
        technology: t.technology,
        mentorAssigned: t.mentor_assigned,
        registered: registeredSerials.has(t.serial_number),
        registeredAt: reg?.registered_at || null,
        projectTitle: reg?.project_title || t.project_title || '',
        projectDescription: t.project_description || '',
        problemStatement: t.problem_statement || '',
        projectArea: reg?.project_area || [],
        techStack: reg?.tech_stack || [],
        aiTools: reg?.ai_tools || [],
        aiUsage: reg?.ai_usage || t.ai_usage || 'No',
        leaderRoll: t.leader_roll,
        leaderName: studentMap[t.leader_roll]?.name || t.leader_roll,
        leaderPhone: studentMap[t.leader_roll]?.phone || '',
        accountCreated: accountSet.has(t.leader_roll),
        members,
        memberCount: members.length
      }
    })

    // Recent registrations (last 10)
    const recentRegistrations = (registrations || []).slice(0, 10).map(r => ({
      serialNumber: r.serial_number,
      teamNumber: r.team_number,
      projectTitle: r.project_title,
      technology: r.technology,
      registeredAt: r.registered_at
    }))

    return Response.json({
      stats: {
        totalTeams,
        registeredCount,
        pendingCount,
        progressPercent: totalTeams > 0 ? Math.round(registeredCount / totalTeams * 100) : 0,
        totalStudents: rollNumbers.length,
        accountsCreated: accountSet.size
      },
      techBreakdown,
      mentorBreakdown,
      teamList,
      recentRegistrations
    })

  } catch (err) {
    console.error('Admin dashboard error:', err)
    return Response.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}