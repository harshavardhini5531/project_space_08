// app/api/project-review/report/route.js
//
// Unified review report fetcher.
// Tries dev's API first (primary), falls back to internal DB.
// Normalizes both shapes into a single output format.
//
// Method: POST
// Body: { teamNumber: 'PS-XXX' }
// Optional auth: x-mentor-token (mentor) OR roll_number+team membership (student) OR admin email
//
// Response shape:
// {
//   ok: true,
//   source: 'dev' | 'internal' | 'none',
//   team: { team_number, project_title, technology, leader_name, ... },
//   has_reports: bool,
//   total_runs: number,
//   latest: <normalized review> | null,
//   runs: [<normalized review>, ...],   // all runs, newest first
//   delta_from_previous: { overall: number, breakdown: {...} } | null,
//   trend: [{ run_index, date, overall_score, scores: {...} }, ...]   // for chart
// }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 8000

// ────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const r = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return null
    return await r.json()
  } catch {
    clearTimeout(timeout)
    return null
  }
}

/**
 * Normalize a review from dev's API into our unified shape.
 *
 * Dev's API review:
 * {
 *   _id, projectId, scores: { problem_statement, architecture_design, ... },
 *   feedback: { problem_statement: "text", ... },
 *   strengths: [string], improvements: [string],
 *   specQuality: {...}, filesReviewed: [string],
 *   createdAt, completedAt
 * }
 */
function normalizeDevReview(review, runIndex) {
  const scores = review?.scores || {}
  const feedback = review?.feedback || {}

  const scoreValues = Object.values(scores).filter(v => typeof v === 'number')
  const overall = scoreValues.length
    ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
    : null

  return {
    run_index: runIndex,
    review_id: review?._id || null,
    source: 'dev',
    completed_at: review?.completedAt || review?.createdAt || null,
    started_at: review?.startedAt || null,
    status: review?.status || 'completed',

    overall_score: overall,
    scores: {
      problem_statement: scores.problem_statement ?? null,
      architecture_design: scores.architecture_design ?? null,
      requirements_fulfillment: scores.requirementsFulfillment ?? null,
      code_quality: scores.code_quality ?? null,
      future_scope: scores.future_scope ?? null,
    },

    feedback: {
      summary: feedback.summary || '',
      problem_statement: feedback.problem_statement || '',
      architecture_design: feedback.architecture_design || '',
      requirements_fulfillment: feedback.requirementsFulfillment || '',
      code_quality: feedback.code_quality || '',
      future_scope: feedback.future_scope || '',
    },

    strengths: Array.isArray(review?.strengths) ? review.strengths : [],
    improvements: Array.isArray(review?.improvements) ? review.improvements : [],
    spec_quality: review?.specQuality || null,
    files_reviewed: Array.isArray(review?.filesReviewed) ? review.filesReviewed : [],
  }
}

/**
 * Normalize a row from internal project_review_reports into the unified shape.
 *
 * Internal row:
 * {
 *   id, submission_id, score_overall, score_breakdown (jsonb),
 *   positives (jsonb), bugs (jsonb), improvements (jsonb),
 *   summary (text), tech_stack_validation (jsonb),
 *   review_completed_at, ai_model
 * }
 */
function normalizeInternalReport(row, runIndex) {
  const breakdown = row?.score_breakdown || {}

  return {
    run_index: runIndex,
    review_id: String(row?.id || ''),
    source: 'internal',
    completed_at: row?.review_completed_at || null,
    started_at: row?.review_started_at || null,
    status: row?.status || 'completed',
    ai_model: row?.ai_model || null,

    overall_score: row?.score_overall ?? null,
    scores: {
      problem_statement: breakdown.problem_statement ?? null,
      architecture_design: breakdown.architecture_design ?? null,
      requirements_fulfillment: breakdown.requirements_fulfillment ?? null,
      code_quality: breakdown.code_quality ?? null,
      future_scope: breakdown.future_scope ?? null,
    },

    feedback: {
      summary: row?.summary || '',
      problem_statement: '',
      architecture_design: '',
      requirements_fulfillment: '',
      code_quality: '',
      future_scope: '',
    },

    strengths: Array.isArray(row?.positives) ? row.positives : [],
    improvements: Array.isArray(row?.improvements) ? row.improvements : [],
    bugs: Array.isArray(row?.bugs) ? row.bugs : [],
    spec_quality: row?.tech_stack_validation || null,
    files_reviewed: [],
  }
}

/**
 * Compute delta between latest and previous review.
 */
