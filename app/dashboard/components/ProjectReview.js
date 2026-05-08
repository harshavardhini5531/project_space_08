'use client'
import { useState, useEffect } from 'react'
import ProjectReviewForm from './ProjectReviewForm'
import ProjectReviewReport from './ProjectReviewReport'

// Project Review main component
// Place at: app/dashboard/components/ProjectReview.js
//
// Orchestrates the entire Project Review tab.
// Fetches state from /api/project-review/my-report and renders:
//   - Form (for leaders who haven't submitted)
//   - Pending status (after submission, before review)
//   - Reviewing status (AI working on it)
//   - Report (after review complete)
//   - Failed message (with admin contact)
//   - Locked-for-resubmit form (admin unlocked, leader fills again)
//   - Read-only view for non-leader members
//   - "Not in team" / "Not leader" friendly messages

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

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  // Pass-through for child components after submit/resubmit
  function handleSubmitted() {
    refresh()
  }

  // ─── RENDER ───
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

      {/* Body — switches based on state */}
      {renderBody()}
    </div>
  )

  function renderBody() {
    if (state === 'loading') {
      return <LoadingCard />
    }

    if (state === 'error') {
      return <ErrorCard message={error} onRetry={refresh} />
    }

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
      // Leader can fill form; member sees waiting message
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
          icon={<ClockIcon />}
          title="Waiting for team leader"
          message="Only your team leader can submit the project for AI review. Please ask them to fill the form."
          tone="info"
        />
      )
    }

    // From here: submission exists. Show appropriate state.
    if (state === 'pending') {
      return (
        <SubmittedCard
          icon={<HourglassIcon />}
          title="Submitted, awaiting review"
          message={data.message}
          submission={data.submission}
          tone="info"
        />
      )
    }

    if (state === 'queued') {
      return (
        <SubmittedCard
          icon={<QueueIcon />}
          title="Queued for AI review"
          message={data.message}
          submission={data.submission}
          tone="info"
        />
      )
    }

    if (state === 'reviewing') {
      return (
        <SubmittedCard
          icon={<SpinnerIcon />}
          title="AI review in progress"
          message={data.message}
          submission={data.submission}
          tone="working"
        />
      )
    }

    if (state === 'reviewed' && data.report) {
      return (
        <ProjectReviewReport
          submission={data.submission}
          report={data.report}
          isLeader={data.is_leader}
        />
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
        <SubmittedCard
          icon={<WarningIcon />}
          title="Review failed"
          message={data.submission.failure_reason || data.message || 'AI review could not complete. Contact admin to retry.'}
          submission={data.submission}
          tone="error"
        />
      )
    }

    // Fallback for any unknown state
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
// LOADING / ERROR / INFO / SUBMITTED CARDS
// ─────────────────────────────────────────────────────────

function LoadingCard() {
  return (
    <div className="prv-state-card prv-state-loading">
      <div className="prv-spinner-large">
        <SpinnerIcon />
      </div>
      <div className="prv-state-title">Loading project review...</div>
    </div>
  )
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="prv-state-card prv-state-error">
      <div className="prv-state-icon prv-state-icon-error">
        <WarningIcon />
      </div>
      <div className="prv-state-title">Could not load</div>
      <div className="prv-state-msg">{message || 'Unknown error'}</div>
      <button className="prv-btn prv-btn-primary" onClick={onRetry}>
        Try Again
      </button>
    </div>
  )
}

function InfoCard({ icon, title, message, tone = 'info' }) {
  return (
    <div className={`prv-state-card prv-state-${tone}`}>
      <div className={`prv-state-icon prv-state-icon-${tone}`}>{icon}</div>
      <div className="prv-state-title">{title}</div>
      <div className="prv-state-msg">{message}</div>
    </div>
  )
}

