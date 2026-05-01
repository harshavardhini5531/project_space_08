// app/api/admin/attendance/route.js
import { supabase } from '@/lib/supabase'

const ALLOWED_SERIALS = new Set([
  'CQIK222660267', 'CQIK222660127', 'CQIK222660348', 'CQIK222660347',
  'CQIK222560847', 'CQIK222660349', 'CQIK222660126', 'CQIK222660354',
  'CQIK222660352', 'M014200992108001153', 'NCD8245300366', 'NCD8245300358',
  'CQIK222660344'
])

// Project Street devices (4:30pm + 7pm punches happen here — adjust later if specific serials are used)
// For now, any device flagged as "project_street" via manual entry will be tagged
const PROJECT_STREET_SERIALS = new Set([
  'M014200992108001153'  // placeholder — replace with actual project street device serials
])

// Classify punch type by IST hour
function classifyPunchType(punchAtUtc, source) {
  if (source === 'manual') return null  // manual punches carry their own punch_label
  const ist = new Date(new Date(punchAtUtc).getTime() + (5.5 * 60 * 60 * 1000))
  const hour = ist.getUTCHours()
  const minute = ist.getUTCMinutes()
  const total = hour * 60 + minute
  // 7:00am - 11:30am = morning_in
  if (total >= 7*60 && total < 11*60+30) return 'morning_in'
  // 11:30am - 1:30pm = lunch_window (out then in)
  if (total >= 11*60+30 && total < 13*60+30) return 'lunch'
  // 1:30pm - 4:00pm = afternoon
  if (total >= 13*60+30 && total < 16*60) return 'afternoon'
  // 4:00pm - 6:30pm = project_street_evening
  if (total >= 16*60 && total < 18*60+30) return 'project_street_evening'
  // 6:30pm - 8:30pm = dinner_window
  if (total >= 18*60+30 && total < 20*60+30) return 'dinner'
  // 8:30pm - 10:30pm = night_in
  if (total >= 20*60+30 && total < 22*60+30) return 'night_in'
  // 10:30pm onward or before 7am = night_out
  return 'night_out'
}

