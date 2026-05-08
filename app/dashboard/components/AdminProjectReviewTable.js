'use client'
import { useState, useMemo } from 'react'

// Admin Project Review Table
// Place at: app/dashboard/components/AdminProjectReviewTable.js
//
// Renders the 160-team table with:
//   - Sortable columns (team #, score, status)
//   - Search box (team # or project title)
//   - Status badges
//   - Per-row action menu (View Report, View Submission, Force Resubmit, GitHub)
//   - Modals for report/submission drill-down
//   - Mobile responsive (collapses to cards)

export default function AdminProjectReviewTable({ teams, adminEmail, onForceResubmit, isBatchRunning }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('team_number')
  const [sortDir, setSortDir] = useState('asc')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [modalContent, setModalContent] = useState(null) // {type, team}
  const [actioning, setActioning] = useState(null) // team_number
  const [actionMessage, setActionMessage] = useState(null) // {type, text, team}

  // ─── Sort + filter teams ───
  const visibleTeams = useMemo(() => {
    let filtered = teams
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.team_number?.toLowerCase().includes(q) ||
          t.project_title?.toLowerCase().includes(q) ||
          t.technology?.toLowerCase().includes(q) ||
          t.leader_roll?.toLowerCase().includes(q)
      )
    }
    const sorted = [...filtered].sort((a, b) => {
      const aV = a[sortKey] ?? ''
      const bV = b[sortKey] ?? ''
      if (sortKey === 'score') {
        const av = a.score?.overall ?? -1
        const bv = b.score?.overall ?? -1
        return sortDir === 'asc' ? av - bv : bv - av
      }
      if (typeof aV === 'string' && typeof bV === 'string') {
        return sortDir === 'asc'
          ? aV.localeCompare(bV)
          : bV.localeCompare(aV)
      }
      return 0
    })
    return sorted
  }, [teams, search, sortKey, sortDir])

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function closeMenu() {
    setActiveMenuId(null)
  }

  // ─── Force resubmit action ───
  async function handleForceResubmit(team) {
    if (!confirm(`Unlock team ${team.team_number} for resubmission?\n\nThis allows the team leader to fill the form fresh again.`)) {
      return
    }
    setActioning(team.team_number)
    closeMenu()
    try {
      const r = await fetch('/api/admin/project-review/force-resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          teamNumber: team.team_number,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        setActionMessage({ type: 'success', text: d.message, team: team.team_number })
        if (onForceResubmit) onForceResubmit()
      } else {
        setActionMessage({ type: 'error', text: d.error || 'Failed', team: team.team_number })
      }
    } catch (e) {
      setActionMessage({ type: 'error', text: 'Network error', team: team.team_number })
    } finally {
      setActioning(null)
      setTimeout(() => setActionMessage(null), 5000)
    }
  }

  // ─── Render ───
  if (teams.length === 0) {
    return (
      <div className="aprt-empty">
        <style>{COMPONENT_STYLES}</style>
        <div className="aprt-empty-icon"><InboxIcon /></div>
        <div className="aprt-empty-title">No teams to show</div>
        <div className="aprt-empty-msg">Try clearing your filters.</div>
      </div>
    )
  }

  return (
    <div className="aprt-wrap" onClick={closeMenu}>
      <style>{COMPONENT_STYLES}</style>

      {/* Search + sort header */}
      <div className="aprt-toolbar">
        <div className="aprt-search-wrap">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team, project, tech, leader..."
            className="aprt-search"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="aprt-result-info">
          {visibleTeams.length} of {teams.length}
        </div>
      </div>

      {/* Action message banner */}
      {actionMessage && (
        <div className={`aprt-action-msg aprt-action-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? <CheckIcon /> : <WarningIcon />}
          <span>
            <strong>{actionMessage.team}:</strong> {actionMessage.text}
          </span>
        </div>
      )}

      {/* Table — desktop view */}
      <div className="aprt-tbl-wrap">
        <table className="aprt-tbl">
          <thead>
            <tr>
              <th className="aprt-th-team" onClick={() => handleSort('team_number')}>
                Team {sortIndicator(sortKey, sortDir, 'team_number')}
              </th>
              <th className="aprt-th-title">Project Title</th>
              <th className="aprt-th-tech" onClick={() => handleSort('technology')}>
                Tech {sortIndicator(sortKey, sortDir, 'technology')}
              </th>
              <th className="aprt-th-batch">Batch</th>
              <th className="aprt-th-status" onClick={() => handleSort('status')}>
                Status {sortIndicator(sortKey, sortDir, 'status')}
              </th>
              <th className="aprt-th-score" onClick={() => handleSort('score')}>
                Score {sortIndicator(sortKey, sortDir, 'score')}
              </th>
              <th className="aprt-th-act"></th>
            </tr>
          </thead>
          <tbody>
            {visibleTeams.map((team) => (
              <tr key={team.team_number} className={`aprt-row ${actioning === team.team_number ? 'aprt-acting' : ''}`}>
                <td className="aprt-td-team">{team.team_number}</td>
                <td className="aprt-td-title">
                  {team.project_title || <span className="aprt-dash">—</span>}
                </td>
                <td className="aprt-td-tech">{team.technology || '—'}</td>
                <td className="aprt-td-batch">
                  <span className="aprt-batch-tag">{team.batch}</span>
                </td>
                <td className="aprt-td-status">
                  <StatusBadge
                    status={team.status}
                    locked={team.admin_locked}
                    retryCount={team.retry_count}
                  />
                </td>
                <td className="aprt-td-score">
                  {team.score?.overall != null ? (
                    <span
                      className="aprt-score"
                      style={{ color: getScoreColor(team.score.overall) }}
                    >
                      {team.score.overall}
                    </span>
                  ) : (
                    <span className="aprt-dash">—</span>
                  )}
                </td>
                <td className="aprt-td-act">
                  <div className="aprt-act-wrap">
                    <button
                      type="button"
                      className="aprt-act-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuId(activeMenuId === team.team_number ? null : team.team_number)
                      }}
                      disabled={actioning === team.team_number}
                      aria-label="Actions"
                    >
                      <DotsIcon />
                    </button>
                    {activeMenuId === team.team_number && (
                      <div className="aprt-menu" onClick={(e) => e.stopPropagation()}>
                        {team.score && (
                          <button
                            type="button"
                            className="aprt-menu-item"
                            onClick={() => {
                              setModalContent({ type: 'report', team })
                              closeMenu()
                            }}
                          >
                            <EyeIcon /> View Report
                          </button>
                        )}
                        {team.has_submission && (
                          <button
                            type="button"
                            className="aprt-menu-item"
                            onClick={() => {
                              setModalContent({ type: 'submission', team })
                              closeMenu()
                            }}
                          >
                            <DocIcon /> View Submission
                          </button>
                        )}
                        {team.github_url && (
                          <a
                            href={team.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aprt-menu-item"
                            onClick={() => closeMenu()}
                          >
                            <GithubIcon /> Open Repo
                          </a>
                        )}
                        {team.has_submission && (
                          <button
                            type="button"
                            className="aprt-menu-item aprt-menu-danger"
                            onClick={() => handleForceResubmit(team)}
                            disabled={isBatchRunning}
                          >
                            <UnlockIcon />
                            {team.admin_locked ? 'Already Unlocked' : 'Force Resubmit'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalContent && (
        <Modal
          content={modalContent}
          onClose={() => setModalContent(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────
function StatusBadge({ status, locked, retryCount }) {
  const config = {
    not_submitted: { label: 'Not Submitted', color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.05)', icon: <DashIcon /> },
    pending:       { label: 'Pending',       color: '#EEA727',                bg: 'rgba(238,167,39,0.1)',  icon: <ClockIcon /> },
    queued:        { label: 'Queued',        color: '#EEA727',                bg: 'rgba(238,167,39,0.12)', icon: <QueueIcon /> },
    reviewing:     { label: 'Reviewing',     color: '#fd1c00',                bg: 'rgba(253,28,0,0.1)',    icon: <SpinnerSmIcon /> },
    reviewed:      { label: 'Reviewed',      color: '#4ade80',                bg: 'rgba(74,222,128,0.1)',  icon: <CheckIconSm /> },
    failed:        { label: 'Failed',        color: '#fd1c00',                bg: 'rgba(253,28,0,0.12)',   icon: <XIconSm /> },
  }
  const c = config[status] || { label: status, color: '#fff', bg: 'rgba(255,255,255,0.05)', icon: null }

  return (
    <div className="aprt-status-wrap">
      <span
        className="aprt-status-badge"
        style={{ color: c.color, background: c.bg, borderColor: c.color + '40' }}
      >
        {c.icon} {c.label}
      </span>
      {locked && (
        <span className="aprt-mini-tag" title="Admin unlocked for resubmit">
          UNLOCKED
        </span>
      )}
      {retryCount > 0 && status === 'failed' && (
        <span className="aprt-mini-tag" title={`Retried ${retryCount} times`}>
          RETRY {retryCount}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Modal — used for both Report and Submission views
// ─────────────────────────────────────────────────────────
function Modal({ content, onClose }) {
  const { type, team } = content

  return (
    <div className="aprt-modal-bg" onClick={onClose}>
      <div className="aprt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aprt-modal-head">
          <div>
            <div className="aprt-modal-title">
              {type === 'report' ? 'AI Review Report' : 'Submitted Project Details'}
            </div>
            <div className="aprt-modal-sub">
              {team.team_number} · {team.project_title || team.technology}
            </div>
          </div>
          <button type="button" className="aprt-modal-x" onClick={onClose}>
            <XIcon />
          </button>
        </div>
        <div className="aprt-modal-body">
          {type === 'report' ? (
            <ReportView team={team} />
          ) : (
            <SubmissionView team={team} />
          )}
        </div>
      </div>
    </div>
  )
}

function ReportView({ team }) {
  const score = team.score
  if (!score) {
    return <div className="aprt-modal-empty">No report available.</div>
  }
  return (
    <div className="aprt-modal-section">
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Overall Score</span>
        <span className="aprt-modal-v" style={{ color: getScoreColor(score.overall), fontWeight: 800, fontSize: '1.2rem' }}>
          {score.overall} / 100
        </span>
      </div>
      {score.breakdown && Object.keys(score.breakdown).length > 0 && (
        <>
          <div className="aprt-modal-divider">Breakdown</div>
          {Object.entries(score.breakdown).map(([k, v]) => (
            <div key={k} className="aprt-modal-row">
              <span className="aprt-modal-k">{formatBreakdown(k)}</span>
              <span className="aprt-modal-v" style={{ color: getScoreColor(v) }}>{v}</span>
            </div>
          ))}
        </>
      )}
      {score.summary && (
        <>
          <div className="aprt-modal-divider">Summary</div>
          <p className="aprt-modal-summary">{score.summary}</p>
        </>
      )}
      <div className="aprt-modal-divider">Metadata</div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">AI Model</span>
        <span className="aprt-modal-v">{score.ai_model || '—'}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Cost</span>
        <span className="aprt-modal-v" style={{ color: '#EEA727' }}>
          ${score.cost_usd?.toFixed(4) || '0.0000'}
        </span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Reviewed At</span>
        <span className="aprt-modal-v">
          {score.reviewed_at ? new Date(score.reviewed_at).toLocaleString() : '—'}
        </span>
      </div>
    </div>
  )
}

function SubmissionView({ team }) {
  return (
    <div className="aprt-modal-section">
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Title</span>
        <span className="aprt-modal-v">{team.project_title || '—'}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">GitHub</span>
        {team.github_url ? (
          <a href={team.github_url} target="_blank" rel="noopener noreferrer" className="aprt-modal-link">
            {team.github_url.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="aprt-modal-v">—</span>
        )}
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Project Type</span>
        <span className="aprt-modal-v">{team.project_type || '—'}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Technology</span>
        <span className="aprt-modal-v">{team.technology}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Batch</span>
        <span className="aprt-modal-v">{team.batch}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Mentor</span>
        <span className="aprt-modal-v">{team.mentor || '—'}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Leader Roll</span>
        <span className="aprt-modal-v">{team.leader_roll || '—'}</span>
      </div>
      <div className="aprt-modal-row">
        <span className="aprt-modal-k">Submitted At</span>
        <span className="aprt-modal-v">
          {team.submitted_at ? new Date(team.submitted_at).toLocaleString() : '—'}
        </span>
      </div>
      {team.failure_reason && (
        <>
          <div className="aprt-modal-divider">Failure Reason</div>
          <p className="aprt-modal-summary" style={{ color: '#fd1c00' }}>
            {team.failure_reason}
          </p>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#EEA727'
  if (score >= 40) return '#fd1c00'
  return '#7B2FBE'
}
function formatBreakdown(k) {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
function sortIndicator(currentKey, dir, key) {
  if (currentKey !== key) return <span className="aprt-sort-ind"> </span>
  return <span className="aprt-sort-ind">{dir === 'asc' ? '▲' : '▼'}</span>
}

// ─────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}
function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function SpinnerSmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" className="aprt-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function CheckIconSm() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function XIconSm() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function DashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="11" height="11">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES (aprt- prefix)
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.aprt-wrap{font-family:'DM Sans',sans-serif;animation:aprtIn .3s ease both}
@keyframes aprtIn{from{opacity:0}to{opacity:1}}

/* Empty state */
.aprt-empty{padding:60px 24px;text-align:center;border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;align-items:center;gap:12px}
.aprt-empty-icon{width:60px;height:60px;border-radius:14px;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.3)}
.aprt-empty-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.95rem;font-weight:800;color:rgba(255,255,255,.7);letter-spacing:1px;text-transform:uppercase}
.aprt-empty-msg{font-size:.82rem;color:rgba(255,255,255,.45)}

/* Toolbar */
.aprt-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:11px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);margin-bottom:10px;flex-wrap:wrap}
.aprt-search-wrap{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:7px 12px;flex:1;min-width:240px;transition:all .2s}
.aprt-search-wrap:focus-within{border-color:rgba(253,28,0,.4);background:rgba(253,28,0,.04)}
.aprt-search-wrap svg{color:rgba(255,255,255,.4);flex-shrink:0}
.aprt-search{flex:1;background:transparent;border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.82rem;outline:none;padding:0}
.aprt-search::placeholder{color:rgba(255,255,255,.3)}
.aprt-result-info{font-size:.72rem;color:rgba(255,255,255,.45);font-weight:600;letter-spacing:.5px}

/* Action message */
.aprt-action-msg{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:.82rem;font-weight:500;margin-bottom:12px;animation:aprtFlash .3s ease both}
@keyframes aprtFlash{from{transform:translateY(-6px);opacity:0}to{transform:none;opacity:1}}
.aprt-action-success{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);color:#4ade80}
.aprt-action-error{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);color:#fd1c00}

/* Table */
.aprt-tbl-wrap{border-radius:12px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);overflow:auto}
.aprt-tbl{width:100%;border-collapse:collapse;font-size:.82rem}
.aprt-tbl thead th{padding:14px 14px;text-align:left;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.6rem;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:1.4px;text-transform:uppercase;background:linear-gradient(135deg,rgba(253,28,0,.04),transparent);border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;user-select:none;white-space:nowrap}
.aprt-tbl thead th:hover{color:#fff;background:rgba(253,28,0,.06)}
.aprt-th-act{cursor:default;width:50px}
.aprt-th-act:hover{background:transparent;color:rgba(255,255,255,.5)}

.aprt-row{border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
.aprt-row:hover{background:rgba(255,255,255,.02)}
.aprt-row.aprt-acting{opacity:.5;pointer-events:none}
.aprt-row td{padding:13px 14px;color:rgba(255,255,255,.85);vertical-align:middle}
.aprt-td-team{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-weight:800;color:#EEA727;letter-spacing:.5px;white-space:nowrap}
.aprt-td-title{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aprt-td-tech{color:rgba(255,255,255,.7);font-weight:500;white-space:nowrap}
.aprt-batch-tag{display:inline-block;padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:.7rem;color:rgba(255,255,255,.65);font-weight:500;letter-spacing:.2px;white-space:nowrap}
.aprt-td-status{white-space:nowrap}
.aprt-td-score{text-align:right;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;letter-spacing:.5px}
.aprt-td-act{text-align:right;width:50px}
.aprt-score{font-family:'Astro','Orbitron','DM Sans',sans-serif}
.aprt-dash{color:rgba(255,255,255,.3)}
.aprt-sort-ind{font-size:.55rem;margin-left:3px;color:rgba(238,167,39,.7)}

/* Status badge */
.aprt-status-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.aprt-status-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;font-size:.66rem;font-weight:600;letter-spacing:.4px;border:1px solid;white-space:nowrap}
.aprt-mini-tag{padding:2px 6px;border-radius:4px;background:rgba(123,47,190,.15);color:#a78bfa;font-size:.55rem;font-weight:800;letter-spacing:1px;border:1px solid rgba(123,47,190,.3)}

/* Action menu */
.aprt-act-wrap{position:relative;display:inline-block}
.aprt-act-btn{background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:7px;color:rgba(255,255,255,.5);padding:5px 8px;cursor:pointer;transition:all .15s}
.aprt-act-btn:hover{background:rgba(255,255,255,.05);color:#fff;border-color:rgba(255,255,255,.15)}
.aprt-act-btn:disabled{opacity:.4;cursor:not-allowed}
.aprt-menu{position:absolute;top:calc(100% + 4px);right:0;min-width:180px;border-radius:9px;background:#0a0612;border:1px solid rgba(255,255,255,.1);box-shadow:0 10px 32px rgba(0,0,0,.6);z-index:9999;overflow:hidden;animation:aprtMenuIn .15s ease both}
@keyframes aprtMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.aprt-menu-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 14px;background:transparent;border:none;color:rgba(255,255,255,.75);font-family:'DM Sans',sans-serif;font-size:.78rem;text-align:left;cursor:pointer;transition:all .15s;text-decoration:none}
.aprt-menu-item:hover{background:rgba(253,28,0,.08);color:#fff}
.aprt-menu-item:disabled{opacity:.4;cursor:not-allowed}
.aprt-menu-danger{color:rgba(253,28,0,.8)}
.aprt-menu-danger:hover{background:rgba(253,28,0,.12);color:#fd1c00}
.aprt-menu-item svg{flex-shrink:0;color:currentColor}

/* Modal */
.aprt-modal-bg{position:fixed;inset:0;background:rgba(5,0,8,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;animation:aprtBgIn .2s ease both}
@keyframes aprtBgIn{from{opacity:0}to{opacity:1}}
.aprt-modal{background:#0a0612;border:1px solid rgba(255,255,255,.1);border-radius:16px;width:100%;max-width:640px;max-height:85vh;display:flex;flex-direction:column;animation:aprtModalIn .25s ease both;box-shadow:0 24px 64px rgba(0,0,0,.6)}
@keyframes aprtModalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
.aprt-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.06)}
.aprt-modal-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.9rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}
.aprt-modal-sub{font-size:.78rem;color:rgba(255,255,255,.5)}
.aprt-modal-x{background:transparent;border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(255,255,255,.5);padding:6px;cursor:pointer;transition:all .15s;display:flex}
.aprt-modal-x:hover{background:rgba(253,28,0,.08);color:#fd1c00;border-color:rgba(253,28,0,.3)}
.aprt-modal-body{padding:20px 24px;overflow-y:auto;flex:1}
.aprt-modal-section{display:flex;flex-direction:column;gap:8px}
.aprt-modal-row{display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.aprt-modal-k{font-size:.72rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;flex-shrink:0;min-width:120px}
.aprt-modal-v{font-size:.85rem;color:#fff;text-align:right;word-break:break-word}
.aprt-modal-link{color:#EEA727;text-decoration:none;font-size:.82rem;text-align:right;word-break:break-all}
.aprt-modal-link:hover{text-decoration:underline}
.aprt-modal-divider{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.65rem;font-weight:800;color:#EEA727;letter-spacing:1.4px;text-transform:uppercase;margin-top:12px;padding-top:12px;border-top:1px solid rgba(238,167,39,.15)}
.aprt-modal-summary{font-size:.85rem;color:rgba(255,255,255,.85);line-height:1.6;margin:0;padding:8px 0}
.aprt-modal-empty{padding:30px;text-align:center;color:rgba(255,255,255,.5);font-size:.85rem}

.aprt-spin{animation:aprtSpin 1s linear infinite}
@keyframes aprtSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Mobile */
@media(max-width:740px){
  .aprt-tbl thead th{font-size:.55rem;padding:10px 8px}
  .aprt-tbl tbody td{padding:10px 8px;font-size:.76rem}
  .aprt-td-title{max-width:140px}
  .aprt-tbl-wrap{margin-left:-10px;margin-right:-10px;border-radius:0;border-left:none;border-right:none}
}
@media(max-width:480px){
  .aprt-modal{max-height:100vh;border-radius:0}
  .aprt-modal-head{padding:16px 18px}
  .aprt-modal-body{padding:16px 18px}
  .aprt-modal-row{flex-direction:column;gap:4px;align-items:flex-start}
  .aprt-modal-v{text-align:left}
}
`