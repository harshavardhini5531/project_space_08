import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(e => e.trim().toLowerCase())

export async function POST(request) {
  try {
    const { adminEmail } = await request.json().catch(() => ({}))
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: submissions } = await supabase
      .from('mentor_project_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })

    return Response.json({ ok: true, submissions: submissions || [] })
  } catch (err) {
    console.error('[admin mentor-submissions] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}