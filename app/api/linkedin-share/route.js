import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    // Save a LinkedIn share (with upsert to prevent duplicates)
    if (action === 'save') {
      const { rollNumber, teamNumber, technology, mentorName, postedByName, postedByRole } = body
      if (!rollNumber || !teamNumber) return Response.json({ error: 'Missing fields' }, { status: 400 })

      // Check if record exists (to handle re-posts after mentor approval)
      const { data: existing } = await supabase.from('linkedin_shares')
        .select('id').eq('roll_number', rollNumber).eq('team_number', teamNumber).maybeSingle()

      if (existing) {
        // Update existing record (happens when mentor re-enables and user re-posts)
        const { data, error } = await supabase.from('linkedin_shares')
          .update({
            technology: technology || '', mentor_name: mentorName || '',
            posted_by_name: postedByName || '', posted_by_role: postedByRole || 'student',
            created_at: new Date().toISOString()
          })
          .eq('id', existing.id).select().single()
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, share: data })
      }

      // Insert new record
      const { data, error } = await supabase.from('linkedin_shares').insert({
        roll_number: rollNumber, team_number: teamNumber, technology: technology || '',
        mentor_name: mentorName || '', posted_by_name: postedByName || '', posted_by_role: postedByRole || 'student'
      }).select().single()
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, share: data })
    }

    // Check a single student's share status
    if (action === 'check-student') {
      const { rollNumber } = body
      if (!rollNumber) return Response.json({ error: 'rollNumber required' }, { status: 400 })
      const { data } = await supabase.from('linkedin_shares')
        .select('id, team_number, created_at').eq('roll_number', rollNumber).maybeSingle()
      return Response.json({ shared: !!data, share: data || null })
    }

    // Check team-wide LinkedIn posting status (returns posted/pending members)
    if (action === 'check-team') {
      const { teamNumber } = body
      if (!teamNumber) return Response.json({ error: 'teamNumber required' }, { status: 400 })

      // Get all team members
      const { data: teamReg } = await supabase.from('team_registrations')
        .select('members')
        .eq('team_number', teamNumber)
        .single()
      const regMembers = Array.isArray(teamReg?.members) ? teamReg.members : []
      const teamMembers = regMembers.map(m => ({
        roll_number: (m.rollNumber || m.roll_number || '').toUpperCase()
      })).filter(m => m.roll_number)

      const members = teamMembers || []
      const memberRolls = members.map(m => m.roll_number)

      // Get shares for these members
      const { data: shares } = await supabase.from('linkedin_shares')
        .select('roll_number, created_at')
        .eq('team_number', teamNumber)
        .in('roll_number', memberRolls.length > 0 ? memberRolls : [''])

      // Get student names for pretty display
      const { data: students } = await supabase.from('students')
        .select('roll_number, name')
        .in('roll_number', memberRolls.length > 0 ? memberRolls : [''])

      const nameMap = {}
      ;(students || []).forEach(s => { nameMap[s.roll_number] = s.name })

      const sharedRolls = new Set((shares || []).map(s => s.roll_number))
      const postedMembers = members.filter(m => sharedRolls.has(m.roll_number))
        .map(m => ({ rollNumber: m.roll_number, name: nameMap[m.roll_number] || m.roll_number }))
      const pendingMembers = members.filter(m => !sharedRolls.has(m.roll_number))
        .map(m => ({ rollNumber: m.roll_number, name: nameMap[m.roll_number] || m.roll_number }))

      return Response.json({
        totalMembers: members.length,
        postedCount: postedMembers.length,
        pendingCount: pendingMembers.length,
        allPosted: members.length > 0 && pendingMembers.length === 0,
        postedMembers,
        pendingMembers
      })
    }

    // Admin stats
    if (action === 'stats') {
      const { data: all } = await supabase.from('linkedin_shares').select('*').order('created_at', { ascending: false })
      const shares = all || []
      const total = shares.length
      const students = shares.filter(s => s.posted_by_role === 'student').length
      const mentorsCount = shares.filter(s => s.posted_by_role === 'mentor').length
      const byTech = {}; shares.forEach(s => { const t = s.technology || 'Unknown'; byTech[t] = (byTech[t] || 0) + 1 })
      const byMentor = {}; shares.forEach(s => { if (s.mentor_name) byMentor[s.mentor_name] = (byMentor[s.mentor_name] || 0) + 1 })
      const uniqueTeams = [...new Set(shares.map(s => s.team_number))].length
      return Response.json({ stats: { total, students, mentors: mentorsCount, uniqueTeams, byTech, byMentor }, recent: shares })    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('LinkedIn share error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}