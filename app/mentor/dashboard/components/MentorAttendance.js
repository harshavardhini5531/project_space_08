'use client'
import { useState, useEffect, useMemo } from 'react'

const MODES = ['light', 'bright', 'dark', 'moon']
const MODE_META = {
  light:  { label: 'Light',  icon: '☀', color: '#EEA727', window: 'before 11 AM' },
  bright: { label: 'Bright', icon: '🔆', color: '#fd1c00', window: '11 AM – 5 PM' },
  dark:   { label: 'Dark',   icon: '🌆', color: '#a855f7', window: '5 – 8 PM' },
  moon:   { label: 'Moon',   icon: '🌙', color: '#3b82f6', window: '8 PM +' },
}

const MENTOR_MODES = ['morning', 'night']
const MENTOR_MODE_META = {
  morning: { label: 'Morning', icon: '☀', color: '#EEA727', window: 'after 5 AM' },
  night:   { label: 'Night',   icon: '🌙', color: '#3b82f6', window: 'after 10 PM' },
}

function Icon({ name, size = 14 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'user':   return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    case 'users':  return <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    case 'group':  return <svg {...p}><circle cx="9" cy="7" r="4"/><circle cx="17" cy="7" r="4"/><circle cx="13" cy="17" r="4"/></svg>
    case 'alert':  return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    case 'check':  return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>
    case 'x':      return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    default: return null
  }
}

