// app/mentor/dashboard/components/MentorEvaluation.js
//
// Mentor's project evaluation page.
// Two views:
//   1. LIST view: cards of assigned teams with eval status (default)
//   2. FORM view: rubric (6 criteria, 0-10) + comments + submit (when team clicked)
//
// API:
//   POST /api/mentor/evaluations/teams       — list teams + eval status
//   POST /api/mentor/evaluations/team        — get one team + existing eval
//   POST /api/mentor/evaluations/submit      — upsert eval

'use client'
import { useState, useEffect } from 'react'

const RUBRIC_CRITERIA = [
  {
    key: 'innovation',
    label: 'Innovation & Originality',
    description: 'How original and creative is the project idea? Does it solve the problem in a novel way?',
  },
  {
    key: 'technical',
    label: 'Technical Execution',
    description: 'Quality of code, architecture, system design. Is it well-engineered and robust?',
  },
  {
    key: 'uiux',
    label: 'UI / UX Quality',
    description: 'Visual design, user experience, ease of use, polish, attention to detail.',
  },
  {
    key: 'relevance',
    label: 'Problem Relevance',
    description: 'Does the project address a real, meaningful problem? Is the solution practical?',
  },
  {
    key: 'demo',
    label: 'Demo Quality',
    description: 'Demo flow, clarity, ability to communicate value, working features shown.',
  },
  {
    key: 'documentation',
    label: 'Documentation',
    description: 'README quality, code comments, setup instructions, technical clarity.',
  },
]

