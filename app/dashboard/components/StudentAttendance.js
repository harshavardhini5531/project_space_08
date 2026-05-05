'use client'
import { useState, useEffect } from 'react'

// Student attendance dashboard component
// Place at: app/dashboard/components/StudentAttendance.js
export default function StudentAttendance({ user }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.rollNumber) return
    fetchData()
    const iv = setInterval(fetchData, 60000) // refresh every 60s
    return () => clearInterval(iv)
  }, [user])

  async function fetchData() {
    try {
      const r = await fetch('/api/attendance/student-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: user.rollNumber }),
      })
      const d = await r.json()
      setData(d)
    } catch (e) {
      console.error('Attendance fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>Loading attendance...</div>
  if (!data?.today) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No attendance data</div>

  const { today, day_grid, streak, absent_days, team_absentees, stats, modes_meta } = data
  const todayPresent = today.present_count > 0

  const MODE_COLORS = {
    light:  { fg: '#EEA727', bg: 'rgba(238,167,39,.1)',  bd: 'rgba(238,167,39,.3)' },
    bright: { fg: '#fd1c00', bg: 'rgba(253,28,0,.1)',    bd: 'rgba(253,28,0,.3)'   },
    dark:   { fg: '#7B2FBE', bg: 'rgba(123,47,190,.1)',  bd: 'rgba(123,47,190,.3)' },
    moon:   { fg: '#3b82f6', bg: 'rgba(59,130,246,.1)',  bd: 'rgba(59,130,246,.3)' },
  }

  return (
    <div className="sa-wrap">
      <style>{`
        .sa-wrap{animation:saIn .5s ease both;font-family:'DM Sans',sans-serif}
        @keyframes saIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        /* Top status bar */
        .sa-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 22px;border-radius:14px;background:linear-gradient(135deg,rgba(12,8,18,.6),rgba(12,8,18,.4));border:1px solid rgba(255,255,255,.06);margin-bottom:18px;flex-wrap:wrap}
        .sa-top-left{display:flex;align-items:center;gap:14px;flex:1;min-width:200px}
        .sa-status-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;animation:saPulse 2s ease-in-out infinite}
        .sa-status-dot.present{background:#4ade80;box-shadow:0 0 16px rgba(74,222,128,.6)}
        .sa-status-dot.absent{background:#fd1c00;box-shadow:0 0 16px rgba(253,28,0,.6)}
        @keyframes saPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.85}}
        .sa-status-text{display:flex;flex-direction:column}
        .sa-status-label{font-size:.58rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:2px}
        .sa-status-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;letter-spacing:1px;text-transform:uppercase}
        .sa-status-val.present{color:#4ade80}
        .sa-status-val.absent{color:#fd1c00}

        .sa-mode-pills{display:flex;gap:6px;flex-wrap:wrap}
        .sa-mode-pill{display:flex;flex-direction:column;align-items:center;padding:8px 12px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);min-width:60px;transition:all .25s}
        .sa-mode-pill.present{background:var(--bg);border-color:var(--bd);box-shadow:0 0 10px var(--bd)}
        .sa-mode-pill-name{font-size:.55rem;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px}
        .sa-mode-pill.present .sa-mode-pill-name{color:var(--fg)}
        .sa-mode-pill-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.25)}
        .sa-mode-pill.present .sa-mode-pill-icon{color:var(--fg)}
        .sa-mode-pill-icon svg{width:18px;height:18px}

        /* Streak + stats */
        .sa-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
        .sa-stat{padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);text-align:center}
        .sa-stat-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.3rem;font-weight:800;line-height:1;letter-spacing:1px;margin-bottom:4px}
        .sa-stat-lb{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.2px;font-weight:700}

        /* 7-day grid card */
        .sa-card{padding:22px;border-radius:14px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06);margin-bottom:18px}
        .sa-card-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:18px;display:flex;align-items:center;gap:8px}
        .sa-card-title::before{content:'';width:3px;height:14px;background:linear-gradient(180deg,#fd1c00,#faa000);border-radius:2px;box-shadow:0 0 10px rgba(253,28,0,.5)}

        .sa-grid-table{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
        .sa-grid-day{padding:12px 8px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);text-align:center;transition:all .25s}
        .sa-grid-day.today{border-color:rgba(253,28,0,.3);background:rgba(253,28,0,.04);box-shadow:0 0 16px rgba(253,28,0,.1)}
        .sa-grid-day.absent{border-color:rgba(253,28,0,.15);background:rgba(253,28,0,.03)}
        .sa-grid-day-name{font-size:.58rem;font-weight:700;color:rgba(255,255,255,.4);letter-spacing:1.2px;text-transform:uppercase;margin-bottom:3px}
        .sa-grid-day-date{font-size:.62rem;color:rgba(255,255,255,.3);margin-bottom:8px}
        .sa-grid-modes{display:grid;grid-template-columns:repeat(2,1fr);gap:3px;margin-bottom:6px}
        .sa-grid-mode-cell{height:8px;border-radius:3px;background:rgba(255,255,255,.06);transition:background .25s}
        .sa-grid-mode-cell.present{background:var(--cell-bg);box-shadow:0 0 6px var(--cell-bg)}
        .sa-grid-pct{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.7rem;font-weight:800}

        /* Absent days list */
        .sa-absent-list{display:flex;flex-direction:column;gap:6px}
        .sa-absent-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.15)}
        .sa-absent-icon{width:24px;height:24px;border-radius:7px;background:rgba(253,28,0,.12);display:flex;align-items:center;justify-content:center;color:#fd1c00;flex-shrink:0}
        .sa-absent-text{flex:1;font-size:.78rem;color:rgba(255,255,255,.7);font-weight:500}
        .sa-absent-day{font-size:.62rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px;text-transform:uppercase}

        /* Team absentees */
        .sa-team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
        .sa-tm{padding:12px 14px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .25s}
        .sa-tm.absent{border-color:rgba(253,28,0,.18);background:rgba(253,28,0,.03)}
        .sa-tm.present{border-color:rgba(74,222,128,.15);background:rgba(74,222,128,.03)}
        .sa-tm-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
        .sa-tm-name{font-size:.78rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sa-tm-status{font-size:.54rem;font-weight:700;padding:3px 9px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0}
        .sa-tm-status.present{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
        .sa-tm-status.absent{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}
        .sa-tm-roll{font-size:.6rem;color:rgba(255,255,255,.3);margin-bottom:6px}
        .sa-tm-modes{display:flex;gap:4px}
        .sa-tm-mode-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.1)}
        .sa-tm-mode-dot.on{box-shadow:0 0 6px currentColor}

        @media(max-width:768px){
          .sa-stats{grid-template-columns:repeat(2,1fr)}
          .sa-grid-table{grid-template-columns:repeat(7,minmax(60px,1fr));overflow-x:auto}
          .sa-team-grid{grid-template-columns:1fr}
          .sa-top{padding:14px 16px}
        }
      `}</style>

      {/* Top status */}
      <div className="sa-top">
        <div className="sa-top-left">
          <div className={`sa-status-dot ${todayPresent ? 'present' : 'absent'}`}/>
          <div className="sa-status-text">
            <div className="sa-status-label">Today's Status</div>
            <div className={`sa-status-val ${todayPresent ? 'present' : 'absent'}`}>
              {todayPresent ? `Present (${today.present_count}/4)` : 'Absent'}
            </div>
          </div>
        </div>
        <div className="sa-mode-pills">
          {today.modes.map(m => (
            <div key={m.mode} className={`sa-mode-pill ${m.present ? 'present' : ''}`} style={{'--fg': MODE_COLORS[m.mode].fg, '--bg': MODE_COLORS[m.mode].bg, '--bd': MODE_COLORS[m.mode].bd}}>
              <div className="sa-mode-pill-name">{m.label}</div>
              <div className="sa-mode-pill-icon">
                {m.present
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="sa-stats">
        <div className="sa-stat">
          <div className="sa-stat-num" style={{color:'#4ade80'}}>{stats.overall_pct}%</div>
          <div className="sa-stat-lb">7-Day Average</div>
        </div>
        <div className="sa-stat">
          <div className="sa-stat-num" style={{color:'#EEA727'}}>{streak}<span style={{fontSize:'.7rem',marginLeft:4,opacity:.6}}>days</span></div>
          <div className="sa-stat-lb">Current Streak</div>
        </div>
        <div className="sa-stat">
          <div className="sa-stat-num" style={{color:'#fd1c00'}}>{stats.days_absent}</div>
          <div className="sa-stat-lb">Days Absent</div>
        </div>
        <div className="sa-stat">
          <div className="sa-stat-num" style={{color:'#3b82f6'}}>{stats.total_present}<span style={{fontSize:'.7rem',marginLeft:2,opacity:.5}}>/{stats.total_possible}</span></div>
          <div className="sa-stat-lb">Punches</div>
        </div>
      </div>

      {/* 7-day grid */}
      <div className="sa-card">
        <div className="sa-card-title">Last 7 Days · Mode-wise</div>
        <div className="sa-grid-table">
          {day_grid.map(d => (
            <div key={d.date} className={`sa-grid-day ${d.is_today?'today':''} ${d.is_absent?'absent':''}`}>
              <div className="sa-grid-day-name">{d.day_name}</div>
              <div className="sa-grid-day-date">{d.date.slice(8)}/{d.date.slice(5,7)}</div>
              <div className="sa-grid-modes">
                {d.modes.map(m => (
                  <div key={m.mode} className={`sa-grid-mode-cell ${m.present?'present':''}`} style={{'--cell-bg': MODE_COLORS[m.mode].fg}} title={`${m.label}: ${m.present?'Present':'Absent'}`}/>
                ))}
              </div>
              <div className="sa-grid-pct" style={{color: d.attendance_pct >= 75 ? '#4ade80' : d.attendance_pct >= 50 ? '#EEA727' : d.attendance_pct === 0 ? '#fd1c00' : 'rgba(255,255,255,.4)'}}>
                {d.attendance_pct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Absent days */}
      {absent_days.length > 0 && (
        <div className="sa-card">
          <div className="sa-card-title">Days You Were Absent</div>
          <div className="sa-absent-list">
            {absent_days.map(d => (
              <div key={d.date} className="sa-absent-row">
                <div className="sa-absent-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
                <div className="sa-absent-text">{new Date(d.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
                <div className="sa-absent-day">{d.day_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team absentees */}
      {team_absentees && team_absentees.length > 0 && (
        <div className="sa-card">
          <div className="sa-card-title">Team Today · {team_absentees.filter(t=>t.is_absent).length} absent</div>
          <div className="sa-team-grid">
            {team_absentees.map(t => (
              <div key={t.roll_number} className={`sa-tm ${t.is_absent?'absent':'present'}`}>
                <div className="sa-tm-row">
                  <span className="sa-tm-name">{t.name || t.roll_number}</span>
                  <span className={`sa-tm-status ${t.is_absent?'absent':'present'}`}>
                    {t.is_absent ? 'Absent' : `${t.present_count}/4`}
                  </span>
                </div>
                <div className="sa-tm-roll">{t.roll_number}</div>
                <div className="sa-tm-modes">
                  {['light','bright','dark','moon'].map(mode => (
                    <div key={mode} className={`sa-tm-mode-dot ${t.present_modes.includes(mode)?'on':''}`} style={{color: MODE_COLORS[mode].fg, background: t.present_modes.includes(mode) ? MODE_COLORS[mode].fg : 'rgba(255,255,255,.1)'}} title={mode}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}