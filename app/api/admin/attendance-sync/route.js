// app/api/admin/attendance-sync/route.js
import { supabase } from '@/lib/supabase'

// 13 device serials we care about for the event
const ALLOWED_SERIALS = new Set([
  'CQIK222660267', 'CQIK222660127', 'CQIK222660348', 'CQIK222660347',
  'CQIK222560847', 'CQIK222660349', 'CQIK222660126', 'CQIK222660354',
  'CQIK222660352', 'M014200992108001153', 'NCD8245300366', 'NCD8245300358',
  'CQIK222660344'
])

const MAYA_API = 'https://maya.technicalhub.io/node/api/get-attendancelogs'

// Transform: prepend "2" to API employee_code to match our roll_number format
// e.g. "5B11DS409" -> "25B11DS409", "4B11AI271" -> "24B11AI271"
function toRollNumber(empCode) {
  if (!empCode) return null
  const trimmed = String(empCode).trim().toUpperCase()
  // If already has prefix (already starts with 2X), keep as-is
  if (/^2[0-9]/.test(trimmed)) return trimmed
  // For mentor numeric codes (e.g. "1285"), keep as-is — they match emp_id directly
  if (/^[0-9]+$/.test(trimmed)) return trimmed
  // For student codes like "5B11DS409", prepend "2"
  return '2' + trimmed
}

// Detect user type by checking if it's a mentor emp_id or student roll
async function classifyUserType(rollNumbers) {
  const map = {}
  if (rollNumbers.length === 0) return map
  // Check mentors first (numeric only)
  const numericRolls = rollNumbers.filter(r => /^[0-9]+$/.test(r))
  if (numericRolls.length > 0) {
    const { data: mentors } = await supabase.from('mentors').select('emp_id').in('emp_id', numericRolls)
    ;(mentors || []).forEach(m => { map[m.emp_id] = 'mentor' })
  }
  // Check students
  const studentRolls = rollNumbers.filter(r => !/^[0-9]+$/.test(r))
  if (studentRolls.length > 0) {
    // Batch in chunks of 200
    for (let i = 0; i < studentRolls.length; i += 200) {
      const batch = studentRolls.slice(i, i + 200)
      const { data: students } = await supabase.from('students').select('roll_number').in('roll_number', batch)
      ;(students || []).forEach(s => { map[s.roll_number] = 'student' })
    }
  }
  return map
}

export async function POST(request) {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
  if (token !== cronSecret && (!token || !token.startsWith('admin_'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sourceType = request.headers.get('x-cron-secret') === cronSecret ? 'cron' : 'manual'

  // Create sync log entry
  const { data: logEntry } = await supabase
    .from('attendance_sync_log')
    .insert({ source: sourceType, started_at: new Date().toISOString() })
    .select('id')
    .single()
  const logId = logEntry?.id

  let apiTotal = 0, filtered = 0, inserted = 0, skipped = 0, failed = 0, errMsg = null

  try {
    // Allow self-signed cert for Maya API
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    const r = await fetch(MAYA_API)
    if (!r.ok) throw new Error(`Maya API returned ${r.status}`)
    const data = await r.json()
    const arr = Array.isArray(data) ? data : (data.data || [])
    apiTotal = arr.length

    // Filter to allowed device serials
    const filteredArr = arr.filter(x => ALLOWED_SERIALS.has(x.after?.Serialnumber))
    filtered = filteredArr.length

    if (filtered === 0) {
      await supabase.from('attendance_sync_log').update({
        finished_at: new Date().toISOString(), api_total: apiTotal, filtered: 0, inserted: 0, skipped: 0, failed: 0
      }).eq('id', logId)
      return Response.json({ success: true, api_total: apiTotal, filtered: 0, inserted: 0, message: 'No event-device punches found' })
    }

    // Build rows
    const rolls = [...new Set(filteredArr.map(x => toRollNumber(x.after?.EmployeeCode)).filter(Boolean))]
    const userTypeMap = await classifyUserType(rolls)

    const rows = filteredArr.map(x => {
      const empCode = x.after?.EmployeeCode
      const rollNumber = toRollNumber(empCode)
      const punchAt = new Date(x.after?.timestamp || x.after?.LogDateTime)
      const punchDateIST = new Date(punchAt.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 10)
      return {
        employee_code: empCode,
        roll_number: rollNumber,
        device_serial: x.after?.Serialnumber,
        device_id: String(x.after?.Deviceid || ''),
        punch_at: punchAt.toISOString(),
        punch_date: punchDateIST,
        source: 'api',
        user_type: userTypeMap[rollNumber] || 'unknown'
      }
    }).filter(r => r.employee_code && r.punch_at)

    // Upsert in batches of 500 — onConflict handles duplicates silently
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500)
      const { error } = await supabase
        .from('attendance_logs')
        .upsert(batch, { onConflict: 'employee_code,punch_at', ignoreDuplicates: true })
      if (error) {
        console.error('Batch insert error:', error)
        failed += batch.length
      } else {
        inserted += batch.length // approximate; ignoreDuplicates makes count fuzzy
      }
    }

    skipped = filtered - inserted - failed
    if (skipped < 0) skipped = 0

  } catch (err) {
    errMsg = err.message
    console.error('Attendance sync error:', err)
  }

  // Update audit log
  if (logId) {
    await supabase.from('attendance_sync_log').update({
      finished_at: new Date().toISOString(),
      api_total: apiTotal, filtered, inserted, skipped, failed,
      error: errMsg
    }).eq('id', logId)
  }

  return Response.json({
    success: !errMsg,
    api_total: apiTotal, filtered, inserted, skipped, failed,
    error: errMsg
  })
}

export async function GET(request) {
  // Same as POST — for cron flexibility
  return POST(request)
}