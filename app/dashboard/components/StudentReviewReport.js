// app/dashboard/components/StudentReviewReport.js
//
// Student-facing review report page.
// Shows team's AI-generated review with score breakdown, trend, detailed feedback.
// Auto-fetches based on user's team number. Read-only. Copy-enabled.
//
// Props: { user } where user has teamNumber or team_number

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

export default function StudentReviewReport({ user }) {
  const teamNumber = user?.teamNumber || user?.team_number || null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [showFeedbackKey, setShowFeedbackKey] = useState(null) // for expand/collapse

  async function fetchReport() {
    if (!teamNumber) {
      setError('Could not determine your team number')
      setLoading(false)
      return
    }
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/project-review/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNumber }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setError(d.error || `Request failed (${r.status})`)
        return
      }
      setData(d)
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [teamNumber])

  function copy(text, label) {
    if (!text) return
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  if (loading) return <ReportShell><div className="rr-loading">Loading review report…</div></ReportShell>
  if (error) return (
    <ReportShell>
      <div className="rr-error">
        <div className="rr-error-h">Could not load report</div>
        <div className="rr-error-m">{error}</div>
        <button className="rr-btn-sm" onClick={fetchReport}>Retry</button>
      </div>
    </ReportShell>
  )

  if (!data?.has_reports) {
    return (
      <ReportShell>
        <div className="rr-empty">
          <div className="rr-empty-icon">📋</div>
          <div className="rr-empty-h">No review yet</div>
          <div className="rr-empty-m">
            Your project hasn't been reviewed yet. Reviews are generated automatically once your project is submitted.
            Check back after the next AI run.
          </div>
        </div>
      </ReportShell>
    )
  }

  const { team, latest, delta_from_previous, total_runs, trend, source } = data

  return (
    <ReportShell>
      {/* HEADER */}
      <div className="rr-card rr-hdr">
        <div className="rr-hdr-l">
          <div className="rr-tag">{team.team_number} · {team.technology}</div>
          <div className="rr-title">{team.project_title}</div>
          <div className="rr-meta">
            <span className="rr-pill">★ {team.leader_name}</span>
            {latest.files_reviewed?.length > 0 && (
              <span className="rr-pill">{latest.files_reviewed.length} files reviewed</span>
            )}
            <span className="rr-pill rr-pill-source">Source: {source === 'dev' ? 'Dev API' : 'Internal AI'}</span>
          </div>
        </div>
        <div className="rr-hdr-r">
          <div className="rr-hdr-r-l">Latest run</div>
          <div className="rr-hdr-r-v">Run #{latest.run_index} · {formatDate(latest.completed_at)}</div>
        </div>
      </div>

      {/* SCORE + DELTA */}
      <div className="rr-row-2">
        <div className="rr-card rr-score">
          <div className="rr-score-l">Overall score</div>
          <div className="rr-score-v">
            <span className={`rr-score-num ${scoreColorClass(latest.overall_score)}`}>{latest.overall_score ?? '—'}</span>
            <span className="rr-score-suffix"> / 100</span>
          </div>
          <div className="rr-score-sub">Avg across {CRITERIA_KEYS.length} criteria</div>
        </div>

        <div className={`rr-card rr-delta ${deltaClass(delta_from_previous?.overall)}`}>
          <div className="rr-delta-l">Change from previous run</div>
          <div className="rr-delta-v">
            {delta_from_previous?.overall == null ? (
              <span className="rr-delta-empty">First run · no previous</span>
            ) : (
              <>
                <span className="rr-delta-arrow">{delta_from_previous.overall > 0 ? '↗' : delta_from_previous.overall < 0 ? '↘' : '→'}</span>
                <span className="rr-delta-num">{delta_from_previous.overall > 0 ? '+' : ''}{delta_from_previous.overall}</span>
              </>
            )}
          </div>
          {delta_from_previous?.overall != null && data.previous?.overall_score != null && (
            <div className="rr-delta-sub">From {data.previous.overall_score} → {latest.overall_score}</div>
          )}
        </div>
      </div>

      {/* SCORE BREAKDOWN */}
      <div className="rr-card">
        <div className="rr-section-h">
          <div>Score breakdown</div>
          <span className="rr-hint">Δ vs previous</span>
        </div>
        <div className="rr-bars">
          {CRITERIA_KEYS.map(key => {
            const score = latest.scores?.[key]
            const d = delta_from_previous?.breakdown?.[key]
            return (
              <div key={key} className="rr-bar-row">
                <div className="rr-bar-l">{CRITERIA_LABELS[key]}</div>
                <div className="rr-bar-track"><div className={`rr-bar-fill ${scoreColorClass(score)}`} style={{ width: `${Math.max(0, Math.min(100, score || 0))}%` }}/></div>
                <div className="rr-bar-v">{score ?? '—'}</div>
                <div className={`rr-bar-d ${deltaClass(d)}`}>{d == null ? '—' : (d > 0 ? '+' : '') + d}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* TREND */}
      {total_runs > 1 && (
        <div className="rr-card">
          <div className="rr-section-h">
            <div>Score trend across all runs</div>
            <span className="rr-hint">{total_runs} runs</span>
          </div>
          <TrendChart trend={trend} />
        </div>
      )}

      {/* DETAILED FEEDBACK */}
      <div className="rr-card">
        <div className="rr-section-h">
          <div>Detailed feedback</div>
          <button className="rr-btn-sm" onClick={() => copy(formatAllFeedback(latest), 'all-feedback')}>📋 Copy all</button>
        </div>
        {latest.feedback?.summary && (
          <div className="rr-fb-sum">{latest.feedback.summary}</div>
        )}
        {CRITERIA_KEYS.map(key => {
          const text = latest.feedback?.[key]
          if (!text) return null
          return (
            <div key={key} className="rr-fb-block">
              <div className="rr-fb-hdr">
                <div className="rr-fb-l">
                  {CRITERIA_LABELS[key]} · <span className={scoreColorClass(latest.scores?.[key])}>{latest.scores?.[key] ?? '—'}/100</span>
                </div>
                <button className="rr-btn-icon" onClick={() => copy(text, key)} title="Copy section">📋</button>
              </div>
              <div className="rr-fb-text">{text}</div>
            </div>
          )
        })}
      </div>

      {/* STRENGTHS + IMPROVEMENTS */}
      <div className="rr-row-2">
        {latest.strengths?.length > 0 && (
          <div className="rr-card rr-strengths">
            <div className="rr-section-h">
              <div>✓ Strengths · {latest.strengths.length}</div>
              <button className="rr-btn-icon" onClick={() => copy(latest.strengths.map((s,i) => `${i+1}. ${s}`).join('\n'), 'strengths')} title="Copy">📋</button>
            </div>
            <ol className="rr-list">
              {latest.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
        {latest.improvements?.length > 0 && (
          <div className="rr-card rr-improvements">
            <div className="rr-section-h">
              <div>💡 Improvements · {latest.improvements.length}</div>
              <button className="rr-btn-icon" onClick={() => copy(latest.improvements.map((s,i) => `${i+1}. ${s}`).join('\n'), 'improvements')} title="Copy">📋</button>
            </div>
            <ol className="rr-list">
              {latest.improvements.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
      </div>

      {/* FILES REVIEWED */}
      {latest.files_reviewed?.length > 0 && (
        <details className="rr-card rr-files">
          <summary><span>📁 {latest.files_reviewed.length} files reviewed</span></summary>
          <ul className="rr-files-list">
            {latest.files_reviewed.map((f, i) => <li key={i}><code>{f}</code></li>)}
          </ul>
        </details>
      )}

      <Styles />
    </ReportShell>
  )
}

// ─────────────────────────────────────────
// HELPERS / SUB-COMPONENTS
// ─────────────────────────────────────────

function ReportShell({ children }) {
  return <div className="rr-wrap">{children}</div>
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function scoreColorClass(score) {
  if (score == null) return 'rr-score-na'
  if (score >= 80) return 'rr-score-green'
  if (score >= 60) return 'rr-score-amber'
  if (score >= 40) return 'rr-score-orange'
  return 'rr-score-red'
}

function deltaClass(d) {
  if (d == null) return 'rr-d-neutral'
  if (d > 0) return 'rr-d-up'
  if (d < 0) return 'rr-d-down'
  return 'rr-d-neutral'
}

function formatAllFeedback(latest) {
  const parts = []
  if (latest.feedback?.summary) parts.push(`Summary:\n${latest.feedback.summary}`)
  for (const key of CRITERIA_KEYS) {
    const text = latest.feedback?.[key]
    if (text) parts.push(`\n${CRITERIA_LABELS[key]} (${latest.scores?.[key] ?? '?'}/100):\n${text}`)
  }
  if (latest.strengths?.length) parts.push(`\nStrengths:\n${latest.strengths.map((s,i) => `${i+1}. ${s}`).join('\n')}`)
  if (latest.improvements?.length) parts.push(`\nImprovements:\n${latest.improvements.map((s,i) => `${i+1}. ${s}`).join('\n')}`)
  return parts.join('\n')
}

function TrendChart({ trend }) {
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
    <svg viewBox={`0 0 ${W} ${H}`} className="rr-trend">
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
            {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : `Run ${i+1}`}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Styles() {
  return (
    <style>{`
      .rr-wrap{font-family:'DM Sans',sans-serif;color:#fff;display:flex;flex-direction:column;gap:14px;animation:rrIn .4s ease both}
      @keyframes rrIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

      .rr-loading{padding:50px 20px;text-align:center;color:rgba(255,255,255,.4);font-size:.85rem}
      .rr-error{padding:24px;border-radius:14px;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25)}
      .rr-error-h{font-weight:700;font-size:.95rem;margin-bottom:6px;color:#fd1c00}
      .rr-error-m{font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:10px}

      .rr-empty{padding:50px 24px;text-align:center}
      .rr-empty-icon{font-size:48px;margin-bottom:12px;opacity:.6}
      .rr-empty-h{font-size:1rem;font-weight:700;margin-bottom:6px}
      .rr-empty-m{font-size:.78rem;color:rgba(255,255,255,.55);max-width:480px;margin:0 auto;line-height:1.6}

      .rr-card{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}

      .rr-hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}
      .rr-hdr-l{flex:1;min-width:240px}
      .rr-tag{font-size:.65rem;font-weight:800;letter-spacing:1.2px;color:#fd1c00;margin-bottom:5px}
      .rr-title{font-size:1.3rem;font-weight:800;line-height:1.25;letter-spacing:-.01em;margin-bottom:10px}
      .rr-meta{display:flex;gap:7px;flex-wrap:wrap}
      .rr-pill{padding:3px 11px;border-radius:6px;background:rgba(255,255,255,.04);font-size:.65rem;color:rgba(255,255,255,.7);font-weight:600}
      .rr-pill-source{background:rgba(238,167,39,.08);color:#EEA727}
      .rr-hdr-r{text-align:right}
      .rr-hdr-r-l{font-size:.6rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;margin-bottom:3px}
      .rr-hdr-r-v{font-size:.78rem;color:rgba(255,255,255,.85);font-weight:600}

      .rr-row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}

      .rr-score-l,.rr-delta-l{font-size:.65rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;margin-bottom:8px}
      .rr-score-v{display:flex;align-items:baseline;gap:4px}
      .rr-score-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:2.5rem;font-weight:800;line-height:1}
      .rr-score-suffix{font-size:.9rem;color:rgba(255,255,255,.4)}
      .rr-score-sub{font-size:.65rem;color:rgba(255,255,255,.4);margin-top:6px}

      .rr-delta{}
      .rr-delta.rr-d-up{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.25)}
      .rr-delta.rr-d-down{background:rgba(253,28,0,.05);border-color:rgba(253,28,0,.2)}
      .rr-delta-v{display:flex;align-items:baseline;gap:6px;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.8rem;font-weight:800;line-height:1}
      .rr-delta-arrow{font-size:1.5rem}
      .rr-delta-empty{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif}
      .rr-delta-sub{font-size:.65rem;color:rgba(255,255,255,.55);margin-top:6px;font-weight:600}

      .rr-d-up,.rr-d-up *{color:#4ade80}
      .rr-d-down,.rr-d-down *{color:#fd1c00}
      .rr-d-neutral{color:rgba(255,255,255,.4)}

      .rr-section-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:.9rem;font-weight:700}
      .rr-hint{font-size:.65rem;color:rgba(255,255,255,.4);font-weight:500}

      .rr-bars{display:flex;flex-direction:column;gap:9px}
      .rr-bar-row{display:grid;grid-template-columns:160px 1fr 50px 50px;gap:10px;align-items:center}
      .rr-bar-l{font-size:.78rem;color:rgba(255,255,255,.85)}
      .rr-bar-track{background:rgba(255,255,255,.04);height:8px;border-radius:999px;overflow:hidden}
      .rr-bar-fill{height:100%;border-radius:999px;transition:width .4s ease}
      .rr-bar-v{font-size:.85rem;font-weight:700;text-align:right}
      .rr-bar-d{font-size:.7rem;text-align:right;font-weight:700}

      .rr-score-green,.rr-bar-fill.rr-score-green{background:#4ade80;color:#4ade80}
      .rr-score-amber,.rr-bar-fill.rr-score-amber{background:#EEA727;color:#EEA727}
      .rr-score-orange,.rr-bar-fill.rr-score-orange{background:#fd7000;color:#ff5349}
      .rr-score-red,.rr-bar-fill.rr-score-red{background:#fd1c00;color:#fd1c00}
      .rr-score-na{color:rgba(255,255,255,.3)}

      .rr-trend{width:100%;height:auto;display:block}

      .rr-fb-sum{padding:12px 14px;background:rgba(238,167,39,.05);border-left:3px solid #EEA727;border-radius:0 8px 8px 0;font-size:.8rem;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:14px}
      .rr-fb-block{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.05)}
      .rr-fb-block:last-child{border-bottom:none}
      .rr-fb-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
      .rr-fb-l{font-size:.82rem;font-weight:700}
      .rr-fb-text{font-size:.78rem;line-height:1.65;color:rgba(255,255,255,.75)}

      .rr-strengths{background:rgba(74,222,128,.04);border-color:rgba(74,222,128,.18)}
      .rr-improvements{background:rgba(238,167,39,.04);border-color:rgba(238,167,39,.18)}
      .rr-list{margin:0;padding-left:24px;font-size:.78rem;line-height:1.65;color:rgba(255,255,255,.85)}
      .rr-list li{margin-bottom:6px}
      .rr-strengths .rr-list{color:rgba(255,255,255,.85)}

      .rr-files{cursor:pointer}
      .rr-files summary{font-size:.78rem;color:rgba(255,255,255,.7);font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center}
      .rr-files summary::after{content:'▼';font-size:.6rem;color:rgba(255,255,255,.4)}
      .rr-files[open] summary::after{transform:rotate(180deg)}
      .rr-files-list{margin:14px 0 0;padding-left:24px;font-size:.72rem;color:rgba(255,255,255,.6);max-height:200px;overflow-y:auto}
      .rr-files-list li{margin-bottom:3px}
      .rr-files-list code{background:rgba(255,255,255,.04);padding:1px 6px;border-radius:4px;font-family:'JetBrains Mono','Courier New',monospace;font-size:.7rem}

      .rr-btn-sm{padding:5px 12px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s}
      .rr-btn-sm:hover{background:rgba(255,255,255,.1)}
      .rr-btn-icon{padding:4px 8px;border-radius:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-size:.75rem;cursor:pointer;transition:all .15s}
      .rr-btn-icon:hover{background:rgba(255,255,255,.1);color:#fff}

      @media (max-width: 768px) {
        .rr-row-2{grid-template-columns:1fr}
        .rr-bar-row{grid-template-columns:120px 1fr 40px 40px;gap:6px}
        .rr-bar-l{font-size:.7rem}
        .rr-card{padding:14px 16px}
      }
    `}</style>
  )
}