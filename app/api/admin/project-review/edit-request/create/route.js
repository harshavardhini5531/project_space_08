// Student creates an edit request for their submitted project review
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

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const rollNumber = (body.rollNumber || '').trim().toUpperCase()
    const fieldChanges = body.fieldChanges || []
    const reason = (body.reason || '').trim()

    if (!rollNumber) {
      return Response.json({ ok: false, error: 'rollNumber required' }, { status: 400 })
    }
    if (!Array.isArray(fieldChanges) || fieldChanges.length === 0) {
      return Response.json({ ok: false, error: 'At least one field change required' }, { status: 400 })
    }

    // Verify user
    const { data: userRow } = await supabase
      .from('user_passwords')
      .select('roll_number, short_name')
      .eq('roll_number', rollNumber)
      .maybeSingle()
    if (!userRow) {
      return Response.json({ ok: false, error: 'Not authorized' }, { status: 401 })
    }

    // Find team — student must be a leader OR member of team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('team_number, is_leader')
      .eq('roll_number', rollNumber)
      .maybeSingle()
    if (!teamMember || !teamMember.team_number) {
      return Response.json({ ok: false, error: 'No team found for this roll number' }, { status: 403 })
    }
    const teamNumber = teamMember.team_number

    // Verify submission exists
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

    // Validate field changes
    const cleanedChanges = []
    for (const ch of fieldChanges) {
      if (!ch || !ch.field || !VALID_FIELDS.includes(ch.field)) {
        return Response.json({ ok: false, error: `Invalid field: ${ch?.field}` }, { status: 400 })
      }
      const newValue = ch.new_value
      if (newValue === undefined || newValue === null || (typeof newValue === 'string' && !newValue.trim())) {
        return Response.json({ ok: false, error: `Empty new value for field: ${ch.field}` }, { status: 400 })
      }
      cleanedChanges.push({
        field: ch.field,
        old_value: submission[ch.field],
        new_value: typeof newValue === 'string' ? newValue.trim() : newValue,
      })
    }

    // Insert request
    const { data: newReq, error: insertErr } = await supabase
      .from('project_review_edit_requests')
      .insert({
        team_number: teamNumber,
        submission_id: submission.id,
        requested_by_roll: rollNumber,
        requested_by_name: userRow.short_name || rollNumber,
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

    // Notify mentor via push
    try {
      const { data: team } = await supabase
        .from('teams')
        .select('mentor_assigned, project_title')
        .eq('team_number', teamNumber)
        .maybeSingle()
      if (team?.mentor_assigned) {
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
            body: `${cleanedChanges.length} field change${cleanedChanges.length === 1 ? '' : 's'} requested for ${team.project_title || 'your team\'s project'}`,
            url: '/mentor/dashboard?tab=evaluation',
            type: 'edit-request',
            teamNumber,
          }).catch(() => {})
        }
      }
    } catch (e) {
      console.error('[edit-request/create] notify error (non-blocking):', e)
    }

    return Response.json({
      ok: true,
      request_id: newReq.id,
      created_at: newReq.created_at,
      message: 'Edit request submitted to your mentor.',
    })
  } catch (err) {
    console.error('[edit-request/create] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}