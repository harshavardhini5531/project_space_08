// app/mentor/dashboard/components/MentorEvaluation.js
//
// Mentor's project evaluation page.
// 2-col grid of team cards, each with 4 actions:
//   1. Evaluate Project  → opens form view
//   2. View AI Report    → expands inline below the card
//   3. View Documentation→ modal with all 13 submitted form fields
//   4. Git Repo          → opens GitHub URL in new tab

'use client'
import { useState, useEffect } from 'react'

const RUBRIC_CRITERIA = [
  { key: 'innovation', label: 'Innovation & Originality', description: 'How original and creative is the project idea?' },
  { key: 'technical', label: 'Technical Execution', description: 'Code quality, architecture, system design.' },
  { key: 'uiux', label: 'UI / UX Quality', description: 'Visual design, user experience, polish.' },
  { key: 'relevance', label: 'Problem Relevance', description: 'Does it address a real, meaningful problem?' },
  { key: 'demo', label: 'Demo Quality', description: 'Demo flow, clarity, working features.' },
  { key: 'documentation', label: 'Documentation', description: 'README, code comments, setup instructions.' },
]

const DOC_FIELDS = [
  { key: 'name', label: 'Project Name' },
  { key: 'description', label: 'Description' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'problem_statement', label: 'Problem Statement' },
  { key: 'proposed_solution', label: 'Proposed Solution' },
  { key: 'system_architecture', label: 'System Architecture' },
  { key: 'in_scope', label: 'In Scope' },
  { key: 'out_scope', label: 'Out of Scope' },
  { key: 'future_enhancements', label: 'Future Enhancements' },
  { key: 'conclusion', label: 'Conclusion' },
]

