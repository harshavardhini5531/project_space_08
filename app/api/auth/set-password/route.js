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

    // Block non-leaders permanently
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('is_leader')
      .eq('roll_number', rollNumber)
      .eq('is_leader', true)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'Only team leaders can create accounts.' }, { status: 403 })
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

    return Response.json({ success: true })

  } catch (err) {
    console.error('set-password error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}