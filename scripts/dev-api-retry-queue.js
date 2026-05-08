#!/usr/bin/env node
// scripts/dev-api-retry-queue.js
//
// Cron worker that retries failed dev API syncs.
// Runs every 10 minutes via cron.
//
// Setup cron:
//   */10 * * * * cd /var/www/project_space_08 && node scripts/dev-api-retry-queue.js >> /var/log/dev-api-retry.log 2>&1
//
// Safe to run multiple times — uses file lock.
// Exits cleanly if no work to do.

import { writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// ─────────────────────────────────────────────────────────────────
// Setup paths and load env
// ─────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

config({ path: join(PROJECT_ROOT, '.env.local') });

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────
const CONCURRENCY = 3;                              // 3 parallel retries
const BATCH_SIZE = 50;                              // max submissions per cron run
const MAX_RUN_TIME_MS = 8 * 60 * 1000;              // 8 min hard cap (cron runs every 10 min)
const LOCK_FILE = '/tmp/dev-api-retry-queue.lock';
const LOCK_STALE_MS = 15 * 60 * 1000;               // 15 min — lock older than this is stale

// ─────────────────────────────────────────────────────────────────
// Logging
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
// File lock — prevents overlapping cron runs
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
// Process N items in parallel
// ─────────────────────────────────────────────────────────────────
async function processInParallel(items, syncFn) {
  const results = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(batch.map((item) => syncFn(item)));
    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j];
      const item = batch[j];
      if (r.status === 'fulfilled') {
        results.push({ teamNumber: item.team_number, ...r.value });
      } else {
        results.push({
          teamNumber: item.team_number,
          ok: false,
          error: r.reason?.message || 'Unknown error',
        });
      }
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  info('Dev API retry worker started');

  // Acquire lock
  if (!acquireLock()) {
    process.exit(0);
  }

  try {
    // Dynamically import lib functions
    const { syncSubmissionToDevApi, getPendingDevApiSync } = await import(
      join(PROJECT_ROOT, 'lib/dev-api-sync.js')
    );

    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    // Process in batches until no more pending OR time cap reached
    while (Date.now() - startTime < MAX_RUN_TIME_MS) {
      const pending = await getPendingDevApiSync(BATCH_SIZE);

      if (!pending || pending.length === 0) {
        info('No pending dev API syncs. Done.');
        break;
      }

      info(`Processing ${pending.length} pending syncs (${CONCURRENCY} in parallel)`);

      const results = await processInParallel(pending, syncSubmissionToDevApi);

      for (const r of results) {
        totalProcessed++;
        if (r.ok) {
          totalSucceeded++;
          if (r.skipped) {
            info(`  ${r.teamNumber}: SKIPPED (${r.reason})`);
          } else {
            info(`  ${r.teamNumber}: SUCCESS — dev_api_id=${r.dev_api_id}`);
          }
        } else {
          totalFailed++;
          if (r.retries_exhausted) {
            warn(`  ${r.teamNumber}: EXHAUSTED retries`);
          } else {
            warn(`  ${r.teamNumber}: FAILED (will retry: ${r.will_retry}) - ${r.error}`);
          }
        }
      }

      // If batch was smaller than BATCH_SIZE, we're done
      if (pending.length < BATCH_SIZE) {
        info('Last batch was partial — no more work.');
        break;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    info(
      `Worker finished — processed ${totalProcessed} (${totalSucceeded} OK, ${totalFailed} failed) in ${duration}s`
    );
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