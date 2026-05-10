// List a student's own certificates (returns 4 slots with status).
import { supabase } from '@/lib/supabase'

const SLOTS = [
  { type: 'agent_skills', label: 'Introduction to Agent Skills' },
  { type: 'api', label: 'Building with the Claude API' },
  { type: 'mcp', label: 'Introduction to Model Context Protocol' },
  { type: 'code_in_action', label: 'Claude Code in Action' },
]

export async function POST(request) {
  try {
    const { rollNumber } = await request.json().catch(() => ({}))
    const roll = (rollNumber || '').trim().toUpperCase()
    if (!roll) return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })

    const { data: certs } = await supabase
      .from('team_certificates')
      .select('cert_type, file_name, file_size, mime_type, uploaded_at, storage_path')
      .eq('roll_number', roll)

    const certsByType = {}
    ;(certs || []).forEach(c => { certsByType[c.cert_type] = c })

    // Generate signed URLs for each existing cert
    const slots = await Promise.all(SLOTS.map(async slot => {
      const cert = certsByType[slot.type]
      if (!cert) return { ...slot, uploaded: false }
      const { data: signed } = await supabase.storage
        .from('team-uploads')
        .createSignedUrl(cert.storage_path, 3600)
      return {
        ...slot,
        uploaded: true,
        file_name: cert.file_name,
        file_size: cert.file_size,
        mime_type: cert.mime_type,
        uploaded_at: cert.uploaded_at,
        url: signed?.signedUrl || null,
      }
    }))

    const uploadedCount = slots.filter(s => s.uploaded).length
    return Response.json({ ok: true, slots, uploaded_count: uploadedCount, total: SLOTS.length })
  } catch (err) {
    console.error('[cert/list] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}