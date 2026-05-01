// app/api/admin/attendance-manual/route.js
import { supabase } from '@/lib/supabase'

// Manual punch entry — used for 4:30pm and 7pm Project Street attendance
// POST { date: 'YYYY-MM-DD', punchType: 'project_street_4_30' | 'project_street_7pm', rolls: [...] }
export async function POST(request) {
  const token = request.headers.get('x-admin-token')
  if (!token || !token.startsWith('admin_')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, punchType, rolls } = body

    if (!date || !punchType || !Array.isArray(rolls) || rolls.length === 0) {
      return Response.json({ error: 'Invalid request — date, punchType, and rolls[] required' }, { status: 400 })
    }

    if (!['project_street_4_30', 'project_street_7pm'].includes(punchType)) {
      return Response.json({ error: 'Invalid punchType — must be project_street_4_30 or project_street_7pm' }, { status: 400 })
    }

    // Determine the timestamp for this manual punch
    const timeStr = punchType === 'project_street_4_30' ? '11:00:00' : '13:30:00'  // UTC of 4:30pm IST = 11:00 UTC, 7:00pm IST = 13:30 UTC
    const punchAt = new Date(`${date}T${timeStr}.000Z`)

    // Look up which rolls are mentors vs students
    const cleanRolls = rolls.map(r => String(r).trim().toUpperCase()).filter(Boolean)
    const numericRolls = cleanRolls.filter(r => /^[0-9]+$/.test(r))
    const studentRolls = cleanRolls.filter(r => !/^[0-9]+$/.test(r))

    const userTypeMap = {}
    if (numericRolls.length > 0) {
      const { data: mentors } = await supabase.from('mentors').select('emp_id').in('emp_id', numericRolls)
      ;(mentors || []).forEach(m => { userTypeMap[m.emp_id] = 'mentor' })
    }
    if (studentRolls.length > 0) {
      for (let i = 0; i < studentRolls.length; i += 200) {
        const batch = studentRolls.slice(i, i + 200)
        const { data: students } = await supabase.from('students').select('roll_number').in('roll_number', batch)
        ;(students || []).forEach(s => { userTypeMap[s.roll_number] = 'student' })
      }
    }

    // Build rows
    const rows = cleanRolls.map(roll => ({
      employee_code: roll,           // for manual entries, we treat the roll as the employee_code
      roll_number: roll,
      device_serial: 'MANUAL',
      device_id: 'MANUAL',
      punch_at: punchAt.toISOString(),
      punch_date: date,
      source: 'manual',
      user_type: userTypeMap[roll] || 'unknown',
      punch_label: punchType
    }))

    // Upsert
    const { error } = await supabase
      .from('attendance_logs')
      .upsert(rows, { onConflict: 'employee_code,punch_at', ignoreDuplicates: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Audit log
    await supabase.from('attendance_sync_log').insert({
      source: 'manual',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      api_total: 0,
      filtered: rows.length,
      inserted: rows.length,
      skipped: 0,
      failed: 0
    })

    const matched = Object.keys(userTypeMap).length
    return Response.json({
      success: true,
      total: rows.length,
      matched,
      unmatched: rows.length - matched,
      punchType,
      date
    })
  } catch (err) {
    console.error('Manual punch API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}