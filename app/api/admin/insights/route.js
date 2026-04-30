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
    // ── 3b. Fetch all mentor help requests ──
    const { data: mentorReqs } = await supabase
      .from('mentor_requests')
      .select('mentor_name, mentor_email, team_number, priority, status, created_at, resolved_at, rating')

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
        currentStage: 0,
        stagesDetail: [],
        linkedinDetail: [],
        mentorRequestsDetail: []
      }
    })

    // Add linkedin shares to teams (count + detail)
    ;(shares || []).forEach(s => {
      if (!teamData[s.team_number]) return
      teamData[s.team_number].linkedinShares++
      teamData[s.team_number].linkedinDetail.push({
        roll_number: s.roll_number,
        posted_by_name: s.posted_by_name,
        posted_by_role: s.posted_by_role,
        mentor_name: s.mentor_name,
        created_at: s.created_at
      })
    })

    // Add reenable requests to teams
    ;(reenables || []).forEach(r => {
      const t = teamData[r.team_number]
      if (!t) return
      if (r.status === 'pending') t.reenableRequests.pending++
      else if (r.status === 'approved') t.reenableRequests.approved++
      else if (r.status === 'denied') t.reenableRequests.denied++
    })

    // Add stage info to teams (count + full detail)
    ;(submissions || []).forEach(s => {
      const t = teamData[s.team_number]
      if (!t) return
      if (s.status === 'completed') {
        t.stages.completed++
        if (s.stage_number > t.currentStage) t.currentStage = s.stage_number
      } else if (s.status === 'in-review') t.stages.inReview++
      else if (s.status === 'rejected') t.stages.rejected++
      t.stagesDetail.push({
        stage_number: s.stage_number,
        status: s.status,
        submitted_by_name: s.submitted_by_name,
        submitted_at: s.submitted_at,
        reviewed_by_name: s.reviewed_by_name,
        reviewed_at: s.reviewed_at,
        mentor_comment: s.mentor_comment,
        credits_earned: s.credits_earned
      })
    })
    // Sort each team's stagesDetail by stage_number
    Object.values(teamData).forEach(t => {
      t.stagesDetail.sort((a, b) => a.stage_number - b.stage_number)
      t.linkedinDetail.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
          stagesInReview: 0,
          reenableRequestsHandled: 0,
          reenableRequestsPending: 0,
          requestsReceived: 0,
          requestsResolved: 0,
          requestsPending: 0,
          avgRating: 0,
          totalRated: 0
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
      // For approved/rejected — credit the reviewer
      const reviewer = s.reviewed_by_name
      if (reviewer && mentorActivity[reviewer]) {
        if (s.status === 'completed') mentorActivity[reviewer].stagesApproved++
        else if (s.status === 'rejected') mentorActivity[reviewer].stagesRejected++
      }
      // For in-review — credit the mentor of that team
      if (s.status === 'in-review') {
        const teamMentor = (teams || []).find(t => t.team_number === s.team_number)?.mentor_assigned
        if (teamMentor && mentorActivity[teamMentor]) mentorActivity[teamMentor].stagesInReview++
      }
    })

    // Mentor re-enable handling
    ;(reenables || []).forEach(r => {
      if (!r.mentor_name || !mentorActivity[r.mentor_name]) return
      if (r.status === 'pending') mentorActivity[r.mentor_name].reenableRequestsPending++
      else mentorActivity[r.mentor_name].reenableRequestsHandled++
    })
    // Mentor help requests aggregation
    ;(mentorReqs || []).forEach(r => {
      const m = r.mentor_name
      if (m && mentorActivity[m]) {
        mentorActivity[m].requestsReceived++
        if (r.status === 'Pending') mentorActivity[m].requestsPending++
        else mentorActivity[m].requestsResolved++
        if (typeof r.rating === 'number' && r.rating > 0) {
          mentorActivity[m].avgRating = ((mentorActivity[m].avgRating * mentorActivity[m].totalRated) + r.rating) / (mentorActivity[m].totalRated + 1)
          mentorActivity[m].totalRated++
        }
      }
      // Per-team detail
      if (r.team_number && teamData[r.team_number]) {
        teamData[r.team_number].mentorRequestsDetail.push({
          mentor_name: r.mentor_name,
          priority: r.priority,
          status: r.status,
          created_at: r.created_at,
          resolved_at: r.resolved_at,
          rating: r.rating
        })
      }
    })
    // Sort mentorRequestsDetail by date desc
    Object.values(teamData).forEach(t => {
      t.mentorRequestsDetail.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    // Build a map of team_number -> project_title, technology, mentor for enrichment
    const teamMetaMap = {}
    ;(teams || []).forEach(t => {
      if (t.team_number) teamMetaMap[t.team_number] = {
        projectTitle: t.project_title,
        technology: t.technology,
        mentor: t.mentor_assigned
      }
    })

    // Stage review history (latest 500) — enriched with project title, technology, mentor
    const stageReviews = (submissions || [])
      .filter(s => s.status === 'in-review' || s.status === 'completed' || s.status === 'rejected')
      .map(s => {
        const meta = teamMetaMap[s.team_number] || {}
        return {
          teamNumber: s.team_number,
          projectTitle: meta.projectTitle || null,
          technology: meta.technology || null,
          stageNumber: s.stage_number,
          status: s.status,
          submittedBy: s.submitted_by_name,
          submittedAt: s.submitted_at,
          reviewedBy: s.reviewed_by_name || meta.mentor,
          reviewedAt: s.reviewed_at,
          comment: s.mentor_comment,
          credits: s.credits_earned
        }
      })
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
      .slice(0, 500)

    // Stage analysis matrix: per-team, per-stage status
    // Status values: 'completed' | 'in-review' | 'rejected' | 'none'
    const stageMatrix = {}
    ;(teams || []).forEach(t => {
      if (!t.team_number) return
      stageMatrix[t.team_number] = {
        teamNumber: t.team_number,
        projectTitle: t.project_title,
        technology: t.technology,
        mentor: t.mentor_assigned,
        stages: { 1: 'none', 2: 'none', 3: 'none', 4: 'none', 5: 'none', 6: 'none', 7: 'none' }
      }
    })
    ;(submissions || []).forEach(s => {
      const team = stageMatrix[s.team_number]
      if (!team || s.stage_number < 1 || s.stage_number > 7) return
      // Map status: completed/in-review/rejected (keep latest non-pending)
      if (s.status === 'completed' || s.status === 'in-review' || s.status === 'rejected') {
        team.stages[s.stage_number] = s.status
      }
    })

    // Per-stage completion counts
    const stageCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
    Object.values(stageMatrix).forEach(t => {
      Object.entries(t.stages).forEach(([sn, status]) => {
        if (status === 'completed') stageCounts[sn]++
      })
    })

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
      stageMatrix: Object.values(stageMatrix),
      stageCounts,
      summary
    })
  } catch (err) {
    console.error('Admin insights error:', err)
    return Response.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}