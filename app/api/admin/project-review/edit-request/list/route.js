// Student fetches their team's edit requests (history + pending)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { rollNumber } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    const { data: tm } = await supabase
      .from('team_members')
      .select('team_number')
      .eq('roll_number', roll)
      .maybeSingle()
    if (!tm?.team_number) return Response.json({ ok: true, requests: [] })

    const { data: requests } = await supabase
      .from('project_review_edit_requests')
      .select('*')
      .eq('team_number', tm.team_number)
      .order('created_at', { ascending: false })

    return Response.json({ ok: true, team_number: tm.team_number, requests: requests || [] })
  } catch (err) {
    console.error('[edit-request/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}