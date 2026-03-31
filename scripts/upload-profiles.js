// upload-profiles.js
// Run: node upload-profiles.js
// Make sure student-profiles-data.json is in the same directory

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://yiwyfhdzgvlsmdeshdgv.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY env variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function upload() {
  console.log('Reading student-profiles-data.json...')
  const data = JSON.parse(fs.readFileSync('./student-profiles-data.json', 'utf8'))
  console.log(`Found ${data.length} records`)

  // Upload in batches of 50
  const BATCH = 50
  let uploaded = 0
  let errors = 0

  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH)
    const { error } = await supabase
      .from('student_profiles')
      .upsert(batch, { onConflict: 'roll_number' })

    if (error) {
      console.error(`Batch ${i}-${i + batch.length} FAILED:`, error.message)
      errors += batch.length
    } else {
      uploaded += batch.length
      console.log(`✅ Uploaded ${uploaded}/${data.length}`)
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${errors} errors`)
}

upload().catch(console.error)
