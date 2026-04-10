'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── LINE SVG ICONS ──
const I = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  code: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.77 1.05 1.39 1.22l.12.03H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

export default function MentorDashboard() {
  const router = useRouter()
  const [mentor, setMentor] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('overview')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => { const c=()=>setIsMobile(window.innerWidth<900); c(); window.addEventListener('resize',c); return ()=>window.removeEventListener('resize',c) }, [])

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
    } catch {} finally { setLoading(false) }
  }

  async function handleSetPassword() {
    if (!newPass || newPass.length < 6) { setPassMsg('Min 6 characters'); return }
    setPassLoading(true); setPassMsg('')
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'set-password', email:mentor?.email, newPassword:newPass, confirmPassword:newPass}) })
      const d = await r.json()
      if (r.ok) { setPassMsg('Password set!'); setNewPass(''); const m={...mentor,hasPassword:true}; setMentor(m); sessionStorage.setItem('mentor_data',JSON.stringify(m)) }
      else setPassMsg(d.error)
    } catch { setPassMsg('Failed') } finally { setPassLoading(false) }
  }

  function handleLogout() { sessionStorage.removeItem('mentor_token'); sessionStorage.removeItem('mentor_data'); router.push('/mentor') }

  const glowColors = { 'Data Specialist':'59,130,246', 'AWS Development':'245,158,11', 'Full Stack':'16,185,129', 'Google Flutter':'6,182,212', 'ServiceNow':'139,92,246', 'VLSI':'239,68,68' }
  const solidColors = { 'Data Specialist':'#3b82f6', 'AWS Development':'#f59e0b', 'Full Stack':'#10b981', 'Google Flutter':'#06b6d4', 'ServiceNow':'#8b5cf6', 'VLSI':'#ef4444' }

  const navItems = [
    {id:'overview', label:'Overview', icon:I.grid},
    {id:'registered', label:'Registered', icon:I.check},
    {id:'pending', label:'Pending', icon:I.clock},
    {id:'techprojects', label:`${mentor?.technology || 'Tech'} Projects`, icon:I.code},
    {id:'allteams', label:'All My Teams', icon:I.users},
    {id:'settings', label:'Settings', icon:I.settings},
  ]

  const myTeams = data?.teams || []
  const registeredTeams = myTeams.filter(t => t.registered)
  const pendingTeams = myTeams.filter(t => !t.registered)
  const techProjects = data?.techProjects || {}
  const stats = data?.stats || {}

  // ── TEAM CARD with glow ──
  const TeamCard = ({t}) => {
    const glow = glowColors[t.technology] || '255,255,255'
    const color = solidColors[t.technology] || '#888'
    return (
      <div className={`tc ${expandedTeam===t.serialNumber?'tc-exp':''}`} style={{'--glow':glow,'--color':color}} onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>
        <div className="tc-hdr">
          <div className="tc-info">
            <div className="tc-title">{t.projectTitle || 'Untitled Project'}</div>
            <div className="tc-meta">#{t.serialNumber} {t.teamNumber ? `· ${t.teamNumber}` : ''} · {t.memberCount} members {t.mentorAssigned ? `· ${t.mentorAssigned}` : ''}</div>
          </div>
          <div className="tc-right">
            <span className={`tc-badge ${t.registered?'reg':'pen'}`}>{t.registered?'Registered':'Pending'}</span>
            <span className="tc-arrow">{expandedTeam===t.serialNumber?'▲':'▼'}</span>
          </div>
        </div>

        {/* Leader with phone */}
        <div className="tc-leader">
          <div className="tc-avatar" style={{background:`linear-gradient(135deg,rgba(${glow},.3),rgba(${glow},.1))`}}>{t.leaderName?.charAt(0)||'L'}</div>
          <div className="tc-leader-info">
            <span className="tc-leader-name">{t.leaderName} {I.star}</span>
            <span className="tc-leader-roll">{t.leaderRoll}</span>
          </div>
          <div className="tc-contact">
            {t.leaderPhone && t.leaderPhone.length >= 10 && <a href={`tel:${t.leaderPhone}`} className="tc-phone" title={t.leaderPhone}>{I.phone}<span style={{marginLeft:'4px'}}>{t.leaderPhone}</span></a>}
            {t.leaderEmail && <a href={`mailto:${t.leaderEmail}`} className="tc-email">{I.mail}</a>}
          </div>
        </div>

        {/* Expanded */}
        {expandedTeam===t.serialNumber && (
          <div className="tc-details">
            <div className="tc-grid">
              {t.projectDescription && <div className="tc-box"><div className="tc-box-l">Description</div><div className="tc-box-v">{t.projectDescription}</div></div>}
              {t.problemStatement && <div className="tc-box"><div className="tc-box-l">Problem Statement</div><div className="tc-box-v">{t.problemStatement}</div></div>}
              {t.projectArea?.length>0 && <div className="tc-box"><div className="tc-box-l">Project Area</div><div className="tc-tags">{t.projectArea.map(a=><span key={a} className="tc-tag" style={{color,borderColor:`rgba(${glow},.2)`,background:`rgba(${glow},.06)`}}>{a}</span>)}</div></div>}
              {t.techStack?.length>0 && <div className="tc-box"><div className="tc-box-l">Tech Stack</div><div className="tc-tags">{t.techStack.map(s=><span key={s} className="tc-tag" style={{color:'#10b981',borderColor:'rgba(16,185,129,.2)',background:'rgba(16,185,129,.06)'}}>{s}</span>)}</div></div>}
              {t.aiUsage==='Yes' && <div className="tc-box"><div className="tc-box-l">AI Usage</div><div className="tc-box-v">{t.aiCapabilities||'Yes'}</div>{t.aiTools?.length>0 && <div className="tc-tags" style={{marginTop:'6px'}}>{t.aiTools.map(a=><span key={a} className="tc-tag" style={{color:'#f21d32',borderColor:'rgba(242,29,50,.15)',background:'rgba(242,29,50,.06)'}}>{a}</span>)}</div>}</div>}
              {t.registeredAt && <div className="tc-box"><div className="tc-box-l">Registered</div><div className="tc-box-v">{new Date(t.registeredAt).toLocaleString('en-IN')}</div></div>}
            </div>
            <div className="tc-box" style={{marginTop:'10px'}}><div className="tc-box-l">Members ({t.memberCount})</div>
              <div className="tc-members">{t.members?.map(m=>(
                <div key={m.rollNumber} className="tc-member">
                  <div className="tc-m-avatar" style={{background:m.isLeader?`linear-gradient(135deg,rgba(${glow},.4),rgba(${glow},.15))`:'rgba(255,255,255,.04)'}}>{m.name?.charAt(0)||'?'}</div>
                  <div className="tc-m-info"><div className="tc-m-name">{m.name} {m.isLeader && '★'}</div><div className="tc-m-roll">{m.rollNumber}</div></div>
                  {m.phone && m.phone.length >= 10 && <a href={`tel:${m.phone}`} className="tc-m-phone" title={m.phone}>{I.phone}</a>}
                </div>
              ))}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:hidden}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 15px rgba(var(--glow),.08),inset 0 0 15px rgba(var(--glow),.03)}50%{box-shadow:0 0 25px rgba(var(--glow),.15),inset 0 0 20px rgba(var(--glow),.06)}}

.md-layout{display:flex;height:100vh}

.md-sb{width:260px;height:100vh;background:rgba(8,4,14,.95);border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;flex-shrink:0;z-index:50;transition:transform .3s}
.md-sb-hdr{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.04)}
.md-sb-logo{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.md-sb-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.md-sb-title{font-family:'Orbitron',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.8)}
.md-sb-sub{font-size:.6rem;color:rgba(255,255,255,.3);margin-top:2px}
.md-sb-mentor{padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.md-sb-mname{font-size:.82rem;font-weight:600;color:#fff}
.md-sb-mtech{font-size:.68rem;color:rgba(255,255,255,.35);margin-top:2px}
.md-sb-nav{flex:1;padding:16px 12px;overflow-y:auto}
.md-sb-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;font-size:.78rem;color:rgba(255,255,255,.55);cursor:pointer;transition:all .2s;margin-bottom:4px;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
.md-sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.md-sb-item.on{color:#fd1c00;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.12)}
.md-sb-item svg{flex-shrink:0}
.md-sb-footer{padding:16px 12px;border-top:1px solid rgba(255,255,255,.04)}
.md-sb-logout{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-size:.78rem;color:rgba(255,255,255,.35);cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif;transition:all .2s}
.md-sb-logout:hover{color:#ff6040;background:rgba(255,40,0,.04)}

.md-main{flex:1;height:100vh;overflow-y:auto;padding:28px;background:#050008}
.md-main::-webkit-scrollbar{width:6px}
.md-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}
.md-page-title{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:4px}
.md-page-sub{font-size:.78rem;color:rgba(255,255,255,.35);margin-bottom:24px}

/* Stat cards with glow */
.md-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.md-stat{padding:20px 18px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:fadeUp .4s ease both;position:relative;overflow:hidden}
.md-stat::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(var(--glow),.04) 0%,transparent 70%);pointer-events:none}
.md-stat-val{font-size:1.8rem;font-weight:800;line-height:1;position:relative}
.md-stat-label{font-size:.65rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;margin-top:6px;position:relative}

.md-prog{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:28px}
.md-prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.md-prog-title{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.6)}
.md-prog-pct{font-size:1rem;font-weight:800;color:#fd1c00}
.md-prog-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.md-prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s ease}

/* Team cards with glow rectangles */
.tc{border-radius:16px;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.04);padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;animation:fadeUp .4s ease both}
.tc::before{content:'';position:absolute;inset:0;border-radius:16px;opacity:0;transition:opacity .3s;box-shadow:0 0 20px rgba(var(--glow),.1),inset 0 0 20px rgba(var(--glow),.03)}
.tc:hover::before{opacity:1}
.tc:hover{border-color:rgba(var(--glow),.15)}
.tc-exp{border-color:rgba(var(--glow),.2)!important}
.tc-exp::before{opacity:1;animation:glowPulse 3s ease-in-out infinite}
.tc-hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.tc-title{font-size:.9rem;font-weight:600;color:#fff}
.tc-meta{font-size:.68rem;color:rgba(255,255,255,.3);margin-top:4px}
.tc-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.tc-badge{font-size:.65rem;padding:4px 12px;border-radius:8px;font-weight:500}
.tc-badge.reg{background:rgba(74,222,128,.06);color:#4ade80;border:1px solid rgba(74,222,128,.12)}
.tc-badge.pen{background:rgba(238,167,39,.06);color:#EEA727;border:1px solid rgba(238,167,39,.12)}
.tc-arrow{font-size:.7rem;color:rgba(255,255,255,.25)}
.tc-leader{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.03)}
.tc-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0}
.tc-leader-info{flex:1;min-width:0}
.tc-leader-name{font-size:.76rem;font-weight:500;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:4px}
.tc-leader-roll{font-size:.62rem;color:rgba(255,255,255,.25);display:block}
.tc-contact{display:flex;align-items:center;gap:8px;flex-shrink:0}
.tc-phone{display:flex;align-items:center;gap:4px;font-size:.68rem;color:#4ade80;text-decoration:none;padding:4px 10px;border-radius:8px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.1);transition:all .2s}
.tc-phone:hover{background:rgba(74,222,128,.12)}
.tc-email{display:flex;align-items:center;padding:4px 8px;border-radius:8px;color:rgba(255,255,255,.4);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);text-decoration:none;transition:all .2s}
.tc-email:hover{color:#3b82f6;background:rgba(59,130,246,.06)}

.tc-details{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.04)}
.tc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tc-box{padding:12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03)}
.tc-box-l{font-size:.58rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.tc-box-v{font-size:.74rem;color:rgba(255,255,255,.6);line-height:1.5}
.tc-tags{display:flex;flex-wrap:wrap;gap:4px}
.tc-tag{font-size:.65rem;padding:3px 8px;border-radius:6px;border:1px solid}
.tc-members{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-top:8px}
.tc-member{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.03)}
.tc-m-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0}
.tc-m-info{flex:1;min-width:0}
.tc-m-name{font-size:.74rem;color:rgba(255,255,255,.7)}
.tc-m-roll{font-size:.6rem;color:rgba(255,255,255,.2)}
.tc-m-phone{color:rgba(255,255,255,.3);padding:4px;border-radius:6px;transition:all .2s;text-decoration:none}
.tc-m-phone:hover{color:#4ade80;background:rgba(74,222,128,.06)}

.md-settings-card{max-width:500px;padding:24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:16px}
.md-set-title{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:6px}
.md-set-desc{font-size:.74rem;color:rgba(255,255,255,.35);margin-bottom:16px}
.md-set-input{width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#fff;font-size:.85rem;outline:none;font-family:'DM Sans',sans-serif;margin-bottom:10px}
.md-set-btn{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#fd3a20);border:none;color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.md-set-btn:disabled{opacity:.5}
.md-set-msg{margin-top:10px;font-size:.76rem;padding:8px 12px;border-radius:8px}

.md-mobile-hdr{display:none;position:fixed;top:0;left:0;right:0;z-index:100;padding:12px 16px;background:rgba(5,0,8,.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.04);align-items:center;justify-content:space-between}
.md-hamburger{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px 8px}
.md-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}
.md-overlay.show{display:block}
body.sb-open{overflow:hidden}

@media(max-width:900px){
  .md-sb{position:fixed;left:0;top:0;transform:translateX(-100%);z-index:60}
  .md-sb.open{transform:translateX(0)}
  .md-mobile-hdr{display:flex}
  .md-overlay.show{display:block}
  .md-main{padding:16px;padding-top:70px}
  .md-stats{grid-template-columns:repeat(2,1fr)}
  .tc-grid{grid-template-columns:1fr}
  .tc-contact{flex-direction:column;align-items:flex-end;gap:4px}
  .tc-members{grid-template-columns:1fr}
}
@media(max-width:480px){.md-stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div className="md-layout">
        <div className="md-mobile-hdr">
          <button className="md-hamburger" onClick={()=>{setSidebarOpen(true);document.body.classList.add('sb-open')}}>☰</button>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'.7rem',fontWeight:700,letterSpacing:'2px'}}>MENTOR PANEL</div>
          <button className="md-hamburger" onClick={handleLogout}>{I.logout}</button>
        </div>

        <div className={`md-overlay ${sidebarOpen?'show':''}`} onClick={()=>{setSidebarOpen(false);document.body.classList.remove('sb-open')}}/>

        <div className={`md-sb ${sidebarOpen?'open':''}`}>
          <div className="md-sb-hdr">
            <div className="md-sb-logo"><div className="md-sb-icon">PS</div><div><div className="md-sb-title">MENTOR PANEL</div><div className="md-sb-sub">Project Space 2026</div></div></div>
            {mentor && <div className="md-sb-mentor"><div className="md-sb-mname">{mentor.name}</div><div className="md-sb-mtech">{mentor.technology}</div></div>}
          </div>
          <div className="md-sb-nav">
            {navItems.map(n => <button key={n.id} className={`md-sb-item ${activePage===n.id?'on':''}`} onClick={()=>{setActivePage(n.id);setSidebarOpen(false);document.body.classList.remove('sb-open')}}>{n.icon}<span>{n.label}</span></button>)}
          </div>
          <div className="md-sb-footer"><button className="md-sb-logout" onClick={handleLogout}>{I.logout} Logout</button></div>
        </div>

        <div className="md-main">
          {loading && <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading...</div>}

          {!loading && data && (<>
            {/* OVERVIEW */}
            {activePage==='overview' && (<>
              <div className="md-page-title">OVERVIEW</div>
              <div className="md-page-sub">Your team registration progress</div>
              <div className="md-stats">
                <div className="md-stat" style={{'--glow':'253,28,0'}}><div className="md-stat-val" style={{color:'#fd1c00'}}>{stats.totalTeams}</div><div className="md-stat-label">Total Teams</div></div>
                <div className="md-stat" style={{'--glow':'74,222,128',animationDelay:'.1s'}}><div className="md-stat-val" style={{color:'#4ade80'}}>{stats.registeredCount}</div><div className="md-stat-label">Registered</div></div>
                <div className="md-stat" style={{'--glow':'238,167,39',animationDelay:'.2s'}}><div className="md-stat-val" style={{color:'#EEA727'}}>{stats.pendingCount}</div><div className="md-stat-label">Pending</div></div>
                <div className="md-stat" style={{'--glow':'59,130,246',animationDelay:'.3s'}}><div className="md-stat-val" style={{color:'#3b82f6'}}>{stats.totalMembers}</div><div className="md-stat-label">Members</div></div>
              </div>
              <div className="md-prog"><div className="md-prog-hdr"><span className="md-prog-title">Registration Progress</span><span className="md-prog-pct">{stats.progressPercent}%</span></div><div className="md-prog-bar"><div className="md-prog-fill" style={{width:`${stats.progressPercent}%`}}/></div></div>
              <div style={{fontSize:'.82rem',fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:'12px'}}>Your Teams</div>
              {myTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* REGISTERED */}
            {activePage==='registered' && (<>
              <div className="md-page-title">REGISTERED TEAMS</div>
              <div className="md-page-sub">{registeredTeams.length} teams completed</div>
              {registeredTeams.length===0 && <div style={{padding:'40px',textAlign:'center',color:'rgba(255,255,255,.2)'}}>No teams registered yet</div>}
              {registeredTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* PENDING */}
            {activePage==='pending' && (<>
              <div className="md-page-title">PENDING TEAMS</div>
              <div className="md-page-sub">{pendingTeams.length} teams haven't registered</div>
              {pendingTeams.length===0 && <div style={{padding:'40px',textAlign:'center',color:'#4ade80',fontWeight:600}}>All teams registered!</div>}
              {pendingTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* TECH PROJECTS */}
            {activePage==='techprojects' && (<>
              <div className="md-page-title">{techProjects.technology?.toUpperCase()} PROJECTS</div>
              <div className="md-page-sub">{techProjects.total} total · {techProjects.registered} registered · {techProjects.pending} pending</div>
              <div className="md-prog" style={{marginBottom:'20px'}}><div className="md-prog-hdr"><span className="md-prog-title">{techProjects.technology} Registration</span><span className="md-prog-pct">{techProjects.total>0?Math.round(techProjects.registered/techProjects.total*100):0}%</span></div><div className="md-prog-bar"><div className="md-prog-fill" style={{width:`${techProjects.total>0?Math.round(techProjects.registered/techProjects.total*100):0}%`}}/></div></div>
              {(techProjects.teams||[]).map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* ALL TEAMS */}
            {activePage==='allteams' && (<>
              <div className="md-page-title">ALL MY TEAMS</div>
              <div className="md-page-sub">{myTeams.length} teams assigned</div>
              {myTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* SETTINGS */}
            {activePage==='settings' && (<>
              <div className="md-page-title">SETTINGS</div>
              <div className="md-page-sub">Manage your account</div>
              <div className="md-settings-card">
                <div className="md-set-title">Profile</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
                  <div className="tc-box"><div className="tc-box-l">Name</div><div className="tc-box-v">{mentor?.name}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Email</div><div className="tc-box-v">{mentor?.email}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Technology</div><div className="tc-box-v">{mentor?.technology}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Password</div><div className="tc-box-v" style={{color:mentor?.hasPassword?'#4ade80':'#EEA727'}}>{mentor?.hasPassword?'Set ✓':'Not set'}</div></div>
                </div>
              </div>
              <div className="md-settings-card">
                <div className="md-set-title">{mentor?.hasPassword?'Change Password':'Set Password'}</div>
                <div className="md-set-desc">{mentor?.hasPassword?'Update your password':'Set a password for quick login'}</div>
                <input className="md-set-input" type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e=>setNewPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSetPassword()}/>
                <button className="md-set-btn" onClick={handleSetPassword} disabled={passLoading||!newPass}>{passLoading?'Saving...':'Set Password'}</button>
                {passMsg && <div className="md-set-msg" style={{background:passMsg.includes('set')?'rgba(74,222,128,.06)':'rgba(255,40,0,.06)',color:passMsg.includes('set')?'#4ade80':'#ff6040'}}>{passMsg}</div>}
              </div>
            </>)}
          </>)}
        </div>
      </div>
    </>
  )
}