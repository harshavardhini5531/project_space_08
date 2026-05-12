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

export default function AdminProjectLeaders({ adminEmail }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Assignments management
  const [assignData, setAssignData] = useState(null)
  const [showAssignPanel, setShowAssignPanel] = useState(false)
  const [newPanelName, setNewPanelName] = useState('')
  const [pickingMentor, setPickingMentor] = useState('')

  // Table state
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [expandedTeam, setExpandedTeam] = useState(null)

  async function fetchData() {
    if (!adminEmail) return
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/project-leaders', {
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

  async function fetchAssignments() {
    if (!adminEmail) return
    try {
      const r = await fetch(`/api/admin/panel-assignments?adminEmail=${encodeURIComponent(adminEmail)}`)
      const d = await r.json()
      if (r.ok && d.ok) setAssignData(d)
    } catch (e) {}
  }

  useEffect(() => { fetchData(); fetchAssignments() }, [adminEmail])

  async function assignMentor(mentorEmail, panelName) {
    if (!mentorEmail || !panelName) return
    try {
      const r = await fetch('/api/admin/panel-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, action: 'assign', mentorEmail, panelName }),
      })
      const d = await r.json()
      if (r.ok && d.ok) {
        await fetchAssignments()
        setPickingMentor('')
      } else {
        alert(d.error || 'Could not assign')
      }
    } catch (e) { alert('Network error: ' + e.message) }
  }

  async function removeMentor(mentorEmail) {
    if (!mentorEmail) return
    if (!confirm(`Remove ${mentorEmail} from their panel?`)) return
    try {
      const r = await fetch('/api/admin/panel-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail, action: 'remove', mentorEmail }),
      })
      const d = await r.json()
      if (r.ok && d.ok) await fetchAssignments()
      else alert(d.error || 'Could not remove')
    } catch (e) { alert('Network error: ' + e.message) }
  }

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
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir(field === 'rank' || field === 'team_number' ? 'asc' : 'desc') }
  }

  function exportCSV() {
    if (!filteredTeams.length) return
    const headers = ['Rank','Team','Project','Tech','Mentor','AutoScore/100','PanelAvg/50','Panels','Total/150']
    const rows = filteredTeams.map(t => [
      t.rank, t.team_number, `"${(t.project_title||'').replace(/"/g,'""')}"`,
      t.technology, `"${(t.mentor||'').replace(/"/g,'""')}"`,
      t.auto_score, t.panel_avg, t.panel_count, t.grand_total,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project_leaders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'Inter,DM Sans,sans-serif',fontSize:'.85rem'}}>Loading Project Leaders…</div>

  if (error) return (
    <div style={{padding:24,borderRadius:14,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.25)',fontFamily:'Inter,DM Sans,sans-serif'}}>
      <div style={{fontWeight:700,fontSize:'.95rem',color:'#fd1c00',marginBottom:6}}>Could not load</div>
      <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.7)',marginBottom:10}}>{error}</div>
      <button onClick={fetchData} style={{padding:'6px 14px',borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.72rem',fontWeight:600,cursor:'pointer'}}>Retry</button>
    </div>
  )

  if (!data) return null

  const summary = data.summary || {}
  const technologies = ['all', ...Array.from(new Set((data.teams || []).map(t => t.technology).filter(Boolean))).sort()]

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.pl{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.pl-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:12px}
.pl-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff}
.pl-sub{font-size:.75rem;color:rgba(255,255,255,.45);margin-top:4px;font-weight:500}
.pl-actions{display:flex;gap:8px;flex-wrap:wrap}
.pl-btn{padding:9px 16px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .15s}
.pl-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
.pl-btn.primary{background:linear-gradient(135deg,#fd1c00,#c41600);border-color:transparent}
.pl-btn.primary:hover{box-shadow:0 0 14px rgba(253,28,0,.3)}
.pl-btn.purple{background:linear-gradient(135deg,#a78bfa,#7c3aed);border-color:transparent}
.pl-btn.purple:hover{box-shadow:0 0 14px rgba(167,139,250,.35)}

.pl-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.pl-kpi{padding:14px 16px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
.pl-kpi::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top,var(--gw,rgba(253,28,0,.05)),transparent 60%);pointer-events:none}
.pl-kpi-l{font-size:.6rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;margin-bottom:8px}
.pl-kpi-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.6rem;font-weight:700;line-height:1;letter-spacing:-0.02em;position:relative}

.pl-panels-box{margin-bottom:16px;border-radius:13px;background:linear-gradient(135deg,rgba(167,139,250,.05),rgba(124,58,237,.02));border:1px solid rgba(167,139,250,.22)}
.pl-panels-hdr{padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none}
.pl-panels-title{font-size:.88rem;font-weight:700;color:#a78bfa;display:flex;align-items:center;gap:8px;letter-spacing:-0.01em}
.pl-panels-title::before{content:'⚖';font-size:1rem}
.pl-panels-meta{font-size:.7rem;color:rgba(255,255,255,.5);font-weight:500;margin-left:6px}
.pl-panels-chev{color:rgba(255,255,255,.45);font-size:.75rem;transition:transform .2s}
.pl-panels-chev.on{transform:rotate(180deg)}
.pl-panels-body{padding:0 18px 18px}
.pl-panels-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:11px;margin-bottom:14px}
.pl-panel-card{padding:13px 14px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.pl-panel-card-name{font-size:.78rem;font-weight:700;color:#a78bfa;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.pl-panel-card-count{font-size:.62rem;color:rgba(255,255,255,.45);font-weight:600;background:rgba(255,255,255,.04);padding:2px 7px;border-radius:5px}
.pl-panel-mentor{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:6px;background:rgba(255,255,255,.02);margin-bottom:4px;font-size:.7rem}
.pl-panel-mentor-name{color:rgba(255,255,255,.85);font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-panel-mentor-email{color:rgba(255,255,255,.4);font-size:.6rem;font-weight:500}
.pl-panel-rm{padding:2px 7px;border-radius:5px;background:rgba(253,28,0,.1);border:none;color:#fd1c00;font-size:.6rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.pl-panel-rm:hover{background:rgba(253,28,0,.2)}

.pl-assign-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)}
.pl-assign-form input,.pl-assign-form select{padding:9px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:500;outline:none;min-width:160px}
.pl-assign-form input:focus,.pl-assign-form select:focus{border-color:rgba(167,139,250,.4)}

.pl-controls{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.pl-search{flex:1;min-width:200px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:500;outline:none}
.pl-search:focus{border-color:rgba(253,28,0,.3)}
.pl-search::placeholder{color:rgba(255,255,255,.3)}
.pl-sel{padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:500;outline:none;cursor:pointer;min-width:160px}

.pl-tbl-wrap{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:auto}
.pl-tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:900px}
.pl-tbl thead{position:sticky;top:0;background:rgba(12,8,20,.97);backdrop-filter:blur(10px);z-index:2}
.pl-tbl th{padding:12px 11px;text-align:left;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;cursor:pointer;user-select:none;font-family:'Inter',sans-serif}
.pl-tbl th:hover{color:#fff;background:rgba(255,255,255,.025)}
.pl-tbl th.num{text-align:right;padding-right:14px}
.pl-tbl th.center{text-align:center}
.pl-tbl th .sort-ind{margin-left:4px;font-size:.6rem;color:rgba(253,28,0,.8)}
.pl-tbl td{padding:11px;font-size:.74rem;color:rgba(255,255,255,.88);border-bottom:1px solid rgba(255,255,255,.04);white-space:nowrap;font-family:'Inter',sans-serif;font-weight:500;cursor:pointer}
.pl-tbl td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;padding-right:14px}
.pl-tbl td.center{text-align:center}
.pl-tbl tr:hover td{background:rgba(255,255,255,.025)}
.pl-tbl tr.top1 td{background:linear-gradient(90deg,rgba(245,158,11,.08),transparent)}
.pl-tbl tr.top2 td{background:linear-gradient(90deg,rgba(148,163,184,.06),transparent)}
.pl-tbl tr.top3 td{background:linear-gradient(90deg,rgba(198,138,91,.06),transparent)}
.pl-tbl tr.exp td{background:rgba(167,139,250,.04)}

.pl-rank{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.95rem;font-weight:700;text-align:center;width:52px;letter-spacing:-0.02em}
.pl-rank.gold{color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,.35)}
.pl-rank.silver{color:#cbd5e1}
.pl-rank.bronze{color:#c68a5b}

.pl-team-cell{color:#fd1c00;font-weight:700;font-size:.8rem;font-variant-numeric:tabular-nums}
.pl-proj-cell{color:rgba(255,255,255,.88);font-weight:600;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-tech-pill{padding:3px 9px;border-radius:5px;font-size:.56rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;display:inline-block}

.pl-pt{display:inline-block;padding:3px 10px;border-radius:6px;font-size:.72rem;font-weight:700;min-width:48px;text-align:center;font-variant-numeric:tabular-nums}
.pl-pt.zero{background:rgba(255,255,255,.03);color:rgba(255,255,255,.28)}
.pl-pt.auto{background:rgba(96,165,250,.08);color:#60a5fa;border:1px solid rgba(96,165,250,.2)}
.pl-pt.panel{background:rgba(167,139,250,.1);color:#a78bfa;border:1px solid rgba(167,139,250,.25)}
.pl-grand{text-align:right;padding-right:14px;white-space:nowrap}
.pl-grand-num{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1rem;font-weight:800;color:#fd1c00;letter-spacing:-0.02em;display:inline-block}
.pl-grand-out{color:rgba(255,255,255,.35);font-weight:500;font-size:.66rem;margin-left:4px}
.pl-panel-count{display:inline-block;padding:2px 8px;border-radius:5px;background:rgba(167,139,250,.08);color:#a78bfa;font-size:.66rem;font-weight:700;border:1px solid rgba(167,139,250,.2)}

.pl-detail-row td{padding:0!important;background:rgba(167,139,250,.03)!important;border-bottom:1px solid rgba(167,139,250,.15)!important}
.pl-detail{padding:16px 22px}
.pl-detail-title{font-size:.74rem;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px}
.pl-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}
.pl-detail-card{padding:12px 14px;border-radius:9px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.06)}
.pl-detail-card-hdr{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;flex-wrap:wrap;gap:4px}
.pl-detail-mentor{font-size:.75rem;font-weight:700;color:#fff}
.pl-detail-panel-tag{font-size:.55rem;padding:2px 7px;border-radius:5px;background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.25);font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.pl-detail-scores{display:flex;justify-content:space-between;font-size:.66rem;color:rgba(255,255,255,.6);font-weight:500;line-height:1.7}
.pl-detail-total{margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center}
.pl-detail-total-l{font-size:.66rem;color:rgba(255,255,255,.5);font-weight:600;text-transform:uppercase;letter-spacing:.06em}
.pl-detail-total-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.95rem;font-weight:800;color:#a78bfa}
.pl-detail-empty{padding:14px;color:rgba(255,255,255,.4);font-size:.74rem;font-style:italic}

.pl-empty{padding:40px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem}
      `}</style>

      <div className="pl">

      {/* HEADER */}
      <div className="pl-hdr">
        <div>
          <div className="pl-title">Project Leaders</div>
          <div className="pl-sub">Final ranking · Auto-score /100 + Panel score /50 = <strong style={{color:'#fd1c00'}}>/150</strong></div>
        </div>
        <div className="pl-actions">
          <button className="pl-btn" onClick={fetchData}>↻ Refresh</button>
          <button className="pl-btn purple" onClick={() => setShowAssignPanel(p => !p)}>{showAssignPanel ? 'Hide' : 'Manage'} Panels</button>
          <button className="pl-btn primary" onClick={exportCSV}>↓ Export CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="pl-kpis">
        <div className="pl-kpi" style={{'--gw':'rgba(253,28,0,.08)'}}>
          <div className="pl-kpi-l">Total Teams</div>
          <div className="pl-kpi-v" style={{color:'#fd1c00'}}>{summary.total_teams || 0}</div>
        </div>
        <div className="pl-kpi" style={{'--gw':'rgba(167,139,250,.08)'}}>
          <div className="pl-kpi-l">Active Panels</div>
          <div className="pl-kpi-v" style={{color:'#a78bfa'}}>{summary.total_panels || 0}</div>
        </div>
        <div className="pl-kpi" style={{'--gw':'rgba(74,222,128,.08)'}}>
          <div className="pl-kpi-l">Panel Scored</div>
          <div className="pl-kpi-v" style={{color:'#4ade80'}}>{summary.teams_with_panel_scores || 0}</div>
        </div>
        <div className="pl-kpi" style={{'--gw':'rgba(96,165,250,.08)'}}>
          <div className="pl-kpi-l">Avg Panel</div>
          <div className="pl-kpi-v" style={{color:'#60a5fa'}}>{summary.avg_panel || 0}<span style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',marginLeft:4,fontWeight:500}}>/50</span></div>
        </div>
        <div className="pl-kpi" style={{'--gw':'rgba(238,167,39,.08)'}}>
          <div className="pl-kpi-l">Avg Grand</div>
          <div className="pl-kpi-v" style={{color:'#EEA727'}}>{summary.avg_grand || 0}<span style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',marginLeft:4,fontWeight:500}}>/150</span></div>
        </div>
      </div>

      {/* PANEL MANAGEMENT */}
      {showAssignPanel && (
        <div className="pl-panels-box">
          <div className="pl-panels-hdr">
            <div className="pl-panels-title">
              Panel Assignments
              <span className="pl-panels-meta">{assignData?.assignments?.length || 0} mentors assigned across {assignData?.allPanels?.length || 0} panel(s)</span>
            </div>
          </div>
          <div className="pl-panels-body">
            <div className="pl-panels-grid">
              {assignData && Object.entries(assignData.byPanel || {}).map(([panel, mentors]) => (
                <div key={panel} className="pl-panel-card">
                  <div className="pl-panel-card-name">
                    {panel}
                    <span className="pl-panel-card-count">{mentors.length} mentor{mentors.length === 1 ? '' : 's'}</span>
                  </div>
                  {mentors.map(m => (
                    <div key={m.id} className="pl-panel-mentor">
                      <div>
                        <div className="pl-panel-mentor-name">{m.mentor_name}</div>
                        <div className="pl-panel-mentor-email">{m.mentor_email}</div>
                      </div>
                      <button className="pl-panel-rm" onClick={() => removeMentor(m.mentor_email)}>Remove</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="pl-assign-form">
              <select value={pickingMentor} onChange={e => setPickingMentor(e.target.value)} style={{flex:1,minWidth:240}}>
                <option value="">— Pick a mentor —</option>
                {(assignData?.availableMentors || []).map(m =>
                  <option key={m.id} value={m.email} style={{background:'#13101a'}}>{m.name} · {m.technology}</option>
                )}
              </select>
              <input
                placeholder="Panel name (e.g. Panel A)"
                value={newPanelName}
                onChange={e => setNewPanelName(e.target.value)}
                list="panel-name-options"
              />
              <datalist id="panel-name-options">
                {(assignData?.allPanels || []).map(p => <option key={p} value={p} />)}
              </datalist>
              <button
                className="pl-btn purple"
                onClick={() => {
                  if (pickingMentor && newPanelName.trim()) assignMentor(pickingMentor, newPanelName.trim())
                  else alert('Pick a mentor AND enter a panel name')
                }}
              >+ Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="pl-controls">
        <input className="pl-search" placeholder="Search team, project, mentor…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="pl-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
        <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.35)',marginLeft:'auto',fontWeight:500}}>{filteredTeams.length} teams</div>
      </div>

      {/* TABLE */}
      {filteredTeams.length === 0 ? (
        <div className="pl-empty">No teams match filters</div>
      ) : (
        <div className="pl-tbl-wrap">
          <table className="pl-tbl">
            <thead>
              <tr>
                <SortableTh field="rank" label="Rank" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="center"/>
                <SortableTh field="team_number" label="Team" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
                <th>Project</th>
                <SortableTh field="technology" label="Tech" sortBy={sortBy} sortDir={sortDir} onClick={handleSort}/>
                <th>Mentor</th>
                <SortableTh field="auto_score" label="Auto/100" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                <SortableTh field="panel_count" label="Panels" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                <SortableTh field="panel_avg" label="Panel/50" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
                <SortableTh field="grand_total" label="Total/150" sortBy={sortBy} sortDir={sortDir} onClick={handleSort} className="num"/>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map(t => {
                const isExp = expandedTeam === t.team_number
                return (
                  <>
                    <tr key={t.team_number} className={`${t.rank === 1 ? 'top1' : t.rank === 2 ? 'top2' : t.rank === 3 ? 'top3' : ''} ${isExp ? 'exp' : ''}`} onClick={() => setExpandedTeam(isExp ? null : t.team_number)}>
                      <td className={`pl-rank ${t.rank === 1 ? 'gold' : t.rank === 2 ? 'silver' : t.rank === 3 ? 'bronze' : ''}`}>#{t.rank}</td>
                      <td className="pl-team-cell">{t.team_number}</td>
                      <td className="pl-proj-cell" title={t.project_title}>{t.project_title}</td>
                      <td>
                        <span className="pl-tech-pill" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>
                          {t.technology}
                        </span>
                      </td>
                      <td style={{color:'rgba(255,255,255,.48)',fontSize:'.7rem',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.mentor}</td>
                      <td className="num"><span className="pl-pt auto">{t.auto_score}</span></td>
                      <td className="num">{t.panel_count > 0 ? <span className="pl-panel-count">{t.panel_count}</span> : <span style={{color:'rgba(255,255,255,.25)',fontSize:'.7rem'}}>0</span>}</td>
                      <td className="num">{t.panel_count > 0 ? <span className="pl-pt panel">{t.panel_avg}</span> : <span className="pl-pt zero">—</span>}</td>
                      <td className="pl-grand"><span className="pl-grand-num">{t.grand_total ?? 0}</span><span className="pl-grand-out">/150</span></td>
                    </tr>
                    {isExp && (
                      <tr className="pl-detail-row">
                        <td colSpan={9}>
                          <div className="pl-detail">
                            <div className="pl-detail-title">Panel scores for {t.team_number} ({t.panel_count} panel{t.panel_count === 1 ? '' : 's'})</div>
                            {t.panel_breakdown.length === 0 ? (
                              <div className="pl-detail-empty">No panel scores submitted yet for this team.</div>
                            ) : (
                              <div className="pl-detail-grid">
                                {t.panel_breakdown.map(p => (
                                  <div key={p.mentor_email + p.panel_name} className="pl-detail-card">
                                    <div className="pl-detail-card-hdr">
                                      <div className="pl-detail-mentor">{p.mentor_name}</div>
                                      <div className="pl-detail-panel-tag">{p.panel_name}</div>
                                    </div>
                                    <div className="pl-detail-scores">
                                      <div>
                                        <div>Idea: <strong style={{color:'rgba(255,255,255,.85)'}}>{p.scores.project_idea}</strong></div>
                                        <div>AI: <strong style={{color:'rgba(255,255,255,.85)'}}>{p.scores.ai_usage}</strong></div>
                                        <div>Pres: <strong style={{color:'rgba(255,255,255,.85)'}}>{p.scores.presentation}</strong></div>
                                      </div>
                                      <div>
                                        <div>Tech: <strong style={{color:'rgba(255,255,255,.85)'}}>{p.scores.technical}</strong></div>
                                        <div>Complexity: <strong style={{color:'rgba(255,255,255,.85)'}}>{p.scores.qa_defense}</strong></div>
                                      </div>
                                    </div>
                                    <div className="pl-detail-total">
                                      <div className="pl-detail-total-l">Subtotal</div>
                                      <div className="pl-detail-total-v">{p.total}<span style={{color:'rgba(255,255,255,.35)',fontWeight:500,fontSize:'.72rem',marginLeft:3}}>/50</span></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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