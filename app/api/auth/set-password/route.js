import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = body.rollNumber?.trim().toUpperCase()
    const password = body.password

    if (!rollNumber || !password) {
      return Response.json({ error: 'Roll number and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Block outsiders & unregistered team members
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('is_leader, serial_number')
      .eq('roll_number', rollNumber)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'You are not part of any team. Contact your coordinator.' }, { status: 403 })
    }

    if (!memberRow.is_leader) {
      const { data: teamRow } = await supabase
        .from('teams')
        .select('registered, leader_roll')
        .eq('serial_number', memberRow.serial_number)
        .single()

      if (!teamRow?.registered) {
        const { data: leaderStudent } = await supabase
          .from('students')
          .select('name')
          .eq('roll_number', teamRow?.leader_roll)
          .single()

        return Response.json({
          error: `Your team leader ${leaderStudent?.name || teamRow?.leader_roll || 'Unknown'} has not registered your team yet. Contact them first.`
        }, { status: 403 })
      }
    }

    // Verify OTP was actually completed
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('id')
      .eq('roll_number', rollNumber)
      .eq('used', true)
      .limit(1)
      .single()

    if (!otpRecord) {
      return Response.json({ error: 'OTP verification required first.' }, { status: 403 })
    }

    const hash = await bcrypt.hash(password, 10)

    const { error } = await supabase
      .from('user_passwords')
      .upsert({
        roll_number: rollNumber,
        password_hash: hash
      }, { onConflict: 'roll_number' })

    if (error) {
      console.error('set-password db error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // If this is a team member (not leader), insert into member_registrations
    if (!memberRow.is_leader) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('leader_roll, team_number, project_title')
        .eq('serial_number', memberRow.serial_number)
        .single()

      const { data: existingShort } = await supabase
        .from('team_members')
        .select('short_name')
        .eq('roll_number', rollNumber)
        .eq('serial_number', memberRow.serial_number)
        .single()

      await supabase
        .from('member_registrations')
        .upsert({
          roll_number: rollNumber,
          serial_number: memberRow.serial_number,
          team_number: teamData?.team_number || null,
          leader_roll: teamData?.leader_roll || null,
          short_name: existingShort?.short_name || null,
          project_title: teamData?.project_title || null,
          registered_at: new Date().toISOString()
        }, { onConflict: 'roll_number' })
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('set-password error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}