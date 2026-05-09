// lib/dev-api-sync.js
//
// Handles syncing project review submissions to the developer's API at
// http://117.250.198.93:5010/api/projects
//
// Used by:
//   - app/api/project-review/submit/route.js (fire-and-forget on submit)
//   - scripts/dev-api-retry-queue.js (cron retry for failures)
//
// Fixes in this version (Phase 6.6a):
//   - Inline Supabase client (no @/lib/supabase alias — works in Node + Next)
//   - projectType whitelist (maps fullstack/flutter/data → coding for compat)
//   - E11000 duplicate-key handling (treats as success, fetches existing _id)
//
// Safety:
//   - Never throws — always returns a result object
//   - 10-second timeout (won't hang)
//   - Updates Supabase with sync status (success or failure)
//   - Idempotent: skips submissions already synced

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────
const DEV_API_URL =
  process.env.DEV_API_URL || 'http://117.250.198.93:5010/api/projects';

const REQUEST_TIMEOUT_MS = 10_000; // 10s
const MAX_RETRIES = 3;

// Whitelist of projectType values dev's API currently accepts.
// Anything else gets mapped to 'coding'.
// TODO: When dev updates enum to support all types, change to:
//   ALLOWED_PROJECT_TYPES = ['coding','fullstack','flutter','aws','data','servicenow','vlsi']
const ALLOWED_PROJECT_TYPES = ['coding', 'aws', 'vlsi', 'servicenow'];

// ─────────────────────────────────────────────────────────────────
// Build payload in the format dev expects
// ─────────────────────────────────────────────────────────────────
function buildPayload(submission) {
  // Parse technologies_used (could be array or JSONB string)
  let techArr = [];
  if (Array.isArray(submission.technologies_used)) {
    techArr = submission.technologies_used;
  } else if (typeof submission.technologies_used === 'string') {
    try {
      techArr = JSON.parse(submission.technologies_used);
    } catch {
      techArr = [submission.technologies_used];
    }
  }

  // Map projectType: only send types dev's enum supports.
  const rawType = submission.project_type || 'coding';
  const projectType = ALLOWED_PROJECT_TYPES.includes(rawType) ? rawType : 'coding';

  return {
    name: submission.name || '',
    githubUrl: submission.github_url || '',
    description: submission.description || '',
    requirements: submission.requirements || '',
    projectType,
    problem_statement: submission.problem_statement || '',
    proposed_solution: submission.proposed_solution || '',
    technologies_used: techArr,
    system_architecture: submission.system_architecture || '',
    in_scope: submission.in_scope || '',
    out_scope: submission.out_scope || '',
    future_enhancements: submission.future_enhancements || '',
    conclusion: submission.conclusion || '',
  };
}

