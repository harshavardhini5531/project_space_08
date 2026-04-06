import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      rollNumber, serialNumber, projectTitle, projectDescription,
      problemStatement, projectArea, aiUsage, aiCapabilities,
      aiTools, techStack, members
    } = body

    if (!rollNumber || !serialNumber) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const roll = rollNumber.trim().toUpperCase()

    // Verify leader
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('serial_number, is_leader, team_number')
      .eq('roll_number', roll)
      .single()

    if (!memberRow || !memberRow.is_leader || memberRow.serial_number !== serialNumber) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already registered
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('registered, team_number, technology')
      .eq('serial_number', serialNumber)
      .single()

    if (existingTeam?.registered) {
      return Response.json({ error: 'Team is already registered. Registration cannot be modified.' }, { status: 409 })
    }

    // Auto-assign next team_number (PS-001, PS-002, ...)
    const { data: maxTeam } = await supabase
      .from('teams')
      .select('team_number')
      .not('team_number', 'is', null)
      .order('team_number', { ascending: false })
      .limit(1)
      .single()

    let nextNum = 1
    if (maxTeam && maxTeam.team_number) {
      const match = maxTeam.team_number.match(/PS-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const newTeamNumber = `PS-${String(nextNum).padStart(3, '0')}`

    // Insert into team_registrations table
    const { error: regErr } = await supabase
      .from('team_registrations')
      .insert({
        serial_number: serialNumber,
        team_number: newTeamNumber,
        technology: existingTeam?.technology || '',
        leader_roll: roll,
        project_title: projectTitle || '',
        project_description: projectDescription || '',
        problem_statement: problemStatement || '',
        project_area: Array.isArray(projectArea) ? projectArea : [],
        ai_usage: aiUsage || 'No',
        ai_capabilities: aiCapabilities || '',
        ai_tools: Array.isArray(aiTools) ? aiTools : [],
        tech_stack: Array.isArray(techStack) ? techStack : [],
        members: members ? JSON.stringify(members.map(m => ({
          name: m.name,
          roll_number: m.roll_number,
          college: m.college,
          branch: m.branch,
          short_name: m.short_name,
          is_leader: m.is_leader
        }))) : '[]',
        registered_at: new Date().toISOString()
      })

    if (regErr) {
      console.error('Registration insert error:', regErr)
      return Response.json({ error: 'Failed to register: ' + regErr.message }, { status: 500 })
    }

    // Update teams table — mark registered + assign team_number
    const { error: teamErr } = await supabase
      .from('teams')
      .update({
        team_number: newTeamNumber,
        registered: true
      })
      .eq('serial_number', serialNumber)

    if (teamErr) {
      console.error('Team update error:', teamErr)
    }

    // Update team_members with the new team_number
    const { error: memberErr } = await supabase
      .from('team_members')
      .update({ team_number: newTeamNumber })
      .eq('serial_number', serialNumber)

    if (memberErr) {
      console.error('Member update error:', memberErr)
    }

    // Save short_name to team_members + update student details
    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (m.roll_number) {
          const studentData = {}
          if (m.name) studentData.name = m.name
          if (m.phone) studentData.phone = m.phone
          if (m.email) studentData.email = m.email
          if (Object.keys(studentData).length > 0) {
            await supabase.from('students').update(studentData).eq('roll_number', m.roll_number)
          }
          if (m.short_name) {
            await supabase.from('team_members').update({ short_name: m.short_name }).eq('roll_number', m.roll_number).eq('serial_number', serialNumber)
          }
        }
      }
    }

    return Response.json({
      success: true,
      teamNumber: newTeamNumber,
      message: `Team registered successfully! Your team number is ${newTeamNumber}`
    })

  } catch (err) {
    console.error('register-team error:', err)
    return Response.json({ error: 'Registration failed. Try again.' }, { status: 500 })
  }
}