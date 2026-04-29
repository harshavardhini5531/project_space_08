import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = body.rollNumber?.trim().toUpperCase()
    const newPassword = body.newPassword

    if (!rollNumber || !newPassword) {
      return Response.json({ error: 'Roll number and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Verify the user already has an account (can't reset what was never created)
    const { data: existing } = await supabase
      .from('user_passwords')
      .select('roll_number')
      .eq('roll_number', rollNumber)
      .single()

    if (!existing) {
      return Response.json({ error: 'No account found for this roll number. Please create an account first.' }, { status: 404 })
    }

    // Verify OTP was completed recently (within last 10 minutes)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('id, created_at')
      .eq('roll_number', rollNumber)
      .eq('used', true)
      .gte('created_at', tenMinAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otpRecord) {
      return Response.json({ error: 'OTP verification expired. Please verify OTP again.' }, { status: 403 })
    }

    // Hash new password and update
    const hash = await bcrypt.hash(newPassword, 10)
    const { error } = await supabase
      .from('user_passwords')
      .update({ password_hash: hash })
      .eq('roll_number', rollNumber)

    if (error) {
      console.error('reset-password db error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, message: 'Password reset successfully' })

  } catch (err) {
    console.error('reset-password error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}