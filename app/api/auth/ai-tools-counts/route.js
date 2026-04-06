import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: teams, error } = await supabase
      .from('team_registrations')
      .select('ai_tools')
      .not('ai_tools', 'is', null)

    if (error) {
      console.error('Error fetching AI tools counts:', error)
      return NextResponse.json({ counts: {} })
    }

    const counts = {}
    for (const team of (teams || [])) {
      const items = Array.isArray(team.ai_tools) ? team.ai_tools : []
      for (const item of items) {
        const trimmed = item.trim()
        if (trimmed) counts[trimmed] = (counts[trimmed] || 0) + 1
      }
    }

    return NextResponse.json({ counts })
  } catch (err) {
    console.error('AI tools counts error:', err)
    return NextResponse.json({ counts: {} })
  }
}