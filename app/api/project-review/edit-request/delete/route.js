// Student deletes their own pending edit request.
// Only the original requester can delete, and only if status is still 'pending'.
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function POST(request) {
  try {
    const supabase = getSupabase()
    const { rollNumber, requestId } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll || !requestId) {
      return Response.json({ ok: false, error: 'rollNumber and requestId required' }, { status: 400 })
    }

    // Find the request
    const { data: req } = await supabase
      .from('project_review_edit_requests')
      .select('id, team_number, requested_by_roll, status')
      .eq('id', requestId)
      .maybeSingle()

    if (!req) {
      return Response.json({ ok: false, error: 'Request not found' }, { status: 404 })
    }

    // Only the original requester can delete
    if ((req.requested_by_roll || '').toUpperCase() !== roll) {
      return Response.json({ ok: false, error: 'You can only delete your own requests' }, { status: 403 })
    }

    // Only pending requests can be deleted
    if (req.status !== 'pending') {
      return Response.json({ ok: false, error: `Cannot delete a ${req.status} request` }, { status: 409 })
    }

    // Delete
    const { error: delErr } = await supabase
      .from('project_review_edit_requests')
      .delete()
      .eq('id', requestId)

    if (delErr) {
      console.error('[edit-request/delete] error:', delErr)
      return Response.json({ ok: false, error: 'Failed to delete', detail: delErr.message }, { status: 500 })
    }

    return Response.json({ ok: true, message: 'Edit request deleted.' })
  } catch (err) {
    console.error('[edit-request/delete] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}