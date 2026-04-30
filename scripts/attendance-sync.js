#!/usr/bin/env node
// scripts/attendance-sync.js
// Standalone attendance sync — runs from cron without HTTP overhead

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

function toRollNumber(empCode) {
  if (!empCode) return null
  const trimmed = String(empCode).trim().toUpperCase()
  if (/^2[0-9]/.test(trimmed)) return trimmed
  if (/^[0-9]+$/.test(trimmed)) return trimmed
  return '2' + trimmed
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

  try {
    const r = await fetch('https://maya.technicalhub.io/node/api/get-attendancelogs')
    if (!r.ok) throw new Error(`Maya API ${r.status}`)
    const data = await r.json()
    const arr = Array.isArray(data) ? data : (data.data || [])
    apiTotal = arr.length

    const filteredArr = arr.filter(x => ALLOWED_SERIALS.has(x.after?.Serialnumber))
    filtered = filteredArr.length

    if (filtered === 0) {
      await supabase.from('attendance_sync_log').update({
        finished_at: new Date().toISOString(), api_total: apiTotal, filtered: 0, inserted: 0
      }).eq('id', logId)
      console.log(`[${new Date().toISOString()}] Sync OK: no event-device punches (${apiTotal} total in API)`)
      return
    }

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

    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500)
      const { error } = await supabase.from('attendance_logs').upsert(batch, { onConflict: 'employee_code,punch_at', ignoreDuplicates: true })
      if (error) { failed += batch.length; console.error('Batch error:', error.message) }
      else inserted += batch.length
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

  console.log(`[${new Date().toISOString()}] Sync done: api=${apiTotal} filtered=${filtered} inserted=${inserted} skipped=${skipped} failed=${failed} ${errMsg ? 'ERROR: '+errMsg : ''}`)
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })