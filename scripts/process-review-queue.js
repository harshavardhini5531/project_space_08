#!/usr/bin/env node
// scripts/process-review-queue.js
//
// Cron worker that processes queued project reviews.
// Runs every minute via cron. Picks up to 3 queued submissions,
// runs AI review on each, saves report.
//
// Setup cron:
//   * * * * * cd /var/www/project_space_08 && node scripts/process-review-queue.js >> /var/log/review-queue.log 2>&1
//
// Safe to run multiple times. Uses file lock to prevent overlap.
// Independent of Next.js — survives PM2 restarts.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ─────────────────────────────────────────────────────────────────
// Setup paths and load env
// ─────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load .env.local
import { config } from 'dotenv';
config({ path: join(PROJECT_ROOT, '.env.local') });

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────
const CONCURRENCY = 3;                              // process 3 in parallel
const MAX_RUN_TIME_MS = 4 * 60 * 1000;              // 4 min hard cap (cron runs every 1 min)
const PER_TEAM_TIMEOUT_MS = 90 * 1000;              // 90s per team
const LOCK_FILE = '/tmp/project-review-queue.lock';
const LOCK_STALE_MS = 10 * 60 * 1000;               // 10 min — lock older than this is stale

// ─────────────────────────────────────────────────────────────────
// Logging helpers
// ─────────────────────────────────────────────────────────────────
function log(level, msg, extra) {
  const ts = new Date().toISOString();
  const extras = extra ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[${ts}] [${level}] ${msg}${extras}`);
}
const info = (m, e) => log('INFO', m, e);
const warn = (m, e) => log('WARN', m, e);
const error = (m, e) => log('ERROR', m, e);

// ─────────────────────────────────────────────────────────────────
// File lock — ensures only one worker runs at a time
// ─────────────────────────────────────────────────────────────────
function acquireLock() {
  if (existsSync(LOCK_FILE)) {
    const age = Date.now() - statSync(LOCK_FILE).mtimeMs;
    if (age < LOCK_STALE_MS) {
      info(`Another worker is running (lock ${Math.round(age / 1000)}s old). Exiting.`);
      return false;
    }
    warn(`Stale lock found (${Math.round(age / 1000)}s old). Removing.`);
    try { unlinkSync(LOCK_FILE); } catch {}
  }
  try {
    writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
    return true;
  } catch (e) {
    warn('Failed to acquire lock (race condition):', e.message);
    return false;
  }
}

function releaseLock() {
  try {
    if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE);
  } catch {}
}

// ─────────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────────────────────────────
// Inline copies of lib functions (since this is a CLI script,
// importing from lib/ requires path resolution — easier to copy)
// In production, consider refactoring to share modules.
// ─────────────────────────────────────────────────────────────────

// Import the lib functions
async function importLibs() {
  const githubFetch = await import(join(PROJECT_ROOT, 'lib/github-fetch.js'));
  const claudeReview = await import(join(PROJECT_ROOT, 'lib/claude-review.js'));
  return { githubFetch, claudeReview };
}

// ─────────────────────────────────────────────────────────────────
// Process a single submission
// ─────────────────────────────────────────────────────────────────
async function processSubmission(submission, libs) {
  const startTime = Date.now();
  const { fetchRepoFiles } = libs.githubFetch;
  const { reviewProject } = libs.claudeReview;

  info(`[${submission.team_number}] Starting review`);

  try {
    // 1. Mark as reviewing
    const { error: markErr } = await supabase
      .from('project_review_submissions')
      .update({
        status: 'reviewing',
        reviewing_started_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
      .eq('status', 'queued'); // optimistic concurrency — only update if still queued

    if (markErr) {
      error(`[${submission.team_number}] Failed to mark as reviewing:`, markErr.message);
      return { ok: false, error: markErr.message };
    }

    // 2. Update review_runs counter — increment in_progress
    if (submission.current_run_id) {
      await supabase.rpc('increment_in_progress', { run_id: submission.current_run_id })
        .catch(() => {
          // RPC might not exist — fall back to manual update
          return supabase
            .from('review_runs')
            .select('in_progress_teams')
            .eq('id', submission.current_run_id)
            .single()
            .then(({ data }) => {
              if (data) {
                return supabase
                  .from('review_runs')
                  .update({
                    in_progress_teams: (data.in_progress_teams || 0) + 1,
                    current_team_number: submission.team_number,
                    status: 'running',
                  })
                  .eq('id', submission.current_run_id);
              }
            });
        });
    }

    // 3. Fetch GitHub files (with timeout)
    info(`[${submission.team_number}] Fetching GitHub repo`);
    const fetchResult = await fetchRepoFiles(submission.github_url);

    if (!fetchResult.ok) {
      throw new Error(`GitHub fetch failed: ${fetchResult.error}`);
    }

    info(
      `[${submission.team_number}] Fetched ${fetchResult.files.length} files (${fetchResult.stats.approx_tokens} tokens)`
    );

    // 4. Call Claude
    info(`[${submission.team_number}] Calling Claude`);
    const reviewResult = await reviewProject({
      submission,
      files: fetchResult.files,
      repoMeta: fetchResult.repoMeta,
    });

    if (!reviewResult.ok) {
      // Special handling for cost cap
      if (reviewResult.cost_capped) {
        throw new Error(`COST_CAP: ${reviewResult.error}`);
      }
      throw new Error(reviewResult.error || 'Claude review failed');
    }

    info(
      `[${submission.team_number}] Review complete — score ${reviewResult.report.score_overall}, cost $${reviewResult.usage.cost_usd.toFixed(4)}`
    );

    // 5. Insert report
    const { data: reportRow, error: reportErr } = await supabase
      .from('project_review_reports')
      .insert({
        submission_id: submission.id,
        team_number: submission.team_number,
        technology: submission.technology,
        ai_model: reviewResult.usage.model,
        ai_input_tokens: reviewResult.usage.input_tokens,
        ai_output_tokens: reviewResult.usage.output_tokens,
        ai_cost_usd: reviewResult.usage.cost_usd,
        review_completed_at: new Date().toISOString(),
        duration_ms: reviewResult.usage.duration_ms,
        score_overall: reviewResult.report.score_overall,
        score_breakdown: reviewResult.report.score_breakdown,
        positives: reviewResult.report.positives,
        bugs: reviewResult.report.bugs,
        improvements: reviewResult.report.improvements,
        summary: reviewResult.report.summary,
        tech_stack_validation: reviewResult.report.tech_stack_validation || null,
        raw_response: reviewResult.raw_response,
        status: 'completed',
      })
      .select('id')
      .single();

    if (reportErr) {
      error(`[${submission.team_number}] Failed to save report:`, reportErr.message);
      throw new Error(`DB save failed: ${reportErr.message}`);
    }

    // 6. Mark submission as reviewed
    await supabase
      .from('project_review_submissions')
      .update({
        status: 'reviewed',
        reviewed_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq('id', submission.id);

    // 7. Update run counters
    if (submission.current_run_id) {
      const { data: runData } = await supabase
        .from('review_runs')
        .select('completed_teams, in_progress_teams, total_cost_usd')
        .eq('id', submission.current_run_id)
        .single();
      if (runData) {
        await supabase
          .from('review_runs')
          .update({
            completed_teams: (runData.completed_teams || 0) + 1,
            in_progress_teams: Math.max(0, (runData.in_progress_teams || 0) - 1),
            total_cost_usd: parseFloat(runData.total_cost_usd || 0) + reviewResult.usage.cost_usd,
          })
          .eq('id', submission.current_run_id);
      }
    }

    const duration = Date.now() - startTime;
    info(`[${submission.team_number}] DONE in ${(duration / 1000).toFixed(1)}s, report id ${reportRow.id}`);

    return { ok: true, reportId: reportRow.id };
  } catch (err) {
    const errorMsg = err?.message || String(err);
    error(`[${submission.team_number}] FAILED:`, errorMsg);

    // Increment retry count
    const { data: currentSub } = await supabase
      .from('project_review_submissions')
      .select('retry_count, max_retries')
      .eq('id', submission.id)
      .single();

    const retryCount = (currentSub?.retry_count || 0) + 1;
    const maxRetries = currentSub?.max_retries || 3;

    if (retryCount < maxRetries && !errorMsg.startsWith('COST_CAP:')) {
      // Re-queue for retry
      await supabase
        .from('project_review_submissions')
        .update({
          status: 'queued',
          retry_count: retryCount,
          failure_reason: errorMsg.slice(0, 500),
        })
        .eq('id', submission.id);
      info(`[${submission.team_number}] Re-queued for retry (${retryCount}/${maxRetries})`);
    } else {
      // Mark as failed permanently
      await supabase
        .from('project_review_submissions')
        .update({
          status: 'failed',
          retry_count: retryCount,
          failure_reason: errorMsg.slice(0, 500),
        })
        .eq('id', submission.id);

      // Update run counters
      if (submission.current_run_id) {
        const { data: runData } = await supabase
          .from('review_runs')
          .select('failed_teams, in_progress_teams')
          .eq('id', submission.current_run_id)
          .single();
        if (runData) {
          await supabase
            .from('review_runs')
            .update({
              failed_teams: (runData.failed_teams || 0) + 1,
              in_progress_teams: Math.max(0, (runData.in_progress_teams || 0) - 1),
            })
            .eq('id', submission.current_run_id);
        }
      }
    }

    return { ok: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────
// Process a batch of submissions in parallel
// ─────────────────────────────────────────────────────────────────
async function processBatch(submissions, libs) {
  const results = await Promise.allSettled(
    submissions.map((s) => {
      // Wrap each in its own timeout
      return Promise.race([
        processSubmission(s, libs),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${PER_TEAM_TIMEOUT_MS}ms`)),
            PER_TEAM_TIMEOUT_MS
          )
        ),
      ]).catch((err) => {
        error(`[${s.team_number}] Wrapper error:`, err.message);
        return { ok: false, error: err.message };
      });
    })
  );

  return results.map((r, i) => ({
    teamNumber: submissions[i].team_number,
    ...(r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message }),
  }));
}

