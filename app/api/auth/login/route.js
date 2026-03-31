import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { rollNumber, password, role } = await request.json()

    if (!rollNumber || !password) {
      return Response.json({ error: 'Roll number and password required' }, { status: 400 })
    }

    const roll = rollNumber.trim().toUpperCase()

    // Check if student exists
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('roll_number', roll)
      .single()

    if (!student) {
      return Response.json({ error: 'Student not found. Please check your roll number.' }, { status: 404 })
    }

    // Check team membership
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('is_leader, team_number')
      .eq('roll_number', roll)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'You are not part of any team.' }, { status: 403 })
    }

    // Role mismatch checks
    if (role === 'leader' && !memberRow.is_leader) {
      return Response.json({ error: 'You are not a Team Leader. Please use Team Member login.' }, { status: 403 })
    }
    if (role === 'member' && memberRow.is_leader) {
      return Response.json({ error: 'You are a Team Leader. Please use Team Leader login.' }, { status: 403 })
    }

    // If member, check if team leader has registered the team
    if (role === 'member') {
      const { data: teamRow } = await supabase
        .from('teams')
        .select('leader_roll, registered')
        .eq('team_number', memberRow.team_number)
        .single()

      if (teamRow && !teamRow.registered) {
        const { data: leaderInfo } = await supabase
          .from('students')
          .select('name')
          .eq('roll_number', teamRow.leader_roll)
          .single()
        return Response.json({
          error: `Team not registered yet. Contact your Team Leader: ${leaderInfo?.name || teamRow.leader_roll}`
        }, { status: 403 })
      }
    }

    // Get password record
    const { data: record } = await supabase
      .from('user_passwords')
      .select('*')
      .eq('roll_number', roll)
      .single()

    if (!record) {
      return Response.json({ error: 'Account not set up. Please register first.' }, { status: 404 })
    }

    const match = await bcrypt.compare(password, record.password_hash)
    if (!match) {
      return Response.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Get team details including registered status
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('team_number', memberRow.team_number)
      .single()

    // Update last login
    await supabase
      .from('user_passwords')
      .update({ last_login: new Date().toISOString() })
      .eq('roll_number', roll)

    return Response.json({
      success: true,
      user: {
        rollNumber: student.roll_number,
        roll_number: student.roll_number,
        name: student.name,
        college: student.college,
        branch: student.branch,
        technology: student.technology,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        teamNumber: memberRow.team_number,
        isLeader: memberRow.is_leader,
        role: memberRow.is_leader ? 'leader' : 'member',
        registered: team?.registered || false,
        projectTitle: team?.project_title || '',
        credits: team?.credits || 20
      }
    })

  } catch (err) {
    console.error('login error:', err)
    return Response.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}