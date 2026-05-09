// app/api/attendance/download/route.js
//
// Downloads roll numbers of students present for a given mode + date.
// Returns XLSX with single column: roll_number (header).
//
// Usage: GET /api/attendance/download?mode=light&date=2026-05-09
//
// Modes: 'light' | 'bright' | 'dark' | 'moon'
// Date: YYYY-MM-DD
//
// For dark mode, includes both Dark Mode AND Project Street manual entries
// (since they share the same punch_mode='dark' but different punch_label).

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const VALID_MODES = ['light', 'bright', 'dark', 'moon']

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = String(searchParams.get('mode') || '').trim().toLowerCase()
    const date = String(searchParams.get('date') || '').trim()

    // ───── Validate inputs ─────
    if (!mode || !VALID_MODES.includes(mode)) {
      return Response.json(
        { ok: false, error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { ok: false, error: 'Date is required in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // ───── Query attendance_logs ─────
    // Get unique roll numbers that punched on this date for this mode
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('roll_number')
      .eq('punch_date', date)
      .eq('punch_mode', mode)
      .eq('user_type', 'student')

    if (error) {
      console.error('[attendance-download] Query error:', error)
      return Response.json(
        { ok: false, error: 'Database query failed', detail: error.message },
        { status: 500 }
      )
    }

    // Dedupe roll numbers (same student may punch multiple times)
    const uniqueRolls = Array.from(new Set((data || []).map(r => r.roll_number))).sort()

    if (uniqueRolls.length === 0) {
      // Return empty XLSX (better UX than 404 — admin gets a file, just empty)
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([['roll_number'], ['(no students present)']])
      ws['!cols'] = [{ wch: 25 }]
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="attendance_${mode}_${date}_empty.xlsx"`,
          'Cache-Control': 'no-store',
          'X-Total-Count': '0',
        },
      })
    }

    // ───── Build XLSX with roll numbers only ─────
    const wb = XLSX.utils.book_new()
    const sheetData = [['roll_number'], ...uniqueRolls.map(r => [r])]
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    ws['!cols'] = [{ wch: 25 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="attendance_${mode}_${date}.xlsx"`,
        'Cache-Control': 'no-store',
        'X-Total-Count': String(uniqueRolls.length),
      },
    })
  } catch (err) {
    console.error('[attendance-download] Error:', err)
    return Response.json(
      { ok: false, error: 'Download failed', detail: err.message },
      { status: 500 }
    )
  }
}