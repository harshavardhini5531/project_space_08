// app/admin/components/AdminReviewScores.js
//
// Admin dashboard: review scores summary.
// Shows: KPI cards, score distribution histogram, filterable+sortable table,
//        tech breakdown. Click row -> opens full report.

'use client'
import { useState, useEffect, useMemo } from 'react'

export default function AdminReviewScores({ adminEmail }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score-desc')

  // Modal — show full report
  const [openTeam, setOpenTeam] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportData, setReportData] = useState(null)

  async function fetchScores() {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/review-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
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

  useEffect(() => { fetchScores() }, [adminEmail])

  // Filtered + sorted teams
  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let list = data.teams

    // Search
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      list = list.filter(t =>
        t.team_number?.toLowerCase().includes(s) ||
        t.project_title?.toLowerCase().includes(s)
      )
    }

    // Tech filter
    if (techFilter !== 'all') {
      list = list.filter(t => t.technology === techFilter)
    }

    // Sort
    const sorted = [...list]
    if (sortBy === 'score-desc') {
      sorted.sort((a, b) => (b.latest_score ?? -1) - (a.latest_score ?? -1))
    } else if (sortBy === 'score-asc') {
      sorted.sort((a, b) => (a.latest_score ?? 999) - (b.latest_score ?? 999))
    } else if (sortBy === 'delta-desc') {
      sorted.sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.last_run_at || 0) - new Date(a.last_run_at || 0))
    }
    return sorted
  }, [data, search, techFilter, sortBy])

  const techOptions = useMemo(() => {
    if (!data?.teams) return []
    return Array.from(new Set(data.teams.map(t => t.technology).filter(Boolean))).sort()
  }, [data])

  async function openReport(teamNumber) {
    setOpenTeam(teamNumber)
    setReportLoading(true); setReportData(null)
    try {
      const r = await fetch('/api/project-review/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNumber }),
      })
      const d = await r.json()
      if (r.ok && d.ok) setReportData(d)
    } catch {} finally { setReportLoading(false) }
  }

  function exportXLSX() {
    if (!filteredTeams.length) { alert('No data to export'); return }
    // Build CSV (simple) — XLSX would need SheetJS but CSV opens in Excel fine
    const headers = ['Team', 'Project', 'Technology', 'Latest Score', 'Delta', 'Runs', 'Last Run', 'Mentor Eval Avg']
    const rows = filteredTeams.map(t => [
      t.team_number,
      `"${(t.project_title || '').replace(/"/g, '""')}"`,
      t.technology,
      t.latest_score ?? '',
      t.delta ?? '',
      t.total_runs ?? '',
      t.last_run_at ? new Date(t.last_run_at).toLocaleDateString('en-IN') : '',
      t.mentor_eval_avg ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `review_scores_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="ars-loading">Loading review scores…</div>
  if (error) return (
    <div className="ars-error">
      <div className="ars-err-h">Could not load scores</div>
      <div className="ars-err-m">{error}</div>
      <button className="ars-btn-sm" onClick={fetchScores}>Retry</button>
    </div>
  )

  const stats = data?.stats || {}
  const distribution = data?.distribution || {}
  const techAvg = data?.tech_avg || []

  return (
    <div className="ars-section">
      <Styles />

      {/* HEADER */}
      <div className="ars-hdr">
        <div>
          <div className="ars-title">Project review scores</div>
          <div className="ars-sub">All AI-reviewed teams · {data?.teams?.[0]?.source === 'dev' ? 'sourced from Dev API' : 'mixed sources'}</div>
        </div>
        <div className="ars-actions">
          <button className="ars-btn" onClick={fetchScores}>↻ Refresh</button>
          <button className="ars-btn" onClick={exportXLSX}>↓ Export CSV</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="ars-kpi-row">
        <div className="ars-kpi">
          <div className="ars-kpi-l">Teams reviewed</div>
          <div className="ars-kpi-v">{stats.total_teams_with_reviews}<span className="ars-kpi-suf"> / {stats.total_teams}</span></div>
          <div className="ars-kpi-sub">{stats.total_teams > 0 ? Math.round((stats.total_teams_with_reviews / stats.total_teams) * 100) : 0}% coverage</div>
        </div>
        <div className="ars-kpi">
          <div className="ars-kpi-l">Avg score</div>
          <div className={`ars-kpi-v ${scoreClass(stats.avg_score)}`}>{stats.avg_score}<span className="ars-kpi-suf"> / 100</span></div>
          <div className="ars-kpi-sub">across {stats.total_teams_with_reviews} teams</div>
        </div>
        <div className="ars-kpi">
          <div className="ars-kpi-l">Total runs</div>
          <div className="ars-kpi-v">{stats.total_runs}</div>
          <div className="ars-kpi-sub">{stats.total_teams_with_reviews > 0 ? (stats.total_runs / stats.total_teams_with_reviews).toFixed(1) : 0} avg per team</div>
        </div>
        <div className="ars-kpi">
          <div className="ars-kpi-l">Improving</div>
          <div className="ars-kpi-v" style={{color:'#4ade80'}}>{stats.improving}</div>
          <div className="ars-kpi-sub">vs {stats.declining} declining</div>
        </div>
      </div>

      {/* DISTRIBUTION */}
      <div className="ars-card">
        <div className="ars-section-h">
          <div>Score distribution</div>
          <span className="ars-hint">{stats.total_teams_with_reviews} teams</span>
        </div>
        <Distribution distribution={distribution}/>
      </div>

      {/* FILTERS */}
      <div className="ars-card ars-filters">
        <input
          className="ars-input"
          type="text"
          placeholder="Search team or project…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="ars-select" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          <option value="all">All technologies</option>
          {techOptions.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t}</option>)}
        </select>
        <select className="ars-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="score-desc" style={{background:'#13101a'}}>Sort: Score (high → low)</option>
          <option value="score-asc" style={{background:'#13101a'}}>Sort: Score (low → high)</option>
          <option value="delta-desc" style={{background:'#13101a'}}>Sort: Δ (most improved)</option>
          <option value="recent" style={{background:'#13101a'}}>Sort: Most recent run</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="ars-table-wrap">
        <table className="ars-table">
          <thead>
            <tr>
              <th style={{width:'80px'}}>Team</th>
              <th>Project</th>
              <th style={{width:'100px'}}>Tech</th>
              <th style={{width:'70px',textAlign:'right'}}>Score</th>
              <th style={{width:'60px',textAlign:'right'}}>Δ</th>
              <th style={{width:'60px',textAlign:'right'}}>Runs</th>
              <th style={{width:'90px',textAlign:'right'}}>Mentor avg</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.slice(0, 200).map(t => (
              <tr key={t.team_number} className="ars-row" onClick={() => openReport(t.team_number)}>
                <td className="ars-tn">{t.team_number}</td>
                <td className="ars-pt">{t.project_title}</td>
                <td className="ars-tech">{t.technology}</td>
                <td className={`ars-score ${scoreClass(t.latest_score)}`}>{t.latest_score ?? '—'}</td>
                <td className={`ars-delta ${deltaClass(t.delta)}`}>{t.delta == null ? '—' : (t.delta > 0 ? '+' : '') + t.delta}</td>
                <td className="ars-runs">{t.total_runs}</td>
                <td className="ars-meval">{t.mentor_eval_avg != null ? `${t.mentor_eval_avg} / 10` : <span style={{color:'rgba(255,255,255,.3)'}}>— pending</span>}</td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
              <tr><td colSpan="7" className="ars-empty">No teams match filters</td></tr>
            )}
          </tbody>
        </table>
        {filteredTeams.length > 0 && (
          <div className="ars-table-foot">Showing {Math.min(200, filteredTeams.length)} of {filteredTeams.length} · click a row to open full report</div>
        )}
      </div>

      {/* TECH BREAKDOWN */}
      <div className="ars-card">
        <div className="ars-section-h">Average score by technology</div>
        <div className="ars-tech-rows">
          {techAvg.map(t => (
            <div key={t.technology} className="ars-tech-row">
              <div className="ars-tech-l">{t.technology}</div>
              <div className="ars-tech-track"><div className={`ars-tech-fill ${scoreClass(t.avg)}`} style={{width:`${Math.max(0,Math.min(100,t.avg))}%`}}/></div>
              <div className="ars-tech-v">{t.avg}</div>
              <div className="ars-tech-c">{t.count} teams</div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL — full report */}
      {openTeam && (
        <div className="ars-modal-backdrop" onClick={() => { setOpenTeam(null); setReportData(null) }}>
          <div className="ars-modal" onClick={e => e.stopPropagation()}>
            <div className="ars-modal-hdr">
              <div className="ars-modal-title">{openTeam} — Full Review Report</div>
              <button className="ars-modal-close" onClick={() => { setOpenTeam(null); setReportData(null) }}>✕</button>
            </div>
            <div className="ars-modal-body">
              {reportLoading ? (
                <div className="ars-loading">Loading report…</div>
              ) : reportData?.has_reports ? (
                <ReportContent data={reportData}/>
              ) : (
                <div className="ars-empty" style={{padding:'40px'}}>No review available for this team yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════

function scoreClass(s) {
  if (s == null) return ''
  if (s >= 80) return 'ars-s-green'
  if (s >= 60) return 'ars-s-amber'
  if (s >= 40) return 'ars-s-orange'
  return 'ars-s-red'
}

function deltaClass(d) {
  if (d == null) return ''
  if (d > 0) return 'ars-d-up'
  if (d < 0) return 'ars-d-down'
  return ''
}

function Distribution({ distribution }) {
  const W = 600, H = 140, pad = { l: 20, r: 20, t: 25, b: 30 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const buckets = ['0-20', '21-40', '41-60', '61-80', '81-100']
  const colors = ['#A32D2D', '#E24B4A', '#BA7517', '#EF9F27', '#1D9E75']
  const max = Math.max(...buckets.map(b => distribution[b] || 0), 1)
  const barW = innerW / buckets.length - 8

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
      {buckets.map((b, i) => {
        const value = distribution[b] || 0
        const barH = (value * innerH) / max
        const x = pad.l + i * (innerW / buckets.length) + 4
        const y = pad.t + innerH - barH
        return (
          <g key={b}>
            <rect x={x} y={y} width={barW} height={barH} fill={colors[i]} rx="3"/>
            <text x={x + barW/2} y={y - 5} textAnchor="middle" fill="rgba(255,255,255,.85)" fontSize="11" fontWeight="700">{value}</text>
            <text x={x + barW/2} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="10">{b}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ReportContent({ data }) {
  const { team, latest, delta_from_previous } = data
  return (
    <div style={{padding:'14px 0'}}>
      <div style={{fontSize:'.75rem',color:'rgba(255,255,255,.5)',marginBottom:6}}>{team.team_number} · {team.technology}</div>
      <div style={{fontSize:'1.1rem',fontWeight:800,marginBottom:14}}>{team.project_title}</div>

      <div style={{display:'flex',gap:14,marginBottom:14}}>
        <div style={{padding:'12px 16px',borderRadius:9,background:'rgba(255,255,255,.04)',flex:1}}>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',marginBottom:4}}>Overall</div>
          <div className={scoreClass(latest.overall_score)} style={{fontSize:'1.8rem',fontWeight:800}}>{latest.overall_score}/100</div>
        </div>
        {delta_from_previous?.overall != null && (
          <div style={{padding:'12px 16px',borderRadius:9,background:delta_from_previous.overall > 0 ? 'rgba(74,222,128,.08)' : 'rgba(253,28,0,.05)',flex:1}}>
            <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',marginBottom:4}}>Change</div>
            <div style={{fontSize:'1.4rem',fontWeight:800,color:delta_from_previous.overall > 0 ? '#4ade80' : '#fd1c00'}}>
              {delta_from_previous.overall > 0 ? '+' : ''}{delta_from_previous.overall}
            </div>
          </div>
        )}
      </div>

      {latest.feedback?.summary && (
        <div style={{padding:'12px 14px',background:'rgba(238,167,39,.05)',borderLeft:'3px solid #EEA727',marginBottom:14,fontSize:'.78rem',lineHeight:1.6,color:'rgba(255,255,255,.85)'}}>
          {latest.feedback.summary}
        </div>
      )}

      {latest.strengths?.length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:'.78rem',fontWeight:700,marginBottom:6,color:'#4ade80'}}>✓ Strengths</div>
          <ol style={{margin:0,paddingLeft:24,fontSize:'.75rem',lineHeight:1.6,color:'rgba(255,255,255,.8)'}}>
            {latest.strengths.map((s,i) => <li key={i} style={{marginBottom:4}}>{s}</li>)}
          </ol>
        </div>
      )}

      {latest.improvements?.length > 0 && (
        <div>
          <div style={{fontSize:'.78rem',fontWeight:700,marginBottom:6,color:'#EEA727'}}>💡 Improvements</div>
          <ol style={{margin:0,paddingLeft:24,fontSize:'.75rem',lineHeight:1.6,color:'rgba(255,255,255,.8)'}}>
            {latest.improvements.map((s,i) => <li key={i} style={{marginBottom:4}}>{s}</li>)}
          </ol>
        </div>
      )}
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .ars-section{font-family:'DM Sans',sans-serif;color:#fff;animation:arsIn .4s ease both;padding-bottom:20px}
      @keyframes arsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

      .ars-loading{padding:40px;text-align:center;color:rgba(255,255,255,.4);font-size:.85rem}
      .ars-error{padding:24px;border-radius:14px;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25)}
      .ars-err-h{font-weight:700;font-size:.95rem;color:#fd1c00;margin-bottom:6px}
      .ars-err-m{font-size:.78rem;color:rgba(255,255,255,.7);margin-bottom:10px}

      .ars-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:10px}
      .ars-title{font-size:1.15rem;font-weight:700;letter-spacing:-.01em}
      .ars-sub{font-size:.7rem;color:rgba(255,255,255,.45);margin-top:3px}
      .ars-actions{display:flex;gap:8px}
      .ars-btn{padding:7px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s}
      .ars-btn:hover{background:rgba(255,255,255,.1)}

      .ars-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
      .ars-kpi{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
      .ars-kpi-l{font-size:.62rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:700;margin-bottom:7px}
      .ars-kpi-v{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.6rem;font-weight:800;line-height:1}
      .ars-kpi-suf{font-size:.85rem;color:rgba(255,255,255,.4);font-weight:600}
      .ars-kpi-sub{font-size:.62rem;color:rgba(255,255,255,.4);margin-top:5px}

      .ars-card{padding:16px 20px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:14px}
      .ars-section-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:.85rem;font-weight:700}
      .ars-hint{font-size:.62rem;color:rgba(255,255,255,.4);font-weight:500}

      .ars-filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .ars-input,.ars-select{padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:inherit;font-size:.75rem;outline:none}
      .ars-input{flex:1;min-width:200px}
      .ars-input:focus,.ars-select:focus{border-color:rgba(238,167,39,.4)}

      .ars-table-wrap{margin-bottom:14px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);overflow:hidden}
      .ars-table{width:100%;border-collapse:collapse;font-size:.75rem;table-layout:fixed}
      .ars-table th{text-align:left;padding:10px 12px;font-size:.62rem;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:1.1px;background:rgba(255,255,255,.02)}
      .ars-row{border-top:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background .15s}
      .ars-row:hover{background:rgba(255,255,255,.03)}
      .ars-row td{padding:10px 12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ars-tn{color:#fd1c00;font-weight:800}
      .ars-pt{font-weight:600;color:rgba(255,255,255,.85)}
      .ars-tech{color:rgba(255,255,255,.6);font-size:.7rem}
      .ars-score{text-align:right;font-weight:800;font-size:.85rem}
      .ars-delta{text-align:right;font-weight:700;font-size:.7rem}
      .ars-runs{text-align:right;color:rgba(255,255,255,.6)}
      .ars-meval{text-align:right;color:rgba(255,255,255,.75);font-size:.7rem}
      .ars-empty{text-align:center;padding:24px;color:rgba(255,255,255,.4);font-size:.78rem}
      .ars-table-foot{padding:10px 14px;border-top:1px solid rgba(255,255,255,.05);font-size:.65rem;color:rgba(255,255,255,.4);text-align:center}

      .ars-s-green{color:#4ade80}
      .ars-s-amber{color:#EEA727}
      .ars-s-orange{color:#ff5349}
      .ars-s-red{color:#fd1c00}
      .ars-d-up{color:#4ade80}
      .ars-d-down{color:#fd1c00}

      .ars-tech-rows{display:flex;flex-direction:column;gap:9px}
      .ars-tech-row{display:grid;grid-template-columns:140px 1fr 50px 80px;gap:10px;align-items:center}
      .ars-tech-l{font-size:.78rem;color:rgba(255,255,255,.85)}
      .ars-tech-track{background:rgba(255,255,255,.04);height:8px;border-radius:999px;overflow:hidden}
      .ars-tech-fill{height:100%;border-radius:999px;background:#EEA727}
      .ars-tech-fill.ars-s-green{background:#4ade80}
      .ars-tech-fill.ars-s-amber{background:#EEA727}
      .ars-tech-fill.ars-s-orange{background:#ff5349}
      .ars-tech-fill.ars-s-red{background:#fd1c00}
      .ars-tech-v{text-align:right;font-weight:800;font-size:.85rem}
      .ars-tech-c{text-align:right;font-size:.65rem;color:rgba(255,255,255,.4)}

      .ars-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
      .ars-modal{background:#13101a;border:1px solid rgba(255,255,255,.1);border-radius:14px;max-width:720px;width:100%;max-height:85vh;display:flex;flex-direction:column;overflow:hidden}
      .ars-modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06)}
      .ars-modal-title{font-size:.95rem;font-weight:700}
      .ars-modal-close{background:none;border:none;color:rgba(255,255,255,.5);font-size:1.2rem;cursor:pointer;padding:4px 10px;border-radius:6px}
      .ars-modal-close:hover{background:rgba(255,255,255,.05);color:#fff}
      .ars-modal-body{padding:14px 18px;overflow-y:auto;flex:1}

      .ars-btn-sm{padding:5px 12px;border-radius:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#fff;font-family:inherit;font-size:.7rem;font-weight:600;cursor:pointer}

      @media (max-width:768px){
        .ars-kpi-row{grid-template-columns:repeat(2,1fr)}
        .ars-tech-row{grid-template-columns:100px 1fr 40px 50px;gap:6px}
        .ars-tech-l{font-size:.7rem}
        .ars-table{font-size:.7rem}
        .ars-table th,.ars-row td{padding:7px 8px}
      }
    `}</style>
  )
}