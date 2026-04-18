import { supabase } from '@/lib/supabase'
import { sendMail, sendOTPEmail } from '@/lib/mailer'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { action, email, otp, password, newPassword, confirmPassword } = await request.json()
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail) return Response.json({ error: 'Email is required' }, { status: 400 })

    const { data: mentor } = await supabase.from('mentors').select('*').eq('email', cleanEmail).single()
    if (!mentor) return Response.json({ error: 'No mentor found with this email' }, { status: 404 })

    // ── CHECK ACCOUNT STATUS ──
    if (action === 'check-account') {
      return Response.json({ exists: true, name: mentor.name, hasPassword: !!mentor.password_hash, technology: mentor.technology })

    // ── SEND OTP ──
    } else if (action === 'send-otp') {
      const { data: recentOtp } = await supabase.from('otp_codes').select('created_at').eq('roll_number', 'MENTOR_' + cleanEmail).single()
      if (recentOtp?.created_at) {
        const elapsed = Date.now() - new Date(recentOtp.created_at).getTime()
        if (elapsed < 60000) return Response.json({ error: 'Please wait 60 seconds before requesting another OTP' }, { status: 429 })
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await supabase.from('otp_codes').delete().eq('roll_number', 'MENTOR_' + cleanEmail)
      await supabase.from('otp_codes').insert({ roll_number: 'MENTOR_' + cleanEmail, email: cleanEmail, otp: code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), used: false })

      await sendOTPEmail(cleanEmail, mentor.name, code)

      return Response.json({ success: true, name: mentor.name })

    // ── VERIFY OTP ──
    } else if (action === 'verify-otp') {
      if (!otp) return Response.json({ error: 'OTP required' }, { status: 400 })
      const { data: otpRow } = await supabase.from('otp_codes').select('*').eq('roll_number', 'MENTOR_' + cleanEmail).single()
      if (!otpRow) return Response.json({ error: 'No OTP found. Request a new one.' }, { status: 400 })
      if (otpRow.otp !== otp) return Response.json({ error: 'Invalid OTP' }, { status: 400 })
      if (new Date(otpRow.expires_at) < new Date()) return Response.json({ error: 'OTP expired. Request a new one.' }, { status: 400 })
      await supabase.from('otp_codes').delete().eq('roll_number', 'MENTOR_' + cleanEmail)
      return Response.json({ success: true, verified: true, name: mentor.name })

    // ── SET PASSWORD ──
    } else if (action === 'set-password') {
      if (!newPassword) return Response.json({ error: 'Password is required' }, { status: 400 })
      if (newPassword !== confirmPassword) return Response.json({ error: 'Passwords do not match' }, { status: 400 })
      const rules = [
        { test: v => v.length >= 8, msg: 'At least 8 characters required' },
        { test: v => /[A-Z]/.test(v), msg: 'One uppercase letter required' },
        { test: v => /[0-9]/.test(v), msg: 'One number required' },
        { test: v => /[^A-Za-z0-9]/.test(v), msg: 'One special character required' },
      ]
      const failed = rules.find(r => !r.test(newPassword))
      if (failed) return Response.json({ error: failed.msg }, { status: 400 })
      const hash = await bcrypt.hash(newPassword, 10)
      await supabase.from('mentors').update({ password_hash: hash }).eq('email', cleanEmail)
      return Response.json({ success: true, message: 'Password set successfully' })

    // ── PASSWORD LOGIN ──
    } else if (action === 'password-login') {
      if (!password) return Response.json({ error: 'Password required' }, { status: 400 })
      if (!mentor.password_hash) return Response.json({ error: 'No password set. Please create an account first.' }, { status: 400 })
      const valid = await bcrypt.compare(password, mentor.password_hash)
      if (!valid) return Response.json({ error: 'Invalid password' }, { status: 401 })
      const token = 'mentor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)
      return Response.json({ success: true, token, mentor: { id: mentor.id, name: mentor.name, email: mentor.email, technology: mentor.technology, hasPassword: true } })

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Mentor login error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}