// Mentor approves or rejects an edit request
// On approval: updates project_review_submissions + queues Dev API sync
import { createClient } from '@supabase/supabase-js'
import { syncSubmissionToDevApi } from '@/lib/dev-api-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { mentorEmail, requestId, action, notes } = await request.json().catch(() => ({}))
    if (!mentorEmail || !requestId || !action) {
      return Response.json({ ok: false, error: 'mentorEmail, requestId, action required' }, { status: 400 })
    }
    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ ok: false, error: 'action must be approve or reject' }, { status: 400 })
    }

    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email')
      .eq('email', mentorEmail)
      .maybeSingle()
    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })

    const { data: req } = await supabase
      .from('project_review_edit_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()
    if (!req) return Response.json({ ok: false, error: 'Request not found' }, { status: 404 })
    if (req.status !== 'pending') {
      return Response.json({ ok: false, error: `Request already ${req.status}` }, { status: 409 })
    }

    // Verify mentor is assigned to this team
    const { data: team } = await supabase
      .from('teams')
      .select('team_number, mentor_assigned, project_title')
      .eq('team_number', req.team_number)
      .maybeSingle()
    if (!team || team.mentor_assigned !== mentor.name) {
      return Response.json({ ok: false, error: 'Not authorized for this team' }, { status: 403 })
    }

    if (action === 'reject') {
      await supabase
        .from('project_review_edit_requests')
        .update({
          status: 'rejected',
          reviewed_by_mentor_id: mentor.id,
          reviewed_by_mentor_name: mentor.name,
          reviewed_at: new Date().toISOString(),
          mentor_notes: (notes || '').trim() || null,
        })
        .eq('id', requestId)

      // Notify student
      try {
        const { data: studentRow } = await supabase
          .from('students').select('email').eq('roll_number', req.requested_by_roll).maybeSingle()
        if (studentRow?.email) {
          const { sendPushNotification } = await import('@/lib/pushNotifications')
          await sendPushNotification({
            recipientEmail: studentRow.email, recipientType: 'student',
            title: 'Edit Request Rejected',
            body: `Your edit request for ${team.project_title || req.team_number} was rejected by your mentor.`,
            url: '/dashboard?tab=project-review', type: 'edit-request-rejected', teamNumber: req.team_number,
          }).catch(() => {})
        }
      } catch {}

      return Response.json({ ok: true, message: 'Request rejected' })
    }

    // ─── APPROVE ───
    // Build update payload from field_changes
    const updatePayload = {}
    for (const ch of (req.field_changes || [])) {
      updatePayload[ch.field] = ch.new_value
    }
    // Reset Dev API sync state so it picks up the changes
    updatePayload.dev_api_synced_at = null
    updatePayload.dev_api_sync_status = 'pending'
    // Also reset reviewing state so AI re-reviews on next batch run
    updatePayload.status = 'pending'
    updatePayload.reviewing_started_at = null
    updatePayload.reviewed_at = null
    updatePayload.failure_reason = null
    updatePayload.retry_count = 0

    const { data: updatedSub, error: updateErr } = await supabase
      .from('project_review_submissions')
      .update(updatePayload)
      .eq('id', req.submission_id)
      .select('*')
      .single()

    if (updateErr) {
      console.error('[edit-requests/respond] update sub error:', updateErr)
      return Response.json({ ok: false, error: 'Failed to update submission', detail: updateErr.message }, { status: 500 })
    }

    // Mark request approved
    await supabase
      .from('project_review_edit_requests')
      .update({
        status: 'approved',
        reviewed_by_mentor_id: mentor.id,
        reviewed_by_mentor_name: mentor.name,
        reviewed_at: new Date().toISOString(),
        mentor_notes: (notes || '').trim() || null,
      })
      .eq('id', requestId)

    // Sync to Dev API (non-blocking — if it fails, cron picks it up later)
    try {
      await syncSubmissionToDevApi(updatedSub).catch(e => {
        console.error('[edit-requests/respond] dev sync (non-blocking) failed:', e?.message)
      })
    } catch (e) {
      console.error('[edit-requests/respond] dev sync threw:', e?.message)
    }

    // Notify student
    try {
      const { data: studentRow } = await supabase
        .from('students').select('email').eq('roll_number', req.requested_by_roll).maybeSingle()
      if (studentRow?.email) {
        const { sendPushNotification } = await import('@/lib/pushNotifications')
        await sendPushNotification({
          recipientEmail: studentRow.email, recipientType: 'student',
          title: 'Edit Request Approved ✓',
          body: `Your edit request for ${team.project_title || req.team_number} was approved. Updates will reflect in the next AI review run.`,
          url: '/dashboard?tab=project-review', type: 'edit-request-approved', teamNumber: req.team_number,
        }).catch(() => {})
      }
    } catch {}

    return Response.json({
      ok: true,
      message: 'Request approved. Submission updated and queued for Dev API sync.',
    })
  } catch (err) {
    console.error('[mentor edit-requests/respond] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}