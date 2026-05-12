'use client'
import { useState, useEffect, useMemo } from 'react'

const TC = {
  'AWS Development': '#ff9900',
  'Google Flutter': '#42a5f5',
  'Full Stack': '#4ade80',
  'Data Specialist': '#a78bfa',
  'ServiceNow': '#22c55e',
  'VLSI': '#ef4444',
  'SkillUp Coder': '#f59e0b',
}

export default function MentorLeaderboard({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [showRules, setShowRules] = useState(false) // start collapsed for mentor

  const mentorEmail = mentor?.email

  async function fetchLeaderboard() {
    if (!mentorEmail) return
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/mentor/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorEmail }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) { setError(d.error || 'Failed to load'); return }
      setData(d)
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (mentorEmail) fetchLeaderboard() }, [mentorEmail])

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let arr = data.teams
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(t =>
        (t.team_number || '').toLowerCase().includes(q) ||
        (t.project_title || '').toLowerCase().includes(q) ||
        (t.mentor || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...arr]
    const dir = sortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      const av = a[sortBy] ?? 0
      const bv = b[sortBy] ?? 0
      if (typeof av === 'string') return dir * av.localeCompare(bv)
      return dir * (av - bv)
    })
    return sorted
  }, [data, search, sortBy, sortDir])

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(field === 'rank' || field === 'team_number' ? 'asc' : 'desc')
    }
  }

  function exportCSV() {
    if (!filteredTeams.length) return
    const headers = ['Rank','Team','Project','Mentor','Members',
      'Review/60','MEval/20','Stages/8','Att/6','Certs/4','PPT/2','Total/100']
    const rows = filteredTeams.map(t => [
      t.rank, t.team_number, `"${(t.project_title||'').replace(/"/g,'""')}"`,
      `"${(t.mentor||'').replace(/"/g,'""')}"`, t.member_count,
      t.review_points, t.mentor_points, t.stage_points,
      t.attendance_points, t.cert_points, t.ppt_points,
      t.grand_total,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard_${(data?.summary?.technology || 'all').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'Inter,DM Sans,sans-serif',fontSize:'.85rem'}}>Loading leaderboard…</div>

  if (error) return (
    <div style={{padding:24,borderRadius:14,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.25)',fontFamily:'Inter,DM Sans,sans-serif'}}>
      <div style={{fontWeight:700,fontSize:'.95rem',color:'#fd1c00',marginBottom:6}}>Could not load leaderboard</div>
      <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.7)',marginBottom:10}}>{error}</div>
      <button onClick={fetchLeaderboard} style={{padding:'5px 12px',borderRadius:7,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.7rem',fontWeight:600,cursor:'pointer'}}>Retry</button>
    </div>
  )

  if (!data) return null

  const summary = data.summary || {}
  const rules = data.rules || []
  const tech = summary.technology || mentor?.technology || '—'
  const techColor = TC[tech] || '#fd1c00'

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.mlb{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.mlb-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:12px}
.mlb-title-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.mlb-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff}
.mlb-tech-badge{padding:5px 12px;border-radius:8px;font-size:.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;display:inline-block}
.mlb-sub{font-size:.75rem;color:rgba(255,255,255,.45);margin-top:4px;font-weight:500}
.mlb-actions{display:flex;gap:8px}
.mlb-btn{padding:9px 16px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s}
.mlb-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
.mlb-btn.primary{background:linear-gradient(135deg,#fd1c00,#c41600);border-color:transparent}
.mlb-btn.primary:hover{box-shadow:0 0 14px rgba(253,28,0,.3)}

.mlb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.mlb-kpi{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
.mlb-kpi::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,var(--gw,rgba(253,28,0,.05)),transparent 60%);pointer-events:none}
.mlb-kpi-l{font-size:.6rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;margin-bottom:8px}
.mlb-kpi-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.65rem;font-weight:700;line-height:1;letter-spacing:-0.02em;position:relative}

.mlb-rules{margin-bottom:16px;border-radius:13px;background:linear-gradient(135deg,rgba(238,167,39,.04),rgba(253,28,0,.02));border:1px solid rgba(238,167,39,.18)}
.mlb-rules-hdr{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none}
.mlb-rules-hdr:hover{background:rgba(255,255,255,.02)}
.mlb-rules-title{font-size:.88rem;font-weight:700;color:#EEA727;display:flex;align-items:center;gap:8px;letter-spacing:-0.01em}
.mlb-rules-title::before{content:'⚖';font-size:1rem}
.mlb-rules-meta{font-size:.7rem;color:rgba(255,255,255,.5);font-weight:500;margin-left:6px}
.mlb-rules-chev{color:rgba(255,255,255,.45);font-size:.75rem;transition:transform .2s}
.mlb-rules-chev.on{transform:rotate(180deg)}
.mlb-rules-body{padding:0 18px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:11px}
.mlb-rule{padding:13px 14px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.mlb-rule-top{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;gap:8px}
.mlb-rule-lab{font-size:.82rem;font-weight:700;color:#fff;letter-spacing:-0.01em}
.mlb-rule-max{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:700;color:#EEA727;background:rgba(238,167,39,.1);padding:3px 10px;border-radius:6px;border:1px solid rgba(238,167,39,.22)}
.mlb-rule-form{font-size:.68rem;font-family:'Courier New',monospace;color:rgba(255,255,255,.6);background:rgba(0,0,0,.28);padding:6px 9px;border-radius:5px;margin-bottom:7px}
.mlb-rule-ex{font-size:.7rem;color:rgba(255,255,255,.55);line-height:1.55;font-weight:400}

.mlb-controls{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.mlb-search{flex:1;min-width:200px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:500;outline:none}
.mlb-search:focus{border-color:rgba(253,28,0,.3);background:rgba(255,255,255,.06)}
.mlb-search::placeholder{color:rgba(255,255,255,.3);font-weight:400}
.mlb-count{font-size:.7rem;color:rgba(255,255,255,.35);margin-left:auto;font-weight:500}

.mlb-tbl-wrap{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:auto;-webkit-overflow-scrolling:touch}
.mlb-tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:1100px}
.mlb-tbl thead{position:sticky;top:0;background:rgba(12,8,20,.97);backdrop-filter:blur(10px);z-index:2}
.mlb-tbl th{padding:12px 11px;text-align:left;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;cursor:pointer;user-select:none;font-family:'Inter',sans-serif}
.mlb-tbl th:hover{color:#fff;background:rgba(255,255,255,.025)}
.mlb-tbl th.num{text-align:right;padding-right:14px}
.mlb-tbl th.center{text-align:center}
.mlb-tbl th .sort-ind{margin-left:4px;font-size:.6rem;color:rgba(253,28,0,.8)}

.mlb-tbl td{padding:11px;font-size:.74rem;color:rgba(255,255,255,.88);border-bottom:1px solid rgba(255,255,255,.04);white-space:nowrap;font-family:'Inter',sans-serif;font-weight:500}
.mlb-tbl td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;padding-right:14px}
.mlb-tbl td.center{text-align:center}
.mlb-tbl tr:hover td{background:rgba(255,255,255,.025)}
.mlb-tbl tr.top1 td{background:linear-gradient(90deg,rgba(245,158,11,.06),transparent)}
.mlb-tbl tr.top2 td{background:linear-gradient(90deg,rgba(148,163,184,.05),transparent)}
.mlb-tbl tr.top3 td{background:linear-gradient(90deg,rgba(198,138,91,.05),transparent)}

.mlb-rank{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.95rem;font-weight:700;text-align:center;width:52px;letter-spacing:-0.02em}
.mlb-rank.gold{color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,.35)}
.mlb-rank.silver{color:#cbd5e1}
.mlb-rank.bronze{color:#c68a5b}

.mlb-team-cell{color:#fd1c00;font-weight:700;font-size:.8rem;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.mlb-proj-cell{color:rgba(255,255,255,.88);font-weight:600;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mlb-mentor{color:rgba(255,255,255,.48);font-size:.68rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}

.mlb-pt{display:inline-block;padding:3px 10px;border-radius:6px;font-size:.72rem;font-weight:700;min-width:46px;text-align:center;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.mlb-pt.zero{background:rgba(255,255,255,.03);color:rgba(255,255,255,.28)}
.mlb-pt.full{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
.mlb-pt.high{background:rgba(74,222,128,.08);color:#86efac;border:1px solid rgba(74,222,128,.18)}
.mlb-pt.med{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.2)}
.mlb-pt.low{background:rgba(253,28,0,.08);color:#ff6b5e;border:1px solid rgba(253,28,0,.2)}

.mlb-grand{text-align:right;padding-right:14px;white-space:nowrap}
.mlb-grand-num{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:0.95rem;font-weight:800;color:#fd1c00;letter-spacing:-0.02em;display:inline-block}
.mlb-out{color:rgba(255,255,255,.35);font-weight:500;font-size:.66rem;margin-left:4px;display:inline-block}

.mlb-empty{padding:40px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem;font-weight:500}

@media(max-width:768px){
  .mlb-rules-body{grid-template-columns:1fr}
  .mlb-kpis{grid-template-columns:repeat(2,1fr)}
  .mlb-title{font-size:1.15rem}
}
      `}</style>

      <div className="mlb">
        {/* HEADER */}
        <div className="mlb-hdr">
          <div>
            <div className="mlb-title-row">
              <div className="mlb-title">Leaderboard</div>
              <span className="mlb-tech-badge" style={{background:`${techColor}18`,color:techColor,border:`1px solid ${techColor}40`}}>
                {tech}
              </span>
            </div>
            <div className="mlb-sub">{summary.total_teams || 0} teams in your technology · ranked by total points · max 100</div>
          </div>
          <div className="mlb-actions">
            <button className="mlb-btn" onClick={fetchLeaderboard}>↻ Refresh</button>
            <button className="mlb-btn primary" onClick={exportCSV}>↓ Export CSV</button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="mlb-kpis">
          <div className="mlb-kpi" style={{'--gw':'rgba(253,28,0,.08)'}}>
            <div className="mlb-kpi-l">Teams</div>
            <div className="mlb-kpi-v" style={{color:'#fd1c00'}}>{summary.total_teams || 0}</div>
          </div>
          <div className="mlb-kpi" style={{'--gw':'rgba(238,167,39,.08)'}}>
            <div className="mlb-kpi-l">Avg Score</div>
            <div className="mlb-kpi-v" style={{color:'#EEA727'}}>{summary.avg_total || 0}<span style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',marginLeft:5,fontWeight:500}}>/ 100</span></div>
          </div>
          <div className="mlb-kpi" style={{'--gw':'rgba(74,222,128,.08)'}}>
            <div className="mlb-kpi-l">With PPT</div>
            <div className="mlb-kpi-v" style={{color:'#4ade80'}}>{summary.teams_with_ppt || 0}</div>
          </div>
          <div className="mlb-kpi" style={{'--gw':'rgba(167,139,250,.08)'}}>
            <div className="mlb-kpi-l">With Reviews</div>
            <div className="mlb-kpi-v" style={{color:'#a78bfa'}}>{summary.teams_with_review || 0}</div>
          </div>
          <div className="mlb-kpi" style={{'--gw':'rgba(96,165,250,.08)'}}>
            <div className="mlb-kpi-l">Mentor Evaluated</div>
            <div className="mlb-kpi-v" style={{color:'#60a5fa'}}>{summary.teams_with_mentor_eval || 0}</div>
          </div>
          <div className="mlb-kpi" style={{'--gw':'rgba(34,211,238,.08)'}}>
            <div className="mlb-kpi-l">With Certs</div>
            <div className="mlb-kpi-v" style={{color:'#22d3ee'}}>{summary.teams_with_certs || 0}</div>
          </div>
        </div>

        {/* RULES (collapsed by default for mentor) */}
        <div className="mlb-rules">
          <div className="mlb-rules-hdr" onClick={() => setShowRules(s => !s)}>
            <div className="mlb-rules-title">
              Scoring Rules
              <span className="mlb-rules-meta">{rules.length} criteria · 100 max · click to {showRules ? 'hide' : 'view'}</span>
            </div>
            <div className={`mlb-rules-chev ${showRules ? 'on' : ''}`}>▼</div>
          </div>
          {showRules && (
            <div className="mlb-rules-body">
              {rules.map(r => (
                <div key={r.id} className="mlb-rule">
                  <div className="mlb-rule-top">
                    <div className="mlb-rule-lab">{r.label}</div>
                    <div className="mlb-rule-max">{r.max} pts · {r.weight}</div>
                  </div>
                  <div className="mlb-rule-form">{r.formula}</div>
                  <div className="mlb-rule-ex">{r.explainer}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="mlb-controls">
          <input className="mlb-search" placeholder="Search team, project, mentor…" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="mlb-count">{filteredTeams.length} teams</div>
        </div>

        {/* TABLE */}
        {filteredTeams.length === 0 ? (
          <div className="mlb-empty">No teams match your search</div>
        ) : (
          <div className="mlb-tbl-wrap">
            <table className="mlb-tbl">
              <thead>
                <tr>
                  <SortableTh field="rank" label="Rank" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="center"/>
                  <SortableTh field="team_number" label="Team" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
                  <th>Project</th>
                  <th>Mentor</th>
                  <SortableTh field="review_points" label="Review/60" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="mentor_points" label="MEval/20" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="stage_points" label="Stages/8" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="attendance_points" label="Att/6" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="cert_points" label="Certs/4" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="ppt_points" label="PPT/2" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                  <SortableTh field="grand_total" label="Total/100" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map(t => (
                  <tr key={t.team_number} className={t.rank === 1 ? 'top1' : t.rank === 2 ? 'top2' : t.rank === 3 ? 'top3' : ''}>
                    <td className={`mlb-rank ${t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : t.rank === 3 ? 'bronze' : ''}`}>#{t.rank}</td>
                    <td className="mlb-team-cell">{t.team_number}</td>
                    <td className="mlb-proj-cell" title={t.project_title}>{t.project_title}</td>
                    <td className="mlb-mentor" title={t.mentor}>{t.mentor}</td>
                    <td className="num"><PtCell value={t.review_points} max={60}/></td>
                    <td className="num"><PtCell value={t.mentor_points} max={20}/></td>
                    <td className="num"><PtCell value={t.stage_points} max={8}/></td>
                    <td className="num"><PtCell value={t.attendance_points} max={6}/></td>
                    <td className="num"><PtCell value={t.cert_points} max={4}/></td>
                    <td className="num"><PtCell value={t.ppt_points} max={2}/></td>
                    <td className="mlb-grand"><span className="mlb-grand-num">{t.grand_total ?? 0}</span><span className="mlb-out">/100</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTh({ field, label, sortBy, sortDir, onClick, className = '' }) {
  const active = sortBy === field
  return (
    <th className={className} onClick={() => onClick(field)}>
      {label}
      {active && <span className="sort-ind">{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  )
}

function PtCell({ value, max }) {
  if (value == null || value === 0) return <span className="mlb-pt zero">0</span>
  const pct = max > 0 ? (value / max) : 0
  const cls = pct >= 0.99 ? 'full' : pct >= 0.7 ? 'high' : pct >= 0.4 ? 'med' : 'low'
  return <span className={`mlb-pt ${cls}`}>{value}</span>
}