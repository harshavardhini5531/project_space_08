// app/api/project-review/my-report/route.js
//
// Student opens "Project Review" tab → single endpoint returns unified state.
// Returns the form, pending status, or full report depending on team's state.
//
// Works for ANY team member (leader or not).
// Only leaders can act on the form; readers see read-only views.

import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rollNumber = String(body.rollNumber || '').trim().toUpperCase();

    // ───── 1. Validate input ─────
    if (!rollNumber) {
      return Response.json(
        { ok: false, error: 'rollNumber is required' },
        { status: 400 }
      );
    }

    // ───── 2. Verify roll exists in user_passwords (logged in) ─────
    const { data: userRow } = await supabase
      .from('user_passwords')
      .select('roll_number')
      .eq('roll_number', rollNumber)
      .maybeSingle();

    if (!userRow) {
      return Response.json(
        { ok: false, error: 'Not authorized. Please login again.' },
        { status: 401 }
      );
    }

    // ───── 3. Find the team this user is part of (member or leader) ─────
    // First check if they're a leader
    let { data: team } = await supabase
      .from('teams')
      .select(
        'serial_number, team_number, technology, batch, leader_roll, mentor_assigned, project_title'
      )
      .eq('leader_roll', rollNumber)
      .maybeSingle();

    let isLeader = !!team;

    // If not leader, check team_members
    if (!team) {
      const { data: member } = await supabase
        .from('team_members')
        .select('team_number, serial_number')
        .eq('roll_number', rollNumber)
        .maybeSingle();

      if (!member) {
        return Response.json(
          {
            ok: true,
            state: 'no_team',
            message: 'You are not part of any registered team yet.',
            is_leader: false,
            team_number: null,
            submission: null,
            report: null,
          }
        );
      }

      const { data: t } = await supabase
        .from('teams')
        .select(
          'serial_number, team_number, technology, batch, leader_roll, mentor_assigned, project_title'
        )
        .eq('team_number', member.team_number)
        .maybeSingle();
      team = t;
    }

    if (!team) {
      return Response.json(
        {
          ok: true,
          state: 'no_team',
          message: 'Team data not found.',
          is_leader: false,
          team_number: null,
          submission: null,
          report: null,
        }
      );
    }

    const teamNumber = team.team_number;

    // ───── 4. Check for existing submission ─────
    const { data: submission } = await supabase
      .from('project_review_submissions')
      .select(
        'id, status, submitted_at, submitted_by_roll, name, github_url, technology, batch, ' +
          'description, requirements, problem_statement, proposed_solution, ' +
          'technologies_used, system_architecture, in_scope, out_scope, ' +
          'future_enhancements, conclusion, project_type, ' +
          'reviewing_started_at, reviewed_at, failure_reason, retry_count, max_retries, admin_locked'
      )
      .eq('team_number', teamNumber)
      .maybeSingle();

    // ───── 5. State: no submission yet ─────
    if (!submission) {
      return Response.json({
        ok: true,
        state: 'not_submitted',
        is_leader: isLeader,
        team_number: teamNumber,
        team_info: {
          team_number: teamNumber,
          technology: team.technology,
          batch: team.batch,
          mentor: team.mentor_assigned,
          leader_roll: team.leader_roll,
          project_title: team.project_title,
        },
        submission: null,
        report: null,
        message: isLeader
          ? 'Your team has not submitted for AI review yet. Fill the form to submit.'
          : 'Your team leader has not submitted for AI review yet.',
      });
    }

    // ───── 6. Submission exists — get the latest report if status='reviewed' ─────
    let report = null;
    if (submission.status === 'reviewed') {
      const { data: reportRow } = await supabase
        .from('project_review_reports')
        .select(
          'id, ai_model, review_completed_at, duration_ms, ' +
            'score_overall, score_breakdown, positives, bugs, improvements, summary, ' +
            'tech_stack_validation, status'
        )
        .eq('submission_id', submission.id)
        .eq('status', 'completed')
        .order('review_completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reportRow) {
        report = {
          id: reportRow.id,
          reviewed_at: reportRow.review_completed_at,
          duration_seconds: reportRow.duration_ms
            ? Math.round(reportRow.duration_ms / 1000)
            : null,
          ai_model: reportRow.ai_model,
          score: {
            overall: reportRow.score_overall,
            breakdown: reportRow.score_breakdown,
          },
          summary: reportRow.summary,
          positives: reportRow.positives || [],
          bugs: reportRow.bugs || [],
          improvements: reportRow.improvements || [],
          tech_stack_validation: reportRow.tech_stack_validation,
        };
      }
    }

    // ───── 7. Determine state ─────
    let state = submission.status; // pending | queued | reviewing | reviewed | failed
    let stateMessage = '';

    switch (state) {
      case 'pending':
        stateMessage =
          'Your project has been submitted. Awaiting admin to start the review batch.';
        break;
      case 'queued':
        stateMessage = 'Your project is queued for AI review. Should start soon.';
        break;
      case 'reviewing':
        stateMessage = 'Your AI review is in progress. Check back in a few minutes.';
        break;
      case 'reviewed':
        if (report) {
          stateMessage = 'Review complete! See your full report below.';
        } else {
          stateMessage =
            'Review marked complete but report not found. Contact admin if this persists.';
          state = 'reviewed_missing_report';
        }
        break;
      case 'failed':
        stateMessage = `Review failed: ${submission.failure_reason || 'unknown error'}. Contact admin to retry.`;
        break;
      default:
        stateMessage = `Status: ${state}`;
    }

    // ───── 8. Build response ─────
    return Response.json({
      ok: true,
      state,
      is_leader: isLeader,
      team_number: teamNumber,
      team_info: {
        team_number: teamNumber,
        technology: team.technology,
        batch: team.batch,
        mentor: team.mentor_assigned,
        leader_roll: team.leader_roll,
        project_title: team.project_title,
      },
      submission: {
        id: submission.id,
        status: submission.status,
        submitted_at: submission.submitted_at,
        submitted_by_roll: submission.submitted_by_roll,
        admin_locked: submission.admin_locked,
        retry_count: submission.retry_count,
        max_retries: submission.max_retries,
        // Form data (used to display submitted info, NOT for editing)
        name: submission.name,
        github_url: submission.github_url,
        description: submission.description,
        requirements: submission.requirements,
        problem_statement: submission.problem_statement,
        proposed_solution: submission.proposed_solution,
        technologies_used: submission.technologies_used,
        system_architecture: submission.system_architecture,
        in_scope: submission.in_scope,
        out_scope: submission.out_scope,
        future_enhancements: submission.future_enhancements,
        conclusion: submission.conclusion,
        project_type: submission.project_type,
        // Status timestamps
        reviewing_started_at: submission.reviewing_started_at,
        reviewed_at: submission.reviewed_at,
        failure_reason: submission.failure_reason,
      },
      report,
      message: stateMessage,
    });
  } catch (err) {
    console.error('[my-report] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error. Please refresh.' },
      { status: 500 }
    );
  }
}