import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const token = request.headers.get('x-admin-token')
    if (!token || !token.startsWith('admin_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'teams'

    if (type === 'teams') {
      const { data: teams } = await supabase.from('teams').select('*').order('serial_number')
      const { data: regs } = await supabase.from('team_registrations').select('*')
      const { data: members } = await supabase.from('team_members').select('serial_number, roll_number, is_leader')
      
      const regMap = {}
      if (regs) regs.forEach(r => { regMap[r.serial_number] = r })

      const rollNumbers = (members || []).map(m => m.roll_number)
      let studentMap = {}
      for (let i = 0; i < rollNumbers.length; i += 100) {
        const batch = rollNumbers.slice(i, i + 100)
        const { data: students } = await supabase.from('students').select('roll_number, name').in('roll_number', batch)
        if (students) students.forEach(s => { studentMap[s.roll_number] = s.name })
      }

      const csv = ['Serial No,Team Number,Technology,Mentor,Leader Roll,Leader Name,Registered,Project Title,Project Area,Tech Stack,AI Tools,Members']
      for (const t of (teams || [])) {
        const reg = regMap[t.serial_number]
        const teamMembers = (members || []).filter(m => m.serial_number === t.serial_number && !m.is_leader)
        const memberNames = teamMembers.map(m => studentMap[m.roll_number] || m.roll_number).join('; ')
        const leaderName = studentMap[t.leader_roll] || t.leader_roll

        csv.push([
          t.serial_number,
          reg?.team_number || '',
          t.technology,
          t.mentor_assigned || '',
          t.leader_roll,
          `"${leaderName}"`,
          reg ? 'Yes' : 'No',
          `"${(reg?.project_title || t.project_title || '').replace(/"/g, '""')}"`,
          `"${(reg?.project_area || []).join(', ')}"`,
          `"${(reg?.tech_stack || []).join(', ')}"`,
          `"${(reg?.ai_tools || []).join(', ')}"`,
          `"${memberNames}"`
        ].join(','))
      }

      return new Response(csv.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=project-space-teams.csv'
        }
      })

    } else if (type === 'registrations') {
      const { data: regs } = await supabase.from('team_registrations').select('*').order('registered_at', { ascending: false })

      const csv = ['Team Number,Serial No,Technology,Leader Roll,Project Title,Project Area,Tech Stack,AI Tools,AI Usage,Registered At']
      for (const r of (regs || [])) {
        csv.push([
          r.team_number,
          r.serial_number,
          r.technology,
          r.leader_roll,
          `"${(r.project_title || '').replace(/"/g, '""')}"`,
          `"${(r.project_area || []).join(', ')}"`,
          `"${(r.tech_stack || []).join(', ')}"`,
          `"${(r.ai_tools || []).join(', ')}"`,
          r.ai_usage || 'No',
          r.registered_at || ''
        ].join(','))
      }

      return new Response(csv.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=project-space-registrations.csv'
        }
      })
    }

    return Response.json({ error: 'Invalid export type' }, { status: 400 })

  } catch (err) {
    console.error('Export error:', err)
    return Response.json({ error: 'Export failed' }, { status: 500 })
  }
}