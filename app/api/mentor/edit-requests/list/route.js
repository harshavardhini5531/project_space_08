// Mentor fetches all edit requests for their assigned teams (or for one team)
import { createClient } from '@supabase/supabase-js'

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

    const { mentorEmail, teamNumber, statusFilter } = await request.json().catch(() => ({}))
    if (!mentorEmail) return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })

    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email')
      .eq('email', mentorEmail)
      .maybeSingle()
    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })

    // Get all team_numbers assigned to this mentor
    const { data: teams } = await supabase
      .from('teams')
      .select('team_number')
      .eq('mentor_assigned', mentor.name)
    const teamNumbers = (teams || []).map(t => t.team_number).filter(Boolean)

    if (teamNumbers.length === 0) {
      return Response.json({ ok: true, requests: [], counts: { pending: 0, approved: 0, rejected: 0 } })
    }

    // Build query
    let query = supabase
      .from('project_review_edit_requests')
      .select('*')
      .in('team_number', teamNumbers)
      .order('created_at', { ascending: false })

    if (teamNumber) query = query.eq('team_number', teamNumber)
    if (statusFilter) query = query.eq('status', statusFilter)

    const { data: requests } = await query

    const counts = { pending: 0, approved: 0, rejected: 0 }
    ;(requests || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })

    return Response.json({ ok: true, requests: requests || [], counts })
  } catch (err) {
    console.error('[mentor edit-requests/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}