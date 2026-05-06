// scripts/snapshot-attendance.js
// Runs at 11:55 PM daily — locks today's attendance counts permanently into attendance_snapshots
// Use as a safety net: even if attendance_logs gets corrupted/deleted, snapshots survive forever

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fetchAll(buildQuery, label = 'query') {
  let all = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1)
    if (error) { console.error(`[${label}]`, error.message); break }
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function fetchAllByIn(buildBaseQuery, column, values, label = 'query') {
  const all = []
  for (let i = 0; i < values.length; i += 500) {
    const chunk = values.slice(i, i + 500)
    const rows = await fetchAll(() => buildBaseQuery().in(column, chunk), `${label}-${i/500}`)
    all.push(...rows)
  }
  return all
}

async function run() {
  // Optionally accept a date argument: node snapshot-attendance.js 2026-05-06
  const arg = process.argv[2]
  const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const snapDate = arg || todayIST.toISOString().split('T')[0]

  console.log(`[snapshot] Building snapshot for ${snapDate}...`)

  // 1. Fetch teams
  const teams = await fetchAll(() => supabase.from('teams').select('team_number, technology, mentor_assigned'), 'teams')
  const teamNums = teams.map(t => t.team_number).filter(Boolean)
  const teamMap = {}
  teams.forEach(t => { teamMap[t.team_number] = t })

  // 2. Fetch team_members
  const members = await fetchAllByIn(
    () => supabase.from('team_members').select('team_number, roll_number'),
    'team_number', teamNums,
    'team-members'
  )
  const memberRolls = members.map(m => m.roll_number).filter(Boolean)
  const memberTeamMap = {}
  members.forEach(m => { memberTeamMap[m.roll_number] = m.team_number })

  // 3. Fetch ALL punches for the date (paginated)
  const punches = await fetchAll(
    () => supabase.from('attendance_logs')
      .select('roll_number, punch_mode, user_type')
      .eq('punch_date', snapDate)
      .not('punch_mode', 'is', null),
    'punches'
  )
  console.log(`[snapshot] Loaded ${punches.length} punches`)

  // 4. Build per-roll mode map
  const rollMap = {}
  punches.forEach(p => {
    if (!rollMap[p.roll_number]) rollMap[p.roll_number] = { modes: new Set(), user_type: p.user_type || 'unknown' }
    rollMap[p.roll_number].modes.add(p.punch_mode)
  })

  // 5. Build snapshot rows — one per roll number that has at least 1 punch OR is a team member
  const allRolls = new Set([...Object.keys(rollMap), ...memberRolls])
  const rows = [...allRolls].map(roll => {
    const data = rollMap[roll] || { modes: new Set(), user_type: 'unknown' }
    const teamNum = memberTeamMap[roll] || null
    const team = teamNum ? teamMap[teamNum] : {}
    return {
      snapshot_date: snapDate,
      roll_number: roll,
      user_type: data.user_type,
      light_present: data.modes.has('light'),
      bright_present: data.modes.has('bright'),
      dark_present: data.modes.has('dark'),
      moon_present: data.modes.has('moon'),
      total_modes: data.modes.size,
      team_number: teamNum,
      technology: team.technology || null,
      mentor_assigned: team.mentor_assigned || null,
    }
  })

  console.log(`[snapshot] Building ${rows.length} snapshot rows`)

  // 6. Upsert in batches (won't overwrite — snapshots are append-only via UNIQUE constraint)
  let inserted = 0, failed = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error } = await supabase
      .from('attendance_snapshots')
      .upsert(batch, { onConflict: 'snapshot_date,roll_number' })
    if (error) { failed += batch.length; console.error('[snapshot] batch error:', error.message) }
    else inserted += batch.length
  }

  console.log(`[snapshot] Done — ${inserted} rows saved, ${failed} failed`)
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })