// app/api/milestones/leaderboard/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const technology = searchParams.get('technology') // optional filter
    const limit = parseInt(searchParams.get('limit')) || 50

    // 1. Get all submissions
    const { data: allSubs, error: subErr } = await supabase
      .from('milestone_submissions')
      .select('team_number, stage_number, status, reviewed_at, submitted_at')

    if (subErr) throw subErr

    // 2. Get team info
    let teamQuery = supabase
      .from('teams')
      .select('team_number, technology, serial_number, mentor_assigned')
      .eq('registered', true)
      .not('team_number', 'is', null)

    if (technology) teamQuery = teamQuery.eq('technology', technology)

    const { data: teams, error: teamErr } = await teamQuery
    if (teamErr) throw teamErr

    // 3. Get project titles
    const teamNumbers = (teams || []).map(t => t.team_number)
    const { data: regs } = await supabase
      .from('team_registrations')
      .select('team_number, project_title')
      .in('team_number', teamNumbers)

    const regMap = {}
    ;(regs || []).forEach(r => { regMap[r.team_number] = r.project_title })

    // 4. Build leaderboard
    const leaderboard = (teams || []).map(team => {
      const subs = (allSubs || []).filter(s => s.team_number === team.team_number)
      const completed = subs.filter(s => s.status === 'completed')
      const inReview = subs.filter(s => s.status === 'in-review')

      // Last completion timestamp (for tiebreaker)
      const lastCompletedAt = completed.length > 0
        ? completed.sort((a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at))[0].reviewed_at
        : null

      // Current stage = highest completed + 1, or the in-review stage
      const highestCompleted = completed.length > 0
        ? Math.max(...completed.map(s => s.stage_number))
        : 0

      return {
        team_number: team.team_number,
        serial_number: team.serial_number,
        technology: team.technology,
        mentor: team.mentor_assigned,
        project_title: regMap[team.team_number] || '',
        completed_stages: completed.length,
        in_review_stages: inReview.length,
        current_stage: Math.min(highestCompleted + 1, 7),
        percent: Math.round((completed.length / 7) * 100),
        last_completed_at: lastCompletedAt,
        total_credits: completed.reduce((s, c) => s + 5, 0),
      }
    })

    // 5. Sort: most completed first, then earliest last_completed_at
    leaderboard.sort((a, b) => {
      if (b.completed_stages !== a.completed_stages) return b.completed_stages - a.completed_stages
      // Same stages — earlier completion wins
      if (a.last_completed_at && b.last_completed_at) {
        return new Date(a.last_completed_at) - new Date(b.last_completed_at)
      }
      return a.last_completed_at ? -1 : 1
    })

    // 6. Assign ranks (handling ties)
    let rank = 1
    leaderboard.forEach((entry, i) => {
      if (i > 0) {
        const prev = leaderboard[i - 1]
        if (entry.completed_stages === prev.completed_stages && entry.last_completed_at === prev.last_completed_at) {
          entry.rank = prev.rank
        } else {
          entry.rank = i + 1
        }
      } else {
        entry.rank = 1
      }
    })

    // 7. Overall event stats
    const totalTeams = leaderboard.length
    const totalCompleted = leaderboard.reduce((s, t) => s + t.completed_stages, 0)
    const teamsAllDone = leaderboard.filter(t => t.completed_stages === 7).length
    const avgProgress = totalTeams > 0 ? Math.round((totalCompleted / (totalTeams * 7)) * 100) : 0

    // Stage distribution
    const stageDistribution = Array.from({ length: 7 }, (_, i) => ({
      stage: i + 1,
      completed: leaderboard.filter(t => t.completed_stages > i).length,
      in_review: (allSubs || []).filter(s => s.stage_number === i + 1 && s.status === 'in-review').length,
    }))

    return Response.json({
      leaderboard: leaderboard.slice(0, limit),
      total: totalTeams,
      stats: {
        total_teams: totalTeams,
        total_completed_stages: totalCompleted,
        teams_all_done: teamsAllDone,
        avg_progress: avgProgress,
        stage_distribution: stageDistribution,
      }
    })

  } catch (err) {
    console.error('Leaderboard error:', err)
    return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}