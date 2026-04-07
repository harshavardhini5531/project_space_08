import { supabase } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'
import bcrypt from 'bcryptjs'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io').split(',').map(e => e.trim().toLowerCase())

// Store admin passwords in a simple table approach - use mentors table if admin is also a mentor, otherwise use a separate mechanism
// For now, we'll store admin passwords in a simple key-value in otp_codes with a special prefix

export async function POST(request) {
  try {
    const { action, email, otp, password, newPassword, confirmPassword } = await request.json()
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail) return Response.json({ error: 'Email is required' }, { status: 400 })
    if (!ADMIN_EMAILS.includes(cleanEmail)) return Response.json({ error: 'Unauthorized. Not an admin email.' }, { status: 403 })

    // Check if admin has a password stored (in mentors table if they're a mentor)
    const { data: mentor } = await supabase.from('mentors').select('password_hash, name').eq('email', cleanEmail).single()

    // ── CHECK ACCOUNT ──
    if (action === 'check-account') {
      return Response.json({ exists: true, name: mentor?.name || 'Admin', hasPassword: !!mentor?.password_hash })

    // ── SEND OTP ──
    } else if (action === 'send-otp') {
      const { data: recentOtp } = await supabase.from('otp_codes').select('created_at').eq('roll_number', 'ADMIN_' + cleanEmail).single()
      if (recentOtp?.created_at) {
        const elapsed = Date.now() - new Date(recentOtp.created_at).getTime()
        if (elapsed < 60000) return Response.json({ error: 'Please wait 60 seconds before requesting another OTP' }, { status: 429 })
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await supabase.from('otp_codes').delete().eq('roll_number', 'ADMIN_' + cleanEmail)
      await supabase.from('otp_codes').insert({ roll_number: 'ADMIN_' + cleanEmail, email: cleanEmail, otp: code, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), used: false })

      await sendMail({
        from: `"Project Space Admin" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: `🔐 Admin Verification Code — Project Space`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif"><div style="max-width:420px;margin:0 auto;padding:32px 20px"><div style="text-align:center;margin-bottom:20px"><div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px">PS</div></div><div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;text-align:center"><h2 style="color:#fff;font-size:18px;margin:0 0 8px">Admin Verification Code</h2><p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">Use this code to verify your identity</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#fd1c00;padding:16px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.15);border-radius:12px">${code}</div><p style="color:rgba(255,255,255,.3);font-size:11px;margin-top:20px">Expires in 10 minutes.</p></div></div></body></html>`
      })

      return Response.json({ success: true, name: mentor?.name || 'Admin' })

    // ── VERIFY OTP ──
    } else if (action === 'verify-otp') {
      if (!otp) return Response.json({ error: 'OTP required' }, { status: 400 })
      const { data: otpRow } = await supabase.from('otp_codes').select('*').eq('roll_number', 'ADMIN_' + cleanEmail).single()
      if (!otpRow) return Response.json({ error: 'No OTP found. Request a new one.' }, { status: 400 })
      if (otpRow.otp !== otp) return Response.json({ error: 'Invalid OTP' }, { status: 400 })
      if (new Date(otpRow.expires_at) < new Date()) return Response.json({ error: 'OTP expired. Request a new one.' }, { status: 400 })
      await supabase.from('otp_codes').delete().eq('roll_number', 'ADMIN_' + cleanEmail)
      return Response.json({ success: true, verified: true })

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
      // Store in mentors table (admin is also a mentor)
      if (mentor) {
        await supabase.from('mentors').update({ password_hash: hash }).eq('email', cleanEmail)
      }
      return Response.json({ success: true, message: 'Password set successfully' })

    // ── PASSWORD LOGIN ──
    } else if (action === 'password-login') {
      if (!password) return Response.json({ error: 'Password required' }, { status: 400 })
      if (!mentor?.password_hash) return Response.json({ error: 'No password set. Please create an account first.' }, { status: 400 })
      const valid = await bcrypt.compare(password, mentor.password_hash)
      if (!valid) return Response.json({ error: 'Invalid password' }, { status: 401 })
      const token = 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16)
      return Response.json({ success: true, token, email: cleanEmail })

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Admin auth error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}