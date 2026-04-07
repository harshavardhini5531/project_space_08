import { supabase } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { action, email, otp, password, newPassword } = await request.json()
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail) return Response.json({ error: 'Email is required' }, { status: 400 })

    // Find mentor
    const { data: mentor } = await supabase
      .from('mentors')
      .select('*')
      .eq('email', cleanEmail)
      .single()

    if (!mentor) return Response.json({ error: 'No mentor found with this email' }, { status: 404 })

    // ── SEND OTP ──
    if (action === 'send-otp') {
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      await supabase.from('otp_codes').delete().eq('roll_number', 'MENTOR_' + cleanEmail)
      await supabase.from('otp_codes').insert({
        roll_number: 'MENTOR_' + cleanEmail,
        email: cleanEmail,
        otp: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false
      })

      await sendMail({
        from: `"Project Space" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: `🔐 Mentor Login OTP — Project Space`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif">
  <div style="max-width:420px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px">PS</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;text-align:center">
      <h2 style="color:#fff;font-size:18px;margin:0 0 8px">Mentor Login OTP</h2>
      <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">Hi ${mentor.name}, use this code to access your mentor dashboard</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#fd1c00;padding:16px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.15);border-radius:12px">${code}</div>
      <p style="color:rgba(255,255,255,.3);font-size:11px;margin-top:20px">Expires in 10 minutes.</p>
    </div>
  </div>
</body></html>`
      })

      return Response.json({ success: true, name: mentor.name, hasPassword: !!mentor.password_hash })

    // ── VERIFY OTP ──
    } else if (action === 'verify-otp') {
      if (!otp) return Response.json({ error: 'OTP required' }, { status: 400 })

      const { data: otpRow } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('roll_number', 'MENTOR_' + cleanEmail)
        .single()

      if (!otpRow) return Response.json({ error: 'No OTP found. Request a new one.' }, { status: 400 })
      if (otpRow.otp !== otp) return Response.json({ error: 'Invalid OTP' }, { status: 400 })
      if (new Date(otpRow.expires_at) < new Date()) return Response.json({ error: 'OTP expired' }, { status: 400 })

      await supabase.from('otp_codes').delete().eq('roll_number', 'MENTOR_' + cleanEmail)

      const token = 'mentor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)

      return Response.json({
        success: true,
        token,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          technology: mentor.technology,
          hasPassword: !!mentor.password_hash
        }
      })

    // ── PASSWORD LOGIN ──
    } else if (action === 'password-login') {
      if (!password) return Response.json({ error: 'Password required' }, { status: 400 })
      if (!mentor.password_hash) return Response.json({ error: 'No password set. Please login with OTP first.' }, { status: 400 })

      const valid = await bcrypt.compare(password, mentor.password_hash)
      if (!valid) return Response.json({ error: 'Invalid password' }, { status: 401 })

      const token = 'mentor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)

      return Response.json({
        success: true,
        token,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          technology: mentor.technology,
          hasPassword: true
        }
      })

    // ── SET PASSWORD ──
    } else if (action === 'set-password') {
      if (!newPassword || newPassword.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

      const hash = await bcrypt.hash(newPassword, 10)
      await supabase.from('mentors').update({ password_hash: hash }).eq('email', cleanEmail)

      return Response.json({ success: true, message: 'Password set successfully' })

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (err) {
    console.error('Mentor login error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}