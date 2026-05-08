// lib/claude-review.js
// Wraps Claude API for project review.
// Uses rubrics from project-rubrics.js. Tracks cost. Enforces daily cap.
//
// Usage:
//   import { reviewProject } from '@/lib/claude-review';
//   const result = await reviewProject({ submission, files, repoMeta });
//   if (!result.ok) handleError(result.error);
//   else saveReport(result.report);

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import {
  getProjectType,
  getRubric,
  fillPromptTemplate,
  formatFilesForPrompt,
} from '@/lib/project-rubrics';

// ─────────────────────────────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────────────────────────────

// Use isolated key for this feature
const API_KEY = process.env.PROJECT_REVIEW_ANTHROPIC_KEY;

// Model selection — Sonnet for quality, fall back to Haiku on failure
const PRIMARY_MODEL = 'claude-sonnet-4-5-20250929';
const FALLBACK_MODEL = 'claude-haiku-4-5-20251001';

// Cost per 1M tokens (approx)
const MODEL_PRICING = {
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
};

// Hard daily cost cap (USD)
const DAILY_COST_CAP_USD = 30;

// Per-call timeout
const CALL_TIMEOUT_MS = 90_000; // 90 sec max per review

// Max retries
const MAX_RATE_LIMIT_RETRIES = 3;
const MAX_PARSE_RETRIES = 1;

// Max output tokens (review reports are bounded)
const MAX_OUTPUT_TOKENS = 4000;

// ─────────────────────────────────────────────────────────────────
// 2. INITIALIZE CLIENT
// ─────────────────────────────────────────────────────────────────

let _client = null;
function getClient() {
  if (!API_KEY) {
    throw new Error('PROJECT_REVIEW_ANTHROPIC_KEY env variable not set');
  }
  if (!_client) {
    _client = new Anthropic({
      apiKey: API_KEY,
      timeout: CALL_TIMEOUT_MS,
      maxRetries: 0, // we handle retries ourselves
    });
  }
  return _client;
}

// ─────────────────────────────────────────────────────────────────
// 3. COST TRACKING
// ─────────────────────────────────────────────────────────────────

/**
 * Get today's cost from the tracker table.
 * Returns 0 if no row exists yet.
 */
async function getTodaysCost() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data } = await supabase
    .from('project_review_cost_tracker')
    .select('total_cost_usd, total_reviews, total_failures')
    .eq('date', today)
    .maybeSingle();
  return {
    cost: parseFloat(data?.total_cost_usd || 0),
    reviews: data?.total_reviews || 0,
    failures: data?.total_failures || 0,
  };
}

/**
 * Add to today's cost atomically.
 * Uses upsert + the increment pattern.
 */
async function recordCost({ costUsd, isFailure = false }) {
  const today = new Date().toISOString().split('T')[0];
  // Upsert with values; if exists we'll then update
  // Postgres-friendly: read-modify-write, but with optimistic conflict tolerance
  const { data: existing } = await supabase
    .from('project_review_cost_tracker')
    .select('total_cost_usd, total_reviews, total_failures')
    .eq('date', today)
    .maybeSingle();

  const newCost = parseFloat(existing?.total_cost_usd || 0) + costUsd;
  const newReviews = (existing?.total_reviews || 0) + 1;
  const newFailures = (existing?.total_failures || 0) + (isFailure ? 1 : 0);

  await supabase.from('project_review_cost_tracker').upsert(
    {
      date: today,
      total_cost_usd: newCost,
      total_reviews: newReviews,
      total_failures: newFailures,
    },
    { onConflict: 'date' }
  );
}

/**
 * Calculate cost for a Claude response.
 */
function calcCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[PRIMARY_MODEL];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

// ─────────────────────────────────────────────────────────────────
// 4. JSON EXTRACTION + VALIDATION
// ─────────────────────────────────────────────────────────────────

/**
 * Extract JSON from Claude's response.
 * Handles cases where Claude wraps it in ```json code blocks.
 */
