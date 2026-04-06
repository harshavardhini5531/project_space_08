import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: teams, error } = await supabase
      .from('team_registrations')
      .select('tech_stack')
      .not('tech_stack', 'is', null)

    if (error) {
      console.error('Error fetching tech counts:', error)
      return NextResponse.json({ counts: {} })
    }

    const counts = {}
    for (const team of (teams || [])) {
      const items = Array.isArray(team.tech_stack) ? team.tech_stack : []
      for (const item of items) {
        const trimmed = item.trim()
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1
      }
    }

    return NextResponse.json({ counts })
  } catch (err) {
    console.error('Tech counts error:', err)
    return NextResponse.json({ counts: {} })
  }
}