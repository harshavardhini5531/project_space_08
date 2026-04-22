import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'save') {
      const { rollNumber, teamNumber, technology, mentorName, postedByName, postedByRole } = body
      if (!rollNumber || !teamNumber) return Response.json({ error: 'Missing fields' }, { status: 400 })
      const { data, error } = await supabase.from('linkedin_shares').insert({
        roll_number: rollNumber, team_number: teamNumber, technology: technology || '',
        mentor_name: mentorName || '', posted_by_name: postedByName || '', posted_by_role: postedByRole || 'student'
      }).select().single()
      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, share: data })
    }

    if (action === 'check-student') {
      const { rollNumber } = body
      if (!rollNumber) return Response.json({ error: 'rollNumber required' }, { status: 400 })
      const { data } = await supabase.from('linkedin_shares').select('id, team_number, created_at').eq('roll_number', rollNumber).limit(1)
      return Response.json({ shared: (data || []).length > 0 })
    }

    if (action === 'stats') {
      const { data: all } = await supabase.from('linkedin_shares').select('*').order('created_at', { ascending: false })
      const shares = all || []
      const total = shares.length
      const students = shares.filter(s => s.posted_by_role === 'student').length
      const mentorsCount = shares.filter(s => s.posted_by_role === 'mentor').length
      const byTech = {}; shares.forEach(s => { const t = s.technology || 'Unknown'; byTech[t] = (byTech[t] || 0) + 1 })
      const byMentor = {}; shares.forEach(s => { if (s.mentor_name) byMentor[s.mentor_name] = (byMentor[s.mentor_name] || 0) + 1 })
      const uniqueTeams = [...new Set(shares.map(s => s.team_number))].length
      const recent = shares.slice(0, 30)
      return Response.json({ stats: { total, students, mentors: mentorsCount, uniqueTeams, byTech, byMentor }, recent })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('LinkedIn share error:', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}