function extractJson(text) {
  if (!text) return null;
  let cleaned = text.trim();

  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Find first { and last } and try parsing that
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

/**
 * Validate the report has required fields.
 */
function validateReport(report) {
  if (!report || typeof report !== 'object') return 'not an object';
  if (typeof report.score_overall !== 'number') return 'score_overall missing or not number';
  if (report.score_overall < 0 || report.score_overall > 100) return 'score_overall out of range';
  if (typeof report.score_breakdown !== 'object') return 'score_breakdown missing';
  if (!Array.isArray(report.positives)) return 'positives not array';
  if (!Array.isArray(report.bugs)) return 'bugs not array';
  if (!Array.isArray(report.improvements)) return 'improvements not array';
  if (typeof report.summary !== 'string') return 'summary missing';
  return null; // valid
}

// ─────────────────────────────────────────────────────────────────
// 5. CLAUDE API CALL WITH RATE-LIMIT RETRY
// ─────────────────────────────────────────────────────────────────

async function callClaude({ model, systemPrompt, userPrompt }) {
  const client = getClient();
  let lastError;

  for (let attempt = 0; attempt < MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract text from response
      const textBlock = response.content.find((b) => b.type === 'text');
      const text = textBlock?.text || '';

      return {
        ok: true,
        text,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
        model,
        stop_reason: response.stop_reason,
      };
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      // 429 = rate limit, 529 = overloaded — retry with backoff
      if ((status === 429 || status === 529) && attempt < MAX_RATE_LIMIT_RETRIES - 1) {
        const backoff = Math.min(2000 * Math.pow(2, attempt), 30_000);
        console.warn(`[claude-review] Rate limited (${status}), retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      // Other errors — bail immediately
      break;
    }
  }

  return {
    ok: false,
    error: lastError?.message || 'Unknown Claude API error',
    status: lastError?.status,
  };
}

// ─────────────────────────────────────────────────────────────────
// 6. MAIN PUBLIC FUNCTION
// ─────────────────────────────────────────────────────────────────

/**
 * Review a project using Claude.
 *
 * @param {object} params
 * @param {object} params.submission - row from project_review_submissions
 * @param {Array} params.files - from fetchRepoFiles().files
 * @param {object} params.repoMeta - from fetchRepoFiles().repoMeta
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   error?: string,
 *   report?: object,
 *   usage?: { model, input_tokens, output_tokens, cost_usd, duration_ms }
 * }>}
 */
export async function reviewProject({ submission, files, repoMeta }) {
  const startTime = Date.now();

  // 1. Validate inputs
  if (!submission) return { ok: false, error: 'submission is required' };
  if (!files || files.length === 0) return { ok: false, error: 'no files to review' };

  // 2. Check daily cost cap
  try {
    const today = await getTodaysCost();
    if (today.cost >= DAILY_COST_CAP_USD) {
      return {
        ok: false,
        error: `Daily cost cap reached ($${today.cost.toFixed(2)} of $${DAILY_COST_CAP_USD}). Try again tomorrow or contact admin to raise cap.`,
        cost_capped: true,
      };
    }
  } catch (e) {
    // If cost tracker query fails, log but continue (don't block reviews on tracker failure)
    console.error('[claude-review] Cost check failed (continuing):', e.message);
  }

  // 3. Build prompts
  const projectType = getProjectType(submission.technology);
  const { systemPrompt, userPromptTemplate } = getRubric(projectType);

  // Format technologies_used (it's a JSONB array)
  let techList = '';
  try {
    const arr = Array.isArray(submission.technologies_used)
      ? submission.technologies_used
      : JSON.parse(submission.technologies_used || '[]');
    techList = arr.join(', ');
  } catch {
    techList = String(submission.technologies_used || '');
  }

  const userPrompt = fillPromptTemplate(userPromptTemplate, {
    name: submission.name,
    description: submission.description,
    problem_statement: submission.problem_statement,
    proposed_solution: submission.proposed_solution,
    technologies_used: techList,
    system_architecture: submission.system_architecture,
    in_scope: submission.in_scope,
    out_scope: submission.out_scope,
    future_enhancements: submission.future_enhancements,
    repo_full_name: repoMeta?.full_name || `${repoMeta?.owner}/${repoMeta?.name}`,
    stars: repoMeta?.stars || 0,
    language: repoMeta?.language || 'unknown',
    pushed_at: repoMeta?.pushed_at || 'unknown',
    file_count: files.length,
    approx_tokens: Math.ceil(formatFilesForPrompt(files).length / 4),
    files_concatenated: formatFilesForPrompt(files),
  });

  // 4. Call Claude — try primary, fall back if hard failure
  let result = await callClaude({
    model: PRIMARY_MODEL,
    systemPrompt,
    userPrompt,
  });

  if (!result.ok) {
    console.error(`[claude-review] Primary model failed: ${result.error}`);
    // Try fallback model
    result = await callClaude({
      model: FALLBACK_MODEL,
      systemPrompt,
      userPrompt,
    });
    if (!result.ok) {
      await recordCost({ costUsd: 0, isFailure: true }).catch(() => {});
      return { ok: false, error: `Both models failed: ${result.error}` };
    }
  }

  // 5. Parse + validate JSON response
  let report = extractJson(result.text);
  let parseError = report ? validateReport(report) : 'JSON parse failed';

  // Retry once with explicit reminder if invalid
  if (parseError && MAX_PARSE_RETRIES > 0) {
    console.warn(`[claude-review] Response invalid (${parseError}), retrying with reminder`);
    const retryPrompt =
      userPrompt +
      `\n\nIMPORTANT: Your previous response was invalid (${parseError}). Respond ONLY with valid JSON matching the schema. No markdown, no extra text.`;
    const retry = await callClaude({
      model: result.model,
      systemPrompt,
      userPrompt: retryPrompt,
    });
    if (retry.ok) {
      const retryReport = extractJson(retry.text);
      const retryError = retryReport ? validateReport(retryReport) : 'JSON parse failed';
      if (!retryError) {
        report = retryReport;
        parseError = null;
        // Combine usage
        result.usage.input_tokens += retry.usage.input_tokens;
        result.usage.output_tokens += retry.usage.output_tokens;
      }
    }
  }

  // 6. Calculate cost
  const costUsd = calcCost(result.model, result.usage.input_tokens, result.usage.output_tokens);

  // 7. Record cost (always, even on failure — tokens were spent)
  try {
    await recordCost({ costUsd, isFailure: !!parseError });
  } catch (e) {
    console.error('[claude-review] Failed to record cost:', e.message);
  }

  // 8. Final result
  if (parseError) {
    return {
      ok: false,
      error: `Response invalid after retry: ${parseError}`,
      raw_response: result.text,
      usage: {
        model: result.model,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        cost_usd: costUsd,
        duration_ms: Date.now() - startTime,
      },
    };
  }

  return {
    ok: true,
    report,
    raw_response: result.text,
    usage: {
      model: result.model,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      cost_usd: costUsd,
      duration_ms: Date.now() - startTime,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// 7. UTILITY: Get cost summary for admin dashboard
// ─────────────────────────────────────────────────────────────────

/**
 * Get cost summary for today + last 7 days.
 * Used by admin UI to show spending.
 */
export async function getCostSummary() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data } = await supabase
    .from('project_review_cost_tracker')
    .select('*')
    .gte('date', sevenDaysAgo)
    .order('date', { ascending: false });

  const todayRow = (data || []).find((r) => r.date === today);
  const totalCost = (data || []).reduce((sum, r) => sum + parseFloat(r.total_cost_usd || 0), 0);
  const totalReviews = (data || []).reduce((sum, r) => sum + (r.total_reviews || 0), 0);

  return {
    today: {
      cost_usd: parseFloat(todayRow?.total_cost_usd || 0),
      reviews: todayRow?.total_reviews || 0,
      failures: todayRow?.total_failures || 0,
      cap_usd: DAILY_COST_CAP_USD,
      cap_remaining_usd: Math.max(0, DAILY_COST_CAP_USD - parseFloat(todayRow?.total_cost_usd || 0)),
    },
    last_7_days: {
      cost_usd: totalCost,
      reviews: totalReviews,
      daily: data || [],
    },
    config: {
      primary_model: PRIMARY_MODEL,
      fallback_model: FALLBACK_MODEL,
      daily_cap_usd: DAILY_COST_CAP_USD,
    },
  };
}