// app/api/attendance/mentor-summary/route.js
// FIXED EVENT WINDOW: May 6 – May 12, 2026 (always shows all 7 days)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  window: 'before 11 AM' },
  bright: { label: 'Bright', window: '11 AM – 5 PM' },
  dark:   { label: 'Dark',   window: '5 – 8 PM'  },
  moon:   { label: 'Moon',   window: '8 PM +' },
}

const MENTOR_MODES = ['morning', 'night']
const MENTOR_MODE_META = {
  morning: { label: 'Morning', window: 'after 5 AM' },
  night:   { label: 'Night',   window: 'after 10 PM' },
}

// ═══ EVENT WINDOW: May 6 – May 12, 2026 (fixed) ═══
const EVENT_DAYS = [
  { day: 1, date: '2026-05-06', day_name: 'Wed' },
  { day: 2, date: '2026-05-07', day_name: 'Thu' },
  { day: 3, date: '2026-05-08', day_name: 'Fri' },
  { day: 4, date: '2026-05-09', day_name: 'Sat' },
  { day: 5, date: '2026-05-10', day_name: 'Sun' },
  { day: 6, date: '2026-05-11', day_name: 'Mon' },
  { day: 7, date: '2026-05-12', day_name: 'Tue' },
]
const EVENT_START = EVENT_DAYS[0].date
const EVENT_END = EVENT_DAYS[EVENT_DAYS.length - 1].date

function mentorModeFromPunchAt(punchAtIso) {
  const d = new Date(punchAtIso)
  const istMs = d.getTime() + (5.5 * 60 * 60 * 1000)
  const istHour = new Date(istMs).getUTCHours()
  if (istHour >= 22) return 'night'
  if (istHour >= 5)  return 'morning'
  return null
}

