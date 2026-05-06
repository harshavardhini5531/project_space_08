'use client'
import { useState, useEffect } from 'react'

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  icon: '☀', color: '#EEA727', window: 'before 11 AM' },
  bright: { label: 'Bright', icon: '🔆', color: '#fd1c00', window: '11 AM – 5 PM' },
  dark:   { label: 'Dark',   icon: '🌆', color: '#a855f7', window: '5 – 8 PM' },
  moon:   { label: 'Moon',   icon: '🌙', color: '#3b82f6', window: '8 PM +' },
}
const TECH_COLORS = {
  'AWS Development': '#ff9900',
  'Google Flutter': '#42a5f5',
  'Full Stack': '#4ade80',
  'Data Specialist': '#a78bfa',
  'ServiceNow': '#22c55e',
  'VLSI': '#ef4444',
  'SkillUp Coder': '#f59e0b',
}

export default function AdminAttendance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [groupBy, setGroupBy] = useState('technology') // technology | mentor | team
  const [filter, setFilter] = useState('all') // all | partial | absent | full
  const [searchQ, setSearchQ] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  useEffect(() => {
    fetchData()
  }, [date])

  async function fetchData() {
    setLoading(true)
    try {
      const r = await fetch('/api/attendance/admin-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date ? { date } : {}),
      })
      const d = await r.json()
      setData(d)
      if (!date && d.target_date) setDate(d.target_date)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync(type) {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const r = await fetch('/api/attendance/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const d = await r.json()
      setSyncMsg({ ok: r.ok, text: d.message || (r.ok ? 'Sync complete' : d.error || 'Failed') })
      if (r.ok) fetchData()
    } catch (e) {
      setSyncMsg({ ok: false, text: 'Network error' })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  if (loading || !data) {
    return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)',fontFamily:'DM Sans,sans-serif'}}>Loading attendance matrix...</div>
  }

  const { stats, mode_stats, teams: teamRows, students, target_date } = data

  // Build full-attendance / partial / absent counts
  const fullAttend = students.filter(s => s.present_count === 4).length
  const partialAttend = students.filter(s => s.present_count > 0 && s.present_count < 4).length
  const totallyAbsent = students.filter(s => s.present_count === 0).length

  // Active modes (those with at least 1 punch — others are "awaiting")
  const activeModes = MODES.filter(m => mode_stats[m]?.students_present > 0)

  // Build matrix rows: per-team with member-level attendance
  let matrixRows = teamRows.map(team => {
    const teamStudents = students.filter(s => s.team_number === team.team_number)
    const teamMissingCount = teamStudents.filter(s => s.present_count < 4 && s.present_count > 0).length
    const teamAbsentCount = teamStudents.filter(s => s.present_count === 0).length
    const teamFullCount = teamStudents.filter(s => s.present_count === 4).length
    return {
      ...team,
      students: teamStudents,
      missing_count: teamMissingCount,
      absent_count: teamAbsentCount,
      full_count: teamFullCount,
    }
  })

  // Apply filters
  if (filter === 'partial') matrixRows = matrixRows.filter(t => t.missing_count > 0)
  if (filter === 'absent') matrixRows = matrixRows.filter(t => t.absent_count > 0)
  if (filter === 'full') matrixRows = matrixRows.filter(t => t.full_count === t.total_members && t.total_members > 0)
  if (techFilter !== 'all') matrixRows = matrixRows.filter(t => t.technology === techFilter)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    matrixRows = matrixRows.filter(t =>
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q) ||
      (t.mentor || '').toLowerCase().includes(q) ||
      t.students.some(s => (s.name || s.roll_number || '').toLowerCase().includes(q))
    )
  }

  // Group rows by selected groupBy
  const groups = {}
  matrixRows.forEach(t => {
    const key = groupBy === 'technology' ? (t.technology || 'Unknown')
              : groupBy === 'mentor' ? (t.mentor || 'No Mentor')
              : t.team_number
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  // Sort groups: tech alphabetical, mentor alphabetical, team by number
  const sortedKeys = Object.keys(groups).sort()

  const technologies = ['all', ...Array.from(new Set(teamRows.map(t => t.technology).filter(Boolean))).sort()]

  return (
    <div className="amx-wrap">
      <style>{`
        .amx-wrap{animation:amxIn .5s ease both;font-family:'DM Sans',sans-serif;color:#fff;padding-bottom:20px}
        @keyframes amxIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes amxPulse{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 14px rgba(253,28,0,.3)}}

        .amx-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px}
        .amx-h-l{display:flex;flex-direction:column;gap:3px}
        .amx-h-t{font-size:1.15rem;font-weight:700;color:#fff;letter-spacing:-.01em}
        .amx-h-s{font-size:.7rem;color:rgba(255,255,255,.4)}
        .amx-h-r{display:flex;gap:8px;align-items:center}
        .amx-date-input{padding:7px 12px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'DM Sans',sans-serif;font-size:.74rem;outline:none;cursor:pointer}
        .amx-sync-btn{padding:8px 14px;border-radius:9px;background:linear-gradient(135deg,rgba(74,222,128,.12),rgba(34,197,94,.06));border:1px solid rgba(74,222,128,.25);color:#4ade80;font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
        .amx-sync-btn:hover{background:rgba(74,222,128,.18)}
        .amx-sync-btn:disabled{opacity:.5;cursor:wait}
        .amx-sync-btn svg{animation:${syncing ? 'aaSpin 1s linear infinite' : 'none'}}
        @keyframes aaSpin{to{transform:rotate(360deg)}}

        /* Major cards */
        .amx-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .amx-card{padding:14px 16px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);transition:all .2s}
        .amx-card:hover{transform:translateY(-1px)}
        .amx-card.full{background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(34,197,94,.04));border-color:rgba(74,222,128,.25)}
        .amx-card.partial{background:linear-gradient(135deg,rgba(238,167,39,.08),rgba(238,167,39,.04));border-color:rgba(238,167,39,.25)}
        .amx-card.absent{background:linear-gradient(135deg,rgba(253,28,0,.08),rgba(253,28,0,.04));border-color:rgba(253,28,0,.25)}
        .amx-card.total{background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(139,92,246,.04));border-color:rgba(139,92,246,.25)}
        .amx-card-lab{font-size:.5rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:5px}
        .amx-card-v{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.7rem;font-weight:800;line-height:1}
        .amx-card.full .amx-card-v{color:#4ade80}
        .amx-card.partial .amx-card-v{color:#EEA727}
        .amx-card.absent .amx-card-v{color:#fd1c00}
        .amx-card.total .amx-card-v{color:#a78bfa}
        .amx-card-sub{font-size:.62rem;color:rgba(255,255,255,.4);margin-top:5px}

        /* Mode strip */
        .amx-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px;background:rgba(255,255,255,.02);border-radius:11px;border:1px solid rgba(255,255,255,.05);margin-bottom:14px}
        .amx-mode{display:flex;align-items:center;gap:10px;padding:6px}
        .amx-mode-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}
        .amx-mode-info{flex:1;min-width:0}
        .amx-mode-name{font-size:.58rem;color:rgba(255,255,255,.5);font-weight:600;letter-spacing:.5px;text-transform:uppercase}
        .amx-mode-num{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.05rem;font-weight:800;color:#fff;line-height:1.2}
        .amx-mode-pct{font-size:.58rem;color:rgba(255,255,255,.35)}
        .amx-mode.inactive .amx-mode-num{color:rgba(255,255,255,.2)}

        /* Filter row */
        .amx-fil{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
        .amx-fil-lab{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-right:4px}
        .amx-fil-pill{padding:5px 11px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.66rem;color:rgba(255,255,255,.6);cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:all .15s;font-family:'DM Sans',sans-serif}
        .amx-fil-pill:hover{color:#fff;border-color:rgba(255,255,255,.15)}
        .amx-fil-pill.on{background:rgba(253,28,0,.12);border-color:rgba(253,28,0,.3);color:#fd1c00}
        .amx-fil-pill .ct{font-size:.54rem;background:rgba(0,0,0,.3);padding:1px 6px;border-radius:8px;font-weight:700}
        .amx-search{flex:1;min-width:180px;display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
        .amx-search:focus-within{border-color:rgba(253,28,0,.3)}
        .amx-search input{flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.72rem}
        .amx-search input::placeholder{color:rgba(255,255,255,.3)}
        .amx-tech-sel{padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem;outline:none;cursor:pointer}

        /* Group */
        .amx-grp{margin-bottom:14px}
        .amx-grp-h{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:11px 11px 0 0;border-bottom:none}
        .amx-grp-tag{padding:3px 10px;border-radius:6px;font-size:.6rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
        .amx-grp-name{font-size:.78rem;font-weight:700;color:#fff}
        .amx-grp-sub{font-size:.65rem;color:rgba(255,255,255,.4);margin-left:auto;display:flex;gap:8px}

        /* Team row */
        .amx-team-list{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:0 0 11px 11px;border-top:none;overflow:hidden}
        .amx-tr{display:grid;grid-template-columns:200px 1fr 130px;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;cursor:pointer;transition:background .15s}
        .amx-tr:last-child{border-bottom:none}
        .amx-tr:hover{background:rgba(255,255,255,.025)}
        .amx-tr.has-absent{background:rgba(253,28,0,.03)}
        .amx-tr-team{display:flex;flex-direction:column;gap:2px;min-width:0}
        .amx-tr-tn-row{display:flex;align-items:center;gap:7px}
        .amx-tr-tn{font-family:'DM Sans',sans-serif;font-size:.74rem;font-weight:800;color:#fd1c00}
        .amx-tr-tt{font-size:.7rem;color:rgba(255,255,255,.85);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .amx-tr-mentor{font-size:.6rem;color:rgba(255,255,255,.35)}
        
        /* Member chips */
        .amx-mems{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
        .amx-mem{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 7px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.62rem;font-weight:600;color:rgba(255,255,255,.7);transition:all .15s}
        .amx-mem:hover{background:rgba(255,255,255,.08)}
        .amx-mem.full{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.18)}
        .amx-mem.partial{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.2)}
        .amx-mem.absent{background:rgba(253,28,0,.08);border-color:rgba(253,28,0,.2);color:#ff6b5e}
        .amx-mem-name{font-size:.62rem;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .amx-mem-pat{display:flex;gap:1.5px;align-items:center}
        .amx-mem-cell{width:8px;height:8px;border-radius:2px;border:1px solid rgba(255,255,255,.12)}
        .amx-mem-cell.on{border-color:transparent}
        .amx-mem-leader{font-size:.55rem;color:#EEA727;margin-right:2px}

        .amx-tr-stat{display:flex;justify-content:flex-end;align-items:center;gap:5px;font-size:.66rem;font-weight:700;font-family:'DM Sans',sans-serif}
        .amx-tr-stat .o{color:#4ade80}
        .amx-tr-stat .w{color:#EEA727}
        .amx-tr-stat .x{color:#fd1c00}
        .amx-tr-stat .sep{color:rgba(255,255,255,.2)}

        /* Legend */
        .amx-leg{display:flex;gap:14px;padding:9px 14px;background:rgba(255,255,255,.02);border-radius:9px;border:1px solid rgba(255,255,255,.05);margin-top:14px;font-size:.6rem;color:rgba(255,255,255,.5);align-items:center;flex-wrap:wrap}
        .amx-leg-cell{width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:4px}

        .amx-empty{padding:60px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:.82rem}

        @media(max-width:768px){
          .amx-cards{grid-template-columns:1fr 1fr}
          .amx-modes{grid-template-columns:1fr 1fr}
          .amx-tr{grid-template-columns:1fr;gap:8px;padding:10px}
          .amx-tr-stat{justify-content:flex-start}
        }
      `}</style>

      <div className="amx-h">
        <div className="amx-h-l">
          <div className="amx-h-t">Mode Attendance Matrix</div>
          <div className="amx-h-s">Track who came in which mode · {target_date}</div>
        </div>
        <div className="amx-h-r">
          <input type="date" className="amx-date-input" value={date} onChange={e => setDate(e.target.value)}/>
          <button className="amx-sync-btn" onClick={() => handleSync('both')} disabled={syncing}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div style={{padding:'8px 14px',marginBottom:14,borderRadius:9,background:syncMsg.ok?'rgba(74,222,128,.08)':'rgba(253,28,0,.08)',border:`1px solid ${syncMsg.ok?'rgba(74,222,128,.2)':'rgba(253,28,0,.2)'}`,color:syncMsg.ok?'#4ade80':'#ff6040',fontSize:'.72rem',fontWeight:600}}>
          {syncMsg.text}
        </div>
      )}

      {/* Major cards */}
      <div className="amx-cards">
        <div className="amx-card total">
          <div className="amx-card-lab">Total</div>
          <div className="amx-card-v">{stats.total_students.toLocaleString()}</div>
          <div className="amx-card-sub">{stats.total_teams} teams · {stats.total_mentors} mentors</div>
        </div>
        <div className="amx-card full">
          <div className="amx-card-lab">Full Attendance</div>
          <div className="amx-card-v">{fullAttend}</div>
          <div className="amx-card-sub">all modes attended</div>
        </div>
        <div className="amx-card partial">
          <div className="amx-card-lab">Partial</div>
          <div className="amx-card-v">{partialAttend}</div>
          <div className="amx-card-sub">missed some modes</div>
        </div>
        <div className="amx-card absent">
          <div className="amx-card-lab">Absent</div>
          <div className="amx-card-v">{totallyAbsent}</div>
          <div className="amx-card-sub">no punch today</div>
        </div>
      </div>

      {/* Mode strip */}
      <div className="amx-modes">
        {MODES.map(m => {
          const ms = mode_stats[m] || { students_present: 0 }
          const meta = MODE_META[m]
          const inactive = ms.students_present === 0
          const pct = stats.total_students > 0 ? Math.round((ms.students_present / stats.total_students) * 100) : 0
          return (
            <div key={m} className={`amx-mode ${inactive ? 'inactive' : ''}`}>
              <div className="amx-mode-icon" style={{background:`${meta.color}18`,color:meta.color}}>{meta.icon}</div>
              <div className="amx-mode-info">
                <div className="amx-mode-name">{meta.label} · {meta.window}</div>
                <div className="amx-mode-num">{inactive ? '—' : ms.students_present}</div>
                <div className="amx-mode-pct">{inactive ? 'awaiting' : `${pct}% of trainees`}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="amx-fil">
        <span className="amx-fil-lab">Group:</span>
        <span className={`amx-fil-pill ${groupBy==='technology'?'on':''}`} onClick={() => setGroupBy('technology')}>By Technology</span>
        <span className={`amx-fil-pill ${groupBy==='mentor'?'on':''}`} onClick={() => setGroupBy('mentor')}>By Mentor</span>
        <span className={`amx-fil-pill ${groupBy==='team'?'on':''}`} onClick={() => setGroupBy('team')}>By Team</span>
        <span className="amx-fil-lab" style={{marginLeft:8}}>Show:</span>
        <span className={`amx-fil-pill ${filter==='all'?'on':''}`} onClick={() => setFilter('all')}>All <span className="ct">{teamRows.length}</span></span>
        <span className={`amx-fil-pill ${filter==='partial'?'on':''}`} onClick={() => setFilter('partial')}>Has Missing</span>
        <span className={`amx-fil-pill ${filter==='absent'?'on':''}`} onClick={() => setFilter('absent')}>Has Absent</span>
        <span className={`amx-fil-pill ${filter==='full'?'on':''}`} onClick={() => setFilter('full')}>Full Team</span>
      </div>
      <div className="amx-fil">
        <div className="amx-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input placeholder="Search team, project, mentor, or student..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <select className="amx-tech-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
      </div>

      {sortedKeys.length === 0 ? (
        <div className="amx-empty">No teams match your filters</div>
      ) : (
        sortedKeys.map(key => {
          const tlist = groups[key]
          // Compute group totals
          const totMembers = tlist.reduce((s, t) => s + t.total_members, 0)
          const totFull = tlist.reduce((s, t) => s + t.full_count, 0)
          const totPartial = tlist.reduce((s, t) => s + (t.total_members - t.full_count - t.absent_count), 0)
          const totAbsent = tlist.reduce((s, t) => s + t.absent_count, 0)
          const tc = TECH_COLORS[key] || '#fd1c00'
          const tagStyle = groupBy === 'technology'
            ? { background: `${tc}1a`, color: tc, border: `1px solid ${tc}30` }
            : { background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.1)' }
          return (
            <div key={key} className="amx-grp">
              <div className="amx-grp-h">
                <span className="amx-grp-tag" style={tagStyle}>{key}</span>
                <span className="amx-grp-name">{tlist.length} teams · {totMembers} trainees</span>
                <span className="amx-grp-sub">
                  <span style={{color:'#4ade80'}}>{totFull} full</span>
                  <span style={{color:'#EEA727'}}>{totPartial} partial</span>
                  <span style={{color:'#fd1c00'}}>{totAbsent} absent</span>
                </span>
              </div>
              <div className="amx-team-list">
                {tlist.map(t => (
                  <div key={t.team_number} className={`amx-tr ${t.absent_count > 0 ? 'has-absent' : ''}`} onClick={() => setExpanded(expanded === t.team_number ? null : t.team_number)}>
                    <div className="amx-tr-team">
                      <div className="amx-tr-tn-row">
                        <span className="amx-tr-tn">{t.team_number}</span>
                        <span className="amx-tr-tt">{t.project_title || '—'}</span>
                      </div>
                      <div className="amx-tr-mentor">{t.technology} · {t.mentor || 'No mentor'}</div>
                    </div>
                    <div className="amx-mems">
                      {t.students.map(s => {
                        const cls = s.present_count === 4 ? 'full' : s.present_count === 0 ? 'absent' : 'partial'
                        const dispName = (s.name || s.roll_number || '?').split(' ')[0]
                        return (
                          <div key={s.roll_number} className={`amx-mem ${cls}`} title={`${s.name || s.roll_number} · ${s.present_modes.join(', ') || 'No punches'}`}>
                            {s.is_leader && <span className="amx-mem-leader">★</span>}
                            <span className="amx-mem-name">{dispName}</span>
                            <span className="amx-mem-pat">
                              {MODES.map(m => (
                                <span key={m} className={`amx-mem-cell ${s.present_modes.includes(m) ? 'on' : ''}`} style={s.present_modes.includes(m) ? {background: MODE_META[m].color} : {}}/>
                              ))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="amx-tr-stat">
                      <span className="o">{t.full_count}</span>
                      <span className="sep">/</span>
                      <span className="w">{t.total_members - t.full_count - t.absent_count}</span>
                      <span className="sep">/</span>
                      <span className="x">{t.absent_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Legend */}
      <div className="amx-leg">
        <span style={{fontWeight:700,color:'rgba(255,255,255,.7)'}}>Pattern:</span>
        <span><span className="amx-leg-cell" style={{background:'#EEA727'}}/>Light</span>
        <span><span className="amx-leg-cell" style={{background:'#fd1c00'}}/>Bright</span>
        <span><span className="amx-leg-cell" style={{background:'#a855f7'}}/>Dark</span>
        <span><span className="amx-leg-cell" style={{background:'#3b82f6'}}/>Moon</span>
        <span><span className="amx-leg-cell" style={{background:'transparent',border:'1px solid rgba(255,255,255,.2)'}}/>Missed</span>
        <span style={{marginLeft:'auto'}}>★ = Team Leader · Stats: <span style={{color:'#4ade80'}}>full</span> / <span style={{color:'#EEA727'}}>partial</span> / <span style={{color:'#fd1c00'}}>absent</span></span>
      </div>
    </div>
  )
}