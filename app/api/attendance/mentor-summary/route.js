// app/api/attendance/mentor-summary/route.js
// Returns: mentor's self-attendance + per-team summary + combined mentorship score

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  window: '9:00 – 11:00 AM' },
  bright: { label: 'Bright', window: '1:00 – 3:00 PM'  },
  dark:   { label: 'Dark',   window: '5:30 – 6:30 PM'  },
  moon:   { label: 'Moon',   window: '8:00 – 10:00 PM' },
}

export async function POST(request) {
  try {
    const { mentorEmail, days = 7 } = await request.json()
    if (!mentorEmail) return Response.json({ error: 'mentorEmail required' }, { status: 400 })

    // 1. Get mentor record
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email, technology, emp_id, image_url')
      .eq('email', mentorEmail)
      .maybeSingle()

    if (!mentor) return Response.json({ error: 'Mentor not found' }, { status: 404 })

    // Compute date window
    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const todayStr = todayIST.toISOString().split('T')[0]
    const startDate = new Date(todayIST)
    startDate.setDate(startDate.getDate() - (days - 1))
    const startStr = startDate.toISOString().split('T')[0]

    // 2. Mentor's own attendance — match by emp_id
    let mentorPunchSet = new Set()
    let mentorTodaySet = new Set()
    if (mentor.emp_id) {
      const { data: mentorPunches } = await supabase
        .from('attendance_logs')
        .select('punch_date, punch_mode')
        .eq('employee_code', String(mentor.emp_id))
        .gte('punch_date', startStr)
        .lte('punch_date', todayStr)
        .not('punch_mode', 'is', null)
      ;(mentorPunches || []).forEach(p => {
        mentorPunchSet.add(`${p.punch_date}|${p.punch_mode}`)
        if (p.punch_date === todayStr) mentorTodaySet.add(p.punch_mode)
      })
    }

    // Build mentor's 7-day self grid
    const mentorDayGrid = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayIST)
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const modes = MODES.map(m => ({
        mode: m,
        label: MODE_META[m].label,
        present: mentorPunchSet.has(`${dStr}|${m}`),
      }))
      mentorDayGrid.push({
        date: dStr,
        day_name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        is_today: dStr === todayStr,
        modes,
        present_count: modes.filter(m => m.present).length,
      })
    }

    const mentorTodayCount = mentorTodaySet.size
    const mentorTodayPresent = mentorTodayCount > 0
    const mentorTotalPunches = mentorDayGrid.reduce((s, d) => s + d.present_count, 0)
    const mentorPct = days > 0 ? Math.round((mentorTotalPunches / (days * 4)) * 100) : 0

    // 3. Get all teams assigned to this mentor
    const { data: teams } = await supabase
      .from('teams')
      .select('team_number, project_title, technology, mentor_assigned')
      .eq('mentor_assigned', mentor.name)

    const teamNumbers = (teams || []).map(t => t.team_number).filter(Boolean)

    if (teamNumbers.length === 0) {
      return Response.json({
        mentor: { ...mentor, today_present: mentorTodayPresent, today_modes: Array.from(mentorTodaySet), today_count: mentorTodayCount, day_grid: mentorDayGrid, attendance_pct: mentorPct },
        teams: [],
        combined: { total_students: 0, total_present_today: 0, total_absent_today: 0, attendance_pct: 0, mode_breakdown: {} },
        modes_meta: MODE_META,
      })
    }

    // 4. Get all team members for these teams
    const { data: members } = await supabase
      .from('team_members')
      .select('team_number, roll_number, name, is_leader')
      .in('team_number', teamNumbers)

    const memberRolls = (members || []).map(m => m.roll_number).filter(Boolean)

    // 5. Get all student punches in window
    const { data: studentPunches } = await supabase
      .from('attendance_logs')
      .select('roll_number, punch_date, punch_mode')
      .in('roll_number', memberRolls)
      .gte('punch_date', startStr)
      .lte('punch_date', todayStr)
      .not('punch_mode', 'is', null)

    // Build punch lookup: rollNumber → { date|mode → true }
    const studentPunchMap = {}
    ;(studentPunches || []).forEach(p => {
      if (!studentPunchMap[p.roll_number]) studentPunchMap[p.roll_number] = { byKey: new Set(), byDate: {} }
      studentPunchMap[p.roll_number].byKey.add(`${p.punch_date}|${p.punch_mode}`)
      if (!studentPunchMap[p.roll_number].byDate[p.punch_date]) studentPunchMap[p.roll_number].byDate[p.punch_date] = new Set()
      studentPunchMap[p.roll_number].byDate[p.punch_date].add(p.punch_mode)
    })

    // 6. Build per-team summary
    const teamSummaries = (teams || []).map(team => {
      const teamMembers = (members || []).filter(m => m.team_number === team.team_number)

      const memberDetails = teamMembers.map(m => {
        const data = studentPunchMap[m.roll_number] || { byKey: new Set(), byDate: {} }
        const todayModes = Array.from(data.byDate[todayStr] || [])
        const todayCount = todayModes.length

        // Build absent days list (within window)
        const absentDays = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(todayIST)
          d.setDate(d.getDate() - i)
          const dStr = d.toISOString().split('T')[0]
          const punchedToday = (data.byDate[dStr] || new Set()).size
          if (punchedToday === 0) absentDays.push(dStr)
        }

        // 7-day mode grid
        const modeGrid = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(todayIST)
          d.setDate(d.getDate() - i)
          const dStr = d.toISOString().split('T')[0]
          const modes = MODES.map(mode => ({
            mode,
            present: data.byKey.has(`${dStr}|${mode}`),
          }))
          modeGrid.push({ date: dStr, modes, count: modes.filter(x => x.present).length })
        }

        const totalPunches = modeGrid.reduce((s, d) => s + d.count, 0)
        const pct = days > 0 ? Math.round((totalPunches / (days * 4)) * 100) : 0

        return {
          roll_number: m.roll_number,
          name: m.name,
          is_leader: m.is_leader,
          today_modes: todayModes,
          today_count: todayCount,
          today_present: todayCount > 0,
          absent_days: absentDays,
          attendance_pct: pct,
          mode_grid: modeGrid,
        }
      })

      const todayPresent = memberDetails.filter(m => m.today_present).length
      const todayAbsent = memberDetails.length - todayPresent
      const teamPct = memberDetails.length > 0
        ? Math.round((memberDetails.reduce((s, m) => s + m.attendance_pct, 0) / memberDetails.length))
        : 0

      // Mode-wise breakdown for today
      const modeBreakdown = {}
      MODES.forEach(mode => {
        modeBreakdown[mode] = memberDetails.filter(m => m.today_modes.includes(mode)).length
      })

      return {
        team_number: team.team_number,
        project_title: team.project_title,
        technology: team.technology,
        total_members: memberDetails.length,
        today_present: todayPresent,
        today_absent: todayAbsent,
        attendance_pct: teamPct,
        today_pct: memberDetails.length > 0 ? Math.round((todayPresent / memberDetails.length) * 100) : 0,
        mode_breakdown: modeBreakdown,
        members: memberDetails,
      }
    })

    // 7. Combined mentorship summary
    const totalStudents = teamSummaries.reduce((s, t) => s + t.total_members, 0)
    const totalPresent = teamSummaries.reduce((s, t) => s + t.today_present, 0)
    const totalAbsent = totalStudents - totalPresent
    const combinedPct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0

    const combinedModeBreakdown = {}
    MODES.forEach(mode => {
      combinedModeBreakdown[mode] = teamSummaries.reduce((s, t) => s + (t.mode_breakdown[mode] || 0), 0)
    })

    return Response.json({
      mentor: {
        ...mentor,
        today_present: mentorTodayPresent,
        today_modes: Array.from(mentorTodaySet),
        today_count: mentorTodayCount,
        day_grid: mentorDayGrid,
        attendance_pct: mentorPct,
        total_punches: mentorTotalPunches,
      },
      teams: teamSummaries,
      combined: {
        total_students: totalStudents,
        total_present_today: totalPresent,
        total_absent_today: totalAbsent,
        attendance_pct: combinedPct,
        mode_breakdown: combinedModeBreakdown,
      },
      modes_meta: MODE_META,
      window_days: days,
      today_date: todayStr,
    })
  } catch (err) {
    console.error('Mentor attendance error:', err)
    return Response.json({ error: 'Failed to fetch mentor attendance' }, { status: 500 })
  }
}