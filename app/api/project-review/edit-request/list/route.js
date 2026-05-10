// Student fetches their team's edit request history. Any team member can view.
import { supabase } from '@/lib/supabase'

const MAX_PENDING_PER_TEAM = 3

export async function POST(request) {
  try {
    const { rollNumber } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    const { data: tm } = await supabase.from('team_members').select('team_number, is_leader').eq('roll_number', roll).maybeSingle()
    if (!tm?.team_number) return Response.json({ ok: true, requests: [], pending_count: 0, is_leader: false, limit: MAX_PENDING_PER_TEAM })

    const { data: team } = await supabase.from('teams').select('leader_roll').eq('team_number', tm.team_number).maybeSingle()
    const isLeader = !!team?.leader_roll && team.leader_roll.toUpperCase() === roll

    const { data: requests } = await supabase.from('project_review_edit_requests').select('*').eq('team_number', tm.team_number).order('created_at', { ascending: false })
    const pendingCount = (requests || []).filter(r => r.status === 'pending').length

    return Response.json({ ok: true, team_number: tm.team_number, is_leader: isLeader, requests: requests || [], pending_count: pendingCount, limit: MAX_PENDING_PER_TEAM })
  } catch (err) {
    console.error('[edit-request/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}