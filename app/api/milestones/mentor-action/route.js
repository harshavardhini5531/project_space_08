// app/api/milestones/mentor-action/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { teamNumber, stageNumber, action, mentorEmail, mentorName, comment } = await request.json()

    if (!teamNumber || !stageNumber || !action || !mentorEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Action must be approve or reject' }, { status: 400 })
    }

    // 1. Verify the stage is in-review
    const { data: submission, error: subErr } = await supabase
      .from('milestone_submissions')
      .select('*')
      .eq('team_number', teamNumber)
      .eq('stage_number', stageNumber)
      .single()

    if (subErr || !submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'in-review') {
      return Response.json({ error: `Stage is ${submission.status}, not in-review` }, { status: 400 })
    }

    // 2. Get stage info for credits
    const { data: stageInfo } = await supabase
      .from('milestone_stages')
      .select('stage_name, credits_reward')
      .eq('stage_number', stageNumber)
      .single()

    const stageName = stageInfo?.stage_name || `Stage ${stageNumber}`

    if (action === 'approve') {
      // 3a. Mark as completed
      const { error: updateErr } = await supabase
        .from('milestone_submissions')
        .update({
          status: 'completed',
          reviewed_by_email: mentorEmail,
          reviewed_by_name: mentorName || mentorEmail,
          reviewed_at: new Date().toISOString(),
          mentor_comment: comment || null,
          credits_earned: stageInfo?.credits_reward || 5,
        })
        .eq('team_number', teamNumber)
        .eq('stage_number', stageNumber)

      if (updateErr) throw updateErr

      // 4a. Award credits to team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('team_number', teamNumber)
        .single()

      // 5a. Create notification for student
      await supabase.from('milestone_notifications').insert({
        recipient_type: 'student',
        recipient_email: submission.submitted_by_roll,
        team_number: teamNumber,
        stage_number: stageNumber,
        title: `Stage ${stageNumber}: ${stageName} — Approved ✓`,
        message: `${mentorName || 'Your mentor'} has approved ${stageName}.${comment ? ` Comment: "${comment}"` : ''} You earned ${stageInfo?.credits_reward || 5} credits! ${stageNumber < 7 ? `Stage ${stageNumber + 1} is now unlocked.` : 'All stages complete! 🎉'}`,
        type: 'approved',
      })

      // 6a. Notification for admin
      await supabase.from('milestone_notifications').insert({
        recipient_type: 'admin',
        recipient_email: 'admin',
        team_number: teamNumber,
        stage_number: stageNumber,
        title: `${teamNumber} — ${stageName} approved by ${mentorName || mentorEmail}`,
        message: `Stage ${stageNumber} completed. ${stageNumber === 7 ? '🏆 All stages done!' : ''}`,
        type: 'approved',
      })

      return Response.json({
        success: true,
        message: `Stage ${stageNumber}: ${stageName} approved`,
        credits_awarded: stageInfo?.credits_reward || 5,
        next_stage_unlocked: stageNumber < 7 ? stageNumber + 1 : null,
        all_complete: stageNumber === 7,
      })

    } else {
      // 3b. Mark as rejected (back to pending so student can re-submit)
      const { error: updateErr } = await supabase
        .from('milestone_submissions')
        .update({
          status: 'pending',
          reviewed_by_email: mentorEmail,
          reviewed_by_name: mentorName || mentorEmail,
          reviewed_at: new Date().toISOString(),
          mentor_comment: comment || 'Needs more work',
          submitted_at: null,
          submitted_by_roll: null,
          submitted_by_name: null,
        })
        .eq('team_number', teamNumber)
        .eq('stage_number', stageNumber)

      if (updateErr) throw updateErr

      // 4b. Notify student
      await supabase.from('milestone_notifications').insert({
        recipient_type: 'student',
        recipient_email: submission.submitted_by_roll,
        team_number: teamNumber,
        stage_number: stageNumber,
        title: `Stage ${stageNumber}: ${stageName} — Needs Revision`,
        message: `${mentorName || 'Your mentor'} has sent ${stageName} back for revision. Comment: "${comment || 'Needs more work'}"`,
        type: 'rejected',
      })

      // 5b. Notify admin
      await supabase.from('milestone_notifications').insert({
        recipient_type: 'admin',
        recipient_email: 'admin',
        team_number: teamNumber,
        stage_number: stageNumber,
        title: `${teamNumber} — ${stageName} rejected by ${mentorName || mentorEmail}`,
        message: comment || 'Needs more work',
        type: 'rejected',
      })

      return Response.json({
        success: true,
        message: `Stage ${stageNumber}: ${stageName} sent back for revision`,
      })
    }

  } catch (err) {
    console.error('Mentor action error:', err)
    return Response.json({ error: 'Failed to process action' }, { status: 500 })
  }
}