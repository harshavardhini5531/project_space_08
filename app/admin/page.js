'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [step, setStep] = useState('login') // login, otp, dashboard
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [filterTech, setFilterTech] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [expandedMentor, setExpandedMentor] = useState(null)
  const [reminding, setReminding] = useState(false)
  const [reminderMsg, setReminderMsg] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token')
    if (saved) { setToken(saved); setStep('dashboard') }
  }, [])

  useEffect(() => {
    if (step === 'dashboard' && token) fetchDashboard()
  }, [step, token])

  async function handleSendOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'send-otp',email}) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setStep('otp')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'verify-otp',email,otp}) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setToken(d.token); sessionStorage.setItem('admin_token', d.token); setStep('dashboard')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function fetchDashboard() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/dashboard', { headers:{'x-admin-token':token} })
      const d = await r.json()
      if (!r.ok) { setError(d.error); setStep('login'); sessionStorage.removeItem('admin_token'); return }
      setData(d)
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  async function handleExport(type) {
    const r = await fetch(`/api/admin/export?type=${type}`, { headers:{'x-admin-token':token} })
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`project-space-${type}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleRemind() {
    setReminding(true); setReminderMsg('')
    try {
      const r = await fetch('/api/admin/remind', { method:'POST', headers:{'Content-Type':'application/json','x-admin-token':token}, body:JSON.stringify({type:'all-pending'}) })
      const d = await r.json()
      setReminderMsg(d.message || `Sent ${d.sent} reminders`)
    } catch { setReminderMsg('Failed to send reminders') } finally { setReminding(false) }
  }

  function handleLogout() { sessionStorage.removeItem('admin_token'); setToken(''); setStep('login'); setData(null) }

  // Filter teams
  const filteredTeams = data?.teamList?.filter(t => {
    if (filterTech !== 'all' && t.technology !== filterTech) return false
    if (filterStatus === 'registered' && !t.registered) return false
    if (filterStatus === 'pending' && t.registered) return false
    if (search) {
      const s = search.toLowerCase()
      return (t.projectTitle||'').toLowerCase().includes(s) || (t.leaderName||'').toLowerCase().includes(s) || (t.leaderRoll||'').toLowerCase().includes(s) || (t.teamNumber||'').toLowerCase().includes(s) || String(t.serialNumber).includes(s)
    }
    return true
  }) || []

  const techColors = {'Data Specialist':'#3b82f6','AWS Development':'#f59e0b','Full Stack':'#10b981','Google Flutter':'#06b6d4','ServiceNow':'#8b5cf6','VLSI':'#ef4444'}

  // ═══ LOGIN / OTP SCREEN ═══
  if (step !== 'dashboard') {
    return (
      <>
        <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:auto}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.adm-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#050008;position:relative}
.adm-bg{position:fixed;inset:0;background:radial-gradient(ellipse at 30% 20%,rgba(253,28,0,.04),transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(250,160,0,.03),transparent 50%);pointer-events:none}
.adm-card{width:100%;max-width:400px;background:rgba(12,8,20,.9);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:40px 32px;backdrop-filter:blur(20px);animation:fadeUp .5s ease;position:relative;z-index:2}
.adm-logo{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;margin:0 auto 16px;box-shadow:0 0 24px rgba(253,28,0,.3)}
.adm-title{font-family:'Orbitron',sans-serif;font-size:1rem;font-weight:700;letter-spacing:3px;text-align:center;color:#fff;margin-bottom:4px}
.adm-sub{font-size:.78rem;color:rgba(255,255,255,.35);text-align:center;margin-bottom:28px}
.adm-label{display:block;font-size:.65rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:6px}
.adm-input{width:100%;padding:12px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#fff;font-size:.88rem;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s}
.adm-input:focus{border-color:rgba(253,28,0,.3)}
.adm-btn{width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,#fd1c00,#fd3a20);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;margin-top:16px;transition:box-shadow .2s}
.adm-btn:hover{box-shadow:0 4px 24px rgba(253,28,0,.3)}
.adm-btn:disabled{opacity:.5;cursor:not-allowed}
.adm-err{background:rgba(255,40,0,.06);border:1px solid rgba(255,40,0,.15);border-radius:10px;padding:10px 14px;font-size:.78rem;color:#ff6040;margin-bottom:14px}
.adm-info{background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);border-radius:10px;padding:10px 14px;font-size:.78rem;color:#4ade80;margin-bottom:14px}
.adm-back{display:block;text-align:center;margin-top:14px;font-size:.76rem;color:rgba(255,255,255,.35);cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif}
.adm-back:hover{color:#fff}
@media(max-width:480px){.adm-card{padding:28px 20px;border-radius:16px}}
        `}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>
        <div className="adm-wrap">
          <div className="adm-bg"/>
          <div className="adm-card">
            <div className="adm-logo">PS</div>
            <div className="adm-title">ADMIN PANEL</div>
            <div className="adm-sub">{step==='login'?'Enter your admin email':'Enter the OTP sent to your email'}</div>
            {error && <div className="adm-err">{error}</div>}
            {step==='login' ? (<>
              <label className="adm-label">Admin Email</label>
              <input className="adm-input" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendOTP()} autoFocus/>
              <button className="adm-btn" onClick={handleSendOTP} disabled={loading||!email}>{loading?'Sending OTP...':'Send OTP →'}</button>
              <button className="adm-back" onClick={()=>router.push('/')}>← Back to Home</button>
            </>) : (<>
              <div className="adm-info">OTP sent to {email}</div>
              <label className="adm-label">Enter OTP</label>
              <input className="adm-input" placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus style={{letterSpacing:'6px',textAlign:'center',fontSize:'1.1rem'}}/>
              <button className="adm-btn" onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify & Login →'}</button>
              <button className="adm-back" onClick={()=>{setStep('login');setOtp('');setError('')}}>← Change email</button>
            </>)}
          </div>
        </div>
      </>
    )
  }

  // ═══ DASHBOARD ═══
  const s = data?.stats || {}
  const tabs = [
    {id:'overview',label:'Overview',icon:'📊'},
    {id:'mentors',label:'Mentors',icon:'👨‍🏫'},
    {id:'teams',label:'Teams',icon:'👥'},
    {id:'actions',label:'Actions',icon:'⚡'}
  ]

  return (
    <>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:auto}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
