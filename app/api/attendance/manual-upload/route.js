// app/api/attendance/manual-upload/route.js
//
// Generic manual attendance upload — supports all 4 modes (bright, light, dark, project-street).
// Replaces the broken upload-dark-mode route which was missing device_serial (NOT NULL column).
//
// Endpoints:
//   GET  → returns sample XLSX template (download)
//   POST → accept file + mode + date, marks students present
//
// Form fields:
//   file  — CSV or XLSX, column A = roll_number (header optional)
//   mode  — 'bright' | 'light' | 'dark' | 'project-street'
//   date  — YYYY-MM-DD

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ─────────────────────────────────────────────────────────────
// Mode configuration — each mode has its own time slot + label
// All modes use device_serial='MANUAL' to distinguish from real device punches
// ─────────────────────────────────────────────────────────────
const MODE_CONFIG = {
  light: {
    punch_mode: 'light',
    punch_label: 'Light Mode (Manual)',
    // Light = morning slot (7 AM - 12 PM IST), midpoint 9:30 AM IST = 04:00 UTC
    utc_time: '04:00:00.000Z',
    display: 'Light Mode',
  },
  bright: {
    punch_mode: 'bright',
    punch_label: 'Bright Mode (Manual)',
    // Bright = afternoon slot (12 PM - 4 PM IST), midpoint 2:00 PM IST = 08:30 UTC
    utc_time: '08:30:00.000Z',
    display: 'Bright Mode',
  },
  dark: {
    punch_mode: 'dark',
    punch_label: 'Dark Mode / Project Street (Manual)',
    // Dark = evening slot (4 PM - 7:30 PM IST), Project Street same. Midpoint 5:45 PM IST = 12:15 UTC
    utc_time: '12:15:00.000Z',
    display: 'Dark Mode / Project Street',
  },
  moon: {
    punch_mode: 'moon',
    punch_label: 'Moon Mode (Manual)',
    // Moon = night slot (7:30 PM - 12 AM IST), midpoint 9:45 PM IST = 16:15 UTC
    utc_time: '16:15:00.000Z',
    display: 'Moon Mode',
  },
}