export async function POST(request) {
  try {
    const { mentorEmail } = await request.json()
    if (!mentorEmail) return Response.json({ error: 'mentorEmail required' }, { status: 400 })

    // 1. Get mentor record
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email, technology, emp_id, image_url')
      .eq('email', mentorEmail)
      .maybeSingle()

    if (!mentor) return Response.json({ error: 'Mentor not found' }, { status: 404 })

    // Today (IST) for is_today / is_future flags
    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const todayStr = todayIST.toISOString().split('T')[0]

    // 2. Mentor's own attendance — fetch all punches in EVENT WINDOW (May 6 – May 12)
    let mentorPunchSet = new Set()
    let mentorTodaySet = new Set()
    if (mentor.emp_id) {
      let mentorPunches = []
      let from = 0
      const PAGE = 1000
      while (true) {
        const { data } = await supabase
          .from('attendance_logs')
          .select('punch_date, punch_at')
          .eq('employee_code', String(mentor.emp_id))
          .gte('punch_date', EVENT_START)
          .lte('punch_date', EVENT_END)
          .range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        mentorPunches = mentorPunches.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      mentorPunches.forEach(p => {
        const mMode = mentorModeFromPunchAt(p.punch_at)
        if (!mMode) return
        mentorPunchSet.add(`${p.punch_date}|${mMode}`)
        if (p.punch_date === todayStr) mentorTodaySet.add(mMode)
      })
    }

    // Build mentor's day grid — always shows all 7 event days in order
    const mentorDayGrid = EVENT_DAYS.map(ev => {
      const isToday = ev.date === todayStr
      const isFuture = ev.date > todayStr
      const isPast = ev.date < todayStr
      const modes = MENTOR_MODES.map(m => ({
        mode: m,
        label: MENTOR_MODE_META[m].label,
        present: mentorPunchSet.has(`${ev.date}|${m}`),
      }))
      return {
        date: ev.date,
        day: ev.day,
        day_name: ev.day_name,
        is_today: isToday,
        is_future: isFuture,
        is_past: isPast,
        modes,
        present_count: modes.filter(m => m.present).length,
      }
    })

    const mentorTodayCount = mentorTodaySet.size
    const mentorTodayPresent = mentorTodayCount > 0
    const mentorTotalPunches = mentorDayGrid.reduce((s, d) => s + d.present_count, 0)
    // % over elapsed days (past + today)
    const mentorElapsed = mentorDayGrid.filter(d => !d.is_future).length
    const mentorPct = mentorElapsed > 0 ? Math.round((mentorTotalPunches / (mentorElapsed * 2)) * 100) : 0

    // 3. Get all teams assigned to this mentor
    const { data: teams } = await supabase
      .from('teams')
      .select('team_number, project_title, technology, mentor_assigned')
      .eq('mentor_assigned', mentor.name)

    const teamNumbers = (teams || []).map(t => t.team_number).filter(Boolean)

    if (teamNumbers.length === 0) {
      return Response.json({
        mentor: { ...mentor, today_present: mentorTodayPresent, today_modes: Array.from(mentorTodaySet), today_count: mentorTodayCount, max_modes: 2, day_grid: mentorDayGrid, attendance_pct: mentorPct, total_punches: mentorTotalPunches },
        teams: [],
        combined: { total_students: 0, total_present_today: 0, total_absent_today: 0, attendance_pct: 0, mode_breakdown: {} },
        modes_meta: MODE_META,
        mentor_modes_meta: MENTOR_MODE_META,
        event_days: EVENT_DAYS,
        today_date: todayStr,
      })
    }

    // 4. Get all team members — PAGINATED
    let members = []
    {
      const chunks = []
      for (let i = 0; i < teamNumbers.length; i += 500) chunks.push(teamNumbers.slice(i, i + 500))
      for (const chunk of chunks) {
        let from = 0
        const PAGE = 1000
        while (true) {
          const { data, error } = await supabase
            .from('team_members')
            .select('team_number, roll_number, short_name, is_leader')
            .in('team_number', chunk)
            .range(from, from + PAGE - 1)
          if (error) { console.error('team_members fetch error:', error.message); break }
          if (!data || data.length === 0) break
          members = members.concat(data)
          if (data.length < PAGE) break
          from += PAGE
        }
      }
    }
    members = members.map(m => ({ ...m, name: m.short_name || m.roll_number }))
    const memberRolls = members.map(m => m.roll_number).filter(Boolean)

    // 5. Get all student punches in EVENT WINDOW — PAGINATED + chunked .in()
    let studentPunches = []
    {
      const chunks = []
      for (let i = 0; i < memberRolls.length; i += 500) chunks.push(memberRolls.slice(i, i + 500))
      for (const chunk of chunks) {
        let from = 0
        const PAGE = 1000
        while (true) {
          const { data } = await supabase
            .from('attendance_logs')
            .select('roll_number, punch_date, punch_mode')
            .in('roll_number', chunk)
            .gte('punch_date', EVENT_START)
            .lte('punch_date', EVENT_END)
            .not('punch_mode', 'is', null)
            .range(from, from + PAGE - 1)
          if (!data || data.length === 0) break
          studentPunches = studentPunches.concat(data)
          if (data.length < PAGE) break
          from += PAGE
        }
      }
    }

    // Build punch lookup
    const studentPunchMap = {}
    studentPunches.forEach(p => {
      if (!studentPunchMap[p.roll_number]) studentPunchMap[p.roll_number] = { byKey: new Set(), byDate: {} }
      studentPunchMap[p.roll_number].byKey.add(`${p.punch_date}|${p.punch_mode}`)
      if (!studentPunchMap[p.roll_number].byDate[p.punch_date]) studentPunchMap[p.roll_number].byDate[p.punch_date] = new Set()
      studentPunchMap[p.roll_number].byDate[p.punch_date].add(p.punch_mode)
    })

    // 6. Build per-team summary
    const teamSummaries = (teams || []).map(team => {
      const teamMembers = members.filter(m => m.team_number === team.team_number)

      const memberDetails = teamMembers.map(m => {
        const data = studentPunchMap[m.roll_number] || { byKey: new Set(), byDate: {} }
        const todayModes = Array.from(data.byDate[todayStr] || [])
        const todayCount = todayModes.length

        // Absent days = days in event window where they had no punch (past + today only)
        const absentDays = []
        EVENT_DAYS.forEach(ev => {
          if (ev.date > todayStr) return  // skip future
          const punchedThatDay = (data.byDate[ev.date] || new Set()).size
          if (punchedThatDay === 0) absentDays.push(ev.date)
        })

        // 7-day mode grid — always shows all event days in order
        const modeGrid = EVENT_DAYS.map(ev => {
          const isToday = ev.date === todayStr
          const isFuture = ev.date > todayStr
          const isPast = ev.date < todayStr
          const modes = MODES.map(mode => ({
            mode,
            present: data.byKey.has(`${ev.date}|${mode}`),
          }))
          return {
            date: ev.date,
            day: ev.day,
            day_name: ev.day_name,
            is_today: isToday,
            is_future: isFuture,
            is_past: isPast,
            modes,
            count: modes.filter(x => x.present).length
          }
        })

        // % only over elapsed days (past + today)
        const elapsedDays = modeGrid.filter(d => !d.is_future).length
        const totalPunches = modeGrid.reduce((s, d) => s + d.count, 0)
        const pct = elapsedDays > 0 ? Math.round((totalPunches / (elapsedDays * 4)) * 100) : 0

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
        max_modes: 2,
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
      mentor_modes_meta: MENTOR_MODE_META,
      event_days: EVENT_DAYS,
      today_date: todayStr,
    })
  } catch (err) {
    console.error('Mentor attendance error:', err)
    return Response.json({ error: 'Failed to fetch mentor attendance' }, { status: 500 })
  }
}