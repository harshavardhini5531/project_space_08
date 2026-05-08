// app/api/admin/project-review/run-batch/route.js
// Admin clicks "Run All Reviews" → this route queues all pending submissions.
//
// FAST endpoint (returns in <1s). Actual AI processing happens in
// /scripts/process-review-queue.js (cron, runs every minute).
//
// SECURITY: admin email check (matches existing /api/admin/verify pattern).

import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────
// Admin emails (matches existing pattern in /api/admin/verify)
// ─────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { adminEmail, filterTechnology, filterBatch, notes } = body;

    // ───── 1. Auth: admin email check ─────
    if (!adminEmail) {
      return Response.json(
        { ok: false, error: 'adminEmail is required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(adminEmail).trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(cleanEmail)) {
      return Response.json(
        { ok: false, error: 'Unauthorized. Not an admin email.' },
        { status: 403 }
      );
    }

    // ───── 2. Check for existing running batch ─────
    const { data: existingRunning } = await supabase
      .from('review_runs')
      .select('id, started_at, status, total_teams, completed_teams, failed_teams')
      .in('status', ['queued', 'running'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRunning) {
      const startedAgo = Math.round(
        (Date.now() - new Date(existingRunning.started_at).getTime()) / 60000
      );
      return Response.json(
        {
          ok: false,
          error: `A batch is already running (started ${startedAgo} min ago). Wait for it to finish or cancel it first.`,
          existing_run: existingRunning,
        },
        { status: 409 }
      );
    }

    // ───── 3. Find all pending submissions to queue ─────
    let query = supabase
      .from('project_review_submissions')
      .select('id, team_number, technology, batch')
      .eq('status', 'pending');

    // Optional filters
    if (filterTechnology && typeof filterTechnology === 'string' && filterTechnology.trim()) {
      query = query.eq('technology', filterTechnology.trim());
    }
    if (filterBatch && typeof filterBatch === 'string' && filterBatch.trim()) {
      query = query.eq('batch', filterBatch.trim());
    }

    const { data: pendingSubmissions, error: fetchErr } = await query;

    if (fetchErr) {
      console.error('[run-batch] Fetch error:', fetchErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch pending submissions.' },
        { status: 500 }
      );
    }

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
      return Response.json(
        {
          ok: false,
          error: 'No pending submissions to review. Either no teams have submitted yet, or all submissions have already been reviewed.',
        },
        { status: 400 }
      );
    }

    const totalTeams = pendingSubmissions.length;

    // ───── 4. Create the review_runs record ─────
    const { data: newRun, error: runErr } = await supabase
      .from('review_runs')
      .insert({
        started_by_email: cleanEmail,
        status: 'queued',
        total_teams: totalTeams,
        completed_teams: 0,
        failed_teams: 0,
        in_progress_teams: 0,
        total_cost_usd: 0,
        notes: notes || null,
        filter_technology: filterTechnology || null,
        filter_batch: filterBatch || null,
        // Estimate: ~30 sec per team / 3 in parallel = ~10 sec/team avg
        estimated_completion_at: new Date(Date.now() + totalTeams * 10 * 1000).toISOString(),
      })
      .select('id, started_at, total_teams, status')
      .single();

    if (runErr || !newRun) {
      console.error('[run-batch] Failed to create run:', runErr);
      return Response.json(
        { ok: false, error: 'Failed to create batch run record.' },
        { status: 500 }
      );
    }

    const runId = newRun.id;

    // ───── 5. Mark all pending submissions as 'queued' + link to this run ─────
    const submissionIds = pendingSubmissions.map((s) => s.id);

    const { error: updateErr } = await supabase
      .from('project_review_submissions')
      .update({
        status: 'queued',
        current_run_id: runId,
        retry_count: 0,
        failure_reason: null,
        reviewing_started_at: null,
      })
      .in('id', submissionIds);

    if (updateErr) {
      console.error('[run-batch] Failed to queue submissions:', updateErr);
      // Try to clean up the run record we just created
      await supabase
        .from('review_runs')
        .update({ status: 'error', finished_at: new Date().toISOString() })
        .eq('id', runId);
      return Response.json(
        { ok: false, error: 'Failed to queue submissions for review.' },
        { status: 500 }
      );
    }

    // ───── 6. Success ─────
    return Response.json({
      ok: true,
      message: `Queued ${totalTeams} team${totalTeams === 1 ? '' : 's'} for AI review. Processing will start within 1 minute.`,
      run: {
        id: runId,
        status: 'queued',
        started_at: newRun.started_at,
        total_teams: totalTeams,
        estimated_completion_at: new Date(Date.now() + totalTeams * 10 * 1000).toISOString(),
      },
      filter_applied: {
        technology: filterTechnology || null,
        batch: filterBatch || null,
      },
    });
  } catch (err) {
    console.error('[run-batch] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GET handler — for admin to fetch current batch status
// (used by polling for live progress display)
// ─────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = (searchParams.get('adminEmail') || '').trim().toLowerCase();
    const runId = searchParams.get('runId');

    // Auth
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return Response.json(
        { ok: false, error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    // If runId specified, get that specific run
    // Otherwise, get the most recent run
    let query = supabase
      .from('review_runs')
      .select('*');

    if (runId) {
      query = query.eq('id', runId);
    } else {
      query = query.order('started_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[run-batch GET] error:', error);
      return Response.json(
        { ok: false, error: 'Failed to fetch run status.' },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { ok: true, run: null, message: 'No batch runs found yet.' }
      );
    }

    // Compute derived fields
    const totalProcessed = (data.completed_teams || 0) + (data.failed_teams || 0);
    const remaining = (data.total_teams || 0) - totalProcessed;
    const progressPct = data.total_teams > 0
      ? Math.round((totalProcessed / data.total_teams) * 100)
      : 0;

    let etaMinutes = null;
    if (data.status === 'running' && remaining > 0) {
      // Rough ETA: 10 sec per remaining team (3 parallel × 30s avg)
      etaMinutes = Math.round((remaining * 10) / 60);
    }

    return Response.json({
      ok: true,
      run: {
        ...data,
        progress_pct: progressPct,
        remaining,
        eta_minutes: etaMinutes,
      },
    });
  } catch (err) {
    console.error('[run-batch GET] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}