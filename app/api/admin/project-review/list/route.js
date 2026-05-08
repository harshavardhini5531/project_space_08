// app/api/admin/project-review/list/route.js
//
// Admin's project review dashboard — returns all teams with their
// review status, scores, and summary counts in ONE API call.
//
// Supports optional filters: technology, batch, status.
// SECURITY: admin email check.

import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────
// GET handler
// Query params:
//   adminEmail (required)
//   technology (optional) — filter by tech
//   batch (optional) — filter by batch
//   status (optional) — filter by status
//   includeNotSubmitted (default: true) — show teams without submissions
// ─────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = (searchParams.get('adminEmail') || '').trim().toLowerCase();
    const filterTech = searchParams.get('technology') || null;
    const filterBatch = searchParams.get('batch') || null;
    const filterStatus = searchParams.get('status') || null;
    const includeNotSubmitted =
      searchParams.get('includeNotSubmitted') !== 'false';

    // ───── 1. Auth ─────
    if (!adminEmail) {
      return Response.json(
        { ok: false, error: 'adminEmail required' },
        { status: 400 }
      );
    }
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return Response.json(
        { ok: false, error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    // ───── 2. Fetch all teams (apply filters) ─────
    let teamQuery = supabase
      .from('teams')
      .select(
        'serial_number, team_number, technology, batch, leader_roll, mentor_assigned, project_title, registered'
      )
      .order('team_number', { ascending: true });

    if (filterTech) {
      teamQuery = teamQuery.eq('technology', filterTech);
    }
    if (filterBatch) {
      teamQuery = teamQuery.eq('batch', filterBatch);
    }

    const { data: teams, error: teamErr } = await teamQuery;

    if (teamErr) {
      console.error('[admin/list] Teams fetch error:', teamErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch teams.' },
        { status: 500 }
      );
    }

    if (!teams || teams.length === 0) {
      return Response.json({
        ok: true,
        teams: [],
        summary: emptySummary(),
        filters_available: emptyFilters(),
      });
    }

    // ───── 3. Fetch all submissions (1 query, indexed by team_number) ─────
    const teamNumbers = teams.map((t) => t.team_number);
    const { data: submissions, error: subErr } = await supabase
      .from('project_review_submissions')
      .select(
        'id, team_number, status, name, github_url, submitted_at, ' +
          'reviewed_at, failure_reason, retry_count, max_retries, ' +
          'admin_locked, current_run_id, project_type'
      )
      .in('team_number', teamNumbers);

    if (subErr) {
      console.error('[admin/list] Submissions fetch error:', subErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch submissions.' },
        { status: 500 }
      );
    }

    const submissionMap = {};
    for (const s of submissions || []) {
      submissionMap[s.team_number] = s;
    }

    // ───── 4. Fetch latest report per team ─────
    const submissionIds = (submissions || []).map((s) => s.id);
    let reportMap = {};
    if (submissionIds.length > 0) {
      const { data: reports } = await supabase
        .from('project_review_reports')
        .select(
          'submission_id, team_number, score_overall, score_breakdown, ' +
            'review_completed_at, ai_model, ai_cost_usd, status, summary'
        )
        .in('submission_id', submissionIds)
        .eq('status', 'completed')
        .order('review_completed_at', { ascending: false });

      // Take only the LATEST report per submission
      for (const r of reports || []) {
        if (!reportMap[r.submission_id]) {
          reportMap[r.submission_id] = r;
        }
      }
    }

    // ───── 5. Build unified rows ─────
    const rows = teams
      .map((team) => {
        const submission = submissionMap[team.team_number] || null;
        const report = submission ? reportMap[submission.id] : null;

        const status = submission ? submission.status : 'not_submitted';

        return {
          // From teams
          team_number: team.team_number,
          serial_number: team.serial_number,
          technology: team.technology,
          batch: team.batch,
          leader_roll: team.leader_roll,
          mentor: team.mentor_assigned,
          team_registered: team.registered,

          // Submission status
          status,
          has_submission: !!submission,
          submission_id: submission?.id || null,

          // Submission details (if exists)
          project_title: submission?.name || team.project_title || null,
          github_url: submission?.github_url || null,
          project_type: submission?.project_type || null,
          submitted_at: submission?.submitted_at || null,
          reviewed_at: submission?.reviewed_at || null,
          failure_reason: submission?.failure_reason || null,
          retry_count: submission?.retry_count || 0,
          admin_locked: submission?.admin_locked || false,
          current_run_id: submission?.current_run_id || null,

          // Score (if reviewed)
          score: report
            ? {
                overall: report.score_overall,
                breakdown: report.score_breakdown,
                ai_model: report.ai_model,
                cost_usd: report.ai_cost_usd
                  ? parseFloat(report.ai_cost_usd)
                  : null,
                summary: report.summary,
                reviewed_at: report.review_completed_at,
              }
            : null,
        };
      })
      // Optional filter: hide teams without submissions
      .filter((row) => {
        if (!includeNotSubmitted && !row.has_submission) return false;
        if (filterStatus && row.status !== filterStatus) return false;
        return true;
      });

    // ───── 6. Summary counts ─────
    const summary = computeSummary(rows);

    // ───── 7. Available filters (computed from FULL data, not filtered rows) ─────
    const filters_available = computeFilters(teams, submissions || []);

    return Response.json({
      ok: true,
      teams: rows,
      summary,
      filters_available,
      filters_applied: {
        technology: filterTech,
        batch: filterBatch,
        status: filterStatus,
        includeNotSubmitted,
      },
    });
  } catch (err) {
    console.error('[admin/list] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function computeSummary(rows) {
  const counts = {
    total_teams: rows.length,
    not_submitted: 0,
    pending: 0,
    queued: 0,
    reviewing: 0,
    reviewed: 0,
    failed: 0,
    locked_for_resubmit: 0,
  };

  let totalScore = 0;
  let scoredCount = 0;
  let totalCost = 0;

  for (const r of rows) {
    if (r.admin_locked) {
      counts.locked_for_resubmit += 1;
    }
    if (counts[r.status] !== undefined) {
      counts[r.status] += 1;
    }
    if (r.score?.overall != null) {
      totalScore += r.score.overall;
      scoredCount += 1;
    }
    if (r.score?.cost_usd) {
      totalCost += r.score.cost_usd;
    }
  }

  return {
    ...counts,
    submitted_total:
      counts.pending + counts.queued + counts.reviewing + counts.reviewed + counts.failed,
    reviewed_pct:
      rows.length > 0
        ? Math.round((counts.reviewed / rows.length) * 100)
        : 0,
    avg_score: scoredCount > 0 ? Math.round(totalScore / scoredCount) : null,
    total_cost_usd: parseFloat(totalCost.toFixed(4)),
  };
}

function emptySummary() {
  return {
    total_teams: 0,
    not_submitted: 0,
    pending: 0,
    queued: 0,
    reviewing: 0,
    reviewed: 0,
    failed: 0,
    locked_for_resubmit: 0,
    submitted_total: 0,
    reviewed_pct: 0,
    avg_score: null,
    total_cost_usd: 0,
  };
}

function computeFilters(teams, submissions) {
  const techs = new Set();
  const batches = new Set();
  const statuses = new Set();

  for (const t of teams) {
    if (t.technology) techs.add(t.technology);
    if (t.batch) batches.add(t.batch);
  }
  // Status options known up front
  ['not_submitted', 'pending', 'queued', 'reviewing', 'reviewed', 'failed'].forEach(
    (s) => statuses.add(s)
  );

  return {
    technologies: Array.from(techs).sort(),
    batches: Array.from(batches).sort(),
    statuses: Array.from(statuses),
  };
}

function emptyFilters() {
  return {
    technologies: [],
    batches: [],
    statuses: ['not_submitted', 'pending', 'queued', 'reviewing', 'reviewed', 'failed'],
  };
}