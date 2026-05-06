#!/usr/bin/env node
// scripts/attendance-sync.js
// Standalone attendance sync — pulls all event days from new POST API

require('dotenv').config({ path: '/var/www/project_space_08/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ALLOWED_SERIALS = new Set([
  'CQIK222660267', 'CQIK222660127', 'CQIK222660348', 'CQIK222660347',
  'CQIK222560847', 'CQIK222660349', 'CQIK222660126', 'CQIK222660354',
  'CQIK222660352', 'M014200992108001153', 'NCD8245300366', 'NCD8245300358',
  'CQIK222660344'
])

// All 7 event dates (Project Space May 6–12, 2026)
const EVENT_DATES = [
  '06-05-2026',
  '07-05-2026',
  '08-05-2026',
  '09-05-2026',
  '10-05-2026',
  '11-05-2026',
  '12-05-2026'
]

function toRollNumber(empCode) {
  if (!empCode) return null
  const trimmed = String(empCode).trim().toUpperCase()
  if (/^2[0-9]/.test(trimmed)) return trimmed
  if (/^[0-9]+$/.test(trimmed)) return trimmed
  return '2' + trimmed
}

// Continuous mode classification
function classifyMode(punchAtIso) {
  const utc = new Date(punchAtIso)
  const istMs = utc.getTime() + (5.5 * 60 * 60 * 1000)
  const hour = new Date(istMs).getUTCHours()
  if (hour < 11) return 'light'
  if (hour < 17) return 'bright'
  if (hour < 20) return 'dark'
  return 'moon'
}

async function classifyUserType(rollNumbers) {
  const map = {}
  if (rollNumbers.length === 0) return map
  const numericRolls = rollNumbers.filter(r => /^[0-9]+$/.test(r))
  if (numericRolls.length > 0) {
    const { data: mentors } = await supabase.from('mentors').select('emp_id').in('emp_id', numericRolls)
    ;(mentors || []).forEach(m => { map[m.emp_id] = 'mentor' })
  }
  const studentRolls = rollNumbers.filter(r => !/^[0-9]+$/.test(r))
  for (let i = 0; i < studentRolls.length; i += 200) {
    const batch = studentRolls.slice(i, i + 200)
    const { data: students } = await supabase.from('students').select('roll_number').in('roll_number', batch)
    ;(students || []).forEach(s => { map[s.roll_number] = 'student' })
  }
  return map
}

// Pick the date dimension only of an event date in YYYY-MM-DD form (IST)
function dateOnlyIST(punchAt) {
  return new Date(punchAt.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().slice(0, 10)
}

// Fetch from POST API for a specific date
async function fetchForDate(dateStr) {
  try {
    const r = await fetch('https://maya.technicalhub.io/node/api/get-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: [dateStr] })
    })
    if (!r.ok) {
      console.error(`[${dateStr}] API ${r.status}`)
      return []
    }
    const data = await r.json()
    return Array.isArray(data) ? data : (data.data || [])
  } catch (e) {
    console.error(`[${dateStr}] fetch failed:`, e.message)
    return []
  }
}

async function run() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const startedAt = new Date()
  const { data: logEntry } = await supabase
    .from('attendance_sync_log')
    .insert({ source: 'cron', started_at: startedAt.toISOString() })
    .select('id')
    .single()
  const logId = logEntry?.id

  let apiTotal = 0, filtered = 0, inserted = 0, skipped = 0, failed = 0, errMsg = null
  let perDayBreakdown = {}

  try {
    // Today (IST) date
    const todayIST = dateOnlyIST(new Date())

    // Sync TODAY every run + historical days only if behind
    const datesToSync = [todayIST.split('-').reverse().join('-')] // DD-MM-YYYY

    // Add prior event dates (run once daily — every cron run is fine since DB upserts ignore dupes)
    const prior = EVENT_DATES.filter(d => {
      const [dd, mm, yyyy] = d.split('-')
      const dateIso = `${yyyy}-${mm}-${dd}`
      return dateIso < todayIST
    })
    datesToSync.push(...prior)

    for (const dateStr of datesToSync) {
      const arr = await fetchForDate(dateStr)
      apiTotal += arr.length

      const filteredArr = arr.filter(x => ALLOWED_SERIALS.has(x.after?.Serialnumber))
      filtered += filteredArr.length

      if (filteredArr.length === 0) {
        perDayBreakdown[dateStr] = { api: arr.length, filtered: 0, inserted: 0 }
        continue
      }

      const rolls = [...new Set(filteredArr.map(x => toRollNumber(x.after?.EmployeeCode)).filter(Boolean))]
      const userTypeMap = await classifyUserType(rolls)

      const rows = filteredArr.map(x => {
        const empCode = x.after?.EmployeeCode
        const rollNumber = toRollNumber(empCode)
        const punchAt = new Date(x.after?.timestamp || x.after?.LogDateTime)
        const punchAtIso = punchAt.toISOString()
        return {
          employee_code: empCode,
          roll_number: rollNumber,
          device_serial: x.after?.Serialnumber,
          device_id: String(x.after?.Deviceid || ''),
          punch_at: punchAtIso,
          punch_date: dateOnlyIST(punchAt),
          punch_mode: classifyMode(punchAtIso),
          source: 'api',
          user_type: userTypeMap[rollNumber] || 'unknown'
        }
      }).filter(r => r.employee_code && r.punch_at)

      let dayInserted = 0, dayFailed = 0
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500)
        const { error } = await supabase.from('attendance_logs').upsert(batch, { onConflict: 'employee_code,punch_at', ignoreDuplicates: true })
        if (error) { dayFailed += batch.length; console.error(`[${dateStr}] Batch error:`, error.message) }
        else dayInserted += batch.length
      }

      inserted += dayInserted
      failed += dayFailed
      perDayBreakdown[dateStr] = { api: arr.length, filtered: filteredArr.length, inserted: dayInserted }
      console.log(`[${dateStr}] api=${arr.length} filtered=${filteredArr.length} inserted=${dayInserted}`)
    }

    skipped = Math.max(0, filtered - inserted - failed)

  } catch (err) {
    errMsg = err.message
    console.error('SYNC FAILED:', err)
  }

  if (logId) {
    await supabase.from('attendance_sync_log').update({
      finished_at: new Date().toISOString(),
      api_total: apiTotal, filtered, inserted, skipped, failed, error: errMsg
    }).eq('id', logId)
  }

  console.log(`[${new Date().toISOString()}] Sync done: api=${apiTotal} filtered=${filtered} inserted=${inserted} skipped=${skipped} failed=${failed} ${errMsg ? 'ERROR: ' + errMsg : ''}`)
  console.log('Per-day:', JSON.stringify(perDayBreakdown))
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })