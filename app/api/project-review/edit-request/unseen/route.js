import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { rollNumber, markSeen } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    const { data: unseen } = await supabase
      .from('project_review_edit_requests')
      .select('id, team_number, status, mentor_notes, reviewed_by_mentor_name, reviewed_at, field_changes')
      .eq('requested_by_roll', roll)
      .in('status', ['approved', 'rejected'])
      .is('student_seen_at', null)
      .order('reviewed_at', { ascending: false })

    if (markSeen && unseen && unseen.length > 0) {
      const ids = unseen.map(r => r.id)
      await supabase
        .from('project_review_edit_requests')
        .update({ student_seen_at: new Date().toISOString() })
        .in('id', ids)
    }

    return Response.json({ ok: true, unseen: unseen || [] })
  } catch (err) {
    console.error('[edit-request/unseen] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}