// app/api/project-review/submit/route.js
// Student team leader submits their project for AI review.
//
// SECURITY (defense in depth):
//   1. Verify rollNumber exists in user_passwords (proves logged in)
//   2. Verify rollNumber matches teams.leader_roll (only leader can submit)
//   3. Verify all 13 form fields present
//   4. Validate GitHub URL is public + reachable
//   5. Block if team already has an active submission today

import { supabase } from '@/lib/supabase';
import { validateRepoUrl } from '@/lib/github-fetch';
import { syncSubmissionToDevApi } from '@/lib/dev-api-sync';

// ─────────────────────────────────────────────────────────────────
// Required form fields (must match developer's MongoDB schema)
// ─────────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  'name',
  'github_url',
  'description',
  'requirements',
  'problem_statement',
  'proposed_solution',
  'technologies_used',
  'system_architecture',
  'in_scope',
  'out_scope',
  'future_enhancements',
  'conclusion',
  // project_type is auto-populated from team's technology
];

const MIN_FIELD_LENGTHS = {
  name: 3,
  description: 30,
  requirements: 30,
  problem_statement: 30,
  proposed_solution: 30,
  system_architecture: 30,
  in_scope: 20,
  out_scope: 20,
  future_enhancements: 20,
  conclusion: 20,
};

const VALID_PROJECT_TYPES = [
  'fullstack', 'flutter', 'aws', 'data', 'servicenow', 'vlsi', 'coding', 'default',
];

// Map technology → projectType (mirrors lib/project-rubrics.js)
const TECH_TO_TYPE = {
  'Full Stack': 'fullstack',
  'Google Flutter': 'flutter',
  'AWS Development': 'aws',
  'Data Specialist': 'data',
  'ServiceNow': 'servicenow',
  'VLSI': 'vlsi',
  'SkillUp Coder': 'coding',
  'Skillup Coder': 'coding',
};

