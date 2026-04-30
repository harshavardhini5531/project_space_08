// app/api/milestones/pending-reviews/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorName = searchParams.get('mentor')
    const mentorEmail = searchParams.get('email')

    if (!mentorName && !mentorEmail) {
      return Response.json({ error: 'Mentor name or email required' }, { status: 400 })
    }

    // 1. Get all teams assigned to this mentor
    const query = supabase.from('teams').select('team_number, technology, serial_number')
    if (mentorName) query.eq('mentor_assigned', mentorName)

    const { data: teams, error: teamErr } = await query
    if (teamErr) throw teamErr

    const teamNumbers = (teams || []).map(t => t.team_number).filter(Boolean)
    if (teamNumbers.length === 0) {
      return Response.json({ pending: [], teams: [], stats: { pending: 0, completed: 0, total: 0 } })
    }

    // 2. Get all submissions for these teams
    const { data: allSubs, error: subErr } = await supabase
      .from('milestone_submissions')
      .select('*')
      .in('team_number', teamNumbers)
      .order('submitted_at', { ascending: false })

    if (subErr) throw subErr

    // 3. Get stage names
    const { data: stages } = await supabase
      .from('milestone_stages')
      .select('stage_number, stage_name')

    const stageMap = {}
    ;(stages || []).forEach(s => { stageMap[s.stage_number] = s.stage_name })

    // 4. Get team registration info for project titles
    const { data: regs } = await supabase
      .from('team_registrations')
      .select('team_number, project_title')
      .in('team_number', teamNumbers)

    const regMap = {}
    ;(regs || []).forEach(r => { regMap[r.team_number] = r.project_title })

    // 5. Build pending reviews list
    const pending = (allSubs || [])
      .filter(s => s.status === 'in-review')
      .map(s => ({
        ...s,
        stage_name: stageMap[s.stage_number] || `Stage ${s.stage_number}`,
        project_title: regMap[s.team_number] || '',
        technology: (teams || []).find(t => t.team_number === s.team_number)?.technology || '',
      }))

    // 6. Build team progress summary - includes per-stage status array
    const teamProgress = teamNumbers.map(tn => {
      const teamSubs = (allSubs || []).filter(s => s.team_number === tn)
      const completed = teamSubs.filter(s => s.status === 'completed').length
      const inReview = teamSubs.filter(s => s.status === 'in-review').length
      const lastCompleted = teamSubs
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at))[0]

      // Build per-stage status array (1 to 7)
      const stages = []
      for (let n = 1; n <= 7; n++) {
        const sub = teamSubs.find(s => s.stage_number === n)
        stages.push({
          stage_number: n,
          stage_name: stageMap[n] || `Stage ${n}`,
          status: sub?.status || 'pending',
          submitted_at: sub?.submitted_at || null,
          reviewed_at: sub?.reviewed_at || null,
        })
      }

      return {
        team_number: tn,
        project_title: regMap[tn] || '',
        technology: (teams || []).find(t => t.team_number === tn)?.technology || '',
        completed,
        in_review: inReview,
        pending: 7 - completed - inReview,
        percent: Math.round((completed / 7) * 100),
        last_completed_at: lastCompleted?.reviewed_at || null,
        stages,
      }
    }).sort((a, b) => b.completed - a.completed || new Date(a.last_completed_at || '2099') - new Date(b.last_completed_at || '2099'))

    // 7. Stage-level progress (counts per stage across all mentor's teams)
    const stageProgress = (stages || []).map(stage => {
      const stageSubs = (allSubs || []).filter(s => s.stage_number === stage.stage_number)
      const completed = stageSubs.filter(s => s.status === 'completed').length
      const inReview = stageSubs.filter(s => s.status === 'in-review').length
      const totalForStage = teamNumbers.length
      const stillPending = totalForStage - completed - inReview
      return {
        stage_number: stage.stage_number,
        stage_name: stage.stage_name,
        completed,
        in_review: inReview,
        pending: stillPending,
        total: totalForStage,
        percent: totalForStage > 0 ? Math.round((completed / totalForStage) * 100) : 0,
      }
    })

    // 8. Stats
    const totalCompleted = teamProgress.reduce((s, t) => s + t.completed, 0)
    const totalPending = pending.length

    return Response.json({
      pending,
      teams: teamProgress,
      stageProgress,
      stats: {
        pending_reviews: totalPending,
        total_teams: teamNumbers.length,
        total_completed_stages: totalCompleted,
        avg_progress: Math.round(totalCompleted / teamNumbers.length),
      }
    })

  } catch (err) {
    console.error('Pending reviews error:', err)
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}