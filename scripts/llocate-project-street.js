// scripts/allocate-project-street.js
// One-time: assigns each team to a project_street_date (May 6-11, 2026)
// Distribution: 6 days, balanced by technology, proportional mix.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const DAYS = [
  { day: 1, date: '2026-05-06' },
  { day: 2, date: '2026-05-07' },
  { day: 3, date: '2026-05-08' },
  { day: 4, date: '2026-05-09' },
  { day: 5, date: '2026-05-10' },
  { day: 6, date: '2026-05-11' },
]

// Per-day quotas for Drive Ready (must sum to total of each tech)
const DR_QUOTAS = {
  'Full Stack':       [6, 5, 6, 5, 5, 5],   // sum=32
  'Data Specialist':  [4, 4, 4, 4, 4, 3],   // sum=23
  'AWS Development':  [4, 4, 4, 4, 3, 3],   // sum=22
  'Google Flutter':   [3, 3, 2, 3, 2, 2],   // sum=15
  'VLSI':             [2, 2, 2, 2, 1, 1],   // sum=10
  'ServiceNow':       [2, 2, 2, 2, 2, 1],   // sum=11
}

// Skillup Coder per-day (8,8,8,8,8,7 = 47)
const SC_QUOTAS = [8, 8, 8, 8, 8, 7]

async function run() {
  console.log('Fetching teams...')
  const { data: teams, error } = await supabase
    .from('teams')
    .select('team_number, technology, batch')
    .order('team_number', { ascending: true })

  if (error) { console.error(error); process.exit(1) }
  console.log(`Total teams: ${teams.length}`)

  const updates = []  // {team_number, date, day}

  // 1) Drive Ready by technology
  for (const [tech, quotas] of Object.entries(DR_QUOTAS)) {
    const teamsInTech = teams.filter(t => t.technology === tech && t.batch === 'Drive Ready')
    let cursor = 0
    for (let i = 0; i < DAYS.length; i++) {
      const slice = teamsInTech.slice(cursor, cursor + quotas[i])
      slice.forEach(t => updates.push({ team_number: t.team_number, date: DAYS[i].date, day: DAYS[i].day }))
      cursor += quotas[i]
    }
    if (cursor !== teamsInTech.length) {
      console.warn(`⚠ Tech ${tech}: expected ${teamsInTech.length}, distributed ${cursor}`)
    }
  }

  // 2) Skillup Coder
  const scTeams = teams.filter(t => t.batch === 'SkillUp Coder')
  let cursor = 0
  for (let i = 0; i < DAYS.length; i++) {
    const slice = scTeams.slice(cursor, cursor + SC_QUOTAS[i])
    slice.forEach(t => updates.push({ team_number: t.team_number, date: DAYS[i].date, day: DAYS[i].day }))
    cursor += SC_QUOTAS[i]
  }
  if (cursor !== scTeams.length) {
    console.warn(`⚠ Skillup Coder: expected ${scTeams.length}, distributed ${cursor}`)
  }

  console.log(`Updates queued: ${updates.length}`)

  // 3) Apply updates
  let applied = 0
  for (const u of updates) {
    const { error: ue } = await supabase
      .from('teams')
      .update({ project_street_date: u.date, project_street_day: u.day })
      .eq('team_number', u.team_number)
    if (ue) {
      console.error(`Failed ${u.team_number}:`, ue.message)
    } else {
      applied++
    }
  }
  console.log(`✓ Applied ${applied}/${updates.length} updates`)

  // 4) Verify
  const verify = await supabase
    .from('teams')
    .select('project_street_date, technology, batch')
  const grouped = {}
  for (const t of verify.data) {
    const k = `${t.project_street_date}`
    grouped[k] = (grouped[k] || 0) + 1
  }
  console.log('\nDay-by-day allocation:')
  Object.entries(grouped).sort().forEach(([d, c]) => console.log(`  ${d}: ${c} teams`))
}

run().catch(err => { console.error(err); process.exit(1) })