import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Fetch in pages of 1000 to bypass Supabase default limit
    let allRows = []
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          roll_number,
          short_name,
          serial_number,
          is_leader,
          students:roll_number (technology, batch, gender, college, branch),
          teams:serial_number (team_number),
          team_registrations:serial_number (project_title)
        `)
        .order('serial_number', { ascending: true })
        .order('is_leader', { ascending: false })
        .order('roll_number', { ascending: true })
        .range(from, from + pageSize - 1)

      if (error) {
        console.error('Export error:', error)
        return Response.json({ error: error.message }, { status: 500 })
      }

      if (!data || data.length === 0) break
      allRows = allRows.concat(data)

      if (data.length < pageSize) break
      from += pageSize
    }

    // Flatten nested data
    const headers = [
      'roll_number',
      'short_name',
      'project_title',
      'technology',
      'batch',
      'gender',
      'team_number',
      'college',
      'branch'
    ]

    const escape = (v) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    const csvRows = allRows.map(m => [
      m.roll_number,
      m.short_name || '',
      m.team_registrations?.project_title || '',
      m.students?.technology || '',
      m.students?.batch || '',
      m.students?.gender || '',
      m.teams?.team_number || '',
      m.students?.college || '',
      m.students?.branch || ''
    ].map(escape).join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')
    const filename = `team_members_export_${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (err) {
    console.error('Export error:', err)
    return Response.json({ error: 'Export failed' }, { status: 500 })
  }
}