// Team leader deletes the team PPT.
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { rollNumber } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    const { data: team } = await supabase
      .from('teams').select('team_number').eq('leader_roll', roll).maybeSingle()
    if (!team) return Response.json({ ok: false, error: 'Only the team leader can delete the PPT' }, { status: 403 })

    const { data: ppt } = await supabase
      .from('team_ppts').select('id, storage_path').eq('team_number', team.team_number).maybeSingle()
    if (!ppt) return Response.json({ ok: false, error: 'No PPT to delete' }, { status: 404 })

    await supabase.storage.from('team-uploads').remove([ppt.storage_path]).catch(() => {})
    await supabase.from('team_ppts').delete().eq('id', ppt.id)

    return Response.json({ ok: true, message: 'PPT deleted' })
  } catch (err) {
    console.error('[ppt/delete] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}