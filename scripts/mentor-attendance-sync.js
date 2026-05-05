// scripts/mentor-attendance-sync.js
// Cron: every 10 minutes
// Pulls mentor attendance from office.technicalhub.io APIs and inserts into attendance_logs.

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// IST hour → mode classification
function classifyMode(punchAt) {
  const istDate = new Date(new Date(punchAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hour = istDate.getHours()
  if (hour >= 9 && hour <= 10) return 'light'
  if (hour >= 13 && hour <= 14) return 'bright'
  if (hour >= 17 && hour <= 18) return 'dark'
  if (hour >= 20 && hour <= 21) return 'moon'
  return null
}

async function fetchCurrentDate() {
  const url = 'https://office.technicalhub.io/hrmsapiforcurrectdate.php'
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      console.error(`[mentor-sync] Current date API returned ${res.status}`)
      return []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.records || data?.data || [])
  } catch (err) {
    console.error('[mentor-sync] Current date fetch failed:', err.message)
    return []
  }
}

async function fetchByDate(date) {
  // date format: YYYY-MM-DD
  const url = 'https://office.technicalhub.io/hrmsapifordatewise.php'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    if (!res.ok) {
      console.error(`[mentor-sync] Date API returned ${res.status} for ${date}`)
      return []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : (data?.records || data?.data || [])
  } catch (err) {
    console.error(`[mentor-sync] Date fetch failed for ${date}:`, err.message)
    return []
  }
}

async function syncRecords(records) {
  if (!records || records.length === 0) return { inserted: 0, skipped: 0 }

  // Normalize each record
  // Possible field names from API: EmployeeCode/employee_code, PunchTime/punch_at, etc.
  const inserts = []
  for (const rec of records) {
    const empCode = String(rec.EmployeeCode || rec.employee_code || rec.empCode || '').trim()
    if (!empCode) continue

    // Try multiple punch-time field shapes
    const rawTime = rec.PunchTime || rec.punch_time || rec.punch_at || rec.PunchDateTime || rec.datetime
    if (!rawTime) continue

    const punchAt = new Date(rawTime)
    if (isNaN(punchAt.getTime())) continue

    const punchDate = punchAt.toISOString().split('T')[0]
    const punchMode = classifyMode(punchAt.toISOString())

    inserts.push({
      employee_code: empCode,
      roll_number: empCode,
      device_serial: rec.DeviceSerial || rec.device_serial || null,
      device_id: rec.DeviceID || rec.device_id || null,
      punch_at: punchAt.toISOString(),
      punch_date: punchDate,
      source: 'office_api',
      user_type: 'mentor',
      punch_mode: punchMode,
      punch_label: rec.PunchLabel || rec.punch_label || null,
    })
  }

  if (inserts.length === 0) return { inserted: 0, skipped: 0 }

  // Dedupe against existing — use composite key (employee_code, punch_at)
  // Round to minute to be safe with re-fetches
  const empCodes = Array.from(new Set(inserts.map(i => i.employee_code)))
  const earliestDate = inserts.reduce((min, i) => i.punch_date < min ? i.punch_date : min, inserts[0].punch_date)

  const { data: existing } = await supabase
    .from('attendance_logs')
    .select('employee_code, punch_at')
    .in('employee_code', empCodes)
    .gte('punch_date', earliestDate)
    .eq('source', 'office_api')

  const existingKeys = new Set((existing || []).map(e => {
    // Round to nearest minute for collision check
    const t = new Date(e.punch_at)
    return `${e.employee_code}|${Math.floor(t.getTime() / 60000)}`
  }))

  const newInserts = inserts.filter(i => {
    const t = new Date(i.punch_at)
    const key = `${i.employee_code}|${Math.floor(t.getTime() / 60000)}`
    return !existingKeys.has(key)
  })

  if (newInserts.length === 0) {
    return { inserted: 0, skipped: inserts.length }
  }

  // Batch insert
  const chunkSize = 500
  let totalInserted = 0
  for (let i = 0; i < newInserts.length; i += chunkSize) {
    const chunk = newInserts.slice(i, i + chunkSize)
    const { error } = await supabase.from('attendance_logs').insert(chunk)
    if (error) {
      console.error('[mentor-sync] Insert chunk failed:', error.message)
      break
    }
    totalInserted += chunk.length
  }

  return { inserted: totalInserted, skipped: existingKeys.size }
}

async function run() {
  const startTime = Date.now()
  console.log(`[mentor-sync] Starting sync at ${new Date().toISOString()}`)

  // 1. Fetch today's punches
  const todayRecords = await fetchCurrentDate()
  console.log(`[mentor-sync] Fetched ${todayRecords.length} records from current-date API`)

  // 2. Optionally fetch yesterday too (catches late punches)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayRecords = await fetchByDate(yesterdayStr)
  console.log(`[mentor-sync] Fetched ${yesterdayRecords.length} records for ${yesterdayStr}`)

  // 3. Combine + sync
  const all = [...todayRecords, ...yesterdayRecords]
  const result = await syncRecords(all)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[mentor-sync] Done in ${elapsed}s — Inserted: ${result.inserted}, Skipped: ${result.skipped}`)

  // Log to attendance_sync_log table if it exists
  try {
    await supabase.from('attendance_sync_log').insert({
      sync_type: 'mentor',
      records_fetched: all.length,
      records_inserted: result.inserted,
      records_skipped: result.skipped,
      duration_seconds: parseFloat(elapsed),
    })
  } catch {}
}

run().catch(err => {
  console.error('[mentor-sync] Fatal error:', err)
  process.exit(1)
})