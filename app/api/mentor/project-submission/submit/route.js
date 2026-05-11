import { supabase } from '@/lib/supabase'
import { validateRepoUrl } from '@/lib/github-fetch'
import { syncSubmissionToDevApi } from '@/lib/dev-api-sync'

const REQUIRED_FIELDS = [
  'name', 'github_url', 'description', 'requirements', 'problem_statement',
  'proposed_solution', 'technologies_used', 'system_architecture',
  'in_scope', 'out_scope', 'future_enhancements', 'conclusion',
]

const MIN_FIELD_LENGTHS = {
  name: 3, description: 30, requirements: 30, problem_statement: 30,
  proposed_solution: 30, system_architecture: 30, in_scope: 20, out_scope: 20,
  future_enhancements: 20, conclusion: 20,
}

const TECH_TO_TYPE = {
  'Full Stack': 'fullstack', 'Google Flutter': 'flutter', 'AWS Development': 'aws',
  'Data Specialist': 'data', 'ServiceNow': 'servicenow', 'VLSI': 'vlsi',
  'SkillUp Coder': 'coding', 'Skillup Coder': 'coding',
}

function getProjectType(tech) {
  if (!tech) return 'default'
  if (TECH_TO_TYPE[tech]) return TECH_TO_TYPE[tech]
  const lower = tech.toLowerCase().trim()
  for (const [key, val] of Object.entries(TECH_TO_TYPE)) {
    if (key.toLowerCase() === lower) return val
  }
  return 'default'
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const mentorEmail = (body.mentorEmail || '').trim().toLowerCase()

    if (!mentorEmail) return Response.json({ ok: false, error: 'mentorEmail required' }, { status: 400 })

    // ───── 1. Auth: find mentor ─────
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name, email, technology')
      .eq('email', mentorEmail)
      .maybeSingle()

    if (!mentor) return Response.json({ ok: false, error: 'Mentor not found. Please login again.' }, { status: 401 })

    // ───── 2. Check existing submission (1 per mentor) ─────
    const { data: existing } = await supabase
      .from('mentor_project_submissions')
      .select('id, submitted_at, status, admin_locked')
      .eq('mentor_email', mentorEmail)
      .maybeSingle()

    if (existing && !existing.admin_locked) {
      return Response.json({
        ok: false,
        error: 'You have already submitted a project. Submissions are locked once submitted.',
        locked: true,
        submitted_at: existing.submitted_at,
        status: existing.status,
      }, { status: 409 })
    }

    // ───── 3. Validate required fields ─────
    const missing = []
    for (const f of REQUIRED_FIELDS) {
      const v = body[f]
      if (v === undefined || v === null) { missing.push(f); continue }
      if (f === 'technologies_used') {
        if (!Array.isArray(v) || v.length === 0) missing.push(f)
        continue
      }
      if (typeof v !== 'string' || v.trim().length === 0) missing.push(f)
    }
    if (missing.length > 0) {
      return Response.json({ ok: false, error: `Missing fields: ${missing.join(', ')}`, missingFields: missing }, { status: 400 })
    }

    // ───── 4. Min lengths ─────
    const tooShort = []
    for (const [f, min] of Object.entries(MIN_FIELD_LENGTHS)) {
      if (typeof body[f] === 'string' && body[f].trim().length < min) {
        tooShort.push({ field: f, min, got: body[f].trim().length })
      }
    }
    if (tooShort.length > 0) {
      const list = tooShort.map(t => `${t.field} (min ${t.min}, got ${t.got})`).join('; ')
      return Response.json({ ok: false, error: `Fields too short: ${list}`, tooShort }, { status: 400 })
    }

    // ───── 5. Validate GitHub URL ─────
    const githubUrl = body.github_url.trim()
    const repoCheck = await validateRepoUrl(githubUrl)
    if (!repoCheck.ok) {
      return Response.json({ ok: false, error: `GitHub repo issue: ${repoCheck.error}`, repoError: true }, { status: 400 })
    }

    // ───── 6. Build payload ─────
    const technology = mentor.technology || body.technology || null
    const projectType = getProjectType(technology)

    const payload = {
      mentor_id: mentor.id,
      mentor_name: mentor.name,
      mentor_email: mentor.email,
      technology,
      name: body.name.trim(),
      github_url: githubUrl,
      description: body.description.trim(),
      requirements: body.requirements.trim(),
      problem_statement: body.problem_statement.trim(),
      proposed_solution: body.proposed_solution.trim(),
      technologies_used: body.technologies_used.map(t => String(t).trim()).filter(Boolean),
      system_architecture: body.system_architecture.trim(),
      in_scope: body.in_scope.trim(),
      out_scope: body.out_scope.trim(),
      future_enhancements: body.future_enhancements.trim(),
      conclusion: body.conclusion.trim(),
      project_type: projectType,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_locked: false,
    }

    // ───── 7. Upsert (if admin_locked = true, allow replace) ─────
    let saved
    if (existing) {
      const { data, error } = await supabase
        .from('mentor_project_submissions')
        .update(payload).eq('id', existing.id).select().single()
      if (error) {
        console.error('[mentor submit] update error:', error)
        return Response.json({ ok: false, error: 'DB error: ' + error.message }, { status: 500 })
      }
      saved = data
    } else {
      const { data, error } = await supabase
        .from('mentor_project_submissions').insert(payload).select().single()
      if (error) {
        console.error('[mentor submit] insert error:', error)
        return Response.json({ ok: false, error: 'DB error: ' + error.message }, { status: 500 })
      }
      saved = data
    }

    // ───── 8. Sync to dev API for AI review ─────
    try {
      // Adapt mentor submission to match what syncSubmissionToDevApi expects.
      // We pass a "submission-like" object — team_number replaced with mentor identifier.
      const devSubmission = {
        ...saved,
        team_number: `MENTOR-${mentor.id.slice(0, 8)}`,
        batch: 'mentor',
      }
      const syncResult = await syncSubmissionToDevApi(devSubmission)
      if (syncResult.ok && syncResult.dev_api_id) {
        await supabase
          .from('mentor_project_submissions')
          .update({
            dev_api_id: syncResult.dev_api_id,
            dev_api_synced_at: new Date().toISOString(),
          })
          .eq('id', saved.id)
      } else if (!syncResult.skipped) {
        await supabase
          .from('mentor_project_submissions')
          .update({
            dev_api_sync_error: syncResult.error || 'Unknown sync error',
            dev_api_retry_count: (saved.dev_api_retry_count || 0) + 1,
            dev_api_last_attempt_at: new Date().toISOString(),
          })
          .eq('id', saved.id)
      }
    } catch (syncErr) {
      console.error('[mentor submit] dev API sync error:', syncErr)
    }

    return Response.json({ ok: true, submission: saved })
  } catch (err) {
    console.error('[mentor submit] fatal:', err)
    return Response.json({ ok: false, error: 'Server error', detail: err.message }, { status: 500 })
  }
}