export default function MentorEvaluation({ mentor }) {
  const [view, setView] = useState('list')
  const [selectedTeamNumber, setSelectedTeamNumber] = useState(null)

  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [listData, setListData] = useState(null)

  // For inline AI report expansion
  const [expandedReportTeam, setExpandedReportTeam] = useState(null)

  // For doc modal
  const [docModalTeam, setDocModalTeam] = useState(null)

  async function fetchList() {
    setListLoading(true); setListError(null)
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
      const r = await fetch('/api/mentor/evaluations/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mentor-token': token || '' },
        body: JSON.stringify({ mentorEmail: mentor?.email }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setListError(d.error || `Request failed (${r.status})`)
        return
      }
      setListData(d)
    } catch (e) {
      setListError('Network error: ' + e.message)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'list') fetchList()
    // eslint-disable-next-line
  }, [view, mentor?.email])

  function openForm(teamNumber) {
    setSelectedTeamNumber(teamNumber)
    setView('form')
  }

  function backToList() {
    setSelectedTeamNumber(null)
    setView('list')
  }

  function toggleReport(teamNumber) {
    setExpandedReportTeam(prev => prev === teamNumber ? null : teamNumber)
  }

  return (
    <div className="ev-section">
      <Styles />

      {view === 'list' && (
        <ListView
          loading={listLoading}
          error={listError}
          data={listData}
          onEvaluate={openForm}
          onRefresh={fetchList}
          expandedReportTeam={expandedReportTeam}
          onToggleReport={toggleReport}
          onOpenDoc={setDocModalTeam}
        />
      )}

      {view === 'form' && selectedTeamNumber && (
        <FormView
          mentor={mentor}
          teamNumber={selectedTeamNumber}
          onBack={backToList}
          onSubmitted={() => { fetchList(); backToList() }}
        />
      )}

      {docModalTeam && (
        <DocModal team={docModalTeam} onClose={() => setDocModalTeam(null)} />
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// LIST VIEW — 2 column grid of team cards
// ════════════════════════════════════════════
function ListView({ loading, error, data, onEvaluate, onRefresh, expandedReportTeam, onToggleReport, onOpenDoc }) {
  if (loading) return <div className="ev-loading">Loading your teams…</div>
  if (error) {
    return (
      <div className="ev-error">
        <div className="ev-error-h">Could not load teams</div>
        <div className="ev-error-m">{error}</div>
        <button className="ev-btn-sm" onClick={onRefresh}>Retry</button>
      </div>
    )
  }

  const teams = data?.teams || []
  const stats = data?.stats || { total: 0, evaluated: 0, pending: 0 }

  return (
    <div className="ev-list">
      <div className="ev-hdr">
        <div>
          <div className="ev-title">Project Evaluation</div>
          <div className="ev-sub">Review, document & evaluate your assigned teams.</div>
        </div>
        <div className="ev-stats">
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#fd1c00' }}>{stats.total}</span><span className="ev-stat-l">Total</span></div>
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#4ade80' }}>{stats.evaluated}</span><span className="ev-stat-l">Evaluated</span></div>
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#EEA727' }}>{stats.pending}</span><span className="ev-stat-l">Pending</span></div>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="ev-empty">No teams assigned to you yet. If you expect teams here, contact admin.</div>
      )}

      {teams.length > 0 && (
        <div className="ev-grid">
          {teams.map(t => {
            const sub = t.submission
            const isReportOpen = expandedReportTeam === t.team_number
            return (
              <div key={t.team_number} className="ev-card-wrap">
                <div className={`ev-card ${t.evaluated ? 'evaluated' : 'pending'}`}>
                  <div className="ev-card-top">
                    <span className="ev-team-num">{t.team_number}</span>
                    {t.evaluated ? (
                      <span className="ev-badge ok">✓ {Number(t.average_score).toFixed(1)}/10</span>
                    ) : (
                      <span className="ev-badge pending">Pending</span>
                    )}
                  </div>
                  <div className="ev-card-title">{t.project_title}</div>
                  <div className="ev-card-meta">
                    <span className="ev-card-tech">{t.technology}</span>
                    <span className="ev-card-leader">★ {t.leader_name}</span>
                  </div>

                  <div className="ev-actions">
                    <button className="ev-act ev-act-eval" onClick={() => onEvaluate(t.team_number)}>
                      <span className="ev-act-ico">✎</span>
                      <span className="ev-act-l">{t.evaluated ? 'Edit Evaluation' : 'Evaluate Project'}</span>
                    </button>
                    <button
                      className={`ev-act ev-act-ai ${isReportOpen ? 'active' : ''}`}
                      onClick={() => onToggleReport(t.team_number)}
                    >
                      <span className="ev-act-ico">⊕</span>
                      <span className="ev-act-l">{isReportOpen ? 'Hide AI Report' : 'View AI Report'}</span>
                    </button>
                    {sub ? (
                      <button className="ev-act ev-act-doc" onClick={() => onOpenDoc(t)}>
                        <span className="ev-act-ico">📄</span>
                        <span className="ev-act-l">View Documentation</span>
                      </button>
                    ) : (
                      <button className="ev-act ev-act-doc disabled" disabled title="Team has not submitted project review yet">
                        <span className="ev-act-ico">📄</span>
                        <span className="ev-act-l">No Submission</span>
                      </button>
                    )}
                    {sub?.github_url ? (
                      <a className="ev-act ev-act-git" href={sub.github_url} target="_blank" rel="noopener noreferrer">
                        <span className="ev-act-ico">⎇</span>
                        <span className="ev-act-l">Git Repo</span>
                      </a>
                    ) : (
                      <button className="ev-act ev-act-git disabled" disabled title="No GitHub URL submitted">
                        <span className="ev-act-ico">⎇</span>
                        <span className="ev-act-l">No Repo</span>
                      </button>
                    )}
                  </div>
                </div>

                {isReportOpen && (
                  <InlineAIReport teamNumber={t.team_number} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// INLINE AI REPORT (expands below team card)
// ════════════════════════════════════════════
function InlineAIReport({ teamNumber }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const r = await fetch('/api/project-review/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamNumber }),
        })
        const d = await r.json()
        if (cancelled) return
        if (!r.ok || !d.ok) {
          setError(d.error || `Request failed (${r.status})`)
          return
        }
        setData(d)
      } catch (e) {
        if (!cancelled) setError('Network error: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [teamNumber])

  if (loading) return <div className="ev-air-loading">Loading AI report…</div>
  if (error) return <div className="ev-air-err">{error}</div>
  if (!data?.has_reports) return <div className="ev-air-empty">No AI review yet for this team. Check back after the next AI run.</div>

  const { latest, total_runs } = data
  return (
    <div className="ev-air">
      <div className="ev-air-top">
        <div className="ev-air-score">
          <span className="ev-air-score-v">{latest.overall_score ?? '—'}</span>
          <span className="ev-air-score-suf">/100</span>
        </div>
        <div className="ev-air-meta">
          <div>Run #{latest.run_index} · {total_runs} total runs</div>
          <div className="ev-air-meta-sub">{fmtDate(latest.completed_at)}</div>
        </div>
      </div>

      <div className="ev-air-scores">
        {Object.entries(latest.scores || {}).map(([k, v]) => (
          <div key={k} className="ev-air-cell">
            <span className="ev-air-cell-l">{k.replace(/_/g, ' ')}</span>
            <span className="ev-air-cell-v">{v ?? '—'}</span>
          </div>
        ))}
      </div>

      {latest.feedback?.summary && (
        <div className="ev-air-sum">{latest.feedback.summary}</div>
      )}

      {latest.strengths?.length > 0 && (
        <div className="ev-air-block ev-air-strengths">
          <div className="ev-air-block-h">✓ Strengths</div>
          <ol>{latest.strengths.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}

      {latest.improvements?.length > 0 && (
        <div className="ev-air-block ev-air-improvements">
          <div className="ev-air-block-h">💡 Improvements</div>
          <ol>{latest.improvements.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// DOC MODAL — shows all 13 submitted form fields
// ════════════════════════════════════════════
function DocModal({ team, onClose }) {
  const sub = team.submission
  if (!sub) return null

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <div className="ev-modal-hdr">
          <div>
            <div className="ev-modal-tag">{team.team_number} · Submitted {fmtDate(sub.submitted_at)}</div>
            <div className="ev-modal-title">{sub.name}</div>
            <div className="ev-modal-sub">By {sub.submitted_by_name || '—'} · Status: <span className={`ev-status-${sub.status}`}>{sub.status}</span></div>
          </div>
          <button className="ev-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ev-modal-body">
          {sub.github_url && (
            <div className="ev-modal-section">
              <div className="ev-modal-l">GitHub Repository</div>
              <a className="ev-modal-link" href={sub.github_url} target="_blank" rel="noopener noreferrer">
                {sub.github_url} ↗
              </a>
            </div>
          )}

          {(sub.technologies_used || []).length > 0 && (
            <div className="ev-modal-section">
              <div className="ev-modal-l">Technologies Used</div>
              <div className="ev-modal-tags">
                {sub.technologies_used.map((t, i) => <span key={i} className="ev-modal-tag-pill">{t}</span>)}
              </div>
            </div>
          )}

          {DOC_FIELDS.map(f => (
            sub[f.key] ? (
              <div key={f.key} className="ev-modal-section">
                <div className="ev-modal-l">{f.label}</div>
                <div className="ev-modal-v">{sub[f.key]}</div>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// FORM VIEW — number inputs, no scroll, mobile-ready
// ════════════════════════════════════════════
function FormView({ mentor, teamNumber, onBack, onSubmitted }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [team, setTeam] = useState(null)
  const [scores, setScores] = useState({
    innovation: 5, technical: 5, uiux: 5, relevance: 5, demo: 5, documentation: 5,
  })
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
        const r = await fetch('/api/mentor/evaluations/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-mentor-token': token || '' },
          body: JSON.stringify({ mentorEmail: mentor?.email, teamNumber }),
        })
        const d = await r.json()
        if (cancelled) return
        if (!r.ok || !d.ok) {
          setError(d.error || `Request failed (${r.status})`)
          return
        }
        setTeam(d.team)
        if (d.evaluation) {
          setScores({
            innovation: d.evaluation.innovation_score,
            technical: d.evaluation.technical_score,
            uiux: d.evaluation.uiux_score,
            relevance: d.evaluation.relevance_score,
            demo: d.evaluation.demo_score,
            documentation: d.evaluation.documentation_score,
          })
          setComments(d.evaluation.comments || '')
        }
      } catch (e) {
        if (!cancelled) setError('Network error: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [mentor?.email, teamNumber])

  function setScore(key, val) {
    let n = parseFloat(val)
    if (isNaN(n)) n = 0
    n = Math.max(0, Math.min(10, n))
    n = Math.round(n * 10) / 10  // allow 1 decimal
    setScores(prev => ({ ...prev, [key]: n }))
  }

  const avg = (
    (Number(scores.innovation) + Number(scores.technical) + Number(scores.uiux) +
     Number(scores.relevance) + Number(scores.demo) + Number(scores.documentation)) / 6
  ).toFixed(2)

  async function handleSubmit() {
    // Mandatory comments
    if (!comments.trim()) {
      setSubmitMsg({ ok: false, text: 'Comments are mandatory. Please share feedback for the team.' })
      return
    }
    if (comments.trim().length < 20) {
      setSubmitMsg({ ok: false, text: 'Please provide more detailed comments (at least 20 characters).' })
      return
    }

    setSubmitting(true); setSubmitMsg(null)
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
      const r = await fetch('/api/mentor/evaluations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mentor-token': token || '' },
        body: JSON.stringify({
          mentorEmail: mentor?.email,
          teamNumber,
          scores,
          comments: comments.trim(),
        }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setSubmitMsg({ ok: false, text: d.error || `Submit failed (${r.status})` })
        return
      }
      setSubmitMsg({ ok: true, text: d.message || 'Saved successfully!' })
      setTimeout(() => { onSubmitted && onSubmitted() }, 1500)
    } catch (e) {
      setSubmitMsg({ ok: false, text: 'Network error: ' + e.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="ev-loading">Loading team details…</div>
  if (error) {
    return (
      <div className="ev-error">
        <button className="ev-btn-sm" onClick={onBack}>← Back</button>
        <div className="ev-error-h">Error</div>
        <div className="ev-error-m">{error}</div>
      </div>
    )
  }
  if (!team) return null

  return (
    <div className="ev-form">
      <button className="ev-back" onClick={onBack}>← Back to Teams</button>

      <div className="ev-form-hdr">
        <div className="ev-form-hdr-tag">{team.team_number} · {team.technology}</div>
        <div className="ev-form-hdr-title">{team.project_title}</div>
        <div className="ev-form-hdr-meta">★ {team.leader_name} · {(team.members || []).length} members</div>
      </div>

      <div className="ev-rubric-grid">
        {RUBRIC_CRITERIA.map(c => (
          <div key={c.key} className="ev-rubric-cell">
            <div className="ev-rc-l">{c.label}</div>
            <div className="ev-rc-d">{c.description}</div>
            <div className="ev-rc-input">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={scores[c.key]}
                onChange={e => setScore(c.key, e.target.value)}
                onBlur={e => setScore(c.key, e.target.value)}
                className="ev-num-input"
              />
              <span className="ev-num-suf">/10</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ev-avg-row">
        <div className="ev-avg-l">Overall Average</div>
        <div className="ev-avg-v">{avg}<span className="ev-avg-suf">/10</span></div>
      </div>

      <div className="ev-comments">
        <label className="ev-comments-l">
          Comments / Feedback <span className="ev-required">*required</span>
        </label>
        <textarea
          className="ev-textarea"
          rows={4}
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Share strengths, areas for improvement, and suggestions for the team (minimum 20 characters)..."
          maxLength={5000}
        />
        <div className="ev-char-count">
          <span className={comments.trim().length < 20 ? 'low' : 'ok'}>
            {comments.trim().length} characters {comments.trim().length < 20 && '(min 20)'}
          </span>
          <span>{comments.length} / 5000</span>
        </div>
      </div>

      <button className="ev-submit" onClick={handleSubmit} disabled={submitting}>
        {submitting ? '⏳ Saving…' : '✓ Submit Evaluation'}
      </button>

      {submitMsg && (
        <div className={`ev-msg ${submitMsg.ok ? 'ok' : 'err'}`}>{submitMsg.text}</div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

// ════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════
function Styles() {
  return (
    <style>{`
      .ev-section{font-family:'DM Sans',sans-serif;color:#fff;animation:evIn .4s ease both}
      @keyframes evIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

      .ev-loading{padding:60px 20px;text-align:center;color:rgba(255,255,255,.4);font-size:.85rem}
      .ev-error{padding:24px;border-radius:14px;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);color:#fd1c00}
      .ev-error-h{font-weight:700;font-size:.95rem;margin-bottom:6px}
      .ev-error-m{font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:10px}
      .ev-empty{padding:30px;text-align:center;color:rgba(255,255,255,.45);background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.1);border-radius:14px}

      /* HEADER */
      .ev-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:14px}
      .ev-title{font-size:1.3rem;font-weight:800;letter-spacing:-.01em}
      .ev-sub{font-size:.72rem;color:rgba(255,255,255,.45);margin-top:3px}
      .ev-stats{display:flex;gap:8px}
      .ev-stat{display:flex;flex-direction:column;align-items:center;padding:8px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);min-width:75px}
      .ev-stat-v{font-family:'DM Sans',sans-serif;font-size:1.3rem;font-weight:800;line-height:1}
      .ev-stat-l{font-size:.58rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:600;margin-top:3px}

      /* GRID — 2 columns desktop, 1 on mobile */
      .ev-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
      .ev-card-wrap{display:flex;flex-direction:column;gap:0}
      .ev-card{padding:18px 20px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:10px;transition:all .2s}
      .ev-card.evaluated{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.03)}
      .ev-card.pending{border-color:rgba(238,167,39,.18)}

      .ev-card-top{display:flex;justify-content:space-between;align-items:center}
      .ev-team-num{font-weight:800;color:#fd1c00;font-size:.9rem;letter-spacing:.5px}
      .ev-badge{padding:3px 10px;border-radius:6px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .ev-badge.ok{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
      .ev-badge.pending{background:rgba(238,167,39,.12);color:#EEA727;border:1px solid rgba(238,167,39,.3)}
      .ev-card-title{font-size:1rem;font-weight:700;line-height:1.35;margin:2px 0}
      .ev-card-meta{display:flex;gap:8px;font-size:.65rem;color:rgba(255,255,255,.55);flex-wrap:wrap}
      .ev-card-tech,.ev-card-leader{padding:3px 9px;border-radius:5px;background:rgba(255,255,255,.04);white-space:nowrap}

      /* 4-button action grid (2x2 on desktop, full width stack on mobile) */
      .ev-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:6px}
      .ev-act{padding:10px 12px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;text-align:left;border:1px solid;transition:all .15s;text-decoration:none;display:flex;align-items:center;gap:7px;background:transparent}
      .ev-act-ico{font-size:.95rem;flex-shrink:0;width:18px;text-align:center}
      .ev-act-l{flex:1;line-height:1.2}
      .ev-act:hover:not(:disabled):not(.disabled){transform:translateY(-1px)}

      .ev-act-eval{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.3);color:#EEA727}
      .ev-act-eval:hover{background:rgba(238,167,39,.18)}
      .ev-card.evaluated .ev-act-eval{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.3);color:#4ade80}

      .ev-act-ai{background:rgba(168,85,247,.06);border-color:rgba(168,85,247,.25);color:#c084fc}
      .ev-act-ai:hover{background:rgba(168,85,247,.15)}
      .ev-act-ai.active{background:rgba(168,85,247,.2);border-color:rgba(168,85,247,.5)}

      .ev-act-doc{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.25);color:#60a5fa}
      .ev-act-doc:hover{background:rgba(59,130,246,.18)}

      .ev-act-git{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.85)}
      .ev-act-git:hover{background:rgba(255,255,255,.1)}

      .ev-act.disabled,.ev-act:disabled{background:rgba(255,255,255,.02)!important;border-color:rgba(255,255,255,.06)!important;color:rgba(255,255,255,.3)!important;cursor:not-allowed}

      /* INLINE AI REPORT */
      .ev-air{margin-top:8px;padding:16px 18px;border-radius:12px;background:rgba(168,85,247,.04);border:1px solid rgba(168,85,247,.2);animation:airIn .3s ease}
      @keyframes airIn{from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
      .ev-air-loading,.ev-air-err,.ev-air-empty{margin-top:8px;padding:14px 16px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.55);font-size:.75rem;text-align:center}
      .ev-air-err{color:#fd1c00;background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.2)}
      .ev-air-top{display:flex;align-items:center;gap:14px;margin-bottom:14px}
      .ev-air-score{display:flex;align-items:baseline;gap:3px}
      .ev-air-score-v{font-size:2rem;font-weight:800;color:#c084fc;line-height:1}
      .ev-air-score-suf{font-size:.75rem;color:rgba(255,255,255,.4)}
      .ev-air-meta{font-size:.7rem;color:rgba(255,255,255,.7)}
      .ev-air-meta-sub{font-size:.62rem;color:rgba(255,255,255,.4);margin-top:2px}
      .ev-air-scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;margin-bottom:12px}
      .ev-air-cell{padding:7px 10px;background:rgba(255,255,255,.03);border-radius:7px;display:flex;justify-content:space-between;align-items:center}
      .ev-air-cell-l{font-size:.62rem;color:rgba(255,255,255,.6);text-transform:capitalize}
      .ev-air-cell-v{font-size:.85rem;font-weight:700;color:#EEA727}
      .ev-air-sum{padding:10px 12px;background:rgba(238,167,39,.06);border-left:3px solid #EEA727;border-radius:0 7px 7px 0;font-size:.75rem;line-height:1.55;color:rgba(255,255,255,.85);margin-bottom:10px}
      .ev-air-block{margin-top:10px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.02)}
      .ev-air-block-h{font-size:.72rem;font-weight:700;margin-bottom:6px}
      .ev-air-strengths{background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.18)}
      .ev-air-improvements{background:rgba(238,167,39,.04);border:1px solid rgba(238,167,39,.18)}
      .ev-air-block ol{margin:0;padding-left:20px;font-size:.72rem;line-height:1.55;color:rgba(255,255,255,.8)}
      .ev-air-block li{margin-bottom:4px}

      /* DOC MODAL */
      .ev-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .ev-modal{background:linear-gradient(135deg,#0f0a1a,#0a0612);border:1px solid rgba(255,255,255,.1);border-radius:16px;max-width:760px;width:100%;max-height:90vh;display:flex;flex-direction:column;animation:slideIn .25s ease;overflow:hidden}
      @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      .ev-modal-hdr{padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      .ev-modal-tag{font-size:.62rem;color:#fd1c00;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}
      .ev-modal-title{font-size:1.1rem;font-weight:800;line-height:1.3;letter-spacing:-.01em}
      .ev-modal-sub{font-size:.7rem;color:rgba(255,255,255,.55);margin-top:5px}
      .ev-status-pending,.ev-status-reviewing{color:#EEA727;text-transform:capitalize;font-weight:700}
      .ev-status-completed{color:#4ade80;text-transform:capitalize;font-weight:700}
      .ev-status-failed{color:#fd1c00;text-transform:capitalize;font-weight:700}
      .ev-modal-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#fff;width:32px;height:32px;border-radius:8px;font-size:1.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1}
      .ev-modal-close:hover{background:rgba(255,255,255,.12)}
      .ev-modal-body{padding:18px 22px;overflow-y:auto;flex:1}
      .ev-modal-section{margin-bottom:16px}
      .ev-modal-section:last-child{margin-bottom:0}
      .ev-modal-l{font-size:.62rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:5px}
      .ev-modal-v{font-size:.78rem;color:rgba(255,255,255,.85);line-height:1.6;white-space:pre-wrap;padding:9px 12px;background:rgba(255,255,255,.02);border-radius:7px;border:1px solid rgba(255,255,255,.04)}
      .ev-modal-link{font-size:.78rem;color:#60a5fa;text-decoration:none;word-break:break-all;padding:9px 12px;background:rgba(59,130,246,.06);border-radius:7px;border:1px solid rgba(59,130,246,.15);display:inline-block}
      .ev-modal-link:hover{background:rgba(59,130,246,.12)}
      .ev-modal-tags{display:flex;gap:6px;flex-wrap:wrap}
      .ev-modal-tag-pill{padding:4px 10px;background:rgba(238,167,39,.08);color:#EEA727;border-radius:5px;font-size:.68rem;font-weight:600}

      /* FORM VIEW */
      .ev-form{display:flex;flex-direction:column;gap:14px}
      .ev-back{align-self:flex-start;padding:7px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.72rem;font-weight:600;cursor:pointer}
      .ev-back:hover{background:rgba(255,255,255,.1)}
      .ev-form-hdr{padding:16px 20px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
      .ev-form-hdr-tag{font-size:.62rem;font-weight:800;color:#fd1c00;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}
      .ev-form-hdr-title{font-size:1.15rem;font-weight:800;line-height:1.3;margin-bottom:4px}
      .ev-form-hdr-meta{font-size:.7rem;color:rgba(255,255,255,.6)}

      .ev-rubric-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
      .ev-rubric-cell{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:6px}
      .ev-rc-l{font-size:.82rem;font-weight:700;color:#fff}
      .ev-rc-d{font-size:.62rem;color:rgba(255,255,255,.5);line-height:1.4}
      .ev-rc-input{display:flex;align-items:center;gap:6px;margin-top:4px}
      .ev-num-input{width:80px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#EEA727;font-family:'DM Sans',sans-serif;font-size:1.05rem;font-weight:800;text-align:center;outline:none;-moz-appearance:textfield}
      .ev-num-input:focus{border-color:#EEA727;background:rgba(238,167,39,.08)}
      .ev-num-input::-webkit-outer-spin-button,.ev-num-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      .ev-num-suf{font-size:.78rem;color:rgba(255,255,255,.4);font-weight:600}

      .ev-avg-row{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:11px;background:linear-gradient(135deg,rgba(74,222,128,.06),rgba(238,167,39,.04));border:1px solid rgba(74,222,128,.2)}
      .ev-avg-l{font-size:.78rem;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1.1px}
      .ev-avg-v{font-size:1.6rem;font-weight:800;color:#4ade80;line-height:1}
      .ev-avg-suf{font-size:.85rem;color:rgba(255,255,255,.4);font-weight:600;margin-left:3px}

      .ev-comments{display:flex;flex-direction:column;gap:6px;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
      .ev-comments-l{font-size:.7rem;color:rgba(255,255,255,.7);font-weight:700;display:flex;align-items:center;gap:8px}
      .ev-required{font-size:.62rem;color:#fd1c00;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
      .ev-textarea{width:100%;padding:11px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.82rem;resize:vertical;outline:none;line-height:1.5;box-sizing:border-box;min-height:90px}
      .ev-textarea:focus{border-color:rgba(238,167,39,.4)}
      .ev-char-count{display:flex;justify-content:space-between;font-size:.62rem;color:rgba(255,255,255,.4)}
      .ev-char-count .low{color:#fd1c00;font-weight:700}
      .ev-char-count .ok{color:#4ade80}

      .ev-submit{align-self:flex-end;padding:13px 30px;border-radius:10px;background:linear-gradient(135deg,#EEA727,#fd1c00);border:none;color:#fff;font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 4px 16px rgba(238,167,39,.25)}
      .ev-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(238,167,39,.4)}
      .ev-submit:disabled{opacity:.6;cursor:not-allowed;transform:none}
      .ev-msg{padding:11px 16px;border-radius:9px;font-size:.78rem;font-weight:600}
      .ev-msg.ok{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
      .ev-msg.err{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}

      .ev-btn-sm{padding:6px 14px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;cursor:pointer;font-weight:600}

      /* MOBILE */
      @media (max-width: 900px) {
        .ev-grid{grid-template-columns:1fr;gap:14px}
        .ev-actions{grid-template-columns:1fr 1fr}
        .ev-rubric-grid{grid-template-columns:1fr;gap:8px}
        .ev-stats{flex-wrap:wrap}
        .ev-form-hdr-title{font-size:1rem}
        .ev-modal{max-height:95vh}
        .ev-modal-hdr{padding:14px 16px}
        .ev-modal-body{padding:14px 16px}
        .ev-modal-title{font-size:1rem}
      }
      @media (max-width: 480px) {
        .ev-actions{grid-template-columns:1fr}
        .ev-act{justify-content:center}
        .ev-rubric-cell{padding:12px 14px}
        .ev-num-input{width:70px;font-size:.95rem}
        .ev-submit{align-self:stretch}
        .ev-avg-l{font-size:.7rem}
        .ev-avg-v{font-size:1.3rem}
      }
    `}</style>
  )
}