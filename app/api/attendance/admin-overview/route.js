// app/api/attendance/admin-overview/route.js
// FIXED: Paginates ALL queries to avoid Supabase 2000-row silent cap
// Returns: filters-aware overview with mentors/teams/students/modes breakdown

import { createClient } from '@supabase/supabase-js'
import { fetchAll, fetchAllByIn } from '../../../../lib/supabase-paginate.js'

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

export async function POST(request) {
  try {
    const body = await request.json()
    const { date, technology, mentor, teamNumber, mode } = body

    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const targetDate = date || todayIST.toISOString().split('T')[0]

    // 1. Fetch teams (filtered)
    const teams = await fetchAll(() => {
      let q = supabase.from('teams').select('team_number, project_title, technology, mentor_assigned')
      if (technology) q = q.eq('technology', technology)
      if (mentor) q = q.eq('mentor_assigned', mentor)
      if (teamNumber) q = q.eq('team_number', teamNumber)
      return q
    })
    const teamNums = teams.map(t => t.team_number).filter(Boolean)

    // 2. Fetch ALL team_members (paginated)
    const members = teamNums.length > 0
      ? await fetchAllByIn(
          () => supabase.from('team_members').select('team_number, roll_number, short_name, is_leader'),
          'team_number', teamNums,
          { label: 'team-members' }
        )
      : []
    const memberRolls = members.map(m => m.roll_number).filter(Boolean)

    // 3. Fetch ALL student punches for target date (PAGINATED — was the bug)
    const studentPunches = memberRolls.length > 0
      ? await fetchAllByIn(
          () => supabase.from('attendance_logs')
            .select('roll_number, punch_mode, punch_at')
            .eq('punch_date', targetDate)
            .not('punch_mode', 'is', null),
          'roll_number', memberRolls,
          { label: 'student-punches' }
        )
      : []

    // Build punch lookup
    const studentPunchMap = {}
    studentPunches.forEach(p => {
      if (!studentPunchMap[p.roll_number]) studentPunchMap[p.roll_number] = new Set()
      studentPunchMap[p.roll_number].add(p.punch_mode)
    })

    // 4. Fetch mentors
    const mentors = await fetchAll(() => {
      let q = supabase.from('mentors').select('id, name, email, technology, emp_id, image_url')
      if (technology) q = q.eq('technology', technology)
      if (mentor) q = q.eq('name', mentor)
      return q
    })

    // 5. Fetch mentor punches (paginated)
    const mentorEmpIds = mentors.map(m => String(m.emp_id)).filter(Boolean)
    const mentorPunches = mentorEmpIds.length > 0
      ? await fetchAllByIn(
          () => supabase.from('attendance_logs')
            .select('employee_code, punch_mode, punch_at')
            .eq('punch_date', targetDate)
            .not('punch_mode', 'is', null),
          'employee_code', mentorEmpIds,
          { label: 'mentor-punches' }
        )
      : []

    const mentorPunchMap = {}
    mentorPunches.forEach(p => {
      if (!mentorPunchMap[p.employee_code]) mentorPunchMap[p.employee_code] = new Set()
      mentorPunchMap[p.employee_code].add(p.punch_mode)
    })

    // 6. Build student rows
    const teamLookup = {}
    teams.forEach(t => { teamLookup[t.team_number] = t })

    let studentRows = members.map(m => {
      const team = teamLookup[m.team_number] || {}
      const punches = Array.from(studentPunchMap[m.roll_number] || [])
      const present = mode ? punches.includes(mode) : punches.length > 0
      const missedModes = MODES.filter(modeEl => !punches.includes(modeEl))
      return {
        roll_number: m.roll_number,
        name: m.short_name,
        team_number: m.team_number,
        is_leader: m.is_leader,
        project_title: team.project_title || '',
        technology: team.technology || '',
        mentor: team.mentor_assigned || '',
        present_modes: punches,
        present_count: punches.length,
        attendance_pct: Math.round((punches.length / 4) * 100),
        is_present: present,
        missed_modes: missedModes,
      }
    })
    if (mode) studentRows = studentRows.filter(s => s.present_modes.includes(mode))

    // 7. Build mentor rows
    const mentorRows = mentors.map(m => {
      const teamsForMentor = teams.filter(t => t.mentor_assigned === m.name)
      const teamMembers = members.filter(mem => teamsForMentor.some(t => t.team_number === mem.team_number))
      const presentStudents = teamMembers.filter(mem => (studentPunchMap[mem.roll_number] || new Set()).size > 0)
      const mentorPunchesToday = Array.from(mentorPunchMap[String(m.emp_id)] || [])
      const mentorshipPct = teamMembers.length > 0
        ? Math.round((presentStudents.length / teamMembers.length) * 100)
        : 0
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        technology: m.technology,
        image_url: m.image_url,
        emp_id: m.emp_id,
        self_modes: mentorPunchesToday,
        self_count: mentorPunchesToday.length,
        self_present: mentorPunchesToday.length > 0,
        team_count: teamsForMentor.length,
        student_count: teamMembers.length,
        students_present: presentStudents.length,
        students_absent: teamMembers.length - presentStudents.length,
        mentorship_pct: mentorshipPct,
      }
    })

    // 8. Team rows
    const teamRows = teams.map(team => {
      const teamMembers = members.filter(m => m.team_number === team.team_number)
      const present = teamMembers.filter(m => (studentPunchMap[m.roll_number] || new Set()).size > 0)
      const presenteeNames = present.map(m => ({ name: m.short_name, roll: m.roll_number, modes: Array.from(studentPunchMap[m.roll_number] || []) }))
      const absenteeNames = teamMembers.filter(m => (studentPunchMap[m.roll_number] || new Set()).size === 0).map(m => ({ name: m.short_name, roll: m.roll_number }))
      return {
        team_number: team.team_number,
        project_title: team.project_title,
        technology: team.technology,
        mentor: team.mentor_assigned,
        total_members: teamMembers.length,
        present_count: present.length,
        absent_count: teamMembers.length - present.length,
        attendance_pct: teamMembers.length > 0 ? Math.round((present.length / teamMembers.length) * 100) : 0,
        presentees: presenteeNames,
        absentees: absenteeNames,
      }
    })

    // 9. Mode-wise totals
    const modeStats = {}
    MODES.forEach(modeEl => {
      const studentsHavingThisMode = studentRows.filter(s => s.present_modes.includes(modeEl)).length
      const mentorsHavingThisMode = mentorRows.filter(m => m.self_modes.includes(modeEl)).length
      modeStats[modeEl] = {
        ...MODE_META[modeEl],
        students_present: studentsHavingThisMode,
        students_missed: studentRows.length - studentsHavingThisMode,
        mentors_present: mentorsHavingThisMode,
        mentors_missed: mentorRows.length - mentorsHavingThisMode,
      }
    })

    // 10. Top stats
    const totalStudents = studentRows.length
    const presentStudents = studentRows.filter(s => s.is_present).length
    const totalMentors = mentorRows.length
    const presentMentors = mentorRows.filter(m => m.self_present).length

    // 11. Filter options
    const allTechs = await fetchAll(() => supabase.from('teams').select('technology').not('technology', 'is', null))
    const technologies = Array.from(new Set(allTechs.map(t => t.technology))).sort()

    const allMentorList = await fetchAll(() => supabase.from('mentors').select('name').order('name'))
    const mentorList = Array.from(new Set(allMentorList.map(m => m.name)))

    return Response.json({
      target_date: targetDate,
      stats: {
        total_students: totalStudents,
        present_students: presentStudents,
        absent_students: totalStudents - presentStudents,
        student_pct: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0,
        total_mentors: totalMentors,
        present_mentors: presentMentors,
        absent_mentors: totalMentors - presentMentors,
        mentor_pct: totalMentors > 0 ? Math.round((presentMentors / totalMentors) * 100) : 0,
        total_teams: teams.length,
      },
      mode_stats: modeStats,
      modes_meta: MODE_META,
      mentors: mentorRows,
      teams: teamRows,
      students: studentRows,
      filter_options: {
        technologies,
        mentors: mentorList,
        modes: MODES,
      },
      applied_filters: { technology, mentor, teamNumber, mode, date: targetDate },
    })
  } catch (err) {
    console.error('Admin overview error:', err)
    return Response.json({ error: 'Failed to fetch overview', detail: err.message }, { status: 500 })
  }
}