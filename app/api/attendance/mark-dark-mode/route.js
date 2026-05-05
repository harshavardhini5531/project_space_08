// app/api/attendance/mark-dark-mode/route.js
// Quick form alternative to Excel upload — paste roll numbers, mark Dark Mode for date.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const { rollNumbers, date, mode = 'dark' } = await request.json()

    if (!Array.isArray(rollNumbers) || rollNumbers.length === 0) {
      return Response.json({ error: 'rollNumbers array required' }, { status: 400 })
    }
    if (!date) return Response.json({ error: 'Date required (YYYY-MM-DD)' }, { status: 400 })

    // Sanitize and dedupe
    const cleaned = Array.from(new Set(
      rollNumbers
        .map(r => String(r || '').trim().toUpperCase())
        .filter(r => r.length >= 5 && /[0-9]/.test(r))
    ))

    if (cleaned.length === 0) {
      return Response.json({ error: 'No valid roll numbers' }, { status: 400 })
    }

    // Check existing
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('roll_number')
      .eq('punch_date', date)
      .eq('punch_mode', mode)
      .in('roll_number', cleaned)
    const existingSet = new Set((existing || []).map(r => r.roll_number))
    const newRolls = cleaned.filter(r => !existingSet.has(r))

    if (newRolls.length === 0) {
      return Response.json({
        ok: true, inserted: 0, skipped: cleaned.length,
        message: 'All entries already marked.',
      })
    }

    // Time mapping for each mode (in IST → UTC)
    const modeTimeUTC = {
      dark: '12:00:00',  // 5:30 PM IST = 12:00 PM UTC
      light: '03:30:00', // 9:00 AM IST = 3:30 AM UTC
      bright: '07:30:00',// 1:00 PM IST = 7:30 AM UTC
      moon: '14:30:00',  // 8:00 PM IST = 2:30 PM UTC
    }
    const punchAt = new Date(`${date}T${modeTimeUTC[mode] || '12:00:00'}.000Z`).toISOString()

    const inserts = newRolls.map(roll => ({
      employee_code: roll,
      roll_number: roll,
      punch_at: punchAt,
      punch_date: date,
      source: 'manual',
      user_type: 'student',
      punch_mode: mode,
      punch_label: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode (Manual)`,
    }))

    const { error } = await supabase.from('attendance_logs').insert(inserts)
    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 })
    }

    return Response.json({
      ok: true,
      inserted: newRolls.length,
      skipped: existingSet.size,
      total_received: cleaned.length,
      date, mode,
    })
  } catch (err) {
    console.error('Mark dark mode error:', err)
    return Response.json({ error: 'Mark failed', detail: err.message }, { status: 500 })
  }
}