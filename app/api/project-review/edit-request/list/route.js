// Student fetches their team's edit request history (any team member can see).
// Also returns pending count + leader-status for the requesting user.
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const MAX_PENDING_PER_TEAM = 3

export async function POST(request) {
  try {
    const supabase = getSupabase()
    const { rollNumber } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    // Find the team via team_members
    const { data: tm } = await supabase
      .from('team_members')
      .select('team_number, is_leader')
      .eq('roll_number', roll)
      .maybeSingle()

    if (!tm?.team_number) {
      return Response.json({ ok: true, requests: [], pending_count: 0, is_leader: false, limit: MAX_PENDING_PER_TEAM })
    }

    // Confirm leader via teams.leader_roll (more authoritative)
    const { data: team } = await supabase
      .from('teams')
      .select('leader_roll')
      .eq('team_number', tm.team_number)
      .maybeSingle()
    const isLeader = !!team?.leader_roll && team.leader_roll.toUpperCase() === roll

    const { data: requests } = await supabase
      .from('project_review_edit_requests')
      .select('*')
      .eq('team_number', tm.team_number)
      .order('created_at', { ascending: false })

    const pendingCount = (requests || []).filter(r => r.status === 'pending').length

    return Response.json({
      ok: true,
      team_number: tm.team_number,
      is_leader: isLeader,
      requests: requests || [],
      pending_count: pendingCount,
      limit: MAX_PENDING_PER_TEAM,
    })
  } catch (err) {
    console.error('[edit-request/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}