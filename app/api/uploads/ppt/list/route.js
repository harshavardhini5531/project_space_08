// Get team's PPT (any member can view).
import { supabase } from '@/lib/supabase'

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
    if (!tm?.team_number) return Response.json({ ok: true, ppt: null, is_leader: false })

    const { data: team } = await supabase
      .from('teams')
      .select('leader_roll')
      .eq('team_number', tm.team_number)
      .maybeSingle()
    const isLeader = !!team?.leader_roll && team.leader_roll.toUpperCase() === roll

    const { data: ppt } = await supabase
      .from('team_ppts')
      .select('*')
      .eq('team_number', tm.team_number)
      .maybeSingle()

    let result = null
    if (ppt) {
      const { data: signed } = await supabase.storage
        .from('team-uploads')
        .createSignedUrl(ppt.storage_path, 3600)
      result = { ...ppt, url: signed?.signedUrl || null }
    }

    return Response.json({ ok: true, ppt: result, is_leader: isLeader, team_number: tm.team_number })
  } catch (err) {
    console.error('[ppt/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}