'use client'
import { useState, useEffect } from 'react'

// Mentor attendance dashboard component
// Place at: app/mentor/dashboard/components/MentorAttendance.js
export default function MentorAttendance({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [filterMode, setFilterMode] = useState('all') // all | light | bright | dark | moon

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
    } catch (e) {
      console.error('Mentor attendance error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>Loading attendance...</div>
  if (!data?.mentor) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No data</div>

  const { mentor: me, teams, combined, modes_meta } = data

  const MODE_COLORS = {
    light:  { fg: '#EEA727', bg: 'rgba(238,167,39,.1)',  bd: 'rgba(238,167,39,.3)' },
    bright: { fg: '#fd1c00', bg: 'rgba(253,28,0,.1)',    bd: 'rgba(253,28,0,.3)'   },
    dark:   { fg: '#7B2FBE', bg: 'rgba(123,47,190,.1)',  bd: 'rgba(123,47,190,.3)' },
    moon:   { fg: '#3b82f6', bg: 'rgba(59,130,246,.1)',  bd: 'rgba(59,130,246,.3)' },
  }

  const filteredTeams = filterMode === 'all'
    ? teams
    : teams.map(t => ({ ...t, today_present: t.mode_breakdown[filterMode] || 0, today_absent: t.total_members - (t.mode_breakdown[filterMode] || 0) }))

  return (
    <div className="ma-wrap">
      <style>{`
        .ma-wrap{animation:maIn .5s ease both;font-family:'DM Sans',sans-serif}
        @keyframes maIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        /* Self status hero */
        .ma-self{display:flex;align-items:center;gap:18px;padding:20px 24px;border-radius:16px;background:linear-gradient(135deg,rgba(12,8,18,.7),rgba(26,10,31,.6));border:1px solid rgba(255,255,255,.08);margin-bottom:18px;flex-wrap:wrap}
        .ma-self-photo{width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid rgba(238,167,39,.3);background:linear-gradient(135deg,#1a1a1a,#0a0a0a)}
        .ma-self-photo img{width:100%;height:100%;object-fit:cover}
        .ma-self-photo-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Astro',sans-serif;font-size:1.2rem;font-weight:800;color:#EEA727}
        .ma-self-info{flex:1;min-width:200px}
        .ma-self-label{font-size:.55rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:3px}
        .ma-self-name{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.05rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase;line-height:1.2;margin-bottom:6px}
        .ma-self-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:.7rem;color:rgba(255,255,255,.45)}
        .ma-self-status{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0}
        .ma-self-pill{display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:11px;border:1px solid;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.78rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
        .ma-self-pill.present{background:rgba(74,222,128,.08);color:#4ade80;border-color:rgba(74,222,128,.3);box-shadow:0 0 14px rgba(74,222,128,.15)}
        .ma-self-pill.absent{background:rgba(253,28,0,.08);color:#fd1c00;border-color:rgba(253,28,0,.3);box-shadow:0 0 14px rgba(253,28,0,.15);animation:maPulse 2s ease-in-out infinite}
        @keyframes maPulse{0%,100%{box-shadow:0 0 14px rgba(253,28,0,.15)}50%{box-shadow:0 0 22px rgba(253,28,0,.35)}}
        .ma-self-modes{display:flex;gap:5px}
        .ma-mode-dot-sm{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.1)}
        .ma-mode-dot-sm.on{box-shadow:0 0 8px currentColor}

        /* Combined stats grid */
        .ma-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:18px}
        .ma-stat{padding:16px 18px;border-radius:13px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
        .ma-stat-lb{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px}
        .ma-stat-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:1px;line-height:1}
        .ma-stat-sub{font-size:.62rem;color:rgba(255,255,255,.35);margin-top:5px}
        .ma-stat-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:10px}
        .ma-stat-bar-fill{height:100%;border-radius:3px;transition:width .6s}

        /* Mode filter pills */
        .ma-filters{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
        .ma-filter-lb{font-size:.6rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-right:6px}
        .ma-filter-pill{padding:7px 14px;border-radius:8px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.5);font-size:.7rem;font-weight:600;cursor:pointer;transition:all .25s;font-family:'DM Sans',sans-serif;text-transform:uppercase;letter-spacing:.8px}
        .ma-filter-pill:hover{color:#fff;border-color:rgba(255,255,255,.15)}
        .ma-filter-pill.active{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08));color:#fff;border-color:rgba(253,28,0,.3)}
        .ma-filter-pill.active.mode-light{background:rgba(238,167,39,.15);color:#EEA727;border-color:rgba(238,167,39,.4)}
        .ma-filter-pill.active.mode-bright{background:rgba(253,28,0,.15);color:#fd1c00;border-color:rgba(253,28,0,.4)}
        .ma-filter-pill.active.mode-dark{background:rgba(123,47,190,.15);color:#a78bfa;border-color:rgba(123,47,190,.4)}
        .ma-filter-pill.active.mode-moon{background:rgba(59,130,246,.15);color:#60a5fa;border-color:rgba(59,130,246,.4)}

        /* Team cards */
        .ma-section-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:8px}
        .ma-section-title::before{content:'';width:3px;height:14px;background:linear-gradient(180deg,#fd1c00,#faa000);border-radius:2px;box-shadow:0 0 10px rgba(253,28,0,.5)}

        .ma-team{border-radius:13px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06);overflow:hidden;margin-bottom:10px;transition:all .35s}
        .ma-team:hover{border-color:rgba(255,255,255,.1)}
        .ma-team.expanded{border-color:rgba(253,28,0,.2);box-shadow:0 4px 20px rgba(253,28,0,.08)}
        .ma-team-hdr{display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;flex-wrap:wrap}
        .ma-team-num-box{flex-shrink:0;padding:8px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(253,28,0,.12),rgba(238,167,39,.06));border:1px solid rgba(253,28,0,.25);font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.74rem;font-weight:800;color:#fd1c00;letter-spacing:1px}
        .ma-team-info{flex:1;min-width:180px}
        .ma-team-title{font-size:.78rem;font-weight:700;color:#fff;line-height:1.3;margin-bottom:2px}
        .ma-team-tech{font-size:.6rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px}
        .ma-team-counts{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}
        .ma-team-count{display:flex;flex-direction:column;align-items:center;padding:6px 12px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);min-width:48px}
        .ma-team-count.present{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.18)}
        .ma-team-count.absent{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.18)}
        .ma-team-count-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.95rem;font-weight:800;letter-spacing:.5px;line-height:1}
        .ma-team-count-lb{font-size:.5rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:3px}
        .ma-team-pct{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:9px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);min-width:60px}
        .ma-team-pct-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;letter-spacing:.5px}
        .ma-team-pct-lb{font-size:.5rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:2px}
        .ma-team-toggle{flex-shrink:0;width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);transition:all .3s}
        .ma-team.expanded .ma-team-toggle{transform:rotate(180deg);color:#fd1c00;background:rgba(253,28,0,.08);border-color:rgba(253,28,0,.25)}

        /* Team body */
        .ma-team-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s}
        .ma-team.expanded .ma-team-body{grid-template-rows:1fr}
        .ma-team-body-inner{overflow:hidden;min-height:0}
        .ma-team-body-content{padding:0 18px 18px}

        /* Mode breakdown bar */
        .ma-mode-breakdown{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 0;border-top:1px solid rgba(255,255,255,.05)}
        .ma-mb{padding:7px 10px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);text-align:center}
        .ma-mb-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;line-height:1;letter-spacing:.5px}
        .ma-mb-lb{font-size:.5rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:4px}

        /* Member rows */
        .ma-members{display:flex;flex-direction:column;gap:5px;margin-top:10px}
        .ma-member{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
        .ma-member.absent{border-color:rgba(253,28,0,.15);background:rgba(253,28,0,.02)}
        .ma-member-avatar{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,rgba(253,28,0,.2),rgba(238,167,39,.1));display:flex;align-items:center;justify-content:center;font-family:'Astro',sans-serif;font-size:.74rem;font-weight:800;color:#fd1c00;flex-shrink:0}
        .ma-member-info{flex:1;min-width:0}
        .ma-member-name{font-size:.74rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
        .ma-member-roll{font-size:.58rem;color:rgba(255,255,255,.35);font-weight:600;letter-spacing:.5px}
        .ma-member-modes{display:flex;gap:4px;flex-shrink:0}
        .ma-member-pct{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.78rem;font-weight:800;min-width:42px;text-align:right;letter-spacing:.5px;flex-shrink:0}
        .ma-member-status{font-size:.5rem;font-weight:700;padding:2px 8px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0}
        .ma-member-status.present{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.2)}
        .ma-member-status.absent{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.2)}
        .ma-member-absent-info{font-size:.55rem;color:#fd1c00;font-weight:600;margin-top:2px}

        @media(max-width:768px){
          .ma-self{padding:14px 16px}
          .ma-self-name{font-size:.92rem}
          .ma-self-pill{padding:7px 12px;font-size:.7rem}
          .ma-team-hdr{padding:12px 14px;gap:10px}
          .ma-team-counts{display:none}
          .ma-team-pct{padding:5px 10px;min-width:52px}
          .ma-team-num-box{padding:6px 10px;font-size:.68rem}
          .ma-team-title{font-size:.74rem}
          .ma-mode-breakdown{grid-template-columns:repeat(2,1fr)}
          .ma-member{flex-wrap:wrap;gap:8px}
        }
      `}</style>

      {/* Self status */}
      <div className="ma-self">
        <div className="ma-self-photo">
          {me.image_url
            ? <img src={me.image_url} alt={me.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>
            : null}
          <div className="ma-self-photo-fb" style={{display: me.image_url?'none':'flex'}}>
            {(me.name||'?').charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="ma-self-info">
          <div className="ma-self-label">Mentor · Self Attendance</div>
          <div className="ma-self-name">{me.name}</div>
          <div className="ma-self-meta">
            <span>{me.technology}</span>
            <span style={{opacity:.4}}>·</span>
            <span><strong style={{color:'#fff'}}>{me.attendance_pct}%</strong> · 7-day average</span>
          </div>
        </div>
        <div className="ma-self-status">
          <div className={`ma-self-pill ${me.today_present?'present':'absent'}`}>
            {me.today_present
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Present {me.today_count}/4</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Absent</>
            }
          </div>
          <div className="ma-self-modes">
            {['light','bright','dark','moon'].map(m => {
              const on = me.today_modes?.includes(m)
              return <div key={m} className={`ma-mode-dot-sm ${on?'on':''}`} style={{color: MODE_COLORS[m].fg, background: on ? MODE_COLORS[m].fg : 'rgba(255,255,255,.1)'}} title={m}/>
            })}
          </div>
        </div>
      </div>

      {/* Combined stats */}
      <div className="ma-stats">
        <div className="ma-stat">
          <div className="ma-stat-lb">Total Mentees</div>
          <div className="ma-stat-val" style={{color:'#fff'}}>{combined.total_students}</div>
          <div className="ma-stat-sub">Across {teams.length} teams</div>
        </div>
        <div className="ma-stat">
          <div className="ma-stat-lb">Present Today</div>
          <div className="ma-stat-val" style={{color:'#4ade80'}}>{combined.total_present_today}<span style={{fontSize:'.7rem',opacity:.4,marginLeft:4}}>/{combined.total_students}</span></div>
          <div className="ma-stat-bar"><div className="ma-stat-bar-fill" style={{width:`${combined.attendance_pct}%`,background:'linear-gradient(90deg,#4ade80,#22c55e)'}}/></div>
        </div>
        <div className="ma-stat">
          <div className="ma-stat-lb">Absent Today</div>
          <div className="ma-stat-val" style={{color:'#fd1c00'}}>{combined.total_absent_today}</div>
          <div className="ma-stat-sub">Need follow-up</div>
        </div>
        <div className="ma-stat">
          <div className="ma-stat-lb">Mentorship Score</div>
          <div className="ma-stat-val" style={{color: combined.attendance_pct>=75?'#4ade80':combined.attendance_pct>=50?'#EEA727':'#fd1c00'}}>{combined.attendance_pct}%</div>
          <div className="ma-stat-sub">Today's mentee turnout</div>
        </div>
      </div>

      {/* Mode filter */}
      <div className="ma-filters">
        <span className="ma-filter-lb">View by Mode</span>
        <button className={`ma-filter-pill ${filterMode==='all'?'active':''}`} onClick={()=>setFilterMode('all')}>All</button>
        {['light','bright','dark','moon'].map(m => (
          <button key={m} className={`ma-filter-pill mode-${m} ${filterMode===m?'active':''}`} onClick={()=>setFilterMode(m)}>
            {modes_meta[m].label} <span style={{opacity:.5,marginLeft:4}}>{combined.mode_breakdown[m]}</span>
          </button>
        ))}
      </div>

      {/* Teams */}
      <div className="ma-section-title">Teams ({teams.length})</div>
      {filteredTeams.map(team => {
        const isExpanded = expandedTeam === team.team_number
        return (
          <div key={team.team_number} className={`ma-team ${isExpanded?'expanded':''}`}>
            <div className="ma-team-hdr" onClick={()=>setExpandedTeam(isExpanded?null:team.team_number)}>
              <div className="ma-team-num-box">{team.team_number}</div>
              <div className="ma-team-info">
                <div className="ma-team-title">{team.project_title || 'Untitled Project'}</div>
                <div className="ma-team-tech">{team.technology} · {team.total_members} members</div>
              </div>
              <div className="ma-team-counts">
                <div className="ma-team-count present">
                  <div className="ma-team-count-num" style={{color:'#4ade80'}}>{team.today_present}</div>
                  <div className="ma-team-count-lb">Present</div>
                </div>
                <div className="ma-team-count absent">
                  <div className="ma-team-count-num" style={{color:'#fd1c00'}}>{team.today_absent}</div>
                  <div className="ma-team-count-lb">Absent</div>
                </div>
              </div>
              <div className="ma-team-pct">
                <div className="ma-team-pct-num" style={{color: team.today_pct>=75?'#4ade80':team.today_pct>=50?'#EEA727':'#fd1c00'}}>{team.today_pct}%</div>
                <div className="ma-team-pct-lb">Today</div>
              </div>
              <div className="ma-team-toggle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>

            <div className="ma-team-body">
              <div className="ma-team-body-inner">
                <div className="ma-team-body-content">
                  <div className="ma-mode-breakdown">
                    {['light','bright','dark','moon'].map(m => (
                      <div key={m} className="ma-mb" style={{borderColor: MODE_COLORS[m].bd}}>
                        <div className="ma-mb-num" style={{color: MODE_COLORS[m].fg}}>{team.mode_breakdown[m] || 0}<span style={{fontSize:'.55rem',opacity:.4,marginLeft:3}}>/{team.total_members}</span></div>
                        <div className="ma-mb-lb">{modes_meta[m].label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="ma-members">
                    {team.members.map(mem => (
                      <div key={mem.roll_number} className={`ma-member ${!mem.today_present?'absent':''}`}>
                        <div className="ma-member-avatar">{(mem.name||'?').charAt(0).toUpperCase()}</div>
                        <div className="ma-member-info">
                          <div className="ma-member-name">{mem.name} {mem.is_leader && <span style={{color:'#EEA727',marginLeft:4}}>★</span>}</div>
                          <div className="ma-member-roll">{mem.roll_number}</div>
                          {!mem.today_present && mem.absent_days.length > 1 && (
                            <div className="ma-member-absent-info">⚠ Absent {mem.absent_days.length} day{mem.absent_days.length>1?'s':''} (incl. today)</div>
                          )}
                        </div>
                        <div className="ma-member-modes">
                          {['light','bright','dark','moon'].map(m => {
                            const on = mem.today_modes.includes(m)
                            return <div key={m} className="ma-mode-dot-sm" style={{color: MODE_COLORS[m].fg, background: on ? MODE_COLORS[m].fg : 'rgba(255,255,255,.1)', boxShadow: on ? `0 0 6px ${MODE_COLORS[m].fg}` : 'none'}} title={`${m}: ${on?'present':'missed'}`}/>
                          })}
                        </div>
                        <div className="ma-member-pct" style={{color: mem.attendance_pct>=75?'#4ade80':mem.attendance_pct>=50?'#EEA727':'#fd1c00'}}>{mem.attendance_pct}%</div>
                        <span className={`ma-member-status ${mem.today_present?'present':'absent'}`}>{mem.today_present?`${mem.today_count}/4`:'Absent'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}