function computeDelta(latest, previous) {
  if (!latest || !previous) return null

  const round = (n) => n == null ? null : Math.round(n * 10) / 10

  const overallDelta = (latest.overall_score != null && previous.overall_score != null)
    ? round(latest.overall_score - previous.overall_score)
    : null

  const breakdown = {}
  for (const key of Object.keys(latest.scores)) {
    const a = latest.scores[key]
    const b = previous.scores[key]
    breakdown[key] = (a != null && b != null) ? round(a - b) : null
  }

  return { overall: overallDelta, breakdown }
}

// ────────────────────────────────────────────
// MAIN HANDLER
// ────────────────────────────────────────────
export async function POST(request) {
  try {
    const { teamNumber } = await request.json()

    if (!teamNumber || typeof teamNumber !== 'string') {
      return Response.json({ ok: false, error: 'teamNumber required' }, { status: 400 })
    }

    // ── 1. Look up the team and its dev_api_id ──
    // Prefer rows that have dev_api_id (synced to dev), fall back to newest by id
    const { data: candidates } = await supabase
      .from('project_review_submissions')
      .select('id, team_number, technology, name, github_url, dev_api_id, project_type, submitted_at, dev_api_synced_at')
      .eq('team_number', teamNumber)
      .order('id', { ascending: false })

    const submission = (candidates || []).find(c => c.dev_api_id) || (candidates || [])[0] || null

    // Always try to fetch team meta from teams table for context
    const { data: teamRow } = await supabase
      .from('teams')
      .select('team_number, technology, leader_roll, project_title, project_description, mentor_assigned')
      .eq('team_number', teamNumber)
      .maybeSingle()

    // Get leader name
    let leaderName = '—'
    if (teamRow?.leader_roll) {
      const { data: leader } = await supabase
        .from('students')
        .select('name')
        .eq('roll_number', teamRow.leader_roll)
        .maybeSingle()
      if (leader?.name) leaderName = leader.name
    }

    const team = {
      team_number: teamNumber,
      project_title: submission?.name || teamRow?.project_title || '(Untitled)',
      technology: submission?.technology || teamRow?.technology || '—',
      leader_name: leaderName,
      mentor_assigned: teamRow?.mentor_assigned || null,
      github_url: submission?.github_url || null,
      project_type: submission?.project_type || null,
      dev_api_id: submission?.dev_api_id || null,
    }

    // ── 2. Try dev's API first (PRIMARY) ──
    let runs = []
    let source = 'none'

    if (submission?.dev_api_id) {
      const url = `${DEV_API_BASE}/api/projects/${submission.dev_api_id}/reviews`
      const devData = await fetchWithTimeout(url)
      const devReviews = Array.isArray(devData?.data) ? devData.data : []

      if (devReviews.length > 0) {
        // Sort by createdAt ASC so run_index 1 = oldest
        const sorted = [...devReviews].sort((a, b) => {
          const ta = new Date(a.createdAt || a.completedAt || 0).getTime()
          const tb = new Date(b.createdAt || b.completedAt || 0).getTime()
          return ta - tb
        })
        runs = sorted.map((r, i) => normalizeDevReview(r, i + 1))
        source = 'dev'
      }
    }

    // ── 3. Fallback: internal project_review_reports ──
    if (runs.length === 0 && submission?.id) {
      const { data: internalRows } = await supabase
        .from('project_review_reports')
        .select('*')
        .eq('submission_id', submission.id)
        .eq('status', 'completed')
        .order('review_completed_at', { ascending: true })

      if (internalRows && internalRows.length > 0) {
        runs = internalRows.map((row, i) => normalizeInternalReport(row, i + 1))
        source = 'internal'
      }
    }

    // ── 4. Build trend data (for chart) ──
    const trend = runs.map(r => ({
      run_index: r.run_index,
      date: r.completed_at,
      overall_score: r.overall_score,
      scores: r.scores,
    }))

    // ── 5. Compute delta from previous to latest ──
    let latest = null
    let previous = null
    let delta = null
    if (runs.length > 0) {
      // Latest = last in chronological array (highest run_index)
      latest = runs[runs.length - 1]
      previous = runs.length > 1 ? runs[runs.length - 2] : null
      delta = computeDelta(latest, previous)
    }

    // ── 6. Reverse runs so newest first in response ──
    const runsNewestFirst = [...runs].reverse()

    return Response.json({
      ok: true,
      source,
      team,
      has_reports: runs.length > 0,
      total_runs: runs.length,
      latest,
      previous,
      delta_from_previous: delta,
      runs: runsNewestFirst,
      trend,
    })
  } catch (err) {
    console.error('[project-review-report] Error:', err)
    return Response.json(
      { ok: false, error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}