export default function MentorAttendance({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('self')
  const [activeTeamId, setActiveTeamId] = useState(null)

  useEffect(() => {
    if (!mentor?.email) return
    fetchData()
    const iv = setInterval(fetchData, 60000)
    return () => clearInterval(iv)
  }, [mentor])

  async function fetchData() {
    try {
      const r = await fetch('/api/attendance/mentor-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorEmail: mentor.email, days: 7 }),
      })
      const d = await r.json()
      setData(d)
      if (!activeTeamId && d.teams?.length) setActiveTeamId(d.teams[0].team_number)
    } catch (e) { console.error('Mentor attendance error:', e) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="mp-load">Loading attendance...</div>
  if (!data?.mentor) return <div className="mp-load">No data available</div>

  const { mentor: me, teams, combined } = data
  const maxModes = me.max_modes || 2

  const allStudents = teams.flatMap(t => t.members)
  const totalStudents = allStudents.length
  const fullCount = allStudents.filter(s => s.today_count === 4).length
  const partialCount = allStudents.filter(s => s.today_count > 0 && s.today_count < 4).length
  const absentCount = allStudents.filter(s => s.today_count === 0).length

  const missingStudents = allStudents.filter(s => s.today_count === 0).map(s => ({
    name: s.name, roll: s.roll_number, team: teams.find(t => t.members.some(m => m.roll_number === s.roll_number))?.team_number
  }))
  const partialStudents = allStudents.filter(s => s.today_count > 0 && s.today_count < 4).map(s => ({
    name: s.name, roll: s.roll_number, team: teams.find(t => t.members.some(m => m.roll_number === s.roll_number))?.team_number
  }))

  return (
    <div className="mp-wrap">
      <Styles/>

      {(missingStudents.length > 0 || partialStudents.length > 0) && (
        <div className="mp-alert">
          <div className="mp-alert-icon"><Icon name="alert" size={16}/></div>
          <div className="mp-alert-content">
            <div className="mp-alert-t">
              {missingStudents.length > 0 && <span style={{color:'#fd1c00'}}>{missingStudents.length} fully absent</span>}
              {missingStudents.length > 0 && partialStudents.length > 0 && <span className="mp-alert-sep"> · </span>}
              {partialStudents.length > 0 && <span style={{color:'#EEA727'}}>{partialStudents.length} partial today</span>}
            </div>
            <div className="mp-alert-s">
              {[...missingStudents.slice(0, 3), ...partialStudents.slice(0, 3 - Math.min(3, missingStudents.length))]
                .slice(0, 4)
                .map(s => `${s.name || s.roll} (${s.team})`).join(' · ')}
              {(missingStudents.length + partialStudents.length) > 4 && ' ...'}
            </div>
          </div>
        </div>
      )}

      <div className="mp-tabs">
        <button className={`mp-tab ${activeTab === 'self' ? 'on' : ''}`} onClick={() => setActiveTab('self')}>
          <Icon name="user" size={14}/>
          <span>My Attendance</span>
          <span className={`mp-tab-pill ${me.today_present ? 'ok' : 'no'}`}>{me.today_count}/{maxModes}</span>
        </button>
        <button className={`mp-tab ${activeTab === 'all' ? 'on' : ''}`} onClick={() => setActiveTab('all')}>
          <Icon name="users" size={14}/>
          <span>My Teams</span>
          <span className="mp-tab-pill ok">{combined.total_present_today}/{combined.total_students}</span>
        </button>
        <button className={`mp-tab ${activeTab === 'team' ? 'on' : ''}`} onClick={() => setActiveTab('team')}>
          <Icon name="group" size={14}/>
          <span>Team Detail</span>
          <span className="mp-tab-pill">{teams.length}</span>
        </button>
      </div>

      {activeTab === 'self' && <SelfPane me={me}/>}
      {activeTab === 'all' && <AllTeamsPane teams={teams} combined={combined} totalStudents={totalStudents} fullCount={fullCount} partialCount={partialCount} absentCount={absentCount}/>}
      {activeTab === 'team' && <TeamDetailPane teams={teams} activeTeamId={activeTeamId} setActiveTeamId={setActiveTeamId}/>}
    </div>
  )
}

/* ─────────────── SELF PANE ─────────────── */
function SelfPane({ me }) {
  const maxModes = me.max_modes || 2
  return (
    <div className="self-pane">
      <div className="self-today">
        <div className="self-today-l">
          <div className="self-today-lab">Today's Attendance</div>
          <div className="self-today-name">{me.name}</div>
          <div className="self-today-tech">{me.technology}</div>
        </div>
        <div className="self-today-r">
          <div className="self-today-num">{me.today_count}<span className="self-today-num-sub">/{maxModes}</span></div>
          <div className="self-today-modes">
            {MENTOR_MODES.map(m => {
              const present = me.today_modes.includes(m)
              const meta = MENTOR_MODE_META[m]
              return (
                <div key={m} className={`self-today-mode ${present ? 'on' : 'off'}`} style={present ? {background:`${meta.color}1f`,color:meta.color,borderColor:`${meta.color}40`} : {}}>
                  <span className="self-today-mode-icon">{meta.icon}</span>
                  <span className="self-today-mode-lab">{meta.label}</span>
                  <span className="self-today-mode-status">{present ? <Icon name="check" size={11}/> : <Icon name="x" size={11}/>}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="self-7day">
        <div className="self-7day-h">
          <div className="self-7day-t">Last 7 Days</div>
          <div className="self-7day-pct">{me.attendance_pct}% overall · {me.total_punches} total punches</div>
        </div>
        <div className="self-7day-grid">
          <div className="self-7day-row self-7day-row-h" style={{gridTemplateColumns:'140px 1fr 1fr 80px'}}>
            <div className="self-7day-cell self-7day-cell-h">Date</div>
            {MENTOR_MODES.map(m => (
              <div key={m} className="self-7day-cell self-7day-cell-h" style={{textAlign:'center'}}>
                <span style={{color:MENTOR_MODE_META[m].color,fontSize:'.85rem'}}>{MENTOR_MODE_META[m].icon}</span>
                <div style={{fontSize:'.5rem',marginTop:1}}>{MENTOR_MODE_META[m].label}</div>
              </div>
            ))}
            <div className="self-7day-cell self-7day-cell-h" style={{textAlign:'right'}}>Punches</div>
          </div>
          {me.day_grid.slice().reverse().map((d) => (
            <div key={d.date} className={`self-7day-row ${d.is_today ? 'today' : ''}`} style={{gridTemplateColumns:'140px 1fr 1fr 80px'}}>
              <div className="self-7day-cell">
                <div className="self-7day-date">
                  <span className="self-7day-day">{d.day_name}</span>
                  <span className="self-7day-md">{new Date(d.date).getDate()} {new Date(d.date).toLocaleDateString('en-US',{month:'short'})}</span>
                  {d.is_today && <span className="self-7day-now">NOW</span>}
                </div>
              </div>
              {d.modes.map(modeData => (
                <div key={modeData.mode} className="self-7day-cell" style={{textAlign:'center'}}>
                  <span className="self-7day-dot" style={modeData.present ? {background:MENTOR_MODE_META[modeData.mode].color,boxShadow:`0 0 8px ${MENTOR_MODE_META[modeData.mode].color}80`} : {}}/>
                </div>
              ))}
              <div className="self-7day-cell self-7day-modes-count" style={{textAlign:'right'}}>
                <span style={{color:d.present_count===2?'#4ade80':d.present_count===1?'#EEA727':'#fd1c00',fontWeight:700}}>{d.present_count}</span>
                <span style={{color:'rgba(255,255,255,.3)'}}>/2</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── ALL TEAMS PANE ─────────────── */
function AllTeamsPane({ teams, combined, totalStudents, fullCount, partialCount, absentCount }) {
  const [searchQ, setSearchQ] = useState('')
  const [filter, setFilter] = useState('all')

  let filtered = teams.map(t => {
    let members = t.members
    if (filter === 'absent') members = members.filter(m => m.today_count === 0)
    if (filter === 'partial') members = members.filter(m => m.today_count > 0 && m.today_count < 4)
    if (filter === 'full') members = members.filter(m => m.today_count === 4)
    if (searchQ) {
      const q = searchQ.toLowerCase()
      members = members.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.roll_number || '').toLowerCase().includes(q)
      )
    }
    return { ...t, members }
  }).filter(t => t.members.length > 0)

  if (searchQ) {
    const q = searchQ.toLowerCase()
    filtered = filtered.filter(t =>
      t.members.length > 0 ||
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q)
    )
  }

  return (
    <div className="all-pane">
      <div className="all-stats">
        <div className="all-stat total">
          <div className="all-stat-l">My Students</div>
          <div className="all-stat-v">{totalStudents}</div>
          <div className="all-stat-s">across {teams.length} teams</div>
        </div>
        <div className="all-stat full">
          <div className="all-stat-l">Full Day</div>
          <div className="all-stat-v">{fullCount}</div>
          <div className="all-stat-s">all 4 modes</div>
        </div>
        <div className="all-stat partial">
          <div className="all-stat-l">Partial</div>
          <div className="all-stat-v">{partialCount}</div>
          <div className="all-stat-s">missed some</div>
        </div>
        <div className="all-stat absent">
          <div className="all-stat-l">Absent</div>
          <div className="all-stat-v">{absentCount}</div>
          <div className="all-stat-s">no punch</div>
        </div>
      </div>

      <div className="all-fil">
        <div className="all-search">
          <Icon name="search" size={13}/>
          <input placeholder="Search student or team..." value={searchQ} onChange={e => setSearchQ(e.target.value)}/>
        </div>
        <span className={`all-pill ${filter==='all'?'on':''}`} onClick={() => setFilter('all')}>All</span>
        <span className={`all-pill ${filter==='full'?'on':''}`} onClick={() => setFilter('full')}>Full</span>
        <span className={`all-pill ${filter==='partial'?'on':''}`} onClick={() => setFilter('partial')}>Partial</span>
        <span className={`all-pill ${filter==='absent'?'on':''}`} onClick={() => setFilter('absent')}>Absent</span>
      </div>

      {filtered.length === 0 ? (
        <div className="all-empty">No students match your filter</div>
      ) : (
        filtered.map(t => (
          <div key={t.team_number} className="all-team">
            <div className="all-team-h">
              <span className="all-team-tn">{t.team_number}</span>
              <span className="all-team-tt">{t.project_title || '—'}</span>
              <span className="all-team-meta">{t.technology}</span>
              <span className="all-team-pct">
                <span className="all-bar"><span className="all-bar-f" style={{width:`${t.today_pct}%`,background:t.today_pct>=80?'#4ade80':t.today_pct>=50?'#EEA727':'#fd1c00'}}/></span>
                <span style={{color:t.today_pct>=80?'#4ade80':t.today_pct>=50?'#EEA727':'#fd1c00',fontSize:'.65rem',fontWeight:800}}>{t.today_pct}%</span>
              </span>
            </div>
            <div className="all-mems">
              {t.members.map(m => {
                const cls = m.today_count === 4 ? 'full' : m.today_count === 0 ? 'absent' : 'partial'
                return (
                  <div key={m.roll_number} className={`all-mem ${cls}`} title={`${m.roll_number} · ${m.today_modes.join(', ') || 'No punches'}`}>
                    {m.is_leader && <span className="all-mem-star">★</span>}
                    <span className="all-mem-nm">{(m.name || m.roll_number).split(' ')[0]}</span>
                    <span className="all-mem-pat">
                      {MODES.map(mode => (
                        <span key={mode} className="all-mem-c" style={m.today_modes.includes(mode) ? {background:MODE_META[mode].color,borderColor:'transparent'} : {}}/>
                      ))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div className="all-leg">
        <span style={{fontWeight:700,color:'rgba(255,255,255,.7)'}}>Pattern:</span>
        {MODES.map(m => (<span key={m}><span className="all-leg-c" style={{background:MODE_META[m].color}}/>{MODE_META[m].label}</span>))}
        <span><span className="all-leg-c" style={{background:'transparent',border:'1px solid rgba(255,255,255,.2)'}}/>Missed</span>
        <span style={{marginLeft:'auto'}}>★ = Team Leader</span>
      </div>
    </div>
  )
}

/* ─────────────── TEAM DETAIL PANE ─────────────── */
function TeamDetailPane({ teams, activeTeamId, setActiveTeamId }) {
  const team = teams.find(t => t.team_number === activeTeamId) || teams[0]
  if (!team) return <div className="all-empty">No teams assigned</div>

  return (
    <div className="td-pane">
      <div className="td-sel">
        {teams.map(t => (
          <button key={t.team_number} className={`td-sel-btn ${t.team_number === activeTeamId ? 'on' : ''}`} onClick={() => setActiveTeamId(t.team_number)}>
            <span className="td-sel-tn">{t.team_number}</span>
            <span className="td-sel-tt">{t.project_title || '—'}</span>
            <span className={`td-sel-pct ${t.today_pct>=80?'ok':t.today_pct>=50?'mid':'bad'}`}>{t.today_pct}%</span>
          </button>
        ))}
      </div>

      <div className="td-h">
        <div className="td-h-l">
          <div className="td-h-tn">{team.team_number}</div>
          <div className="td-h-tt">{team.project_title || '—'}</div>
          <div className="td-h-meta">{team.technology} · {team.total_members} members</div>
        </div>
        <div className="td-h-stats">
          <div className="td-h-stat" style={{color:'#4ade80'}}>
            <div className="td-h-stat-v">{team.today_present}</div>
            <div className="td-h-stat-l">Present</div>
          </div>
          <div className="td-h-stat" style={{color:'#fd1c00'}}>
            <div className="td-h-stat-v">{team.today_absent}</div>
            <div className="td-h-stat-l">Absent</div>
          </div>
          <div className="td-h-stat" style={{color:team.today_pct>=80?'#4ade80':team.today_pct>=50?'#EEA727':'#fd1c00'}}>
            <div className="td-h-stat-v">{team.today_pct}%</div>
            <div className="td-h-stat-l">Today</div>
          </div>
        </div>
      </div>

      <div className="td-modes">
        {MODES.map(m => {
          const cnt = team.mode_breakdown[m] || 0
          const meta = MODE_META[m]
          const pct = team.total_members > 0 ? Math.round((cnt / team.total_members) * 100) : 0
          return (
            <div key={m} className="td-mode" style={cnt > 0 ? {background:`${meta.color}10`,borderColor:`${meta.color}30`} : {}}>
              <div className="td-mode-icon" style={{color:meta.color}}>{meta.icon}</div>
              <div className="td-mode-info">
                <div className="td-mode-lab">{meta.label}</div>
                <div className="td-mode-num"><span style={{color:cnt>0?meta.color:'rgba(255,255,255,.3)'}}>{cnt}</span><span style={{color:'rgba(255,255,255,.3)'}}>/{team.total_members}</span></div>
                <div className="td-mode-pct">{pct}%</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="td-h-sub">Members · 7-day attendance</div>
      <div className="td-mems">
        {team.members.map(m => {
          const cls = m.today_count === 4 ? 'full' : m.today_count === 0 ? 'absent' : 'partial'
          return (
            <div key={m.roll_number} className={`td-mem ${cls}`}>
              <div className="td-mem-l">
                <div className="td-mem-name">
                  {m.is_leader && <span className="td-mem-star">★</span>}
                  {m.name || m.roll_number}
                </div>
                <div className="td-mem-roll">{m.roll_number}</div>
              </div>
              <div className="td-mem-today">
                <div className="td-mem-today-lab">TODAY</div>
                <div className="td-mem-today-pat">
                  {MODES.map(mode => (
                    <span key={mode} className="td-mem-today-c" style={m.today_modes.includes(mode) ? {background:MODE_META[mode].color,borderColor:'transparent'} : {}} title={MODE_META[mode].label}/>
                  ))}
                </div>
              </div>
              <div className="td-mem-week">
                {m.mode_grid.slice().reverse().map((d) => (
                  <div key={d.date} className="td-mem-day" title={`${d.date}: ${d.count}/4`}>
                    <div className="td-mem-day-cells">
                      {d.modes.map(modeData => (
                        <span key={modeData.mode} className="td-mem-day-c" style={modeData.present ? {background:MODE_META[modeData.mode].color} : {}}/>
                      ))}
                    </div>
                    <div className="td-mem-day-lab">{new Date(d.date).getDate()}</div>
                  </div>
                ))}
              </div>
              <div className="td-mem-r">
                <div className="td-mem-pct" style={{color:m.attendance_pct>=80?'#4ade80':m.attendance_pct>=50?'#EEA727':'#fd1c00'}}>{m.attendance_pct}%</div>
                <div className="td-mem-pct-l">7-day</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────── STYLES ─────────────── */
function Styles() {
  return (
    <style>{`
      .mp-wrap{font-family:'DM Sans',sans-serif;color:#fff;animation:mpIn .5s ease both;padding-bottom:20px}
      .mp-load{padding:80px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:.85rem;font-family:'DM Sans',sans-serif}
      @keyframes mpIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

      .mp-alert{display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:11px;background:linear-gradient(135deg,rgba(253,28,0,.1),rgba(238,167,39,.04));border:1px solid rgba(253,28,0,.25);margin-bottom:14px}
      .mp-alert-icon{width:32px;height:32px;border-radius:9px;background:rgba(253,28,0,.18);display:flex;align-items:center;justify-content:center;color:#fd1c00;flex-shrink:0}
      .mp-alert-content{flex:1;min-width:0}
      .mp-alert-t{font-size:.78rem;font-weight:700;margin-bottom:3px}
      .mp-alert-sep{color:rgba(255,255,255,.3);margin:0 4px}
      .mp-alert-s{font-size:.62rem;color:rgba(255,255,255,.55);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

      .mp-tabs{display:flex;gap:4px;padding:4px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:14px;overflow-x:auto}
      .mp-tabs::-webkit-scrollbar{display:none}
      .mp-tab{padding:8px 14px;border-radius:8px;border:none;background:transparent;color:rgba(255,255,255,.5);font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:all .15s}
      .mp-tab:hover{color:#fff;background:rgba(255,255,255,.04)}
      .mp-tab.on{background:linear-gradient(135deg,rgba(253,28,0,.18),rgba(238,167,39,.08));color:#fff}
      .mp-tab-pill{font-size:.55rem;background:rgba(255,255,255,.08);padding:2px 7px;border-radius:6px;font-weight:700;color:rgba(255,255,255,.6)}
      .mp-tab.on .mp-tab-pill{background:rgba(253,28,0,.25);color:#fff}
      .mp-tab-pill.ok{background:rgba(74,222,128,.18);color:#4ade80}
      .mp-tab-pill.no{background:rgba(253,28,0,.18);color:#fd1c00}

      .self-pane{animation:mpIn .35s ease both}
      .self-today{display:flex;align-items:stretch;gap:18px;padding:20px 22px;border-radius:14px;background:linear-gradient(135deg,rgba(238,167,39,.08),rgba(253,28,0,.03));border:1px solid rgba(238,167,39,.22);margin-bottom:14px;flex-wrap:wrap}
      .self-today-l{flex:1;min-width:200px}
      .self-today-lab{font-size:.5rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:rgba(238,167,39,.7);margin-bottom:5px}
      .self-today-name{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:3px}
      .self-today-tech{font-size:.7rem;color:rgba(255,255,255,.5)}
      .self-today-r{display:flex;align-items:center;gap:18px}
      .self-today-num{font-family:'Orbitron','DM Sans',sans-serif;font-size:2.4rem;font-weight:800;line-height:1;color:#EEA727}
      .self-today-num-sub{font-size:1.1rem;color:rgba(255,255,255,.3)}
      .self-today-modes{display:flex;flex-direction:column;gap:5px}
      .self-today-mode{display:flex;align-items:center;gap:7px;padding:5px 10px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.65rem;font-weight:600;min-width:135px}
      .self-today-mode.off{color:rgba(255,255,255,.3)}
      .self-today-mode-icon{font-size:.85rem}
      .self-today-mode-lab{flex:1}
      .self-today-mode-status{display:flex;align-items:center}

      .self-7day{padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07)}
      .self-7day-h{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:11px;flex-wrap:wrap;gap:8px}
      .self-7day-t{font-size:.85rem;font-weight:700;color:#fff}
      .self-7day-pct{font-size:.66rem;color:rgba(255,255,255,.5)}
      .self-7day-grid{background:rgba(0,0,0,.18);border-radius:9px;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
      .self-7day-row{display:grid;gap:8px;padding:7px 12px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;transition:background .12s}
      .self-7day-row:last-child{border-bottom:none}
      .self-7day-row.today{background:rgba(238,167,39,.04)}
      .self-7day-row-h{background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.08)}
      .self-7day-cell{font-size:.66rem;color:rgba(255,255,255,.7)}
      .self-7day-cell-h{font-size:.5rem;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.4);font-weight:700}
      .self-7day-date{display:flex;flex-direction:column;gap:1px}
      .self-7day-day{font-weight:700;color:#fff;font-size:.7rem}
      .self-7day-md{font-size:.58rem;color:rgba(255,255,255,.4)}
      .self-7day-now{display:inline-block;font-size:.5rem;background:rgba(238,167,39,.2);color:#EEA727;padding:1px 6px;border-radius:5px;margin-top:2px;font-weight:700;letter-spacing:.5px;width:fit-content}
      .self-7day-dot{width:14px;height:14px;border-radius:4px;display:inline-block;border:1px solid rgba(255,255,255,.12);background:transparent}
      .self-7day-modes-count{font-size:.7rem;font-weight:700}

      .all-pane{animation:mpIn .35s ease both}
      .all-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
      .all-stat{padding:11px 13px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07)}
      .all-stat.total{background:linear-gradient(135deg,rgba(139,92,246,.06),transparent);border-color:rgba(139,92,246,.2)}
      .all-stat.full{background:linear-gradient(135deg,rgba(74,222,128,.06),transparent);border-color:rgba(74,222,128,.2)}
      .all-stat.partial{background:linear-gradient(135deg,rgba(238,167,39,.06),transparent);border-color:rgba(238,167,39,.2)}
      .all-stat.absent{background:linear-gradient(135deg,rgba(253,28,0,.06),transparent);border-color:rgba(253,28,0,.2)}
      .all-stat-l{font-size:.5rem;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:4px}
      .all-stat-v{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.4rem;font-weight:800;line-height:1}
      .all-stat.total .all-stat-v{color:#a78bfa}
      .all-stat.full .all-stat-v{color:#4ade80}
      .all-stat.partial .all-stat-v{color:#EEA727}
      .all-stat.absent .all-stat-v{color:#fd1c00}
      .all-stat-s{font-size:.55rem;color:rgba(255,255,255,.4);margin-top:3px}

      .all-fil{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
      .all-search{flex:1;min-width:180px;display:flex;align-items:center;gap:6px;padding:6px 11px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
      .all-search:focus-within{border-color:rgba(253,28,0,.3);color:rgba(255,255,255,.6)}
      .all-search input{flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.7rem}
      .all-search input::placeholder{color:rgba(255,255,255,.3)}
      .all-pill{padding:5px 11px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.66rem;color:rgba(255,255,255,.6);cursor:pointer;font-weight:600;transition:all .15s}
      .all-pill:hover{color:#fff;border-color:rgba(255,255,255,.15)}
      .all-pill.on{background:rgba(253,28,0,.12);border-color:rgba(253,28,0,.3);color:#fd1c00}

      .all-team{margin-bottom:10px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:11px;overflow:hidden}
      .all-team-h{display:flex;align-items:center;gap:10px;padding:9px 13px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.05);flex-wrap:wrap}
      .all-team-tn{font-family:'DM Sans',sans-serif;font-size:.74rem;font-weight:800;color:#fd1c00}
      .all-team-tt{font-size:.74rem;font-weight:600;color:#fff;flex:1;min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .all-team-meta{font-size:.6rem;color:rgba(255,255,255,.4)}
      .all-team-pct{display:flex;align-items:center;gap:6px}
      .all-bar{width:60px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
      .all-bar-f{height:100%;border-radius:3px;transition:width .4s}
      .all-mems{padding:8px 13px;display:flex;flex-wrap:wrap;gap:5px}
      .all-mem{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 7px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.6rem;font-weight:600;color:rgba(255,255,255,.7);transition:all .12s}
      .all-mem:hover{background:rgba(255,255,255,.08)}
      .all-mem.full{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.18);color:#86efac}
      .all-mem.partial{background:rgba(238,167,39,.06);border-color:rgba(238,167,39,.2);color:#fcd34d}
      .all-mem.absent{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.2);color:#ff6b5e}
      .all-mem-star{font-size:.55rem;color:#EEA727}
      .all-mem-nm{font-size:.6rem;max-width:75px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .all-mem-pat{display:flex;gap:1.5px}
      .all-mem-c{width:8px;height:8px;border-radius:2px;border:1px solid rgba(255,255,255,.12)}

      .all-leg{display:flex;gap:12px;padding:9px 13px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.05);margin-top:12px;font-size:.58rem;color:rgba(255,255,255,.5);align-items:center;flex-wrap:wrap}
      .all-leg-c{width:8px;height:8px;border-radius:2px;display:inline-block;margin-right:4px}
      .all-empty{padding:50px 16px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem}

      .td-pane{animation:mpIn .35s ease both}
      .td-sel{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}
      .td-sel::-webkit-scrollbar{height:4px}
      .td-sel::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
      .td-sel-btn{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 12px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.7);font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;flex-shrink:0;text-align:left;min-width:140px;position:relative}
      .td-sel-btn:hover{background:rgba(255,255,255,.07)}
      .td-sel-btn.on{background:rgba(253,28,0,.12);border-color:rgba(253,28,0,.3)}
      .td-sel-tn{font-size:.62rem;font-weight:800;color:#fd1c00}
      .td-sel-tt{font-size:.65rem;color:#fff;font-weight:600;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .td-sel-pct{position:absolute;top:6px;right:8px;font-size:.55rem;font-weight:700;padding:1px 6px;border-radius:5px}
      .td-sel-pct.ok{background:rgba(74,222,128,.18);color:#4ade80}
      .td-sel-pct.mid{background:rgba(238,167,39,.18);color:#EEA727}
      .td-sel-pct.bad{background:rgba(253,28,0,.18);color:#fd1c00}

      .td-h{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-radius:12px;background:linear-gradient(135deg,rgba(253,28,0,.06),transparent);border:1px solid rgba(253,28,0,.18);margin-bottom:12px;flex-wrap:wrap;gap:14px}
      .td-h-l{flex:1;min-width:200px}
      .td-h-tn{font-family:'DM Sans',sans-serif;font-size:.6rem;font-weight:800;color:#fd1c00;letter-spacing:1px;margin-bottom:3px}
      .td-h-tt{font-size:1rem;font-weight:700;color:#fff;margin-bottom:3px}
      .td-h-meta{font-size:.65rem;color:rgba(255,255,255,.5)}
      .td-h-stats{display:flex;gap:18px}
      .td-h-stat{text-align:center}
      .td-h-stat-v{font-family:'Orbitron','DM Sans',sans-serif;font-size:1.4rem;font-weight:800;line-height:1}
      .td-h-stat-l{font-size:.5rem;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;margin-top:3px;color:rgba(255,255,255,.5)}

      .td-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:14px}
      .td-mode{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
      .td-mode-icon{font-size:1rem;flex-shrink:0}
      .td-mode-info{flex:1;min-width:0}
      .td-mode-lab{font-size:.55rem;letter-spacing:.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.55)}
      .td-mode-num{font-family:'Orbitron','DM Sans',sans-serif;font-size:.95rem;font-weight:800;line-height:1.3}
      .td-mode-pct{font-size:.55rem;color:rgba(255,255,255,.4)}

      .td-h-sub{font-size:.65rem;letter-spacing:1.2px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:8px;padding:0 4px}
      .td-mems{background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06);border-radius:11px;overflow:hidden}
      .td-mem{display:grid;grid-template-columns:160px 100px 1fr 60px;gap:10px;padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;transition:background .12s}
      .td-mem:last-child{border-bottom:none}
      .td-mem:hover{background:rgba(255,255,255,.025)}
      .td-mem.absent{background:rgba(253,28,0,.025)}
      .td-mem.partial{background:rgba(238,167,39,.02)}
      .td-mem-l{display:flex;flex-direction:column;gap:1px;min-width:0}
      .td-mem-name{font-size:.72rem;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .td-mem-star{color:#EEA727;margin-right:4px}
      .td-mem-roll{font-size:.58rem;color:rgba(255,255,255,.4)}
      .td-mem-today{display:flex;flex-direction:column;align-items:center;gap:2px}
      .td-mem-today-lab{font-size:.45rem;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.4)}
      .td-mem-today-pat{display:flex;gap:2px}
      .td-mem-today-c{width:11px;height:11px;border-radius:2px;border:1px solid rgba(255,255,255,.12)}
      .td-mem-week{display:flex;gap:3px;justify-content:center}
      .td-mem-day{display:flex;flex-direction:column;align-items:center;gap:2px}
      .td-mem-day-cells{display:grid;grid-template-columns:1fr 1fr;gap:1px}
      .td-mem-day-c{width:5px;height:5px;border-radius:1px;background:rgba(255,255,255,.06)}
      .td-mem-day-lab{font-size:.45rem;color:rgba(255,255,255,.35);font-weight:700}
      .td-mem-r{text-align:right}
      .td-mem-pct{font-family:'Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;line-height:1}
      .td-mem-pct-l{font-size:.45rem;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-top:2px}

      @media(max-width:780px){
        .self-today{flex-direction:column;align-items:stretch}
        .self-today-r{flex-direction:column;align-items:flex-start;gap:10px}
        .self-7day-row{gap:5px;padding:6px 10px}
        .all-stats{grid-template-columns:1fr 1fr}
        .td-h{flex-direction:column;align-items:flex-start}
        .td-h-stats{width:100%;justify-content:space-around}
        .td-modes{grid-template-columns:1fr 1fr}
        .td-mem{grid-template-columns:1fr;gap:6px;padding:9px 11px}
        .td-mem-week{justify-content:flex-start}
      }
      @media(max-width:560px){
        .all-stats{grid-template-columns:1fr 1fr}
      }
    `}</style>
  )
}