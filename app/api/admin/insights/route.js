import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const token = request.headers.get('x-admin-token')
    if (!token || !token.startsWith('admin_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 1. Fetch all milestone submissions (stage history) ──
    const { data: submissions } = await supabase
      .from('milestone_submissions')
      .select('team_number, stage_number, status, submitted_by_roll, submitted_by_name, submitted_at, reviewed_by_email, reviewed_by_name, reviewed_at, mentor_comment, credits_earned')
      .order('submitted_at', { ascending: false })

    // ── 2. Fetch all linkedin shares ──
    const { data: shares } = await supabase
      .from('linkedin_shares')
      .select('roll_number, team_number, technology, mentor_name, posted_by_name, posted_by_role, created_at')
      .order('created_at', { ascending: false })

    // ── 3. Fetch all reenable requests ──
    const { data: reenables } = await supabase
      .from('linkedin_reenable_requests')
      .select('roll_number, team_number, mentor_name, status, created_at, resolved_at')

    // ── 4. Fetch teams (lightweight) ──
    const { data: teams } = await supabase
      .from('teams')
      .select('serial_number, team_number, project_title, technology, mentor_assigned, leader_roll, registered')

    // ── 5. Build aggregations ──
    
    // Per-team aggregations
    const teamData = {}
    ;(teams || []).forEach(t => {
      if (!t.team_number) return
      teamData[t.team_number] = {
        teamNumber: t.team_number,
        serialNumber: t.serial_number,
        projectTitle: t.project_title,
        technology: t.technology,
        mentor: t.mentor_assigned,
        leaderRoll: t.leader_roll,
        registered: t.registered,
        linkedinShares: 0,
        reenableRequests: { pending: 0, approved: 0, denied: 0 },
        stages: { completed: 0, inReview: 0, rejected: 0 },
        currentStage: 0
      }
    })

    // Add linkedin shares to teams
    ;(shares || []).forEach(s => {
      if (teamData[s.team_number]) teamData[s.team_number].linkedinShares++
    })

    // Add reenable requests to teams
    ;(reenables || []).forEach(r => {
      const t = teamData[r.team_number]
      if (!t) return
      if (r.status === 'pending') t.reenableRequests.pending++
      else if (r.status === 'approved') t.reenableRequests.approved++
      else if (r.status === 'denied') t.reenableRequests.denied++
    })

    // Add stage info to teams
    ;(submissions || []).forEach(s => {
      const t = teamData[s.team_number]
      if (!t) return
      if (s.status === 'completed') {
        t.stages.completed++
        if (s.stage_number > t.currentStage) t.currentStage = s.stage_number
      } else if (s.status === 'in-review') t.stages.inReview++
      else if (s.status === 'rejected') t.stages.rejected++
    })

    // Per-mentor aggregations
    const mentorActivity = {}
    ;(teams || []).forEach(t => {
      const m = t.mentor_assigned
      if (!m) return
      if (!mentorActivity[m]) {
        mentorActivity[m] = {
          name: m,
          totalTeams: 0,
          registeredTeams: 0,
          pendingTeams: 0,
          linkedinPosted: false,
          studentLinkedinPosts: 0,
          stagesApproved: 0,
          stagesRejected: 0,
          reenableRequestsHandled: 0,
          reenableRequestsPending: 0
        }
      }
      mentorActivity[m].totalTeams++
      if (t.registered) mentorActivity[m].registeredTeams++
      else mentorActivity[m].pendingTeams++
    })
    
    // Mentor LinkedIn activity
    ;(shares || []).forEach(s => {
      if (s.posted_by_role === 'mentor' && s.posted_by_name && mentorActivity[s.posted_by_name]) {
        mentorActivity[s.posted_by_name].linkedinPosted = true
      }
      if (s.posted_by_role === 'student' && s.mentor_name && mentorActivity[s.mentor_name]) {
        mentorActivity[s.mentor_name].studentLinkedinPosts++
      }
    })

    // Mentor stage actions
    ;(submissions || []).forEach(s => {
      const reviewer = s.reviewed_by_name
      if (!reviewer || !mentorActivity[reviewer]) return
      if (s.status === 'completed') mentorActivity[reviewer].stagesApproved++
      else if (s.status === 'rejected') mentorActivity[reviewer].stagesRejected++
    })

    // Mentor re-enable handling
    ;(reenables || []).forEach(r => {
      if (!r.mentor_name || !mentorActivity[r.mentor_name]) return
      if (r.status === 'pending') mentorActivity[r.mentor_name].reenableRequestsPending++
      else mentorActivity[r.mentor_name].reenableRequestsHandled++
    })

    // Stage review history (latest 200)
    const stageReviews = (submissions || [])
      .filter(s => s.status === 'in-review' || s.status === 'completed' || s.status === 'rejected')
      .map(s => ({
        teamNumber: s.team_number,
        stageNumber: s.stage_number,
        status: s.status,
        submittedBy: s.submitted_by_name,
        submittedAt: s.submitted_at,
        reviewedBy: s.reviewed_by_name,
        reviewedAt: s.reviewed_at,
        comment: s.mentor_comment,
        credits: s.credits_earned
      }))
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
      .slice(0, 500)

    // Summary stats
    const summary = {
      stages: {
        totalSubmitted: (submissions || []).filter(s => s.status === 'in-review' || s.status === 'completed' || s.status === 'rejected').length,
        approved: (submissions || []).filter(s => s.status === 'completed').length,
        rejected: (submissions || []).filter(s => s.status === 'rejected').length,
        inReview: (submissions || []).filter(s => s.status === 'in-review').length
      },
      linkedin: {
        totalPosts: (shares || []).length,
        studentPosts: (shares || []).filter(s => s.posted_by_role === 'student').length,
        mentorPosts: (shares || []).filter(s => s.posted_by_role === 'mentor').length,
        reenablePending: (reenables || []).filter(r => r.status === 'pending').length,
        reenableApproved: (reenables || []).filter(r => r.status === 'approved').length
      }
    }

    return Response.json({
      teamData: Object.values(teamData),
      mentorActivity: Object.values(mentorActivity),
      stageReviews,
      summary
    })
  } catch (err) {
    console.error('Admin insights error:', err)
    return Response.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}