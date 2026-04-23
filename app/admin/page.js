'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'

export default function AdminDashboard() {
  const router = useRouter()
  const [phase, setPhase] = useState('auth')
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminName, setAdminName] = useState('')
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [filterTech, setFilterTech] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [expandedMentor, setExpandedMentor] = useState(null)
  const [reminding, setReminding] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')
  const [adLeaderboard, setAdLeaderboard] = useState({ leaderboard: [], stats: {} })
  const [adLbLoading, setAdLbLoading] = useState(false)
  const [adNotifs, setAdNotifs] = useState([])
  const [adUnread, setAdUnread] = useState(0)
  const [showAdNotif, setShowAdNotif] = useState(false)
  const [mobNav, setMobNav] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [liStats, setLiStats] = useState(null)
  const [liTab, setLiTab] = useState('overview') // 'overview' | 'teams' | 'members' | 'tech' | 'mentors'
  const [liLoading, setLiLoading] = useState(false)
  const [liSearch, setLiSearch] = useState('')
  const [liSubTab, setLiSubTab] = useState('members')
  const [liRecentTab, setLiRecentTab] = useState('trainees')
  const [liTechFilter, setLiTechFilter] = useState('all')

  const pwRules = [
    { label: 'At least 8 characters', test: v => v.length >= 8 },
    { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { label: 'One number', test: v => /[0-9]/.test(v) },
    { label: 'One special character', test: v => /[^A-Za-z0-9]/.test(v) },
  ]

  useEffect(() => { setMounted(true); const c = () => setIsMobile(window.innerWidth < 900); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  useEffect(() => { const s = sessionStorage.getItem('admin_token'); const se = sessionStorage.getItem('adminEmail'); if (se) { setEmail(se); sessionStorage.removeItem('adminEmail') }; if (s) { setToken(s); setPhase('dashboard') } }, [])
  useEffect(() => { if (phase === 'dashboard' && token) fetchDashboard() }, [phase, token])

  async function handleCheckAndSendOTP() {
    setError(''); setLoading(true)
    try {
      const check = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check-account', email }) })
      const cd = await check.json(); if (!check.ok) { setError(cd.error); return }; setAdminName(cd.name)
      if (mode === 'login' && cd.hasPassword) { setStep(2); return }
      if (mode === 'login' && !cd.hasPassword) setMode('create')
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) })
      const d = await r.json(); if (!r.ok) { setError(d.error); return }; setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }
  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try { const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify-otp', email, otp }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return }; setStep(3) } catch { setError('Network error') } finally { setLoading(false) }
  }
  async function handleSetPassword() {
    setError(''); if (password !== confirmPassword) { setError('Passwords do not match'); return }
    const f = pwRules.find(r => !r.test(password)); if (f) { setError(f.label + ' is required'); return }; setLoading(true)
    try { const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-password', email, newPassword: password, confirmPassword }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return }; sessionStorage.setItem('adminEmail', email); window.location.reload() } catch { setError('Network error') } finally { setLoading(false) }
  }
  async function handlePasswordLogin() {
    setError(''); setLoading(true)
    try { const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password-login', email, password }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return }; setToken(d.token); sessionStorage.setItem('admin_token', d.token); setPhase('dashboard'); import('@/lib/pushNotifications').then(mod => mod.registerPushNotifications(email, 'admin')).catch(() => {}) } catch { setError('Network error') } finally { setLoading(false) }
  }
  async function handleForgotSendOTP() {
    setError(''); setLoading(true)
    try { const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return }; setAdminName(d.name); setStep(2) } catch { setError('Network error') } finally { setLoading(false) }
  }
  async function fetchDashboard() {
    setLoading(true)
    try { const r = await fetch('/api/admin/dashboard', { headers: { 'x-admin-token': token } }); const d = await r.json(); if (!r.ok) { setError(d.error); setPhase('auth'); sessionStorage.removeItem('admin_token'); return }; setData(d) } catch { setError('Failed to load') } finally { setLoading(false) }
  }
  async function handleExport(type) { const r = await fetch(`/api/admin/export?type=${type}`, { headers: { 'x-admin-token': token } }); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `project-space-${type}.csv`; a.click(); URL.revokeObjectURL(u) }
  async function handleRemind() { setReminding(true); setReminderMsg(''); try { const r = await fetch('/api/admin/remind', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ type: 'all-pending' }) }); const d = await r.json(); setReminderMsg(d.message || `Sent ${d.sent} reminders`) } catch { setReminderMsg('Failed') } finally { setReminding(false) } }
  function handleLogout() { sessionStorage.removeItem('admin_token'); setToken(''); setPhase('auth'); setData(null) }

  useEffect(() => { if (phase==='dashboard') { fetchAdLeaderboard(); fetchAdNotifs(); const iv=setInterval(()=>{fetchAdLeaderboard();fetchAdNotifs()},30000); return ()=>clearInterval(iv) } }, [phase])

  // Fetch LinkedIn stats when tab is active
  useEffect(() => {
    if (activeTab !== 'linkedin-stats' || !data) return
    setLiLoading(true)
    fetch('/api/linkedin-share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats' }) })
      .then(r => r.json())
      .then(d => {
        // Enrich with team/mentor breakdown using existing admin data
        const allTeams = data.teamList || data.teams || []
        const teamMap = {}
        allTeams.forEach(t => { if (t.teamNumber) teamMap[t.teamNumber] = t })

        // Build team-wise breakdown
        const teamBreakdown = {}
        ;(d.recent || []).forEach(s => {
          if (!teamBreakdown[s.team_number]) teamBreakdown[s.team_number] = { shares: [], team: teamMap[s.team_number] || null }
          teamBreakdown[s.team_number].shares.push(s)
        })

        setLiStats({ ...d, teamMap, teamBreakdown, allTeams })
      })
      .catch(e => console.error('LinkedIn stats error:', e))
      .finally(() => setLiLoading(false))
  }, [activeTab, data])
  async function fetchAdLeaderboard() { setAdLbLoading(true); try { const r=await fetch('/api/milestones/leaderboard?limit=50'); const d=await r.json(); setAdLeaderboard(d); } catch(e){console.error(e)} finally{setAdLbLoading(false)} }
  async function fetchAdNotifs() { try { const r=await fetch('/api/milestones/notifications?type=admin&email=admin&limit=20'); const d=await r.json(); setAdNotifs(d.notifications||[]); setAdUnread(d.unread_count||0); } catch{} }
  async function markAdNotifsRead() { await fetch('/api/milestones/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'mark-all-read',type:'admin'})}); setAdUnread(0); setAdNotifs(p=>p.map(n=>({...n,read:true}))); }

  const filteredTeams = data?.teamList?.filter(t => {
    if (filterTech !== 'all' && t.technology !== filterTech) return false
    if (filterStatus === 'registered' && !t.registered) return false
    if (filterStatus === 'pending' && t.registered) return false
    if (search) { const q = search.toLowerCase(); return (t.projectTitle||'').toLowerCase().includes(q)||(t.leaderName||'').toLowerCase().includes(q)||(t.leaderRoll||'').toLowerCase().includes(q)||(t.teamNumber||'').toLowerCase().includes(q)||String(t.serialNumber).includes(q) }
    return true
  }) || []

  const TC = { 'Data Specialist':'#3b82f6','AWS Development':'#f59e0b','Full Stack':'#10b981','Google Flutter':'#06b6d4','ServiceNow':'#8b5cf6','VLSI':'#ef4444' }
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (_,a,b,c) => a+'*'.repeat(Math.min(b.length,6))+c) : ''

  function AnimNum({value,color}){ const [d,setD]=useState(0); const ref=useRef(); useEffect(()=>{ const end=parseInt(value)||0,dur=900,t0=performance.now(); function s(now){const p=Math.min((now-t0)/dur,1);setD(Math.floor(p*end));if(p<1)ref.current=requestAnimationFrame(s)};ref.current=requestAnimationFrame(s);return()=>cancelAnimationFrame(ref.current)},[value]); return <span style={{color}}>{d}</span> }

  // Icons
  const IC = {
    grid:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    users:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    layers:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    bolt:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    file:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    out:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    menu:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    ref:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    bell:<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    dl:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    mail:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
    clk:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    ph:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
    share:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    award:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
    trend:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    check:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    user:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    star:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    group:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    cpu:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/></svg>,
    target:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  }
  const NAV=[
    {id:'overview',label:'Overview',icon:IC.grid},
    {id:'mentors',label:'Mentors',icon:IC.users},
    {id:'teams',label:'Teams',icon:IC.group},
    {id:'milestones',label:'Project Status',icon:IC.target},
    {id:'linkedin-stats',label:'LinkedIn Stats',icon:IC.share},
    {id:'leaderboard',label:'Leaderboard',icon:IC.award},
    {id:'report-card',label:'Report Card',icon:IC.file},
  ]

  // ═══ AUTH ═══
  if (phase === 'auth') {
    const totalSteps = mode === 'login' ? 2 : 3
    const iSt = { width:'100%',padding:'12px 16px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'12px',color:'#fff',fontSize:'.88rem',outline:'none',fontFamily:"'DM Sans',sans-serif" }
    const bSt = { width:'100%',padding:'13px',borderRadius:'12px',background:'linear-gradient(135deg,#fd1c00,#fd3a20)',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.88rem',fontWeight:600,cursor:'pointer' }
    const lSt = { display:'block',fontSize:'.65rem',fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'6px' }
    const tSt = { position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:'10px',cursor:'pointer' }
    return (
      <>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}html,body{background:#050008;overflow:auto}body{font-family:'DM Sans',sans-serif;color:#fff}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}.adm-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#050008;position:relative}.adm-card{width:100%;max-width:420px;background:rgba(12,8,20,.9);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:40px 32px;backdrop-filter:blur(20px);animation:fadeUp .5s ease;position:relative;z-index:2}@media(max-width:480px){.adm-card{padding:28px 20px;border-radius:16px}}`}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
        <AuthBackground>
          <div className="adm-wrap"><div className="adm-card">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'24px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'linear-gradient(135deg,#fd1c00,#faa000)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'16px',color:'#fff',boxShadow:'0 0 24px rgba(253,28,0,.3)'}}>PS</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'1rem',fontWeight:700,letterSpacing:'3px',color:'#fff',marginTop:'12px'}}>{mode==='login'?'ADMIN LOGIN':mode==='create'?'CREATE ACCOUNT':'RESET PASSWORD'}</div>
              <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.35)',marginTop:'4px'}}>{mode==='login'&&step===1&&'Enter your admin email'}{mode==='login'&&step===2&&`Welcome back, ${adminName}`}{mode==='create'&&step===2&&'Verify your email'}{mode==='create'&&step===3&&'Set your login password'}{mode==='forgot'&&step===1&&'Enter email to reset password'}{mode==='forgot'&&step===2&&'Enter verification code'}{mode==='forgot'&&step===3&&'Set new password'}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'22px'}}>
              {Array.from({length:totalSteps},(_,i)=>i+1).map(n=><React.Fragment key={n}>{n>1&&<div style={{width:'32px',height:'1px',background:step>=n?'rgba(255,96,64,0.35)':'rgba(255,255,255,0.1)'}}/>}<div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,background:step>n?'rgba(255,40,0,0.2)':step===n?'#ff2800':'rgba(255,255,255,0.06)',color:step>n?'#ff6040':step===n?'#fff':'rgba(255,255,255,0.25)',boxShadow:step===n?'0 0 14px rgba(255,40,0,0.4)':'none'}}>{step>n?'✓':n}</div></React.Fragment>)}
            </div>
            {error&&<div style={{background:'rgba(255,40,0,.06)',border:'1px solid rgba(255,40,0,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#ff6040',marginBottom:'14px',animation:'fadeUp .3s ease'}}>{error}</div>}
            {mode==='login'&&step===1&&<><div style={{marginBottom:'14px'}}><label style={lSt}>Admin Email</label><input style={iSt} placeholder="admin@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCheckAndSendOTP()} autoFocus/></div><button style={bSt} onClick={handleCheckAndSendOTP} disabled={loading||!email}>{loading?'Checking...':'Continue →'}</button><div style={{textAlign:'center',marginTop:'14px',fontSize:'.76rem',color:'rgba(255,255,255,.35)',cursor:'pointer'}} onClick={()=>router.push('/')}>← Back to Home</div></>}
            {mode==='login'&&step===2&&<><div style={{marginBottom:'14px'}}><label style={lSt}>Password</label><div style={{position:'relative'}}><input style={{...iSt,paddingRight:'52px'}} type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePasswordLogin()} autoFocus/><button style={tSt} onClick={()=>setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button></div></div><button style={bSt} onClick={handlePasswordLogin} disabled={loading||!password}>{loading?'Logging in...':'Login →'}</button><div style={{textAlign:'center',marginTop:'12px',fontSize:'.76rem'}}><span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setMode('forgot');setStep(1);setError('');setPassword('')}}>Forgot password?</span></div><div style={{textAlign:'center',marginTop:'8px',fontSize:'.72rem',color:'rgba(255,255,255,.25)',cursor:'pointer'}} onClick={()=>{setStep(1);setPassword('');setError('')}}>← Change email</div></>}
            {mode==='create'&&step===2&&<><div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#4ade80',marginBottom:'14px'}}>OTP sent to {maskedEmail}</div><div style={{marginBottom:'14px'}}><label style={lSt}>Enter OTP</label><input style={{...iSt,fontSize:'1.1rem',letterSpacing:'6px',textAlign:'center'}} placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus/></div><button style={bSt} onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify OTP →'}</button></>}
            {(mode==='create'||mode==='forgot')&&step===3&&<><div style={{marginBottom:'14px'}}><label style={lSt}>{mode==='forgot'?'New Password':'Create Password'}</label><div style={{position:'relative'}}><input style={{...iSt,paddingRight:'52px'}} type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} autoFocus/><button style={tSt} onClick={()=>setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button></div>{password&&<div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>{pwRules.map(r=><div key={r.label} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'.65rem',color:r.test(password)?'#4ade80':'rgba(255,255,255,.35)'}}><span style={{width:'4px',height:'4px',borderRadius:'50%',background:'currentColor'}}/>{r.label}</div>)}</div>}</div><div style={{marginBottom:'14px'}}><label style={lSt}>Confirm Password</label><div style={{position:'relative'}}><input style={{...iSt,paddingRight:'52px'}} type={showConfirm?'text':'password'} placeholder="Re-enter password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSetPassword()}/><button style={tSt} onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?'HIDE':'SHOW'}</button></div>{confirmPassword&&password!==confirmPassword&&<div style={{fontSize:'.68rem',color:'#ff6040',marginTop:'4px'}}>Passwords do not match</div>}</div><button style={bSt} onClick={handleSetPassword} disabled={loading||!password||!confirmPassword}>{loading?'Setting...':mode==='forgot'?'Reset Password →':'Create Account →'}</button></>}
            {mode==='forgot'&&step===1&&<><div style={{marginBottom:'14px'}}><label style={lSt}>Email</label><input style={iSt} placeholder="admin@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleForgotSendOTP()} autoFocus/></div><button style={bSt} onClick={handleForgotSendOTP} disabled={loading||!email}>{loading?'Sending...':'Send Reset Code →'}</button><div style={{textAlign:'center',marginTop:'14px',fontSize:'.76rem'}}><span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setMode('login');setStep(1);setError('')}}>← Back to Login</span></div></>}
            {mode==='forgot'&&step===2&&<><div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#4ade80',marginBottom:'14px'}}>Reset code sent to {maskedEmail}</div><div style={{marginBottom:'14px'}}><label style={lSt}>Enter OTP</label><input style={{...iSt,fontSize:'1.1rem',letterSpacing:'6px',textAlign:'center'}} placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus/></div><button style={bSt} onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify →'}</button></>}
          </div></div>
        </AuthBackground>
      </>
    )
  }
  // ═══ REPORT CARD ═══
  function ReportCard() {
    const [roll, setRoll] = useState('');
    const [rcL, setRcL] = useState(false);
    const [report, setReport] = useState(null);
    const [rcE, setRcE] = useState('');
    const [gen, setGen] = useState(false);

    const fetchReport = async () => {
      if (!roll.trim()) { setRcE('Enter a roll number'); return; }
      setRcL(true); setRcE(''); setReport(null);
      try { const r = await fetch('/api/admin/report-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rollNumber: roll.trim().toUpperCase() }) }); const d = await r.json(); if (d.error) setRcE(d.error); else if (d.report) setReport(d.report); } catch { setRcE('Failed to fetch data'); } finally { setRcL(false); }
    };

    // ═══════════════════════════════════════════
    // PDF GENERATION — fits everything on 1 page
    // ═══════════════════════════════════════════
    const downloadPDF = async () => {
      if (!report) return; setGen(true);
      try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const w = 210, h = 297; let y = 0;
        const R=[253,28,0],K=[0,0,0],W=[255,255,255],G=[130,130,130],D=[35,35,35],L=[246,246,246];
        const c3=(hex)=>{const h=hex.replace('#','');return [parseInt(h.substring(0,2),16),parseInt(h.substring(2,4),16),parseInt(h.substring(4,6),16)]};

        // ── HEADER ──
        doc.setFillColor(...R); doc.rect(0,0,w,20,'F');
        doc.setFillColor(...K); doc.rect(0,17,w,3,'F');
        doc.setTextColor(...W); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text('PROJECT SPACE — STUDENT REPORT CARD',10,9);
        doc.setFontSize(6); doc.setFont('helvetica','normal');
        doc.text(`${report.college} · ${report.branch} · ${report.technology}`,10,14);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})} · Technical Hub · Aditya University`,w-10,9,{align:'right'});
        doc.text('projectspace.technicalhub.io',w-10,14,{align:'right'});
        y = 23;

        // Helpers
        const sec = (t,yp) => { doc.setFillColor(...R); doc.rect(10,yp,1.5,3.5,'F'); doc.setTextColor(...D); doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.text(t,13.5,yp+2.8); doc.setDrawColor(235,235,235); doc.line(13.5+doc.getTextWidth(t)+2,yp+1.8,w-10,yp+1.8); return yp+5.5; };
        const lv = (l,v,x,yp) => { doc.setTextColor(...G); doc.setFontSize(5); doc.setFont('helvetica','normal'); doc.text(l,x,yp); doc.setTextColor(...D); doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.text(String(v||'—'),x,yp+3.5); };
        const box = (x,yp,bw,lb,vl,clr) => { doc.setFillColor(...L); doc.roundedRect(x,yp,bw,9,1,1,'F'); doc.setTextColor(...G); doc.setFontSize(4); doc.setFont('helvetica','normal'); doc.text(lb,x+bw/2,yp+3,{align:'center'}); doc.setTextColor(...(clr||D)); doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.text(String(vl),x+bw/2,yp+7.5,{align:'center'}); };
        const bar = (x,yp,wd,pct,c) => { doc.setFillColor(235,235,235); doc.roundedRect(x,yp,wd,1.8,0.9,0.9,'F'); if(pct>0){doc.setFillColor(...c);doc.roundedRect(x,yp,Math.max(1,(pct/100)*wd),1.8,0.9,0.9,'F')} };
        const sep = (yp) => { doc.setDrawColor(240,240,240); doc.line(10,yp,w-10,yp); return yp+1.5; };

        // ── 1. PERSONAL INFO ──
        y = sec('PERSONAL INFORMATION', y);
        const cols=[10,48,86,124,162];
        lv('Name',report.name,cols[0],y); lv('Roll No',report.roll_number,cols[1],y); lv('Gender',report.gender,cols[2],y); lv('Mobile',report.mobile,cols[3],y); lv('DOB',report.dob||'—',cols[4],y); y+=7;
        lv('Pool',report.pool,cols[0],y); lv('Seat',report.seat_type,cols[1],y); lv('Scholar',report.scholar_type,cols[2],y); lv('Town',report.town,cols[3],y); lv('Passout',report.passout_year||'—',cols[4],y); y+=7;
        y = sep(y);

        // ── 2. ACADEMICS ──
        y = sec('ACADEMIC PERFORMANCE', y);
        const aw=24.5, ag=2.5;
        box(10,y,aw,'SSC',report.ssc?`${report.ssc}%`:'—',c3('#EEA727'));
        box(10+aw+ag,y,aw,'INTER',report.inter?`${report.inter}%`:'—',c3('#EEA727'));
        box(10+2*(aw+ag),y,aw,'B.TECH %',report.btech_pct?`${report.btech_pct}%`:'—',c3('#3b82f6'));
        box(10+3*(aw+ag),y,aw,'CGPA',report.btech||'—',c3('#7B2FBE'));
        box(10+4*(aw+ag),y,aw,'BACKLOGS',String(report.backlogs||0),report.backlogs>0?R:c3('#10b981'));
        box(10+5*(aw+ag),y,aw,'ATTEND.',`${report.overallAttendance||0}%`,c3('#10b981'));
        box(10+6*(aw+ag),y,aw,'BADGE',`${report.badge_test_pct||0}%`,report.badge_test_status==='Pass'?c3('#10b981'):c3('#EEA727'));
        y+=12; y=sep(y);

        // ── 3. CODING PROFILES ──
        y = sec('CODING PROFILES', y);
        const cw=36,cg=3;
        box(10,y,cw,'LEETCODE',report.leetcode?.total||'—',c3('#ffa116'));
        box(10+cw+cg,y,cw,'GFG',report.gfg?.total||'—',c3('#2f8d46'));
        box(10+2*(cw+cg),y,cw,'CODECHEF',report.codechef?.total||'—',c3('#5b4638'));
        box(10+3*(cw+cg),y,cw,'HACKERRANK',report.hackerrank?`${report.hackerrank.stars}★`:'—',c3('#00ea64'));
        box(10+4*(cw+cg),y,cw-6,'MAYA',report.mayaCoding?.score||'—',c3('#06b6d4'));
        y+=11;
        // Details line
        doc.setTextColor(...G); doc.setFontSize(4.5); doc.setFont('helvetica','normal');
        const details = [];
        if(report.leetcode) details.push(`LC: E${report.leetcode.easy} M${report.leetcode.medium} H${report.leetcode.hard} #${report.leetcode.rank} ${report.leetcode.streak}d`);
        if(report.codechef) details.push(`CC: ${report.codechef.rating}(${report.codechef.stars}★) ${report.codechef.contests}c`);
        if(report.hackerrank) details.push(`HR: ${report.hackerrank.badges}bdg ${report.hackerrank.certs}cert`);
        if(report.gfg) details.push(`GFG: ${report.gfg.score}pts ${report.gfg.streak}d`);
        if(report.mayaCoding) details.push(`Maya: G#${report.mayaCoding.globalRank} B#${report.mayaCoding.batchRank} E${report.mayaCoding.easy}M${report.mayaCoding.medium}H${report.mayaCoding.hard}`);
        if(details.length>0) doc.text(details.join('  |  '),10,y);
        y+=3; y=sep(y);

        // ── 4. HOOT + CODING ASSESSMENT + BADGE ──
        y = sec('ASSESSMENTS — HOOT · CODING · BADGE', y);
        if(report.hoot){
          const hx=10,hw=45;
          [['Listening',report.hoot.listening,[238,167,39]],['Speaking',report.hoot.speaking,[253,28,0]],['Reading',report.hoot.reading,[16,185,129]],['Writing',report.hoot.writing,[123,47,190]]].forEach(([lb,vl,c],i)=>{
            const hy=y+i*3.5;
            doc.setTextColor(...G);doc.setFontSize(4.5);doc.text(lb,hx,hy+1.3);
            bar(hx+16,hy,hw,vl||0,c);
            doc.setTextColor(...c);doc.setFontSize(5);doc.setFont('helvetica','bold');doc.text(`${(vl||0).toFixed?vl.toFixed(1):vl}%`,hx+16+hw+2,hy+1.3);
          });
          doc.setTextColor(238,167,39);doc.setFontSize(6);doc.setFont('helvetica','bold');doc.text(`Total: ${report.hoot.total?.toFixed?report.hoot.total.toFixed(1):report.hoot.total}/100`,hx+16,y+15.5);
        } else { doc.setTextColor(...G);doc.setFontSize(5);doc.text('No HOOT data',10,y+2) }
        // Coding + Badge on right side
        const rx=105;
        doc.setTextColor(...D);doc.setFontSize(5.5);doc.setFont('helvetica','bold');
        doc.text('CODING LEVEL',rx,y+1);
        doc.setFillColor(...L);doc.roundedRect(rx,y+2.5,40,7,1,1,'F');
        doc.setTextColor(...(report.codingLevel==='Advanced'?c3('#10b981'):c3('#EEA727')));doc.setFontSize(8);doc.text(report.codingLevel||'—',rx+20,y+7.5,{align:'center'});
        doc.setTextColor(...G);doc.setFontSize(4.5);doc.setFont('helvetica','normal');doc.text(`Score: ${report.codingScore||'—'}/100`,rx,y+12);

        doc.setTextColor(...D);doc.setFontSize(5.5);doc.setFont('helvetica','bold');
        doc.text('BADGE TEST',rx+50,y+1);
        doc.setFillColor(...L);doc.roundedRect(rx+50,y+2.5,40,7,1,1,'F');
        doc.setTextColor(...(report.badge_test_status==='Pass'||report.badge_test_status==='Cleared'?c3('#10b981'):c3('#EEA727')));doc.setFontSize(8);doc.text(`${report.badge_test_pct||0}%`,rx+70,y+7.5,{align:'center'});
        doc.setTextColor(...G);doc.setFontSize(4.5);doc.setFont('helvetica','normal');doc.text(`Status: ${report.badge_test_status||'—'}`,rx+50,y+12);
        y+=18; y=sep(y);

        // ── 5. ATTENDANCE ──
        if(report.attendance?.length>0){
          y = sec(`ATTENDANCE — Overall ${report.overallAttendance}% (${report.totalPresent}/${report.totalSessions})`, y);
          const ac=5,abw=(w-20-(ac-1)*1.5)/ac;
          report.attendance.forEach((a,i)=>{
            const col=i%ac,row=Math.floor(i/ac),ax=10+col*(abw+1.5),ay=y+row*6.5;
            doc.setFillColor(...L);doc.roundedRect(ax,ay,abw,5.5,0.8,0.8,'F');
            doc.setTextColor(...D);doc.setFontSize(4);doc.setFont('helvetica','bold');
            doc.text(a.tech.length>14?a.tech.substring(0,14)+'..':a.tech,ax+1,ay+2.5);
            const pc=parseFloat(a.pct)>=75?[34,197,94]:[239,68,68];
            doc.setTextColor(...pc);doc.setFontSize(5);doc.text(`${a.pct}%`,ax+abw-1,ay+2.5,{align:'right'});
            bar(ax+1,ay+3.8,abw-2,parseFloat(a.pct),pc);
          });
          y+=Math.ceil(report.attendance.length/ac)*6.5+1.5; y=sep(y);
        }

        // ── 6. CERTIFICATIONS ──
        y = sec(`CERTIFICATIONS — G:${report.certCounts?.global||0} T:${report.certCounts?.training||0} B:${report.certCounts?.badges||0} I:${report.certCounts?.internship||0}`, y);
        if(report.globalCerts?.length>0){doc.setTextColor(...D);doc.setFontSize(5);doc.setFont('helvetica','normal');const ct=report.globalCerts.map((c,i)=>`${i+1}.${c}`).join('  ');const cl=doc.splitTextToSize(ct,w-24);doc.text(cl,14,y);y+=cl.length*2.8}else{doc.setTextColor(...G);doc.setFontSize(5);doc.text('No certifications',14,y);y+=3}
        y+=1;y=sep(y);

        // ── 7. APTITUDE ──
        if(report.aptMandatory){
          y=sec(`APTITUDE — ${report.aptMandatory.pct}% (${report.aptMandatory.attempts}/${report.aptMandatory.total})`,y);
          const abw2=27;
          box(10,y,abw2,'EASY',report.aptMandatory.easy,c3('#10b981'));
          box(10+abw2+2,y,abw2,'MEDIUM',report.aptMandatory.medium,c3('#EEA727'));
          box(10+2*(abw2+2),y,abw2,'HARD',report.aptMandatory.hard,R);
          box(10+3*(abw2+2),y,abw2,'APTITUDE',report.aptMandatory.aptitude,c3('#3b82f6'));
          box(10+4*(abw2+2),y,abw2,'REASONING',report.aptMandatory.reasoning,c3('#7B2FBE'));
          box(10+5*(abw2+2),y,abw2-2,'VERBAL',report.aptMandatory.verbal,c3('#06b6d4'));
          y+=12;y=sep(y);
        }

        // ── 8. COURSES + PAYMENTS + STATUS ──
        y=sec('COURSES · PAYMENTS · PLACEMENT',y);
        if(report.courses?.length>0){doc.setTextColor(...D);doc.setFontSize(4.5);doc.setFont('helvetica','normal');const ct=report.courses.join(' · ');const cl=doc.splitTextToSize(ct,w-24);doc.text(cl,14,y);y+=cl.length*2.5}
        y+=1;
        doc.setTextColor(...G);doc.setFontSize(5);doc.setFont('helvetica','normal');
        const payStr=(report.payments||[]).map((p,i)=>`T${i+1}:${(p||'').toLowerCase()==='paid'?'✓':'✗'}`).join(' ');
        doc.text(`Payments: ${payStr}`,10,y);
        doc.text(`Semesters: ${(report.semesters||[]).map((s2,i)=>`S${i+1}:${s2}`).join(' ')}`,80,y);y+=3;
        doc.text(`Placement: ${report.placement||'Not yet placed'}`,10,y);
        doc.text(`Violations: ${report.violations||0}`,100,y);y+=3;

        // ── FOOTER ──
        doc.setFillColor(...K);doc.rect(0,h-7,w,7,'F');doc.setFillColor(...R);doc.rect(0,h-7,w,0.8,'F');
        doc.setTextColor(...W);doc.setFontSize(5);doc.setFont('helvetica','normal');
        doc.text('Project Space · Technical Hub · Aditya University — ACET · AEC · ACOE',10,h-2.5);
        doc.text('projectspace.technicalhub.io',w-10,h-2.5,{align:'right'});
        doc.save(`Report_Card_${report.roll_number}.pdf`);
      } catch(err){console.error(err);alert('Failed to generate PDF.')} finally{setGen(false)}
    };

    // ═══════════════════════════
    // UI HELPER COMPONENTS
    // ═══════════════════════════
    const Sec=({color,children})=><div style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color,marginBottom:6,marginTop:16,display:'flex',alignItems:'center',gap:5}}>{children}<span style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(255,255,255,.06),transparent)'}}/></div>;
    const Info=({l,v,bold})=><div><div style={{fontSize:'7.5px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',color:'rgba(255,255,255,.2)',marginBottom:1}}>{l}</div><div style={{fontSize:'12px',fontWeight:bold?700:500,color:bold?'#fff':'rgba(255,255,255,.75)'}}>{v||'—'}</div></div>;
    const Stat=({v,l,c})=><div style={{textAlign:'center',padding:'7px 3px',borderRadius:8,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)'}}><div style={{fontSize:'15px',fontWeight:800,color:c}}>{v}</div><div style={{fontSize:'7px',fontWeight:600,color:'rgba(255,255,255,.2)',textTransform:'uppercase',letterSpacing:'.04em',marginTop:1}}>{l}</div></div>;
    const Prog=({l,v,c})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><div style={{fontSize:'10px',fontWeight:500,color:'rgba(255,255,255,.35)',width:65,flexShrink:0}}>{l}</div><div style={{flex:1,height:5,borderRadius:3,background:'rgba(255,255,255,.04)',overflow:'hidden'}}><div style={{height:'100%',borderRadius:3,background:c,width:`${v||0}%`}}/></div><div style={{fontSize:'10px',fontWeight:700,width:38,textAlign:'right',color:c}}>{v?.toFixed?v.toFixed(1):v}%</div></div>;

    return (
      <div style={{maxWidth:820,margin:'0 auto'}}>
        {/* ── SEARCH ── */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:'20px',fontWeight:700,color:'#fff',marginBottom:4}}>Student Report Card</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,.3)',marginBottom:18}}>Generate a complete student profile report with academic, coding, assessment &amp; attendance data</div>
          <div style={{display:'flex',gap:8,maxWidth:400,margin:'0 auto'}}>
            <input type="text" value={roll} onChange={e=>setRoll(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&fetchReport()} placeholder="e.g. 23P31A4933" style={{flex:1,padding:'12px 16px',borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',outline:'none'}}/>
            <button onClick={fetchReport} disabled={rcL} style={{padding:'12px 24px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#fd1c00,#c41600)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'13px',fontWeight:600,cursor:rcL?'wait':'pointer',whiteSpace:'nowrap'}}>{rcL?'Loading...':'Generate'}</button>
          </div>
          {rcE&&<div style={{color:'#fd1c00',fontSize:'11px',marginTop:8}}>{rcE}</div>}
        </div>

        {/* ── REPORT CARD ── */}
        {report && <>
          <div style={{background:'rgba(13,10,20,.95)',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,overflow:'hidden'}}>

            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#120a1e,#1a0e28,#160c22)',padding:'14px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,.06)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-30,right:-30,width:100,height:100,borderRadius:'50%',background:'radial-gradient(circle,rgba(253,28,0,.06),transparent 70%)'}}/>
              <div style={{display:'flex',alignItems:'center',gap:12,zIndex:1}}>
                <div style={{width:38,height:38,borderRadius:9,background:'linear-gradient(135deg,#fd1c00,#c41600)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>PS</div>
                <div><div style={{fontSize:15,fontWeight:700,color:'#fff'}}>Student Report Card</div><div style={{fontSize:8,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em'}}>Project Space 2026 · Aditya University</div></div>
              </div>
              <div style={{textAlign:'right',zIndex:1}}><div style={{fontSize:12,fontWeight:700,color:'#EEA727'}}>{report.college}</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{report.branch} · {report.technology}</div></div>
            </div>

            {/* Body */}
            <div style={{padding:'8px 20px 18px'}}>

              {/* ══ 1. PERSONAL INFO ══ */}
              <Sec color="#3b82f6">{IC.users} Personal Information</Sec>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'4px 10px'}}>
                <Info l="Name" v={report.name} bold/><Info l="Roll Number" v={report.roll_number}/><Info l="Gender" v={report.gender}/><Info l="Mobile" v={report.mobile}/><Info l="DOB" v={report.dob}/>
                <Info l="Pool" v={report.pool}/><Info l="Seat Type" v={report.seat_type}/><Info l="Scholar" v={report.scholar_type}/><Info l="Town" v={report.town}/><Info l="Passout" v={report.passout_year}/>
              </div>

              {/* ══ 2. ACADEMICS ══ */}
              <Sec color="#EEA727">{IC.layers} Academic Performance</Sec>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5}}>
                <Stat v={report.ssc?`${report.ssc}%`:'—'} l="SSC" c="#EEA727"/>
                <Stat v={report.inter?`${report.inter}%`:'—'} l="Inter" c="#EEA727"/>
                <Stat v={report.btech_pct?`${report.btech_pct}%`:'—'} l="B.Tech" c="#3b82f6"/>
                <Stat v={report.btech||'—'} l="CGPA" c="#7B2FBE"/>
                <Stat v={String(report.backlogs||0)} l="Backlogs" c={report.backlogs>0?'#fd1c00':'#10b981'}/>
                <Stat v={`${report.overallAttendance||0}%`} l="Attend." c="#10b981"/>
                <Stat v={`${report.badge_test_pct||0}%`} l="Badge" c={report.badge_test_status==='Pass'||report.badge_test_status==='Cleared'?'#10b981':'#EEA727'}/>
              </div>

              {/* ══ 3. CODING PROFILES ══ */}
              <Sec color="#06b6d4">{IC.layers} Coding Profiles</Sec>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5}}>
                <Stat v={report.leetcode?.total||'—'} l="LeetCode" c="#ffa116"/>
                <Stat v={report.gfg?.total||'—'} l="GFG" c="#2f8d46"/>
                <Stat v={report.codechef?.total||'—'} l="CodeChef" c="#5b4638"/>
                <Stat v={report.hackerrank?`${report.hackerrank.stars}★`:'—'} l="HackerRank" c="#00ea64"/>
                <Stat v={report.mayaCoding?.score||'—'} l="Maya Portal" c="#06b6d4"/>
              </div>
              {(report.leetcode||report.mayaCoding||report.codechef)&&<div style={{fontSize:'9px',color:'rgba(255,255,255,.25)',marginTop:5,lineHeight:1.5}}>
                {report.leetcode&&<span>LeetCode: E:{report.leetcode.easy} M:{report.leetcode.medium} H:{report.leetcode.hard} · Rank #{report.leetcode.rank} · Streak {report.leetcode.streak}d &nbsp;|&nbsp; </span>}
                {report.codechef&&<span>CodeChef: {report.codechef.rating} ({report.codechef.stars}★) · {report.codechef.contests} contests &nbsp;|&nbsp; </span>}
                {report.hackerrank&&<span>HackerRank: {report.hackerrank.badges} badges · {report.hackerrank.certs} certs &nbsp;|&nbsp; </span>}
                {report.gfg&&<span>GFG: {report.gfg.score}pts · {report.gfg.streak}d streak &nbsp;|&nbsp; </span>}
                {report.mayaCoding&&<span>Maya: Global #{report.mayaCoding.globalRank} · Batch #{report.mayaCoding.batchRank} · E:{report.mayaCoding.easy} M:{report.mayaCoding.medium} H:{report.mayaCoding.hard}</span>}
              </div>}

              {/* ══ 4. ASSESSMENTS — HOOT + CODING + BADGE ══ */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:4}}>
                {/* HOOT */}
                <div>
                  <Sec color="#EEA727">{IC.bell} HOOT — Communication</Sec>
                  {report.hoot ? <>
                    <Prog l="Listening" v={report.hoot.listening} c="#EEA727"/>
                    <Prog l="Speaking" v={report.hoot.speaking} c="#fd1c00"/>
                    <Prog l="Reading" v={report.hoot.reading} c="#10b981"/>
                    <Prog l="Writing" v={report.hoot.writing} c="#7B2FBE"/>
                    <div style={{display:'flex',justifyContent:'flex-end',marginTop:3}}>
                      <div style={{background:'rgba(238,167,39,.08)',border:'1px solid rgba(238,167,39,.18)',borderRadius:6,padding:'2px 10px'}}>
                        <span style={{fontSize:13,fontWeight:800,color:'#EEA727'}}>{report.hoot.total?.toFixed?report.hoot.total.toFixed(1):report.hoot.total}<span style={{fontSize:9,fontWeight:400,marginLeft:2}}>/100</span></span>
                      </div>
                    </div>
                  </> : <div style={{fontSize:10,color:'rgba(255,255,255,.2)',padding:'12px 0'}}>No HOOT data</div>}
                </div>

                {/* Coding Assessment + Badge Test */}
                <div>
                  <Sec color="#10b981">{IC.bolt} Coding Level &amp; Badge Test</Sec>
                  <div style={{display:'flex',gap:8,marginBottom:8}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:9,background:report.codingLevel==='Advanced'?'rgba(16,185,129,.06)':'rgba(238,167,39,.06)',border:`1px solid ${report.codingLevel==='Advanced'?'rgba(16,185,129,.15)':'rgba(238,167,39,.15)'}`}}>
                      <span style={{fontSize:18}}>{report.codingLevel==='Advanced'?'🏆':'📝'}</span>
                      <div><div style={{fontSize:12,fontWeight:700,color:report.codingLevel==='Advanced'?'#10b981':'#EEA727'}}>{report.codingLevel||'—'}</div><div style={{fontSize:8,color:'rgba(255,255,255,.3)'}}>Score: {report.codingScore||'—'}/100</div></div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:9,background:'rgba(123,47,190,.06)',border:'1px solid rgba(123,47,190,.15)'}}>
                    <span style={{fontSize:18}}>{report.badge_test_status==='Pass'||report.badge_test_status==='Cleared'?'🎖️':'📋'}</span>
                    <div><div style={{fontSize:12,fontWeight:700,color:report.badge_test_status==='Pass'||report.badge_test_status==='Cleared'?'#10b981':'#EEA727'}}>{report.badge_test_status||'Not Attempted'}</div><div style={{fontSize:8,color:'rgba(255,255,255,.3)'}}>Level-1: {report.badge_test_pct||0}%</div></div>
                  </div>
                </div>
              </div>

              {/* ══ 5. ATTENDANCE ══ */}
              {report.attendance?.length>0&&<>
                <Sec color="#10b981">{IC.clk} Attendance — {report.overallAttendance}% Overall ({report.totalPresent}/{report.totalSessions})</Sec>
                <div style={{display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:5}}>
                  {report.attendance.map((a,i)=>{const pc=parseFloat(a.pct);const clr=pc>=75?'#10b981':'#ef4444';return(<div key={i} style={{padding:'5px 8px',borderRadius:7,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.04)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                      <span style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,.55)',maxWidth:'70%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.tech}</span>
                      <span style={{fontSize:10,fontWeight:700,color:clr}}>{a.pct}%</span>
                    </div>
                    <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,.04)',overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:clr,width:`${pc}%`}}/></div>
                    <div style={{fontSize:7,color:'rgba(255,255,255,.15)',marginTop:2}}>P:{a.present} A:{a.absent} T:{a.total}</div>
                  </div>)})}
                </div>
              </>}

              {/* ══ 6. CERTIFICATIONS ══ */}
              <Sec color="#10b981">{IC.file} Certifications (G:{report.certCounts?.global||0} · T:{report.certCounts?.training||0} · B:{report.certCounts?.badges||0} · I:{report.certCounts?.internship||0})</Sec>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {report.globalCerts?.length>0?report.globalCerts.map((c,i)=><span key={i} style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,.4)',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)',padding:'2px 7px',borderRadius:4}}>{c}</span>):<span style={{fontSize:10,color:'rgba(255,255,255,.15)'}}>No certifications recorded</span>}
              </div>

              {/* ══ 7. APTITUDE ══ */}
              {report.aptMandatory&&<>
                <Sec color="#3b82f6">{IC.layers} Aptitude — {report.aptMandatory.pct}% ({report.aptMandatory.attempts}/{report.aptMandatory.total} attempts)</Sec>
                <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:5}}>
                  <Stat v={report.aptMandatory.easy} l="Easy" c="#10b981"/><Stat v={report.aptMandatory.medium} l="Medium" c="#EEA727"/><Stat v={report.aptMandatory.hard} l="Hard" c="#fd1c00"/>
                  <Stat v={report.aptMandatory.aptitude} l="Aptitude" c="#3b82f6"/><Stat v={report.aptMandatory.reasoning} l="Reasoning" c="#7B2FBE"/><Stat v={report.aptMandatory.verbal} l="Verbal" c="#06b6d4"/>
                </div>
              </>}

              {/* ══ 8. COURSES ══ */}
              <Sec color="#7B2FBE">{IC.layers} Courses ({report.courses?.length||0})</Sec>
              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                {report.courses?.length>0?report.courses.map((c,i)=><span key={i} style={{fontSize:9,fontWeight:500,color:'rgba(255,255,255,.35)',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)',padding:'2px 7px',borderRadius:4}}>{c}</span>):<span style={{fontSize:10,color:'rgba(255,255,255,.15)'}}>No courses</span>}
              </div>

              {/* ══ 9. PAYMENTS ══ */}
              <Sec color="#10b981">{IC.dl} Payment Status</Sec>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:5}}>
                {(report.payments||[]).map((p,i)=>{const pd=(p||'').toLowerCase()==='paid';return (<div key={i} style={{textAlign:'center',padding:'5px 3px',borderRadius:7,border:'1px solid',borderColor:pd?'rgba(16,185,129,.18)':'rgba(253,28,0,.1)',background:pd?'rgba(16,185,129,.05)':'rgba(253,28,0,.03)'}}><div style={{fontSize:7,fontWeight:600,color:'rgba(255,255,255,.2)',textTransform:'uppercase'}}>Term {i+1}</div><div style={{fontSize:10,fontWeight:700,marginTop:1,color:pd?'#10b981':'#fd1c00'}}>{pd?'✓ Paid':'Pending'}</div></div>)})}
              </div>

              {/* ══ 10. PLACEMENT + STATUS ══ */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
                <div><Sec color="#fd1c00">{IC.bolt} Placement</Sec><div style={{padding:'9px 14px',borderRadius:9,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)'}}><div style={{fontSize:13,fontWeight:700,color:report.placement&&report.placement!=='Not yet placed'?'#10b981':'rgba(255,255,255,.25)'}}>{report.placement||'Not yet placed'}</div></div></div>
                <div><Sec color="#EEA727">{IC.grid} Status</Sec><div style={{padding:'9px 14px',borderRadius:9,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)'}}><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>Violations: <span style={{fontWeight:700,color:report.violations>0?'#fd1c00':'#10b981'}}>{report.violations||0}</span></div>{report.semesters?.length>0&&<div style={{fontSize:8,color:'rgba(255,255,255,.2)',marginTop:4}}>Semesters: {report.semesters.map((s2,i)=>`S${i+1}:${s2}`).join(' · ')}</div>}</div></div>
              </div>

            </div>

            {/* Footer */}
            <div style={{padding:'8px 20px',borderTop:'1px solid rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between',fontSize:8,color:'rgba(255,255,255,.18)'}}>
              <span>Technical Hub · Aditya University — ACET · AEC · ACOE</span>
              <span style={{fontWeight:600}}>Generated: {new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
            </div>
          </div>

          {/* Download bar */}
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14}}>
            <button onClick={()=>{setReport(null);setRoll('')}} style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,.3)',background:'none',border:'1px solid rgba(255,255,255,.07)',padding:'10px 20px',borderRadius:10,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>← Search Another</button>
            <button onClick={downloadPDF} disabled={gen} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:600,color:'#fff',background:'linear-gradient(135deg,#fd1c00,#c41600)',border:'none',padding:'10px 22px',borderRadius:10,cursor:gen?'wait':'pointer',fontFamily:"'DM Sans',sans-serif"}}>{IC.dl} {gen?'Generating...':'Download PDF'}</button>
          </div>
        </>}
      </div>
    );
  }
  // ═══ DASHBOARD ═══
  if (!mounted) return null
  const s = data?.stats || {}
  const pageLabel = NAV.find(n => n.id === activeTab)?.label || 'Overview'

  const css = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:hidden}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
