// scripts/mentor-attendance-sync.js
// Cron: every 10 minutes
// Pulls attendance from office.technicalhub.io and inserts into attendance_logs.
// Routes records into mentor or student rows based on DB lookup.

const { createClient } = require('@supabase/supabase-js')

// Load .env.local manually (no dotenv needed)
const fs = require('fs')
const path = require('path')
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) return
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  })
} catch (e) {
  console.error('[sync] Could not load .env.local:', e.message)
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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

async function fetchToday() {
  try {
    const r = await fetch('https://office.technicalhub.io/hrmsapiforcurrectdate.php')
    if (!r.ok) return []
    const d = await r.json()
    return Array.isArray(d) ? d : (d?.records || d?.data || [])
  } catch (e) { console.error('[sync] today fetch failed:', e.message); return [] }
}

async function fetchByDate(date) {
  try {
    const r = await fetch('https://office.technicalhub.io/hrmsapifordatewise.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    if (!r.ok) return []
    const d = await r.json()
    return Array.isArray(d) ? d : (d?.records || d?.data || [])
  } catch (e) { console.error(`[sync] date fetch failed for ${date}:`, e.message); return [] }
}

async function loadLookupSets() {
  // Build sets of valid mentor emp_ids and student roll_numbers
  const { data: mentors } = await supabase.from('mentors').select('emp_id').not('emp_id', 'is', null)
  const mentorEmpIds = new Set((mentors || []).map(m => String(m.emp_id).trim()))

  const { data: students } = await supabase.from('students').select('roll_number').not('roll_number', 'is', null)
  const studentRolls = new Set((students || []).map(s => String(s.roll_number).trim().toUpperCase()))

  return { mentorEmpIds, studentRolls }
}

async function syncRecords(records, lookups) {
  if (!records?.length) return { inserted: 0, skipped: 0, mentor_count: 0, student_count: 0, unknown: 0 }

  const { mentorEmpIds, studentRolls } = lookups
  const inserts = []
  let mentorCount = 0
  let studentCount = 0
  let unknownCount = 0

  for (const rec of records) {
    const apiEmpId = String(rec.Employee_id || '').trim()
    const rawTime = rec.LogDate
    if (!apiEmpId || !rawTime) continue

    // Parse LogDate as IST → UTC
    // LogDate format: "2026-05-04 23:24:28" (IST)
    const punchAt = new Date(`${rawTime.replace(' ', 'T')}+05:30`)
    if (isNaN(punchAt.getTime())) continue

    const punchDate = punchAt.toISOString().split('T')[0]
    const punchMode = classifyMode(punchAt.toISOString())

    // 1. Check mentor match (direct)
    if (mentorEmpIds.has(apiEmpId)) {
      inserts.push({
        employee_code: apiEmpId,
        roll_number: apiEmpId,
        device_id: String(rec.DeviceId || ''),
        punch_at: punchAt.toISOString(),
        punch_date: punchDate,
        source: 'office_api',
        user_type: 'mentor',
        punch_mode: punchMode,
      })
      mentorCount++
      continue
    }

    // 2. Check student match — prepend '2' to Employee_id
    const studentRoll = ('2' + apiEmpId).toUpperCase()
    if (studentRolls.has(studentRoll)) {
      inserts.push({
        employee_code: apiEmpId,
        roll_number: studentRoll,
        device_id: String(rec.DeviceId || ''),
        punch_at: punchAt.toISOString(),
        punch_date: punchDate,
        source: 'office_api',
        user_type: 'student',
        punch_mode: punchMode,
      })
      studentCount++
      continue
    }

    // 3. Unknown — skip
    unknownCount++
  }

  if (inserts.length === 0) {
    return { inserted: 0, skipped: 0, mentor_count: mentorCount, student_count: studentCount, unknown: unknownCount }
  }

  // Dedupe against existing — composite (employee_code, punch_at minute)
  const empCodes = Array.from(new Set(inserts.map(i => i.employee_code)))
  const earliestDate = inserts.reduce((min, i) => i.punch_date < min ? i.punch_date : min, inserts[0].punch_date)

  const { data: existing } = await supabase
    .from('attendance_logs')
    .select('employee_code, punch_at')
    .in('employee_code', empCodes)
    .gte('punch_date', earliestDate)
    .eq('source', 'office_api')

  const existingKeys = new Set((existing || []).map(e => {
    const t = new Date(e.punch_at)
    return `${e.employee_code}|${Math.floor(t.getTime() / 60000)}`
  }))

  const newInserts = inserts.filter(i => {
    const t = new Date(i.punch_at)
    return !existingKeys.has(`${i.employee_code}|${Math.floor(t.getTime() / 60000)}`)
  })

  if (newInserts.length === 0) {
    return { inserted: 0, skipped: inserts.length, mentor_count: mentorCount, student_count: studentCount, unknown: unknownCount }
  }

  // Batch insert
  const chunkSize = 500
  let totalInserted = 0
  for (let i = 0; i < newInserts.length; i += chunkSize) {
    const chunk = newInserts.slice(i, i + chunkSize)
    const { error } = await supabase.from('attendance_logs').insert(chunk)
    if (error) {
      console.error('[sync] Insert chunk failed:', error.message)
      break
    }
    totalInserted += chunk.length
  }

  return {
    inserted: totalInserted,
    skipped: inserts.length - totalInserted,
    mentor_count: mentorCount,
    student_count: studentCount,
    unknown: unknownCount,
  }
}

async function run() {
  const startTime = Date.now()
  console.log(`[sync] Starting at ${new Date().toISOString()}`)

  const lookups = await loadLookupSets()
  console.log(`[sync] Loaded ${lookups.mentorEmpIds.size} mentor IDs, ${lookups.studentRolls.size} student rolls`)

  const todayRecords = await fetchToday()
  console.log(`[sync] Fetched ${todayRecords.length} from current-date API`)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]
  const yRecords = await fetchByDate(yStr)
  console.log(`[sync] Fetched ${yRecords.length} for ${yStr}`)

  const all = [...todayRecords, ...yRecords]
  const result = await syncRecords(all, lookups)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[sync] Done in ${elapsed}s — Inserted: ${result.inserted}, Skipped: ${result.skipped}`)
  console.log(`[sync] Breakdown — Mentors: ${result.mentor_count}, Students: ${result.student_count}, Unknown: ${result.unknown}`)

  try {
    await supabase.from('attendance_sync_log').insert({
      sync_type: 'office_api',
      records_fetched: all.length,
      records_inserted: result.inserted,
      records_skipped: result.skipped,
      duration_seconds: parseFloat(elapsed),
    })
  } catch {}
}

run().catch(err => {
  console.error('[sync] Fatal error:', err)
  process.exit(1)
})