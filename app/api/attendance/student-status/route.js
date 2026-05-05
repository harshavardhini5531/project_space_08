// app/api/attendance/student-status/route.js
// Returns: today's 4-mode status, last 7 days grid, team absentees, streak

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  window: '9:00 – 11:00 AM', icon: 'sun'   },
  bright: { label: 'Bright', window: '1:00 – 3:00 PM',  icon: 'zap'   },
  dark:   { label: 'Dark',   window: '5:30 – 6:30 PM',  icon: 'sunset'},
  moon:   { label: 'Moon',   window: '8:00 – 10:00 PM', icon: 'moon'  },
}

// Roll number prefix → expected attendance roll
// (Project Space sync prepends '2' to API EmployeeCode)
function buildPunchSet(rows) {
  const set = new Set()
  rows.forEach(r => set.add(`${r.punch_date}|${r.punch_mode}`))
  return set
}

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()
    if (!rollNumber) return Response.json({ error: 'rollNumber required' }, { status: 400 })

    // Compute date range (last 7 days IST)
    const today = new Date()
    const todayIST = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const todayStr = todayIST.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(todayIST)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const startStr = sevenDaysAgo.toISOString().split('T')[0]

    // 1. Get all my punches in last 7 days (with mode)
    const { data: myPunches } = await supabase
      .from('attendance_logs')
      .select('punch_date, punch_mode')
      .eq('roll_number', rollNumber)
      .gte('punch_date', startStr)
      .lte('punch_date', todayStr)
      .not('punch_mode', 'is', null)

    const myPunchSet = buildPunchSet(myPunches || [])

    // Build 7-day grid: each day → array of 4 mode statuses
    const dayGrid = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayIST)
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
      const modes = MODES.map(m => ({
        mode: m,
        present: myPunchSet.has(`${dStr}|${m}`),
        ...MODE_META[m],
      }))
      const presentCount = modes.filter(m => m.present).length
      dayGrid.push({
        date: dStr,
        day_name: dayName,
        is_today: dStr === todayStr,
        modes,
        present_count: presentCount,
        attendance_pct: Math.round((presentCount / 4) * 100),
        is_absent: presentCount === 0,
      })
    }

    // 2. Today's status (just take last day)
    const todayRow = dayGrid[dayGrid.length - 1]

    // 3. Streak calculation — consecutive days with at least 1 punch (newest backward)
    let streak = 0
    for (let i = dayGrid.length - 1; i >= 0; i--) {
      if (dayGrid[i].present_count > 0) streak++
      else break
    }

    // 4. Absent days in last 7
    const absentDays = dayGrid.filter(d => d.is_absent).map(d => ({
      date: d.date,
      day_name: d.day_name,
    }))

    // 5. Team absentees today
    let teamAbsentees = []
    try {
      // Find my team
      const { data: myTeamRow } = await supabase
        .from('team_members')
        .select('team_number')
        .eq('roll_number', rollNumber)
        .maybeSingle()

      if (myTeamRow?.team_number) {
        // Get all team members
        const { data: teammates } = await supabase
          .from('team_members')
          .select('roll_number, name')
          .eq('team_number', myTeamRow.team_number)
          .neq('roll_number', rollNumber) // exclude self

        const teammateRolls = (teammates || []).map(t => t.roll_number)
        if (teammateRolls.length > 0) {
          // Get today's punches for teammates
          const { data: teammatePunches } = await supabase
            .from('attendance_logs')
            .select('roll_number, punch_mode')
            .eq('punch_date', todayStr)
            .in('roll_number', teammateRolls)
            .not('punch_mode', 'is', null)

          const teammatePunchMap = {}
          ;(teammatePunches || []).forEach(p => {
            if (!teammatePunchMap[p.roll_number]) teammatePunchMap[p.roll_number] = new Set()
            teammatePunchMap[p.roll_number].add(p.punch_mode)
          })

          teamAbsentees = (teammates || []).map(t => {
            const punches = teammatePunchMap[t.roll_number] || new Set()
            return {
              roll_number: t.roll_number,
              name: t.name,
              present_modes: Array.from(punches),
              present_count: punches.size,
              is_absent: punches.size === 0,
              attendance_pct: Math.round((punches.size / 4) * 100),
            }
          })
        }
      }
    } catch (e) {
      // Team data fetch failure is non-fatal
      console.error('Team absentees fetch failed:', e)
    }

    // 6. Overall stats for the 7-day window
    const totalPossible = dayGrid.length * 4
    const totalPresent = dayGrid.reduce((s, d) => s + d.present_count, 0)
    const overallPct = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0

    return Response.json({
      today: todayRow,
      day_grid: dayGrid,
      streak,
      absent_days: absentDays,
      team_absentees: teamAbsentees,
      stats: {
        total_present: totalPresent,
        total_possible: totalPossible,
        overall_pct: overallPct,
        days_absent: absentDays.length,
      },
      modes_meta: MODE_META,
    })
  } catch (err) {
    console.error('Student attendance error:', err)
    return Response.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}