.db{min-height:100vh;background:#050008}
.db-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid rgba(255,255,255,.04);position:sticky;top:0;z-index:100;background:rgba(5,0,8,.95);backdrop-filter:blur(16px)}
.db-logo{display:flex;align-items:center;gap:10px}
.db-logo-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff}
.db-logo-text{font-family:'Orbitron',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.8)}
.db-logo-sub{font-size:.6rem;color:rgba(255,255,255,.3);margin-top:1px}
.db-logout{padding:7px 16px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.5);font-size:.72rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.db-logout:hover{background:rgba(255,40,0,.06);border-color:rgba(255,40,0,.15);color:#ff6040}
.db-tabs{display:flex;gap:4px;padding:12px 28px;border-bottom:1px solid rgba(255,255,255,.03);overflow-x:auto}
.db-tab{padding:8px 18px;border-radius:10px;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.4);cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;background:none;font-family:'DM Sans',sans-serif}
.db-tab:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.db-tab.on{color:#fff;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.12)}
.db-body{padding:24px 28px;max-width:1400px;margin:0 auto}

/* Stats cards */
.st-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.st-card{padding:22px 20px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:countUp .5s ease both}
.st-card:nth-child(2){animation-delay:.1s}.st-card:nth-child(3){animation-delay:.2s}.st-card:nth-child(4){animation-delay:.3s}
.st-val{font-size:2rem;font-weight:800;color:#fff;line-height:1}
.st-label{font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:500}
.st-accent{color:#fd1c00}
.st-green{color:#4ade80}
.st-amber{color:#EEA727}
.st-blue{color:#3b82f6}

/* Progress bar */
.prog-wrap{margin-bottom:28px;padding:20px 24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.prog-title{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.7)}
.prog-pct{font-size:1.2rem;font-weight:800;color:#fd1c00}
.prog-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s cubic-bezier(.4,0,.2,1)}

/* Tech breakdown */
.tech-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.tech-card{padding:18px 16px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:14px;animation:fadeUp .4s ease both}
.tech-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tech-info{flex:1}
.tech-name{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.8)}
.tech-stat{font-size:.65rem;color:rgba(255,255,255,.35);margin-top:2px}
.tech-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:6px;overflow:hidden}
.tech-bar-fill{height:100%;border-radius:2px;transition:width .8s ease}

/* Mentor cards */
.mn-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.mn-card{padding:20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s}
.mn-card:hover{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.03)}
.mn-card.expanded{border-color:rgba(253,28,0,.15);background:rgba(253,28,0,.02)}
.mn-hdr{display:flex;justify-content:space-between;align-items:center}
.mn-name{font-size:.88rem;font-weight:600;color:#fff}
.mn-badge{font-size:.65rem;padding:3px 10px;border-radius:6px;font-weight:500}
.mn-badge.done{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
.mn-badge.pending{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.mn-stats{display:flex;gap:16px;margin-top:10px;font-size:.72rem;color:rgba(255,255,255,.4)}
.mn-stats span{display:flex;align-items:center;gap:4px}
.mn-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:10px;overflow:hidden}
.mn-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#4ade80,#10b981);transition:width .6s ease}
.mn-teams{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:8px}
.mn-team{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.02);font-size:.74rem}
.mn-team-name{color:rgba(255,255,255,.7);flex:1}
.mn-team-status{font-size:.65rem;padding:2px 8px;border-radius:4px}
.mn-team-status.reg{background:rgba(74,222,128,.08);color:#4ade80}
.mn-team-status.pen{background:rgba(255,255,255,.04);color:rgba(255,255,255,.35)}
.mn-team-acc{font-size:.6rem;padding:2px 6px;border-radius:4px;background:rgba(59,130,246,.08);color:#3b82f6;margin-left:6px}

/* Teams table */
.tbl-controls{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
.tbl-search{flex:1;min-width:200px;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:#fff;font-size:.82rem;outline:none;font-family:'DM Sans',sans-serif}
.tbl-search:focus{border-color:rgba(253,28,0,.2)}
.tbl-search::placeholder{color:rgba(255,255,255,.2)}
.tbl-filter{padding:8px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;color:rgba(255,255,255,.6);font-size:.75rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.tbl-filter:hover,.tbl-filter.on{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.12);color:#fd1c00}
.tbl-count{font-size:.72rem;color:rgba(255,255,255,.3);margin-left:auto}
.tbl{width:100%;border-collapse:separate;border-spacing:0 6px}
.tbl th{text-align:left;padding:8px 12px;font-size:.62rem;font-weight:600;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px}
.tbl td{padding:12px;background:rgba(255,255,255,.015);border-top:1px solid rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.02);font-size:.78rem;color:rgba(255,255,255,.7)}
.tbl tr td:first-child{border-left:1px solid rgba(255,255,255,.02);border-radius:10px 0 0 10px}
.tbl tr td:last-child{border-right:1px solid rgba(255,255,255,.02);border-radius:0 10px 10px 0}
.tbl tr:hover td{background:rgba(255,255,255,.03)}
.tbl-status{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:500}
.tbl-status.reg{background:rgba(74,222,128,.08);color:#4ade80}
.tbl-status.pen{background:rgba(255,255,255,.04);color:rgba(255,255,255,.35)}
.tbl-tech{font-size:.65rem;padding:3px 8px;border-radius:6px;font-weight:500;display:inline-block}
.tbl-expand{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.72rem;padding:4px 8px;border-radius:6px;transition:all .2s;font-family:'DM Sans',sans-serif}
.tbl-expand:hover{color:#fff;background:rgba(255,255,255,.05)}
.tbl-detail{padding:16px 20px;background:rgba(255,255,255,.01);border:1px solid rgba(255,255,255,.03);border-radius:12px;margin:4px 0 8px;font-size:.74rem;color:rgba(255,255,255,.5)}
.tbl-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.tbl-detail-item{padding:10px;border-radius:8px;background:rgba(255,255,255,.02)}
.tbl-detail-label{font-size:.6rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.tbl-detail-val{font-size:.76rem;color:rgba(255,255,255,.7)}

/* Actions */
.act-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.act-card{padding:24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.act-title{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.act-desc{font-size:.74rem;color:rgba(255,255,255,.35);margin-bottom:16px;line-height:1.5}
.act-btn{padding:10px 20px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.act-btn.primary{background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff;box-shadow:0 2px 12px rgba(253,28,0,.2)}
.act-btn.primary:hover{box-shadow:0 4px 20px rgba(253,28,0,.35)}
.act-btn.secondary{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.6)}
.act-btn.secondary:hover{background:rgba(255,255,255,.08);color:#fff}
.act-btn:disabled{opacity:.5;cursor:not-allowed}
.act-msg{margin-top:10px;font-size:.74rem;padding:8px 12px;border-radius:8px;background:rgba(74,222,128,.06);color:#4ade80}

/* Recent */
.recent{margin-top:28px}
.recent-title{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.recent-list{display:flex;flex-direction:column;gap:8px}
.recent-item{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03);animation:fadeUp .3s ease both}
.recent-num{font-size:.82rem;font-weight:700;color:#fd1c00;min-width:60px}
.recent-info{flex:1}
.recent-proj{font-size:.78rem;font-weight:500;color:rgba(255,255,255,.75)}
.recent-meta{font-size:.65rem;color:rgba(255,255,255,.3);margin-top:2px}
.recent-time{font-size:.65rem;color:rgba(255,255,255,.25);white-space:nowrap}

/* Responsive */
@media(max-width:900px){.st-grid{grid-template-columns:repeat(2,1fr)}.tech-grid{grid-template-columns:repeat(2,1fr)}.mn-grid{grid-template-columns:1fr}.act-grid{grid-template-columns:1fr}}
@media(max-width:640px){.st-grid{grid-template-columns:1fr}.tech-grid{grid-template-columns:1fr}.db-hdr{padding:12px 16px}.db-body{padding:16px}.db-tabs{padding:10px 16px}.tbl-controls{flex-direction:column}.tbl{display:block;overflow-x:auto}.tbl-detail-grid{grid-template-columns:1fr}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div className="db">
        <div className="db-hdr">
          <div className="db-logo">
            <div className="db-logo-icon">PS</div>
            <div><div className="db-logo-text">ADMIN PANEL</div><div className="db-logo-sub">Project Space · May 2026</div></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="db-logout" onClick={fetchDashboard}>↻ Refresh</button>
            <button className="db-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="db-tabs">
          {tabs.map(t => <button key={t.id} className={`db-tab ${activeTab===t.id?'on':''}`} onClick={()=>setActiveTab(t.id)}>{t.icon} {t.label}</button>)}
        </div>

        <div className="db-body">
          {loading && !data && <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading dashboard...</div>}

          {data && activeTab === 'overview' && (<>
            <div className="st-grid">
              <div className="st-card"><div className="st-val st-accent">{s.totalTeams}</div><div className="st-label">Total Teams</div></div>
              <div className="st-card"><div className="st-val st-green">{s.registeredCount}</div><div className="st-label">Registered</div></div>
              <div className="st-card"><div className="st-val st-amber">{s.pendingCount}</div><div className="st-label">Pending</div></div>
              <div className="st-card"><div className="st-val st-blue">{s.accountsCreated}</div><div className="st-label">Accounts Created</div></div>
            </div>

            <div className="prog-wrap">
              <div className="prog-hdr"><span className="prog-title">Registration Progress</span><span className="prog-pct">{s.progressPercent}%</span></div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${s.progressPercent}%`}}/></div>
            </div>

            <div className="tech-grid">
              {Object.entries(data.techBreakdown || {}).map(([tech,v]) => (
                <div key={tech} className="tech-card">
                  <div className="tech-dot" style={{background:techColors[tech]||'#888'}}/>
                  <div className="tech-info">
                    <div className="tech-name">{tech}</div>
                    <div className="tech-stat">{v.registered}/{v.total} registered · {v.pending} pending</div>
                    <div className="tech-bar"><div className="tech-bar-fill" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`,background:techColors[tech]||'#888'}}/></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="recent">
              <div className="recent-title">🕐 Recent Registrations</div>
              <div className="recent-list">
                {(data.recentRegistrations||[]).length===0 && <div style={{padding:'20px',textAlign:'center',color:'rgba(255,255,255,.2)',fontSize:'.78rem'}}>No registrations yet</div>}
                {(data.recentRegistrations||[]).map((r,i) => (
                  <div key={i} className="recent-item" style={{animationDelay:`${i*.05}s`}}>
                    <div className="recent-num">{r.teamNumber}</div>
                    <div className="recent-info"><div className="recent-proj">{r.projectTitle}</div><div className="recent-meta">{r.technology}</div></div>
                    <div className="recent-time">{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {data && activeTab === 'mentors' && (<>
            <div className="mn-grid">
              {Object.entries(data.mentorBreakdown || {}).sort((a,b) => b[1].total - a[1].total).map(([name,v]) => (
                <div key={name} className={`mn-card ${expandedMentor===name?'expanded':''}`} onClick={()=>setExpandedMentor(expandedMentor===name?null:name)}>
                  <div className="mn-hdr">
                    <div className="mn-name">{name}</div>
                    <div className={`mn-badge ${v.registered===v.total?'done':'pending'}`}>{v.registered===v.total?'✓ All Done':`${v.pending} pending`}</div>
                  </div>
                  <div className="mn-stats">
                    <span>📋 {v.total} teams</span>
                    <span>✅ {v.registered} registered</span>
                    <span>⏳ {v.pending} pending</span>
                  </div>
                  <div className="mn-bar"><div className="mn-bar-fill" style={{width:`${v.total>0?Math.round(v.registered/v.total*100):0}%`}}/></div>
                  {expandedMentor===name && (
                    <div className="mn-teams">
                      {v.teams.map(t => (
                        <div key={t.serialNumber} className="mn-team">
                          <span className="mn-team-name">#{t.serialNumber} {t.projectTitle || t.leaderName}</span>
                          <span className={`mn-team-status ${t.registered?'reg':'pen'}`}>{t.registered?'Registered':'Pending'}</span>
                          {t.accountCreated && <span className="mn-team-acc">Account ✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {data && activeTab === 'teams' && (<>
            <div className="tbl-controls">
              <input className="tbl-search" placeholder="Search teams, leaders, projects..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <button className={`tbl-filter ${filterStatus==='all'?'on':''}`} onClick={()=>setFilterStatus('all')}>All</button>
              <button className={`tbl-filter ${filterStatus==='registered'?'on':''}`} onClick={()=>setFilterStatus('registered')}>Registered</button>
              <button className={`tbl-filter ${filterStatus==='pending'?'on':''}`} onClick={()=>setFilterStatus('pending')}>Pending</button>
              <select className="tbl-filter" value={filterTech} onChange={e=>setFilterTech(e.target.value)} style={{appearance:'auto'}}>
                <option value="all">All Technologies</option>
                {Object.keys(data.techBreakdown||{}).map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <span className="tbl-count">{filteredTeams.length} teams</span>
            </div>
            <table className="tbl">
              <thead><tr><th>#</th><th>Team</th><th>Project</th><th>Technology</th><th>Leader</th><th>Mentor</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filteredTeams.map(t => (<>
                  <tr key={t.serialNumber}>
                    <td style={{fontWeight:600,color:'rgba(255,255,255,.4)'}}>{t.serialNumber}</td>
                    <td style={{fontWeight:600,color:'#fd1c00'}}>{t.teamNumber||'—'}</td>
                    <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.projectTitle||'—'}</td>
                    <td><span className="tbl-tech" style={{background:`${techColors[t.technology]||'#888'}15`,color:techColors[t.technology]||'#888',border:`1px solid ${techColors[t.technology]||'#888'}30`}}>{t.technology}</span></td>
                    <td>{t.leaderName}</td>
                    <td style={{color:'rgba(255,255,255,.4)'}}>{t.mentorAssigned||'—'}</td>
                    <td><span className={`tbl-status ${t.registered?'reg':'pen'}`}>{t.registered?'✓ Registered':'Pending'}</span></td>
                    <td><button className="tbl-expand" onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>{expandedTeam===t.serialNumber?'▲':'▼'}</button></td>
                  </tr>
                  {expandedTeam===t.serialNumber && (
                    <tr key={`detail-${t.serialNumber}`}><td colSpan={8}>
                      <div className="tbl-detail">
                        <div style={{fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:8}}>{t.projectTitle}</div>
                        {t.projectDescription && <div style={{marginBottom:8,lineHeight:1.5}}>{t.projectDescription}</div>}
                        <div className="tbl-detail-grid">
                          <div className="tbl-detail-item"><div className="tbl-detail-label">Problem Statement</div><div className="tbl-detail-val">{t.problemStatement||'—'}</div></div>
                          <div className="tbl-detail-item"><div className="tbl-detail-label">AI Usage</div><div className="tbl-detail-val">{t.aiUsage}</div></div>
                          <div className="tbl-detail-item"><div className="tbl-detail-label">Tech Stack</div><div className="tbl-detail-val">{(t.techStack||[]).join(', ')||'—'}</div></div>
                          <div className="tbl-detail-item"><div className="tbl-detail-label">Project Area</div><div className="tbl-detail-val">{(t.projectArea||[]).join(', ')||'—'}</div></div>
                          <div className="tbl-detail-item"><div className="tbl-detail-label">Members ({t.memberCount})</div><div className="tbl-detail-val">{(t.members||[]).map(m=>`${m.name}${m.isLeader?' ★':''}`).join(', ')}</div></div>
                          {t.registeredAt && <div className="tbl-detail-item"><div className="tbl-detail-label">Registered At</div><div className="tbl-detail-val">{new Date(t.registeredAt).toLocaleString('en-IN')}</div></div>}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </>))}
              </tbody>
            </table>
          </>)}

          {data && activeTab === 'actions' && (<>
            <div className="act-grid">
              <div className="act-card">
                <div className="act-title">📧 Send Reminders</div>
                <div className="act-desc">Send registration reminder emails to all team leaders who haven't registered yet ({s.pendingCount} teams pending)</div>
                <button className="act-btn primary" onClick={handleRemind} disabled={reminding||s.pendingCount===0}>{reminding?'Sending...':'Send Reminders to All Pending Teams'}</button>
                {reminderMsg && <div className="act-msg">{reminderMsg}</div>}
              </div>
              <div className="act-card">
                <div className="act-title">📥 Export Data</div>
                <div className="act-desc">Download team data and registration details as CSV files for reporting</div>
                <div style={{display:'flex',gap:10}}>
                  <button className="act-btn secondary" onClick={()=>handleExport('teams')}>Export All Teams</button>
                  <button className="act-btn secondary" onClick={()=>handleExport('registrations')}>Export Registrations</button>
                </div>
              </div>
              <div className="act-card">
                <div className="act-title">📊 Quick Stats</div>
                <div className="act-desc">Registration overview at a glance</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
                  <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.74rem'}}><span style={{color:'rgba(255,255,255,.35)'}}>Total Students</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#fff',marginTop:2}}>{s.totalStudents}</div></div>
                  <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.74rem'}}><span style={{color:'rgba(255,255,255,.35)'}}>Accounts Created</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#3b82f6',marginTop:2}}>{s.accountsCreated}</div></div>
                  <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.74rem'}}><span style={{color:'rgba(255,255,255,.35)'}}>Registered</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#4ade80',marginTop:2}}>{s.registeredCount}</div></div>
                  <div style={{padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.02)',fontSize:'.74rem'}}><span style={{color:'rgba(255,255,255,.35)'}}>Pending</span><div style={{fontWeight:700,fontSize:'1.1rem',color:'#EEA727',marginTop:2}}>{s.pendingCount}</div></div>
                </div>
              </div>
              <div className="act-card">
                <div className="act-title">🔄 Refresh Data</div>
                <div className="act-desc">Reload all dashboard data to see the latest registration status</div>
                <button className="act-btn secondary" onClick={fetchDashboard} disabled={loading}>{loading?'Loading...':'Refresh Dashboard'}</button>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </>
  )
}