// ─────────────────────────────────────────────────────────────────
// Mark completed runs
// ─────────────────────────────────────────────────────────────────
async function markCompletedRuns() {
  // Find runs with no remaining queued/reviewing submissions
  const { data: activeRuns } = await supabase
    .from('review_runs')
    .select('id, total_teams, completed_teams, failed_teams')
    .in('status', ['queued', 'running']);

  if (!activeRuns || activeRuns.length === 0) return;

  for (const run of activeRuns) {
    const { count: pendingCount } = await supabase
      .from('project_review_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('current_run_id', run.id)
      .in('status', ['queued', 'reviewing']);

    if (pendingCount === 0) {
      // All done
      await supabase
        .from('review_runs')
        .update({
          status: 'complete',
          finished_at: new Date().toISOString(),
          in_progress_teams: 0,
          duration_seconds: null, // could calc from started_at if needed
        })
        .eq('id', run.id);
      info(`Run #${run.id} marked complete (${run.completed_teams} success, ${run.failed_teams} failed)`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN ENTRY
// ─────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  info('Worker started');

  // Acquire lock
  if (!acquireLock()) {
    process.exit(0);
  }

  try {
    // Load lib modules
    const libs = await importLibs();

    // Mark any stale 'reviewing' submissions back to 'queued'
    // (handles case where previous worker died mid-process)
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from('project_review_submissions')
      .update({ status: 'queued' })
      .eq('status', 'reviewing')
      .lt('reviewing_started_at', staleThreshold)
      .select('id, team_number');

    if (stale && stale.length > 0) {
      warn(`Reset ${stale.length} stale 'reviewing' submissions back to 'queued'`);
    }

    // Main processing loop
    let totalProcessed = 0;
    let totalFailed = 0;

    while (Date.now() - startTime < MAX_RUN_TIME_MS) {
      // Pick up to CONCURRENCY queued submissions
      const { data: queued, error: fetchErr } = await supabase
        .from('project_review_submissions')
        .select(
          'id, team_number, technology, batch, github_url, name, description, requirements, problem_statement, proposed_solution, technologies_used, system_architecture, in_scope, out_scope, future_enhancements, conclusion, project_type, current_run_id, retry_count'
        )
        .eq('status', 'queued')
        .order('submitted_at', { ascending: true })
        .limit(CONCURRENCY);

      if (fetchErr) {
        error('Fetch queued failed:', fetchErr.message);
        break;
      }

      if (!queued || queued.length === 0) {
        info('No queued submissions. Done.');
        break;
      }

      info(`Processing batch of ${queued.length}`);
      const results = await processBatch(queued, libs);

      for (const r of results) {
        if (r.ok) totalProcessed++;
        else totalFailed++;
      }
    }

    // Mark any completed runs
    await markCompletedRuns();

    const duration = (Date.now() - startTime) / 1000;
    info(`Worker finished — processed ${totalProcessed} OK, ${totalFailed} failed in ${duration.toFixed(1)}s`);
  } catch (err) {
    error('Worker crashed:', err.message);
    error(err.stack);
    process.exitCode = 1;
  } finally {
    releaseLock();
  }
}

// Run
main().catch((err) => {
  error('Top-level crash:', err.message);
  releaseLock();
  process.exit(1);
});