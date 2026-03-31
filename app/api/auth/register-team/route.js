import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      rollNumber, teamNumber, projectTitle, projectDescription,
      problemStatement, projectArea, aiUsage, aiCapabilities,
      aiTools, techStack, members
    } = body

    if (!rollNumber || !teamNumber) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify leader
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('team_number, is_leader')
      .eq('roll_number', rollNumber.trim().toUpperCase())
      .single()

    if (!memberRow || !memberRow.is_leader || memberRow.team_number !== teamNumber) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already registered
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('registered')
      .eq('team_number', teamNumber)
      .single()

    if (existingTeam?.registered) {
      return Response.json({ error: 'Team is already registered. Registration cannot be modified.' }, { status: 409 })
    }

    // Update teams table with ALL fields + set registered = true
    const { error: teamErr } = await supabase
      .from('teams')
      .update({
        project_title: projectTitle || '',
        project_description: projectDescription || '',
        problem_statement: problemStatement || '',
        project_area: Array.isArray(projectArea) ? projectArea : [],
        ai_usage: aiUsage || 'No',
        ai_capabilities: Array.isArray(aiCapabilities) ? aiCapabilities : [],
        ai_tools: Array.isArray(aiTools) ? aiTools : [],
        tech_stack: Array.isArray(techStack) ? techStack : [],
        registered: true,
        registered_at: new Date().toISOString()
      })
      .eq('team_number', teamNumber)

    if (teamErr) {
      console.error('Team update error:', teamErr)
      return Response.json({ error: 'Failed to register: ' + teamErr.message }, { status: 500 })
    }

    // Update team members — handle edits (name, phone, email)
    if (members && Array.isArray(members)) {
      for (const m of members) {
        if (m.roll_number) {
          const updateData = {}
          if (m.name) updateData.name = m.name
          if (m.phone) updateData.phone = m.phone
          if (m.email) updateData.email = m.email
          if (Object.keys(updateData).length > 0) {
            await supabase.from('students').update(updateData).eq('roll_number', m.roll_number)
          }
        }
      }
    }

    return Response.json({ success: true, message: 'Team registered successfully!' })

  } catch (err) {
    console.error('register-team error:', err)
    return Response.json({ error: 'Registration failed. Try again.' }, { status: 500 })
  }
}