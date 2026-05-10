import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export async function POST(request) {
  try {
    const { adminEmail } = await request.json().catch(() => ({}))
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teams } = await supabase
      .from('teams').select('team_number, project_title, technology, batch, leader_roll, mentor_assigned')
      .order('team_number', { ascending: true })

    if (!teams || teams.length === 0) return Response.json({ ok: true, teams: [], summary: {} })

    const { data: members } = await supabase.from('team_members').select('team_number, roll_number, short_name, is_leader')
    const { data: certs } = await supabase.from('team_certificates').select('team_number, roll_number, cert_type')
    const { data: ppts } = await supabase.from('team_ppts').select('team_number, uploaded_at, file_name, uploaded_by_name')

    const result = teams.map(t => {
      const teamMembers = (members || []).filter(m => m.team_number === t.team_number)
      const teamCerts = (certs || []).filter(c => c.team_number === t.team_number)
      const ppt = (ppts || []).find(p => p.team_number === t.team_number)
      const memberSize = teamMembers.length || 1
      const expectedCerts = memberSize * 4
      const uploadedCerts = teamCerts.length
      return {
        team_number: t.team_number, project_title: t.project_title, technology: t.technology, batch: t.batch,
        leader_roll: t.leader_roll, mentor_assigned: t.mentor_assigned, member_size: memberSize,
        certs_uploaded: uploadedCerts, certs_total: expectedCerts, certs_percent: Math.round((uploadedCerts / expectedCerts) * 100),
        has_ppt: !!ppt, ppt_uploaded_at: ppt?.uploaded_at || null, ppt_file_name: ppt?.file_name || null,
        members: teamMembers.map(m => ({
          ...m,
          certs_count: teamCerts.filter(c => c.roll_number === m.roll_number).length,
          cert_types: teamCerts.filter(c => c.roll_number === m.roll_number).map(c => c.cert_type),
        })),
      }
    })

    const summary = {
      total_teams: teams.length,
      teams_with_full_certs: result.filter(t => t.certs_percent === 100).length,
      teams_with_some_certs: result.filter(t => t.certs_percent > 0 && t.certs_percent < 100).length,
      teams_with_no_certs: result.filter(t => t.certs_percent === 0).length,
      teams_with_ppt: result.filter(t => t.has_ppt).length,
      teams_without_ppt: result.filter(t => !t.has_ppt).length,
    }

    return Response.json({ ok: true, teams: result, summary })
  } catch (err) {
    console.error('[admin/uploads/all-status] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}