export default function MentorEvaluation({ mentor }) {
  const [view, setView] = useState('list') // 'list' | 'form'
  const [selectedTeamNumber, setSelectedTeamNumber] = useState(null)

  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [listData, setListData] = useState(null)

  // ── Fetch list view ──
  async function fetchList() {
    setListLoading(true); setListError(null)
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
      const r = await fetch('/api/mentor/evaluations/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mentor-token': token || '',
        },
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

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="ev-section">
      <Styles />

      {view === 'list' && (
        <ListView
          loading={listLoading}
          error={listError}
          data={listData}
          onSelectTeam={openForm}
          onRefresh={fetchList}
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
    </div>
  )
}

// ════════════════════════════════════════════
// LIST VIEW
// ════════════════════════════════════════════
function ListView({ loading, error, data, onSelectTeam, onRefresh }) {
  if (loading) {
    return <div className="ev-loading">Loading your teams…</div>
  }
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
          <div className="ev-sub">Score and provide feedback for your assigned teams.</div>
        </div>
        <div className="ev-stats">
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#fd1c00' }}>{stats.total}</span><span className="ev-stat-l">Total</span></div>
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#4ade80' }}>{stats.evaluated}</span><span className="ev-stat-l">Evaluated</span></div>
          <div className="ev-stat"><span className="ev-stat-v" style={{ color: '#EEA727' }}>{stats.pending}</span><span className="ev-stat-l">Pending</span></div>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="ev-empty">
          No teams assigned to you yet. If you expect teams here, contact admin.
        </div>
      )}

      {teams.length > 0 && (
        <div className="ev-grid">
          {teams.map(t => (
            <div
              key={t.team_number}
              className={`ev-card ${t.evaluated ? 'evaluated' : 'pending'}`}
            >
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
              <div className="ev-card-buttons">
                {t.github_url ? (
                  
                    className="ev-btn-doc"
                    href={t.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title={t.submitted_name ? `Submitted as: ${t.submitted_name}` : 'View submitted documentation'}
                  >
                    📄 View Documentation
                  </a>
                ) : (
                  <span className="ev-btn-doc disabled" title="Team has not submitted project review yet">
                    📄 No submission yet
                  </span>
                )}
                <button
                  className="ev-btn-eval"
                  onClick={() => onSelectTeam(t.team_number)}
                >
                  {t.evaluated ? 'Edit Evaluation →' : 'Evaluate Now →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// FORM VIEW
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

  // ── Fetch team + existing eval ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
        const r = await fetch('/api/mentor/evaluations/team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-mentor-token': token || '',
          },
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
    const n = Math.max(0, Math.min(10, Number(val) || 0))
    setScores(prev => ({ ...prev, [key]: n }))
  }

  const avg = (
    (scores.innovation + scores.technical + scores.uiux +
     scores.relevance + scores.demo + scores.documentation) / 6
  ).toFixed(2)

  async function handleSubmit() {
    setSubmitting(true); setSubmitMsg(null)
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
      const r = await fetch('/api/mentor/evaluations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mentor-token': token || '',
        },
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
      // Auto return to list after 1.5s
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
      <button className="ev-back" onClick={onBack}>← Back to List</button>

      {/* Project header */}
      <div className="ev-proj">
        <div className="ev-proj-num">{team.team_number}</div>
        <div className="ev-proj-title">{team.project_title}</div>
        <div className="ev-proj-meta">
          <span className="ev-meta-pill">{team.technology}</span>
          <span className="ev-meta-pill">★ {team.leader_name}</span>
          <span className="ev-meta-pill">{(team.members || []).length} members</span>
        </div>
        {team.project_description && (
          <div className="ev-proj-desc">{team.project_description}</div>
        )}
        {team.problem_statement && (
          <div className="ev-proj-section">
            <div className="ev-proj-section-l">Problem Statement</div>
            <div className="ev-proj-section-v">{team.problem_statement}</div>
          </div>
        )}
        {(team.tech_stack || []).length > 0 && (
          <div className="ev-proj-section">
            <div className="ev-proj-section-l">Tech Stack</div>
            <div className="ev-tags">
              {team.tech_stack.map((t, i) => <span key={i} className="ev-tag">{t}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Rubric */}
      <div className="ev-rubric">
        <div className="ev-rubric-h">Evaluation Rubric (each scored 0–10)</div>
        <table className="ev-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Criterion</th>
              <th style={{ width: '40%' }}>Score (0–10)</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {RUBRIC_CRITERIA.map(c => (
              <tr key={c.key}>
                <td>
                  <div className="ev-crit-label">{c.label}</div>
                  <div className="ev-crit-desc">{c.description}</div>
                </td>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={scores[c.key]}
                    onChange={e => setScore(c.key, e.target.value)}
                    className="ev-slider"
                  />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="ev-score">{scores[c.key]}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" style={{ textAlign: 'right', fontWeight: 700 }}>Average Score</td>
              <td style={{ textAlign: 'right' }}>
                <span className="ev-avg">{avg}/10</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Comments */}
      <div className="ev-comments">
        <label className="ev-comments-l">Comments / Feedback (optional)</label>
        <textarea
          className="ev-textarea"
          rows={5}
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Strengths, areas for improvement, suggestions for the team..."
          maxLength={5000}
        />
        <div className="ev-char-count">{comments.length} / 5000</div>
      </div>

      {/* Submit */}
      <button
        className="ev-submit"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? '⏳ Saving…' : '✓ Submit Evaluation'}
      </button>

      {submitMsg && (
        <div className={`ev-msg ${submitMsg.ok ? 'ok' : 'err'}`}>{submitMsg.text}</div>
      )}
    </div>
  )
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

      /* List view */
      .ev-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:14px}
      .ev-title{font-size:1.2rem;font-weight:700;letter-spacing:-.01em}
      .ev-sub{font-size:.7rem;color:rgba(255,255,255,.45);margin-top:3px}
      .ev-stats{display:flex;gap:8px}
      .ev-stat{display:flex;flex-direction:column;align-items:center;padding:8px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);min-width:75px}
      .ev-stat-v{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.3rem;font-weight:800;line-height:1}
      .ev-stat-l{font-size:.58rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:600;margin-top:3px}

      .ev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
      .ev-card{padding:16px 18px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);text-align:left;cursor:pointer;font-family:inherit;color:inherit;transition:all .2s;display:flex;flex-direction:column;gap:8px}
      .ev-card:hover{background:rgba(255,255,255,.06);border-color:rgba(238,167,39,.3);transform:translateY(-2px)}
      .ev-card.evaluated{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.03)}
      .ev-card.pending{border-color:rgba(238,167,39,.18)}

      .ev-card-top{display:flex;justify-content:space-between;align-items:center}
      .ev-team-num{font-weight:800;color:#fd1c00;font-size:.85rem;letter-spacing:.5px}
      .ev-badge{padding:3px 10px;border-radius:6px;font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .ev-badge.ok{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
      .ev-badge.pending{background:rgba(238,167,39,.12);color:#EEA727;border:1px solid rgba(238,167,39,.3)}
      .ev-card-title{font-size:.92rem;font-weight:700;line-height:1.4;margin:4px 0}
      .ev-card-meta{display:flex;gap:8px;font-size:.65rem;color:rgba(255,255,255,.55);flex-wrap:wrap}
      .ev-card-tech,.ev-card-leader{padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.04);white-space:nowrap}
      .ev-card-action{margin-top:6px;font-size:.7rem;color:#EEA727;font-weight:700}
      .ev-card-buttons{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
      .ev-btn-doc,.ev-btn-eval{flex:1;min-width:120px;padding:8px 12px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;text-align:center;border:1px solid;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:5px}
      .ev-btn-doc{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.25);color:#60a5fa}
      .ev-btn-doc:hover{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4)}
      .ev-btn-doc.disabled{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.06);color:rgba(255,255,255,.3);cursor:not-allowed}
      .ev-btn-eval{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.3);color:#EEA727}
      .ev-btn-eval:hover{background:rgba(238,167,39,.15);border-color:rgba(238,167,39,.5)}
      .ev-card.evaluated .ev-btn-eval{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.3);color:#4ade80}
      .ev-card.evaluated .ev-btn-eval:hover{background:rgba(74,222,128,.12)}

      /* Form view */
      .ev-form{display:flex;flex-direction:column;gap:18px}
      .ev-back{align-self:flex-start;padding:7px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s}
      .ev-back:hover{background:rgba(255,255,255,.1)}

      .ev-proj{padding:20px 22px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
      .ev-proj-num{font-size:.7rem;font-weight:800;color:#fd1c00;letter-spacing:1px;margin-bottom:4px}
      .ev-proj-title{font-size:1.3rem;font-weight:800;line-height:1.3;letter-spacing:-.01em;margin-bottom:10px}
      .ev-proj-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
      .ev-meta-pill{padding:4px 11px;border-radius:6px;background:rgba(255,255,255,.05);font-size:.65rem;color:rgba(255,255,255,.7);font-weight:600}
      .ev-proj-desc{font-size:.78rem;color:rgba(255,255,255,.7);line-height:1.55;padding:10px 0;border-top:1px solid rgba(255,255,255,.05)}
      .ev-proj-section{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05)}
      .ev-proj-section-l{font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:5px}
      .ev-proj-section-v{font-size:.78rem;color:rgba(255,255,255,.75);line-height:1.55}
      .ev-tags{display:flex;gap:6px;flex-wrap:wrap}
      .ev-tag{padding:3px 9px;border-radius:5px;background:rgba(238,167,39,.08);color:#EEA727;font-size:.62rem;font-weight:600}

      .ev-rubric{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
      .ev-rubric-h{font-size:.85rem;font-weight:700;margin-bottom:14px;color:rgba(255,255,255,.85)}
      .ev-table{width:100%;border-collapse:separate;border-spacing:0 8px}
      .ev-table th{text-align:left;font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;padding:8px 10px}
      .ev-table td{padding:12px 10px;background:rgba(255,255,255,.02);vertical-align:top}
      .ev-table tr td:first-child{border-top-left-radius:9px;border-bottom-left-radius:9px}
      .ev-table tr td:last-child{border-top-right-radius:9px;border-bottom-right-radius:9px}
      .ev-crit-label{font-size:.82rem;font-weight:700;margin-bottom:3px}
      .ev-crit-desc{font-size:.65rem;color:rgba(255,255,255,.5);line-height:1.5}
      .ev-slider{width:100%;-webkit-appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,.08);outline:none}
      .ev-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#EEA727,#fd1c00);cursor:pointer;box-shadow:0 2px 8px rgba(238,167,39,.4)}
      .ev-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#EEA727,#fd1c00);cursor:pointer;border:none;box-shadow:0 2px 8px rgba(238,167,39,.4)}
      .ev-score{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.15rem;font-weight:800;color:#EEA727;min-width:32px;display:inline-block}
      .ev-avg{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.5rem;font-weight:800;color:#4ade80;letter-spacing:.5px}

      .ev-comments{display:flex;flex-direction:column;gap:6px;padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
      .ev-comments-l{font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.2px;font-weight:700}
      .ev-textarea{width:100%;padding:12px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.8rem;resize:vertical;outline:none;line-height:1.5;box-sizing:border-box}
      .ev-textarea:focus{border-color:rgba(238,167,39,.4)}
      .ev-char-count{font-size:.6rem;color:rgba(255,255,255,.4);text-align:right}

      .ev-submit{align-self:flex-end;padding:12px 26px;border-radius:10px;background:linear-gradient(135deg,#EEA727,#fd1c00);border:none;color:#fff;font-family:inherit;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .15s;box-shadow:0 4px 16px rgba(238,167,39,.25)}
      .ev-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(238,167,39,.35)}
      .ev-submit:disabled{opacity:.6;cursor:not-allowed;transform:none}

      .ev-msg{padding:11px 16px;border-radius:9px;font-size:.78rem;font-weight:600}
      .ev-msg.ok{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
      .ev-msg.err{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}

      .ev-btn-sm{padding:6px 14px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;cursor:pointer;font-weight:600}

      /* Mobile */
      @media (max-width: 768px) {
        .ev-grid{grid-template-columns:1fr}
        .ev-stats{flex-wrap:wrap}
        .ev-table th, .ev-table td{padding:8px 6px;font-size:.7rem}
        .ev-crit-desc{display:none}
        .ev-submit{align-self:stretch}
      }
    `}</style>
  )
}