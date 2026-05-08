'use client'
import { useState, useEffect } from 'react'
import ProjectReviewForm from './ProjectReviewForm'
import ProjectReviewReport from './ProjectReviewReport'

// Project Review main component (Phase 5.5c update)
// Place at: app/dashboard/components/ProjectReview.js
//
// State-aware orchestrator:
//   - no_team:        "You're not in a team" friendly message
//   - not_submitted (leader):     show form (editable)
//   - not_submitted (member):     "Team leader hasn't submitted documentation" message
//   - pending/queued/reviewing:   show submitted fields READ-ONLY (locked icon, no edit)
//   - reviewed:                   show full AI report
//   - failed:                     "Review failed, contact admin"
//
// KEY CHANGE FROM 4.1: Once submitted, NO ONE can edit (not even leader).
// Admin must force-unlock for re-edit.

export default function ProjectReview({ user }) {
  const [state, setState] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const roll = user?.rollNumber || user?.roll_number

  useEffect(() => {
    if (!roll) {
      setState('error')
      setError('Roll number missing. Please re-login.')
      return
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll, refreshKey])

  async function fetchData() {
    setState('loading')
    setError(null)
    try {
      const r = await fetch('/api/project-review/my-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll }),
        cache: 'no-store',
      })
      const d = await r.json()
      if (!d.ok) {
        setState('error')
        setError(d.error || 'Failed to load review status')
        return
      }
      setData(d)
      setState(d.state)
    } catch (e) {
      console.error('[ProjectReview] fetch error:', e)
      setState('error')
      setError('Network error. Please try again.')
    }
  }

  function refresh() { setRefreshKey((k) => k + 1) }
  function handleSubmitted() { refresh() }

  return (
    <div className="prv-wrap">
      <style>{COMPONENT_STYLES}</style>

      {/* Header */}
      <div className="prv-header">
        <div className="prv-header-text">
          <h1 className="prv-title">Project Review</h1>
          <p className="prv-subtitle">AI-powered analysis of your team's project</p>
        </div>
        {data?.team_info && (
          <div className="prv-team-badge">
            <div className="prv-team-row">
              <span className="prv-team-label">TEAM</span>
              <span className="prv-team-num">{data.team_number}</span>
            </div>
            <div className="prv-team-row">
              <span className="prv-team-label">TECH</span>
              <span className="prv-team-tech">{data.team_info.technology}</span>
            </div>
            {data.team_info.batch && (
              <div className="prv-team-row">
                <span className="prv-team-label">BATCH</span>
                <span className="prv-team-batch">{data.team_info.batch}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {renderBody()}
    </div>
  )

  function renderBody() {
    if (state === 'loading') return <LoadingCard />
    if (state === 'error') return <ErrorCard message={error} onRetry={refresh} />

    if (state === 'no_team') {
      return (
        <InfoCard
          icon={<UserGroupIcon />}
          title="You're not in a registered team"
          message={data?.message || 'Please contact your team leader or admin to register your team first.'}
          tone="info"
        />
      )
    }

    if (state === 'not_submitted') {
      // Leader: form. Member: clear waiting message.
      if (data?.is_leader) {
        return (
          <ProjectReviewForm
            user={user}
            teamInfo={data.team_info}
            existingSubmission={null}
            onSubmitted={handleSubmitted}
          />
        )
      }
      return (
        <InfoCard
          icon={<DocPendingIcon />}
          title="Team leader hasn't submitted documentation yet"
          message="Your team leader will fill the project review form. Once submitted, you'll be able to view all the project details here. The AI review will run after the submission is processed."
          tone="info"
          extra={
            data?.team_info?.leader_roll && (
              <div className="prv-leader-info">
                <span className="prv-leader-label">Team Leader Roll:</span>
                <span className="prv-leader-val">{data.team_info.leader_roll}</span>
              </div>
            )
          }
        />
      )
    }

    // From here: submission exists. Display the submitted form fields READ-ONLY.
    // (No matter what the role — leader or member — both see the same read-only view.)
    if (state === 'pending' || state === 'queued' || state === 'reviewing') {
      return (
        <SubmittedReadOnlyView
          submission={data.submission}
          teamInfo={data.team_info}
          state={state}
          isLeader={data.is_leader}
        />
      )
    }

    if (state === 'reviewed' && data.report) {
      return (
        <>
          <ProjectReviewReport
            submission={data.submission}
            report={data.report}
            isLeader={data.is_leader}
          />
          {/* Also show submitted info below the report for reference */}
          <div style={{ marginTop: 16 }}>
            <SubmittedReadOnlyView
              submission={data.submission}
              teamInfo={data.team_info}
              state={state}
              isLeader={data.is_leader}
              compact={true}
            />
          </div>
        </>
      )
    }

    if (state === 'reviewed_missing_report') {
      return (
        <InfoCard
          icon={<WarningIcon />}
          title="Review marked complete, but report missing"
          message="This is unusual. Please contact admin to investigate."
          tone="warn"
        />
      )
    }

    if (state === 'failed') {
      return (
        <SubmittedReadOnlyView
          submission={data.submission}
          teamInfo={data.team_info}
          state={state}
          isLeader={data.is_leader}
          failureReason={data.submission?.failure_reason}
        />
      )
    }

    return (
      <InfoCard
        icon={<WarningIcon />}
        title={`Status: ${state}`}
        message={data?.message || 'Unknown state'}
        tone="warn"
      />
    )
  }
}

// ─────────────────────────────────────────────────────────
// READ-ONLY SUBMISSION VIEW (NEW in 5.5c)
// Shows all 13 fields the leader submitted, locked.
// ─────────────────────────────────────────────────────────
function SubmittedReadOnlyView({ submission, teamInfo, state, isLeader, compact = false, failureReason = null }) {
  if (!submission) return null

  const submittedDate = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'recently'

  // Status banner config
  const statusConfig = {
    pending:    { color: '#EEA727', bg: 'rgba(238,167,39,.08)',  border: 'rgba(238,167,39,.3)', icon: <HourglassIcon />, title: 'Submitted — Awaiting AI Review',  msg: 'Your project has been submitted. Admin will start the AI review batch soon.' },
    queued:     { color: '#EEA727', bg: 'rgba(238,167,39,.1)',   border: 'rgba(238,167,39,.35)', icon: <QueueIcon />,    title: 'Queued for AI Review',             msg: 'Your project is in the queue. AI review will start within 1 minute.' },
    reviewing:  { color: '#fd1c00', bg: 'rgba(253,28,0,.08)',    border: 'rgba(253,28,0,.35)',  icon: <SpinnerIcon />,  title: 'AI Review in Progress',            msg: 'AI is analyzing your project. This usually takes 30-60 seconds.' },
    reviewed:   { color: '#4ade80', bg: 'rgba(74,222,128,.08)',  border: 'rgba(74,222,128,.3)', icon: <CheckCircleIcon />, title: 'Review Complete',                msg: 'AI review is done. See your full report above.' },
    failed:     { color: '#fd1c00', bg: 'rgba(253,28,0,.1)',     border: 'rgba(253,28,0,.4)',   icon: <WarningIcon />,  title: 'Review Failed',                    msg: 'AI could not complete the review. Contact admin to retry.' },
  }
  const sc = statusConfig[state] || statusConfig.pending

  // Parse technologies_used (array)
  const techList = Array.isArray(submission.technologies_used)
    ? submission.technologies_used
    : (typeof submission.technologies_used === 'string'
        ? (() => { try { return JSON.parse(submission.technologies_used) } catch { return [] } })()
        : [])

  return (
    <div className="prv-readonly">
      {/* Status banner */}
      {!compact && (
        <div
          className="prv-ro-status"
          style={{
            background: sc.bg,
            borderColor: sc.border,
            color: sc.color,
          }}
        >
          <div className="prv-ro-status-icon" style={{ color: sc.color }}>{sc.icon}</div>
          <div className="prv-ro-status-text">
            <div className="prv-ro-status-title">{sc.title}</div>
            <div className="prv-ro-status-msg">{sc.msg}</div>
            {failureReason && (
              <div className="prv-ro-status-fail">
                <strong>Reason:</strong> {failureReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locked banner explaining read-only */}
      {!compact && (
        <div className="prv-ro-locked-banner">
          <LockIcon />
          <span>
            <strong>Submission locked.</strong> {isLeader
              ? 'You submitted this on behalf of your team. To make changes, ask admin to unlock.'
              : 'Your team leader submitted this. You can view but not edit.'}
          </span>
        </div>
      )}

      {/* Submission details — all 13 fields */}
      <div className="prv-ro-card">
        <div className="prv-ro-card-head">
          <span className="prv-ro-card-title">{compact ? 'Submitted Details' : 'Project Details (Submitted)'}</span>
          <span className="prv-ro-meta-mini">Submitted {submittedDate}</span>
        </div>

        <div className="prv-ro-fields">
          <Field label="Project Title" value={submission.name} />
          <FieldLink label="GitHub Repo" value={submission.github_url} />
          <FieldArea label="Description" value={submission.description} />
          <FieldArea label="Problem Statement" value={submission.problem_statement} />
          <FieldArea label="Proposed Solution" value={submission.proposed_solution} />
          <FieldArea label="Requirements" value={submission.requirements} />
          <FieldTags label="Technologies Used" tags={techList} />
          <FieldArea label="System Architecture" value={submission.system_architecture} />
          <FieldArea label="In Scope" value={submission.in_scope} />
          <FieldArea label="Out of Scope" value={submission.out_scope} />
          <FieldArea label="Future Enhancements" value={submission.future_enhancements} />
          <FieldArea label="Conclusion" value={submission.conclusion} />
        </div>

        {/* Meta */}
        <div className="prv-ro-meta">
          <div className="prv-ro-meta-row">
            <span className="prv-ro-meta-k">Submitted by</span>
            <span className="prv-ro-meta-v">{submission.submitted_by_roll || '—'}</span>
          </div>
          <div className="prv-ro-meta-row">
            <span className="prv-ro-meta-k">Project Type</span>
            <span className="prv-ro-meta-v">{submission.project_type || '—'}</span>
          </div>
          {submission.retry_count > 0 && (
            <div className="prv-ro-meta-row">
              <span className="prv-ro-meta-k">Retry Count</span>
              <span className="prv-ro-meta-v">{submission.retry_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Field rendering helpers
function Field({ label, value }) {
  return (
    <div className="prv-ro-field">
      <div className="prv-ro-field-label">{label}</div>
      <div className="prv-ro-field-val">{value || <span className="prv-ro-empty">—</span>}</div>
    </div>
  )
}

function FieldLink({ label, value }) {
  return (
    <div className="prv-ro-field">
      <div className="prv-ro-field-label">{label}</div>
      <div className="prv-ro-field-val">
        {value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="prv-ro-link">
            {value.replace(/^https?:\/\//, '')}
          </a>
        ) : <span className="prv-ro-empty">—</span>}
      </div>
    </div>
  )
}

function FieldArea({ label, value }) {
  return (
    <div className="prv-ro-field prv-ro-field-area">
      <div className="prv-ro-field-label">{label}</div>
      <div className="prv-ro-field-area-val">
        {value ? value : <span className="prv-ro-empty">—</span>}
      </div>
    </div>
  )
}

function FieldTags({ label, tags }) {
  return (
    <div className="prv-ro-field">
      <div className="prv-ro-field-label">{label}</div>
      <div className="prv-ro-field-val">
        {tags && tags.length > 0 ? (
          <div className="prv-ro-tags">
            {tags.map((t) => <span key={t} className="prv-ro-tag">{t}</span>)}
          </div>
        ) : <span className="prv-ro-empty">—</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// LOADING / ERROR / INFO CARDS
// ─────────────────────────────────────────────────────────
function LoadingCard() {
  return (
    <div className="prv-state-card prv-state-loading">
      <div className="prv-spinner-large"><SpinnerIcon /></div>
      <div className="prv-state-title">Loading project review...</div>
    </div>
  )
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="prv-state-card prv-state-error">
      <div className="prv-state-icon prv-state-icon-error"><WarningIcon /></div>
      <div className="prv-state-title">Could not load</div>
      <div className="prv-state-msg">{message || 'Unknown error'}</div>
      <button className="prv-btn prv-btn-primary" onClick={onRetry}>Try Again</button>
    </div>
  )
}

function InfoCard({ icon, title, message, tone = 'info', extra = null }) {
  return (
    <div className={`prv-state-card prv-state-${tone}`}>
      <div className={`prv-state-icon prv-state-icon-${tone}`}>{icon}</div>
      <div className="prv-state-title">{title}</div>
      <div className="prv-state-msg">{message}</div>
      {extra}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────
function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14" /><path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  )
}
function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="prv-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function UserGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function DocPendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  )
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES (prv- prefix)
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.prv-wrap{animation:prvIn .5s ease both;font-family:'DM Sans',sans-serif;color:#fff;padding-bottom:40px}
@keyframes prvIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

/* Header */
.prv-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:24px 28px;border-radius:16px;background:linear-gradient(135deg,rgba(253,28,0,.05),rgba(238,167,39,.03));border:1px solid rgba(255,255,255,.06);margin-bottom:24px;flex-wrap:wrap}
.prv-header-text{flex:1;min-width:240px}
.prv-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.4rem;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px 0;line-height:1.2}
.prv-subtitle{font-size:.85rem;color:rgba(255,255,255,.5);margin:0;font-weight:500}
.prv-team-badge{display:flex;flex-direction:column;gap:6px;padding:14px 18px;border-radius:12px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.08)}
.prv-team-row{display:flex;align-items:center;gap:10px;font-size:.78rem}
.prv-team-label{font-size:.6rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.3px;font-weight:700;min-width:42px}
.prv-team-num{color:#EEA727;font-weight:700;letter-spacing:.5px;font-family:'Astro','Orbitron','DM Sans',sans-serif}
.prv-team-tech{color:#fff;font-weight:500}
.prv-team-batch{color:rgba(255,255,255,.65);font-weight:500;font-size:.72rem}

/* State cards */
.prv-state-card{padding:50px 32px;border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.prv-state-loading{color:rgba(255,255,255,.5)}
.prv-state-error{border-color:rgba(253,28,0,.2);background:linear-gradient(135deg,rgba(253,28,0,.04),rgba(12,8,18,.5))}
.prv-state-warn{border-color:rgba(238,167,39,.2);background:linear-gradient(135deg,rgba(238,167,39,.04),rgba(12,8,18,.5))}
.prv-state-info{}
.prv-state-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04)}
.prv-state-icon svg{width:28px;height:28px;color:rgba(255,255,255,.5)}
.prv-state-icon-error{background:rgba(253,28,0,.08)}
.prv-state-icon-error svg{color:#fd1c00}
.prv-state-icon-warn{background:rgba(238,167,39,.08)}
.prv-state-icon-warn svg{color:#EEA727}
.prv-state-icon-info{background:rgba(238,167,39,.06)}
.prv-state-icon-info svg{color:#EEA727}

.prv-state-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase}
.prv-state-msg{font-size:.86rem;color:rgba(255,255,255,.6);max-width:520px;line-height:1.6}

.prv-leader-info{margin-top:14px;padding:10px 16px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);display:flex;gap:10px;font-size:.78rem}
.prv-leader-label{color:rgba(255,255,255,.45)}
.prv-leader-val{color:#EEA727;font-weight:700;font-family:'Astro','Orbitron','DM Sans',sans-serif;letter-spacing:.5px}

.prv-spinner-large{width:48px;height:48px}
.prv-spinner-large svg{width:48px;height:48px;color:#EEA727}
.prv-spin{animation:prvSpin 1.2s linear infinite}
@keyframes prvSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.prv-btn{padding:11px 22px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;letter-spacing:.5px;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
.prv-btn-primary{background:#fd1c00;color:#fff}
.prv-btn-primary:hover{background:#e51800;transform:translateY(-1px);box-shadow:0 6px 20px rgba(253,28,0,.3)}

/* ═══ READ-ONLY VIEW (NEW in 5.5c) ═══ */
.prv-readonly{display:flex;flex-direction:column;gap:14px;animation:prvIn .4s ease both}

.prv-ro-status{display:flex;align-items:flex-start;gap:14px;padding:18px 22px;border-radius:14px;border:1px solid}
.prv-ro-status-icon{flex-shrink:0;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center}
.prv-ro-status-icon svg{width:20px;height:20px}
.prv-ro-status-text{flex:1}
.prv-ro-status-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}
.prv-ro-status-msg{font-size:.82rem;line-height:1.5;opacity:.85}
.prv-ro-status-fail{margin-top:8px;padding:10px 14px;border-radius:8px;background:rgba(0,0,0,.3);font-size:.78rem;line-height:1.5}

.prv-ro-locked-banner{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:10px;background:rgba(123,47,190,.06);border:1px solid rgba(123,47,190,.2);color:rgba(255,255,255,.7);font-size:.78rem;line-height:1.5}
.prv-ro-locked-banner svg{color:#a78bfa;flex-shrink:0}
.prv-ro-locked-banner strong{color:#a78bfa;font-weight:700}

.prv-ro-card{border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);overflow:hidden}
.prv-ro-card-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 24px;background:linear-gradient(135deg,rgba(253,28,0,.04),transparent);border-bottom:1px solid rgba(255,255,255,.05);flex-wrap:wrap}
.prv-ro-card-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase}
.prv-ro-meta-mini{font-size:.7rem;color:rgba(255,255,255,.45);font-weight:500}

.prv-ro-fields{padding:22px 24px;display:flex;flex-direction:column;gap:18px}
.prv-ro-field{display:flex;flex-direction:column;gap:6px}
.prv-ro-field-label{font-size:.65rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.4px;font-weight:700}
.prv-ro-field-val{font-size:.86rem;color:#fff;font-weight:500;line-height:1.5;word-break:break-word}
.prv-ro-field-area-val{font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.6;padding:11px 14px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);white-space:pre-wrap;word-break:break-word}
.prv-ro-link{color:#EEA727;text-decoration:none;font-weight:500;word-break:break-all}
.prv-ro-link:hover{text-decoration:underline}
.prv-ro-empty{color:rgba(255,255,255,.25);font-style:italic}

.prv-ro-tags{display:flex;flex-wrap:wrap;gap:6px}
.prv-ro-tag{padding:4px 10px;border-radius:6px;background:linear-gradient(135deg,rgba(238,167,39,.15),rgba(253,28,0,.1));border:1px solid rgba(238,167,39,.3);color:#EEA727;font-size:.72rem;font-weight:600;letter-spacing:.2px}

.prv-ro-meta{padding:14px 24px;border-top:1px solid rgba(255,255,255,.04);background:rgba(255,255,255,.015);display:flex;flex-direction:column;gap:6px}
.prv-ro-meta-row{display:flex;justify-content:space-between;gap:12px;font-size:.74rem}
.prv-ro-meta-k{color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;font-size:.62rem}
.prv-ro-meta-v{color:rgba(255,255,255,.75)}

/* Mobile */
@media(max-width:640px){
  .prv-header{padding:18px 20px}
  .prv-title{font-size:1.15rem}
  .prv-state-card{padding:36px 20px}
  .prv-ro-fields{padding:18px 18px}
  .prv-ro-card-head{padding:14px 18px}
}
`