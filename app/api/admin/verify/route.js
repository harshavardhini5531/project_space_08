import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io').split(',').map(e => e.trim().toLowerCase())

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

export async function POST(request) {
  try {
    const { action, email, otp } = await request.json()

    if (action === 'send-otp') {
      const cleanEmail = (email || '').trim().toLowerCase()
      if (!cleanEmail) return Response.json({ error: 'Email is required' }, { status: 400 })
      if (!ADMIN_EMAILS.includes(cleanEmail)) {
        return Response.json({ error: 'Unauthorized. This email is not an admin.' }, { status: 403 })
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store OTP in otp_codes table
      await supabase.from('otp_codes').delete().eq('roll_number', 'ADMIN_' + cleanEmail)
      await supabase.from('otp_codes').insert({
        roll_number: 'ADMIN_' + cleanEmail,
        otp_code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })

      // Send OTP email
      await transporter.sendMail({
        from: `"Project Space Admin" <${process.env.GMAIL_USER}>`,
        to: cleanEmail,
        subject: `🔐 Admin Login OTP — Project Space`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif">
  <div style="max-width:420px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px">PS</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;text-align:center">
      <h2 style="color:#fff;font-size:18px;margin:0 0 8px">Admin Login OTP</h2>
      <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 24px">Use this code to access the admin dashboard</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#fd1c00;padding:16px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.15);border-radius:12px">${code}</div>
      <p style="color:rgba(255,255,255,.3);font-size:11px;margin-top:20px">Expires in 10 minutes. Do not share this code.</p>
    </div>
  </div>
</body>
</html>`
      })

      return Response.json({ success: true, message: 'OTP sent to your email' })

    } else if (action === 'verify-otp') {
      const cleanEmail = (email || '').trim().toLowerCase()
      if (!cleanEmail || !otp) return Response.json({ error: 'Email and OTP required' }, { status: 400 })
      if (!ADMIN_EMAILS.includes(cleanEmail)) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 })
      }

      const { data: otpRow } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('roll_number', 'ADMIN_' + cleanEmail)
        .single()

      if (!otpRow) return Response.json({ error: 'No OTP found. Request a new one.' }, { status: 400 })
      if (otpRow.otp_code !== otp) return Response.json({ error: 'Invalid OTP' }, { status: 400 })
      if (new Date(otpRow.expires_at) < new Date()) return Response.json({ error: 'OTP expired. Request a new one.' }, { status: 400 })

      // Delete used OTP
      await supabase.from('otp_codes').delete().eq('roll_number', 'ADMIN_' + cleanEmail)

      // Generate admin token
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