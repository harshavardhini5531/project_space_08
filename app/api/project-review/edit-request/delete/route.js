// Student deletes their own pending edit request.
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { rollNumber, requestId } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll || !requestId) return Response.json({ ok: false, error: 'rollNumber and requestId required' }, { status: 400 })

    const { data: req } = await supabase.from('project_review_edit_requests').select('id, team_number, requested_by_roll, status').eq('id', requestId).maybeSingle()
    if (!req) return Response.json({ ok: false, error: 'Request not found' }, { status: 404 })

    if ((req.requested_by_roll || '').toUpperCase() !== roll) {
      return Response.json({ ok: false, error: 'You can only delete your own requests' }, { status: 403 })
    }
    if (req.status !== 'pending') {
      return Response.json({ ok: false, error: `Cannot delete a ${req.status} request` }, { status: 409 })
    }

    const { error: delErr } = await supabase.from('project_review_edit_requests').delete().eq('id', requestId)
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