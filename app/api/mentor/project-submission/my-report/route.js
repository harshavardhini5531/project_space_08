import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { mentorEmail } = await request.json().catch(() => ({}))
    if (!mentorEmail) return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })

    const { data: mentor } = await supabase
      .from('mentors').select('id, name, email').eq('email', mentorEmail.toLowerCase()).maybeSingle()
    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 401 })

    const { data: submission } = await supabase
      .from('mentor_project_submissions')
      .select('*')
      .eq('mentor_email', mentor.email)
      .maybeSingle()

    return Response.json({ ok: true, mentor, submission: submission || null })
  } catch (err) {
    console.error('[mentor my-report] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}