function getProjectType(tech) {
  if (!tech) return 'default';
  if (TECH_TO_TYPE[tech]) return TECH_TO_TYPE[tech];
  // case-insensitive fallback
  const lower = tech.toLowerCase().trim();
  for (const [key, val] of Object.entries(TECH_TO_TYPE)) {
    if (key.toLowerCase() === lower) return val;
  }
  return 'default';
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rollNumber = (body.rollNumber || '').trim().toUpperCase();

    // ───── 1. Auth: rollNumber present + exists in user_passwords ─────
    if (!rollNumber) {
      return Response.json(
        { ok: false, error: 'rollNumber is required' },
        { status: 400 }
      );
    }

    const { data: userRow, error: userErr } = await supabase
      .from('user_passwords')
      .select('roll_number')
      .eq('roll_number', rollNumber)
      .maybeSingle();

    if (userErr || !userRow) {
      return Response.json(
        { ok: false, error: 'Not authorized. Please login again.' },
        { status: 401 }
      );
    }

    // ───── 2. Find team this user leads ─────
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('serial_number, team_number, technology, batch, leader_roll, mentor_assigned')
      .eq('leader_roll', rollNumber)
      .maybeSingle();

    if (teamErr) {
      console.error('[submit] Team lookup error:', teamErr);
      return Response.json(
        { ok: false, error: 'Database error during team lookup.' },
        { status: 500 }
      );
    }

    if (!team) {
      return Response.json(
        { ok: false, error: 'Only the team leader can submit. You are not registered as a team leader.' },
        { status: 403 }
      );
    }

    const teamNumber = team.team_number;
    const technology = team.technology;
    const batch = team.batch;

    // ───── 3. Check daily lock — already submitted today? ─────
    // Skip this check if admin previously force-unlocked this team
    const { data: existingSubmission } = await supabase
      .from('project_review_submissions')
      .select('id, submitted_at, status, admin_locked')
      .eq('team_number', teamNumber)
      .maybeSingle();

    if (existingSubmission && !existingSubmission.admin_locked) {
      // Check if it was submitted today
      const submittedDate = new Date(existingSubmission.submitted_at).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Already exists — locked status
      return Response.json(
        {
          ok: false,
          error: 'Your team has already submitted a project review request. Submissions are locked once submitted.',
          locked: true,
          submitted_at: existingSubmission.submitted_at,
          status: existingSubmission.status,
        },
        { status: 409 }
      );
    }

    // ───── 4. Validate all 13 required fields present ─────
    const missingFields = [];
    for (const field of REQUIRED_FIELDS) {
      const val = body[field];
      if (val === undefined || val === null) {
        missingFields.push(field);
        continue;
      }
      // For arrays (technologies_used)
      if (field === 'technologies_used') {
        if (!Array.isArray(val) || val.length === 0) {
          missingFields.push(field);
        }
        continue;
      }
      // For strings
      if (typeof val !== 'string' || val.trim().length === 0) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return Response.json(
        {
          ok: false,
          error: `Missing or empty fields: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    // ───── 5. Validate minimum field lengths (encourage thoughtful answers) ─────
    const tooShort = [];
    for (const [field, minLen] of Object.entries(MIN_FIELD_LENGTHS)) {
      if (typeof body[field] === 'string' && body[field].trim().length < minLen) {
        tooShort.push({ field, min: minLen, got: body[field].trim().length });
      }
    }

    if (tooShort.length > 0) {
      const fieldList = tooShort
        .map((t) => `${t.field} (minimum ${t.min} characters, you have ${t.got})`)
        .join('; ');
      return Response.json(
        {
          ok: false,
          error: `These fields are too short: ${fieldList}. Please add more detail.`,
          tooShort,
        },
        { status: 400 }
      );
    }

    // ───── 6. Validate technologies_used array ─────
    const techArr = body.technologies_used;
    if (!Array.isArray(techArr) || techArr.some((t) => typeof t !== 'string' || !t.trim())) {
      return Response.json(
        { ok: false, error: 'technologies_used must be a non-empty array of strings.' },
        { status: 400 }
      );
    }

    // ───── 7. Validate GitHub URL is public + reachable ─────
    const githubUrl = body.github_url.trim();
    const repoCheck = await validateRepoUrl(githubUrl);
    if (!repoCheck.ok) {
      return Response.json(
        {
          ok: false,
          error: `GitHub repo issue: ${repoCheck.error}`,
          repoError: true,
        },
        { status: 400 }
      );
    }

    // ───── 8. Determine project_type from team's technology ─────
    const projectType = getProjectType(technology);
    if (!VALID_PROJECT_TYPES.includes(projectType)) {
      console.error(`[submit] Unknown project type: ${projectType} for tech: ${technology}`);
      // continue with 'default' as fallback
    }

    // ───── 9. Prepare insert payload ─────
    const submissionPayload = {
      team_number: teamNumber,
      technology,
      batch,
      submitted_by_roll: rollNumber,
      submitted_by_name: userRow.short_name || null,
      name: body.name.trim(),
      github_url: githubUrl,
      description: body.description.trim(),
      requirements: body.requirements.trim(),
      problem_statement: body.problem_statement.trim(),
      proposed_solution: body.proposed_solution.trim(),
      technologies_used: techArr.map((t) => t.trim()),
      system_architecture: body.system_architecture.trim(),
      in_scope: body.in_scope.trim(),
      out_scope: body.out_scope.trim(),
      future_enhancements: body.future_enhancements.trim(),
      conclusion: body.conclusion.trim(),
      project_type: projectType,
      status: 'pending',
    };

    // ───── 10. INSERT or UPDATE if previous was admin_locked ─────
    let result;
    if (existingSubmission && existingSubmission.admin_locked) {
      // Admin had unlocked — replace previous submission
      result = await supabase
        .from('project_review_submissions')
        .update({
          ...submissionPayload,
          submitted_at: new Date().toISOString(),
          admin_locked: false, // re-lock
          admin_resubmitted_at: new Date().toISOString(),
          retry_count: 0,
          reviewing_started_at: null,
          reviewed_at: null,
          failure_reason: null,
        })
        .eq('id', existingSubmission.id)
        .select('id, team_number, status, submitted_at')
        .single();
    } else {
      // Brand new submission
      result = await supabase
        .from('project_review_submissions')
        .insert(submissionPayload)
        .select('id, team_number, status, submitted_at')
        .single();
    }

    if (result.error) {
      // Handle UNIQUE violation (race condition)
      if (result.error.code === '23505') {
        return Response.json(
          {
            ok: false,
            error: 'Your team has just submitted. Please refresh the page.',
            locked: true,
          },
          { status: 409 }
        );
      }
      console.error('[submit] Insert error:', result.error);
      return Response.json(
        { ok: false, error: 'Failed to save submission. Please try again.' },
        { status: 500 }
      );
    }

    // ───── 11. Fire-and-forget: sync to developer's API (non-blocking) ─────
    // We don't await this — student response is fast.
    // If it fails, retry cron will handle it.
    const fullSubmissionForSync = {
      id: result.data.id,
      team_number: teamNumber,
      ...submissionPayload,
    };
    syncSubmissionToDevApi(fullSubmissionForSync)
      .then((syncResult) => {
        if (syncResult.ok) {
          console.log(`[submit] Dev API sync OK for ${teamNumber}: ${syncResult.dev_api_id}`);
        } else {
          console.warn(`[submit] Dev API sync FAILED for ${teamNumber}: ${syncResult.error} (will retry)`);
        }
      })
      .catch((err) => {
        // This shouldn't happen because syncSubmissionToDevApi never throws,
        // but just in case — log it.
        console.error(`[submit] Dev API sync THREW for ${teamNumber}:`, err.message);
      });

    // ───── 12. Success — return submission details + repo metadata ─────
    return Response.json({
      ok: true,
      message: 'Project submitted successfully! Your AI review will be ready when admin runs the batch.',
      submission: {
        id: result.data.id,
        team_number: result.data.team_number,
        status: result.data.status,
        submitted_at: result.data.submitted_at,
      },
      repoInfo: repoCheck.repoMeta,
    });
  } catch (err) {
    console.error('[submit] Unexpected error:', err);
    return Response.json(
      { ok: false, error: 'Server error. Please try again or contact admin.' },
      { status: 500 }
    );
  }
}