export async function GET(request) {
  const token = request.headers.get('x-admin-token')
  if (!token || !token.startsWith('admin_')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  try {
    // ── 1. Fetch all punches for the date ──
    const { data: punches, error: pErr } = await supabase
      .from('attendance_logs')
      .select('employee_code, roll_number, device_serial, device_id, punch_at, source, user_type, punch_label')
      .eq('punch_date', date)
      .order('punch_at', { ascending: true })

    if (pErr) throw pErr

    // ── 2. Fetch all students, mentors, teams, team_members for joins ──
    const [studentsRes, mentorsRes, teamsRes, membersRes] = await Promise.all([
      supabase.from('students').select('roll_number, name, technology, batch'),
      supabase.from('mentors').select('emp_id, name, email, technology, image_url'),
      supabase.from('teams').select('team_number, project_title, technology, mentor_assigned, leader_roll, registered'),
      supabase.from('team_members').select('team_number, roll_number, is_leader')
    ])

    const allStudents = studentsRes.data || []
    const mentors = mentorsRes.data || []
    const teams = teamsRes.data || []
    const teamMembers = membersRes.data || []

    // EVENT PARTICIPANTS ONLY — students who are in team_members table
    const eventRollSet = new Set(teamMembers.map(tm => tm.roll_number).filter(Boolean))
    const students = allStudents.filter(s => eventRollSet.has(s.roll_number))
    // For students who are in team_members but NOT in students table, create stub records
    const knownRolls = new Set(students.map(s => s.roll_number))
    teamMembers.forEach(tm => {
      if (!knownRolls.has(tm.roll_number)) {
        students.push({
          roll_number: tm.roll_number,
          name: tm.short_name || tm.roll_number,
          technology: null,
          batch: tm.batch || null
        })
        knownRolls.add(tm.roll_number)
      }
    })

    // ── 3. Build lookup maps ──
    const studentByRoll = {}
    // Use allStudents for full lookup (so non-event students still resolve names/tech)
    allStudents.forEach(s => { studentByRoll[s.roll_number] = s })
    const mentorByEmpId = {}
    mentors.forEach(m => { if (m.emp_id) mentorByEmpId[m.emp_id] = m })
    const teamByNumber = {}
    teams.forEach(t => { teamByNumber[t.team_number] = t })
    const membersByTeam = {}
    teamMembers.forEach(tm => {
      if (!membersByTeam[tm.team_number]) membersByTeam[tm.team_number] = []
      membersByTeam[tm.team_number].push(tm)
    })

    // Roll → team_number map (for student lookups)
    const rollToTeam = {}
    teamMembers.forEach(tm => { rollToTeam[tm.roll_number] = tm.team_number })

    // ── 4. Group punches per person (collapse duplicate punches into typed list) ──
    // personPunches[roll] = [{ time, type, source, device }]
    const personPunches = {}
    ;(punches || []).forEach(p => {
      const key = p.roll_number
      if (!personPunches[key]) personPunches[key] = []
      personPunches[key].push({
        time: p.punch_at,
        type: p.punch_label || classifyPunchType(p.punch_at, p.source),
        source: p.source,
        device: p.device_serial,
        userType: p.user_type
      })
    })

    // ── 5. STUDENT PRESENCE LOGIC ──
    // Present = has any morning_in punch OR any 'in' punch type
    // Suspicious = only out punches with no in
    const studentPresence = {}
    students.forEach(s => {
      const punchesForStudent = personPunches[s.roll_number] || []
      const hasMorning = punchesForStudent.some(x => x.type === 'morning_in')
      const hasAnyPunch = punchesForStudent.length > 0
      studentPresence[s.roll_number] = {
        roll: s.roll_number,
        name: s.name,
        technology: s.technology,
        team: rollToTeam[s.roll_number] || null,
        present: hasMorning || hasAnyPunch,
        hasMorning,
        punchCount: punchesForStudent.length,
        punches: punchesForStudent,
        firstPunch: punchesForStudent[0]?.time || null,
        lastPunch: punchesForStudent[punchesForStudent.length - 1]?.time || null,
        missingMorning: !hasMorning && hasAnyPunch
      }
    })

    // ── 6. DAILY SUMMARY ──
    const totalStudents = students.length
    const presentStudents = Object.values(studentPresence).filter(p => p.present).length
    const absentStudents = totalStudents - presentStudents

    // By technology
    const byTech = {}
    students.forEach(s => {
      const tech = s.technology || 'Unknown'
      if (!byTech[tech]) byTech[tech] = { total: 0, present: 0, absent: 0 }
      byTech[tech].total++
      if (studentPresence[s.roll_number]?.present) byTech[tech].present++
      else byTech[tech].absent++
    })

    // ── 7. TEAM ATTENDANCE (X out of N members present) ──
    const teamAttendance = teams.map(t => {
      const members = membersByTeam[t.team_number] || []
      const memberPresence = members.map(m => {
        const sp = studentPresence[m.roll_number] || {}
        return {
          roll: m.roll_number,
          name: studentByRoll[m.roll_number]?.name || m.roll_number,
          isLeader: m.is_leader,
          present: !!sp.present,
          missingMorning: !!sp.missingMorning
        }
      })
      const present = memberPresence.filter(m => m.present).length
      const total = memberPresence.length
      const absentMembers = memberPresence.filter(m => !m.present)
      return {
        teamNumber: t.team_number,
        projectTitle: t.project_title,
        technology: t.technology,
        mentor: t.mentor_assigned,
        present,
        total,
        percent: total > 0 ? Math.round((present / total) * 100) : 0,
        absentMembers: absentMembers.map(m => ({ roll: m.roll, name: m.name, isLeader: m.isLeader }))
      }
    }).sort((a, b) => b.percent - a.percent || a.teamNumber.localeCompare(b.teamNumber))

    // ── 8. MENTOR ATTENDANCE ──
    const mentorAttendance = mentors.map(m => {
      const punchesForMentor = personPunches[m.emp_id] || []
      const hasMorning = punchesForMentor.some(x => x.type === 'morning_in')
      const present = hasMorning || punchesForMentor.length > 0
      const teamCount = teams.filter(t => t.mentor_assigned === m.name).length
      return {
        empId: m.emp_id,
        name: m.name,
        email: m.email,
        technology: m.technology,
        imageUrl: m.image_url,
        present,
        punchCount: punchesForMentor.length,
        firstPunch: punchesForMentor[0]?.time || null,
        lastPunch: punchesForMentor[punchesForMentor.length - 1]?.time || null,
        missingMorning: !hasMorning && punchesForMentor.length > 0,
        assignedTeams: teamCount
      }
    }).sort((a, b) => Number(b.present) - Number(a.present) || a.name.localeCompare(b.name))

    const presentMentors = mentorAttendance.filter(m => m.present).length
    const totalMentors = mentors.length

    // ── 9. PROJECT STREET PUNCHES ──
    // 4:30pm punches (project_street_evening) and 7pm (dinner / manual)
    const projectStreet = {
      evening_4_30: [],
      dinner_7pm: []
    }
    Object.values(personPunches).forEach(arr => {
      const eveningPunches = arr.filter(x => x.type === 'project_street_evening' || x.punch_label === 'project_street_4_30')
      const sevenPmPunches = arr.filter(x => x.punch_label === 'project_street_7pm')
      if (eveningPunches.length > 0) {
        const roll = arr[0]?.userType === 'mentor' ? null : arr[0]?.roll
        projectStreet.evening_4_30.push({
          roll: arr[0]?.roll,
          name: studentByRoll[arr[0]?.roll]?.name || mentorByEmpId[arr[0]?.roll]?.name || '—',
          time: eveningPunches[0].time,
          source: eveningPunches[0].source
        })
      }
      if (sevenPmPunches.length > 0) {
        projectStreet.dinner_7pm.push({
          roll: arr[0]?.roll,
          name: studentByRoll[arr[0]?.roll]?.name || mentorByEmpId[arr[0]?.roll]?.name || '—',
          time: sevenPmPunches[0].time,
          source: sevenPmPunches[0].source
        })
      }
    })

    // ── 10. STUDENT TIMELINE (per-student detailed punches) ──
    const studentTimeline = Object.values(studentPresence).map(sp => ({
      roll: sp.roll,
      name: sp.name,
      technology: sp.technology,
      team: sp.team,
      present: sp.present,
      missingMorning: sp.missingMorning,
      punchCount: sp.punchCount,
      punches: sp.punches.map(p => ({
        time: p.time,
        type: p.type,
        source: p.source,
        device: p.device
      }))
    })).sort((a, b) => a.roll.localeCompare(b.roll))

    // ── 11. MENTOR-WISE TEAM ATTENDANCE ──
    // For each mentor, show their teams + each team's attendance %
    const mentorTeamAttendance = mentors.map(m => {
      const myTeams = teamAttendance.filter(t => t.mentor === m.name)
      const totalMembers = myTeams.reduce((s, t) => s + t.total, 0)
      const presentMembers = myTeams.reduce((s, t) => s + t.present, 0)
      return {
        mentorName: m.name,
        empId: m.emp_id,
        imageUrl: m.image_url,
        technology: m.technology,
        teamCount: myTeams.length,
        totalMembers,
        presentMembers,
        absentMembers: totalMembers - presentMembers,
        percent: totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0,
        teams: myTeams
      }
    }).filter(x => x.teamCount > 0).sort((a, b) => b.percent - a.percent)

    // ── 12. LAST SYNC INFO ──
    const { data: lastSync } = await supabase
      .from('attendance_sync_log')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    return Response.json({
      date,
      dailySummary: {
        totalStudents,
        presentStudents,
        absentStudents,
        attendancePercent: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0,
        totalMentors,
        presentMentors,
        absentMentors: totalMentors - presentMentors,
        mentorAttendancePercent: totalMentors > 0 ? Math.round((presentMentors / totalMentors) * 100) : 0,
        totalPunches: punches?.length || 0,
        unknownPunches: (punches || []).filter(p => p.user_type === 'unknown').length,
        byTechnology: byTech
      },
      teamAttendance,
      mentorAttendance,
      mentorTeamAttendance,
      projectStreet,
      studentTimeline,
      lastSync
    })
  } catch (err) {
    console.error('Attendance API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}