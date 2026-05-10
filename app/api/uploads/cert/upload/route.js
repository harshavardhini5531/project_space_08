// Student uploads a certificate (PDF/PNG/JPG, max 1MB).
import { supabase } from '@/lib/supabase'

const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const VALID_TYPES = ['agent_skills', 'api', 'mcp', 'code_in_action']

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const rollNumber = (formData.get('rollNumber') || '').toString().trim().toUpperCase()
    const certType = (formData.get('certType') || '').toString().trim()

    if (!file || !rollNumber || !certType) {
      return Response.json({ ok: false, error: 'file, rollNumber, certType required' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(certType)) {
      return Response.json({ ok: false, error: `Invalid certType. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return Response.json({ ok: false, error: 'Only PDF, PNG, JPG allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ ok: false, error: `File too large. Max 2 MB. Yours: ${(file.size / 1024 / 1024).toFixed(2)} MB` }, { status: 400 })
    }

    // Verify user is a team member
    const { data: tm } = await supabase
      .from('team_members')
      .select('team_number, short_name')
      .eq('roll_number', rollNumber)
      .maybeSingle()
    if (!tm?.team_number) {
      return Response.json({ ok: false, error: 'You are not in a team' }, { status: 403 })
    }

    // Build path: certs/PS-XXX/ROLL/cert_type.ext
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `certs/${tm.team_number}/${rollNumber}/${certType}.${ext}`

    // Delete previous version (if exists)
    const { data: existing } = await supabase
      .from('team_certificates')
      .select('storage_path')
      .eq('roll_number', rollNumber)
      .eq('cert_type', certType)
      .maybeSingle()
    if (existing?.storage_path) {
      await supabase.storage.from('team-uploads').remove([existing.storage_path]).catch(() => {})
    }

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabase.storage
      .from('team-uploads')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (uploadErr) {
      console.error('[cert/upload] storage error:', uploadErr)
      return Response.json({ ok: false, error: 'Upload failed', detail: uploadErr.message }, { status: 500 })
    }

    // Upsert record
    const { error: dbErr } = await supabase
      .from('team_certificates')
      .upsert({
        team_number: tm.team_number,
        roll_number: rollNumber,
        short_name: tm.short_name || null,
        cert_type: certType,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      }, { onConflict: 'roll_number,cert_type' })

    if (dbErr) {
      console.error('[cert/upload] db error:', dbErr)
      return Response.json({ ok: false, error: 'DB save failed', detail: dbErr.message }, { status: 500 })
    }

    return Response.json({ ok: true, message: 'Certificate uploaded', path })
  } catch (err) {
    console.error('[cert/upload] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

export const config = { api: { bodyParser: false } }