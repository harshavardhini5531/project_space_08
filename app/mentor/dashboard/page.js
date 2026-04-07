'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MentorDashboard() {
  const router = useRouter()
  const [mentor, setMentor] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('overview')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Set password states
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth < 900)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('mentor_token')
    const saved = sessionStorage.getItem('mentor_data')
    if (!token || !saved) { router.push('/mentor'); return }
    const m = JSON.parse(saved)
    setMentor(m)
    fetchDashboard(m.email, token)
  }, [])

  async function fetchDashboard(email, token) {
    setLoading(true)
    try {
      const t = token || sessionStorage.getItem('mentor_token')
      const r = await fetch('/api/mentor/dashboard', { method:'POST', headers:{'Content-Type':'application/json','x-mentor-token':t}, body:JSON.stringify({mentorEmail:email||mentor?.email}) })
      const d = await r.json()
      if (!r.ok) { router.push('/mentor'); return }
      setData(d)
    } catch { } finally { setLoading(false) }
  }

  async function handleSetPassword() {
    if (!newPass || newPass.length < 6) { setPassMsg('Password must be at least 6 characters'); return }
    setPassLoading(true); setPassMsg('')
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'set-password', email:mentor?.email, newPassword:newPass}) })
      const d = await r.json()
      if (r.ok) { setPassMsg('Password set successfully!'); setNewPass(''); const m = {...mentor, hasPassword:true}; setMentor(m); sessionStorage.setItem('mentor_data',JSON.stringify(m)) }
      else setPassMsg(d.error)
    } catch { setPassMsg('Failed') } finally { setPassLoading(false) }
  }

  function handleLogout() { sessionStorage.removeItem('mentor_token'); sessionStorage.removeItem('mentor_data'); router.push('/mentor') }

  const techColors = {'Data Specialist':'#3b82f6','AWS Development':'#f59e0b','Full Stack':'#10b981','Google Flutter':'#06b6d4','ServiceNow':'#8b5cf6','VLSI':'#ef4444'}

  const navItems = [
    {id:'overview', label:'Overview', icon:'📊'},
    {id:'registered', label:'Registered Teams', icon:'✅'},
    {id:'pending', label:'Pending Teams', icon:'⏳'},
    {id:'allteams', label:'All Teams', icon:'👥'},
    {id:'settings', label:'Settings', icon:'⚙️'},
  ]

  const registeredTeams = data?.teams?.filter(t => t.registered) || []
  const pendingTeams = data?.teams?.filter(t => !t.registered) || []
  const allTeams = data?.teams || []
  const stats = data?.stats || {}

  const TeamCard = ({t, showDetails = false}) => (
    <div style={{background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.04)',borderRadius:'16px',padding:'20px',marginBottom:'12px',cursor:'pointer',transition:'all .2s',borderLeftWidth:'3px',borderLeftColor:t.registered?'#4ade80':'#EEA727'}} onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:'.92rem',fontWeight:600,color:'#fff'}}>{t.projectTitle || 'Untitled Project'}</div>
          <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.35)',marginTop:'4px'}}>#{t.serialNumber} {t.teamNumber ? `· ${t.teamNumber}` : ''} · {t.memberCount} members</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <span style={{fontSize:'.68rem',padding:'4px 12px',borderRadius:'8px',fontWeight:500,background:t.registered?'rgba(74,222,128,.08)':'rgba(238,167,39,.08)',color:t.registered?'#4ade80':'#EEA727',border:`1px solid ${t.registered?'rgba(74,222,128,.15)':'rgba(238,167,39,.15)'}`}}>{t.registered?'Registered':'Pending'}</span>
          <span style={{fontSize:'.72rem',color:'rgba(255,255,255,.3)'}}>{expandedTeam===t.serialNumber?'▲':'▼'}</span>
        </div>
      </div>

      {/* Leader info */}
      <div style={{marginTop:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
        <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'linear-gradient(135deg,#fd1c00,#faa000)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,color:'#fff'}}>{t.leaderName?.charAt(0)||'L'}</div>
        <span style={{fontSize:'.76rem',color:'rgba(255,255,255,.6)'}}>{t.leaderName}</span>
        <span style={{fontSize:'.65rem',color:'rgba(255,255,255,.25)'}}>({t.leaderRoll})</span>
      </div>

      {/* Expanded details */}
      {expandedTeam === t.serialNumber && (
        <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1px solid rgba(255,255,255,.04)'}}>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
            {t.projectDescription && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Description</div><div style={{fontSize:'.76rem',color:'rgba(255,255,255,.6)',lineHeight:1.5}}>{t.projectDescription}</div></div>}
            {t.problemStatement && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Problem Statement</div><div style={{fontSize:'.76rem',color:'rgba(255,255,255,.6)',lineHeight:1.5}}>{t.problemStatement}</div></div>}
            {t.projectArea?.length > 0 && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Project Area</div><div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{t.projectArea.map(a=><span key={a} style={{fontSize:'.68rem',padding:'3px 8px',borderRadius:'6px',background:'rgba(59,130,246,.08)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.15)'}}>{a}</span>)}</div></div>}
            {t.techStack?.length > 0 && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Tech Stack</div><div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{t.techStack.map(s=><span key={s} style={{fontSize:'.68rem',padding:'3px 8px',borderRadius:'6px',background:'rgba(16,185,129,.08)',color:'#10b981',border:'1px solid rgba(16,185,129,.15)'}}>{s}</span>)}</div></div>}
            {t.aiUsage === 'Yes' && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>AI Usage</div><div style={{fontSize:'.76rem',color:'rgba(255,255,255,.6)'}}>{t.aiCapabilities || 'Yes'}</div>{t.aiTools?.length > 0 && <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginTop:'6px'}}>{t.aiTools.map(a=><span key={a} style={{fontSize:'.65rem',padding:'2px 7px',borderRadius:'5px',background:'rgba(242,29,50,.06)',color:'#f21d32',border:'1px solid rgba(242,29,50,.12)'}}>{a}</span>)}</div>}</div>}
            {t.registeredAt && <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'4px'}}>Registered</div><div style={{fontSize:'.76rem',color:'rgba(255,255,255,.6)'}}>{new Date(t.registeredAt).toLocaleString('en-IN')}</div></div>}
          </div>

          {/* Members */}
          <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Team Members ({t.memberCount})</div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:'8px'}}>
            {t.members?.map(m => (
              <div key={m.rollNumber} style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.03)',display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'50%',background:m.isLeader?'linear-gradient(135deg,#fd1c00,#faa000)':'rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:'#fff',flexShrink:0}}>{m.name?.charAt(0)||'?'}</div>
                <div>
                  <div style={{fontSize:'.76rem',color:'rgba(255,255,255,.75)',fontWeight:m.isLeader?600:400}}>{m.name} {m.isLeader && '★'}</div>
                  <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.25)'}}>{m.rollNumber}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:hidden}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.md-layout{display:flex;height:100vh}

/* Sidebar */
.md-sb{width:260px;height:100vh;background:rgba(8,4,14,.95);border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;flex-shrink:0;position:relative;z-index:50;transition:transform .3s ease}
.md-sb-hdr{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.04)}
.md-sb-logo{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.md-sb-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.md-sb-title{font-family:'Orbitron',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.8)}
.md-sb-sub{font-size:.6rem;color:rgba(255,255,255,.3);margin-top:2px}
.md-sb-mentor{padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.md-sb-mname{font-size:.82rem;font-weight:600;color:#fff}
.md-sb-mtech{font-size:.68rem;color:rgba(255,255,255,.35);margin-top:2px}

.md-sb-nav{flex:1;padding:16px 12px;overflow-y:auto}
.md-sb-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;font-size:.8rem;color:rgba(255,255,255,.45);cursor:pointer;transition:all .2s;margin-bottom:4px;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
.md-sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.md-sb-item.on{color:#fff;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.1)}
.md-sb-item .icon{font-size:1rem;width:24px;text-align:center}

.md-sb-footer{padding:16px 12px;border-top:1px solid rgba(255,255,255,.04)}
.md-sb-logout{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-size:.78rem;color:rgba(255,255,255,.35);cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif;transition:all .2s}
.md-sb-logout:hover{color:#ff6040;background:rgba(255,40,0,.04)}

/* Main content */
.md-main{flex:1;height:100vh;overflow-y:auto;padding:28px;background:#050008}
.md-main::-webkit-scrollbar{width:6px}
.md-main::-webkit-scrollbar-track{background:transparent}
.md-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}

.md-page-title{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:4px}
.md-page-sub{font-size:.78rem;color:rgba(255,255,255,.35);margin-bottom:24px}

/* Stats */
.md-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.md-stat{padding:20px 18px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:fadeUp .4s ease both}
.md-stat-val{font-size:1.8rem;font-weight:800;line-height:1}
.md-stat-label{font-size:.65rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;margin-top:6px}

/* Progress */
.md-prog{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:28px}
.md-prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.md-prog-title{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.6)}
.md-prog-pct{font-size:1rem;font-weight:800;color:#fd1c00}
.md-prog-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.md-prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s ease}

/* Mobile */
.md-mobile-hdr{display:none;position:sticky;top:0;z-index:100;padding:12px 16px;background:rgba(5,0,8,.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.04);align-items:center;justify-content:space-between}
.md-hamburger{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px 8px}
.md-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}

/* Settings */
.md-settings-card{max-width:500px;padding:24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.md-set-title{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:6px}
.md-set-desc{font-size:.74rem;color:rgba(255,255,255,.35);margin-bottom:16px}
.md-set-input{width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#fff;font-size:.85rem;outline:none;font-family:'DM Sans',sans-serif;margin-bottom:10px}
.md-set-btn{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#fd3a20);border:none;color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.md-set-btn:disabled{opacity:.5;cursor:not-allowed}
.md-set-msg{margin-top:10px;font-size:.76rem;padding:8px 12px;border-radius:8px}

@media(max-width:900px){
  .md-sb{position:fixed;left:0;top:0;transform:translateX(-100%);z-index:60}
  .md-sb.open{transform:translateX(0)}
  .md-mobile-hdr{display:flex}
  .md-overlay.show{display:block}
  .md-main{padding:16px}
  .md-stats{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:480px){
  .md-stats{grid-template-columns:1fr}
}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div className="md-layout">
        {/* Mobile header */}
        <div className="md-mobile-hdr">
          <button className="md-hamburger" onClick={()=>setSidebarOpen(true)}>☰</button>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'.7rem',fontWeight:700,letterSpacing:'2px'}}>MENTOR PANEL</div>
          <button className="md-hamburger" onClick={handleLogout}>↪</button>
        </div>

        {/* Overlay */}
        <div className={`md-overlay ${sidebarOpen?'show':''}`} onClick={()=>setSidebarOpen(false)}/>

        {/* Sidebar */}
        <div className={`md-sb ${sidebarOpen?'open':''}`}>
          <div className="md-sb-hdr">
            <div className="md-sb-logo">
              <div className="md-sb-icon">PS</div>
              <div><div className="md-sb-title">MENTOR PANEL</div><div className="md-sb-sub">Project Space 2026</div></div>
            </div>
            {mentor && (
              <div className="md-sb-mentor">
                <div className="md-sb-mname">{mentor.name}</div>
                <div className="md-sb-mtech">{mentor.technology}</div>
              </div>
            )}
          </div>
          <div className="md-sb-nav">
            {navItems.map(n => (
              <button key={n.id} className={`md-sb-item ${activePage===n.id?'on':''}`} onClick={()=>{setActivePage(n.id);setSidebarOpen(false)}}>
                <span className="icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
          <div className="md-sb-footer">
            <button className="md-sb-logout" onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {/* Main content */}
        <div className="md-main">
          {loading && <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading dashboard...</div>}

          {!loading && data && (<>

            {/* ── OVERVIEW ── */}
            {activePage === 'overview' && (<>
              <div className="md-page-title">OVERVIEW</div>
              <div className="md-page-sub">Your team registration progress</div>

              <div className="md-stats">
                <div className="md-stat"><div className="md-stat-val" style={{color:'#fd1c00'}}>{stats.totalTeams}</div><div className="md-stat-label">Total Teams</div></div>
                <div className="md-stat" style={{animationDelay:'.1s'}}><div className="md-stat-val" style={{color:'#4ade80'}}>{stats.registeredCount}</div><div className="md-stat-label">Registered</div></div>
                <div className="md-stat" style={{animationDelay:'.2s'}}><div className="md-stat-val" style={{color:'#EEA727'}}>{stats.pendingCount}</div><div className="md-stat-label">Pending</div></div>
                <div className="md-stat" style={{animationDelay:'.3s'}}><div className="md-stat-val" style={{color:'#3b82f6'}}>{stats.totalMembers}</div><div className="md-stat-label">Total Members</div></div>
              </div>

              <div className="md-prog">
                <div className="md-prog-hdr"><span className="md-prog-title">Registration Progress</span><span className="md-prog-pct">{stats.progressPercent}%</span></div>
                <div className="md-prog-bar"><div className="md-prog-fill" style={{width:`${stats.progressPercent}%`}}/></div>
              </div>

              {/* Quick team list */}
              <div style={{fontSize:'.82rem',fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:'12px'}}>Your Teams</div>
              {allTeams.map(t => <TeamCard key={t.serialNumber} t={t} />)}
            </>)}

            {/* ── REGISTERED ── */}
            {activePage === 'registered' && (<>
              <div className="md-page-title">REGISTERED TEAMS</div>
              <div className="md-page-sub">{registeredTeams.length} teams have completed registration</div>
              {registeredTeams.length === 0 && <div style={{padding:'40px',textAlign:'center',color:'rgba(255,255,255,.2)',fontSize:'.82rem'}}>No teams registered yet</div>}
              {registeredTeams.map(t => <TeamCard key={t.serialNumber} t={t} showDetails />)}
            </>)}

            {/* ── PENDING ── */}
            {activePage === 'pending' && (<>
              <div className="md-page-title">PENDING TEAMS</div>
              <div className="md-page-sub">{pendingTeams.length} teams haven't registered yet</div>
              {pendingTeams.length === 0 && <div style={{padding:'40px',textAlign:'center',color:'#4ade80',fontSize:'.88rem',fontWeight:600}}>🎉 All teams registered!</div>}
              {pendingTeams.map(t => <TeamCard key={t.serialNumber} t={t} />)}
            </>)}

            {/* ── ALL TEAMS ── */}
            {activePage === 'allteams' && (<>
              <div className="md-page-title">ALL TEAMS</div>
              <div className="md-page-sub">{allTeams.length} teams assigned to you</div>
              {allTeams.map(t => <TeamCard key={t.serialNumber} t={t} showDetails />)}
            </>)}

            {/* ── SETTINGS ── */}
            {activePage === 'settings' && (<>
              <div className="md-page-title">SETTINGS</div>
              <div className="md-page-sub">Manage your account</div>

              <div className="md-settings-card" style={{marginBottom:'16px'}}>
                <div className="md-set-title">Profile</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
                  <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'3px'}}>Name</div><div style={{fontSize:'.82rem',color:'#fff'}}>{mentor?.name}</div></div>
                  <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'3px'}}>Email</div><div style={{fontSize:'.82rem',color:'#fff'}}>{mentor?.email}</div></div>
                  <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'3px'}}>Technology</div><div style={{fontSize:'.82rem',color:'#fff'}}>{mentor?.technology}</div></div>
                  <div style={{padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,.02)'}}><div style={{fontSize:'.6rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'3px'}}>Password</div><div style={{fontSize:'.82rem',color:mentor?.hasPassword?'#4ade80':'#EEA727'}}>{mentor?.hasPassword?'Set ✓':'Not set'}</div></div>
                </div>
              </div>

              <div className="md-settings-card">
                <div className="md-set-title">{mentor?.hasPassword ? 'Change Password' : 'Set Password'}</div>
                <div className="md-set-desc">{mentor?.hasPassword ? 'Update your login password' : 'Set a password so you can login without OTP next time'}</div>
                <input className="md-set-input" type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e=>setNewPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSetPassword()} />
                <button className="md-set-btn" onClick={handleSetPassword} disabled={passLoading||!newPass}>{passLoading?'Saving...':'Set Password'}</button>
                {passMsg && <div className="md-set-msg" style={{background:passMsg.includes('success')?'rgba(74,222,128,.06)':'rgba(255,40,0,.06)',color:passMsg.includes('success')?'#4ade80':'#ff6040'}}>{passMsg}</div>}
              </div>
            </>)}

          </>)}
        </div>
      </div>
    </>
  )
}