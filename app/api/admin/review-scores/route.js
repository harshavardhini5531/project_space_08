// app/api/admin/review-scores/route.js
//
// Admin endpoint: lists all teams that have AI review reports with their latest scores.
// Smart-switches between dev's API (primary) and internal DB (fallback).
//
// Method: POST
// Auth: x-admin-token header (basic check; using same pattern as other admin routes)
// Body: { adminEmail: string }
//
// Response:
// {
//   ok: true,
//   stats: { total_teams_with_reviews, total_teams, avg_score, total_runs, improving, declining },
//   distribution: { '0-20': N, '21-40': N, '41-60': N, '61-80': N, '81-100': N },
//   tech_avg: [{ technology, avg, count }],
//   teams: [
//     { team_number, project_title, technology, latest_score, delta, total_runs,
//       last_run_at, mentor_eval_avg, source }
//   ]
// }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 15000

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

function avgOfScores(scores) {
  if (!scores) return null
  const vals = Object.values(scores).filter(v => typeof v === 'number')
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export async function POST(request) {
  try {
    // ── 1. Auth (basic check) ──
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io').split(',').map(s => s.trim().toLowerCase())
    const { adminEmail } = await request.json().catch(() => ({}))

    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Fetch all submissions with dev_api_id ──
    const { data: submissions } = await supabase
      .from('project_review_submissions')
      .select('id, team_number, technology, name, dev_api_id')
      .order('team_number')

    if (!submissions || submissions.length === 0) {
      return Response.json({
        ok: true,
        stats: { total_teams_with_reviews: 0, total_teams: 0, avg_score: 0, total_runs: 0, improving: 0, declining: 0 },
        distribution: {},
        tech_avg: [],
        teams: [],
      })
    }

    // ── 3. Fetch dev's full project list (one call, has all reviews counts) ──
    const devData = await fetchWithTimeout(`${DEV_API_BASE}/api/projects`)
    const devProjects = Array.isArray(devData?.data) ? devData.data : []
    const devById = {}
    for (const p of devProjects) {
      if (p._id) devById[p._id] = p
    }

    // ── 4. For each submission, fetch its reviews (parallel batches) ──
    const BATCH_SIZE = 10
    const teamResults = []

    for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
      const batch = submissions.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(async (sub) => {
        if (!sub.dev_api_id) {
          // Try internal fallback
          const { data: internal } = await supabase
            .from('project_review_reports')
            .select('score_overall, review_completed_at')
            .eq('submission_id', sub.id)
            .eq('status', 'completed')
            .order('review_completed_at', { ascending: false })

          if (internal && internal.length > 0) {
            const latest = internal[0].score_overall
            const previous = internal[1]?.score_overall ?? null
            return {
              submission: sub,
              latest_score: latest,
              previous_score: previous,
              total_runs: internal.length,
              last_run_at: internal[0].review_completed_at,
              source: 'internal',
            }
          }
          return null
        }

        // Fetch from dev
        const reviewsData = await fetchWithTimeout(`${DEV_API_BASE}/api/projects/${sub.dev_api_id}/reviews`)
        const reviews = Array.isArray(reviewsData?.data) ? reviewsData.data : []

        if (reviews.length === 0) return null

        // Sort newest first
        const sorted = [...reviews].sort((a, b) => {
          const ta = new Date(a.createdAt || a.completedAt || 0).getTime()
          const tb = new Date(b.createdAt || b.completedAt || 0).getTime()
          return tb - ta
        })

        const latestRev = sorted[0]
        const prevRev = sorted[1]

        return {
          submission: sub,
          latest_score: avgOfScores(latestRev?.scores),
          previous_score: prevRev ? avgOfScores(prevRev.scores) : null,
          total_runs: reviews.length,
          last_run_at: latestRev?.createdAt || latestRev?.completedAt,
          source: 'dev',
        }
      }))
      teamResults.push(...batchResults.filter(Boolean))
    }

    // ── 5. Fetch mentor evaluation averages ──
    const teamNumbers = teamResults.map(t => t.submission.team_number)
    const mentorEvalMap = {}
    if (teamNumbers.length > 0) {
      const { data: evals } = await supabase
        .from('mentor_evaluations')
        .select('team_number, average_score')
        .in('team_number', teamNumbers)

      ;(evals || []).forEach(e => {
        if (!mentorEvalMap[e.team_number]) {
          mentorEvalMap[e.team_number] = []
        }
        mentorEvalMap[e.team_number].push(Number(e.average_score))
      })
    }

    // ── 6. Build team rows ──
    const round = (n) => n == null ? null : Math.round(n * 10) / 10
    const teams = teamResults.map(r => {
      const sub = r.submission
      const delta = (r.latest_score != null && r.previous_score != null)
        ? round(r.latest_score - r.previous_score)
        : null

      const mentorEvals = mentorEvalMap[sub.team_number] || []
      const mentorEvalAvg = mentorEvals.length > 0
        ? round(mentorEvals.reduce((a, b) => a + b, 0) / mentorEvals.length)
        : null

      return {
        team_number: sub.team_number,
        project_title: sub.name || '(Untitled)',
        technology: sub.technology || '—',
        latest_score: r.latest_score,
        delta,
        total_runs: r.total_runs,
        last_run_at: r.last_run_at,
        mentor_eval_avg: mentorEvalAvg,
        mentor_eval_count: mentorEvals.length,
        source: r.source,
      }
    })

    // ── 7. Build aggregate stats ──
    const scores = teams.map(t => t.latest_score).filter(s => typeof s === 'number')
    const avgScore = scores.length > 0 ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const distribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    for (const s of scores) {
      if (s <= 20) distribution['0-20']++
      else if (s <= 40) distribution['21-40']++
      else if (s <= 60) distribution['41-60']++
      else if (s <= 80) distribution['61-80']++
      else distribution['81-100']++
    }

    const improving = teams.filter(t => t.delta != null && t.delta > 0).length
    const declining = teams.filter(t => t.delta != null && t.delta < 0).length
    const totalRuns = teams.reduce((sum, t) => sum + (t.total_runs || 0), 0)

    // Get total teams count for coverage stat
    const { count: totalTeamsCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    // Tech breakdown
    const techGroups = {}
    for (const t of teams) {
      if (!techGroups[t.technology]) techGroups[t.technology] = []
      if (t.latest_score != null) techGroups[t.technology].push(t.latest_score)
    }
    const techAvg = Object.keys(techGroups).map(tech => ({
      technology: tech,
      avg: techGroups[tech].length > 0
        ? round(techGroups[tech].reduce((a, b) => a + b, 0) / techGroups[tech].length)
        : 0,
      count: techGroups[tech].length,
    })).sort((a, b) => b.avg - a.avg)

    return Response.json({
      ok: true,
      stats: {
        total_teams_with_reviews: teams.length,
        total_teams: totalTeamsCount || 0,
        avg_score: avgScore,
        total_runs: totalRuns,
        improving,
        declining,
      },
      distribution,
      tech_avg: techAvg,
      teams,
    })
  } catch (err) {
    console.error('[admin-review-scores] Error:', err)
    return Response.json(
      { ok: false, error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}