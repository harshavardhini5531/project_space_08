import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: teams, error } = await supabase
      .from('team_registrations')
      .select('project_area')
      .not('project_area', 'is', null)

    if (error) {
      console.error('Error fetching area counts:', error)
      return NextResponse.json({ counts: {} })
    }

    const counts = {}
    for (const team of (teams || [])) {
      const areas = Array.isArray(team.project_area)
        ? team.project_area
        : typeof team.project_area === 'string'
          ? [team.project_area]
          : []
      for (const area of areas) {
        const trimmed = area.trim()
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1
      }
    }

    return NextResponse.json({ counts })
  } catch (err) {
    console.error('Area counts error:', err)
    return NextResponse.json({ counts: {} })
  }
}