// ─────────────────────────────────────────────────────────────────
// HTTP POST with timeout
// ─────────────────────────────────────────────────────────────────
async function postToDevApi(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DEV_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    let body;
    try {
      body = await response.json();
    } catch {
      body = { raw: await response.text().catch(() => 'unparseable') };
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      return { ok: false, status: 0, error: 'Timeout (10s)' };
    }
    return {
      ok: false,
      status: 0,
      error: err.message || 'Network error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Lookup existing _id from dev API by GitHub URL
// (used when we hit duplicate key error — fetch what's already there)
// ─────────────────────────────────────────────────────────────────
async function lookupDevApiIdByUrl(githubUrl) {
  if (!githubUrl) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(DEV_API_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data?.data)) return null;

    // Normalize URL for matching
    const normalize = (u) => (u || '').toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
    const targetNorm = normalize(githubUrl);

    for (const project of data.data) {
      if (normalize(project.githubUrl) === targetNorm && project._id) {
        return project._id;
      }
    }
    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Main public function — sync ONE submission to dev API
// ─────────────────────────────────────────────────────────────────
/**
 * Syncs a single submission to the developer's API.
 *
 * @param {object} submission - row from project_review_submissions
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   skipped?: boolean,
 *   reason?: string,
 *   dev_api_id?: string,
 *   error?: string,
 *   status?: number,
 *   was_duplicate?: boolean
 * }>}
 */
export async function syncSubmissionToDevApi(submission) {
  // ───── 1. Validate ─────
  if (!submission?.id) {
    return { ok: false, error: 'submission.id is required' };
  }
  if (!submission.name || !submission.github_url) {
    return { ok: false, error: 'submission missing required fields' };
  }

  // ───── 2. Skip if already synced ─────
  if (submission.dev_api_synced_at && submission.dev_api_id) {
    return {
      ok: true,
      skipped: true,
      reason: 'already synced',
      dev_api_id: submission.dev_api_id,
    };
  }

  // ───── 3. Skip if max retries exhausted ─────
  if ((submission.dev_api_retry_count || 0) >= MAX_RETRIES) {
    return {
      ok: false,
      error: `Max retries (${MAX_RETRIES}) exhausted`,
      retries_exhausted: true,
    };
  }

  // ───── 4. Build payload ─────
  const payload = buildPayload(submission);

  // ───── 5. POST to dev API ─────
  const startTime = Date.now();
  console.log(`[dev-api-sync] Submitting ${submission.team_number} to dev API`);
  const result = await postToDevApi(payload);
  const duration = Date.now() - startTime;
  console.log(
    `[dev-api-sync] ${submission.team_number} - status ${result.status}, took ${duration}ms`
  );

  const now = new Date().toISOString();
  const newRetryCount = (submission.dev_api_retry_count || 0) + 1;

  // ───── 6. Process response: SUCCESS ─────
  if (result.ok && result.body?.success && result.body?.data?._id) {
    const devApiId = result.body.data._id;

    const { error: updateErr } = await supabase
      .from('project_review_submissions')
      .update({
        dev_api_id: devApiId,
        dev_api_synced_at: now,
        dev_api_last_attempt_at: now,
        dev_api_retry_count: newRetryCount,
        dev_api_sync_error: null,
      })
      .eq('id', submission.id);

    if (updateErr) {
      console.error(
        `[dev-api-sync] ${submission.team_number} - DB update failed after sync: ${updateErr.message}`
      );
      return {
        ok: true,
        dev_api_id: devApiId,
        warning: 'Synced to dev but failed to record in DB',
      };
    }

    return {
      ok: true,
      dev_api_id: devApiId,
      status: result.status,
    };
  }

  // ───── 7. Detect E11000 duplicate-key error ─────
  // Dev's MongoDB has unique index on githubUrl. If the project was already
  // inserted (e.g. via different flow or previous sync), we get this error.
  // Treat it as success and look up the existing _id.
  const errorText = JSON.stringify(result.body || {}) + (result.error || '');
  const isDuplicateError =
    errorText.includes('E11000') || errorText.includes('duplicate key');

  if (isDuplicateError) {
    console.log(
      `[dev-api-sync] ${submission.team_number} - duplicate detected, looking up existing _id`
    );
    const existingId = await lookupDevApiIdByUrl(submission.github_url);

    if (existingId) {
      const { error: updateErr } = await supabase
        .from('project_review_submissions')
        .update({
          dev_api_id: existingId,
          dev_api_synced_at: now,
          dev_api_last_attempt_at: now,
          dev_api_retry_count: newRetryCount,
          dev_api_sync_error: null,
        })
        .eq('id', submission.id);

      if (updateErr) {
        console.error(
          `[dev-api-sync] ${submission.team_number} - DB update failed: ${updateErr.message}`
        );
      }

      console.log(
        `[dev-api-sync] ${submission.team_number} - reconciled, dev_api_id=${existingId}`
      );

      return {
        ok: true,
        dev_api_id: existingId,
        was_duplicate: true,
        status: result.status,
      };
    }
    // Couldn't find the existing _id — fall through to FAILURE handling
    console.warn(
      `[dev-api-sync] ${submission.team_number} - duplicate but no _id found via lookup`
    );
  }

  // ───── 8. FAILURE — record error ─────
  let errorMsg;
  if (result.error) {
    errorMsg = result.error;
  } else if (result.body?.error || result.body?.message) {
    errorMsg = `${result.status}: ${result.body.error || result.body.message}`;
  } else {
    errorMsg = `HTTP ${result.status}: ${JSON.stringify(result.body || {}).slice(0, 200)}`;
  }
  errorMsg = errorMsg.slice(0, 500);

  const { error: updateErr } = await supabase
    .from('project_review_submissions')
    .update({
      dev_api_last_attempt_at: now,
      dev_api_retry_count: newRetryCount,
      dev_api_sync_error: errorMsg,
    })
    .eq('id', submission.id);

  if (updateErr) {
    console.error(
      `[dev-api-sync] ${submission.team_number} - DB update failed: ${updateErr.message}`
    );
  }

  console.warn(
    `[dev-api-sync] ${submission.team_number} - failed (attempt ${newRetryCount}/${MAX_RETRIES}): ${errorMsg}`
  );

  return {
    ok: false,
    error: errorMsg,
    status: result.status,
    retry_count: newRetryCount,
    will_retry: newRetryCount < MAX_RETRIES,
  };
}

// ─────────────────────────────────────────────────────────────────
// Helper: get submissions that need retry (used by retry cron)
// ─────────────────────────────────────────────────────────────────
export async function getPendingDevApiSync(limit = 50) {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('project_review_submissions')
    .select(
      'id, team_number, technology, batch, name, github_url, description, ' +
        'requirements, problem_statement, proposed_solution, technologies_used, ' +
        'system_architecture, in_scope, out_scope, future_enhancements, conclusion, ' +
        'project_type, dev_api_id, dev_api_synced_at, dev_api_retry_count, ' +
        'dev_api_last_attempt_at, dev_api_sync_error'
    )
    .is('dev_api_synced_at', null)
    .lt('dev_api_retry_count', MAX_RETRIES)
    .or(`dev_api_last_attempt_at.is.null,dev_api_last_attempt_at.lt.${fiveMinAgo}`)
    .order('dev_api_retry_count', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[dev-api-sync] getPendingDevApiSync error:', error);
    return [];
  }
  return data || [];
}

// ─────────────────────────────────────────────────────────────────
// Helper: get sync status summary (for admin dashboard)
// ─────────────────────────────────────────────────────────────────
export async function getDevApiSyncSummary() {
  const { count: totalSubmissions } = await supabase
    .from('project_review_submissions')
    .select('*', { count: 'exact', head: true });

  const { count: syncedCount } = await supabase
    .from('project_review_submissions')
    .select('*', { count: 'exact', head: true })
    .not('dev_api_synced_at', 'is', null);

  const { count: failedExhausted } = await supabase
    .from('project_review_submissions')
    .select('*', { count: 'exact', head: true })
    .is('dev_api_synced_at', null)
    .gte('dev_api_retry_count', MAX_RETRIES);

  const { count: pendingRetry } = await supabase
    .from('project_review_submissions')
    .select('*', { count: 'exact', head: true })
    .is('dev_api_synced_at', null)
    .lt('dev_api_retry_count', MAX_RETRIES);

  return {
    total: totalSubmissions || 0,
    synced: syncedCount || 0,
    pending_retry: pendingRetry || 0,
    failed_exhausted: failedExhausted || 0,
    sync_pct: totalSubmissions > 0 ? Math.round((syncedCount / totalSubmissions) * 100) : 0,
  };
}