// app/api/admin/review-scores/route.js
// Admin endpoint: lists all teams with AI review scores
// Uses ONE call to dev's /api/projects endpoint (returns all with latestScore embedded)

import { supabase } from '@/lib/supabase'

const DEV_API_BASE = process.env.DEV_API_URL?.replace('/api/projects', '') || 'http://117.250.198.93:5010'
const FETCH_TIMEOUT_MS = 30000

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    const r = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return null
    return await r.json()
  } catch (e) {
    clearTimeout(timeout)
    console.error('[review-scores] fetch failed:', url, e.message)
    return null
  }
}

// Average the 5 dimensions of latestScore into one overall number
function computeOverall(latestScore) {
  if (!latestScore || typeof latestScore !== 'object') return null
  const vals = Object.values(latestScore).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

const round = (n) => n == null ? null : Math.round(n * 10) / 10

export async function POST(request) {
  try {
    // ── 1. Auth ──
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io')
      .split(',').map(s => s.trim().toLowerCase())
    const { adminEmail } = await request.json().catch(() => ({}))

    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Fetch all submissions (team_number ↔ dev_api_id mapping) ──
    const { data: submissions } = await supabase
      .from('project_review_submissions')
      .select('id, team_number, technology, name, dev_api_id')
      .order('team_number')

    if (!submissions || submissions.length === 0) {
      return Response.json({
        ok: true,
        stats: { total_teams_with_reviews: 0, total_teams: 0, avg_score: 0, total_runs: 0, improving: 0, declining: 0 },
        distribution: {}, tech_avg: [], teams: [],
      })
    }

    // ── 3. Build map: dev_api_id → submission ──
    const subByDevId = {}
    for (const sub of submissions) {
      if (sub.dev_api_id) subByDevId[sub.dev_api_id] = sub
    }

    // ── 4. ONE call to dev's full project list (all data embedded) ──
    const devData = await fetchWithTimeout(`${DEV_API_BASE}/api/projects`)
    const devProjects = Array.isArray(devData?.data) ? devData.data : []

    // ── 5. Map dev projects → team data ──
    const teamResults = []
    for (const p of devProjects) {
      const sub = subByDevId[p._id]
      if (!sub) continue  // dev project not linked to any of our teams

      const overall = computeOverall(p.latestScore)

      teamResults.push({
        submission: sub,
        latest_score: overall,
        total_runs: p.reviewCount || 0,
        last_run_at: p.lastReviewedAt || null,
        status: p.status || 'idle',
        latest_ai_usage: p.latest_ai_usage ?? null,
        dimension_scores: p.latestScore || null,  // 5 dimensions for detail view
      })
    }

    // ── 6. Mentor evaluations (same as before) ──
    const teamNumbers = teamResults.map(t => t.submission.team_number)
    const mentorEvalMap = {}
    if (teamNumbers.length > 0) {
      const { data: evals } = await supabase
        .from('mentor_evaluations')
        .select('team_number, average_score')
        .in('team_number', teamNumbers)
      ;(evals || []).forEach(e => {
        if (!mentorEvalMap[e.team_number]) mentorEvalMap[e.team_number] = []
        mentorEvalMap[e.team_number].push(Number(e.average_score))
      })
    }

    // ── 7. Build final team rows ──
    const teams = teamResults.map(r => {
      const sub = r.submission
      const mentorEvals = mentorEvalMap[sub.team_number] || []
      const mentorAvg = mentorEvals.length > 0
        ? round(mentorEvals.reduce((a, b) => a + b, 0) / mentorEvals.length)
        : null

      return {
        team_number: sub.team_number,
        project_title: sub.name || '(Untitled)',
        technology: sub.technology || '—',
        latest_score: r.latest_score,
        delta: null,  // not computing delta (would require per-project reviews call)
        total_runs: r.total_runs,
        last_run_at: r.last_run_at,
        status: r.status,
        latest_ai_usage: r.latest_ai_usage,
        dimension_scores: r.dimension_scores,
        mentor_eval_avg: mentorAvg,
        mentor_eval_count: mentorEvals.length,
        source: 'dev',
      }
    })

    // ── 8. Aggregate stats ──
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

    const reviewing = teams.filter(t => t.status === 'reviewing').length
    const totalRuns = teams.reduce((sum, t) => sum + (t.total_runs || 0), 0)

    const { count: totalTeamsCount } = await supabase
      .from('teams').select('*', { count: 'exact', head: true })

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
        improving: 0,
        declining: 0,
        reviewing_count: reviewing,
      },
      distribution, tech_avg: techAvg, teams,
    })
  } catch (err) {
    console.error('[review-scores] error:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}