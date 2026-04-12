'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

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
  const [collapsed, setCollapsed] = useState(false)
  const [mobNav, setMobNav] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

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
    try { const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password-login', email, password }) }); const d = await r.json(); if (!r.ok) { setError(d.error); return }; setToken(d.token); sessionStorage.setItem('admin_token', d.token); setPhase('dashboard') } catch { setError('Network error') } finally { setLoading(false) }
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

  const filteredTeams = data?.teamList?.filter(t => {
    if (filterTech !== 'all' && t.technology !== filterTech) return false
    if (filterStatus === 'registered' && !t.registered) return false
    if (filterStatus === 'pending' && t.registered) return false
    if (search) { const q = search.toLowerCase(); return (t.projectTitle||'').toLowerCase().includes(q)||(t.leaderName||'').toLowerCase().includes(q)||(t.leaderRoll||'').toLowerCase().includes(q)||(t.teamNumber||'').toLowerCase().includes(q)||String(t.serialNumber).includes(q) }
    return true
  }) || []

  const TC = { 'Data Specialist':'#3b82f6','AWS Development':'#f59e0b','Full Stack':'#10b981','Google Flutter':'#06b6d4','ServiceNow':'#8b5cf6','VLSI':'#ef4444' }
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (_,a,b,c) => a+'*'.repeat(Math.min(b.length,6))+c) : ''

  const techChart = useMemo(() => !data?.techBreakdown ? [] : Object.entries(data.techBreakdown).map(([n,v]) => ({ name:n.replace('Development','Dev').replace('Specialist','Spec'), fullName:n, total:v.total, registered:v.registered, pending:v.pending, color:TC[n]||'#888' })), [data])
  const mentorChart = useMemo(() => !data?.mentorBreakdown ? [] : Object.entries(data.mentorBreakdown).sort((a,b)=>b[1].total-a[1].total).slice(0,10).map(([n,v])=>({ name:n.split(' ').slice(0,2).join(' '), total:v.total, registered:v.registered, pending:v.pending })), [data])

  function AnimNum({value,color}){ const [d,setD]=useState(0); const ref=useRef(); useEffect(()=>{ const end=parseInt(value)||0,dur=900,t0=performance.now(); function s(now){const p=Math.min((now-t0)/dur,1);setD(Math.floor(p*end));if(p<1)ref.current=requestAnimationFrame(s)};ref.current=requestAnimationFrame(s);return()=>cancelAnimationFrame(ref.current)},[value]); return <span style={{color}}>{d}</span> }
  const CTooltip=({active,payload,label})=>{ if(!active||!payload?.length)return null; return <div style={{background:'rgba(12,6,22,.95)',border:'1px solid rgba(253,28,0,.2)',borderRadius:10,padding:'10px 14px',fontSize:'.72rem',color:'#fff',boxShadow:'0 8px 32px rgba(0,0,0,.6)'}}><div style={{fontWeight:700,marginBottom:4,color:'rgba(255,255,255,.5)',fontSize:'.65rem'}}>{label}</div>{payload.map((p,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}><span style={{width:7,height:7,borderRadius:'50%',background:p.color||p.fill,display:'inline-block'}}/><span style={{color:'rgba(255,255,255,.6)'}}>{p.name}:</span><span style={{fontWeight:700,color:p.color||p.fill}}>{p.value}</span></div>)}</div> }

  const IC = {
    grid:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    users:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    layers:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    chart:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    bolt:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    file:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    chev:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
    out:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    menu:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    ref:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    bell:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    srch:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    dl:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    mail:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
    clk:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    ph:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  }
  const NAV=[{id:'overview',label:'Overview',icon:IC.grid},{id:'mentors',label:'Mentors',icon:IC.users},{id:'teams',label:'Teams',icon:IC.layers},{id:'analytics',label:'Analytics',icon:IC.chart},{id:'actions',label:'Actions',icon:IC.bolt},{id:'report-card',label:'Report Card',icon:IC.file}]

  // ═══ AUTH SCREEN ═══
  if (phase === 'auth') {
    const totalSteps = mode === 'login' ? 2 : 3
    const inputSt = { width:'100%',padding:'12px 16px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'12px',color:'#fff',fontSize:'.88rem',outline:'none',fontFamily:"'DM Sans',sans-serif" }
    const btnSt = { width:'100%',padding:'13px',borderRadius:'12px',background:'linear-gradient(135deg,#fd1c00,#fd3a20)',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.88rem',fontWeight:600,cursor:'pointer' }
    const lblSt = { display:'block',fontSize:'.65rem',fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'6px' }
    const togSt = { position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,.35)',fontSize:'10px',cursor:'pointer' }
    return (
      <>
        <style>{`*{margin:0;padding:0;box-sizing:border-box}html,body{background:#050008;overflow:auto}body{font-family:'DM Sans',sans-serif;color:#fff}@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}.adm-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#050008;position:relative}.adm-card{width:100%;max-width:420px;background:rgba(12,8,20,.9);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:40px 32px;backdrop-filter:blur(20px);animation:fadeUp .5s ease;position:relative;z-index:2}@media(max-width:480px){.adm-card{padding:28px 20px;border-radius:16px}}`}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
        <AuthBackground>
          <div className="adm-wrap"><div className="adm-card">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'24px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'linear-gradient(135deg,#fd1c00,#faa000)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'16px',color:'#fff',boxShadow:'0 0 24px rgba(253,28,0,.3)'}}>PS</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'1rem',fontWeight:700,letterSpacing:'3px',color:'#fff',marginTop:'12px'}}>{mode==='login'?'ADMIN LOGIN':mode==='create'?'CREATE ACCOUNT':'RESET PASSWORD'}</div>
              <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.35)',marginTop:'4px'}}>
                {mode==='login'&&step===1&&'Enter your admin email'}{mode==='login'&&step===2&&`Welcome back, ${adminName}`}{mode==='create'&&step===2&&'Verify your email'}{mode==='create'&&step===3&&'Set your login password'}{mode==='forgot'&&step===1&&'Enter email to reset password'}{mode==='forgot'&&step===2&&'Enter verification code'}{mode==='forgot'&&step===3&&'Set new password'}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'22px'}}>
              {Array.from({length:totalSteps},(_,i)=>i+1).map(n=><React.Fragment key={n}>{n>1&&<div style={{width:'32px',height:'1px',background:step>=n?'rgba(255,96,64,0.35)':'rgba(255,255,255,0.1)'}}/>}<div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,background:step>n?'rgba(255,40,0,0.2)':step===n?'#ff2800':'rgba(255,255,255,0.06)',color:step>n?'#ff6040':step===n?'#fff':'rgba(255,255,255,0.25)',boxShadow:step===n?'0 0 14px rgba(255,40,0,0.4)':'none'}}>{step>n?'✓':n}</div></React.Fragment>)}
            </div>
            {error&&<div style={{background:'rgba(255,40,0,.06)',border:'1px solid rgba(255,40,0,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#ff6040',marginBottom:'14px',animation:'fadeUp .3s ease'}}>{error}</div>}

            {mode==='login'&&step===1&&<><div style={{marginBottom:'14px'}}><label style={lblSt}>Admin Email</label><input style={inputSt} placeholder="admin@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCheckAndSendOTP()} autoFocus/></div><button style={btnSt} onClick={handleCheckAndSendOTP} disabled={loading||!email}>{loading?'Checking...':'Continue →'}</button><div style={{textAlign:'center',marginTop:'14px',fontSize:'.76rem',color:'rgba(255,255,255,.35)',cursor:'pointer'}} onClick={()=>router.push('/')}>← Back to Home</div></>}

            {mode==='login'&&step===2&&<><div style={{marginBottom:'14px'}}><label style={lblSt}>Password</label><div style={{position:'relative'}}><input style={{...inputSt,paddingRight:'52px'}} type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePasswordLogin()} autoFocus/><button style={togSt} onClick={()=>setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button></div></div><button style={btnSt} onClick={handlePasswordLogin} disabled={loading||!password}>{loading?'Logging in...':'Login →'}</button><div style={{textAlign:'center',marginTop:'12px',fontSize:'.76rem'}}><span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setMode('forgot');setStep(1);setError('');setPassword('')}}>Forgot password?</span></div><div style={{textAlign:'center',marginTop:'8px',fontSize:'.72rem',color:'rgba(255,255,255,.25)',cursor:'pointer'}} onClick={()=>{setStep(1);setPassword('');setError('')}}>← Change email</div></>}

            {mode==='create'&&step===2&&<><div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#4ade80',marginBottom:'14px'}}>OTP sent to {maskedEmail}</div><div style={{marginBottom:'14px'}}><label style={lblSt}>Enter OTP</label><input style={{...inputSt,fontSize:'1.1rem',letterSpacing:'6px',textAlign:'center'}} placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus/></div><button style={btnSt} onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify OTP →'}</button></>}

            {(mode==='create'||mode==='forgot')&&step===3&&<><div style={{marginBottom:'14px'}}><label style={lblSt}>{mode==='forgot'?'New Password':'Create Password'}</label><div style={{position:'relative'}}><input style={{...inputSt,paddingRight:'52px'}} type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} autoFocus/><button style={togSt} onClick={()=>setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button></div>{password&&<div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>{pwRules.map(r=><div key={r.label} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'.65rem',color:r.test(password)?'#4ade80':'rgba(255,255,255,.35)'}}><span style={{width:'4px',height:'4px',borderRadius:'50%',background:'currentColor'}}/>{r.label}</div>)}</div>}</div><div style={{marginBottom:'14px'}}><label style={lblSt}>Confirm Password</label><div style={{position:'relative'}}><input style={{...inputSt,paddingRight:'52px'}} type={showConfirm?'text':'password'} placeholder="Re-enter password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSetPassword()}/><button style={togSt} onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?'HIDE':'SHOW'}</button></div>{confirmPassword&&password!==confirmPassword&&<div style={{fontSize:'.68rem',color:'#ff6040',marginTop:'4px'}}>Passwords do not match</div>}</div><button style={btnSt} onClick={handleSetPassword} disabled={loading||!password||!confirmPassword}>{loading?'Setting...':mode==='forgot'?'Reset Password →':'Create Account →'}</button></>}

            {mode==='forgot'&&step===1&&<><div style={{marginBottom:'14px'}}><label style={lblSt}>Email</label><input style={inputSt} placeholder="admin@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleForgotSendOTP()} autoFocus/></div><button style={btnSt} onClick={handleForgotSendOTP} disabled={loading||!email}>{loading?'Sending...':'Send Reset Code →'}</button><div style={{textAlign:'center',marginTop:'14px',fontSize:'.76rem'}}><span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setMode('login');setStep(1);setError('')}}>← Back to Login</span></div></>}

            {mode==='forgot'&&step===2&&<><div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#4ade80',marginBottom:'14px'}}>Reset code sent to {maskedEmail}</div><div style={{marginBottom:'14px'}}><label style={lblSt}>Enter OTP</label><input style={{...inputSt,fontSize:'1.1rem',letterSpacing:'6px',textAlign:'center'}} placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus/></div><button style={btnSt} onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify →'}</button></>}
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

    const downloadPDF = async () => {
      if (!report) return; setGen(true);
      try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const w = 210, h = 297; let y = 0;
        const RED=[253,28,0],BLACK=[0,0,0],WHITE=[255,255,255],GRAY=[120,120,120],DARK=[30,30,30],LBG=[248,248,248];

        doc.setFillColor(...RED);doc.rect(0,0,w,28,'F');doc.setFillColor(...BLACK);doc.rect(0,22,w,6,'F');
        doc.setTextColor(...WHITE);doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('PROJECT SPACE',10,12);
        doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text('STUDENT REPORT CARD',10,18);
        doc.setFontSize(7);doc.text(`Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}`,w-10,12,{align:'right'});
        doc.text('Technical Hub · Aditya University',w-10,18,{align:'right'});y=32;

        const secT=(t,yp)=>{doc.setFillColor(253,28,0);doc.rect(10,yp,2,5,'F');doc.setTextColor(...DARK);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text(t,15,yp+4);return yp+8};
        const lv=(l,v,x,yp,lw=28)=>{doc.setTextColor(...GRAY);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text(l,x,yp);doc.setTextColor(...DARK);doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.text(String(v||'—'),x+lw,yp)};
        const dBar=(x,yp,wd,pct,c)=>{doc.setFillColor(230,230,230);doc.roundedRect(x,yp,wd,2.5,1,1,'F');doc.setFillColor(...c);doc.roundedRect(x,yp,Math.max(0,(pct/100)*wd),2.5,1,1,'F')};

        y=secT('PERSONAL INFORMATION',y);
        lv('Name',report.name,10,y,18);lv('Roll No',report.roll_number,75,y,18);lv('College',report.college,140,y,18);y+=5;
        lv('Branch',report.branch,10,y,18);lv('Gender',report.gender,75,y,18);lv('DOB',report.dob,140,y,18);y+=5;
        lv('Mobile',report.mobile,10,y,18);lv('Email',report.email,75,y,18);lv('Passout',report.passout_year,140,y,18);y+=5;
        lv('Technology',report.technology,10,y,22);lv('Pool',report.pool,75,y,18);lv('Rank',report.rank?`#${report.rank}`:'—',140,y,18);y+=5;
        lv('Seat',report.seat_type,10,y,18);lv('Scholar',report.scholar_type,75,y,18);lv('Town',report.town,140,y,18);y+=7;
        doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;

        y=secT('ACADEMIC PERFORMANCE',y);
        const ad=[{l:'B.Tech CGPA',v:report.btech||'—'},{l:'B.Tech %',v:report.btech_pct?`${report.btech_pct}%`:'—'},{l:'Inter/Diploma',v:report.inter?`${report.inter}%`:'—'},{l:'SSC',v:report.ssc?`${report.ssc}%`:'—'},{l:'Backlogs',v:report.backlogs||'0'},{l:'Badge Test',v:`${report.badge_test_pct}% (${report.badge_test_status||'—'})`}];
        ad.forEach((it,i)=>{const bx=10+(i%6)*32;doc.setFillColor(...LBG);doc.roundedRect(bx,y,30,10,1.5,1.5,'F');doc.setTextColor(...GRAY);doc.setFontSize(5.5);doc.setFont('helvetica','normal');doc.text(it.l,bx+2,y+3.5);doc.setTextColor(...DARK);doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(String(it.v),bx+2,y+8)});
        y+=14;doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;

        y=secT('CODING PROFILES',y);
        const pl=[];
        if(report.leetcode)pl.push({n:'LeetCode',t:report.leetcode.total,d:`E:${report.leetcode.easy} M:${report.leetcode.medium} H:${report.leetcode.hard} | Rank #${report.leetcode.rank} | Streak: ${report.leetcode.streak}d`});
        if(report.hackerrank)pl.push({n:'HackerRank',t:`${report.hackerrank.stars}★`,d:`Badges:${report.hackerrank.badges} Certs:${report.hackerrank.certs}`});
        if(report.codechef)pl.push({n:'CodeChef',t:report.codechef.total,d:`Rating:${report.codechef.rating} (${report.codechef.stars}★)`});
        if(report.gfg)pl.push({n:'GFG',t:report.gfg.total,d:`Score:${report.gfg.score} | Streak:${report.gfg.streak}d`});
        pl.forEach(p=>{doc.setTextColor(...RED);doc.setFontSize(7);doc.setFont('helvetica','bold');doc.text(p.n,10,y);doc.setTextColor(...DARK);doc.setFontSize(8);doc.text(String(p.t),38,y);doc.setTextColor(...GRAY);doc.setFontSize(6);doc.setFont('helvetica','normal');doc.text(p.d,55,y);y+=5});
        if(report.mayaCoding){doc.setTextColor(...RED);doc.setFontSize(7);doc.setFont('helvetica','bold');doc.text('Maya Portal',10,y);doc.setTextColor(...DARK);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text(`Rank #${report.mayaCoding.globalRank} | Score:${report.mayaCoding.score}`,38,y);y+=5}
        y+=2;doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;

        y=secT(`ATTENDANCE — Overall: ${report.overallAttendance}% (${report.totalPresent}/${report.totalSessions})`,y);
        const ac=4,aw2=(w-20-(ac-1)*2)/ac;
        report.attendance.forEach((a,i)=>{const col=i%ac,row=Math.floor(i/ac),ax=10+col*(aw2+2),ay=y+row*11;doc.setFillColor(...LBG);doc.roundedRect(ax,ay,aw2,9,1,1,'F');doc.setTextColor(...DARK);doc.setFontSize(6);doc.setFont('helvetica','bold');doc.text(a.tech.length>18?a.tech.substring(0,18)+'..':a.tech,ax+2,ay+3.5);const pc=parseFloat(a.pct)>=75?[34,197,94]:[239,68,68];doc.setTextColor(...pc);doc.setFontSize(7);doc.text(`${a.pct}%`,ax+aw2-2,ay+3.5,{align:'right'});dBar(ax+2,ay+5.5,aw2-4,parseFloat(a.pct),pc);doc.setTextColor(...GRAY);doc.setFontSize(4.5);doc.text(`P:${a.present} A:${a.absent} T:${a.total}`,ax+2,ay+8.5)});
        y+=Math.ceil(report.attendance.length/ac)*11+2;doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;

        y=secT(`CERTIFICATIONS — G:${report.certCounts.global} T:${report.certCounts.training} B:${report.certCounts.badges} I:${report.certCounts.internship}`,y);
        if(report.globalCerts.length>0){doc.setTextColor(...DARK);doc.setFontSize(6.5);doc.setFont('helvetica','normal');report.globalCerts.forEach((c,i)=>{doc.text(`${i+1}. ${c}`,14,y);y+=4})}else{doc.setTextColor(...GRAY);doc.setFontSize(6.5);doc.text('No certifications recorded',14,y);y+=4}
        y+=2;
        if(report.aptMandatory){doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;y=secT(`APTITUDE — ${report.aptMandatory.pct}%`,y);doc.setTextColor(...DARK);doc.setFontSize(6.5);doc.setFont('helvetica','normal');doc.text(`Easy:${report.aptMandatory.easy} Med:${report.aptMandatory.medium} Hard:${report.aptMandatory.hard}`,14,y);y+=5}
        doc.setDrawColor(230,230,230);doc.line(10,y,w-10,y);y+=3;
        y=secT(`COURSES (${report.courses.length})`,y);
        if(report.courses.length>0){doc.setTextColor(...DARK);doc.setFontSize(6);doc.setFont('helvetica','normal');const cl=doc.splitTextToSize(report.courses.join(' · '),w-24);doc.text(cl,14,y);y+=cl.length*3.5}
        y+=2;if(report.semesters.length>0){doc.setTextColor(...GRAY);doc.setFontSize(6);doc.text(`Semesters: ${report.semesters.map((s2,i)=>`S${i+1}:${s2}`).join(' · ')}`,14,y);y+=4}
        doc.setTextColor(...GRAY);doc.setFontSize(6);doc.text(`Payments: ${report.payments.map((p,i)=>`T${i+1}:${p||'Pending'}`).join('  ')}`,14,y);y+=4;
        doc.text(`Violations: ${report.violations} | Placement: ${report.placement}`,14,y);y+=6;

        doc.setFillColor(...BLACK);doc.rect(0,h-10,w,10,'F');doc.setFillColor(...RED);doc.rect(0,h-10,w,1.5,'F');
        doc.setTextColor(...WHITE);doc.setFontSize(6);doc.setFont('helvetica','normal');
        doc.text('Project Space · Technical Hub · Aditya University',10,h-4);
        doc.text('projectspace.technicalhub.io',w-10,h-4,{align:'right'});
        doc.save(`Report_Card_${report.roll_number}.pdf`);
      } catch(err){console.error(err);alert('Failed to generate PDF.')} finally{setGen(false)}
    };

    return (
      <div style={{maxWidth:600,margin:'0 auto'}}>
        <div className="mp-card" style={{marginBottom:20}}>
          <div className="mp-card-title" style={{marginBottom:12}}>{IC.file} Generate Report Card</div>
          <div style={{display:'flex',gap:10}}>
            <input type="text" value={roll} onChange={e=>setRoll(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&fetchReport()} placeholder="Enter Roll Number (e.g. 23A91A61G9)" style={{flex:1,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.82rem',outline:'none'}}/>
            <button onClick={fetchReport} disabled={rcL} style={{padding:'10px 22px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#fd1c00,#ff5349)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.78rem',fontWeight:700,cursor:rcL?'wait':'pointer',opacity:rcL?0.6:1}}>{rcL?'Loading...':'Fetch'}</button>
          </div>
          {rcE&&<div style={{color:'#ef4444',fontSize:'.75rem',marginTop:8}}>{rcE}</div>}
        </div>
        {report&&<div className="mp-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div><div style={{fontSize:'1rem',fontWeight:800,color:'#fff'}}>{report.name}</div><div style={{fontSize:'.72rem',color:'rgba(255,255,255,.4)'}}>{report.roll_number} · {report.branch} · {report.college}</div></div>
            <button onClick={downloadPDF} disabled={gen} style={{padding:'10px 20px',borderRadius:10,border:'none',background:gen?'rgba(255,255,255,.1)':'linear-gradient(135deg,#fd1c00,#ff5349)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.78rem',fontWeight:700,cursor:gen?'wait':'pointer',display:'flex',alignItems:'center',gap:6}}>{IC.dl} {gen?'Generating...':'Download PDF'}</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            {[{l:'Technology',v:report.technology},{l:'Pool',v:report.pool},{l:'B.Tech CGPA',v:report.btech},{l:'Attendance',v:`${report.overallAttendance}%`},{l:'Backlogs',v:report.backlogs},{l:'Violations',v:report.violations}].map((it,i)=><div key={i} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)'}}><div style={{fontSize:'.5rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600}}>{it.l}</div><div style={{fontSize:'.82rem',color:'#fff',fontWeight:700,marginTop:2}}>{it.v||'—'}</div></div>)}
          </div>
          <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(253,28,0,.04)',border:'1px solid rgba(253,28,0,.08)',marginBottom:8}}><div style={{fontSize:'.55rem',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600,marginBottom:4}}>Coding Platforms</div><div style={{fontSize:'.75rem',color:'rgba(255,255,255,.7)'}}>{[report.leetcode&&`LeetCode: ${report.leetcode.total}`,report.hackerrank&&`HackerRank: ${report.hackerrank.stars}★`,report.codechef&&`CodeChef: ${report.codechef.total}`,report.gfg&&`GFG: ${report.gfg.total}`].filter(Boolean).join(' · ')||'No data'}</div></div>
          <div style={{fontSize:'.68rem',color:'rgba(255,255,255,.4)',marginTop:8}}>Certs: Global({report.certCounts.global}) · Training({report.certCounts.training}) · Badges({report.certCounts.badges}) · Internship({report.certCounts.internship})</div>
          <div style={{fontSize:'.68rem',color:'rgba(255,255,255,.4)',marginTop:4}}>Courses: {report.courses.length} enrolled · Placement: {report.placement}</div>
        </div>}
      </div>
    );
  }

  // ═══ DASHBOARD ═══
  if (!mounted) return null
  const s = data?.stats || {}
  const exp = isMobile ? false : !collapsed
  const pageLabel = NAV.find(n=>n.id===activeTab)?.label||'Overview'

  const css = `
*{margin:0;padding:0;box-sizing:border-box}html,body{background:#050008;overflow:hidden}body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
.al{display:flex;height:100vh;overflow:hidden}
.sb{width:${exp?'250px':'72px'};flex-shrink:0;height:100vh;display:flex;flex-direction:column;background:linear-gradient(180deg,#0a0515,#060210);border-right:1px solid rgba(255,255,255,.04);transition:width .3s cubic-bezier(.22,1,.36,1);position:relative;z-index:10}
.sb::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;background:linear-gradient(180deg,rgba(253,28,0,.15),rgba(250,160,0,.08),transparent)}
.sb-h{padding:${exp?'20px 18px 16px':'20px 0 16px'};border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:10px;justify-content:${exp?'flex-start':'center'}}
.sb-l{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#EEA727);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0;box-shadow:0 0 18px rgba(253,28,0,.25)}
.sb-b{display:${exp?'block':'none'};animation:slideIn .3s ease}
.sb-bn{font-family:'Orbitron',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.8)}
.sb-bs{font-size:.58rem;color:rgba(255,255,255,.3);margin-top:1px}
.sb-n{flex:1;padding:14px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.sb-n::-webkit-scrollbar{width:2px}.sb-n::-webkit-scrollbar-thumb{background:rgba(253,28,0,.1);border-radius:2px}
.sb-i{display:flex;align-items:center;gap:10px;padding:${exp?'10px 14px':'10px 0'};justify-content:${exp?'flex-start':'center'};border-radius:10px;border:none;cursor:pointer;background:none;color:rgba(255,255,255,.4);font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:500;transition:all .25s;position:relative;width:100%;text-align:left}
.sb-i:hover{color:rgba(255,255,255,.65);background:rgba(255,255,255,.03)}
.sb-i.on{color:#fd1c00;background:rgba(253,28,0,.08);font-weight:600}
.sb-i.on::before{content:'';position:absolute;left:0;top:25%;height:50%;width:3px;border-radius:0 4px 4px 0;background:linear-gradient(180deg,#fd1c00,#EEA727);box-shadow:0 0 8px rgba(253,28,0,.3)}
.sb-i svg{flex-shrink:0}.sb-il{display:${exp?'block':'none'};animation:slideIn .3s ease}
.sb-t{margin:0 8px 14px;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.02);color:rgba(255,255,255,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-size:.7rem;font-family:'DM Sans',sans-serif;transition:all .2s}
.sb-t:hover{border-color:rgba(253,28,0,.15);color:rgba(255,255,255,.6)}
.sb-t svg{transition:transform .3s;transform:rotate(${exp?'180deg':'0deg'})}
.sb-x{padding:12px 8px 14px;border-top:1px solid rgba(255,255,255,.04)}
.sb-o{display:flex;align-items:center;gap:10px;padding:${exp?'9px 14px':'9px 0'};justify-content:${exp?'flex-start':'center'};border-radius:9px;border:none;cursor:pointer;background:none;color:rgba(255,255,255,.3);font-family:'DM Sans',sans-serif;font-size:.74rem;transition:all .2s;width:100%}
.sb-o:hover{color:#ff6040;background:rgba(255,40,0,.04)}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:998;backdrop-filter:blur(4px)}
.ms{position:fixed;left:0;top:0;bottom:0;width:260px;z-index:999;background:linear-gradient(180deg,#0a0515,#060210);border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;animation:slideIn .3s ease}
.mn{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.tb{display:flex;align-items:center;justify-content:space-between;padding:${isMobile?'12px 16px':'14px 28px'};border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0;background:rgba(5,0,8,.9);backdrop-filter:blur(16px);position:sticky;top:0;z-index:50}
.tb-l{display:flex;align-items:center;gap:14px}
.tb-t{font-size:${isMobile?'1rem':'1.15rem'};font-weight:700;color:#fff}
.tb-c{font-size:.62rem;color:rgba(255,255,255,.25);margin-top:1px}
.tb-r{display:flex;align-items:center;gap:10px}
.tb-s{display:${isMobile?'none':'flex'};align-items:center;gap:8px;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.tb-s:focus-within{border-color:rgba(253,28,0,.2)}
.tb-s input{background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.76rem;width:140px}
.tb-s input::placeholder{color:rgba(255,255,255,.2)}
.tb-ib{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:all .2s;color:rgba(255,255,255,.4);position:relative}
.tb-ib:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}
.tb-nd{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#fd1c00;border:1.5px solid #050008}
.tb-av{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff;box-shadow:0 0 10px rgba(253,28,0,.15)}
.bd{flex:1;overflow-y:auto;padding:${isMobile?'16px':'24px 28px'}}
.bd::-webkit-scrollbar{width:4px}.bd::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}
.sg{display:grid;grid-template-columns:repeat(${isMobile?2:4},1fr);gap:14px;margin-bottom:24px}
.sc{padding:20px 18px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:countUp .5s ease both;position:relative;overflow:hidden}
.sc:nth-child(2){animation-delay:.1s}.sc:nth-child(3){animation-delay:.2s}.sc:nth-child(4){animation-delay:.3s}
.sc::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,var(--gw,.06) 0%,transparent 70%);pointer-events:none}
.sv{font-size:1.8rem;font-weight:800;line-height:1}.sl{font-size:.62rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:600}
.pw{margin-bottom:24px;padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.pt{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.6)}
.pp{font-size:1.1rem;font-weight:800;color:#fd1c00}
.pb{height:7px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.pf{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s cubic-bezier(.4,0,.2,1)}
.cc{padding:20px 18px 14px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:20px}
.ct{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.tg{display:grid;grid-template-columns:repeat(${isMobile?2:3},1fr);gap:12px;margin-bottom:24px}
.tc{padding:16px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:12px;transition:border-color .2s}
.tc:hover{border-color:rgba(255,255,255,.08)}
.td{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tn{font-size:.74rem;font-weight:600;color:rgba(255,255,255,.75)}
.ts2{font-size:.62rem;color:rgba(255,255,255,.35);margin-top:2px}
.tbr{height:3px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:5px;overflow:hidden}
.tbf{height:100%;border-radius:2px;transition:width .8s ease}
.mg{display:grid;grid-template-columns:repeat(${isMobile?1:2},1fr);gap:14px}
.mc{padding:18px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s}
.mc:hover{border-color:rgba(255,255,255,.08)}.mc.ex{border-color:rgba(253,28,0,.12)}
.mh{display:flex;justify-content:space-between;align-items:center}
.mna{font-size:.85rem;font-weight:600;color:#fff}
.mb{font-size:.62rem;padding:3px 10px;border-radius:6px;font-weight:500}
.mb.dn{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
.mb.pe{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.ms2{display:flex;gap:16px;margin-top:8px;font-size:.7rem;color:rgba(255,255,255,.35)}
.mr{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:8px;overflow:hidden}
.mrf{height:100%;border-radius:2px;background:linear-gradient(90deg,#4ade80,#10b981);transition:width .6s ease}
.mt{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:6px}
.mi{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,.02);font-size:.72rem}
.min{color:rgba(255,255,255,.6);flex:1}
.mis{font-size:.62rem;padding:2px 8px;border-radius:4px}
.mis.r{background:rgba(74,222,128,.08);color:#4ade80}.mis.p{background:rgba(255,255,255,.04);color:rgba(255,255,255,.3)}
.fc{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.fi{flex:1;min-width:200px;padding:9px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:#fff;font-size:.8rem;outline:none;font-family:'DM Sans',sans-serif}
.fi:focus{border-color:rgba(253,28,0,.2)}.fi::placeholder{color:rgba(255,255,255,.2)}
.ff{padding:7px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:rgba(255,255,255,.5);font-size:.72rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.ff:hover,.ff.on{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.12);color:#fd1c00}
.fn{font-size:.7rem;color:rgba(255,255,255,.25);margin-left:auto}
.tt{width:100%;border-collapse:separate;border-spacing:0 5px}
.tt th{text-align:left;padding:7px 12px;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px}
.tt td{padding:11px 12px;background:rgba(255,255,255,.015);border-top:1px solid rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.02);font-size:.76rem;color:rgba(255,255,255,.65)}
.tt tr td:first-child{border-left:1px solid rgba(255,255,255,.02);border-radius:10px 0 0 10px}
.tt tr td:last-child{border-right:1px solid rgba(255,255,255,.02);border-radius:0 10px 10px 0}
.tt tr:hover td{background:rgba(255,255,255,.03)}
.te{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.7rem;padding:4px 8px;border-radius:6px;font-family:'DM Sans',sans-serif}
.tdl{padding:14px 18px;background:rgba(255,255,255,.01);border:1px solid rgba(255,255,255,.03);border-radius:12px;margin:4px 0 8px;font-size:.72rem;color:rgba(255,255,255,.45)}
.tdg{display:grid;grid-template-columns:${isMobile?'1fr':'1fr 1fr'};gap:10px;margin-top:10px}
.tdi{padding:10px;border-radius:8px;background:rgba(255,255,255,.02)}
.tdla{font-size:.55rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.tdv{font-size:.74rem;color:rgba(255,255,255,.65)}
.ag{display:grid;grid-template-columns:repeat(${isMobile?1:2},1fr);gap:14px}
.ac{padding:22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ati{font-size:.85rem;font-weight:600;color:#fff;margin-bottom:5px;display:flex;align-items:center;gap:8px}
.ad{font-size:.72rem;color:rgba(255,255,255,.3);margin-bottom:14px;line-height:1.5}
.ab{padding:9px 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.ab.pr{background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff}
.ab.se{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.ab:disabled{opacity:.5;cursor:not-allowed}
.am{margin-top:10px;font-size:.72rem;padding:8px 12px;border-radius:8px;background:rgba(74,222,128,.06);color:#4ade80}
.rti{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:12px;margin-top:24px;display:flex;align-items:center;gap:6px}
.ri{display:flex;align-items:center;gap:14px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03);margin-bottom:7px;transition:border-color .15s}
.ri:hover{border-color:rgba(255,255,255,.06)}
.rn{font-size:.8rem;font-weight:700;color:#fd1c00;min-width:58px}
.rp{font-size:.76rem;font-weight:500;color:rgba(255,255,255,.7)}
.rm{font-size:.62rem;color:rgba(255,255,255,.3);margin-top:1px}
.rtm{font-size:.62rem;color:rgba(255,255,255,.2);white-space:nowrap;margin-left:auto}
.mp-card{padding:20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.mp-card-title{font-size:.85rem;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px}
@media(max-width:640px){.sg{grid-template-columns:1fr 1fr}.tg{grid-template-columns:1fr}.fc{flex-direction:column}.tt{display:block;overflow-x:auto}}
`

  return (
    <>
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
      <div className="al">
        {/* DESKTOP SIDEBAR */}
        {!isMobile && <nav className="sb">
          <div className="sb-h"><div className="sb-l">PS</div><div className="sb-b"><div className="sb-bn">ADMIN PANEL</div><div className="sb-bs">Project Space · May 2026</div></div></div>
          <div className="sb-n">{NAV.map((n,i)=><button key={n.id} className={`sb-i ${activeTab===n.id?'on':''}`} onClick={()=>setActiveTab(n.id)} style={{animationDelay:`${i*50}ms`}}>{n.icon}<span className="sb-il">{n.label}</span></button>)}</div>
          <div className="sb-x"><button className="sb-o" onClick={handleLogout}>{IC.out}{exp&&<span>Logout</span>}</button></div>
          <button className="sb-t" onClick={()=>setCollapsed(!collapsed)}>{IC.chev}{exp&&<span>Collapse</span>}</button>
        </nav>}

        {/* MOBILE SIDEBAR */}
        {isMobile&&mobNav&&<><div className="mo" onClick={()=>setMobNav(false)}/><nav className="ms">
          <div style={{padding:'20px 18px 16px',borderBottom:'1px solid rgba(255,255,255,.04)',display:'flex',alignItems:'center',gap:10}}><div className="sb-l">PS</div><div><div className="sb-bn">ADMIN PANEL</div><div className="sb-bs">Project Space</div></div></div>
          <div style={{flex:1,padding:'14px 8px',display:'flex',flexDirection:'column',gap:2}}>{NAV.map(n=><button key={n.id} className={`sb-i ${activeTab===n.id?'on':''}`} onClick={()=>{setActiveTab(n.id);setMobNav(false)}} style={{justifyContent:'flex-start',padding:'10px 14px'}}>{n.icon}<span>{n.label}</span></button>)}</div>
          <div style={{padding:'12px 8px 14px',borderTop:'1px solid rgba(255,255,255,.04)'}}><button className="sb-o" style={{justifyContent:'flex-start',padding:'9px 14px'}} onClick={handleLogout}>{IC.out}<span>Logout</span></button></div>
        </nav></>}

        {/* MAIN */}
        <div className="mn">
          <div className="tb">
            <div className="tb-l">
              {isMobile&&<button onClick={()=>setMobNav(true)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:4,display:'flex'}}>{IC.menu}</button>}
              <div><div className="tb-t">{pageLabel}</div><div className="tb-c">Project Space / {pageLabel}</div></div>
            </div>
            <div className="tb-r">
              <div className="tb-s"><span style={{color:'rgba(255,255,255,.2)',display:'flex'}}>{IC.srch}</span><input placeholder="Search..."/></div>
              <button className="tb-ib" onClick={fetchDashboard} title="Refresh">{IC.ref}</button>
              <div className="tb-ib">{IC.bell}<div className="tb-nd"/></div>
              <div className="tb-av">A</div>
            </div>
          </div>

          <div className="bd">
            {loading&&!data&&<div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading dashboard...</div>}

            {/* OVERVIEW */}
            {data&&activeTab==='overview'&&<>
              <div className="sg">
                <div className="sc" style={{'--gw':'rgba(253,28,0,.06)'}}><div className="sv"><AnimNum value={s.totalTeams} color="#fd1c00"/></div><div className="sl">Total Teams</div></div>
                <div className="sc" style={{'--gw':'rgba(74,222,128,.06)'}}><div className="sv"><AnimNum value={s.registeredCount} color="#4ade80"/></div><div className="sl">Registered</div></div>
                <div className="sc" style={{'--gw':'rgba(238,167,39,.06)'}}><div className="sv"><AnimNum value={s.pendingCount} color="#EEA727"/></div><div className="sl">Pending</div></div>
                <div className="sc" style={{'--gw':'rgba(59,130,246,.06)'}}><div className="sv"><AnimNum value={s.accountsCreated} color="#3b82f6"/></div><div className="sl">Accounts Created</div></div>
              </div>
              <div className="pw"><div className="ph"><span className="pt">Registration Progress</span><span className="pp">{s.progressPercent}%</span></div><div className="pb"><div className="pf" style={{width:`${s.progressPercent}%`}}/></div></div>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16,marginBottom:24}}>
                <div className="cc"><div className="ct">{IC.chart} Technology Distribution</div><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={techChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="total" strokeWidth={0} nameKey="fullName">{techChart.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/><Legend verticalAlign="bottom" height={36} formatter={v=><span style={{color:'rgba(255,255,255,.5)',fontSize:'.62rem'}}>{v}</span>}/></PieChart></ResponsiveContainer></div>
                <div className="cc"><div className="ct">{IC.users} Mentor — Teams</div><ResponsiveContainer width="100%" height={220}><BarChart data={mentorChart} barSize={isMobile?12:18}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="name" tick={{fill:'rgba(255,255,255,.3)',fontSize:9}} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} height={50}/><YAxis tick={{fill:'rgba(255,255,255,.3)',fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="registered" name="Registered" fill="#4ade80" radius={[3,3,0,0]}/><Bar dataKey="pending" name="Pending" fill="#EEA727" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
              </div>
              <div className="tg">{Object.entries(data.techBreakdown||{}).map(([t,v])=><div key={t} className="tc"><div className="td" style={{background:TC[t]||'#888'}}/><div style={{flex:1}}><div className="tn">{t}</div><div className="ts2">{v.registered}/{v.total} registered</div><div className="tbr"><div className="tbf" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`,background:TC[t]||'#888'}}/></div></div></div>)}</div>
              <div className="rti">{IC.clk} Recent Registrations</div>
              {(data.recentRegistrations||[]).map((r,i)=><div key={i} className="ri"><div className="rn">{r.teamNumber}</div><div><div className="rp">{r.projectTitle}</div><div className="rm">{r.technology}</div></div><div className="rtm">{r.registeredAt?new Date(r.registeredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div></div>)}
            </>}

            {/* MENTORS */}
            {data&&activeTab==='mentors'&&<div className="mg">{Object.entries(data.mentorBreakdown||{}).sort((a,b)=>b[1].total-a[1].total).map(([name,v])=><div key={name} className={`mc ${expandedMentor===name?'ex':''}`} onClick={()=>setExpandedMentor(expandedMentor===name?null:name)}><div className="mh"><div className="mna">{name}</div><div className={`mb ${v.registered===v.total?'dn':'pe'}`}>{v.registered===v.total?'✓ All Done':`${v.pending} pending`}</div></div><div className="ms2"><span>{v.total} teams</span><span>{v.registered} registered</span><span>{v.pending} pending</span></div><div className="mr"><div className="mrf" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`}}/></div>{expandedMentor===name&&<div className="mt">{v.teams.map(t=><div key={t.serialNumber} className="mi"><span className="min">#{t.serialNumber} {t.projectTitle||t.leaderName} {!t.registered&&t.leaderPhone&&t.leaderPhone.length>=10&&<a href={`tel:${t.leaderPhone}`} onClick={e=>e.stopPropagation()} style={{color:'#4ade80',textDecoration:'none',marginLeft:'4px'}} title={t.leaderPhone}>{IC.ph}</a>}</span><span className={`mis ${t.registered?'r':'p'}`}>{t.registered?'Registered':'Pending'}</span></div>)}</div>}</div>)}</div>}

            {/* TEAMS */}
            {data&&activeTab==='teams'&&<><div className="fc"><input className="fi" placeholder="Search teams, projects, leaders..." value={search} onChange={e=>setSearch(e.target.value)}/><button className={`ff ${filterStatus==='all'?'on':''}`} onClick={()=>setFilterStatus('all')}>All</button><button className={`ff ${filterStatus==='registered'?'on':''}`} onClick={()=>setFilterStatus('registered')}>Registered</button><button className={`ff ${filterStatus==='pending'?'on':''}`} onClick={()=>setFilterStatus('pending')}>Pending</button><select className="ff" value={filterTech} onChange={e=>setFilterTech(e.target.value)} style={{appearance:'auto'}}><option value="all">All Technologies</option>{Object.keys(data.techBreakdown||{}).map(t=><option key={t} value={t}>{t}</option>)}</select><span className="fn">{filteredTeams.length} teams</span></div><table className="tt"><thead><tr><th>#</th><th>Team</th><th>Project</th><th>Technology</th><th>Leader</th><th>Mentor</th><th>Status</th><th></th></tr></thead><tbody>{filteredTeams.map(t=><React.Fragment key={t.serialNumber}><tr><td style={{fontWeight:600,color:'rgba(255,255,255,.35)'}}>{t.serialNumber}</td><td style={{fontWeight:600,color:'#fd1c00'}}>{t.teamNumber||'—'}</td><td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.projectTitle||'—'}</td><td><span style={{fontSize:'.62rem',padding:'3px 8px',borderRadius:'6px',background:`${TC[t.technology]||'#888'}15`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>{t.technology}</span></td><td><span>{t.leaderName}</span>{t.leaderPhone&&t.leaderPhone.length>=10&&<a href={`tel:${t.leaderPhone}`} style={{marginLeft:'6px',color:'rgba(255,255,255,.25)',textDecoration:'none'}} title={t.leaderPhone}>{IC.ph}</a>}</td><td style={{color:'rgba(255,255,255,.35)'}}>{t.mentorAssigned||'—'}</td><td><span style={{fontSize:'.65rem',padding:'3px 10px',borderRadius:'6px',fontWeight:500,background:t.registered?'rgba(74,222,128,.08)':'rgba(255,255,255,.04)',color:t.registered?'#4ade80':'rgba(255,255,255,.3)'}}>{t.registered?'✓ Registered':'Pending'}</span></td><td><button className="te" onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>{expandedTeam===t.serialNumber?'▲':'▼'}</button></td></tr>{expandedTeam===t.serialNumber&&<tr><td colSpan={8}><div className="tdl"><div style={{fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:8}}>{t.projectTitle}</div>{t.projectDescription&&<div style={{marginBottom:8,lineHeight:1.5}}>{t.projectDescription}</div>}<div className="tdg"><div className="tdi"><div className="tdla">Problem Statement</div><div className="tdv">{t.problemStatement||'—'}</div></div><div className="tdi"><div className="tdla">AI Usage</div><div className="tdv">{t.aiUsage}</div></div><div className="tdi"><div className="tdla">Tech Stack</div><div className="tdv">{(t.techStack||[]).join(', ')||'—'}</div></div><div className="tdi"><div className="tdla">Members ({t.memberCount})</div><div className="tdv">{(t.members||[]).map(m=>`${m.name}${m.isLeader?' ★':''}`).join(', ')}</div></div></div></div></td></tr>}</React.Fragment>)}</tbody></table></>}

            {/* ANALYTICS */}
            {data&&activeTab==='analytics'&&<><div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16}}>
              <div className="cc"><div className="ct">{IC.chart} Registered vs Pending</div><ResponsiveContainer width="100%" height={280}><BarChart data={techChart} layout="vertical" barSize={16}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis type="number" tick={{fill:'rgba(255,255,255,.3)',fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" tick={{fill:'rgba(255,255,255,.45)',fontSize:10}} axisLine={false} tickLine={false} width={100}/><Tooltip content={<CTooltip/>}/><Bar dataKey="registered" name="Registered" stackId="a" fill="#4ade80" radius={[0,0,0,0]}/><Bar dataKey="pending" name="Pending" stackId="a" fill="rgba(255,255,255,.08)" radius={[0,4,4,0]}/><Legend formatter={v=><span style={{color:'rgba(255,255,255,.5)',fontSize:'.62rem'}}>{v}</span>}/></BarChart></ResponsiveContainer></div>
              <div className="cc"><div className="ct">{IC.users} Mentor Performance</div><ResponsiveContainer width="100%" height={280}><BarChart data={mentorChart} barSize={isMobile?10:16}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/><XAxis dataKey="name" tick={{fill:'rgba(255,255,255,.3)',fontSize:8}} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} height={55}/><YAxis tick={{fill:'rgba(255,255,255,.3)',fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<CTooltip/>}/><Bar dataKey="total" name="Total" fill="#fd1c00" radius={[3,3,0,0]}/><Bar dataKey="registered" name="Registered" fill="#4ade80" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
            </div>
            <div className="cc"><div className="ct">{IC.grid} Registrations by Technology</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={techChart} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="registered" strokeWidth={0} nameKey="fullName">{techChart.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CTooltip/>}/><Legend formatter={v=><span style={{color:'rgba(255,255,255,.5)',fontSize:'.62rem'}}>{v}</span>}/></PieChart></ResponsiveContainer></div>
            </>}

            {/* ACTIONS */}
            {data&&activeTab==='actions'&&<div className="ag">
              <div className="ac"><div className="ati">{IC.mail} Send Reminders</div><div className="ad">Send reminder emails to {s.pendingCount} pending team leaders</div><button className="ab pr" onClick={handleRemind} disabled={reminding||s.pendingCount===0}>{reminding?'Sending...':'Send Reminders'}</button>{reminderMsg&&<div className="am">{reminderMsg}</div>}</div>
              <div className="ac"><div className="ati">{IC.dl} Export Data</div><div className="ad">Download CSV reports</div><div style={{display:'flex',gap:10}}><button className="ab se" onClick={()=>handleExport('teams')}>All Teams</button><button className="ab se" onClick={()=>handleExport('registrations')}>Registrations</button></div></div>
              <div className="ac"><div className="ati">{IC.chart} Quick Stats</div><div className="ad">At a glance</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div style={{padding:'10px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.72rem'}}><span style={{color:'rgba(255,255,255,.3)'}}>Students</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#fff',marginTop:2}}>{s.totalStudents}</div></div><div style={{padding:'10px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.72rem'}}><span style={{color:'rgba(255,255,255,.3)'}}>Accounts</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#3b82f6',marginTop:2}}>{s.accountsCreated}</div></div></div></div>
              <div className="ac"><div className="ati">{IC.ref} Refresh</div><div className="ad">Reload latest data</div><button className="ab se" onClick={fetchDashboard} disabled={loading}>{loading?'Loading...':'Refresh'}</button></div>
            </div>}

            {/* REPORT CARD */}
            {activeTab==='report-card'&&<ReportCard/>}
          </div>
        </div>
      </div>
    </>
  )
}