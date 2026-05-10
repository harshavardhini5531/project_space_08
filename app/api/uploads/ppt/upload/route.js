// Team leader uploads project PPT (PPTX only, max 10 MB).
import { supabase } from '@/lib/supabase'

const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const rollNumber = (formData.get('rollNumber') || '').toString().trim().toUpperCase()

    if (!file || !rollNumber) return Response.json({ ok: false, error: 'file, rollNumber required' }, { status: 400 })

    const fileName = (file.name || '').toLowerCase()
    if (!fileName.endsWith('.pptx') && !fileName.endsWith('.ppt')) {
      return Response.json({ ok: false, error: 'Only PPTX/PPT allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ ok: false, error: `File too large. Max 10 MB. Yours: ${(file.size / 1024 / 1024).toFixed(2)} MB` }, { status: 400 })
    }

    // Verify user is the team leader
    const { data: team } = await supabase
      .from('teams')
      .select('team_number, leader_roll, project_title')
      .eq('leader_roll', rollNumber)
      .maybeSingle()
    if (!team) return Response.json({ ok: false, error: 'Only the team leader can upload the PPT' }, { status: 403 })

    const { data: tm } = await supabase
      .from('team_members')
      .select('short_name')
      .eq('roll_number', rollNumber)
      .maybeSingle()

    const ext = fileName.split('.').pop()
    const path = `ppts/${team.team_number}/project.${ext}`

    const { data: existing } = await supabase
      .from('team_ppts')
      .select('storage_path')
      .eq('team_number', team.team_number)
      .maybeSingle()
    if (existing?.storage_path && existing.storage_path !== path) {
      await supabase.storage.from('team-uploads').remove([existing.storage_path]).catch(() => {})
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadErr } = await supabase.storage
      .from('team-uploads')
      .upload(path, buffer, { contentType: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation', upsert: true })
    if (uploadErr) {
      console.error('[ppt/upload] storage error:', uploadErr)
      return Response.json({ ok: false, error: 'Upload failed', detail: uploadErr.message }, { status: 500 })
    }

    const { error: dbErr } = await supabase
      .from('team_ppts')
      .upsert({
        team_number: team.team_number,
        uploaded_by_roll: rollNumber,
        uploaded_by_name: tm?.short_name || null,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: existing ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'team_number' })
    if (dbErr) {
      console.error('[ppt/upload] db error:', dbErr)
      return Response.json({ ok: false, error: 'DB save failed', detail: dbErr.message }, { status: 500 })
    }

    return Response.json({ ok: true, message: 'PPT uploaded', path })
  } catch (err) {
    console.error('[ppt/upload] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

export const config = { api: { bodyParser: false } }