// ─────────────────────────────────────────────────────────────
// GET — return sample XLSX template
// ─────────────────────────────────────────────────────────────
export async function GET() {
  const wb = XLSX.utils.book_new()
  const sampleData = [
    ['roll_number'],
    ['23A91A61G9'],
    ['24P3A0501'],
    ['24MH1A4249'],
    ['24A95A0512'],
    ['25B11A0123'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(sampleData)
  ws['!cols'] = [{ wch: 20 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="attendance-upload-sample.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}

// ─────────────────────────────────────────────────────────────
// POST — process upload
// ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const mode = String(formData.get('mode') || '').trim().toLowerCase()
    const date = String(formData.get('date') || '').trim()

    // ───── 1. Validate inputs ─────
    if (!file) {
      return Response.json({ ok: false, error: 'File is required' }, { status: 400 })
    }
    if (!mode) {
      return Response.json({ ok: false, error: 'Mode is required' }, { status: 400 })
    }
    if (!MODE_CONFIG[mode]) {
      return Response.json(
        {
          ok: false,
          error: `Invalid mode "${mode}". Must be one of: ${Object.keys(MODE_CONFIG).join(', ')}`,
        },
        { status: 400 }
      )
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { ok: false, error: 'Date is required in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    const config = MODE_CONFIG[mode]

    // ───── 2. Parse file (CSV or XLSX) ─────
    const buf = Buffer.from(await file.arrayBuffer())
    let wb
    try {
      wb = XLSX.read(buf, { type: 'buffer' })
    } catch (e) {
      return Response.json(
        { ok: false, error: `Could not parse file. Expected CSV or XLSX. ${e.message}` },
        { status: 400 }
      )
    }
    const sheetName = wb.SheetNames[0]
    if (!sheetName) {
      return Response.json({ ok: false, error: 'File has no sheets' }, { status: 400 })
    }
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    // ───── 3. Extract roll numbers ─────
    // Format: column A. Skip header rows that say "roll" or "number".
    // Roll numbers: alphanumeric, ≥5 chars, must contain digit.
    const rollNumbers = []
    rows.forEach((row) => {
      if (!row || row.length === 0) return
      const candidate = String(row[0] || '').trim().toUpperCase()
      if (candidate.length < 5) return
      if (!/[0-9]/.test(candidate)) return
      if (!/^[A-Z0-9]+$/.test(candidate)) return // strict: only letters + digits
      const lower = candidate.toLowerCase()
      if (lower === 'roll' || lower === 'roll_number' || lower === 'rollnumber' || lower === 'number') return
      rollNumbers.push(candidate)
    })

    const uniqueRolls = Array.from(new Set(rollNumbers))
    if (uniqueRolls.length === 0) {
      return Response.json(
        {
          ok: false,
          error: 'No valid roll numbers found in file. Ensure column A has roll numbers like "23A91A61G9".',
        },
        { status: 400 }
      )
    }

    // ───── 4. Validate against students table ─────
    // (Optional but helpful — skip rolls that don't exist in our system)
    const { data: validStudents } = await supabase
      .from('students')
      .select('roll_number')
      .in('roll_number', uniqueRolls)

    const validSet = new Set((validStudents || []).map((s) => s.roll_number))
    const invalidRolls = uniqueRolls.filter((r) => !validSet.has(r))
    const validRolls = uniqueRolls.filter((r) => validSet.has(r))

    if (validRolls.length === 0) {
      return Response.json(
        {
          ok: false,
          error: `None of the ${uniqueRolls.length} roll numbers found in students table`,
          invalid_rolls: invalidRolls.slice(0, 20),
        },
        { status: 400 }
      )
    }

    // ───── 5. Build punch_at timestamp ─────
    const punchAt = new Date(`${date}T${config.utc_time}`).toISOString()

    // ───── 6. Check for existing duplicates ─────
    // Avoid double-marking same roll/date/mode combination.
    // For project-street vs dark (same punch_mode), distinguish by punch_label.
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('roll_number, punch_label')
      .eq('punch_date', date)
      .eq('punch_mode', config.punch_mode)
      .in('roll_number', validRolls)

    const existingSet = new Set(
      (existing || [])
        .filter((r) => r.punch_label === config.punch_label)
        .map((r) => r.roll_number)
    )
    const newRolls = validRolls.filter((r) => !existingSet.has(r))

    if (newRolls.length === 0) {
      return Response.json({
        ok: true,
        inserted: 0,
        skipped_duplicate: existingSet.size,
        skipped_invalid: invalidRolls.length,
        total_in_file: uniqueRolls.length,
        message: `All ${validRolls.length} entries already marked for ${config.display} on ${date}.`,
      })
    }

    // ───── 7. Build insert rows (with required device_serial) ─────
    const inserts = newRolls.map((roll) => ({
      employee_code: roll,
      roll_number: roll,
      device_serial: 'MANUAL', // ← required NOT NULL column, was missing in old route
      punch_at: punchAt,
      punch_date: date,
      source: 'manual',
      user_type: 'student',
      punch_mode: config.punch_mode,
      punch_label: config.punch_label,
    }))

    // ───── 8. Batch insert ─────
    const chunkSize = 500
    let insertedCount = 0
    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize)
      const { error } = await supabase.from('attendance_logs').insert(chunk)
      if (error) {
        console.error('[manual-upload] Insert error:', error)
        return Response.json(
          {
            ok: false,
            error: error.message,
            inserted_so_far: insertedCount,
          },
          { status: 500 }
        )
      }
      insertedCount += chunk.length
    }

    // ───── 9. Success response ─────
    return Response.json({
      ok: true,
      inserted: insertedCount,
      skipped_duplicate: existingSet.size,
      skipped_invalid: invalidRolls.length,
      total_in_file: uniqueRolls.length,
      mode: config.display,
      date,
      message: `Marked ${insertedCount} students present for ${config.display} on ${date}.`,
      // Show first few invalid rolls for debugging
      invalid_rolls_preview: invalidRolls.slice(0, 10),
    })
  } catch (err) {
    console.error('[manual-upload] Error:', err)
    return Response.json(
      { ok: false, error: 'Upload failed', detail: err.message },
      { status: 500 }
    )
  }
}