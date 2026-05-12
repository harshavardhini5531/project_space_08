// app/api/mentor/panel-score/route.js
//
// Mentor panel scoring endpoint (v3 — table view, all 160 teams, hard duplicate block).
//
// GET  ?mentorEmail=X       — Returns mentor's panel + all 160 teams + mentor's existing scores
// POST { mentorEmail, teamNumber, scores: {project_idea, ai_usage, presentation, technical, project_complexity} }
//                          — Submit NEW score. Returns 409 if mentor already scored this team.

import { supabase } from '@/lib/supabase'

function badRequest(msg, status = 400) {
  return Response.json({ ok: false, error: msg }, { status })
}

async function verifyPanelMentor(mentorEmail) {
  if (!mentorEmail || typeof mentorEmail !== 'string') return { ok: false, error: 'mentorEmail required', status: 400 }
  const email = mentorEmail.toLowerCase().trim()

  const { data: mentor, error: mErr } = await supabase
    .from('mentors')
    .select('id, name, email, technology, is_active')
    .eq('email', email)
    .maybeSingle()
  if (mErr || !mentor) return { ok: false, error: 'Mentor not found', status: 401 }
  if (mentor.is_active === false) return { ok: false, error: 'Mentor account inactive', status: 403 }

  const { data: assignment, error: aErr } = await supabase
    .from('panel_assignments')
    .select('id, panel_name, is_active')
    .eq('mentor_email', email)
    .maybeSingle()
  if (aErr || !assignment || assignment.is_active === false) {
    return { ok: false, error: 'You are not assigned to a panel. Contact admin.', status: 403 }
  }

  return { ok: true, mentor, panel: assignment }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorEmail = searchParams.get('mentorEmail')

    const verify = await verifyPanelMentor(mentorEmail)
    if (!verify.ok) return Response.json({ ok: false, error: verify.error }, { status: verify.status })

    const { mentor, panel } = verify

    // Get mentor's submitted scores
    const { data: myScores } = await supabase
      .from('panel_scores')
      .select('*')
      .eq('mentor_email', mentor.email.toLowerCase())
      .order('updated_at', { ascending: false })

    // Get ALL 160 teams (not restricted to finalists anymore)
    const { data: teams } = await supabase
      .from('teams')
      .select('team_number, project_title, technology, mentor_assigned, leader_roll')
      .order('team_number', { ascending: true })

    return Response.json({
      ok: true,
      mentor: { name: mentor.name, email: mentor.email, technology: mentor.technology },
      panel: { name: panel.panel_name },
      teams: teams || [],
      myScores: myScores || [],
    })
  } catch (err) {
    console.error('[mentor/panel-score GET] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { mentorEmail, teamNumber, scores } = body

    const verify = await verifyPanelMentor(mentorEmail)
    if (!verify.ok) return Response.json({ ok: false, error: verify.error }, { status: verify.status })

    const { mentor, panel } = verify

    if (!teamNumber || typeof teamNumber !== 'string') return badRequest('teamNumber required')
    if (!scores || typeof scores !== 'object') return badRequest('scores object required')

    // 5 criteria — last one renamed to project_complexity
    const keys = ['project_idea', 'ai_usage', 'presentation', 'technical', 'project_complexity']
    const cleaned = {}
    for (const k of keys) {
      const v = Number(scores[k])
      if (isNaN(v) || v < 0 || v > 10) return badRequest(`${k} must be a number 0-10 (got ${scores[k]})`)
      cleaned[k] = Math.round(v * 10) / 10
    }

    // Verify team exists
    const { data: team } = await supabase
      .from('teams')
      .select('team_number')
      .eq('team_number', teamNumber)
      .maybeSingle()
    if (!team) return badRequest(`Team ${teamNumber} not found`, 404)

    // HARD BLOCK: check if this mentor already scored this team
    const { data: existing } = await supabase
      .from('panel_scores')
      .select('id, total_score, updated_at')
      .eq('team_number', teamNumber)
      .eq('mentor_email', mentor.email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return Response.json({
        ok: false,
        error: `You have already submitted a score for ${teamNumber}. Duplicate submissions are not allowed.`,
        existing: {
          id: existing.id,
          total_score: existing.total_score,
          submitted_at: existing.updated_at,
        },
      }, { status: 409 })
    }

    // NOTE: DB column is still 'score_qa_defense' for backwards compat — store project_complexity value there
    const row = {
      team_number: teamNumber,
      mentor_id: mentor.id,
      mentor_email: mentor.email.toLowerCase(),
      mentor_name: mentor.name,
      panel_name: panel.panel_name,
      score_project_idea: cleaned.project_idea,
      score_ai_usage: cleaned.ai_usage,
      score_presentation: cleaned.presentation,
      score_technical: cleaned.technical,
      score_qa_defense: cleaned.project_complexity,  // ← reusing existing column for new label
      total_score: cleaned.project_idea + cleaned.ai_usage + cleaned.presentation + cleaned.technical + cleaned.project_complexity,
    }

    const { data: saved, error: saveErr } = await supabase
      .from('panel_scores')
      .insert(row)
      .select()
      .single()

    if (saveErr) {
      // Unique constraint violation (in case race condition)
      if (saveErr.code === '23505') {
        return Response.json({
          ok: false,
          error: `You have already submitted a score for ${teamNumber}. Duplicate submissions are not allowed.`,
        }, { status: 409 })
      }
      console.error('[mentor/panel-score POST] save error:', saveErr)
      return Response.json({ ok: false, error: 'Could not save score', detail: saveErr.message }, { status: 500 })
    }

    return Response.json({ ok: true, score: saved })
  } catch (err) {
    console.error('[mentor/panel-score POST] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}