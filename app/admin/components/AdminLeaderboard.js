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

export default function AdminLeaderboard({ adminEmail }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [showRules, setShowRules] = useState(true) // start expanded — rules are important

  async function fetchLeaderboard() {
    if (!adminEmail) return
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
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

  useEffect(() => { if (adminEmail) fetchLeaderboard() }, [adminEmail])

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let arr = data.teams
    if (techFilter !== 'all') arr = arr.filter(t => t.technology === techFilter)
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
  }, [data, search, techFilter, sortBy, sortDir])

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(field === 'rank' || field === 'team_number' || field === 'technology' ? 'asc' : 'desc')
    }
  }

  function exportCSV() {
    if (!filteredTeams.length) return
    const headers = ['Rank','Team','Project','Technology','Mentor','Members',
      'Review/60','Mentor/20','Stages/8','Attendance/6','Certs/4','PPT/2','Total/100']
    const rows = filteredTeams.map(t => [
      t.rank, t.team_number, `"${(t.project_title||'').replace(/"/g,'""')}"`,
      t.technology, `"${(t.mentor||'').replace(/"/g,'""')}"`, t.member_count,
      t.review_points, t.mentor_points, t.stage_points,
      t.attendance_points, t.cert_points, t.ppt_points,
      t.grand_total,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard_${new Date().toISOString().split('T')[0]}.csv`
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
  const technologies = ['all', ...Array.from(new Set((data.teams || []).map(t => t.technology).filter(Boolean))).sort()]

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.lb{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum','ss01','cv11';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.lb-num{font-variant-numeric:tabular-nums;font-feature-settings:'tnum';font-family:'Inter','DM Sans',sans-serif}

.lb-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:12px}
.lb-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff}
.lb-sub{font-size:.75rem;color:rgba(255,255,255,.45);margin-top:4px;font-weight:500}
.lb-actions{display:flex;gap:8px}
.lb-btn{padding:9px 16px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s}
.lb-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
.lb-btn.primary{background:linear-gradient(135deg,#fd1c00,#c41600);border-color:transparent}
.lb-btn.primary:hover{box-shadow:0 0 14px rgba(253,28,0,.3)}

.lb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.lb-kpi{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
.lb-kpi::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,var(--gw,rgba(253,28,0,.05)),transparent 60%);pointer-events:none}
.lb-kpi-l{font-size:.6rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;margin-bottom:8px}
.lb-kpi-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.65rem;font-weight:700;line-height:1;letter-spacing:-0.02em;position:relative}
.lb-kpi-sub{font-size:.62rem;color:rgba(255,255,255,.4);margin-top:5px;font-weight:500}

.lb-rules{margin-bottom:16px;border-radius:13px;background:linear-gradient(135deg,rgba(238,167,39,.04),rgba(253,28,0,.02));border:1px solid rgba(238,167,39,.18)}
.lb-rules-hdr{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none}
.lb-rules-hdr:hover{background:rgba(255,255,255,.02)}
.lb-rules-title{font-size:.88rem;font-weight:700;color:#EEA727;display:flex;align-items:center;gap:8px;letter-spacing:-0.01em}
.lb-rules-title::before{content:'⚖';font-size:1rem}
.lb-rules-meta{font-size:.7rem;color:rgba(255,255,255,.5);font-weight:500;margin-left:6px}
.lb-rules-chev{color:rgba(255,255,255,.45);font-size:.75rem;transition:transform .2s}
.lb-rules-chev.on{transform:rotate(180deg)}
.lb-rules-body{padding:0 18px 18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:11px}
.lb-rule{padding:13px 14px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.lb-rule-top{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;gap:8px}
.lb-rule-lab{font-size:.82rem;font-weight:700;color:#fff;letter-spacing:-0.01em}
.lb-rule-max{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:700;color:#EEA727;background:rgba(238,167,39,.1);padding:3px 10px;border-radius:6px;border:1px solid rgba(238,167,39,.22);letter-spacing:-0.01em}
.lb-rule-form{font-size:.68rem;font-family:'JetBrains Mono','Courier New',monospace;color:rgba(255,255,255,.6);background:rgba(0,0,0,.28);padding:6px 9px;border-radius:5px;margin-bottom:7px;letter-spacing:0}
.lb-rule-ex{font-size:.7rem;color:rgba(255,255,255,.55);line-height:1.55;font-weight:400}

.lb-controls{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.lb-search{flex:1;min-width:200px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:500;outline:none}
.lb-search:focus{border-color:rgba(253,28,0,.3);background:rgba(255,255,255,.06)}
.lb-search::placeholder{color:rgba(255,255,255,.3);font-weight:400}
.lb-sel{padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:500;outline:none;cursor:pointer;min-width:160px}
.lb-count{font-size:.7rem;color:rgba(255,255,255,.35);margin-left:auto;font-weight:500}

.lb-tbl-wrap{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:auto;-webkit-overflow-scrolling:touch}
.lb-tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:1150px}
.lb-tbl thead{position:sticky;top:0;background:rgba(12,8,20,.97);backdrop-filter:blur(10px);z-index:2}
.lb-tbl th{padding:12px 11px;text-align:left;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;cursor:pointer;user-select:none;font-family:'Inter',sans-serif}
.lb-tbl th:hover{color:#fff;background:rgba(255,255,255,.025)}
.lb-tbl th.num{text-align:right;padding-right:14px}
.lb-tbl th.center{text-align:center}
.lb-tbl th .sort-ind{margin-left:4px;font-size:.6rem;color:rgba(253,28,0,.8)}

.lb-tbl td{padding:11px;font-size:.74rem;color:rgba(255,255,255,.88);border-bottom:1px solid rgba(255,255,255,.04);white-space:nowrap;font-family:'Inter',sans-serif;font-weight:500}
.lb-tbl td.num{text-align:right;font-variant-numeric:tabular-nums;font-feature-settings:'tnum';font-weight:600;padding-right:14px}
.lb-tbl td.center{text-align:center}
.lb-tbl tr:hover td{background:rgba(255,255,255,.025)}
.lb-tbl tr.top1 td{background:linear-gradient(90deg,rgba(245,158,11,.08),transparent)}
.lb-tbl tr.top2 td{background:linear-gradient(90deg,rgba(148,163,184,.06),transparent)}
.lb-tbl tr.top3 td{background:linear-gradient(90deg,rgba(198,138,91,.06),transparent)}

.lb-rank{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'tnum';font-size:.95rem;font-weight:700;text-align:center;width:52px;letter-spacing:-0.02em}
.lb-rank.gold{color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,.35)}
.lb-rank.silver{color:#cbd5e1}
.lb-rank.bronze{color:#c68a5b}

.lb-team-cell{color:#fd1c00;font-weight:700;font-size:.8rem;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.lb-proj-cell{color:rgba(255,255,255,.88);font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.005em}
.lb-tech-pill{padding:3px 9px;border-radius:5px;font-size:.56rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;font-family:'Inter',sans-serif;display:inline-block}
.lb-mentor{color:rgba(255,255,255,.48);font-size:.68rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}

.lb-pt{display:inline-block;padding:3px 10px;border-radius:6px;font-size:.72rem;font-weight:700;min-width:46px;text-align:center;font-variant-numeric:tabular-nums;font-feature-settings:'tnum';letter-spacing:-0.01em}
.lb-pt.zero{background:rgba(255,255,255,.03);color:rgba(255,255,255,.28)}
.lb-pt.full{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
.lb-pt.high{background:rgba(74,222,128,.08);color:#86efac;border:1px solid rgba(74,222,128,.18)}
.lb-pt.med{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.2)}
.lb-pt.low{background:rgba(253,28,0,.08);color:#ff6b5e;border:1px solid rgba(253,28,0,.2)}

.lb-grand{text-align:right;padding-right:14px;white-space:nowrap}
.lb-grand-num{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-feature-settings:'tnum';font-size:0.95rem;font-weight:800;color:#fd1c00;letter-spacing:-0.02em;display:inline-block}
.lb-out{color:rgba(255,255,255,.35);font-weight:500;font-size:.66rem;margin-left:4px;display:inline-block}

.lb-empty{padding:40px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem;font-weight:500}

@media(max-width:768px){
  .lb-rules-body{grid-template-columns:1fr}
  .lb-kpis{grid-template-columns:repeat(2,1fr)}
  .lb-title{font-size:1.15rem}
  .lb-kpi-v{font-size:1.4rem}
}
      `}</style>

      <div className="lb">

      {/* HEADER */}
      <div className="lb-hdr">
        <div>
          <div className="lb-title">Leaderboard</div>
          <div className="lb-sub">{summary.total_teams || 0} teams · ranked by total points · max 100</div>
        </div>
        <div className="lb-actions">
          <button className="lb-btn" onClick={fetchLeaderboard}>↻ Refresh</button>
          <button className="lb-btn primary" onClick={exportCSV}>↓ Export CSV</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="lb-kpis">
        <div className="lb-kpi" style={{'--gw':'rgba(253,28,0,.08)'}}>
          <div className="lb-kpi-l">Total Teams</div>
          <div className="lb-kpi-v" style={{color:'#fd1c00'}}>{summary.total_teams || 0}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(238,167,39,.08)'}}>
          <div className="lb-kpi-l">Avg Score</div>
          <div className="lb-kpi-v" style={{color:'#EEA727'}}>{summary.avg_total || 0}<span style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',marginLeft:5,fontWeight:500}}>/ 100</span></div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(74,222,128,.08)'}}>
          <div className="lb-kpi-l">With PPT</div>
          <div className="lb-kpi-v" style={{color:'#4ade80'}}>{summary.teams_with_ppt || 0}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(167,139,250,.08)'}}>
          <div className="lb-kpi-l">With Reviews</div>
          <div className="lb-kpi-v" style={{color:'#a78bfa'}}>{summary.teams_with_review || 0}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(96,165,250,.08)'}}>
          <div className="lb-kpi-l">Mentor Evaluated</div>
          <div className="lb-kpi-v" style={{color:'#60a5fa'}}>{summary.teams_with_mentor_eval || 0}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(34,211,238,.08)'}}>
          <div className="lb-kpi-l">With Certificates</div>
          <div className="lb-kpi-v" style={{color:'#22d3ee'}}>{summary.teams_with_certs || 0}</div>
        </div>
      </div>

      {/* RULES */}
      <div className="lb-rules">
        <div className="lb-rules-hdr" onClick={() => setShowRules(s => !s)}>
          <div className="lb-rules-title">
            Scoring Rules
            <span className="lb-rules-meta">{rules.length} criteria · 100 max</span>
          </div>
          <div className={`lb-rules-chev ${showRules ? 'on' : ''}`}>▼</div>
        </div>
        {showRules && (
          <div className="lb-rules-body">
            {rules.map(r => (
              <div key={r.id} className="lb-rule">
                <div className="lb-rule-top">
                  <div className="lb-rule-lab">{r.label}</div>
                  <div className="lb-rule-max">{r.max} pts · {r.weight}</div>
                </div>
                <div className="lb-rule-form">{r.formula}</div>
                <div className="lb-rule-ex">{r.explainer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="lb-controls">
        <input className="lb-search" placeholder="Search team, project, mentor…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="lb-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
        <div className="lb-count">{filteredTeams.length} teams</div>
      </div>

      {/* TABLE */}
      {filteredTeams.length === 0 ? (
        <div className="lb-empty">No teams match your filters</div>
      ) : (
        <div className="lb-tbl-wrap">
          <table className="lb-tbl">
            <thead>
              <tr>
                <SortableTh field="rank" label="Rank" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="center"/>
                <SortableTh field="team_number" label="Team" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
                <th>Project</th>
                <SortableTh field="technology" label="Tech" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
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
                  <td className={`lb-rank ${t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : t.rank === 3 ? 'bronze' : ''}`}>#{t.rank}</td>
                  <td className="lb-team-cell">{t.team_number}</td>
                  <td className="lb-proj-cell" title={t.project_title}>{t.project_title}</td>
                  <td>
                    <span className="lb-tech-pill" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>
                      {t.technology}
                    </span>
                  </td>
                  <td className="lb-mentor" title={t.mentor}>{t.mentor}</td>
                  <td className="num"><PtCell value={t.review_points} max={60}/></td>
                  <td className="num"><PtCell value={t.mentor_points} max={20}/></td>
                  <td className="num"><PtCell value={t.stage_points} max={8}/></td>
                  <td className="num"><PtCell value={t.attendance_points} max={6}/></td>
                  <td className="num"><PtCell value={t.cert_points} max={4}/></td>
                  <td className="num"><PtCell value={t.ppt_points} max={2}/></td>
                  <td className="lb-grand"><span className="lb-grand-num">{t.grand_total ?? 0}</span><span className="lb-out">/100</span></td>
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
  if (value == null || value === 0) return <span className="lb-pt zero">0</span>
  const pct = max > 0 ? (value / max) : 0
  const cls = pct >= 0.99 ? 'full' : pct >= 0.7 ? 'high' : pct >= 0.4 ? 'med' : 'low'
  return <span className={`lb-pt ${cls}`}>{value}</span>
}