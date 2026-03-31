import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// Same transporter setup as lib/mailer.js (which works for OTPs)
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

function rollToEmail(roll) {
  if (!roll) return null
  const r = roll.toUpperCase()
  if (r.includes('P3')) return `${roll.toLowerCase()}@acet.ac.in`
  if (r.includes('MH')) return `${roll.toLowerCase()}@acoe.edu.in`
  if (r.includes('A9')) return `${roll.toLowerCase()}@aec.edu.in`
  return null
}

export async function POST(request) {
  try {
    const { teamNumber, projectTitle, technology, leaderName, members } = await request.json()

    console.log('=== NOTIFY TEAM ===')
    console.log('Team:', teamNumber, '| Members:', members?.length)

    if (!teamNumber || !members?.length) {
      return Response.json({ error: 'Missing team data' }, { status: 400 })
    }

    // Get emails from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yiwyfhdzgvlsmdeshdgv.supabase.co'
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    let dbEmails = {}
    if (supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const rollNumbers = members.map(m => m.roll_number).filter(Boolean)
        if (rollNumbers.length) {
          const { data } = await supabase.from('students').select('roll_number, email').in('roll_number', rollNumbers)
          if (data) data.forEach(s => { if (s.email) dbEmails[s.roll_number] = s.email })
        }
      } catch (e) {
        console.error('DB lookup error:', e.message)
      }
    }

    // Build email list
    const emailList = members.map(m => {
      const email = m.email || dbEmails[m.roll_number] || rollToEmail(m.roll_number)
      return { name: m.name, email, roll: m.roll_number }
    }).filter(m => m.email && m.email.includes('@'))

    console.log('Emails to send:', emailList.map(m => m.email))

    if (emailList.length === 0) {
      return Response.json({ message: 'No valid emails', sent: 0 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const buildHtml = (name) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;"><tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,48,32,0.15);overflow:hidden;">
<tr><td style="padding:32px 36px 0;">
<div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:2px;">PROJECT SPACE</div>
<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:4px;letter-spacing:1px;">TEAM REGISTRATION</div>
</td></tr>
<tr><td style="padding:28px 36px;">
<div style="text-align:center;margin-bottom:20px;font-size:28px;">🎉</div>
<div style="font-size:16px;font-weight:700;color:#4ade80;text-align:center;margin-bottom:16px;">Your Team is Registered!</div>
<div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;">
Hi <strong style="color:#fff;">${name || 'Team Member'}</strong>,<br><br>
Your team leader <strong style="color:#EEA727;">${leaderName}</strong> has registered your team 
<strong style="color:#fff;">${teamNumber}</strong> for the 
<strong style="color:#ff3020;">${technology}</strong> track.
</div>
<div style="margin:24px 0;padding:16px 20px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
<div style="font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Project</div>
<div style="font-size:16px;color:#EEA727;font-weight:700;">${projectTitle}</div>
<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">${technology} Track</div>
</div>
<div style="text-align:center;margin-top:24px;">
<a href="${appUrl}/auth/login" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ff3020,#ff6040);color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:1px;">Login to Your Profile →</a>
</div>
</td></tr>
<tr><td style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.05);">
<div style="font-size:11px;color:rgba(255,255,255,0.2);text-align:center;">Project Space Hackathon · May 6-12, 2026 · Aditya University</div>
</td></tr>
</table></td></tr></table></body></html>`

    let sent = 0
    for (const m of emailList) {
      try {
        var mailOptions = {
          from: '"Project Space" <' + process.env.GMAIL_USER + '>',
          to: m.email,
          subject: '🎉 ' + m.name + ', your team ' + teamNumber + ' is registered! | Project Space',
          html: buildHtml(m.name)
        }
        var result = await transporter.sendMail(mailOptions)
        console.log('✅ Sent to', m.email, result.messageId)
        sent++
      } catch (err) {
        console.error('❌ Failed', m.email + ':', err.message)
      }
    }

    console.log('=== DONE:', sent + '/' + emailList.length, 'sent ===')
    return Response.json({ sent, total: emailList.length })

  } catch (err) {
    console.error('NOTIFY ERROR:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}