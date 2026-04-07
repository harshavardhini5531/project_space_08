import { sendMail } from '@/lib/mailer'
import { createClient } from '@supabase/supabase-js'


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
    const { teamNumber, projectTitle, technology, leaderName, members, mentorName } = await request.json()

    console.log('=== NOTIFY TEAM ===')
    console.log('Team:', teamNumber, '| Members:', members?.length, '| Mentor:', mentorName)

    if (!teamNumber || !members?.length) {
      return Response.json({ error: 'Missing team data' }, { status: 400 })
    }

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

    const emailList = members.map(m => {
      const email = m.email || dbEmails[m.roll_number] || rollToEmail(m.roll_number)
      return { name: m.name, email, roll: m.roll_number }
    }).filter(m => m.email && m.email.includes('@'))

    console.log('Emails to send:', emailList.map(m => m.email))

    if (emailList.length === 0) {
      return Response.json({ message: 'No valid emails', sent: 0 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projectspace.live'

    function buildHtml(memberName) {
      return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px;text-align:center">PS</div>
      <div style="font-size:11px;letter-spacing:3px;color:rgba(255,255,255,.5);margin-top:8px;text-transform:uppercase">Project Space</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px 24px">
      <div style="text-align:center;font-size:32px;margin-bottom:16px">🎉</div>
      <h1 style="font-size:20px;font-weight:700;color:#fff;text-align:center;margin:0 0 8px">Team Registered!</h1>
      <p style="font-size:14px;color:rgba(255,255,255,.5);text-align:center;margin:0 0 24px">Hi ${memberName || 'Team Member'}, your team has been registered for Project Space Hackathon 2026.</p>
      <div style="background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Team</div>
        <div style="font-size:16px;font-weight:700;color:#fd1c00">${teamNumber}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Project</div>
        <div style="font-size:14px;color:#fff;font-weight:600">${projectTitle || 'Untitled'}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Technology Track</div>
        <div style="font-size:14px;color:#EEA727">${technology}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Team Leader</div>
        <div style="font-size:14px;color:rgba(255,255,255,.7)">${leaderName || 'Your Leader'}</div>
      </div>
      <div style="text-align:center">
        <a href="${appUrl}/auth/login" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">Login to Dashboard</a>
      </div>
      <p style="font-size:11px;color:rgba(255,255,255,.25);text-align:center;margin-top:20px">
        May 6–12, 2026 · Aditya University<br/>Do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`
    }

    let sent = 0
    for (const m of emailList) {
      try {
        var mailOptions = {
          from: `"Project Space" <${process.env.GMAIL_USER}>`,
          to: m.email,
          subject: `🎉 Team ${teamNumber} Registered — ${projectTitle} | Project Space`,
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

    // Send notification to mentor if assigned
    if (mentorName) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yiwyfhdzgvlsmdeshdgv.supabase.co',
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
        const { data: mentor } = await supabase
          .from('mentors')
          .select('email, name')
          .eq('name', mentorName)
          .single()

        if (mentor?.email) {
          // Count how many teams this mentor has and how many registered
          const { data: mentorTeams } = await supabase
            .from('teams')
            .select('serial_number, registered')
            .eq('mentor_assigned', mentorName)
          
          const totalAssigned = mentorTeams?.length || 0
          const { data: registeredTeams } = await supabase
            .from('team_registrations')
            .select('serial_number')
            .in('serial_number', (mentorTeams || []).map(t => t.serial_number))
          
          const totalRegistered = registeredTeams?.length || 0
          const allDone = totalRegistered === totalAssigned && totalAssigned > 0
          const progressText = `${totalRegistered} of ${totalAssigned} teams registered`
          const progressColor = allDone ? '#4ade80' : '#EEA727'
          const progressBg = allDone ? 'rgba(74,222,128,.06)' : 'rgba(238,167,39,.06)'
          const progressBorder = allDone ? 'rgba(74,222,128,.15)' : 'rgba(238,167,39,.15)'
          const progressEmoji = allDone ? '🎉' : '📊'

          const mentorHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px;text-align:center">PS</div>
      <div style="font-size:11px;letter-spacing:3px;color:rgba(255,255,255,.5);margin-top:8px;text-transform:uppercase">Project Space</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px 24px">
      <h1 style="font-size:20px;font-weight:700;color:#fff;text-align:center;margin:0 0 8px">${allDone ? 'All Teams Registered! 🎉' : 'New Team Registered!'}</h1>
      <p style="font-size:14px;color:rgba(255,255,255,.5);text-align:center;margin:0 0 20px">Hi ${mentor.name || mentorName}, a team assigned to you has completed registration.</p>
      
      <div style="background:${progressBg};border:1px solid ${progressBorder};border-radius:10px;padding:12px 16px;margin-bottom:20px;text-align:center">
        <div style="font-size:13px;color:${progressColor};font-weight:600">${progressEmoji} ${progressText}</div>
        <div style="margin-top:8px;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden">
          <div style="height:100%;border-radius:3px;background:${progressColor};width:${totalAssigned > 0 ? Math.round(totalRegistered/totalAssigned*100) : 0}%"></div>
        </div>
      </div>

      <div style="background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Team</div>
        <div style="font-size:16px;font-weight:700;color:#fd1c00">${teamNumber}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Project</div>
        <div style="font-size:14px;color:#fff;font-weight:600">${projectTitle || 'Untitled'}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Technology Track</div>
        <div style="font-size:14px;color:#EEA727">${technology}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Team Leader</div>
        <div style="font-size:14px;color:rgba(255,255,255,.7)">${leaderName || 'Leader'}</div>
        <div style="margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Team Size</div>
        <div style="font-size:14px;color:rgba(255,255,255,.7)">${members.length} members</div>
      </div>
      <p style="font-size:11px;color:rgba(255,255,255,.25);text-align:center;margin-top:20px">May 6–12, 2026 · Aditya University<br/>Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`
          await transporter.sendMail({
            from: `"Project Space" <${process.env.GMAIL_USER}>`,
            to: mentor.email,
            subject: `📋 Team ${teamNumber} Registered — ${projectTitle} | Project Space`,
            html: mentorHtml
          })
          console.log('✅ Mentor notified:', mentor.email)
        }
      } catch (mentorErr) {
        console.error('Mentor notify error:', mentorErr.message)
      }
    }

    return Response.json({ sent, total: emailList.length })

  } catch (err) {
    console.error('NOTIFY ERROR:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}