import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yiwyfhdzgvlsmdeshdgv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()

    if (!rollNumber) {
      return Response.json({ error: 'Roll number required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('roll_number', rollNumber)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Student profile not found' }, { status: 404 })
    }

    return Response.json({ profile: data })

  } catch (err) {
    console.error('Profile fetch error:', err)
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}