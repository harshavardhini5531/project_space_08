// Mentor approves or rejects an edit request.
// On approval: updates project_review_submissions, resets review state, syncs to Dev API.
import { supabase } from '@/lib/supabase'
import { syncSubmissionToDevApi } from '@/lib/dev-api-sync'

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
      .from('mentors').select('id, name, email').eq('email', mentorEmail).maybeSingle()
    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })

    const { data: req } = await supabase
      .from('project_review_edit_requests').select('*').eq('id', requestId).maybeSingle()
    if (!req) return Response.json({ ok: false, error: 'Request not found' }, { status: 404 })
    if (req.status !== 'pending') {
      return Response.json({ ok: false, error: `Request already ${req.status}` }, { status: 409 })
    }

    const { data: team } = await supabase
      .from('teams').select('team_number, mentor_assigned, project_title').eq('team_number', req.team_number).maybeSingle()
    if (!team || team.mentor_assigned !== mentor.name) {
      return Response.json({ ok: false, error: 'Not authorized for this team' }, { status: 403 })
    }

    // ─── REJECT PATH ───
    if (action === 'reject') {
      const { error: rejErr } = await supabase
        .from('project_review_edit_requests')
        .update({
          status: 'rejected',
          reviewed_by_mentor_id: mentor.id,
          reviewed_by_mentor_name: mentor.name,
          reviewed_at: new Date().toISOString(),
          mentor_notes: (notes || '').trim() || null,
        })
        .eq('id', requestId)

      if (rejErr) {
        console.error('[edit-requests/respond] reject error:', rejErr)
        return Response.json({ ok: false, error: 'Failed to reject', detail: rejErr.message }, { status: 500 })
      }

      // Notify student (non-blocking)
      try {
        const { data: studentRow } = await supabase
          .from('students').select('email').eq('roll_number', req.requested_by_roll).maybeSingle()
        if (studentRow?.email) {
          const { sendPushNotification } = await import('@/lib/pushNotifications')
          await sendPushNotification({
            recipientEmail: studentRow.email, recipientType: 'student',
            title: 'Edit Request Rejected',
            body: `Your edit request for ${team.project_title || req.team_number} was rejected.`,
            url: '/dashboard', type: 'edit-request-rejected', teamNumber: req.team_number,
          }).catch(() => {})
        }
      } catch {}

      return Response.json({ ok: true, message: 'Request rejected', status: 'rejected' })
    }

    // ─── APPROVE PATH ───
    // Build update payload from field_changes (NO dev_api_sync_status — column doesn't exist)
    const updatePayload = {}
    for (const ch of (req.field_changes || [])) {
      updatePayload[ch.field] = ch.new_value
    }
    // Reset Dev API sync state (only the column that exists)
    updatePayload.dev_api_synced_at = null
    // Reset review state so AI re-reviews on next batch run
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

    // Sync to Dev API (non-blocking)
    let devSyncStatus = 'queued'
    try {
      const result = await syncSubmissionToDevApi(updatedSub).catch(() => null)
      if (result?.ok) devSyncStatus = 'synced'
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
          body: `Your edit request for ${team.project_title || req.team_number} was approved. Updates take effect on the next AI review.`,
          url: '/dashboard', type: 'edit-request-approved', teamNumber: req.team_number,
        }).catch(() => {})
      }
    } catch {}

    return Response.json({
      ok: true,
      message: 'Request approved. Submission updated and queued for the next AI run.',
      status: 'approved',
      dev_sync: devSyncStatus,
    })
  } catch (err) {
    console.error('[mentor edit-requests/respond] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}