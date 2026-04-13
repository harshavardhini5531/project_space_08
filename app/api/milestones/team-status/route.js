// app/api/milestones/team-status/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamNumber = searchParams.get('team')

    if (!teamNumber) {
      return Response.json({ error: 'Team number required' }, { status: 400 })
    }

    // Get all 7 stages for this team
    const { data: submissions, error: subErr } = await supabase
      .from('milestone_submissions')
      .select('*')
      .eq('team_number', teamNumber)
      .order('stage_number', { ascending: true })

    if (subErr) throw subErr

    // Get stage reference data
    const { data: stages } = await supabase
      .from('milestone_stages')
      .select('*')
      .order('stage_number', { ascending: true })

    // Get team info
    const { data: team } = await supabase
      .from('teams')
      .select('id, team_number, serial_number, technology, mentor_assigned, registered')
      .eq('team_number', teamNumber)
      .single()

    // Get team registration data for project title
    const { data: reg } = await supabase
      .from('team_registrations')
      .select('project_title, project_description')
      .eq('team_number', teamNumber)
      .single()

    // Get mentor info
    let mentor = null
    if (team?.mentor_assigned) {
      const { data: m } = await supabase
        .from('mentors')
        .select('name, email, phone')
        .eq('name', team.mentor_assigned)
        .single()
      mentor = m
    }

    // Merge stage info with submissions
    const mergedStages = (stages || []).map(stage => {
      const sub = (submissions || []).find(s => s.stage_number === stage.stage_number)
      return {
        stage_number: stage.stage_number,
        stage_name: stage.stage_name,
        description: stage.description,
        credits_reward: stage.credits_reward,
        status: sub?.status || 'pending',
        submitted_by_roll: sub?.submitted_by_roll || null,
        submitted_by_name: sub?.submitted_by_name || null,
        submitted_at: sub?.submitted_at || null,
        reviewed_by_email: sub?.reviewed_by_email || null,
        reviewed_by_name: sub?.reviewed_by_name || null,
        reviewed_at: sub?.reviewed_at || null,
        mentor_comment: sub?.mentor_comment || null,
        credits_earned: sub?.credits_earned || 0,
      }
    })

    // Calculate progress
    const completedCount = mergedStages.filter(s => s.status === 'completed').length
    const progressPercent = Math.round((completedCount / 7) * 100)
    const totalCredits = mergedStages.reduce((sum, s) => sum + s.credits_earned, 0)

    // Determine which stages are actionable
    const stagesWithActions = mergedStages.map((stage, i) => {
      let actionable = false
      if (stage.status === 'pending') {
        // Can submit only if previous stage is completed (or it's stage 1)
        if (i === 0) actionable = true
        else actionable = mergedStages[i - 1].status === 'completed'
      }
      return { ...stage, actionable }
    })

    return Response.json({
      team: {
        team_number: team?.team_number,
        serial_number: team?.serial_number,
        technology: team?.technology,
        mentor_assigned: team?.mentor_assigned,
        project_title: reg?.project_title || '',
        project_description: reg?.project_description || '',
      },
      mentor,
      stages: stagesWithActions,
      progress: {
        completed: completedCount,
        total: 7,
        percent: progressPercent,
        credits: totalCredits,
      }
    })
  } catch (err) {
    console.error('Team status error:', err)
    return Response.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}