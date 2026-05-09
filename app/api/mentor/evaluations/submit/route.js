// app/api/mentor/evaluations/submit/route.js
//
// Submits or updates a mentor's evaluation for a team.
// Uses UPSERT (insert if new, update if mentor already evaluated this team).
//
// Method: POST
// Auth: x-mentor-token + body.mentorEmail
// Body: {
//   mentorEmail: string,
//   teamNumber: string,
//   scores: {
//     innovation: 0-10,
//     technical: 0-10,
//     uiux: 0-10,
//     relevance: 0-10,
//     demo: 0-10,
//     documentation: 0-10
//   },
//   comments?: string
// }
//
// Response:
//   { ok: true, evaluation: { ...full row including computed average } }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const REQUIRED_SCORE_KEYS = ['innovation', 'technical', 'uiux', 'relevance', 'demo', 'documentation']

export async function POST(request) {
  try {
    // ── 1. Auth ──
    const token = request.headers.get('x-mentor-token')
    if (!token || !token.startsWith('mentor_')) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Parse body ──
    const body = await request.json()
    const { mentorEmail, teamNumber, scores, comments } = body

    if (!mentorEmail) {
      return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })
    }
    if (!teamNumber) {
      return Response.json({ ok: false, error: 'teamNumber required' }, { status: 400 })
    }
    if (!scores || typeof scores !== 'object') {
      return Response.json({ ok: false, error: 'scores object required' }, { status: 400 })
    }

    // ── 3. Validate scores ──
    for (const key of REQUIRED_SCORE_KEYS) {
      const val = scores[key]
      if (val === undefined || val === null || val === '') {
        return Response.json(
          { ok: false, error: `Score "${key}" is required (0-10)` },
          { status: 400 }
        )
      }
      const num = Number(val)
      if (!Number.isInteger(num) || num < 0 || num > 10) {
        return Response.json(
          { ok: false, error: `Score "${key}" must be an integer between 0 and 10` },
          { status: 400 }
        )
      }
    }

    // ── 4. Lookup mentor ──
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email, technology')
      .eq('email', mentorEmail)
      .single()

    if (!mentor) {
      return Response.json({ ok: false, error: 'Mentor not found' }, { status: 404 })
    }

    // ── 5. Verify team is assigned to this mentor ──
    const { data: team } = await supabase
      .from('teams')
      .select('team_number, mentor_assigned')
      .eq('team_number', teamNumber)
      .single()

    if (!team) {
      return Response.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }
    if (team.mentor_assigned !== mentor.name) {
      return Response.json(
        { ok: false, error: 'Not authorized to evaluate this team' },
        { status: 403 }
      )
    }

    // ── 6. Build payload ──
    const payload = {
      team_number: teamNumber,
      mentor_id: mentor.id,
      mentor_email: mentor.email,
      mentor_name: mentor.name,
      innovation_score: Number(scores.innovation),
      technical_score: Number(scores.technical),
      uiux_score: Number(scores.uiux),
      relevance_score: Number(scores.relevance),
      demo_score: Number(scores.demo),
      documentation_score: Number(scores.documentation),
      comments: typeof comments === 'string' ? comments.trim().slice(0, 5000) : null,
    }

    // ── 7. UPSERT (one-per-mentor-per-team enforced by unique constraint) ──
    const { data: result, error: upsertErr } = await supabase
      .from('mentor_evaluations')
      .upsert(payload, {
        onConflict: 'team_number,mentor_id',
        ignoreDuplicates: false,
      })
      .select('*')
      .single()

    if (upsertErr) {
      console.error('[mentor-eval-submit] Upsert error:', upsertErr)
      return Response.json(
        { ok: false, error: 'Failed to save evaluation', detail: upsertErr.message },
        { status: 500 }
      )
    }

    return Response.json({
      ok: true,
      evaluation: result,
      message: `Evaluation saved for ${teamNumber}. Average: ${result.average_score}/10`,
    })
  } catch (err) {
    console.error('[mentor-eval-submit] Unhandled error:', err)
    return Response.json(
      { ok: false, error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}