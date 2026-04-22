import { supabase } from '@/lib/supabase'
import { notifyMentor } from '@/lib/mentorNotify'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    // Student creates a re-enable request
    if (action === 'create') {
      const { rollNumber, teamNumber, requesterName, mentorName, mentorEmail, reason } = body
      if (!rollNumber || !teamNumber) return Response.json({ error: 'Missing fields' }, { status: 400 })

      // Check if pending request already exists
      const { data: existing } = await supabase.from('linkedin_reenable_requests')
        .select('id, status')
        .eq('roll_number', rollNumber)
        .eq('team_number', teamNumber)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        return Response.json({ error: 'You already have a pending request. Wait for mentor approval.' }, { status: 409 })
      }

      const { data, error } = await supabase.from('linkedin_reenable_requests').insert({
        roll_number: rollNumber,
        team_number: teamNumber,
        requester_name: requesterName || '',
        mentor_name: mentorName || '',
        mentor_email: mentorEmail || '',
        reason: reason || '',
        status: 'pending'
      }).select().single()

      if (error) return Response.json({ error: error.message }, { status: 500 })

      // Notify mentor via email + push
      if (mentorEmail) {
        const origin = request.headers.get('origin') || request.headers.get('host') ? `https://${request.headers.get('host')}` : ''
        notifyMentor({
          type: 'linkedin-reenable',
          mentorEmail,
          origin,
          context: {
            requesterName: requesterName || rollNumber,
            rollNumber,
            teamNumber,
            reason
          }
        }).catch(e => console.error('notifyMentor failed:', e))
      }

      return Response.json({ success: true, request: data })
    }

    // Check if student has any pending or approved re-enable request
    if (action === 'check') {
      const { rollNumber, teamNumber } = body
      if (!rollNumber || !teamNumber) return Response.json({ error: 'Missing fields' }, { status: 400 })

      const { data } = await supabase.from('linkedin_reenable_requests')
        .select('id, status, created_at, resolved_at')
        .eq('roll_number', rollNumber)
        .eq('team_number', teamNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return Response.json({ request: data || null })
    }

    // Mentor lists pending requests for their teams
    if (action === 'list-for-mentor') {
      const { mentorEmail } = body
      if (!mentorEmail) return Response.json({ error: 'mentorEmail required' }, { status: 400 })

      const { data } = await supabase.from('linkedin_reenable_requests')
        .select('*')
        .eq('mentor_email', mentorEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      return Response.json({ requests: data || [] })
    }

    // List pending requests per team (used to show badge)
    if (action === 'list-by-team') {
      const { teamNumbers } = body
      if (!teamNumbers || !Array.isArray(teamNumbers)) return Response.json({ error: 'teamNumbers array required' }, { status: 400 })

      const { data } = await supabase.from('linkedin_reenable_requests')
        .select('team_number, roll_number, requester_name, reason, created_at, id')
        .in('team_number', teamNumbers.length > 0 ? teamNumbers : [''])
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // Group by team_number
      const byTeam = {}
      ;(data || []).forEach(r => {
        if (!byTeam[r.team_number]) byTeam[r.team_number] = []
        byTeam[r.team_number].push(r)
      })

      return Response.json({ byTeam })
    }

    // Mentor approves a re-enable request
    if (action === 'approve') {
      const { requestId, mentorName } = body
      if (!requestId) return Response.json({ error: 'requestId required' }, { status: 400 })

      // Get request details first
      const { data: req } = await supabase.from('linkedin_reenable_requests')
        .select('*').eq('id', requestId).single()

      if (!req) return Response.json({ error: 'Request not found' }, { status: 404 })

      // Delete the old linkedin_share record (so they can post again)
      await supabase.from('linkedin_shares')
        .delete()
        .eq('roll_number', req.roll_number)
        .eq('team_number', req.team_number)

      // Mark request as approved
      const { data, error } = await supabase.from('linkedin_reenable_requests')
        .update({
          status: 'approved',
          resolved_at: new Date().toISOString(),
          resolved_by: mentorName || 'Mentor'
        })
        .eq('id', requestId)
        .select().single()

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, request: data })
    }

    // Mentor denies
    if (action === 'deny') {
      const { requestId, mentorName } = body
      if (!requestId) return Response.json({ error: 'requestId required' }, { status: 400 })

      const { data, error } = await supabase.from('linkedin_reenable_requests')
        .update({
          status: 'denied',
          resolved_at: new Date().toISOString(),
          resolved_by: mentorName || 'Mentor'
        })
        .eq('id', requestId)
        .select().single()

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, request: data })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('LinkedIn reenable error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}