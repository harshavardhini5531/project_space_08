// app/api/admin/panel-assignments/route.js
//
// Admin endpoint for managing panel assignments + getting full project leaders view.
//
// GET   ?adminEmail=X                                       — list assignments + available mentors
// POST  { adminEmail, action:'assign', mentorEmail, panelName }
// POST  { adminEmail, action:'remove', mentorEmail }

import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

function isAdmin(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase())
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminEmail = searchParams.get('adminEmail')
    if (!isAdmin(adminEmail)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const [assignmentsRes, mentorsRes] = await Promise.all([
      supabase.from('panel_assignments').select('*').order('panel_name', { ascending: true }),
      supabase.from('mentors').select('id, name, email, technology, is_active').order('name', { ascending: true }),
    ])

    const assignments = assignmentsRes.data || []
    const mentors = (mentorsRes.data || []).filter(m => m.is_active !== false)

    const assignedEmails = new Set(assignments.map(a => a.mentor_email.toLowerCase()))
    const available = mentors.filter(m => !assignedEmails.has(m.email.toLowerCase()))

    // Group assignments by panel for display
    const byPanel = {}
    for (const a of assignments) {
      if (!byPanel[a.panel_name]) byPanel[a.panel_name] = []
      byPanel[a.panel_name].push(a)
    }

    return Response.json({
      ok: true,
      assignments,
      byPanel,
      availableMentors: available,
      allPanels: Object.keys(byPanel).sort(),
    })
  } catch (err) {
    console.error('[admin/panel-assignments GET] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { adminEmail, action } = body
    if (!isAdmin(adminEmail)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    if (action === 'assign') {
      const { mentorEmail, panelName } = body
      if (!mentorEmail || !panelName) {
        return Response.json({ ok: false, error: 'mentorEmail and panelName required' }, { status: 400 })
      }

      const { data: mentor } = await supabase
        .from('mentors')
        .select('id, name, email, is_active')
        .eq('email', mentorEmail.toLowerCase())
        .maybeSingle()
      if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })
      if (mentor.is_active === false) return Response.json({ ok: false, error: 'Mentor is inactive' }, { status: 400 })

      // Upsert (mentor_email is unique, so this swaps panel if already assigned)
      const { data: saved, error: saveErr } = await supabase
        .from('panel_assignments')
        .upsert({
          mentor_id: mentor.id,
          mentor_email: mentor.email.toLowerCase(),
          mentor_name: mentor.name,
          panel_name: panelName,
          assigned_by: adminEmail,
          is_active: true,
        }, { onConflict: 'mentor_email' })
        .select()
        .single()

      if (saveErr) {
        console.error('[panel-assignments assign] err:', saveErr)
        return Response.json({ ok: false, error: 'Could not assign', detail: saveErr.message }, { status: 500 })
      }
      return Response.json({ ok: true, assignment: saved })
    }

    if (action === 'remove') {
      const { mentorEmail } = body
      if (!mentorEmail) return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })

      const { error: delErr } = await supabase
        .from('panel_assignments')
        .delete()
        .eq('mentor_email', mentorEmail.toLowerCase())
      if (delErr) return Response.json({ ok: false, error: 'Could not remove', detail: delErr.message }, { status: 500 })
      return Response.json({ ok: true })
    }

    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[admin/panel-assignments POST] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}