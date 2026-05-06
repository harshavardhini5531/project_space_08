import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { teamNumber } = await req.json()
    if (!teamNumber) return NextResponse.json({ error: 'teamNumber required' }, { status: 400 })

    const { data, error } = await supabase
      .from('teams')
      .select('team_number, project_street_date, project_street_day, project_title, technology')
      .eq('team_number', teamNumber)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

    return NextResponse.json({
      teamNumber: data.team_number,
      projectStreetDate: data.project_street_date,
      projectStreetDay: data.project_street_day,
      projectTitle: data.project_title,
      technology: data.technology
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
