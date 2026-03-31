// fetch-maya-data.js
// Run: set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key && node fetch-maya-data.js
// This fetches all Maya coding data and stores totals in Supabase

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://yiwyfhdzgvlsmdeshdgv.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_KEY) {
  console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const APIS = [
  'http://node.technicalhub.io:4001/api/get-students-data-by-acet',
  'http://node.technicalhub.io:4001/api/get-students-data-by-aec',
]

async function fetchAndStore() {
  const body = JSON.stringify({ fromDate: '2024-09-01', toDate: new Date().toISOString().split('T')[0] })
  const studentTotals = {}

  for (const url of APIS) {
    console.log('Fetching:', url)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) { console.log('  Error:', res.status); continue }
      const data = await res.json()
      console.log('  Got', data.length, 'records')

      for (const r of data) {
        const roll = r.roll_no?.toUpperCase()
        if (!roll) continue
        if (!studentTotals[roll]) {
          studentTotals[roll] = { c: 0, cpp: 0, java: 0, python: 0, days: new Set() }
        }
        studentTotals[roll].c += r.c || 0
        studentTotals[roll].cpp += r.cpp || 0
        studentTotals[roll].java += r.java || 0
        studentTotals[roll].python += r.python || 0
        if (r.date) studentTotals[roll].days.add(r.date)
      }
    } catch (e) {
      console.log('  Failed:', e.message)
    }
  }

  const rolls = Object.keys(studentTotals)
  console.log('\nTotal students with coding data:', rolls.length)

  // Update student_profiles table with maya coding data
  let updated = 0
  let notFound = 0
  const BATCH = 50

  for (let i = 0; i < rolls.length; i += BATCH) {
    const batch = rolls.slice(i, i + BATCH)
    for (const roll of batch) {
      const t = studentTotals[roll]
      const { error } = await supabase
        .from('student_profiles')
        .update({
          maya_c: t.c,
          maya_cpp: t.cpp,
          maya_java: t.java,
          maya_python: t.python,
          maya_total: t.c + t.cpp + t.java + t.python,
          maya_active_days: t.days.size,
        })
        .eq('roll_number', roll)

      if (error) {
        notFound++
      } else {
        updated++
      }
    }
    console.log(`Progress: ${Math.min(i + BATCH, rolls.length)}/${rolls.length}`)
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found in student_profiles`)
}

fetchAndStore().catch(console.error)
