'use client'
import { useState, useEffect, useMemo } from 'react'

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  iconKey: 'sun',    color: '#fcd34d', window: '< 11 AM' },
  bright: { label: 'Bright', iconKey: 'sunBig', color: '#fdba74', window: '11 AM – 5 PM' },
  dark:   { label: 'Dark',   iconKey: 'sunset', color: '#d8b4fe', window: '5 – 8 PM' },
  moon:   { label: 'Moon',   iconKey: 'moon',   color: '#93c5fd', window: '8 PM +' },
}

function ModeIcon({ which, size = 14 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (which) {
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="5" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="19" y2="12"/><line x1="6.34" y1="6.34" x2="4.22" y2="4.22"/><line x1="19.78" y1="4.22" x2="17.66" y2="6.34"/><line x1="6.34" y1="17.66" x2="4.22" y2="19.78"/><line x1="19.78" y1="19.78" x2="17.66" y2="17.66"/></svg>
    case 'sunBig': return <svg {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    case 'sunset': return <svg {...p}><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>
    case 'moon': return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    default: return null
  }
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

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'mentors',  label: 'Mentors',  icon: 'users' },
  { id: 'teams',    label: 'Teams',    icon: 'group' },
  { id: 'students', label: 'Students', icon: 'user' },
  { id: 'upload',   label: 'Manual Upload', icon: 'upload' },
]

function Icon({ name, size = 14 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'grid':   return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    case 'users':  return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    case 'group':  return <svg {...p}><circle cx="9" cy="7" r="4"/><circle cx="17" cy="7" r="4"/><circle cx="13" cy="17" r="4"/></svg>
    case 'user':   return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'upload': return <svg {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'sync':   return <svg {...p}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    case 'star':   return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    default: return null
  }
}

export default function AdminAttendance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [date, setDate] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  useEffect(() => { fetchData() }, [date])

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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    try {
      const r = await fetch('/api/attendance/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'both' })
      })
      const d = await r.json()
      setSyncMsg({ ok: r.ok, text: d.message || (r.ok ? 'Sync complete' : d.error || 'Failed') })
      if (r.ok) fetchData()
    } catch { setSyncMsg({ ok: false, text: 'Network error' }) }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 4000) }
  }

  if (loading || !data) {
    return (
      <div className="aa-wrap">
        <style>{`.aa-load{padding:80px 20px;text-align:center;color:rgba(255,255,255,.3);font-family:'DM Sans',sans-serif;font-size:.85rem}`}</style>
        <div className="aa-load">Loading attendance matrix...</div>
      </div>
    )
  }

  const { stats, mode_stats, teams: teamRows, students, mentors, target_date } = data

  const fullAttend = students.filter(s => s.present_count === 4).length
  const partialAttend = students.filter(s => s.present_count > 0 && s.present_count < 4).length
  const totallyAbsent = students.filter(s => s.present_count === 0).length

  return (
    <div className="aa-wrap">
      <Styles syncing={syncing}/>

      {/* Top header */}
      <div className="aa-top">
        <div>
          <div className="aa-title">Attendance · Mode Matrix</div>
          <div className="aa-sub">{target_date} · 4 modes · {stats.total_students} trainees · {stats.total_mentors} mentors</div>
        </div>
        <div className="aa-top-r">
          <input type="date" className="aa-date" value={date} onChange={e => setDate(e.target.value)}/>
          <button className="aa-sync" onClick={handleSync} disabled={syncing}>
            <span className={syncing ? 'aa-spin' : ''}><Icon name="sync" size={13}/></span>
            {syncing ? 'Syncing' : 'Sync Now'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className={`aa-toast ${syncMsg.ok ? 'ok' : 'err'}`}>{syncMsg.text}</div>
      )}

      {/* Major cards */}
      <div className="aa-cards">
        <Card label="Total" value={stats.total_students} sub={`${stats.total_teams} teams`} variant="total"/>
        <Card label="Full Day" value={fullAttend} sub="all modes" variant="full"/>
        <Card label="Partial" value={partialAttend} sub="missed some" variant="partial"/>
        <Card label="Absent" value={totallyAbsent} sub="no punch" variant="absent"/>
      </div>

      {/* Mode strip */}
      <div className="aa-modes">
        {MODES.map(m => {
          const ms = mode_stats[m] || { students_present: 0, mentors_present: 0 }
          const meta = MODE_META[m]
          const inactive = ms.students_present === 0
          const pct = stats.total_students > 0 ? Math.round((ms.students_present / stats.total_students) * 100) : 0
          return (
            <div key={m} className={`aa-mode ${inactive ? 'inactive' : ''}`}>
              <div className="aa-mode-icn" style={{background:`${meta.color}1a`,color:meta.color}}><ModeIcon which={meta.iconKey} size={16}/></div>
              <div className="aa-mode-info">
                <div className="aa-mode-lab">{meta.label}<span className="aa-mode-win">· {meta.window}</span></div>
                <div className="aa-mode-row">
                  <span className="aa-mode-num">{inactive ? '—' : ms.students_present}</span>
                  <span className="aa-mode-pct">{inactive ? 'awaiting' : `${pct}%`}</span>
                </div>
                <div className="aa-mode-mn">{ms.mentors_present || 0} mentors</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="aa-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`aa-tab ${activeTab === t.id ? 'on' : ''}`} onClick={() => setActiveTab(t.id)}>
            <Icon name={t.icon} size={14}/>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="aa-pane">
        {activeTab === 'overview' && <OverviewPane teamRows={teamRows} students={students}/>}
        {activeTab === 'mentors' && <MentorsPane mentors={mentors} mode_stats={mode_stats}/>}
        {activeTab === 'teams' && <TeamsPane teamRows={teamRows} students={students}/>}
        {activeTab === 'students' && <StudentsPane students={students}/>}
        {activeTab === 'upload' && <UploadPane onUploaded={fetchData}/>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────── PANES ─────────────────────────────────────── */

function OverviewPane({ teamRows, students }) {
  const [groupBy, setGroupBy] = useState('technology')
  const [filter, setFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [techFilter, setTechFilter] = useState('all')

  const matrixRows = useMemo(() => teamRows.map(team => {
    const teamStudents = students.filter(s => s.team_number === team.team_number)
    return {
      ...team,
      students: teamStudents,
      missing_count: teamStudents.filter(s => s.present_count < 4 && s.present_count > 0).length,
      absent_count: teamStudents.filter(s => s.present_count === 0).length,
      full_count: teamStudents.filter(s => s.present_count === 4).length,
    }
  }), [teamRows, students])

  let filteredRows = matrixRows
  if (filter === 'partial') filteredRows = filteredRows.filter(t => t.missing_count > 0)
  if (filter === 'absent') filteredRows = filteredRows.filter(t => t.absent_count > 0)
  if (filter === 'full') filteredRows = filteredRows.filter(t => t.full_count === t.total_members && t.total_members > 0)
  if (techFilter !== 'all') filteredRows = filteredRows.filter(t => t.technology === techFilter)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    filteredRows = filteredRows.filter(t =>
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q) ||
      (t.mentor || '').toLowerCase().includes(q) ||
      t.students.some(s => (s.name || s.roll_number || '').toLowerCase().includes(q))
    )
  }

  const groups = {}
  filteredRows.forEach(t => {
    const key = groupBy === 'technology' ? (t.technology || 'Unknown')
              : groupBy === 'mentor' ? (t.mentor || 'No Mentor')
              : t.team_number
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  const sortedKeys = Object.keys(groups).sort()
  const technologies = ['all', ...Array.from(new Set(teamRows.map(t => t.technology).filter(Boolean))).sort()]

  return (
    <div className="ov-pane">
      <div className="ov-fil">
        <span className="ov-fil-lab">Group:</span>
        <Pill on={groupBy==='technology'} onClick={() => setGroupBy('technology')}>Technology</Pill>
        <Pill on={groupBy==='mentor'} onClick={() => setGroupBy('mentor')}>Mentor</Pill>
        <Pill on={groupBy==='team'} onClick={() => setGroupBy('team')}>Team</Pill>
        <span className="ov-fil-lab" style={{marginLeft:6}}>Show:</span>
        <Pill on={filter==='all'} onClick={() => setFilter('all')}>All <span className="ct">{teamRows.length}</span></Pill>
        <Pill on={filter==='partial'} onClick={() => setFilter('partial')}>Partial</Pill>
        <Pill on={filter==='absent'} onClick={() => setFilter('absent')}>Has Absent</Pill>
        <Pill on={filter==='full'} onClick={() => setFilter('full')}>Full Team</Pill>
      </div>
      <div className="ov-fil">
        <div className="ov-search">
          <Icon name="search" size={13}/>
          <input placeholder="Search team, project, mentor, student..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <select className="ov-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
      </div>

      {sortedKeys.length === 0 ? (
        <div className="ov-empty">No teams match your filters</div>
      ) : (
        sortedKeys.map(key => {
          const tlist = groups[key]
          const totMembers = tlist.reduce((s, t) => s + t.total_members, 0)
          const totFull = tlist.reduce((s, t) => s + t.full_count, 0)
          const totPartial = tlist.reduce((s, t) => s + (t.total_members - t.full_count - t.absent_count), 0)
          const totAbsent = tlist.reduce((s, t) => s + t.absent_count, 0)
          const tc = TECH_COLORS[key] || '#fd1c00'
          const tagStyle = groupBy === 'technology'
            ? { background: `${tc}1a`, color: tc, border: `1px solid ${tc}30` }
            : { background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.1)' }

          return (
            <div key={key} className="ov-grp">
              <div className="ov-grp-h">
                <span className="ov-grp-tag" style={tagStyle}>{key}</span>
                <span className="ov-grp-name">{tlist.length} teams · {totMembers} trainees</span>
                <span className="ov-grp-sub">
                  <span style={{color:'#4ade80'}}>{totFull} full</span>
                  <span style={{color:'#EEA727'}}>{totPartial} partial</span>
                  <span style={{color:'#fd1c00'}}>{totAbsent} absent</span>
                </span>
              </div>
              <div className="ov-team-list">
                {tlist.map(t => (
                  <div key={t.team_number} className={`ov-tr ${t.absent_count > 0 ? 'has-absent' : ''}`}>
                    <div className="ov-tr-l">
                      <div className="ov-tr-tn-row">
                        <span className="ov-tr-tn">{t.team_number}</span>
                        <span className="ov-tr-tt">{t.project_title || '—'}</span>
                      </div>
                      <div className="ov-tr-meta">{t.technology} · {t.mentor || 'No mentor'}</div>
                    </div>
                    <div className="ov-mems">
                      {t.students.map(s => {
                        const cls = s.present_count === 4 ? 'full' : s.present_count === 0 ? 'absent' : 'partial'
                        const dispName = (s.name || s.roll_number || '?').split(' ')[0]
                        return (
                          <div key={s.roll_number} className={`ov-mem ${cls}`} title={`${s.name || s.roll_number} · ${s.present_modes.join(', ') || 'No punches'}`}>
                            {s.is_leader && <span className="ov-mem-star">★</span>}
                            <span className="ov-mem-nm">{dispName}</span>
                            <span className="ov-mem-pat">
                              {MODES.map(m => (
                                <span key={m} className="ov-mem-cell" style={s.present_modes.includes(m) ? { background: MODE_META[m].color, borderColor: 'transparent' } : {}}/>
                              ))}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="ov-tr-stat">
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

      <div className="ov-leg">
        <span style={{fontWeight:700,color:'rgba(255,255,255,.7)'}}>Pattern:</span>
        {MODES.map(m => (<span key={m}><span className="ov-leg-cell" style={{background:MODE_META[m].color}}/>{MODE_META[m].label}</span>))}
        <span><span className="ov-leg-cell" style={{background:'transparent',border:'1px solid rgba(255,255,255,.2)'}}/>Missed</span>
        <span style={{marginLeft:'auto'}}>★ Leader · Stats: <span style={{color:'#4ade80'}}>full</span>/<span style={{color:'#EEA727'}}>partial</span>/<span style={{color:'#fd1c00'}}>absent</span></span>
      </div>
    </div>
  )
}

function MentorsPane({ mentors, mode_stats }) {
  const [subTab, setSubTab] = useState('self') // self | mentorship
  const [searchQ, setSearchQ] = useState('')
  const [techFilter, setTechFilter] = useState('all')

  const technologies = ['all', ...Array.from(new Set(mentors.map(m => m.technology).filter(Boolean))).sort()]

  let filtered = mentors
  if (techFilter !== 'all') filtered = filtered.filter(m => m.technology === techFilter)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    filtered = filtered.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.technology || '').toLowerCase().includes(q)
    )
  }

  const totalSelf = mentors.filter(m => m.self_present).length
  const totalAbsentSelf = mentors.length - totalSelf

  return (
    <div className="mt-pane">
      {/* Sub-tabs */}
      <div className="mt-subtabs">
        <button className={`mt-subtab ${subTab==='self'?'on':''}`} onClick={() => setSubTab('self')}>
          <Icon name="user" size={13}/> Mentor Attendance
          <span className="mt-subtab-ct">{totalSelf}/{mentors.length}</span>
        </button>
        <button className={`mt-subtab ${subTab==='mentorship'?'on':''}`} onClick={() => setSubTab('mentorship')}>
          <Icon name="users" size={13}/> Mentorship Attendance
          <span className="mt-subtab-ct">{mentors.reduce((s,m)=>s+m.students_present,0)} students</span>
        </button>
      </div>

      <div className="mt-fil">
        <div className="mt-search">
          <Icon name="search" size={13}/>
          <input placeholder="Search mentor by name or email..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <select className="mt-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
      </div>

      {subTab === 'self' && (
        <div className="mt-list">
          <div className="mt-list-h">
            <div>Mentor</div>
            <div>Technology</div>
            <div className="mt-list-h-c">Mode Pattern</div>
            <div className="mt-list-h-c">Status</div>
          </div>
          {filtered.length === 0 ? (
            <div className="ov-empty">No mentors match</div>
          ) : (
            filtered.map(m => {
              const cls = m.self_count === 4 ? 'full' : m.self_count === 0 ? 'absent' : 'partial'
              return (
                <div key={m.id} className={`mt-row ${cls}`}>
                  <div className="mt-mentor-cell">
                    <div className="mt-photo">
                      {m.image_url ? <img src={m.image_url} alt={m.name} onError={e => e.target.style.display = 'none'}/> : null}
                      <span className="mt-photo-fb">{(m.name || '?').charAt(0)}</span>
                    </div>
                    <div className="mt-mentor-info">
                      <div className="mt-mentor-name">{m.name}</div>
                      <div className="mt-mentor-email">{m.email}</div>
                    </div>
                  </div>
                  <div className="mt-tech-cell">
                    <span className="mt-tech-pill" style={{background:`${TECH_COLORS[m.technology]||'#fd1c00'}18`,color:TECH_COLORS[m.technology]||'#fd1c00',border:`1px solid ${TECH_COLORS[m.technology]||'#fd1c00'}30`}}>
                      {m.technology || '—'}
                    </span>
                  </div>
                  <div className="mt-pat-cell">
                    {MODES.map(mode => (
                      <span key={mode} className="mt-pat-cell-c" style={m.self_modes.includes(mode) ? { background: MODE_META[mode].color, borderColor: 'transparent' } : {}} title={MODE_META[mode].label}/>
                    ))}
                  </div>
                  <div className="mt-stat-cell">
                    <span className={`mt-stat-pill ${cls}`}>
                      {m.self_count === 4 ? 'Full' : m.self_count === 0 ? 'Absent' : `${m.self_count}/4`}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {subTab === 'mentorship' && (
        <div className="mt-list">
          <div className="mt-list-h mship">
            <div>Mentor</div>
            <div>Teams</div>
            <div className="mt-list-h-c">Students Present</div>
            <div className="mt-list-h-c">Mentorship %</div>
          </div>
          {filtered.length === 0 ? (
            <div className="ov-empty">No mentors match</div>
          ) : (
            filtered.sort((a,b) => b.mentorship_pct - a.mentorship_pct).map(m => {
              const pct = m.mentorship_pct
              const pctColor = pct >= 80 ? '#4ade80' : pct >= 50 ? '#EEA727' : '#fd1c00'
              return (
                <div key={m.id} className="mt-row">
                  <div className="mt-mentor-cell">
                    <div className="mt-photo">
                      {m.image_url ? <img src={m.image_url} alt={m.name} onError={e => e.target.style.display = 'none'}/> : null}
                      <span className="mt-photo-fb">{(m.name || '?').charAt(0)}</span>
                    </div>
                    <div className="mt-mentor-info">
                      <div className="mt-mentor-name">{m.name}</div>
                      <div className="mt-mentor-email">{m.technology || '—'}</div>
                    </div>
                  </div>
                  <div className="mt-tech-cell">
                    <span className="mt-team-ct">{m.team_count} {m.team_count === 1 ? 'team' : 'teams'}</span>
                    <span className="mt-stud-ct">· {m.student_count} students</span>
                  </div>
                  <div className="mt-pat-cell mship-cell">
                    <div className="mship-bar-wrap">
                      <div className="mship-bar"><div className="mship-fill" style={{width:`${pct}%`,background:pctColor}}/></div>
                      <span style={{color:'#4ade80'}}>{m.students_present}</span>
                      <span className="sep">·</span>
                      <span style={{color:'#fd1c00'}}>{m.students_absent}</span>
                      <span style={{color:'rgba(255,255,255,.3)',fontWeight:500}}>absent</span>
                    </div>
                  </div>
                  <div className="mt-stat-cell">
                    <span className="mt-stat-pill" style={{background:`${pctColor}18`,color:pctColor,border:`1px solid ${pctColor}30`}}>{pct}%</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function TeamsPane({ teamRows, students }) {
  const [searchQ, setSearchQ] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [sortBy, setSortBy] = useState('attendance') // attendance | team | absent

  const enriched = teamRows.map(team => {
    const ts = students.filter(s => s.team_number === team.team_number)
    return {
      ...team,
      full_count: ts.filter(s => s.present_count === 4).length,
      partial_count: ts.filter(s => s.present_count > 0 && s.present_count < 4).length,
      absent_count: ts.filter(s => s.present_count === 0).length,
    }
  })

  let filtered = enriched
  if (techFilter !== 'all') filtered = filtered.filter(t => t.technology === techFilter)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    filtered = filtered.filter(t =>
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q) ||
      (t.mentor || '').toLowerCase().includes(q)
    )
  }

  if (sortBy === 'attendance') filtered.sort((a, b) => b.attendance_pct - a.attendance_pct)
  if (sortBy === 'team') filtered.sort((a, b) => (a.team_number || '').localeCompare(b.team_number || ''))
  if (sortBy === 'absent') filtered.sort((a, b) => b.absent_count - a.absent_count)

  const technologies = ['all', ...Array.from(new Set(teamRows.map(t => t.technology).filter(Boolean))).sort()]

  return (
    <div className="tm-pane">
      <div className="mt-fil">
        <div className="mt-search">
          <Icon name="search" size={13}/>
          <input placeholder="Search team, project, mentor..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <select className="mt-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
        <select className="mt-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="attendance" style={{background:'#13101a'}}>Sort: Attendance</option>
          <option value="team" style={{background:'#13101a'}}>Sort: Team #</option>
          <option value="absent" style={{background:'#13101a'}}>Sort: Most Absent</option>
        </select>
      </div>

      <table className="tm-tbl">
        <thead>
          <tr>
            <th>Team</th>
            <th>Project</th>
            <th>Tech</th>
            <th>Mentor</th>
            <th style={{textAlign:'center'}}>Members</th>
            <th style={{textAlign:'center'}}>Full</th>
            <th style={{textAlign:'center'}}>Partial</th>
            <th style={{textAlign:'center'}}>Absent</th>
            <th style={{textAlign:'center'}}>%</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => {
            const tc = TECH_COLORS[t.technology] || '#fd1c00'
            const pctColor = t.attendance_pct >= 80 ? '#4ade80' : t.attendance_pct >= 50 ? '#EEA727' : '#fd1c00'
            return (
              <tr key={t.team_number}>
                <td className="tm-tn">{t.team_number}</td>
                <td className="tm-pt">{t.project_title || '—'}</td>
                <td><span className="mt-tech-pill" style={{background:`${tc}18`,color:tc,border:`1px solid ${tc}30`,fontSize:'.55rem'}}>{t.technology}</span></td>
                <td className="tm-mt">{t.mentor || '—'}</td>
                <td style={{textAlign:'center',fontWeight:700,color:'rgba(255,255,255,.85)'}}>{t.total_members}</td>
                <td style={{textAlign:'center',color:'#4ade80',fontWeight:700}}>{t.full_count}</td>
                <td style={{textAlign:'center',color:'#EEA727',fontWeight:700}}>{t.partial_count}</td>
                <td style={{textAlign:'center',color:'#fd1c00',fontWeight:700}}>{t.absent_count}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{padding:'2px 8px',borderRadius:6,background:`${pctColor}18`,color:pctColor,fontWeight:700,fontSize:'.65rem'}}>{t.attendance_pct}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <div className="ov-empty">No teams match</div>}
    </div>
  )
}

function StudentsPane({ students }) {
  const [searchQ, setSearchQ] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  let filtered = students
  if (techFilter !== 'all') filtered = filtered.filter(s => s.technology === techFilter)
  if (statusFilter === 'full') filtered = filtered.filter(s => s.present_count === 4)
  if (statusFilter === 'partial') filtered = filtered.filter(s => s.present_count > 0 && s.present_count < 4)
  if (statusFilter === 'absent') filtered = filtered.filter(s => s.present_count === 0)
  if (searchQ) {
    const q = searchQ.toLowerCase()
    filtered = filtered.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q) ||
      (s.team_number || '').toLowerCase().includes(q)
    )
  }

  const technologies = ['all', ...Array.from(new Set(students.map(s => s.technology).filter(Boolean))).sort()]

  return (
    <div className="st-pane">
      <div className="mt-fil">
        <div className="mt-search">
          <Icon name="search" size={13}/>
          <input placeholder="Search by name, roll, or team..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <select className="mt-sel" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
        <select className="mt-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all" style={{background:'#13101a'}}>All Status</option>
          <option value="full" style={{background:'#13101a'}}>Full Day</option>
          <option value="partial" style={{background:'#13101a'}}>Partial</option>
          <option value="absent" style={{background:'#13101a'}}>Absent</option>
        </select>
      </div>

      <div className="st-count">{filtered.length} students · {students.filter(s => s.present_count > 0).length} present today</div>

      <table className="tm-tbl">
        <thead>
          <tr>
            <th>Roll</th>
            <th>Name</th>
            <th>Team</th>
            <th>Mentor</th>
            <th style={{textAlign:'center'}}>Pattern</th>
            <th style={{textAlign:'center'}}>%</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 500).map(s => {
            const cls = s.present_count === 4 ? 'full' : s.present_count === 0 ? 'absent' : 'partial'
            const tc = TECH_COLORS[s.technology] || '#fd1c00'
            return (
              <tr key={s.roll_number} className={`st-row ${cls}`}>
                <td className="tm-tn">{s.roll_number}</td>
                <td className="tm-pt">{s.is_leader && <span style={{color:'#EEA727',marginRight:4}}>★</span>}{s.name || '—'}</td>
                <td><span style={{color:'#fd1c00',fontWeight:700,fontSize:'.65rem'}}>{s.team_number}</span></td>
                <td className="tm-mt">{s.mentor || '—'}</td>
                <td style={{textAlign:'center'}}>
                  <span style={{display:'inline-flex',gap:2}}>
                    {MODES.map(m => (
                      <span key={m} className="ov-mem-cell" style={s.present_modes.includes(m) ? { background: MODE_META[m].color, borderColor: 'transparent', width: 11, height: 11 } : { width: 11, height: 11 }}/>
                    ))}
                  </span>
                </td>
                <td style={{textAlign:'center'}}>
                  <span className={`st-pct ${cls}`}>{s.attendance_pct}%</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {filtered.length > 500 && <div className="ov-empty" style={{padding:14,fontSize:'.7rem'}}>Showing first 500 of {filtered.length} · refine search to see more</div>}
      {filtered.length === 0 && <div className="ov-empty">No students match</div>}
    </div>
  )
}

function UploadPane({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)

  async function handleUpload() {
    if (!file) return
    setUploading(true); setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/attendance/upload-dark-mode', { method: 'POST', body: fd })
      const d = await r.json()
      setMsg({ ok: r.ok, text: d.message || (r.ok ? 'Uploaded successfully' : d.error || 'Upload failed') })
      if (r.ok && onUploaded) onUploaded()
    } catch { setMsg({ ok: false, text: 'Network error' }) }
    finally { setUploading(false) }
  }

  return (
    <div className="up-pane">
      <div className="up-card">
        <div className="up-h">Manual Dark Mode Upload</div>
        <div className="up-sub">Upload Excel/CSV with roll numbers to mark attendance for dark mode (5–8 PM window).</div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} className="up-input"/>
        <button className="up-btn" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading...' : 'Upload & Process'}
        </button>
        {msg && <div className={`up-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────── HELPERS ─────────────────────────────────────── */

function Card({ label, value, sub, variant }) {
  return (
    <div className={`aa-card ${variant}`}>
      <div className="aa-card-l">{label}</div>
      <div className="aa-card-v">{(value || 0).toLocaleString()}</div>
      <div className="aa-card-s">{sub}</div>
    </div>
  )
}

function Pill({ on, onClick, children }) {
  return <span className={`pill ${on ? 'on' : ''}`} onClick={onClick}>{children}</span>
}

/* ─────────────────────────────────────── STYLES ─────────────────────────────────────── */

function Styles({ syncing }) {
  return (
    <style>{`
      .aa-wrap{font-family:'DM Sans',sans-serif;color:#fff;animation:aaIn .5s ease both;padding-bottom:24px}
      @keyframes aaIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes aaSpin{to{transform:rotate(360deg)}}
      .aa-spin{display:inline-block;animation:aaSpin 1s linear infinite}

      /* Top header */
      .aa-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px}
      .aa-title{font-size:1.1rem;font-weight:700;letter-spacing:-.01em}
      .aa-sub{font-size:.66rem;color:rgba(255,255,255,.4);margin-top:2px}
      .aa-top-r{display:flex;gap:8px;align-items:center}
      .aa-date{padding:7px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem;outline:none;cursor:pointer}
      .aa-sync{padding:7px 13px;border-radius:8px;background:linear-gradient(135deg,rgba(74,222,128,.12),rgba(34,197,94,.06));border:1px solid rgba(74,222,128,.25);color:#4ade80;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
      .aa-sync:hover{background:rgba(74,222,128,.18)}
      .aa-sync:disabled{opacity:.5;cursor:wait}

      .aa-toast{padding:7px 13px;margin-bottom:12px;border-radius:8px;font-size:.7rem;font-weight:600}
      .aa-toast.ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);color:#4ade80}
      .aa-toast.err{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.2);color:#ff6040}

      /* Major cards */
      .aa-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}
      .aa-card{padding:12px 14px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);transition:transform .15s}
      .aa-card:hover{transform:translateY(-1px)}
      .aa-card.full{background:linear-gradient(135deg,rgba(74,222,128,.08),rgba(34,197,94,.03));border-color:rgba(74,222,128,.22)}
      .aa-card.partial{background:linear-gradient(135deg,rgba(238,167,39,.08),rgba(238,167,39,.03));border-color:rgba(238,167,39,.22)}
      .aa-card.absent{background:linear-gradient(135deg,rgba(253,28,0,.08),rgba(253,28,0,.03));border-color:rgba(253,28,0,.22)}
      .aa-card.total{background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(139,92,246,.03));border-color:rgba(139,92,246,.22)}
      .aa-card-l{font-size:.5rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:5px}
      .aa-card-v{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.55rem;font-weight:800;line-height:1}
      .aa-card.full .aa-card-v{color:#4ade80}
      .aa-card.partial .aa-card-v{color:#EEA727}
      .aa-card.absent .aa-card-v{color:#fd1c00}
      .aa-card.total .aa-card-v{color:#a78bfa}
      .aa-card-s{font-size:.6rem;color:rgba(255,255,255,.4);margin-top:4px}

      /* Mode strip */
      .aa-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px;background:rgba(255,255,255,.02);border-radius:10px;border:1px solid rgba(255,255,255,.05);margin-bottom:14px}
      .aa-mode{display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:8px;transition:background .15s}
      .aa-mode:hover{background:rgba(255,255,255,.02)}
      .aa-mode-icn{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}
      .aa-mode-info{flex:1;min-width:0}
      .aa-mode-lab{font-size:.58rem;color:rgba(255,255,255,.55);font-weight:700;letter-spacing:.5px;text-transform:uppercase}
      .aa-mode-win{font-weight:500;color:rgba(255,255,255,.3);margin-left:4px;text-transform:none;letter-spacing:0}
      .aa-mode-row{display:flex;align-items:baseline;gap:6px;margin:1px 0 1px}
      .aa-mode-num{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.1rem;font-weight:800;color:#fff;line-height:1}
      .aa-mode-pct{font-size:.58rem;color:rgba(255,255,255,.35);font-weight:600}
      .aa-mode-mn{font-size:.55rem;color:rgba(255,255,255,.3);font-weight:500}
      .aa-mode.inactive .aa-mode-num{color:rgba(255,255,255,.2)}

      /* Tabs */
      .aa-tabs{display:flex;gap:4px;padding:4px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:12px;overflow-x:auto}
      .aa-tabs::-webkit-scrollbar{display:none}
      .aa-tab{padding:8px 14px;border-radius:8px;border:none;background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:all .15s}
      .aa-tab:hover{color:#fff;background:rgba(255,255,255,.04)}
      .aa-tab.on{background:linear-gradient(135deg,rgba(253,28,0,.18),rgba(238,167,39,.08));color:#fff;box-shadow:0 0 12px rgba(253,28,0,.1)}

      .aa-pane{animation:aaIn .35s ease both}

      /* OVERVIEW PANE */
      .ov-fil{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;align-items:center}
      .ov-fil-lab{font-size:.52rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-right:3px}
      .pill{padding:5px 11px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.66rem;color:rgba(255,255,255,.6);cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:5px;transition:all .15s;font-family:'DM Sans',sans-serif}
      .pill:hover{color:#fff;border-color:rgba(255,255,255,.15)}
      .pill.on{background:rgba(253,28,0,.12);border-color:rgba(253,28,0,.3);color:#fd1c00}
      .pill .ct{font-size:.54rem;background:rgba(0,0,0,.3);padding:1px 6px;border-radius:8px;font-weight:700}

      .ov-search{flex:1;min-width:180px;display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
      .ov-search:focus-within{border-color:rgba(253,28,0,.3);color:rgba(255,255,255,.6)}
      .ov-search input{flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem}
      .ov-search input::placeholder{color:rgba(255,255,255,.3)}
      .ov-sel{padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem;outline:none;cursor:pointer}

      .ov-grp{margin-bottom:12px}
      .ov-grp-h{display:flex;align-items:center;gap:10px;padding:9px 13px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px 10px 0 0;border-bottom:none}
      .ov-grp-tag{padding:3px 10px;border-radius:6px;font-size:.58rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
      .ov-grp-name{font-size:.74rem;font-weight:700;color:#fff}
      .ov-grp-sub{font-size:.62rem;color:rgba(255,255,255,.4);margin-left:auto;display:flex;gap:8px}

      .ov-team-list{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:0 0 10px 10px;border-top:none;overflow:hidden}
      .ov-tr{display:grid;grid-template-columns:200px 1fr 110px;gap:10px;padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;transition:background .12s}
      .ov-tr:last-child{border-bottom:none}
      .ov-tr:hover{background:rgba(255,255,255,.025)}
      .ov-tr.has-absent{background:rgba(253,28,0,.025)}
      .ov-tr-l{display:flex;flex-direction:column;gap:1px;min-width:0}
      .ov-tr-tn-row{display:flex;align-items:center;gap:7px}
      .ov-tr-tn{font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:800;color:#fd1c00}
      .ov-tr-tt{font-size:.7rem;color:rgba(255,255,255,.85);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ov-tr-meta{font-size:.58rem;color:rgba(255,255,255,.35)}

      .ov-mems{display:flex;gap:5px;flex-wrap:wrap;align-items:center}
      .ov-mem{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 7px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.6rem;font-weight:600;color:rgba(255,255,255,.7);transition:all .12s}
      .ov-mem:hover{background:rgba(255,255,255,.08)}
      .ov-mem.full{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.18);color:#86efac}
      .ov-mem.partial{background:rgba(238,167,39,.06);border-color:rgba(238,167,39,.2);color:#fcd34d}
      .ov-mem.absent{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.2);color:#ff6b5e}
      .ov-mem-nm{font-size:.6rem;max-width:75px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ov-mem-pat{display:flex;gap:1.5px}
      .ov-mem-cell{width:8px;height:8px;border-radius:2px;border:1px solid rgba(255,255,255,.12);transition:background .15s}
      .ov-mem-star{font-size:.55rem;color:#EEA727;margin-right:1px}

      .ov-tr-stat{display:flex;justify-content:flex-end;align-items:center;gap:4px;font-size:.66rem;font-weight:800;font-family:'DM Sans',sans-serif}
      .ov-tr-stat .o{color:#4ade80}
      .ov-tr-stat .w{color:#EEA727}
      .ov-tr-stat .x{color:#fd1c00}
      .ov-tr-stat .sep{color:rgba(255,255,255,.2);font-weight:400}

      .ov-leg{display:flex;gap:12px;padding:9px 13px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.05);margin-top:12px;font-size:.58rem;color:rgba(255,255,255,.5);align-items:center;flex-wrap:wrap}
      .ov-leg-cell{width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:4px}

      .ov-empty{padding:50px 16px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem}

      /* MENTORS PANE */
      .mt-subtabs{display:flex;gap:6px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:0}
      .mt-subtab{padding:9px 14px;background:transparent;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;transition:all .15s;white-space:nowrap}
      .mt-subtab:hover{color:#fff}
      .mt-subtab.on{color:#fd1c00;border-bottom-color:#fd1c00}
      .mt-subtab-ct{font-size:.55rem;background:rgba(255,255,255,.06);padding:2px 7px;border-radius:7px;color:rgba(255,255,255,.7);font-weight:700}
      .mt-subtab.on .mt-subtab-ct{background:rgba(253,28,0,.18);color:#fd1c00}

      .mt-fil{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
      .mt-search{flex:1;min-width:200px;display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
      .mt-search:focus-within{border-color:rgba(253,28,0,.3);color:rgba(255,255,255,.6)}
      .mt-search input{flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.72rem}
      .mt-search input::placeholder{color:rgba(255,255,255,.3)}
      .mt-sel{padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem;outline:none;cursor:pointer;min-width:140px}

      .mt-list{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden}
      .mt-list-h{display:grid;grid-template-columns:2fr 1.4fr 1.4fr 1fr;gap:10px;padding:10px 14px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.08);font-size:.55rem;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.2px}
      .mt-list-h.mship{grid-template-columns:2fr 1.4fr 2fr 1fr}
      .mt-list-h-c{text-align:center}
      .mt-row{display:grid;grid-template-columns:2fr 1.4fr 1.4fr 1fr;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;transition:background .12s}
      .mt-list-h.mship ~ * .mt-row,.mt-list-h.mship + .mt-row{grid-template-columns:2fr 1.4fr 2fr 1fr}
      .mt-row:hover{background:rgba(255,255,255,.025)}
      .mt-row:last-child{border-bottom:none}
      .mt-row.absent{background:rgba(253,28,0,.025)}
      .mt-row.partial{background:rgba(238,167,39,.02)}

      .mt-mentor-cell{display:flex;align-items:center;gap:10px;min-width:0}
      .mt-photo{width:34px;height:34px;border-radius:50%;flex-shrink:0;overflow:hidden;background:linear-gradient(135deg,#1a1a1a,#0a0a0a);border:1px solid rgba(238,167,39,.25);position:relative;display:flex;align-items:center;justify-content:center}
      .mt-photo img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
      .mt-photo-fb{font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:700;color:#EEA727}
      .mt-mentor-info{min-width:0;overflow:hidden}
      .mt-mentor-name{font-size:.78rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .mt-mentor-email{font-size:.6rem;color:rgba(255,255,255,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .mt-tech-cell{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .mt-tech-pill{padding:3px 9px;border-radius:5px;font-size:.55rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
      .mt-team-ct{font-size:.7rem;color:#fff;font-weight:700}
      .mt-stud-ct{font-size:.62rem;color:rgba(255,255,255,.4)}

      .mt-pat-cell{display:flex;justify-content:center;align-items:center;gap:4px}
      .mt-pat-cell-c{width:14px;height:14px;border-radius:3px;border:1px solid rgba(255,255,255,.12);transition:background .15s}

      .mship-cell{justify-content:flex-start}
      .mship-bar-wrap{display:flex;align-items:center;gap:8px;width:100%}
      .mship-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;min-width:60px}
      .mship-fill{height:100%;border-radius:3px;transition:width .4s}
      .mship-bar-wrap .sep{color:rgba(255,255,255,.2)}

      .mt-stat-cell{display:flex;justify-content:center;align-items:center}
      .mt-stat-pill{padding:4px 11px;border-radius:6px;font-size:.65rem;font-weight:700;letter-spacing:.3px}
      .mt-stat-pill.full{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
      .mt-stat-pill.partial{background:rgba(238,167,39,.12);color:#EEA727;border:1px solid rgba(238,167,39,.3)}
      .mt-stat-pill.absent{background:rgba(253,28,0,.12);color:#fd1c00;border:1px solid rgba(253,28,0,.3)}

      /* TEAMS PANE TABLE */
      .tm-tbl{width:100%;border-collapse:collapse;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden}
      .tm-tbl thead tr{background:rgba(255,255,255,.04)}
      .tm-tbl th{padding:9px 13px;text-align:left;font-size:.55rem;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid rgba(255,255,255,.08)}
      .tm-tbl td{padding:9px 13px;font-size:.7rem;color:rgba(255,255,255,.75);border-bottom:1px solid rgba(255,255,255,.04)}
      .tm-tbl tbody tr:hover{background:rgba(255,255,255,.025)}
      .tm-tbl tbody tr:last-child td{border-bottom:none}
      .tm-tn{color:#fd1c00;font-weight:800;font-family:'DM Sans',sans-serif;font-size:.7rem;white-space:nowrap}
      .tm-pt{color:#fff;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .tm-mt{color:rgba(255,255,255,.5);font-size:.66rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      /* STUDENTS PANE */
      .st-count{font-size:.65rem;color:rgba(255,255,255,.4);margin-bottom:8px;font-weight:600}
      .st-row.full td{background:rgba(74,222,128,.02)}
      .st-row.absent td{background:rgba(253,28,0,.02)}
      .st-pct{padding:2px 8px;border-radius:6px;font-weight:700;font-size:.62rem}
      .st-pct.full{background:rgba(74,222,128,.12);color:#4ade80}
      .st-pct.partial{background:rgba(238,167,39,.12);color:#EEA727}
      .st-pct.absent{background:rgba(253,28,0,.12);color:#fd1c00}

      /* UPLOAD PANE */
      .up-pane{padding:20px 0}
      .up-card{max-width:500px;margin:0 auto;padding:24px;border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.08)}
      .up-h{font-size:.95rem;font-weight:700;color:#fff;margin-bottom:6px}
      .up-sub{font-size:.72rem;color:rgba(255,255,255,.45);margin-bottom:16px;line-height:1.5}
      .up-input{width:100%;padding:11px 14px;border-radius:9px;background:rgba(255,255,255,.04);border:1px dashed rgba(255,255,255,.15);color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif;font-size:.74rem;cursor:pointer;margin-bottom:12px}
      .up-input::file-selector-button{padding:6px 12px;border-radius:6px;background:rgba(253,28,0,.12);border:1px solid rgba(253,28,0,.25);color:#fd1c00;font-family:inherit;font-weight:600;cursor:pointer;margin-right:10px;font-size:.7rem}
      .up-btn{width:100%;padding:11px;border-radius:9px;background:linear-gradient(135deg,#fd1c00,#c41600);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s}
      .up-btn:disabled{opacity:.5;cursor:not-allowed}
      .up-msg{margin-top:12px;padding:10px 14px;border-radius:9px;font-size:.72rem;font-weight:600}
      .up-msg.ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);color:#4ade80}
      .up-msg.err{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.2);color:#ff6040}

      /* RESPONSIVE */
      @media(max-width:900px){
        .aa-cards{grid-template-columns:1fr 1fr}
        .aa-modes{grid-template-columns:1fr 1fr}
        .ov-tr{grid-template-columns:1fr;gap:8px}
        .ov-tr-stat{justify-content:flex-start}
        .mt-list-h,.mt-row{grid-template-columns:1.5fr 1fr 1fr 0.6fr;gap:6px;padding:8px}
        .mt-mentor-name{font-size:.7rem}
        .tm-tbl th,.tm-tbl td{padding:7px 9px;font-size:.65rem}
      }
      @media(max-width:600px){
        .aa-cards{grid-template-columns:1fr 1fr}
        .aa-modes{grid-template-columns:1fr}
        .mt-list-h,.mt-row{grid-template-columns:1fr;gap:4px}
        .mt-list-h-c,.mt-stat-cell,.mt-pat-cell{justify-content:flex-start;text-align:left}
      }
    `}</style>
  )
}