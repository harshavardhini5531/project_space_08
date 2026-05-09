// app/mentor/dashboard/components/MentorReviewReports.js
//
// Mentor's review reports page.
// 1. Lists mentor's assigned teams (with eval status)
// 2. When mentor clicks a team -> shows full review report (AI-generated from dev's API)
//    plus mentor's own evaluation panel at the bottom
//
// Reuses styles + logic similar to StudentReviewReport but is a separate component
// because it needs:
//   - Team picker UI
//   - Auth via mentor session
//   - Mentor evaluation panel inline

'use client'
import { useState, useEffect } from 'react'

const CRITERIA_LABELS = {
  problem_statement: 'Problem statement',
  architecture_design: 'Architecture design',
  requirements_fulfillment: 'Requirements fulfillment',
  code_quality: 'Code quality',
  future_scope: 'Future scope',
}
const CRITERIA_KEYS = Object.keys(CRITERIA_LABELS)

const RUBRIC_LABELS = {
  innovation: 'Innovation',
  technical: 'Technical',
  uiux: 'UI/UX',
  relevance: 'Relevance',
  demo: 'Demo',
  documentation: 'Documentation',
}
const RUBRIC_KEYS = Object.keys(RUBRIC_LABELS)

export default function MentorReviewReports({ mentor }) {
  const [view, setView] = useState('list') // 'list' | 'report'
  const [selectedTeamNumber, setSelectedTeamNumber] = useState(null)

  const [teamsLoading, setTeamsLoading] = useState(true)
  const [teamsError, setTeamsError] = useState(null)
  const [teamsData, setTeamsData] = useState(null)

  async function fetchTeams() {
    setTeamsLoading(true); setTeamsError(null)
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
      const r = await fetch('/api/mentor/evaluations/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mentor-token': token || '' },
        body: JSON.stringify({ mentorEmail: mentor?.email }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setTeamsError(d.error || `Request failed (${r.status})`)
        return
      }
      setTeamsData(d)
    } catch (e) {
      setTeamsError('Network error: ' + e.message)
    } finally {
      setTeamsLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'list') fetchTeams()
    // eslint-disable-next-line
  }, [view, mentor?.email])

  function openReport(teamNumber) {
    setSelectedTeamNumber(teamNumber)
    setView('report')
  }

  function backToList() {
    setSelectedTeamNumber(null)
    setView('list')
  }

  return (
    <div className="mrr-section">
      <Styles />

      {view === 'list' && (
        <ListView
          loading={teamsLoading}
          error={teamsError}
          data={teamsData}
          onSelect={openReport}
          onRefresh={fetchTeams}
        />
      )}

      {view === 'report' && selectedTeamNumber && (
        <ReportView
          mentor={mentor}
          teamNumber={selectedTeamNumber}
          onBack={backToList}
        />
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// LIST VIEW
// ════════════════════════════════════════════
function ListView({ loading, error, data, onSelect, onRefresh }) {
  if (loading) return <div className="mrr-loading">Loading your teams…</div>
  if (error) return (
    <div className="mrr-error">
      <div className="mrr-err-h">Could not load teams</div>
      <div className="mrr-err-m">{error}</div>
      <button className="mrr-btn-sm" onClick={onRefresh}>Retry</button>
    </div>
  )

  const teams = data?.teams || []

  return (
    <div className="mrr-list">
      <div className="mrr-hdr">
        <div>
          <div className="mrr-title">Review reports</div>
          <div className="mrr-sub">View AI-generated review reports for your assigned teams.</div>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="mrr-empty">
          No teams assigned to you yet. Contact admin if you expect teams here.
        </div>
      ) : (
        <div className="mrr-grid">
          {teams.map(t => (
            <button key={t.team_number} className="mrr-card" onClick={() => onSelect(t.team_number)}>
              <div className="mrr-card-top">
                <span className="mrr-tn">{t.team_number}</span>
                {t.evaluated ? (
                  <span className="mrr-badge ok">✓ Eval {Number(t.average_score).toFixed(1)}/10</span>
                ) : (
                  <span className="mrr-badge pending">No eval yet</span>
                )}
              </div>
              <div className="mrr-card-title">{t.project_title}</div>
              <div className="mrr-card-meta">
                <span className="mrr-tag">{t.technology}</span>
                <span className="mrr-tag">★ {t.leader_name}</span>
              </div>
              <div className="mrr-card-cta">View Review Report →</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// REPORT VIEW
// ════════════════════════════════════════════
function ReportView({ mentor, teamNumber, onBack }) {
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState(null)
  const [reportData, setReportData] = useState(null)

  const [evalData, setEvalData] = useState(null) // mentor's own evaluation

  // Fetch report
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setReportLoading(true); setReportError(null)
      try {
        const r = await fetch('/api/project-review/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamNumber }),
        })
        const d = await r.json()
        if (cancelled) return
        if (!r.ok || !d.ok) {
          setReportError(d.error || `Request failed (${r.status})`)
          return
        }
        setReportData(d)
      } catch (e) {
        if (!cancelled) setReportError('Network error: ' + e.message)
      } finally {
        if (!cancelled) setReportLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [teamNumber])

  // Fetch mentor's own evaluation for this team
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('mentor_token') : null
        const r = await fetch('/api/mentor/evaluations/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-mentor-token': token || '' },
          body: JSON.stringify({ mentorEmail: mentor?.email, teamNumber }),
        })
        const d = await r.json()
        if (cancelled) return
        if (r.ok && d.ok) {
          setEvalData(d)
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [mentor?.email, teamNumber])

  function copy(text) {
    if (!text) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  if (reportLoading) {
    return (
      <div>
        <button className="mrr-back" onClick={onBack}>← Back to teams list</button>
        <div className="mrr-loading">Loading review report…</div>
      </div>
    )
  }

  if (reportError) {
    return (
      <div>
        <button className="mrr-back" onClick={onBack}>← Back to teams list</button>
        <div className="mrr-error">
          <div className="mrr-err-h">Could not load report</div>
          <div className="mrr-err-m">{reportError}</div>
        </div>
      </div>
    )
  }

  if (!reportData?.has_reports) {
    return (
      <div>
        <button className="mrr-back" onClick={onBack}>← Back to teams list</button>
        <div className="mrr-empty">
          <div className="mrr-empty-icon">📋</div>
          <div className="mrr-empty-h">No review yet</div>
          <div className="mrr-empty-m">
            Team <strong>{teamNumber}</strong> has no AI-generated review yet. Check back after the next AI run.
          </div>
        </div>
      </div>
    )
  }

  const { team, latest, delta_from_previous, total_runs, trend, source } = reportData

  return (
    <div>
      <button className="mrr-back" onClick={onBack}>← Back to teams list</button>

      {/* HEADER */}
      <div className="mrr-card">
        <div className="mrr-rep-hdr">
          <div className="mrr-rep-hdr-l">
            <div className="mrr-rep-tag">{team.team_number} · {team.technology}</div>
            <div className="mrr-rep-title">{team.project_title}</div>
            <div className="mrr-rep-meta">
              <span className="mrr-tag">★ {team.leader_name}</span>
              {latest.files_reviewed?.length > 0 && (
                <span className="mrr-tag">{latest.files_reviewed.length} files reviewed</span>
              )}
              <span className="mrr-tag mrr-tag-source">Source: {source === 'dev' ? 'Dev API' : 'Internal AI'}</span>
            </div>
          </div>
          <div className="mrr-rep-hdr-r">
            <div className="mrr-rep-hdr-r-l">Latest run</div>
            <div className="mrr-rep-hdr-r-v">Run #{latest.run_index} · {fmtDate(latest.completed_at)}</div>
          </div>
        </div>
      </div>

      {/* OVERALL + DELTA */}
      <div className="mrr-row-2">
        <div className="mrr-card">
          <div className="mrr-section-l">Overall score</div>
          <div className="mrr-overall">
            <span className={`mrr-overall-num ${scoreClass(latest.overall_score)}`}>{latest.overall_score ?? '—'}</span>
            <span className="mrr-overall-suf"> / 100</span>
          </div>
          <div className="mrr-overall-sub">Avg across {CRITERIA_KEYS.length} criteria</div>
        </div>
        <div className={`mrr-card mrr-delta ${deltaClass(delta_from_previous?.overall)}`}>
          <div className="mrr-section-l">Change from previous run</div>
          <div className="mrr-delta-v">
            {delta_from_previous?.overall == null ? (
              <span className="mrr-delta-na">First run · no previous</span>
            ) : (
              <>
                <span className="mrr-delta-arr">{delta_from_previous.overall > 0 ? '↗' : delta_from_previous.overall < 0 ? '↘' : '→'}</span>
                <span className="mrr-delta-n">{delta_from_previous.overall > 0 ? '+' : ''}{delta_from_previous.overall}</span>
              </>
            )}
          </div>
          {delta_from_previous?.overall != null && reportData.previous?.overall_score != null && (
            <div className="mrr-overall-sub">From {reportData.previous.overall_score} → {latest.overall_score}</div>
          )}
        </div>
      </div>

      {/* SCORE BREAKDOWN */}
      <div className="mrr-card">
        <div className="mrr-section-h">
          <div>Score breakdown</div>
          <span className="mrr-hint">Δ vs previous</span>
        </div>
        <div className="mrr-donuts">
          {CRITERIA_KEYS.map(key => {
            const score = latest.scores?.[key]
            const d = delta_from_previous?.breakdown?.[key]
            const cls = scoreClass(score)
            const colorMap = { 'mrr-s-green':'#4ade80', 'mrr-s-amber':'#EEA727', 'mrr-s-orange':'#ff5349', 'mrr-s-red':'#fd1c00', 'mrr-s-na':'rgba(255,255,255,0.3)' }
            const stroke = colorMap[cls] || colorMap['mrr-s-na']
            const C = 2 * Math.PI * 32
            const pct = Math.max(0, Math.min(100, score || 0))
            const offset = C - (pct / 100) * C
            return (
              <div key={key} className="mrr-donut-cell">
                <svg viewBox="0 0 80 80" className="mrr-donut">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke={stroke} strokeWidth="6" strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 40 40)"/>
                  <text x="40" y="46" textAnchor="middle" fill={stroke} fontSize="22" fontWeight="700" fontFamily="'DM Sans',sans-serif">{score ?? '—'}</text>
                </svg>
                <div className="mrr-donut-label">{CRITERIA_LABELS[key]}</div>
                <div className={`mrr-donut-delta ${deltaClass(d)}`}>
                  {d == null ? <span>First run</span> : d === 0 ? <span>No change</span> : <><span>{d > 0 ? '+' : ''}{d}</span> <span className="mrr-donut-arrow">{d > 0 ? '↑' : '↓'}</span></>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* TREND */}
      {total_runs > 1 && (
        <div className="mrr-card">
          <div className="mrr-section-h">
            <div>Score trend across all runs</div>
            <span className="mrr-hint">{total_runs} runs</span>
          </div>
          <Trend trend={trend} />
        </div>
      )}

      {/* DETAILED FEEDBACK */}
      <div className="mrr-card">
        <div className="mrr-section-h">
          <div>Detailed feedback</div>
          <button className="mrr-btn-sm" onClick={() => copy(formatAllFeedback(latest))}>📋 Copy all</button>
        </div>
        {latest.feedback?.summary && (
          <div className="mrr-fb-sum">{latest.feedback.summary}</div>
        )}
        {CRITERIA_KEYS.map(key => {
          const text = latest.feedback?.[key]
          if (!text) return null
          return (
            <div key={key} className="mrr-fb-block">
              <div className="mrr-fb-hdr">
                <div className="mrr-fb-l">{CRITERIA_LABELS[key]} · <span className={scoreClass(latest.scores?.[key])}>{latest.scores?.[key] ?? '—'}/100</span></div>
                <button className="mrr-btn-icon" onClick={() => copy(text)} title="Copy">📋</button>
              </div>
              <div className="mrr-fb-text">{text}</div>
            </div>
          )
        })}
      </div>

      {/* STRENGTHS + IMPROVEMENTS */}
      <div className="mrr-row-2">
        {latest.strengths?.length > 0 && (
          <div className="mrr-card mrr-strengths">
            <div className="mrr-section-h">
              <div>✓ Strengths · {latest.strengths.length}</div>
              <button className="mrr-btn-icon" onClick={() => copy(latest.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n'))} title="Copy">📋</button>
            </div>
            <ol className="mrr-list">
              {latest.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
        {latest.improvements?.length > 0 && (
          <div className="mrr-card mrr-improvements">
            <div className="mrr-section-h">
              <div>💡 Improvements · {latest.improvements.length}</div>
              <button className="mrr-btn-icon" onClick={() => copy(latest.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n'))} title="Copy">📋</button>
            </div>
            <ol className="mrr-list">
              {latest.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
      </div>

      {/* MENTOR'S OWN EVALUATION (mentor-only section) */}
      {evalData && (
        <div className="mrr-card mrr-myeval">
          <div className="mrr-section-h">
            <div>👤 Your evaluation</div>
            {evalData.evaluation && (
              <span className="mrr-mybadge">{Number(evalData.evaluation.average_score).toFixed(1)}/10</span>
            )}
          </div>
          {evalData.evaluation ? (
            <>
              <div className="mrr-myeval-grid">
                {RUBRIC_KEYS.map(k => (
                  <div key={k} className="mrr-myeval-cell">
                    <span className="mrr-myeval-l">{RUBRIC_LABELS[k]}</span>
                    <span className="mrr-myeval-v">{evalData.evaluation[`${k}_score`] ?? '—'}/10</span>
                  </div>
                ))}
              </div>
              {evalData.evaluation.comments && (
                <div className="mrr-myeval-com">
                  <div className="mrr-myeval-com-l">Your comments:</div>
                  <div className="mrr-myeval-com-v">{evalData.evaluation.comments}</div>
                </div>
              )}
              <div className="mrr-myeval-foot">
                Submitted {fmtDate(evalData.evaluation.created_at)}
                {evalData.evaluation.updated_at && evalData.evaluation.updated_at !== evalData.evaluation.created_at && (
                  <> · Last updated {fmtDate(evalData.evaluation.updated_at)}</>
                )}
              </div>
            </>
          ) : (
            <div className="mrr-myeval-na">
              You haven't submitted your evaluation for this team yet.
              Use the <strong>Project Evaluation</strong> tab in the sidebar to submit one.
            </div>
          )}
        </div>
      )}

      {/* FILES REVIEWED */}
      {latest.files_reviewed?.length > 0 && (
        <details className="mrr-card mrr-files">
          <summary><span>📁 {latest.files_reviewed.length} files reviewed</span></summary>
          <ul className="mrr-files-list">
            {latest.files_reviewed.map((f, i) => <li key={i}><code>{f}</code></li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// HELPERS / SUB-COMPONENTS
// ════════════════════════════════════════════

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function scoreClass(score) {
  if (score == null) return 'mrr-s-na'
  if (score >= 80) return 'mrr-s-green'
  if (score >= 60) return 'mrr-s-amber'
  if (score >= 40) return 'mrr-s-orange'
  return 'mrr-s-red'
}

function deltaClass(d) {
  if (d == null) return 'mrr-d-neutral'
  if (d > 0) return 'mrr-d-up'
  if (d < 0) return 'mrr-d-down'
  return 'mrr-d-neutral'
}

function formatAllFeedback(latest) {
  const parts = []
  if (latest.feedback?.summary) parts.push(`Summary:\n${latest.feedback.summary}`)
  for (const key of CRITERIA_KEYS) {
    const text = latest.feedback?.[key]
    if (text) parts.push(`\n${CRITERIA_LABELS[key]} (${latest.scores?.[key] ?? '?'}/100):\n${text}`)
  }
  if (latest.strengths?.length) parts.push(`\nStrengths:\n${latest.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
  if (latest.improvements?.length) parts.push(`\nImprovements:\n${latest.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
  return parts.join('\n')
}

function Trend({ trend }) {
  if (!trend || trend.length === 0) return null
  const W = 600, H = 180, pad = { l: 40, r: 20, t: 25, b: 35 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const max = 100
  const points = trend.map((t, i) => {
    const x = pad.l + (i * innerW) / Math.max(1, trend.length - 1)
    const y = pad.t + innerH - ((t.overall_score || 0) * innerH) / max
    return { x, y, label: t.overall_score, date: t.date }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mrr-trend">
      <line x1={pad.l} y1={pad.t} x2={W - pad.r} y2={pad.t} stroke="rgba(255,255,255,.08)" strokeDasharray="3 3"/>
      <line x1={pad.l} y1={pad.t + innerH/2} x2={W - pad.r} y2={pad.t + innerH/2} stroke="rgba(255,255,255,.08)" strokeDasharray="3 3"/>
      <line x1={pad.l} y1={pad.t + innerH} x2={W - pad.r} y2={pad.t + innerH} stroke="rgba(255,255,255,.15)"/>
      <text x={pad.l - 8} y={pad.t + 4} fill="rgba(255,255,255,.4)" fontSize="10" textAnchor="end">100</text>
      <text x={pad.l - 8} y={pad.t + innerH/2 + 4} fill="rgba(255,255,255,.4)" fontSize="10" textAnchor="end">50</text>
      <text x={pad.l - 8} y={pad.t + innerH + 4} fill="rgba(255,255,255,.4)" fontSize="10" textAnchor="end">0</text>
      <path d={path} fill="none" stroke="#EEA727" strokeWidth="2"/>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#EEA727"/>
          <text x={p.x} y={p.y - 9} fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">{p.label}</text>
          <text x={p.x} y={H - 12} fill="rgba(255,255,255,.5)" fontSize="10" textAnchor="middle">
            {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : `Run ${i + 1}`}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════
function Styles() {
  return (
    <style>{`
      .mrr-section{font-family:'DM Sans',sans-serif;color:#fff;animation:mrrIn .4s ease both}
      @keyframes mrrIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

      .mrr-loading{padding:50px 20px;text-align:center;color:rgba(255,255,255,.4);font-size:.85rem}
      .mrr-error{padding:24px;border-radius:14px;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);margin-top:14px}
      .mrr-err-h{font-weight:700;font-size:.95rem;margin-bottom:6px;color:#fd1c00}
      .mrr-err-m{font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:10px}

      .mrr-empty{padding:50px 24px;text-align:center}
      .mrr-empty-icon{font-size:48px;margin-bottom:12px;opacity:.6}
      .mrr-empty-h{font-size:1rem;font-weight:700;margin-bottom:6px}
      .mrr-empty-m{font-size:.78rem;color:rgba(255,255,255,.55);max-width:480px;margin:0 auto;line-height:1.6}

      .mrr-card{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);margin-bottom:14px}

      /* List */
      .mrr-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:14px}
      .mrr-title{font-size:1.2rem;font-weight:700;letter-spacing:-.01em}
      .mrr-sub{font-size:.7rem;color:rgba(255,255,255,.45);margin-top:3px}

      .mrr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
      .mrr-card.mrr-card-clk{cursor:pointer}
      .mrr-list .mrr-card{margin-bottom:0}

      button.mrr-card{padding:16px 18px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);text-align:left;cursor:pointer;font-family:inherit;color:inherit;transition:all .2s;display:flex;flex-direction:column;gap:8px;margin-bottom:0}
      button.mrr-card:hover{background:rgba(255,255,255,.06);border-color:rgba(238,167,39,.3);transform:translateY(-2px)}

      .mrr-card-top{display:flex;justify-content:space-between;align-items:center}
      .mrr-tn{font-weight:800;color:#fd1c00;font-size:.85rem;letter-spacing:.5px}
      .mrr-badge{padding:3px 10px;border-radius:6px;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .mrr-badge.ok{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
      .mrr-badge.pending{background:rgba(238,167,39,.1);color:#EEA727;border:1px solid rgba(238,167,39,.3)}
      .mrr-card-title{font-size:.92rem;font-weight:700;line-height:1.4;margin:4px 0}
      .mrr-card-meta{display:flex;gap:8px;font-size:.65rem;color:rgba(255,255,255,.55);flex-wrap:wrap}
      .mrr-tag{padding:2px 8px;border-radius:5px;background:rgba(255,255,255,.04);white-space:nowrap}
      .mrr-tag-source{background:rgba(238,167,39,.08);color:#EEA727}
      .mrr-card-cta{margin-top:6px;font-size:.7rem;color:#EEA727;font-weight:700}

      /* Report */
      .mrr-back{padding:7px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer;margin-bottom:14px;transition:all .15s}
      .mrr-back:hover{background:rgba(255,255,255,.1)}

      .mrr-rep-hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      .mrr-rep-hdr-l{flex:1;min-width:240px}
      .mrr-rep-tag{font-size:.65rem;font-weight:800;letter-spacing:1.2px;color:#fd1c00;margin-bottom:5px}
      .mrr-rep-title{font-size:1.3rem;font-weight:800;line-height:1.25;letter-spacing:-.01em;margin-bottom:10px}
      .mrr-rep-meta{display:flex;gap:7px;flex-wrap:wrap}
      .mrr-rep-hdr-r{text-align:right}
      .mrr-rep-hdr-r-l{font-size:.6rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;margin-bottom:3px}
      .mrr-rep-hdr-r-v{font-size:.78rem;color:rgba(255,255,255,.85);font-weight:600}

      .mrr-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
      .mrr-row-2 .mrr-card{margin-bottom:0}

      .mrr-section-l{font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;margin-bottom:8px}
      .mrr-section-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:.9rem;font-weight:700}
      .mrr-hint{font-size:.65rem;color:rgba(255,255,255,.4);font-weight:500}

      .mrr-overall{display:flex;align-items:baseline;gap:4px}
      .mrr-overall-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:2.5rem;font-weight:800;line-height:1}
      .mrr-overall-suf{font-size:.9rem;color:rgba(255,255,255,.4)}
      .mrr-overall-sub{font-size:.65rem;color:rgba(255,255,255,.4);margin-top:6px}

      .mrr-delta.mrr-d-up{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.25)}
      .mrr-delta.mrr-d-down{background:rgba(253,28,0,.05);border-color:rgba(253,28,0,.2)}
      .mrr-delta-v{display:flex;align-items:baseline;gap:6px;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.8rem;font-weight:800;line-height:1}
      .mrr-delta-arr{font-size:1.5rem}
      .mrr-delta-na{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif}

      .mrr-d-up,.mrr-d-up *{color:#4ade80}
      .mrr-d-down,.mrr-d-down *{color:#fd1c00}
      .mrr-d-neutral{color:rgba(255,255,255,.4)}

      .mrr-donuts{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
      .mrr-donut-cell{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 4px;border-radius:10px;transition:background .2s}
      .mrr-donut-cell:hover{background:rgba(255,255,255,.02)}
      .mrr-donut{width:88px;height:88px;display:block}
      .mrr-donut circle{transition:stroke-dashoffset .6s ease}
      .mrr-donut-label{font-size:.72rem;color:rgba(255,255,255,.85);text-align:center;line-height:1.3;min-height:30px;display:flex;align-items:center;justify-content:center}
      .mrr-donut-delta{font-size:.7rem;font-weight:700;text-align:center;display:flex;align-items:center;gap:3px;justify-content:center}
      .mrr-donut-arrow{font-size:.85rem}

      .mrr-s-green,.mrr-bar-fill.mrr-s-green{background:#4ade80;color:#4ade80}
      .mrr-s-amber,.mrr-bar-fill.mrr-s-amber{background:#EEA727;color:#EEA727}
      .mrr-s-orange,.mrr-bar-fill.mrr-s-orange{background:#fd7000;color:#ff5349}
      .mrr-s-red,.mrr-bar-fill.mrr-s-red{background:#fd1c00;color:#fd1c00}
      .mrr-s-na{color:rgba(255,255,255,.3)}

      .mrr-trend{width:100%;height:auto;display:block}

      .mrr-fb-sum{padding:12px 14px;background:rgba(238,167,39,.05);border-left:3px solid #EEA727;border-radius:0 8px 8px 0;font-size:.8rem;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:14px}
      .mrr-fb-block{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.05)}
      .mrr-fb-block:last-child{border-bottom:none;padding-bottom:0;margin-bottom:0}
      .mrr-fb-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .mrr-fb-l{font-size:.82rem;font-weight:700}
      .mrr-fb-text{font-size:.78rem;line-height:1.65;color:rgba(255,255,255,.75)}

      .mrr-strengths{background:rgba(74,222,128,.04);border-color:rgba(74,222,128,.18)}
      .mrr-improvements{background:rgba(238,167,39,.04);border-color:rgba(238,167,39,.18)}
      .mrr-list{margin:0;padding-left:24px;font-size:.78rem;line-height:1.65;color:rgba(255,255,255,.85)}
      .mrr-list li{margin-bottom:6px}

      .mrr-myeval{background:rgba(123,47,190,.06);border-color:rgba(123,47,190,.25)}
      .mrr-mybadge{padding:4px 12px;border-radius:7px;background:rgba(123,47,190,.12);color:#c596f5;font-size:.75rem;font-weight:700}
      .mrr-myeval-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
      .mrr-myeval-cell{display:flex;flex-direction:column;gap:2px;padding:9px 12px;background:rgba(255,255,255,.03);border-radius:8px}
      .mrr-myeval-l{font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;font-weight:600}
      .mrr-myeval-v{font-size:.95rem;font-weight:800;color:#c596f5}
      .mrr-myeval-com{margin-top:12px;padding:10px 14px;background:rgba(255,255,255,.03);border-radius:9px}
      .mrr-myeval-com-l{font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px}
      .mrr-myeval-com-v{font-size:.78rem;color:rgba(255,255,255,.8);line-height:1.6}
      .mrr-myeval-foot{font-size:.65rem;color:rgba(255,255,255,.4);margin-top:10px}
      .mrr-myeval-na{padding:14px;background:rgba(255,255,255,.03);border-radius:9px;font-size:.78rem;color:rgba(255,255,255,.6);line-height:1.6}

      .mrr-files summary{font-size:.78rem;color:rgba(255,255,255,.7);font-weight:600;list-style:none;cursor:pointer}
      .mrr-files-list{margin:14px 0 0;padding-left:24px;font-size:.72rem;color:rgba(255,255,255,.6);max-height:200px;overflow-y:auto}
      .mrr-files-list li{margin-bottom:3px}
      .mrr-files-list code{background:rgba(255,255,255,.04);padding:1px 6px;border-radius:4px;font-family:'JetBrains Mono','Courier New',monospace;font-size:.7rem}

      .mrr-btn-sm{padding:5px 12px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s}
      .mrr-btn-sm:hover{background:rgba(255,255,255,.1)}
      .mrr-btn-icon{padding:4px 8px;border-radius:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:.75rem;cursor:pointer;transition:all .15s}
      .mrr-btn-icon:hover{background:rgba(255,255,255,.1);color:#fff}

      @media (max-width: 768px) {
        .mrr-row-2{grid-template-columns:1fr}
        .mrr-donuts{grid-template-columns:repeat(3,1fr);gap:6px}
        .mrr-donut{width:72px;height:72px}
        .mrr-donut-label{font-size:.65rem;min-height:26px}
        .mrr-donut-delta{font-size:.62rem}
      }
      @media (max-width: 480px) {
        .mrr-donuts{grid-template-columns:repeat(2,1fr)}
      }
    `}</style>
  )
}