@keyframes navIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}

/* ═══ LAYOUT ═══ */
.ad-layout{display:flex;height:100vh;overflow:hidden}

/* ═══ SIDEBAR — rounded, spacious, reference style ═══ */
.ad-sb{width:220px;flex-shrink:0;height:100vh;padding:20px 14px;display:flex;flex-direction:column;background:linear-gradient(180deg,#0c0818,#080412);position:relative;z-index:10}
.ad-sb-logo{display:flex;align-items:center;gap:10px;padding:0 10px;margin-bottom:36px}
.ad-sb-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#EEA727);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;box-shadow:0 0 20px rgba(253,28,0,.2)}
.ad-sb-brand{font-family:'Orbitron',sans-serif;font-size:.6rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.7)}
.ad-sb-sub{font-size:.52rem;color:rgba(255,255,255,.25);margin-top:2px}

/* Nav items — spacious with big gaps */
.ad-sb-nav{flex:1;display:flex;flex-direction:column;gap:6px;padding:0 4px}
.ad-sb-item{display:flex;align-items:center;gap:12px;padding:9px 16px;margin:2px 10px;border-radius:10px;border:none;cursor:pointer;background:none;color:rgba(255,255,255,.45);font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;transition:all .25s;width:calc(100% - 20px);text-align:left;animation:navIn .4s ease both;position:relative;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ad-sb-item span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
.ad-sb-item svg{flex-shrink:0;width:34px;height:34px;padding:8px;border-radius:9px;transition:all .25s}
.ad-sb-item:nth-child(1){animation-delay:0s}
.ad-sb-item:nth-child(2){animation-delay:.05s}
.ad-sb-item:nth-child(3){animation-delay:.1s}
.ad-sb-item:nth-child(4){animation-delay:.15s}
.ad-sb-item:nth-child(5){animation-delay:.2s}
.ad-sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
/* Active — white pill background like reference */
.ad-sb-item.on{color:#fff;background:linear-gradient(135deg,rgba(253,28,0,.12),rgba(250,160,0,.06));font-weight:600;position:relative}
.ad-sb-item.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fd1c00,#faa000);box-shadow:0 0 8px rgba(253,28,0,.4)}
.ad-sb-item.on svg{background:linear-gradient(135deg,#fd1c00,#faa000)!important;stroke:#fff!important;color:#fff!important;box-shadow:0 0 14px rgba(253,28,0,.2)}
.ad-sb-item:hover{background:rgba(255,255,255,.03)}
.ad-sb-item:hover svg{color:rgba(255,255,255,.65)}
.ad-sb-item svg{flex-shrink:0;opacity:.7;transition:opacity .2s}
.ad-sb-item.on svg{opacity:1;stroke:#fd1c00}

/* Bottom */
.ad-sb-bottom{padding-top:16px;border-top:1px solid rgba(255,255,255,.04);margin-top:auto}
.ad-sb-logout{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;border:none;cursor:pointer;background:none;color:rgba(255,255,255,.25);font-family:'DM Sans',sans-serif;font-size:.8rem;transition:all .2s;width:100%}
.ad-sb-logout:hover{color:#ff6040;background:rgba(255,40,0,.04)}

/* ═══ MOBILE SIDEBAR ═══ */
.ad-mob-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:998;backdrop-filter:blur(4px)}
.ad-mob-sb{position:fixed;left:0;top:0;bottom:0;width:260px;z-index:999;background:linear-gradient(180deg,#0c0818,#080412);display:flex;flex-direction:column;padding:20px 14px;animation:navIn .3s ease}

/* ═══ MAIN ═══ */
.ad-main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

/* Topbar */
.ad-topbar{display:flex;align-items:center;justify-content:space-between;padding:${isMobile?'12px 16px':'16px 28px'};border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0;background:rgba(5,0,8,.92);backdrop-filter:blur(16px)}
.ad-topbar-left{display:flex;align-items:center;gap:14px}
.ad-topbar-title{font-size:${isMobile?'1.05rem':'1.2rem'};font-weight:700;color:#fff}
.ad-topbar-crumb{font-size:.6rem;color:rgba(255,255,255,.2);margin-top:2px}
.ad-topbar-right{display:flex;align-items:center;gap:10px}
.ad-topbar-btn{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:all .2s;color:rgba(255,255,255,.35);position:relative}
.ad-topbar-btn:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.6)}
.ad-topbar-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#fd1c00;border:1.5px solid #050008}
.ad-topbar-av{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff}

/* Body */
.ad-body{flex:1;overflow-y:auto;padding:${isMobile?'16px':'24px 28px'}}
.ad-body::-webkit-scrollbar{width:4px}
.ad-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}

/* ═══ OVERVIEW CARDS ═══ */
.ad-stats{display:grid;grid-template-columns:repeat(${isMobile?2:4},1fr);gap:14px;margin-bottom:24px}
.ad-stat{padding:22px 18px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:countUp .5s ease both;position:relative;overflow:hidden}
.ad-stat:nth-child(2){animation-delay:.1s}.ad-stat:nth-child(3){animation-delay:.2s}.ad-stat:nth-child(4){animation-delay:.3s}
.ad-stat::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,var(--gw,.04) 0%,transparent 70%);pointer-events:none}
.ad-sv{font-size:2rem;font-weight:800;line-height:1}
.ad-sl{font-size:.62rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:600}

/* Progress */
.ad-prog{margin-bottom:24px;padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ad-prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ad-prog-title{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.55)}
.ad-prog-pct{font-size:1.15rem;font-weight:800;color:#fd1c00}
.ad-prog-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.ad-prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s cubic-bezier(.4,0,.2,1)}

/* Tech cards */
.ad-tg{display:grid;grid-template-columns:repeat(${isMobile?2:3},1fr);gap:12px;margin-bottom:24px}
.ad-tc{padding:16px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:12px}
.ad-td{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ad-tn{font-size:.76rem;font-weight:600;color:rgba(255,255,255,.7)}
.ad-ts{font-size:.62rem;color:rgba(255,255,255,.3);margin-top:2px}
.ad-tb{height:3px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:5px;overflow:hidden}
.ad-tbf{height:100%;border-radius:2px;transition:width .8s ease}

/* Recent */
.ad-rti{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.45);margin-bottom:12px;margin-top:24px;display:flex;align-items:center;gap:6px}
.ad-ri{display:flex;align-items:center;gap:14px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03);margin-bottom:7px}

/* ═══ MENTORS ═══ */
.ad-mg{display:grid;grid-template-columns:repeat(${isMobile?1:2},1fr);gap:14px}
.ad-mc{padding:18px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s}
.ad-mc:hover{border-color:rgba(255,255,255,.08)}.ad-mc.ex{border-color:rgba(253,28,0,.12)}
.ad-mh{display:flex;justify-content:space-between;align-items:center}
.ad-mna{font-size:.85rem;font-weight:600;color:#fff}
.ad-mb{font-size:.62rem;padding:3px 10px;border-radius:6px;font-weight:500}
.ad-mb.dn{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
.ad-mb.pe{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.ad-ms{display:flex;gap:16px;margin-top:8px;font-size:.7rem;color:rgba(255,255,255,.3)}
.ad-mr{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:8px;overflow:hidden}
.ad-mrf{height:100%;border-radius:2px;background:linear-gradient(90deg,#4ade80,#10b981);transition:width .6s ease}
.ad-mt{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:6px}
.ad-mi{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,.02);font-size:.72rem}
.ad-min{color:rgba(255,255,255,.55);flex:1}
.ad-mis{font-size:.62rem;padding:2px 8px;border-radius:4px}
.ad-mis.r{background:rgba(74,222,128,.08);color:#4ade80}.ad-mis.p{background:rgba(255,255,255,.04);color:rgba(255,255,255,.3)}

/* ═══ TEAMS TABLE ═══ */
.ad-fc{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.ad-fi{flex:1;min-width:200px;padding:9px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:#fff;font-size:.8rem;outline:none;font-family:'DM Sans',sans-serif}
.ad-fi:focus{border-color:rgba(253,28,0,.2)}.ad-fi::placeholder{color:rgba(255,255,255,.2)}
.ad-ff{padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:rgba(255,255,255,.5);font-size:.72rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.ad-ff:hover,.ad-ff.on{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.12);color:#fd1c00}
.ad-fn{font-size:.7rem;color:rgba(255,255,255,.2);margin-left:auto}
.ad-tt{width:100%;border-collapse:separate;border-spacing:0 5px}
.ad-tt th{text-align:left;padding:7px 12px;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1.5px}
.ad-tt td{padding:11px 12px;background:rgba(255,255,255,.015);border-top:1px solid rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.02);font-size:.76rem;color:rgba(255,255,255,.6)}
.ad-tt tr td:first-child{border-left:1px solid rgba(255,255,255,.02);border-radius:10px 0 0 10px}
.ad-tt tr td:last-child{border-right:1px solid rgba(255,255,255,.02);border-radius:0 10px 10px 0}
.ad-tt tr:hover td{background:rgba(255,255,255,.03)}
.ad-te{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.7rem;padding:4px 8px;border-radius:6px;font-family:'DM Sans',sans-serif}
.ad-tdl{padding:14px 18px;background:rgba(255,255,255,.01);border:1px solid rgba(255,255,255,.03);border-radius:12px;margin:4px 0 8px;font-size:.72rem;color:rgba(255,255,255,.4)}
.ad-tdg{display:grid;grid-template-columns:${isMobile?'1fr':'1fr 1fr'};gap:10px;margin-top:10px}
.ad-tdi{padding:10px;border-radius:8px;background:rgba(255,255,255,.02)}
.ad-tdla{font-size:.55rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.ad-tdv{font-size:.74rem;color:rgba(255,255,255,.6)}

/* ═══ ACTIONS ═══ */
.ad-ag{display:grid;grid-template-columns:repeat(${isMobile?1:2},1fr);gap:14px}
.ad-ac{padding:22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ad-ati{font-size:.85rem;font-weight:600;color:#fff;margin-bottom:5px;display:flex;align-items:center;gap:8px}
.ad-ad{font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:14px;line-height:1.5}
.ad-ab{padding:9px 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.ad-ab.pr{background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff}
.ad-ab.se{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.ad-ab:disabled{opacity:.5;cursor:not-allowed}
.ad-am{margin-top:10px;font-size:.72rem;padding:8px 12px;border-radius:8px;background:rgba(74,222,128,.06);color:#4ade80}

/* Report card shared */
.mp-card{padding:20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.mp-card-title{font-size:.85rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px}

@media(max-width:640px){.ad-stats{grid-template-columns:1fr 1fr}.ad-tg{grid-template-columns:1fr}.ad-fc{flex-direction:column}.ad-tt{display:block;overflow-x:auto}}
.adm-lb{animation:fadeUp .4s ease both}
.adm-lb-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.adm-lb-stat{padding:18px 16px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);text-align:center}
.adm-lb-sv{font-size:1.5rem;font-weight:800;line-height:1}
.adm-lb-sl{font-size:.55rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;font-weight:600}
.adm-lb-tbl{width:100%;border-collapse:separate;border-spacing:0 5px}
.adm-lb-tbl th{text-align:left;padding:7px 12px;font-size:.55rem;font-weight:600;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:1.5px}
.adm-lb-tbl td{padding:10px 12px;background:rgba(255,255,255,.015);border-top:1px solid rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.02);font-size:.76rem;color:rgba(255,255,255,.6)}
.adm-lb-tbl tr td:first-child{border-left:1px solid rgba(255,255,255,.02);border-radius:10px 0 0 10px}
.adm-lb-tbl tr td:last-child{border-right:1px solid rgba(255,255,255,.02);border-radius:0 10px 10px 0}
.adm-lb-tbl tr:hover td{background:rgba(255,255,255,.03)}
.adm-lb-rank{font-weight:800;font-size:.85rem}
.adm-lb-rank.gold{color:#f59e0b}.adm-lb-rank.silver{color:#94a3b8}.adm-lb-rank.bronze{color:#c68a5b}
.adm-lb-bar{width:80px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;display:inline-block;vertical-align:middle;margin-right:6px}
.adm-lb-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#4ade80)}
.adm-ms-card{padding:16px 18px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:10px;animation:fadeUp .4s ease both}
.adm-ms-card:hover{border-color:rgba(255,255,255,.08)}
.adm-ms-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.adm-ms-team{font-size:.85rem;font-weight:700;color:#fd1c00}
.adm-ms-stage{font-size:.76rem;font-weight:600;color:#fff}
.adm-ms-meta{font-size:.62rem;color:rgba(255,255,255,.25);margin-top:3px}
.adm-ms-badge{font-size:.58rem;padding:3px 10px;border-radius:6px;font-weight:600}
.adm-ms-badge.review{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.adm-ms-badge.approved{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
.adm-ms-badge.rejected{background:rgba(255,96,64,.08);color:#ff6040;border:1px solid rgba(255,96,64,.15)}
.adm-notif-wrap{position:relative;display:inline-block}
.adm-notif-btn{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.4);position:relative}
.adm-notif-btn:hover{background:rgba(255,255,255,.06);color:#fff}
.adm-notif-badge{position:absolute;top:3px;right:3px;min-width:14px;height:14px;border-radius:7px;background:#fd1c00;font-size:8px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid #050008}
.adm-notif-dd{position:absolute;top:42px;right:0;width:320px;background:#13101a;border:1px solid rgba(255,255,255,.08);border-radius:12px;z-index:100;box-shadow:0 12px 40px rgba(0,0,0,.6);max-height:340px;overflow-y:auto}
.adm-notif-dd-hdr{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.06);font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between}
.adm-notif-dd-mark{font-size:10px;color:#fd1c00;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif}
.adm-notif-item{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.03)}
.adm-notif-item.unread{background:rgba(253,28,0,.03)}
.adm-notif-item-t{font-size:11px;font-weight:600;color:#fff;margin-bottom:2px}
.adm-notif-item-m{font-size:10px;color:rgba(255,255,255,.3);line-height:1.4}
.adm-notif-item-time{font-size:9px;color:rgba(255,255,255,.15);margin-top:3px}
@media(max-width:900px){.adm-lb-stats{grid-template-columns:repeat(2,1fr)}.adm-lb-tbl{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;font-size:.7rem}.adm-lb-tbl td,.adm-lb-tbl th{padding:8px 10px;white-space:nowrap}}
`

  // Sidebar content (shared between desktop and mobile)
  const SidebarContent = ({onNav}) => <>
    <div className="ad-sb-logo">
      <div className="ad-sb-icon">PS</div>
      <div><div className="ad-sb-brand">ADMIN PANEL</div><div className="ad-sb-sub">Project Space · May 2026</div></div>
    </div>
    <div className="ad-sb-nav">
      {NAV.map(n => (
        <button key={n.id} className={`ad-sb-item ${activeTab===n.id?'on':''}`} onClick={() => { setActiveTab(n.id); onNav && onNav() }}>
          {n.icon} {n.label}
        </button>
      ))}
    </div>
    <div className="ad-sb-bottom">
      <button className="ad-sb-logout" onClick={handleLogout}>{IC.out} Logout</button>
    </div>
  </>

  return (
    <>
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
      <div className="ad-layout">
        {/* Desktop Sidebar */}
        {!isMobile && <nav className="ad-sb"><SidebarContent/></nav>}

        {/* Mobile Sidebar */}
        {isMobile && mobNav && <>
          <div className="ad-mob-overlay" onClick={() => setMobNav(false)} />
          <nav className="ad-mob-sb"><SidebarContent onNav={() => setMobNav(false)} /></nav>
        </>}

        {/* Main */}
        <div className="ad-main">
          <div className="ad-topbar">
            <div className="ad-topbar-left">
              {isMobile && <button onClick={() => setMobNav(true)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:4,display:'flex'}}>{IC.menu}</button>}
              <div><div className="ad-topbar-title">{pageLabel}</div><div className="ad-topbar-crumb">Project Space / {pageLabel}</div></div>
            </div>
            <div className="ad-topbar-right">
              <button className="ad-topbar-btn" onClick={fetchDashboard} title="Refresh">{IC.ref}</button>
              <div className="ad-topbar-btn">{IC.bell}<div className="ad-topbar-dot"/></div>
              <div className="ad-topbar-av">A</div>
            </div>
          </div>

          <div className="ad-body">
            {loading && !data && <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading dashboard...</div>}

            {/* OVERVIEW */}
            {data && activeTab === 'overview' && <>
              <div className="ad-stats">
                <div className="ad-stat" style={{'--gw':'rgba(253,28,0,.06)'}}><div className="ad-sv"><AnimNum value={s.totalTeams} color="#fd1c00"/></div><div className="ad-sl">Total Teams</div></div>
                <div className="ad-stat" style={{'--gw':'rgba(74,222,128,.06)'}}><div className="ad-sv"><AnimNum value={s.registeredCount} color="#4ade80"/></div><div className="ad-sl">Registered</div></div>
                <div className="ad-stat" style={{'--gw':'rgba(238,167,39,.06)'}}><div className="ad-sv"><AnimNum value={s.pendingCount} color="#EEA727"/></div><div className="ad-sl">Pending</div></div>
                <div className="ad-stat" style={{'--gw':'rgba(59,130,246,.06)'}}><div className="ad-sv"><AnimNum value={s.accountsCreated} color="#3b82f6"/></div><div className="ad-sl">Accounts</div></div>
              </div>
              <div className="ad-prog"><div className="ad-prog-hdr"><span className="ad-prog-title">Registration Progress</span><span className="ad-prog-pct">{s.progressPercent}%</span></div><div className="ad-prog-bar"><div className="ad-prog-fill" style={{width:`${s.progressPercent}%`}}/></div></div>
              <div className="ad-tg">{Object.entries(data.techBreakdown||{}).map(([t,v])=><div key={t} className="ad-tc"><div className="ad-td" style={{background:TC[t]||'#888'}}/><div style={{flex:1}}><div className="ad-tn">{t}</div><div className="ad-ts">{v.registered}/{v.total} registered</div><div className="ad-tb"><div className="ad-tbf" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`,background:TC[t]||'#888'}}/></div></div></div>)}</div>
              <div className="ad-rti">{IC.clk} Recent Registrations</div>
              {(data.recentRegistrations||[]).map((r,i)=><div key={i} className="ad-ri"><div style={{fontSize:'.82rem',fontWeight:700,color:'#fd1c00',minWidth:58}}>{r.teamNumber}</div><div><div style={{fontSize:'.76rem',fontWeight:500,color:'rgba(255,255,255,.65)'}}>{r.projectTitle}</div><div style={{fontSize:'.62rem',color:'rgba(255,255,255,.25)',marginTop:1}}>{r.technology}</div></div><div style={{fontSize:'.62rem',color:'rgba(255,255,255,.15)',whiteSpace:'nowrap',marginLeft:'auto'}}>{r.registeredAt?new Date(r.registeredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div></div>)}
            </>}

            {/* MENTORS */}
            {data && activeTab === 'mentors' && <div className="ad-mg">{Object.entries(data.mentorBreakdown||{}).sort((a,b)=>b[1].total-a[1].total).map(([name,v])=><div key={name} className={`ad-mc ${expandedMentor===name?'ex':''}`} onClick={()=>setExpandedMentor(expandedMentor===name?null:name)}><div className="ad-mh"><div className="ad-mna">{name}</div><div className={`ad-mb ${v.registered===v.total?'dn':'pe'}`}>{v.registered===v.total?'✓ All Done':`${v.pending} pending`}</div></div><div className="ad-ms"><span>{v.total} teams</span><span>{v.registered} registered</span><span>{v.pending} pending</span></div><div className="ad-mr"><div className="ad-mrf" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`}}/></div>{expandedMentor===name&&<div className="ad-mt">{v.teams.map(t=><div key={t.serialNumber} className="ad-mi"><span className="ad-min">#{t.serialNumber} {t.projectTitle||t.leaderName} {!t.registered&&t.leaderPhone&&t.leaderPhone.length>=10&&<a href={`tel:${t.leaderPhone}`} onClick={e=>e.stopPropagation()} style={{color:'#4ade80',textDecoration:'none',marginLeft:4}} title={t.leaderPhone}>{IC.ph}</a>}</span><span className={`ad-mis ${t.registered?'r':'p'}`}>{t.registered?'Registered':'Pending'}</span></div>)}</div>}</div>)}</div>}

            {/* TEAMS */}
            {data && activeTab === 'teams' && <><div className="ad-fc"><input className="ad-fi" placeholder="Search teams, projects, leaders..." value={search} onChange={e=>setSearch(e.target.value)}/><button className={`ad-ff ${filterStatus==='all'?'on':''}`} onClick={()=>setFilterStatus('all')}>All</button><button className={`ad-ff ${filterStatus==='registered'?'on':''}`} onClick={()=>setFilterStatus('registered')}>Registered</button><button className={`ad-ff ${filterStatus==='pending'?'on':''}`} onClick={()=>setFilterStatus('pending')}>Pending</button><select className="ad-ff" value={filterTech} onChange={e=>setFilterTech(e.target.value)} style={{appearance:'auto'}}><option value="all">All Technologies</option>{Object.keys(data.techBreakdown||{}).map(t=><option key={t} value={t}>{t}</option>)}</select><span className="ad-fn">{filteredTeams.length} teams</span></div><table className="ad-tt"><thead><tr><th>#</th><th>Team</th><th>Project</th><th>Technology</th><th>Leader</th><th>Mentor</th><th>Status</th><th></th></tr></thead><tbody>{filteredTeams.map(t=><React.Fragment key={t.serialNumber}><tr><td style={{fontWeight:600,color:'rgba(255,255,255,.3)'}}>{t.serialNumber}</td><td style={{fontWeight:600,color:'#fd1c00'}}>{t.teamNumber||'—'}</td><td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.projectTitle||'—'}</td><td><span style={{fontSize:'.62rem',padding:'3px 8px',borderRadius:6,background:`${TC[t.technology]||'#888'}15`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>{t.technology}</span></td><td><span>{t.leaderName}</span>{t.leaderPhone&&t.leaderPhone.length>=10&&<a href={`tel:${t.leaderPhone}`} style={{marginLeft:6,color:'rgba(255,255,255,.2)',textDecoration:'none'}} title={t.leaderPhone}>{IC.ph}</a>}</td><td style={{color:'rgba(255,255,255,.3)'}}>{t.mentorAssigned||'—'}</td><td><span style={{fontSize:'.65rem',padding:'3px 10px',borderRadius:6,fontWeight:500,background:t.registered?'rgba(74,222,128,.08)':'rgba(255,255,255,.04)',color:t.registered?'#4ade80':'rgba(255,255,255,.3)'}}>{t.registered?'✓ Registered':'Pending'}</span></td><td><button className="ad-te" onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>{expandedTeam===t.serialNumber?'▲':'▼'}</button></td></tr>{expandedTeam===t.serialNumber&&<tr><td colSpan={8}><div className="ad-tdl"><div style={{fontWeight:600,color:'rgba(255,255,255,.55)',marginBottom:8}}>{t.projectTitle}</div>{t.projectDescription&&<div style={{marginBottom:8,lineHeight:1.5}}>{t.projectDescription}</div>}<div className="ad-tdg"><div className="ad-tdi"><div className="ad-tdla">Problem Statement</div><div className="ad-tdv">{t.problemStatement||'—'}</div></div><div className="ad-tdi"><div className="ad-tdla">AI Usage</div><div className="ad-tdv">{t.aiUsage}</div></div><div className="ad-tdi"><div className="ad-tdla">Tech Stack</div><div className="ad-tdv">{(t.techStack||[]).join(', ')||'—'}</div></div><div className="ad-tdi"><div className="ad-tdla">Members ({t.memberCount})</div><div className="ad-tdv">{(t.members||[]).map(m=>`${m.name}${m.isLeader?' ★':''}`).join(', ')}</div></div></div></div></td></tr>}</React.Fragment>)}</tbody></table></>}

            {/* PROJECT STATUS */}
            {activeTab === 'milestones' && <div className="adm-lb">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <div><div style={{fontSize:'1.1rem',fontWeight:700,color:'#fff'}}>Project Status</div><div style={{fontSize:'.72rem',color:'rgba(255,255,255,.3)',marginTop:2}}>All milestone submissions across teams</div></div>
                <div className="adm-notif-wrap">
                  <div className="adm-notif-btn" onClick={()=>setShowAdNotif(!showAdNotif)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>{adUnread>0&&<div className="adm-notif-badge">{adUnread}</div>}</div>
                  {showAdNotif&&<div className="adm-notif-dd" onClick={e=>e.stopPropagation()}><div className="adm-notif-dd-hdr"><span>Activity</span>{adUnread>0&&<button className="adm-notif-dd-mark" onClick={markAdNotifsRead}>Mark all read</button>}</div>{adNotifs.length===0?<div style={{padding:20,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.15)'}}>No activity</div>:adNotifs.map(n=><div key={n.id} className={`adm-notif-item ${!n.read?'unread':''}`}><div className="adm-notif-item-t">{n.title}</div><div className="adm-notif-item-m">{n.message}</div><div className="adm-notif-item-time">{new Date(n.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div>)}</div>}
                </div>
              </div>

              <div style={{overflowX:'auto'}}>
                <table className="adm-lb-tbl" style={{minWidth:900}}>
                  <thead><tr><th>Team</th><th>Project</th><th>Leader</th><th>Stage</th><th>Review Sent</th><th>Mentor</th><th>Status</th><th>Action</th><th>Comments</th><th>Approved/Rejected</th><th>Time Taken</th></tr></thead>
                  <tbody>
                    {adNotifs.length===0&&<tr><td colSpan={11} style={{textAlign:'center',padding:30,color:'rgba(255,255,255,.15)'}}>No milestone activity yet</td></tr>}
                    {adNotifs.map((n,i)=>{
                      const reviewTime = n.created_at ? new Date(n.created_at) : null;
                      const isApproved = n.type==='approved';
                      const isRejected = n.type==='rejected';
                      const isReview = n.type==='review-request';
                      return <tr key={n.id}>
                        <td style={{fontWeight:700,color:'#fd1c00'}}>{n.team_number||'—'}</td>
                        <td style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'rgba(255,255,255,.5)'}}>{n.message?.split('marked')[0]?.trim()||'—'}</td>
                        <td style={{fontSize:'.7rem',color:'rgba(255,255,255,.4)'}}>{n.message?.match(/Submitted by (.+?)[\.\,]/)?.[1]||'—'}</td>
                        <td><span style={{fontSize:'.62rem',padding:'2px 8px',borderRadius:5,background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.5)'}}>S-{n.stage_number}</span></td>
                        <td style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)'}}>{reviewTime?reviewTime.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</td>
                        <td style={{fontSize:'.7rem',color:'rgba(255,255,255,.4)'}}>{n.message?.match(/Mentor: (.+?)$/)?.[1]||n.title?.match(/by (.+?)$/)?.[1]||'—'}</td>
                        <td><span className={`adm-ms-badge ${isReview?'review':isApproved?'approved':'rejected'}`}>{isReview?'In Review':isApproved?'Approved':'Rejected'}</span></td>
                        <td style={{fontSize:'.68rem',color:'rgba(255,255,255,.4)'}}>{isApproved?'Approved':isRejected?'Rejected':isReview?'Pending':'—'}</td>
                        <td style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{isRejected?(n.message||'—'):'—'}</td>
                        <td style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)'}}>{(isApproved||isRejected)?reviewTime?.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</td>
                        <td style={{fontSize:'.65rem',color:'rgba(255,255,255,.3)'}}>{(isApproved||isRejected)&&reviewTime?'—':'—'}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>}

            {/* LEADERBOARD */}
            {activeTab === 'leaderboard' && <div className="adm-lb">
              <div style={{fontSize:'1.1rem',fontWeight:700,color:'#fff',marginBottom:4}}>Leaderboard</div>
              <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.3)',marginBottom:20}}>All teams ranked by project completion progress</div>
              <div className="adm-lb-stats"><div className="adm-lb-stat"><div className="adm-lb-sv" style={{color:'#fd1c00'}}>{adLeaderboard.stats?.total_teams||0}</div><div className="adm-lb-sl">Total Teams</div></div><div className="adm-lb-stat"><div className="adm-lb-sv" style={{color:'#4ade80'}}>{adLeaderboard.stats?.teams_all_done||0}</div><div className="adm-lb-sl">All Complete</div></div><div className="adm-lb-stat"><div className="adm-lb-sv" style={{color:'#EEA727'}}>{adLeaderboard.stats?.avg_progress||0}%</div><div className="adm-lb-sl">Avg Progress</div></div><div className="adm-lb-stat"><div className="adm-lb-sv" style={{color:'#3b82f6'}}>{adLeaderboard.stats?.total_completed_stages||0}</div><div className="adm-lb-sl">Stages Done</div></div></div>
              {adLbLoading&&<div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,.2)'}}>Loading...</div>}
              {!adLbLoading&&<table className="adm-lb-tbl"><thead><tr><th>Rank</th><th>Team</th><th>Project</th><th>Technology</th><th>Mentor</th><th>Progress</th><th>Credits</th></tr></thead><tbody>{(adLeaderboard.leaderboard||[]).map(t=><tr key={t.team_number}><td><span className={`adm-lb-rank ${t.rank===1?'gold':t.rank===2?'silver':t.rank===3?'bronze':''}`}>#{t.rank}</span></td><td style={{fontWeight:700,color:'#fd1c00'}}>{t.team_number}</td><td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.project_title||'—'}</td><td><span style={{fontSize:'.6rem',padding:'2px 8px',borderRadius:5,background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.45)'}}>{t.technology}</span></td><td style={{fontSize:'.7rem',color:'rgba(255,255,255,.35)'}}>{t.mentor||'—'}</td><td><div className="adm-lb-bar"><div className="adm-lb-bar-fill" style={{width:`${t.percent}%`}}/></div><span style={{fontSize:'.72rem',fontWeight:700,color:t.percent>=70?'#4ade80':t.percent>=40?'#EEA727':'rgba(255,255,255,.3)'}}>{t.completed_stages}/7</span></td><td style={{fontWeight:700,color:'#EEA727'}}>{t.total_credits}</td></tr>)}</tbody></table>}
            </div>}

            {/* LINKEDIN STATS */}
            {activeTab === 'linkedin-stats' && (
              <div className="li-stats-wrap">
                <style>{`
.li-stats-wrap{animation:fadeUp .5s ease both}
.li-title{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:6px}
.li-sub{font-size:.72rem;color:rgba(255,255,255,.35);margin-bottom:22px}
.li-tabs{display:flex;gap:6px;padding:6px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:22px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.li-tabs::-webkit-scrollbar{display:none}
.li-tab{padding:10px 18px;border-radius:10px;background:transparent;border:1px solid transparent;color:rgba(255,255,255,.45);font-family:'DM Sans',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;display:flex;align-items:center;gap:7px}
.li-tab:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.03)}
.li-tab.on{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08));border-color:rgba(253,28,0,.3);color:#fff;box-shadow:0 2px 12px rgba(253,28,0,.1)}
.li-tab svg{width:15px;height:15px;stroke-width:1.8}
.li-subtabs{display:flex;gap:4px;padding:4px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:18px;width:fit-content}
.li-tech-pills{display:flex;gap:6px;padding:4px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:18px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.li-tech-pills::-webkit-scrollbar{display:none}
.li-tech-pill{padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.55);font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:7px;flex-shrink:0}
.li-tech-pill:hover{background:rgba(255,255,255,.05);color:#fff}
.li-tech-pill.on{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(253,28,0,.06));border-color:rgba(253,28,0,.4);color:#fff;box-shadow:0 2px 10px rgba(253,28,0,.15)}
.li-tech-pill .li-pill-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.li-subtab{padding:8px 16px;border-radius:7px;background:transparent;border:none;color:rgba(255,255,255,.45);font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.li-subtab:hover{color:rgba(255,255,255,.85)}
.li-subtab.on{background:rgba(253,28,0,.14);color:#fd1c00}
.li-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:26px}
.li-stat{padding:20px 22px;border-radius:14px;background:linear-gradient(135deg,rgba(12,8,20,.8),rgba(18,12,28,.6));border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden;transition:all .25s}
.li-stat:hover{border-color:rgba(255,255,255,.14);transform:translateY(-2px)}
.li-stat::after{content:'';position:absolute;top:0;right:0;width:80px;height:80px;border-radius:50%;filter:blur(30px);opacity:.15;background:var(--ac,#fd1c00);pointer-events:none}
.li-stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.li-stat-ic{width:34px;height:34px;border-radius:10px;background:rgba(var(--ac-rgb,253,28,0),.1);border:1px solid rgba(var(--ac-rgb,253,28,0),.22);display:flex;align-items:center;justify-content:center;color:var(--ac,#fd1c00)}
.li-stat-ic svg{width:18px;height:18px}
.li-stat-lb{font-size:.58rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px;line-height:1.3}
.li-stat-val{font-family:'Orbitron',sans-serif;font-size:2rem;font-weight:800;color:var(--ac,#fd1c00);line-height:1;margin-bottom:8px}
.li-stat-sub{font-size:.66rem;color:rgba(255,255,255,.4)}
.li-bar{margin-top:10px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.li-bar-f{height:100%;border-radius:3px;background:var(--ac,#fd1c00);transition:width .8s cubic-bezier(.22,1,.36,1)}
.li-table-wrap{background:rgba(12,8,20,.3);border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.06);margin-bottom:16px}
.li-table{width:100%;border-collapse:collapse}
.li-table th{padding:12px 16px;text-align:left;font-size:.58rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,.35);font-weight:700;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
.li-table td{padding:12px 16px;font-size:.76rem;color:rgba(255,255,255,.78);border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
.li-table tr:last-child td{border-bottom:none}
.li-table tr:hover td{background:rgba(255,255,255,.02)}
.li-pill{padding:3px 10px;border-radius:6px;font-size:.58rem;font-weight:700;letter-spacing:.5px;display:inline-flex;align-items:center;gap:4px}
.li-pill svg{width:10px;height:10px;stroke-width:2.5}
.li-pill.done{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.22)}
.li-pill.partial{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.22)}
.li-pill.none{background:rgba(255,255,255,.03);color:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.08)}
.li-pill.leader{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.2)}
.li-pill.member{background:rgba(59,130,246,.08);color:#60a5fa;border:1px solid rgba(59,130,246,.2)}
.li-pill.mentor{background:rgba(167,139,250,.08);color:#a78bfa;border:1px solid rgba(167,139,250,.22)}
.li-pill.trainee{background:rgba(96,165,250,.08);color:#60a5fa;border:1px solid rgba(96,165,250,.22)}
.li-search{padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.76rem;outline:none;width:100%;max-width:380px;margin-bottom:14px}
.li-search:focus{border-color:rgba(253,28,0,.3);background:rgba(255,255,255,.05)}
.li-empty{padding:40px;text-align:center;color:rgba(255,255,255,.25);font-size:.78rem}
.li-section{margin-top:28px}
.li-section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap}
.li-section-title{font-family:'Orbitron',sans-serif;font-size:.88rem;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.9);display:flex;align-items:center;gap:10px}
.li-section-title svg{width:16px;height:16px;color:#fd1c00}
.li-section-meta{font-size:.66rem;color:rgba(255,255,255,.35)}
.li-mini-tabs{display:inline-flex;gap:4px;padding:3px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.li-mini-tab{padding:6px 12px;border-radius:6px;background:transparent;border:none;color:rgba(255,255,255,.4);font-family:'DM Sans',sans-serif;font-size:.66rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.li-mini-tab.on{background:rgba(253,28,0,.15);color:#fd1c00}
.li-tech-card{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:8px;transition:all .25s}
.li-tech-card:hover{border-color:rgba(255,255,255,.14);transform:translateX(3px)}
.li-tech-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;box-shadow:0 0 8px currentColor}
.li-tech-info{flex:1;min-width:0}
.li-tech-name{font-size:.84rem;font-weight:700;color:#fff;margin-bottom:4px}
.li-tech-desc{font-size:.64rem;color:rgba(255,255,255,.4)}
.li-tech-bar-wrap{flex:1;max-width:200px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
.li-tech-bar{height:100%;border-radius:3px;transition:width .6s}
.li-tech-count{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:800;min-width:70px;text-align:right;line-height:1}
.li-tech-pct{font-size:.62rem;color:rgba(255,255,255,.4);margin-top:2px;text-align:right}
.li-member-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:4px}
.li-member-row:hover{background:rgba(255,255,255,.04)}
.li-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#fd1c00,#EEA727);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.7rem;flex-shrink:0}
.li-member-name{font-size:.78rem;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.li-member-roll{font-size:.58rem;color:rgba(255,255,255,.35);margin-top:1px}
.li-team-expand-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5);padding:5px 10px;border-radius:6px;font-size:.6rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.li-team-expand-btn:hover{background:rgba(255,255,255,.08);color:#fff}
.li-team-details{padding:12px 16px;background:rgba(255,255,255,.02);border-radius:10px;margin-top:4px}
.li-team-members-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px;margin-top:8px}
.li-team-member-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);font-size:.68rem}
.li-team-member-item.posted{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.2)}
.li-team-member-item.pending{background:rgba(238,167,39,.04);border-color:rgba(238,167,39,.14)}
@media(max-width:768px){
  .li-table{font-size:.66rem}
  .li-table th,.li-table td{padding:8px 10px}
  .li-tab{padding:8px 12px;font-size:.66rem}
  .li-stat-val{font-size:1.5rem}
  .li-grid{grid-template-columns:repeat(2,1fr)}
  .li-section-hdr{flex-direction:column;align-items:flex-start}
}
@media(max-width:480px){
  .li-grid{grid-template-columns:1fr}
  .li-tech-bar-wrap{display:none}
}
                `}</style>

                <div className="li-title">LINKEDIN STATS</div>
                <div className="li-sub">Track LinkedIn engagement across the entire event</div>

                <div className="li-tabs">
                  <button className={`li-tab ${liTab==='overview'?'on':''}`} onClick={()=>{setLiTab('overview');setLiSearch('');setLiTechFilter('all')}}>{IC.grid}Overview</button>
                  <button className={`li-tab ${liTab==='mentors'?'on':''}`} onClick={()=>{setLiTab('mentors');setLiSearch('');setLiTechFilter('all')}}>{IC.users}Mentor Posts</button>
                  <button className={`li-tab ${liTab==='trainees'?'on':''}`} onClick={()=>{setLiTab('trainees');setLiSearch('');setLiTechFilter('all')}}>{IC.user}Trainee Posts</button>
                  <button className={`li-tab ${liTab==='teams'?'on':''}`} onClick={()=>{setLiTab('teams');setLiSearch('');setLiTechFilter('all')}}>{IC.group}Team Posts</button>
                </div>

                {liLoading && <div className="li-empty">Loading stats...</div>}
                {!liLoading && !liStats && <div className="li-empty">No data yet</div>}

                {!liLoading && liStats && liTab !== 'overview' && (() => {
                  const TC = { 'AWS Development':'#ff9900','Google Flutter':'#42a5f5','Full Stack':'#4ade80','Data Specialist':'#a78bfa','ServiceNow':'#22c55e','VLSI':'#ef4444','SkillUp Coder':'#f59e0b' }
                  const allTeams = liStats.allTeams || []
                  const recent = liStats.recent || []
                  let counts = {}
                  let allCount = 0
                  if (liTab === 'mentors') {
                    recent.filter(r=>r.posted_by_role==='mentor').forEach(r=>{const t=r.technology||'Unknown';counts[t]=(counts[t]||0)+1})
                    allCount = recent.filter(r=>r.posted_by_role==='mentor').length
                  } else if (liTab === 'trainees') {
                    recent.filter(r=>r.posted_by_role==='student').forEach(r=>{const t=r.technology||'Unknown';counts[t]=(counts[t]||0)+1})
                    allCount = recent.filter(r=>r.posted_by_role==='student').length
                  } else if (liTab === 'teams') {
                    allTeams.filter(t=>{const s=liStats.teamBreakdown[t.teamNumber]?.shares||[];return s.length>=(t.memberCount||0)&&t.memberCount>0}).forEach(t=>{const tech=t.technology||'Unknown';counts[tech]=(counts[tech]||0)+1})
                    allCount = Object.values(counts).reduce((a,b)=>a+b,0)
                  }
                  const techKeys = Object.keys(counts).sort((a,b) => counts[b] - counts[a])
                  return (
                    <div className="li-tech-pills">
                      <button className={`li-tech-pill ${liTechFilter==='all'?'on':''}`} onClick={()=>setLiTechFilter('all')}>
                        <span className="li-pill-dot" style={{background:'#fd1c00'}}/> All ({allCount})
                      </button>
                      {techKeys.map(tech => (
                        <button key={tech} className={`li-tech-pill ${liTechFilter===tech?'on':''}`} onClick={()=>setLiTechFilter(tech)} style={liTechFilter===tech?{borderColor:`${TC[tech]||'#888'}60`,background:`${TC[tech]||'#888'}15`}:{}}>
                          <span className="li-pill-dot" style={{background:TC[tech]||'#888'}}/> {tech} ({counts[tech]})
                        </button>
                      ))}
                    </div>
                  )
                })()}

                {!liLoading && liStats && liTab==='overview' && (() => {
                  const s = liStats.stats || {}
                  const allTeams = liStats.allTeams || []
                  const totalStudents = allTeams.reduce((sum,t) => sum + (t.memberCount || 0), 0)
                  const totalMentors = Object.keys(data?.mentorBreakdown || {}).length
                  const totalExpected = totalStudents + totalMentors
                  const teamsFullyPosted = (liStats.allTeams || []).filter(t => {
                    const shares = liStats.teamBreakdown[t.teamNumber]?.shares || []
                    return shares.length >= (t.memberCount || 0) && t.memberCount > 0
                  }).length
                  const byTech = s.byTech || {}
                  const TC = { 'AWS Development':'#ff9900','Google Flutter':'#42a5f5','Full Stack':'#4ade80','Data Specialist':'#a78bfa','ServiceNow':'#22c55e','VLSI':'#ef4444','SkillUp Coder':'#f59e0b' }

                  // Tech-wise team coverage
                  const techTeamCoverage = {}
                  allTeams.forEach(t => {
                    const tech = t.technology
                    if (!tech) return
                    if (!techTeamCoverage[tech]) techTeamCoverage[tech] = { total: 0, full: 0 }
                    techTeamCoverage[tech].total++
                    const shares = liStats.teamBreakdown[t.teamNumber]?.shares || []
                    if (shares.length >= (t.memberCount || 0) && t.memberCount > 0) techTeamCoverage[tech].full++
                  })

                  // Recent posts split by role + tech filter
                  const recentTab = liRecentTab || 'trainees'
                  const recentFiltered = (liStats.recent || []).filter(r => {
                    if (recentTab === 'mentors' ? r.posted_by_role !== 'mentor' : r.posted_by_role !== 'student') return false
                    if (liTechFilter !== 'all' && r.technology !== liTechFilter) return false
                    return true
                  }).slice(0, 10)

                  return <>
                    <div className="li-grid">
                      <div className="li-stat" style={{'--ac':'#fd1c00','--ac-rgb':'253,28,0'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.target}</div></div>
                        <div className="li-stat-lb">Total Posts Expected</div>
                        <div className="li-stat-val">{totalExpected}</div>
                        <div className="li-stat-sub">{totalStudents} students + {totalMentors} mentors</div>
                      </div>
                      <div className="li-stat" style={{'--ac':'#4ade80','--ac-rgb':'74,222,128'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.check}</div></div>
                        <div className="li-stat-lb">Total Posts Done</div>
                        <div className="li-stat-val">{s.total || 0}</div>
                        <div className="li-bar"><div className="li-bar-f" style={{width:`${totalExpected>0?Math.round((s.total||0)/totalExpected*100):0}%`}}/></div>
                      </div>
                      <div className="li-stat" style={{'--ac':'#a78bfa','--ac-rgb':'167,139,250'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.users}</div></div>
                        <div className="li-stat-lb">Mentor Posts</div>
                        <div className="li-stat-val">{s.mentors || 0}<span style={{fontSize:'.8rem',color:'rgba(255,255,255,.3)',marginLeft:6}}>/ {totalMentors}</span></div>
                        <div className="li-bar"><div className="li-bar-f" style={{width:`${totalMentors>0?Math.round((s.mentors||0)/totalMentors*100):0}%`}}/></div>
                      </div>
                      <div className="li-stat" style={{'--ac':'#60a5fa','--ac-rgb':'96,165,250'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.user}</div></div>
                        <div className="li-stat-lb">Trainee Posts</div>
                        <div className="li-stat-val">{s.students || 0}<span style={{fontSize:'.8rem',color:'rgba(255,255,255,.3)',marginLeft:6}}>/ {totalStudents}</span></div>
                        <div className="li-bar"><div className="li-bar-f" style={{width:`${totalStudents>0?Math.round((s.students||0)/totalStudents*100):0}%`}}/></div>
                      </div>
                      <div className="li-stat" style={{'--ac':'#EEA727','--ac-rgb':'238,167,39'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.group}</div></div>
                        <div className="li-stat-lb">Teams Fully Posted</div>
                        <div className="li-stat-val">{teamsFullyPosted}<span style={{fontSize:'.8rem',color:'rgba(255,255,255,.3)',marginLeft:6}}>/ {allTeams.length}</span></div>
                        <div className="li-bar"><div className="li-bar-f" style={{width:`${allTeams.length>0?Math.round(teamsFullyPosted/allTeams.length*100):0}%`}}/></div>
                      </div>
                      <div className="li-stat" style={{'--ac':'#22d3ee','--ac-rgb':'34,211,238'}}>
                        <div className="li-stat-top"><div className="li-stat-ic">{IC.cpu}</div></div>
                        <div className="li-stat-lb">Technologies Active</div>
                        <div className="li-stat-val">{Object.keys(byTech).length}</div>
                        <div className="li-stat-sub">Tech tracks posting</div>
                      </div>
                    </div>

                    {/* Recent Posts */}
                    <div className="li-section">
                      <div className="li-section-hdr">
                        <div className="li-section-title">{IC.clk}Recent Posts (Last 10)</div>
                        <div className="li-mini-tabs">
                          <button className={`li-mini-tab ${recentTab==='trainees'?'on':''}`} onClick={()=>setLiRecentTab('trainees')}>Trainees</button>
                          <button className={`li-mini-tab ${recentTab==='mentors'?'on':''}`} onClick={()=>setLiRecentTab('mentors')}>Mentors</button>
                        </div>
                      </div>
                      {recentFiltered.length === 0 ? <div className="li-empty">No recent {recentTab === 'mentors' ? 'mentor' : 'trainee'} posts</div> : (
                        <div className="li-table-wrap">
                          <table className="li-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                {recentTab === 'trainees' && <th>Role</th>}
                                <th>Team</th>
                                <th>Technology</th>
                                <th>Posted At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentFiltered.map(r => {
                                let isLeader = false
                                if (recentTab === 'trainees') {
                                  const team = liStats.teamMap[r.team_number]
                                  if (team) isLeader = (team.members || []).some(m => (m.rollNumber || '').toUpperCase() === (r.roll_number || '').toUpperCase() && m.isLeader)
                                }
                                return <tr key={r.id}>
                                  <td style={{color:'#fff',fontWeight:600}}>{r.posted_by_name || r.roll_number}</td>
                                  {recentTab === 'trainees' && <td><span className={`li-pill ${isLeader?'leader':'member'}`}>{isLeader?'Leader':'Member'}</span></td>}
                                  <td style={{color:'#fd1c00',fontWeight:600}}>{r.team_number}</td>
                                  <td style={{fontSize:'.68rem',color:'rgba(255,255,255,.55)'}}>{r.technology || '—'}</td>
                                  <td style={{color:'rgba(255,255,255,.35)',fontSize:'.66rem'}}>{new Date(r.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                                </tr>
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Tech-wise team coverage */}
                    <div className="li-section">
                      <div className="li-section-hdr">
                        <div className="li-section-title">{IC.cpu}Technology-wise Team Coverage</div>
                        <div className="li-section-meta">Teams where all members posted</div>
                      </div>
                      {Object.entries(techTeamCoverage).sort(([,a],[,b])=>(b.full/b.total||0)-(a.full/a.total||0)).map(([tech, d]) => {
                        const pct = d.total > 0 ? Math.round(d.full/d.total*100) : 0
                        return <div key={tech} className="li-tech-card">
                          <div className="li-tech-dot" style={{background:TC[tech]||'#888',color:TC[tech]||'#888'}}/>
                          <div className="li-tech-info">
                            <div className="li-tech-name">{tech}</div>
                            <div className="li-tech-desc">{d.full} of {d.total} teams completed</div>
                          </div>
                          <div className="li-tech-bar-wrap"><div className="li-tech-bar" style={{width:`${pct}%`,background:TC[tech]||'#888'}}/></div>
                          <div>
                            <div className="li-tech-count" style={{color:TC[tech]||'#fff'}}>{d.full}/{d.total}</div>
                            <div className="li-tech-pct">{pct}%</div>
                          </div>
                        </div>
                      })}
                      {Object.keys(techTeamCoverage).length === 0 && <div className="li-empty">No tech data</div>}
                    </div>
                  </>
                })()}

                {!liLoading && liStats && liTab==='mentors' && (() => {
                  const recent = liStats.recent || []
                  const q = liSearch.toLowerCase()
                  const mentorPosts = recent.filter(r => r.posted_by_role === 'mentor' && (liTechFilter==='all' || r.technology === liTechFilter) && (!q || (r.posted_by_name||'').toLowerCase().includes(q) || (r.team_number||'').toLowerCase().includes(q)))
                  return <>
                    <input className="li-search" placeholder="Search mentor, team..." value={liSearch} onChange={e=>setLiSearch(e.target.value)} />
                    <div style={{fontSize:'.68rem',color:'rgba(255,255,255,.35)',marginBottom:10}}>{mentorPosts.length} mentor posts</div>
                    {mentorPosts.length === 0 ? <div className="li-empty">No mentor posts yet</div> : (
                      <div className="li-table-wrap">
                        <table className="li-table"><thead><tr><th>Mentor</th><th>Team</th><th>Technology</th><th>Posted At</th></tr></thead><tbody>
                          {mentorPosts.map(r => (
                            <tr key={r.id}>
                              <td style={{color:'#fff',fontWeight:600}}>{r.posted_by_name}</td>
                              <td style={{color:'#fd1c00',fontWeight:600}}>{r.team_number}</td>
                              <td style={{fontSize:'.68rem'}}>{r.technology || '—'}</td>
                              <td style={{color:'rgba(255,255,255,.35)',fontSize:'.66rem'}}>{new Date(r.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                  </>
                })()}

                {!liLoading && liStats && liTab==='trainees' && (() => {
                  const recent = liStats.recent || []
                  const q = liSearch.toLowerCase()
                  const leaderMap = {}
                  ;(liStats.allTeams || []).forEach(t => {
                    ;(t.members || []).forEach(m => { if (m.isLeader) leaderMap[(m.rollNumber || '').toUpperCase()] = true })
                  })
                  const traineePosts = recent.filter(r => r.posted_by_role === 'student' && (liTechFilter==='all' || r.technology === liTechFilter) && (!q || (r.posted_by_name||'').toLowerCase().includes(q) || (r.roll_number||'').toLowerCase().includes(q) || (r.team_number||'').toLowerCase().includes(q)))
                  return <>
                    <input className="li-search" placeholder="Search name, roll, team..." value={liSearch} onChange={e=>setLiSearch(e.target.value)} />
                    <div style={{fontSize:'.68rem',color:'rgba(255,255,255,.35)',marginBottom:10}}>{traineePosts.length} trainee posts</div>
                    {traineePosts.length === 0 ? <div className="li-empty">No trainee posts yet</div> : (
                      <div className="li-table-wrap">
                        <table className="li-table"><thead><tr><th>Name</th><th>Roll Number</th><th>Role</th><th>Team</th><th>Technology</th><th>Posted At</th></tr></thead><tbody>
                          {traineePosts.map(r => {
                            const isLeader = leaderMap[(r.roll_number || '').toUpperCase()]
                            return <tr key={r.id}>
                              <td style={{color:'#fff',fontWeight:600}}>{r.posted_by_name || '—'}</td>
                              <td style={{color:'rgba(255,255,255,.55)',fontSize:'.66rem'}}>{r.roll_number}</td>
                              <td><span className={`li-pill ${isLeader?'leader':'member'}`}>{isLeader?'Leader':'Member'}</span></td>
                              <td style={{color:'#fd1c00',fontWeight:600}}>{r.team_number}</td>
                              <td style={{fontSize:'.68rem'}}>{r.technology || '—'}</td>
                              <td style={{color:'rgba(255,255,255,.35)',fontSize:'.66rem'}}>{new Date(r.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                            </tr>
                          })}
                        </tbody></table>
                      </div>
                    )}
                  </>
                })()}

                {!liLoading && liStats && liTab==='teams' && (() => {
                  const q = liSearch.toLowerCase()
                  const fullyPostedTeams = (liStats.allTeams || []).filter(t => {
                    const shares = liStats.teamBreakdown[t.teamNumber]?.shares || []
                    return shares.length > 0 && shares.length >= (t.memberCount || 0) && t.memberCount > 0
                  }).filter(t => (liTechFilter==='all' || t.technology === liTechFilter) && (!q || (t.teamNumber||'').toLowerCase().includes(q) || (t.projectTitle||'').toLowerCase().includes(q) || (t.mentorAssigned||'').toLowerCase().includes(q)))

                  return <>
                    <input className="li-search" placeholder="Search team, project, mentor..." value={liSearch} onChange={e=>setLiSearch(e.target.value)} />
                    <div style={{fontSize:'.68rem',color:'rgba(255,255,255,.35)',marginBottom:10}}>{fullyPostedTeams.length} teams completed (all members posted)</div>
                    {fullyPostedTeams.length === 0 ? <div className="li-empty">No teams have fully posted yet</div> : (
                      <div className="li-table-wrap">
                        <table className="li-table"><thead><tr><th>Team</th><th>Project</th><th>Technology</th><th>Mentor</th><th>Members</th><th>Status</th></tr></thead><tbody>
                          {fullyPostedTeams.map(t => (
                            <tr key={t.serialNumber}>
                              <td style={{color:'#fd1c00',fontWeight:700}}>{t.teamNumber}</td>
                              <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.projectTitle || '—'}</td>
                              <td style={{fontSize:'.68rem'}}>{t.technology}</td>
                              <td style={{color:'rgba(255,255,255,.55)',fontSize:'.7rem'}}>{t.mentorAssigned || '—'}</td>
                              <td style={{fontWeight:600,color:'#4ade80'}}>{t.memberCount}/{t.memberCount}</td>
                              <td><span className="li-pill done">{IC.check}All Posted</span></td>
                            </tr>
                          ))}
                        </tbody></table>
                      </div>
                    )}
                  </>
                })()}

              </div>
            )}
            {/* REPORT CARD */}
            {activeTab === 'report-card' && <ReportCard />}
          </div>
        </div>
      </div>
    </>
  )
}