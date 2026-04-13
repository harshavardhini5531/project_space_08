// app/api/milestones/submit-review/route.js
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
})

export async function POST(request) {
  try {
    const { teamNumber, stageNumber, submittedByRoll, submittedByName } = await request.json()

    if (!teamNumber || !stageNumber || !submittedByRoll) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Verify team exists
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, team_number, mentor_assigned, technology')
      .eq('team_number', teamNumber)
      .single()

    if (teamErr || !team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // 2. Check previous stage is completed (unless stage 1)
    if (stageNumber > 1) {
      const { data: prevStage } = await supabase
        .from('milestone_submissions')
        .select('status')
        .eq('team_number', teamNumber)
        .eq('stage_number', stageNumber - 1)
        .single()

      if (!prevStage || prevStage.status !== 'completed') {
        return Response.json({ error: `Stage ${stageNumber - 1} must be completed first` }, { status: 400 })
      }
    }

    // 3. Check current stage isn't already in-review or completed
    const { data: current } = await supabase
      .from('milestone_submissions')
      .select('status')
      .eq('team_number', teamNumber)
      .eq('stage_number', stageNumber)
      .single()

    if (current?.status === 'in-review') {
      return Response.json({ error: 'This stage is already in review' }, { status: 400 })
    }
    if (current?.status === 'completed') {
      return Response.json({ error: 'This stage is already completed' }, { status: 400 })
    }

    // 4. Get stage name
    const { data: stageInfo } = await supabase
      .from('milestone_stages')
      .select('stage_name')
      .eq('stage_number', stageNumber)
      .single()

    const stageName = stageInfo?.stage_name || `Stage ${stageNumber}`

    // 5. Update submission to in-review
    const { error: updateErr } = await supabase
      .from('milestone_submissions')
      .update({
        status: 'in-review',
        submitted_by_roll: submittedByRoll,
        submitted_by_name: submittedByName || submittedByRoll,
        submitted_at: new Date().toISOString(),
      })
      .eq('team_number', teamNumber)
      .eq('stage_number', stageNumber)

    if (updateErr) throw updateErr

    // 6. Get mentor email
    let mentorEmail = null
    let mentorName = team.mentor_assigned || 'Mentor'
    if (team.mentor_assigned) {
      const { data: mentor } = await supabase
        .from('mentors')
        .select('email, name, phone')
        .eq('name', team.mentor_assigned)
        .single()
      if (mentor) {
        mentorEmail = mentor.email
        mentorName = mentor.name
      }
    }

    // 7. Create notifications
    const notifications = []

    // Notification for mentor
    if (mentorEmail) {
      notifications.push({
        recipient_type: 'mentor',
        recipient_email: mentorEmail,
        team_number: teamNumber,
        stage_number: stageNumber,
        title: `${teamNumber} marked ${stageName} for review`,
        message: `Team ${teamNumber} has completed Stage ${stageNumber}: ${stageName} and is requesting your review. Submitted by ${submittedByName || submittedByRoll}.`,
        type: 'review-request',
      })
    }

    // Notification for admin
    notifications.push({
      recipient_type: 'admin',
      recipient_email: 'admin',
      team_number: teamNumber,
      stage_number: stageNumber,
      title: `${teamNumber} → Stage ${stageNumber}: ${stageName}`,
      message: `Team ${teamNumber} marked ${stageName} for review. Mentor: ${mentorName}`,
      type: 'review-request',
    })

    if (notifications.length > 0) {
      await supabase.from('milestone_notifications').insert(notifications)
    }

    // 8. Send email to mentor
    if (mentorEmail) {
      try {
        await transporter.sendMail({
          from: `"Project Space" <${process.env.GMAIL_USER}>`,
          to: mentorEmail,
          subject: `🔔 Review Request: ${teamNumber} — Stage ${stageNumber}: ${stageName}`,
          html: `
            <div style="font-family:'DM Sans',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;background:#0d0a14;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#fd1c00,#c41600);padding:18px 24px">
                <h2 style="margin:0;color:#fff;font-size:16px;font-weight:700">📋 Stage Review Request</h2>
                <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px">Project Space · Milestone Tracking</p>
              </div>
              <div style="padding:24px;color:#e8e0f0">
                <p style="font-size:14px;margin:0 0 16px">Hello <strong>${mentorName}</strong>,</p>
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:16px;margin-bottom:16px">
                  <div style="font-size:12px;color:#8a7f96;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Team</div>
                  <div style="font-size:18px;font-weight:700;color:#fd1c00;margin-bottom:12px">${teamNumber}</div>
                  <div style="font-size:12px;color:#8a7f96;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Stage Submitted</div>
                  <div style="font-size:16px;font-weight:600;color:#fff">Stage ${stageNumber}: ${stageName}</div>
                  <div style="font-size:12px;color:#8a7f96;margin-top:8px">Submitted by: ${submittedByName || submittedByRoll}</div>
                  <div style="font-size:12px;color:#8a7f96">Technology: ${team.technology}</div>
                </div>
                <p style="font-size:13px;color:#8a7f96;margin:0">Please visit the team to verify completion and mark it as approved in your mentor dashboard.</p>
              </div>
              <div style="padding:12px 24px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#4a4258;text-align:center">
                Project Space · Technical Hub · Aditya University
              </div>
            </div>
          `
        })
        console.log(`✅ Milestone review email sent to ${mentorEmail}`)
      } catch (emailErr) {
        console.error('Email error:', emailErr)
        // Don't fail the request if email fails
      }
    }

    return Response.json({
      success: true,
      message: `Stage ${stageNumber}: ${stageName} marked for review`,
      mentorNotified: !!mentorEmail,
    })

  } catch (err) {
    console.error('Submit review error:', err)
    return Response.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}