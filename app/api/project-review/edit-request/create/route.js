// Student creates an edit request.
// LEADER ONLY. Max 3 pending requests per team.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const VALID_FIELDS = [
  'name','github_url','description','requirements','problem_statement',
  'proposed_solution','technologies_used','system_architecture',
  'in_scope','out_scope','future_enhancements','conclusion',
]

const MAX_PENDING_PER_TEAM = 3

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()
    const fieldChanges = Array.isArray(body.fieldChanges) ? body.fieldChanges : []
    const reason = (body.reason || '').trim()

    if (!rollNumber) {
      return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })
    }
    if (fieldChanges.length === 0) {
      return Response.json({ ok: false, error: 'At least one field change is required' }, { status: 400 })
    }

    // Verify user (user_passwords has only: id, roll_number, password_hash, created_at, last_login)
    const { data: userRow } = await supabase
      .from('user_passwords')
      .select('roll_number')
      .eq('roll_number', rollNumber)
      .maybeSingle()
    if (!userRow) {
      return Response.json({ ok: false, error: 'Not authorized. Please log in again.' }, { status: 401 })
    }

    // Find team — MUST BE LEADER
    const { data: team } = await supabase
      .from('teams')
      .select('team_number, leader_roll, project_title, mentor_assigned')
      .eq('leader_roll', rollNumber)
      .maybeSingle()

    if (!team) {
      return Response.json({
        ok: false,
        error: 'Only the team leader can submit edit requests. Please ask your team leader.',
      }, { status: 403 })
    }
    const teamNumber = team.team_number

    // Get short_name from team_members
    const { data: tm } = await supabase
      .from('team_members')
      .select('short_name')
      .eq('roll_number', rollNumber)
      .eq('team_number', teamNumber)
      .maybeSingle()

    // Find latest submission
    const { data: submission } = await supabase
      .from('project_review_submissions')
      .select('id, name, github_url, description, requirements, problem_statement, proposed_solution, technologies_used, system_architecture, in_scope, out_scope, future_enhancements, conclusion')
      .eq('team_number', teamNumber)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!submission) {
      return Response.json({ ok: false, error: 'No project review submission found for your team. Submit the form first.' }, { status: 404 })
    }

    // Check pending limit
    const { count: pendingCount } = await supabase
      .from('project_review_edit_requests')
      .select('id', { count: 'exact', head: true })
      .eq('team_number', teamNumber)
      .eq('status', 'pending')

    if ((pendingCount || 0) >= MAX_PENDING_PER_TEAM) {
      return Response.json({
        ok: false,
        error: `Your team has ${pendingCount} pending edit requests already. Wait for your mentor to respond before submitting more (max ${MAX_PENDING_PER_TEAM} pending).`,
        pending_count: pendingCount,
        limit: MAX_PENDING_PER_TEAM,
      }, { status: 429 })
    }

    // Validate field changes
    const cleanedChanges = []
    for (const ch of fieldChanges) {
      if (!ch || !ch.field || !VALID_FIELDS.includes(ch.field)) {
        return Response.json({ ok: false, error: `Invalid field: ${ch?.field}` }, { status: 400 })
      }
      let newValue = ch.new_value
      if (newValue === undefined || newValue === null) {
        return Response.json({ ok: false, error: `Empty new value for ${ch.field}` }, { status: 400 })
      }
      if (typeof newValue === 'string') {
        newValue = newValue.trim()
        if (!newValue) return Response.json({ ok: false, error: `Empty new value for ${ch.field}` }, { status: 400 })
        if (ch.field === 'github_url' && !/^https?:\/\/(www\.)?github\.com\//i.test(newValue)) {
          return Response.json({ ok: false, error: 'GitHub URL must start with https://github.com/' }, { status: 400 })
        }
      }
      if (ch.field === 'technologies_used' && !Array.isArray(newValue)) {
        if (typeof newValue === 'string') {
          newValue = newValue.split(',').map(s => s.trim()).filter(Boolean)
        } else {
          return Response.json({ ok: false, error: 'technologies_used must be array or comma-separated string' }, { status: 400 })
        }
      }
      cleanedChanges.push({
        field: ch.field,
        old_value: submission[ch.field],
        new_value: newValue,
      })
    }

    // Insert
    const { data: newReq, error: insertErr } = await supabase
      .from('project_review_edit_requests')
      .insert({
        team_number: teamNumber,
        submission_id: submission.id,
        requested_by_roll: rollNumber,
        requested_by_name: tm?.short_name || rollNumber,
        status: 'pending',
        field_changes: cleanedChanges,
        reason: reason || null,
      })
      .select('id, created_at')
      .single()

    if (insertErr) {
      console.error('[edit-request/create] insert error:', insertErr)
      return Response.json({ ok: false, error: 'Failed to create request', detail: insertErr.message }, { status: 500 })
    }

    // Notify mentor (non-blocking)
    try {
      if (team.mentor_assigned) {
        const { data: mentor } = await supabase
          .from('mentors')
          .select('email')
          .eq('name', team.mentor_assigned)
          .maybeSingle()
        if (mentor?.email) {
          const { sendPushNotification } = await import('@/lib/pushNotifications')
          await sendPushNotification({
            recipientEmail: mentor.email,
            recipientType: 'mentor',
            title: `Edit Request from ${teamNumber}`,
            body: `${cleanedChanges.length} field change${cleanedChanges.length === 1 ? '' : 's'} requested for ${team.project_title || 'their project'}`,
            url: '/mentor/dashboard',
            type: 'edit-request',
            teamNumber,
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error('[edit-request/create] notify error (non-blocking):', e?.message)
    }

    return Response.json({
      ok: true,
      request_id: newReq.id,
      created_at: newReq.created_at,
      message: 'Edit request submitted to your mentor.',
      pending_after: (pendingCount || 0) + 1,
      limit: MAX_PENDING_PER_TEAM,
    })
  } catch (err) {
    console.error('[edit-request/create] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}app/api/project-review/edit-request/create/route.js