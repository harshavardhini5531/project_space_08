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
  const [showRules, setShowRules] = useState(false)

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

  // ── Build tech list with team counts ──
  const techStats = useMemo(() => {
    if (!data?.teams) return []
    const counts = {}
    for (const t of data.teams) {
      if (!t.technology) continue
      counts[t.technology] = (counts[t.technology] || 0) + 1
    }
    return Object.entries(counts)
      .map(([tech, count]) => ({ tech, count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  // ── Filter teams by selected tech + search, then re-rank within tech ──
  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let arr = data.teams
    if (techFilter !== 'all') arr = arr.filter(t => t.technology === techFilter)
    // Re-rank within the filtered tech (so rank #1 means top in that tech)
    if (techFilter !== 'all') {
      const sortedByTotal = [...arr].sort((a, b) => (b.grand_total ?? 0) - (a.grand_total ?? 0))
      const techRankMap = new Map()
      sortedByTotal.forEach((t, i) => techRankMap.set(t.team_number, i + 1))
      arr = arr.map(t => ({ ...t, tech_rank: techRankMap.get(t.team_number) }))
    }
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
    const rankField = techFilter !== 'all' ? 'tech_rank' : 'rank'
    const sortField = sortBy === 'rank' ? rankField : sortBy
    sorted.sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      if (typeof av === 'string') return dir * av.localeCompare(bv)
      return dir * (av - bv)
    })
    return sorted
  }, [data, search, techFilter, sortBy, sortDir])

  function handleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir(field === 'rank' || field === 'team_number' || field === 'technology' ? 'asc' : 'desc') }
  }

  function exportCSV() {
    if (!filteredTeams.length) return
    const rankCol = techFilter !== 'all' ? 'tech_rank' : 'rank'
    const techName = techFilter !== 'all' ? `_${techFilter.replace(/\s+/g,'_')}` : ''
    const headers = ['Rank','Team','Project','Technology','Mentor','Members',
      'Review/60','Mentor/20','Stages/8','Att/6','Certs/4','PPT/2','Total/100']
    const rows = filteredTeams.map(t => [
      t[rankCol] ?? t.rank, t.team_number, `"${(t.project_title||'').replace(/"/g,'""')}"`,
      t.technology, `"${(t.mentor||'').replace(/"/g,'""')}"`, t.member_count,
      t.review_points, t.mentor_points, t.stage_points,
      t.attendance_points, t.cert_points, t.ppt_points, t.grand_total,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaderboard${techName}_${new Date().toISOString().split('T')[0]}.csv`
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
  const activeTechColor = techFilter !== 'all' ? (TC[techFilter] || '#fd1c00') : '#fd1c00'
  const rankColumnField = techFilter !== 'all' ? 'tech_rank' : 'rank'

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.lb{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum','ss01','cv11';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.lb-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:12px}
.lb-title-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.lb-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff}
.lb-active-tech{padding:5px 12px;border-radius:8px;font-size:.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;display:inline-block}
.lb-sub{font-size:.75rem;color:rgba(255,255,255,.45);margin-top:4px;font-weight:500}
.lb-actions{display:flex;gap:8px}
.lb-btn{padding:9px 16px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s}
.lb-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
.lb-btn.primary{background:linear-gradient(135deg,#fd1c00,#c41600);border-color:transparent}
.lb-btn.primary:hover{box-shadow:0 0 14px rgba(253,28,0,.3)}

.lb-tech-bar{display:flex;gap:6px;padding:7px;border-radius:14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);margin-bottom:18px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.lb-tech-bar::-webkit-scrollbar{display:none}
.lb-tech-pill{padding:9px 16px;border-radius:9px;background:transparent;border:1px solid transparent;color:rgba(255,255,255,.55);font-family:'Inter',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .18s;display:flex;align-items:center;gap:8px;letter-spacing:-0.01em}
.lb-tech-pill:hover{color:rgba(255,255,255,.9);background:rgba(255,255,255,.03)}
.lb-tech-pill.on{color:#fff;font-weight:700;box-shadow:inset 0 0 0 1px var(--c, rgba(253,28,0,.4)), 0 0 12px var(--cg, rgba(253,28,0,.18))}
.lb-tech-pill-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--c, #fd1c00)}
.lb-tech-pill-count{font-size:.6rem;padding:2px 7px;border-radius:5px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);font-weight:700;font-variant-numeric:tabular-nums}
.lb-tech-pill.on .lb-tech-pill-count{background:rgba(255,255,255,.12);color:#fff}

.lb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.lb-kpi{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
.lb-kpi::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,var(--gw,rgba(253,28,0,.05)),transparent 60%);pointer-events:none}
.lb-kpi-l{font-size:.6rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;margin-bottom:8px}
.lb-kpi-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.65rem;font-weight:700;line-height:1;letter-spacing:-0.02em;position:relative}

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
.lb-rule-max{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:700;color:#EEA727;background:rgba(238,167,39,.1);padding:3px 10px;border-radius:6px;border:1px solid rgba(238,167,39,.22)}
.lb-rule-form{font-size:.68rem;font-family:'Courier New',monospace;color:rgba(255,255,255,.6);background:rgba(0,0,0,.28);padding:6px 9px;border-radius:5px;margin-bottom:7px}
.lb-rule-ex{font-size:.7rem;color:rgba(255,255,255,.55);line-height:1.55;font-weight:400}

.lb-controls{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.lb-search{flex:1;min-width:200px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:500;outline:none}
.lb-search:focus{border-color:rgba(253,28,0,.3);background:rgba(255,255,255,.06)}
.lb-search::placeholder{color:rgba(255,255,255,.3);font-weight:400}
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
.lb-tbl td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;padding-right:14px}
.lb-tbl td.center{text-align:center}
.lb-tbl tr:hover td{background:rgba(255,255,255,.025)}
.lb-tbl tr.top1 td{background:linear-gradient(90deg,rgba(245,158,11,.08),transparent)}
.lb-tbl tr.top2 td{background:linear-gradient(90deg,rgba(148,163,184,.06),transparent)}
.lb-tbl tr.top3 td{background:linear-gradient(90deg,rgba(198,138,91,.06),transparent)}

.lb-rank{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.95rem;font-weight:700;text-align:center;width:52px;letter-spacing:-0.02em}
.lb-rank.gold{color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,.35)}
.lb-rank.silver{color:#cbd5e1}
.lb-rank.bronze{color:#c68a5b}

.lb-team-cell{color:#fd1c00;font-weight:700;font-size:.8rem;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
.lb-proj-cell{color:rgba(255,255,255,.88);font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.005em}
.lb-tech-pill-cell{padding:3px 9px;border-radius:5px;font-size:.56rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;display:inline-block}
.lb-mentor{color:rgba(255,255,255,.48);font-size:.68rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}

.lb-pt{display:inline-block;padding:3px 10px;border-radius:6px;font-size:.72rem;font-weight:700;min-width:46px;text-align:center;font-variant-numeric:tabular-nums}
.lb-pt.zero{background:rgba(255,255,255,.03);color:rgba(255,255,255,.28)}
.lb-pt.full{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
.lb-pt.high{background:rgba(74,222,128,.08);color:#86efac;border:1px solid rgba(74,222,128,.18)}
.lb-pt.med{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.2)}
.lb-pt.low{background:rgba(253,28,0,.08);color:#ff6b5e;border:1px solid rgba(253,28,0,.2)}

.lb-grand{text-align:right;padding-right:14px;white-space:nowrap}
.lb-grand-num{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:0.95rem;font-weight:800;color:#fd1c00;letter-spacing:-0.02em;display:inline-block}
.lb-out{color:rgba(255,255,255,.35);font-weight:500;font-size:.66rem;margin-left:4px;display:inline-block}

.lb-empty{padding:40px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem;font-weight:500}

@media(max-width:768px){
  .lb-rules-body{grid-template-columns:1fr}
  .lb-kpis{grid-template-columns:repeat(2,1fr)}
  .lb-title{font-size:1.15rem}
  .lb-tech-pill{padding:8px 12px;font-size:.7rem}
}
      `}</style>

      <div className="lb">

      {/* HEADER */}
      <div className="lb-hdr">
        <div>
          <div className="lb-title-row">
            <div className="lb-title">Leaderboard</div>
            {techFilter !== 'all' && (
              <span className="lb-active-tech" style={{background:`${activeTechColor}18`,color:activeTechColor,border:`1px solid ${activeTechColor}40`}}>
                {techFilter}
              </span>
            )}
          </div>
          <div className="lb-sub">
            {techFilter === 'all'
              ? `${summary.total_teams || 0} teams · ranked by total points · max 100`
              : `${filteredTeams.length} ${techFilter} teams · ranked within technology · max 100`}
          </div>
        </div>
        <div className="lb-actions">
          <button className="lb-btn" onClick={fetchLeaderboard}>↻ Refresh</button>
          <button className="lb-btn primary" onClick={exportCSV}>↓ Export CSV</button>
        </div>
      </div>

      {/* TECH PILL BAR */}
      <div className="lb-tech-bar">
        <button
          className={`lb-tech-pill ${techFilter === 'all' ? 'on' : ''}`}
          style={techFilter === 'all' ? {'--c':'rgba(253,28,0,.5)', '--cg':'rgba(253,28,0,.18)'} : {}}
          onClick={() => setTechFilter('all')}
        >
          <span className="lb-tech-pill-dot" style={{'--c':'#fd1c00'}}></span>
          All Teams
          <span className="lb-tech-pill-count">{data.teams.length}</span>
        </button>
        {techStats.map(({tech, count}) => {
          const c = TC[tech] || '#888'
          const isOn = techFilter === tech
          return (
            <button
              key={tech}
              className={`lb-tech-pill ${isOn ? 'on' : ''}`}
              style={isOn ? {'--c':`${c}80`, '--cg':`${c}22`} : {}}
              onClick={() => setTechFilter(tech)}
            >
              <span className="lb-tech-pill-dot" style={{'--c':c}}></span>
              {tech}
              <span className="lb-tech-pill-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* KPI CARDS */}
      <div className="lb-kpis">
        <div className="lb-kpi" style={{'--gw':'rgba(253,28,0,.08)'}}>
          <div className="lb-kpi-l">{techFilter === 'all' ? 'Total Teams' : 'Teams in Tech'}</div>
          <div className="lb-kpi-v" style={{color:'#fd1c00'}}>{filteredTeams.length}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(238,167,39,.08)'}}>
          <div className="lb-kpi-l">Avg Score</div>
          <div className="lb-kpi-v" style={{color:'#EEA727'}}>
            {filteredTeams.length > 0 ? (Math.round((filteredTeams.reduce((s,t) => s + (t.grand_total || 0), 0) / filteredTeams.length) * 10) / 10) : 0}
            <span style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',marginLeft:5,fontWeight:500}}>/ 100</span>
          </div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(74,222,128,.08)'}}>
          <div className="lb-kpi-l">With PPT</div>
          <div className="lb-kpi-v" style={{color:'#4ade80'}}>{filteredTeams.filter(t => t.has_ppt).length}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(167,139,250,.08)'}}>
          <div className="lb-kpi-l">With Reviews</div>
          <div className="lb-kpi-v" style={{color:'#a78bfa'}}>{filteredTeams.filter(t => t.review_score_raw != null).length}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(96,165,250,.08)'}}>
          <div className="lb-kpi-l">Mentor Evaluated</div>
          <div className="lb-kpi-v" style={{color:'#60a5fa'}}>{filteredTeams.filter(t => t.mentor_score_raw != null).length}</div>
        </div>
        <div className="lb-kpi" style={{'--gw':'rgba(34,211,238,.08)'}}>
          <div className="lb-kpi-l">With Certificates</div>
          <div className="lb-kpi-v" style={{color:'#22d3ee'}}>{filteredTeams.filter(t => t.certs_uploaded > 0).length}</div>
        </div>
      </div>

      {/* RULES (collapsed by default) */}
      <div className="lb-rules">
        <div className="lb-rules-hdr" onClick={() => setShowRules(s => !s)}>
          <div className="lb-rules-title">
            Scoring Rules
            <span className="lb-rules-meta">{rules.length} criteria · 100 max · click to {showRules ? 'hide' : 'view'}</span>
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

      {/* SEARCH */}
      <div className="lb-controls">
        <input className="lb-search" placeholder="Search team, project, mentor…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="lb-count">{filteredTeams.length} teams</div>
      </div>

      {/* TABLE */}
      {filteredTeams.length === 0 ? (
        <div className="lb-empty">No teams match your search</div>
      ) : (
        <div className="lb-tbl-wrap">
          <table className="lb-tbl">
            <thead>
              <tr>
                <SortableTh field="rank" label="Rank" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="center"/>
                <SortableTh field="team_number" label="Team" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
                <th>Project</th>
                {techFilter === 'all' && <SortableTh field="technology" label="Tech" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>}
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
              {filteredTeams.map(t => {
                const rank = t[rankColumnField] ?? t.rank
                return (
                  <tr key={t.team_number} className={rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : ''}>
                    <td className={`lb-rank ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : ''}`}>#{rank}</td>
                    <td className="lb-team-cell">{t.team_number}</td>
                    <td className="lb-proj-cell" title={t.project_title}>{t.project_title}</td>
                    {techFilter === 'all' && (
                      <td>
                        <span className="lb-tech-pill-cell" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>
                          {t.technology}
                        </span>
                      </td>
                    )}
                    <td className="lb-mentor" title={t.mentor}>{t.mentor}</td>
                    <td className="num"><PtCell value={t.review_points} max={60}/></td>
                    <td className="num"><PtCell value={t.mentor_points} max={20}/></td>
                    <td className="num"><PtCell value={t.stage_points} max={8}/></td>
                    <td className="num"><PtCell value={t.attendance_points} max={6}/></td>
                    <td className="num"><PtCell value={t.cert_points} max={4}/></td>
                    <td className="num"><PtCell value={t.ppt_points} max={2}/></td>
                    <td className="lb-grand"><span className="lb-grand-num">{t.grand_total ?? 0}</span><span className="lb-out">/100</span></td>
                  </tr>
                )
              })}
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