function SubmittedCard({ icon, title, message, submission, tone = 'info' }) {
  const submittedDate = submission?.submitted_at
    ? new Date(submission.submitted_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className={`prv-state-card prv-state-${tone}`}>
      <div className={`prv-state-icon prv-state-icon-${tone}`}>{icon}</div>
      <div className="prv-state-title">{title}</div>
      <div className="prv-state-msg">{message}</div>

      {submission && (
        <div className="prv-meta">
          {submittedDate && (
            <div className="prv-meta-row">
              <span className="prv-meta-label">Submitted</span>
              <span className="prv-meta-val">{submittedDate}</span>
            </div>
          )}
          {submission.name && (
            <div className="prv-meta-row">
              <span className="prv-meta-label">Title</span>
              <span className="prv-meta-val">{submission.name}</span>
            </div>
          )}
          {submission.github_url && (
            <div className="prv-meta-row">
              <span className="prv-meta-label">Repo</span>
              <a
                href={submission.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="prv-meta-link"
              >
                {submission.github_url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// INLINE SVG ICONS (line style, currentColor)
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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

function UserGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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

// ─────────────────────────────────────────────────────────
// COMPONENT STYLES (scoped with prv- prefix)
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

/* State cards (loading/error/info/submitted) */
.prv-state-card{padding:50px 32px;border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.prv-state-loading{color:rgba(255,255,255,.5)}
.prv-state-error{border-color:rgba(253,28,0,.2);background:linear-gradient(135deg,rgba(253,28,0,.04),rgba(12,8,18,.5))}
.prv-state-warn{border-color:rgba(238,167,39,.2);background:linear-gradient(135deg,rgba(238,167,39,.04),rgba(12,8,18,.5))}
.prv-state-working{border-color:rgba(238,167,39,.25);background:linear-gradient(135deg,rgba(238,167,39,.05),rgba(12,8,18,.5))}
.prv-state-info{}

.prv-state-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04)}
.prv-state-icon svg{width:28px;height:28px;color:rgba(255,255,255,.5)}
.prv-state-icon-error{background:rgba(253,28,0,.08)}
.prv-state-icon-error svg{color:#fd1c00}
.prv-state-icon-warn{background:rgba(238,167,39,.08)}
.prv-state-icon-warn svg{color:#EEA727}
.prv-state-icon-working{background:rgba(238,167,39,.1)}
.prv-state-icon-working svg{color:#EEA727}
.prv-state-icon-info{background:rgba(255,255,255,.06)}

.prv-state-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase}
.prv-state-msg{font-size:.86rem;color:rgba(255,255,255,.6);max-width:480px;line-height:1.6}

.prv-spinner-large{width:48px;height:48px}
.prv-spinner-large svg{width:48px;height:48px;color:#EEA727}
.prv-spin{animation:prvSpin 1.2s linear infinite}
@keyframes prvSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

.prv-meta{display:flex;flex-direction:column;gap:8px;width:100%;max-width:520px;margin-top:14px;padding:16px 20px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}
.prv-meta-row{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.78rem}
.prv-meta-label{color:rgba(255,255,255,.4);text-transform:uppercase;font-size:.6rem;font-weight:700;letter-spacing:1.3px;flex-shrink:0}
.prv-meta-val{color:rgba(255,255,255,.85);text-align:right;word-break:break-word}
.prv-meta-link{color:#EEA727;text-decoration:none;text-align:right;word-break:break-all;font-size:.76rem}
.prv-meta-link:hover{text-decoration:underline}

/* Buttons */
.prv-btn{padding:11px 22px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;letter-spacing:.5px;cursor:pointer;border:none;transition:all .2s;display:inline-flex;align-items:center;gap:8px}
.prv-btn-primary{background:#fd1c00;color:#fff}
.prv-btn-primary:hover{background:#e51800;transform:translateY(-1px);box-shadow:0 6px 20px rgba(253,28,0,.3)}
.prv-btn-ghost{background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1)}
.prv-btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

/* Mobile */
@media(max-width:640px){
  .prv-header{padding:18px 20px}
  .prv-title{font-size:1.15rem}
  .prv-state-card{padding:36px 20px}
}
`