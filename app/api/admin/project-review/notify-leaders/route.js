// app/api/admin/project-review/notify-leaders/route.js
//
// Admin clicks "Notify All Leaders" → emails go out to all teams with reviewed projects.
// Synchronous — admin waits ~30-60s, sees real result.
// 5 emails in parallel for speed; uses existing lib/mailer.js fallback chain.
//
// SECURITY: admin email check (matches existing pattern).
// SAFETY: refuses to run twice within 5 minutes.

import { supabase } from '@/lib/supabase';
import { sendMail } from '@/lib/mailer';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://projectspace.technicalhub.io';

const PARALLEL_EMAILS = 5;
const RECENT_NOTIFY_THRESHOLD_MS = 5 * 60 * 1000; // 5 min cooldown

// In-memory cooldown tracker (resets on PM2 restart, but that's OK)
let lastNotifyTime = 0;

// ─────────────────────────────────────────────────────────────────
// Email template
// ─────────────────────────────────────────────────────────────────
function buildEmailHtml({ leaderName, teamNumber, projectTitle }) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  return `
<div style="font-family:'DM Sans',sans-serif;background:#050008;padding:40px;border-radius:12px;max-width:520px;margin:auto;color:#fff">
  <h2 style="color:#fd1c00;margin:0 0 4px;font-size:20px;letter-spacing:2px">PROJECT SPACE</h2>
  <p style="color:#888;margin:0 0 28px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">AI Project Review</p>

  <p style="color:#fff;font-size:15px;margin:0 0 12px">
    Hi <strong>${escapeHtml(leaderName || 'Team Leader')}</strong>,
  </p>

  <p style="color:#ddd;font-size:14px;line-height:1.6;margin:0 0 24px">
    Your AI project review for <strong style="color:#EEA727">${escapeHtml(projectTitle || teamNumber)}</strong> is now ready!
  </p>

  <div style="background:linear-gradient(135deg,rgba(253,28,0,0.08),rgba(238,167,39,0.08));border:1px solid rgba(253,28,0,0.25);border-radius:10px;padding:20px;margin:0 0 24px">
    <p style="color:#fff;font-size:13px;margin:0 0 4px">Team:</p>
    <p style="color:#EEA727;font-size:18px;font-weight:600;margin:0">${escapeHtml(teamNumber)}</p>
  </div>

  <a href="${dashboardUrl}" style="display:inline-block;background:#fd1c00;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.5px">View Your Review →</a>

  <p style="color:#666;font-size:12px;margin:28px 0 0;line-height:1.6">
    Login to your Project Space dashboard to view your full AI review including score, suggestions, and insights to improve your project.
  </p>

  <hr style="border:none;border-top:1px solid #222;margin:32px 0 16px"/>

  <p style="color:#444;font-size:10px;margin:0;line-height:1.5">
    Project Space · Aditya University · May 2026<br/>
    This is an automated message. Reply to thubprojectspace@gmail.com if you need help.
  </p>
</div>
  `.trim();
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─────────────────────────────────────────────────────────────────
// Send a batch of N emails in parallel
// ─────────────────────────────────────────────────────────────────
async function sendOneEmail({ teamNumber, projectTitle, leaderEmail, leaderName }) {
  try {
    if (!leaderEmail) {
      return {
        ok: false,
        teamNumber,
        leaderEmail: null,
        error: 'No email address found for leader',
      };
    }

    const html = buildEmailHtml({ leaderName, teamNumber, projectTitle });
    await sendMail({
      from: `"Project Space" <${process.env.GMAIL_USER}>`,
      to: leaderEmail,
      subject: `Your AI Project Review is Ready — ${teamNumber}`,
      html,
    });

    return { ok: true, teamNumber, leaderEmail };
  } catch (err) {
    return {
      ok: false,
      teamNumber,
      leaderEmail,
      error: err.message?.slice(0, 200) || 'Unknown email error',
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = String(body.adminEmail || '').trim().toLowerCase();

    // ───── 1. Auth ─────
    if (!adminEmail) {
      return Response.json(
        { ok: false, error: 'adminEmail required' },
        { status: 400 }
      );
    }
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return Response.json(
        { ok: false, error: 'Unauthorized. Not an admin email.' },
        { status: 403 }
      );
    }

    // ───── 2. Cooldown check (prevents accidental double-click) ─────
    const sinceLastMs = Date.now() - lastNotifyTime;
    if (lastNotifyTime > 0 && sinceLastMs < RECENT_NOTIFY_THRESHOLD_MS) {
      const cooldownLeft = Math.ceil(
        (RECENT_NOTIFY_THRESHOLD_MS - sinceLastMs) / 1000
      );
      return Response.json(
        {
          ok: false,
          error: `Notification was just sent (${Math.round(sinceLastMs / 1000)}s ago). Wait ${cooldownLeft}s before sending again.`,
          cooldown_seconds: cooldownLeft,
        },
        { status: 429 }
      );
    }

    // ───── 3. Fetch all reviewed teams ─────
    const { data: submissions, error: subErr } = await supabase
      .from('project_review_submissions')
      .select('team_number, name')
      .eq('status', 'reviewed');

    if (subErr) {
      console.error('[notify-leaders] Submission fetch error:', subErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch reviewed submissions.' },
        { status: 500 }
      );
    }

    if (!submissions || submissions.length === 0) {
      return Response.json(
        {
          ok: false,
          error: 'No reviewed teams to notify. Run the review batch first.',
        },
        { status: 400 }
      );
    }

    // ───── 4. Fetch teams to get leader_roll ─────
    const teamNumbers = submissions.map((s) => s.team_number);
    const { data: teams, error: teamErr } = await supabase
      .from('teams')
      .select('team_number, leader_roll')
      .in('team_number', teamNumbers);

    if (teamErr) {
      console.error('[notify-leaders] Team fetch error:', teamErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch team data.' },
        { status: 500 }
      );
    }

    const teamLeaderMap = {};
    for (const t of teams || []) {
      teamLeaderMap[t.team_number] = t.leader_roll;
    }

    // ───── 5. Fetch leader emails ─────
    const leaderRolls = Object.values(teamLeaderMap).filter(Boolean);
    const { data: students, error: studErr } = await supabase
      .from('students')
      .select('roll_number, name, email')
      .in('roll_number', leaderRolls);

    if (studErr) {
      console.error('[notify-leaders] Student fetch error:', studErr);
      return Response.json(
        { ok: false, error: 'Failed to fetch leader email addresses.' },
        { status: 500 }
      );
    }

    const studentMap = {};
    for (const s of students || []) {
      studentMap[s.roll_number] = { email: s.email, name: s.name };
    }

    // ───── 6. Build the email queue ─────
    const emailQueue = submissions
      .map((sub) => {
        const leaderRoll = teamLeaderMap[sub.team_number];
        const student = studentMap[leaderRoll];
        return {
          teamNumber: sub.team_number,
          projectTitle: sub.name,
          leaderRoll,
          leaderEmail: student?.email || null,
          leaderName: student?.name || null,
        };
      })
      .filter((q) => {
        // Skip teams without email — log them in result but don't block
        return true; // include all; sendOneEmail handles missing email
      });

    console.log(
      `[notify-leaders] Starting batch — ${emailQueue.length} emails, ${PARALLEL_EMAILS} in parallel`
    );

    // Mark the time NOW (before processing) to prevent any concurrent run
    lastNotifyTime = Date.now();

    // ───── 7. Send emails in parallel batches ─────
    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < emailQueue.length; i += PARALLEL_EMAILS) {
      const batch = emailQueue.slice(i, i + PARALLEL_EMAILS);
      const batchResults = await Promise.all(batch.map(sendOneEmail));
      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;

    // ───── 8. Compute summary ─────
    const sent = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);

    console.log(
      `[notify-leaders] Done in ${(duration / 1000).toFixed(1)}s — ${sent.length} sent, ${failed.length} failed`
    );

    return Response.json({
      ok: true,
      message: `Sent ${sent.length} email${sent.length === 1 ? '' : 's'} (${failed.length} failed) in ${(duration / 1000).toFixed(1)}s.`,
      summary: {
        total: emailQueue.length,
        sent: sent.length,
        failed: failed.length,
        duration_seconds: Math.round(duration / 1000),
      },
      failures:
        failed.length > 0
          ? failed.map((f) => ({
              team_number: f.teamNumber,
              email: f.leaderEmail,
              reason: f.error,
            }))
          : [],
    });
  } catch (err) {
    console.error('[notify-leaders] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error. Check logs.' },
      { status: 500 }
    );
  }
}