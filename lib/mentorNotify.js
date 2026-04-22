import { sendMail } from './mailer'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Subject + body templates per request type
const TEMPLATES = {
  'linkedin-reenable': {
    subject: (ctx) => `🔓 LinkedIn Re-enable Request from ${ctx.requesterName} (${ctx.teamNumber})`,
    pushTitle: 'LinkedIn Re-enable Request',
    pushBody: (ctx) => `${ctx.requesterName} from team ${ctx.teamNumber} wants to re-post on LinkedIn`,
    emailBody: (ctx) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:linear-gradient(135deg,#EEA727,#fd1c00);padding:24px;border-radius:12px 12px 0 0;color:#fff">
          <h2 style="margin:0;font-size:20px">🔓 LinkedIn Re-enable Request</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">A student needs to re-post on LinkedIn</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
          <p><strong>Student:</strong> ${ctx.requesterName} (${ctx.rollNumber})</p>
          <p><strong>Team:</strong> ${ctx.teamNumber}</p>
          <p><strong>Reason:</strong> <em>"${ctx.reason || 'No reason provided'}"</em></p>
          <p style="margin-top:16px">Please review this request in your mentor dashboard and approve or deny accordingly.</p>
          <a href="https://projectspace.technicalhub.io/mentor/dashboard" style="display:inline-block;margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#EEA727,#fd1c00);color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open Mentor Dashboard</a>
        </div>
      </div>
    `
  },
  'stage-review': {
    subject: (ctx) => `📋 Stage ${ctx.stageNumber} Review Request from Team ${ctx.teamNumber}`,
    pushTitle: 'Stage Review Request',
    pushBody: (ctx) => `Team ${ctx.teamNumber} submitted Stage ${ctx.stageNumber}: ${ctx.stageName} for review`,
    emailBody: (ctx) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:linear-gradient(135deg,#fd1c00,#c41600);padding:24px;border-radius:12px 12px 0 0;color:#fff">
          <h2 style="margin:0;font-size:20px">📋 Stage Review Request</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">A team is ready for mentor review</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
          <p><strong>Team:</strong> ${ctx.teamNumber}</p>
          <p><strong>Stage:</strong> ${ctx.stageNumber} - ${ctx.stageName}</p>
          <p><strong>Submitted by:</strong> ${ctx.submittedByName}</p>
          <p style="margin-top:16px">Please visit your team to review their progress on this stage.</p>
          <a href="https://projectspace.technicalhub.io/mentor/dashboard" style="display:inline-block;margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#fd1c00,#c41600);color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open Mentor Dashboard</a>
        </div>
      </div>
    `
  },
  'mentor-request': {
    subject: (ctx) => `🎓 New Mentor Request from Team ${ctx.teamNumber} (${ctx.priority || 'Normal'})`,
    pushTitle: 'New Mentor Request',
    pushBody: (ctx) => `Team ${ctx.teamNumber}: ${(ctx.issue || '').substring(0,80)}`,
    emailBody: (ctx) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
        <div style="background:linear-gradient(135deg,#7B2FBE,#fd1c00);padding:24px;border-radius:12px 12px 0 0;color:#fff">
          <h2 style="margin:0;font-size:20px">🎓 New Mentor Request</h2>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9">A team needs your help</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
          <p><strong>Team:</strong> ${ctx.teamNumber}</p>
          <p><strong>From:</strong> ${ctx.requesterName}</p>
          <p><strong>Priority:</strong> ${ctx.priority || 'Normal'}</p>
          <p><strong>Issue:</strong> ${ctx.issue || ''}</p>
          <a href="https://projectspace.technicalhub.io/mentor/dashboard" style="display:inline-block;margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#7B2FBE,#fd1c00);color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open Mentor Dashboard</a>
        </div>
      </div>
    `
  }
}

// Core notification function — used by all mentor request APIs
export async function notifyMentor({ type, mentorEmail, context = {}, origin = '' }) {
  if (!type || !mentorEmail) return { success: false, error: 'Missing type or mentorEmail' }
  const template = TEMPLATES[type]
  if (!template) return { success: false, error: `Unknown type: ${type}` }

  const results = { email: false, push: false }

  // 1. Send email
  try {
    await sendMail({
      from: process.env.GMAIL_USER || 'thubprojectspace@gmail.com',
      to: mentorEmail,
      subject: template.subject(context),
      html: template.emailBody(context)
    })
    results.email = true
  } catch (err) {
    console.error('[notifyMentor] Email failed:', err)
  }

  // 2. Send push notification (call API route server-side via direct DB + webpush)
  try {
    const pushRes = await fetch(`${origin || 'https://projectspace.technicalhub.io'}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        recipientEmail: mentorEmail,
        recipientType: 'mentor',
        title: template.pushTitle,
        body: template.pushBody(context),
        url: '/mentor/dashboard',
        type: type
      })
    })
    const pushData = await pushRes.json()
    results.push = pushData.success && pushData.sent > 0
  } catch (err) {
    console.error('[notifyMentor] Push failed:', err)
  }

  return { success: true, ...results }
}