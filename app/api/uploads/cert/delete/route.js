// Student deletes one of their own certificates.
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { rollNumber, certType } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll || !certType) return Response.json({ ok: false, error: 'rollNumber and certType required' }, { status: 400 })

    const { data: cert } = await supabase
      .from('team_certificates')
      .select('id, storage_path')
      .eq('roll_number', roll)
      .eq('cert_type', certType)
      .maybeSingle()
    if (!cert) return Response.json({ ok: false, error: 'Certificate not found' }, { status: 404 })

    await supabase.storage.from('team-uploads').remove([cert.storage_path]).catch(() => {})
    await supabase.from('team_certificates').delete().eq('id', cert.id)

    return Response.json({ ok: true, message: 'Certificate deleted' })
  } catch (err) {
    console.error('[cert/delete] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}