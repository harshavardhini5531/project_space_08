// app/api/attendance/upload-dark-mode/route.js
// Accepts an Excel file with roll_number column, marks all as Dark Mode present for given date.
// Excel format: column A = roll_number (header optional), one per row.

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const date = formData.get('date') // YYYY-MM-DD format

    if (!file) return Response.json({ error: 'File required' }, { status: 400 })
    if (!date) return Response.json({ error: 'Date required (YYYY-MM-DD)' }, { status: 400 })

    // Parse Excel
    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    // Extract roll numbers — try multiple column positions, skip header rows
    const rollNumbers = []
    rows.forEach(row => {
      if (!row || row.length === 0) return
      // Try first column
      const candidate = String(row[0] || '').trim().toUpperCase()
      // Roll numbers are alphanumeric with at least 5 chars and contain digits
      if (candidate.length >= 5 && /[0-9]/.test(candidate) && /[A-Z0-9]+/.test(candidate)) {
        if (!candidate.toLowerCase().includes('roll') && !candidate.toLowerCase().includes('number')) {
          rollNumbers.push(candidate)
        }
      }
    })

    const uniqueRolls = Array.from(new Set(rollNumbers))
    if (uniqueRolls.length === 0) {
      return Response.json({ error: 'No valid roll numbers found in file' }, { status: 400 })
    }

    // Build punch rows for Dark Mode (5:30 PM IST)
    // 5:30 PM IST = 12:00 PM UTC
    const punchAt = new Date(`${date}T12:00:00.000Z`).toISOString()

    // Check existing Dark mode punches for this date to avoid duplicates
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('roll_number')
      .eq('punch_date', date)
      .eq('punch_mode', 'dark')
      .in('roll_number', uniqueRolls)
    const existingSet = new Set((existing || []).map(r => r.roll_number))
    const newRolls = uniqueRolls.filter(r => !existingSet.has(r))

    if (newRolls.length === 0) {
      return Response.json({
        ok: true,
        inserted: 0,
        skipped: uniqueRolls.length,
        total_in_file: uniqueRolls.length,
        message: 'All entries already exist for Dark Mode on this date.',
      })
    }

    const inserts = newRolls.map(roll => ({
      employee_code: roll,
      roll_number: roll,
      punch_at: punchAt,
      punch_date: date,
      source: 'manual',
      user_type: 'student',
      punch_mode: 'dark',
      punch_label: 'Dark Mode (Manual)',
    }))

    // Batch insert (Supabase recommends ≤1000 per call)
    const chunkSize = 500
    let insertedCount = 0
    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize)
      const { error } = await supabase.from('attendance_logs').insert(chunk)
      if (error) {
        console.error('Insert error:', error)
        return Response.json({
          ok: false,
          error: error.message,
          inserted_so_far: insertedCount,
        }, { status: 500 })
      }
      insertedCount += chunk.length
    }

    return Response.json({
      ok: true,
      inserted: insertedCount,
      skipped: existingSet.size,
      total_in_file: uniqueRolls.length,
      date,
    })
  } catch (err) {
    console.error('Upload Dark Mode error:', err)
    return Response.json({ error: 'Upload failed', detail: err.message }, { status: 500 })
  }
}