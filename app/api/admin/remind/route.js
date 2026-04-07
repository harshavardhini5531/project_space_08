import { supabase } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'
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
    const token = request.headers.get('x-admin-token')
    if (!token || !token.startsWith('admin_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()
    // type: 'all-pending' or 'specific' with serialNumbers array

    // Get all teams
    const { data: teams } = await supabase.from('teams').select('serial_number, technology, leader_roll, mentor_assigned, project_title')
    const { data: regs } = await supabase.from('team_registrations').select('serial_number')
    const registeredSet = new Set((regs || []).map(r => r.serial_number))

    // Filter unregistered teams
    const pendingTeams = (teams || []).filter(t => !registeredSet.has(t.serial_number))

    if (pendingTeams.length === 0) {
      return Response.json({ message: 'All teams are registered!', sent: 0 })
    }

    // Get leader emails
    const leaderRolls = pendingTeams.map(t => t.leader_roll).filter(Boolean)
    let leaderEmails = {}
    if (leaderRolls.length > 0) {
      const { data: students } = await supabase.from('students').select('roll_number, name, email').in('roll_number', leaderRolls)
      if (students) students.forEach(s => { leaderEmails[s.roll_number] = { name: s.name, email: s.email || rollToEmail(s.roll_number) } })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projectspace.technicalhub.io'
    let sent = 0

    for (const team of pendingTeams) {
      const leader = leaderEmails[team.leader_roll]
      if (!leader?.email) continue

      try {
        await transporter.sendMail({
          from: `"Project Space" <${process.env.GMAIL_USER}>`,
          to: leader.email,
          subject: `⏰ Reminder: Register Your Team — ${team.project_title || 'Project Space'} | Project Space`,
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050008;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:20px">
      <div style="display:inline-block;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;font-weight:700;font-size:14px;line-height:44px">PS</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">⏰</div>
      <h2 style="color:#fff;font-size:18px;margin:0 0 8px">Registration Reminder</h2>
      <p style="color:rgba(255,255,255,.5);font-size:13px;margin:0 0 20px">Hi ${leader.name || 'Team Leader'}, your team hasn't registered yet for Project Space Hackathon 2026.</p>
      <div style="background:rgba(238,167,39,.06);border:1px solid rgba(238,167,39,.15);border-radius:10px;padding:14px;margin-bottom:20px;text-align:left">
        <div style="font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Project</div>
        <div style="font-size:14px;color:#EEA727;font-weight:600">${team.project_title || 'Not set'}</div>
        <div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">Technology</div>
        <div style="font-size:13px;color:rgba(255,255,255,.7)">${team.technology}</div>
      </div>
      <a href="${appUrl}/auth/register" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">Register Now →</a>
      <p style="color:rgba(255,255,255,.25);font-size:11px;margin-top:20px">Event: May 6–12, 2026 · Aditya University</p>
    </div>
  </div>
</body>
</html>`
        })
        sent++
        console.log('📧 Reminder sent to', leader.email)
      } catch (err) {
        console.error('Reminder failed for', leader.email, err.message)
      }
    }

    return Response.json({ sent, total: pendingTeams.length, message: `Reminders sent to ${sent} team leaders` })

  } catch (err) {
    console.error('Remind error:', err)
    return Response.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}