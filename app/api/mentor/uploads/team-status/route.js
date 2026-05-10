import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { mentorEmail } = await request.json().catch(() => ({}))
    if (!mentorEmail) return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })

    const { data: mentor } = await supabase
      .from('mentors').select('id, name, email').eq('email', mentorEmail).maybeSingle()
    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })

    const { data: teams } = await supabase
      .from('teams').select('team_number, project_title, technology, leader_roll')
      .eq('mentor_assigned', mentor.name)
      .order('team_number', { ascending: true })

    if (!teams || teams.length === 0) return Response.json({ ok: true, teams: [] })

    const teamNums = teams.map(t => t.team_number)
    const { data: members } = await supabase.from('team_members').select('team_number, roll_number, short_name, is_leader').in('team_number', teamNums)
    const { data: certs } = await supabase.from('team_certificates').select('team_number, roll_number, cert_type').in('team_number', teamNums)
    const { data: ppts } = await supabase.from('team_ppts').select('team_number, file_name, file_size, uploaded_by_name, uploaded_at, updated_at, storage_path').in('team_number', teamNums)

    const result = await Promise.all(teams.map(async t => {
      const teamMembers = (members || []).filter(m => m.team_number === t.team_number)
      const teamCerts = (certs || []).filter(c => c.team_number === t.team_number)
      const ppt = (ppts || []).find(p => p.team_number === t.team_number)
      const memberSize = teamMembers.length || 1
      const expectedCerts = memberSize * 4
      const uploadedCerts = teamCerts.length

      const memberBreakdown = teamMembers.map(m => {
        const myCerts = teamCerts.filter(c => c.roll_number === m.roll_number)
        const myCertTypes = myCerts.map(c => c.cert_type)
        return {
          roll_number: m.roll_number, short_name: m.short_name, is_leader: m.is_leader,
          uploaded: myCerts.length, uploaded_types: myCertTypes,
          missing_types: ['agent_skills', 'api', 'mcp', 'code_in_action'].filter(t => !myCertTypes.includes(t)),
        }
      })

      let pptUrl = null
      if (ppt?.storage_path) {
        const { data: signed } = await supabase.storage.from('team-uploads').createSignedUrl(ppt.storage_path, 3600)
        pptUrl = signed?.signedUrl || null
      }

      return {
        team_number: t.team_number, project_title: t.project_title, technology: t.technology, leader_roll: t.leader_roll,
        member_size: memberSize,
        certs: { uploaded: uploadedCerts, total: expectedCerts, percent: Math.round((uploadedCerts / expectedCerts) * 100) },
        ppt: ppt ? { ...ppt, url: pptUrl } : null,
        members: memberBreakdown,
      }
    }))

    return Response.json({ ok: true, teams: result })
  } catch (err) {
    console.error('[mentor/uploads/team-status] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}