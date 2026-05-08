// app/api/admin/project-review/force-resubmit/route.js
//
// Admin clicks "Force Resubmit" on a team → unlocks the submission so leader can resubmit.
// SECURITY: admin email check (matches existing pattern).

import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || 'harshavardhini@technicalhub.io'
)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// ─────────────────────────────────────────────────────────────────
// POST — unlock submission for resubmit
// ─────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = String(body.adminEmail || '').trim().toLowerCase();
    const teamNumber = String(body.teamNumber || '').trim();
    const adminNotes = body.notes || null;

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

    if (!teamNumber) {
      return Response.json(
        { ok: false, error: 'teamNumber required' },
        { status: 400 }
      );
    }

    // ───── 2. Find current submission ─────
    const { data: submission, error: subErr } = await supabase
      .from('project_review_submissions')
      .select('id, team_number, status, admin_locked, submitted_at')
      .eq('team_number', teamNumber)
      .maybeSingle();

    if (subErr) {
      console.error('[force-resubmit] Submission fetch error:', subErr);
      return Response.json(
        { ok: false, error: 'Database error.' },
        { status: 500 }
      );
    }

    if (!submission) {
      return Response.json(
        {
          ok: false,
          error: `No submission found for team ${teamNumber}. Team has not submitted yet.`,
        },
        { status: 404 }
      );
    }

    // ───── 3. Already unlocked? ─────
    if (submission.admin_locked) {
      return Response.json(
        {
          ok: true,
          message: `Team ${teamNumber} is already unlocked for resubmission.`,
          submission: {
            id: submission.id,
            status: submission.status,
            admin_locked: true,
          },
          already_unlocked: true,
        }
      );
    }

    // ───── 4. Unlock the submission ─────
    const updatePayload = {
      admin_locked: true,
      admin_resubmitted_at: new Date().toISOString(),
      admin_notes: adminNotes ? String(adminNotes).slice(0, 1000) : null,
      // Reset processing state — leader's new submission will set fresh values
      status: 'pending',
      retry_count: 0,
      reviewing_started_at: null,
      reviewed_at: null,
      failure_reason: null,
      current_run_id: null,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('project_review_submissions')
      .update(updatePayload)
      .eq('id', submission.id)
      .select('id, team_number, status, admin_locked, admin_resubmitted_at')
      .single();

    if (updateErr) {
      console.error('[force-resubmit] Update error:', updateErr);
      return Response.json(
        { ok: false, error: 'Failed to unlock submission.' },
        { status: 500 }
      );
    }

    console.log(
      `[force-resubmit] Admin ${adminEmail} unlocked team ${teamNumber} (submission #${submission.id})`
    );

    return Response.json({
      ok: true,
      message: `Team ${teamNumber} unlocked. Leader can now resubmit fresh.`,
      submission: {
        id: updated.id,
        team_number: updated.team_number,
        status: updated.status,
        admin_locked: updated.admin_locked,
        admin_resubmitted_at: updated.admin_resubmitted_at,
      },
    });
  } catch (err) {
    console.error('[force-resubmit] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE — fully delete a submission and its reports (DANGEROUS)
// Only used if admin wants to completely remove a team's data
// ─────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = String(body.adminEmail || '').trim().toLowerCase();
    const teamNumber = String(body.teamNumber || '').trim();
    const confirmDelete = body.confirmDelete === true;

    // Auth
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return Response.json(
        { ok: false, error: 'Unauthorized.' },
        { status: 403 }
      );
    }

    if (!teamNumber) {
      return Response.json(
        { ok: false, error: 'teamNumber required' },
        { status: 400 }
      );
    }

    // Require explicit confirmation
    if (!confirmDelete) {
      return Response.json(
        {
          ok: false,
          error:
            'Delete is irreversible. Pass confirmDelete:true to proceed. This will remove ALL submission data and review reports for this team.',
        },
        { status: 400 }
      );
    }

    // Find submission
    const { data: submission } = await supabase
      .from('project_review_submissions')
      .select('id')
      .eq('team_number', teamNumber)
      .maybeSingle();

    if (!submission) {
      return Response.json(
        { ok: false, error: `No submission found for team ${teamNumber}.` },
        { status: 404 }
      );
    }

    // Delete submission (CASCADE will delete linked reports)
    const { error: deleteErr } = await supabase
      .from('project_review_submissions')
      .delete()
      .eq('id', submission.id);

    if (deleteErr) {
      console.error('[force-resubmit DELETE] Delete error:', deleteErr);
      return Response.json(
        { ok: false, error: 'Failed to delete submission.' },
        { status: 500 }
      );
    }

    console.log(
      `[force-resubmit DELETE] Admin ${adminEmail} deleted team ${teamNumber} submission #${submission.id}`
    );

    return Response.json({
      ok: true,
      message: `All review data deleted for team ${teamNumber}. Team can submit fresh.`,
      deleted_submission_id: submission.id,
    });
  } catch (err) {
    console.error('[force-resubmit DELETE] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error.' },
      { status: 500 }
    );
  }
}