import { supabase } from '@/lib/supabase'
import { sendOTPEmail } from '@/lib/mailer'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = body.rollNumber?.trim().toUpperCase()
    const role = body.role || 'leader'

    if (!rollNumber) {
      return Response.json({ error: 'Roll number is required' }, { status: 400 })
    }

    // Check student exists
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('*')
      .eq('roll_number', rollNumber)
      .single()

    if (studentErr || !student) {
      return Response.json({ error: 'Roll number not found. Please check and try again.' }, { status: 404 })
    }

    // Check team membership
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('is_leader, team_number')
      .eq('roll_number', rollNumber)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'You are not part of any registered team. Contact your coordinator.' }, { status: 403 })
    }

    // === LEADER FLOW (Create Account page) ===
    if (role === 'leader') {
      if (!memberRow.is_leader) {
        const { data: teamRow } = await supabase
          .from('teams')
          .select('leader_roll')
          .eq('team_number', memberRow.team_number)
          .single()

        let leaderName = teamRow?.leader_roll || 'your team leader'
        if (teamRow?.leader_roll) {
          const { data: leaderStudent } = await supabase
            .from('students')
            .select('name')
            .eq('roll_number', teamRow.leader_roll)
            .single()
          if (leaderStudent?.name) leaderName = leaderStudent.name
        }

        return Response.json({
          error: `You are not a Team Leader. Only team leaders can create accounts here. Please contact your team leader ${leaderName} (${teamRow?.leader_roll || ''}) to register the team first.`
        }, { status: 403 })
      }

      const { data: existing } = await supabase
        .from('user_passwords')
        .select('id')
        .eq('roll_number', rollNumber)
        .single()

      if (existing) {
        return Response.json({ error: 'Account already exists. Please login instead.' }, { status: 409 })
      }
    }

    // === MEMBER FLOW (Team Member Sign Up) ===
    if (role === 'member') {
      if (memberRow.is_leader) {
        return Response.json({
          error: 'You are a Team Leader. Please use "Create Account" from the landing page.'
        }, { status: 403 })
      }

      const { data: teamRow } = await supabase
        .from('teams')
        .select('leader_roll, registered')
        .eq('team_number', memberRow.team_number)
        .single()

      if (!teamRow?.registered) {
        const { data: leaderStudent } = await supabase
          .from('students')
          .select('name')
          .eq('roll_number', teamRow?.leader_roll)
          .single()

        return Response.json({
          error: `Your team is not registered yet. Contact your Team Leader: ${leaderStudent?.name || teamRow?.leader_roll || 'Unknown'} to register the team first.`
        }, { status: 403 })
      }

      const { data: existing } = await supabase
        .from('user_passwords')
        .select('id')
        .eq('roll_number', rollNumber)
        .single()

      if (existing) {
        return Response.json({ error: 'Account already exists. Please sign in.' }, { status: 409 })
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('otp_codes').delete().eq('roll_number', rollNumber)
    await supabase.from('otp_codes').insert({ roll_number: rollNumber, email: student.email, otp, expires_at: expiresAt })
    await sendOTPEmail(student.email, student.name, otp)

    return Response.json({ success: true, message: `OTP sent to ${student.email}`, email: student.email, name: student.name })

  } catch (err) {
    console.error('send-otp error:', err)
    return Response.json({ error: 'Failed to send OTP. Try again.' }, { status: 500 })
  }
}