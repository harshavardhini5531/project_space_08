'use client'
import { setSession } from '@/lib/session'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { globalStyles, colors, fonts } from '@/lib/theme'

const LEADER_ICON = 'https://i.ibb.co/zH6Hmhkq/leadership.png'
const MEMBER_ICON = 'https://i.ibb.co/VY31hrPC/group-users.png'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [role, setRole]                   = useState(null)
  const [mode, setMode]                   = useState('signin')
  const [step, setStep]                   = useState(1)
  const [rollNumber, setRollNumber]       = useState('')
  const [password, setPassword]           = useState('')
  const [otp, setOtp]                     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [studentInfo, setStudentInfo]     = useState(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [isMobile, setIsMobile]           = useState(false)
  const [toast, setToast]                 = useState(null)
  const [showPass, setShowPass]           = useState(false)
  const [popId, setPopId]                 = useState(null)
  const [proceed, setProceed]             = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('registeredRoll')
    if (saved) { setRollNumber(saved); sessionStorage.removeItem('registeredRoll') }
    if (searchParams.get('registered') === 'true') showToast('success', 'Account created! Please login.')
  }, [])

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000) }

  const handleSelectRole = (id) => {
    setPopId(id)
    setRole(id)
    setTimeout(() => setPopId(null), 500)
  }

  async function handleLeaderLogin() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rollNumber, password, role:'leader' }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      const userData = data.user || { ...data.student, ...data.team }
      setSession({ ...userData, role:'leader' })
      // Check if team is already registered
      const isRegistered = userData.registered === true
      router.push(isRegistered ? '/dashboard' : '/dashboard/register-team')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleMemberSignin() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rollNumber, password, role:'member' }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      // API returns data.user — store it with role
      const userData = data.user || { ...data.student, ...data.team }
      setSession({ ...userData, role:'member' })
      router.push('/dashboard')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleMemberSendOTP() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rollNumber, role:'member' }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStudentInfo(data); setStep(2)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleMemberVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rollNumber, otp }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep(3)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleMemberSetPassword() {
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/set-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rollNumber, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      sessionStorage.setItem('registeredRoll', rollNumber)
      setMode('signin'); setStep(1); setOtp(''); setPassword(''); setConfirmPassword('')
      showToast('success', 'Account created! Sign in now.')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  const maskedEmail = studentInfo?.email
    ? studentInfo.email.replace(/(.{2})(.*)(@.*)/, (_,a,b,c) => a+'*'.repeat(Math.min(b.length,6))+c)
    : ''

  const handleBack = () => {
    if (proceed && role && step > 1) { setStep(s => s-1); setError('') }
    else if (proceed) { setProceed(false); setError(''); setStep(1); setMode('signin') }
    else if (role) { setRole(null) }
    else { router.push('/') }
  }

  const circleR = 65
  const circumference = 2 * Math.PI * circleR

  const RoleCard = ({ id, icon, label }) => {
    const isActive = role === id
    const isPop = popId === id
    const iconCls = isPop ? 'rc-icon pop' : isActive ? 'rc-icon active' : 'rc-icon idle'
    return (
      <div className="rc-card" onClick={() => handleSelectRole(id)}>
        <div className="rc-circle-wrap">
          <svg className="rc-ring-svg" viewBox="0 0 134 134">
            <circle className="rc-ring-bg" cx="67" cy="67" r={circleR} />
            <circle className={`rc-ring-fill${isActive ? ' on' : ''}`} cx="67" cy="67" r={circleR}
              style={{ strokeDasharray: circumference, strokeDashoffset: isActive ? 0 : circumference }} />
          </svg>
          <div className={`rc-inner ${isActive ? 'on' : ''}`}>
            <div className={`rc-glow${isActive ? ' on' : ''}`} />
            <img src={icon} alt={label} className={iconCls} />
          </div>
        </div>
        <div className={`rc-label ${isActive ? 'on' : ''}`}>{label}</div>
      </div>
    )
  }

  return (
    <AuthBackground>
      <style>{`
        ${globalStyles}
        html,body{overflow-y:auto!important;}

        .lp-wrap{width:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;}
        .lp-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:48px;animation:lpUp 0.5s ease both;}
        .lp-logo-title{font-family:${fonts.display};font-size:1.1rem;font-weight:600;letter-spacing:5px;margin-top:16px;color:#fff;}
        .lp-heading{text-align:center;margin-bottom:48px;animation:lpUp 0.5s ease 0.1s both;}
        .lp-heading-text{font-family:${fonts.display};font-size:0.78rem;font-weight:400;letter-spacing:5px;text-transform:uppercase;color:${colors.textMuted};}

        .rc-cards{display:flex;gap:60px;margin-bottom:48px;animation:lpUp 0.5s ease 0.2s both;}
        .rc-card{display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);}
        .rc-card:hover{transform:translateY(-6px);}
        .rc-circle-wrap{position:relative;width:134px;height:134px;margin-bottom:16px;}
        .rc-ring-svg{position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(-90deg);}
        .rc-ring-bg{fill:none;stroke:rgba(255,255,255,0.06);stroke-width:2;}
        .rc-ring-fill{fill:none;stroke:#fd1c00;stroke-width:2;stroke-linecap:round;transition:stroke-dashoffset 1.2s cubic-bezier(0.25,0.1,0.25,1);}
        .rc-inner{position:absolute;top:2px;left:2px;right:2px;bottom:2px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.02);transition:background 0.4s;}
        .rc-inner.on{background:rgba(253,28,0,0.05);}
        .rc-inner:hover{background:rgba(255,255,255,0.04);}
        .rc-glow{position:absolute;width:70px;height:70px;border-radius:50%;pointer-events:none;transition:opacity 0.5s,transform 0.5s;opacity:0;transform:scale(0.6);background:radial-gradient(circle,rgba(253,28,0,0.25) 0%,rgba(253,80,0,0.12) 40%,transparent 70%);}
        .rc-glow.on{opacity:1;transform:scale(1);animation:rcPulse 2.5s ease-in-out infinite;}
        @keyframes rcPulse{0%,100%{opacity:0.8;transform:scale(1);}50%{opacity:1;transform:scale(1.15);}}
        .rc-icon{width:65px;height:65px;object-fit:contain;position:relative;z-index:1;transition:filter 0.4s,opacity 0.4s;}
        .rc-icon.idle{filter:invert(1) brightness(0.45);opacity:0.45;}
        .rc-icon.active{filter:invert(1) brightness(1) drop-shadow(0 0 12px rgba(253,28,0,0.3));opacity:1;}
        .rc-icon.pop{filter:invert(1) brightness(1) drop-shadow(0 0 16px rgba(253,28,0,0.4));opacity:1;animation:rcZoom 0.5s cubic-bezier(0.34,1.56,0.64,1);}
        @keyframes rcZoom{0%{transform:scale(1);}30%{transform:scale(0.75);}60%{transform:scale(1.12);}80%{transform:scale(0.95);}100%{transform:scale(1);}}
        .rc-label{font-family:${fonts.body};font-size:0.72rem;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;transition:color 0.35s;}
        .rc-label.on{color:#fff;}
        .rc-label:not(.on){color:rgba(255,255,255,0.28);}

        .lp-next{padding:14px 52px;border:none;border-radius:12px;font-family:${fonts.body};font-size:0.82rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all 0.25s;animation:lpUp 0.5s ease 0.3s both;position:relative;overflow:hidden;}
        .lp-next.on{background:${colors.gradientPrimary};color:#fff;box-shadow:0 4px 22px ${colors.primaryGlow};}
        .lp-next.on:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(253,28,0,0.42);}
        .lp-next.on:active{transform:scale(0.97);}
        .lp-next.off{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.14);cursor:not-allowed;border:1px solid rgba(255,255,255,0.04);}

        .lp-back-link{margin-top:24px;font-size:0.72rem;color:rgba(255,255,255,0.2);background:none;border:none;cursor:pointer;font-family:${fonts.body};transition:color 0.2s;display:flex;align-items:center;gap:6px;animation:lpUp 0.5s ease 0.4s both;}
        .lp-back-link:hover{color:rgba(255,255,255,0.5);}

        .lf-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:${fonts.body};}
        .lf-card{width:100%;max-width:420px;background:${colors.bgCard};backdrop-filter:blur(24px);border:1px solid ${colors.border};border-radius:20px;padding:36px 32px 32px;animation:psCardIn 0.5s cubic-bezier(0.4,0,0.2,1) both;}
        .lf-header{display:flex;flex-direction:column;align-items:center;margin-bottom:24px;}
        .lf-title{font-family:${fonts.display};font-size:0.9rem;font-weight:600;letter-spacing:3px;margin-top:10px;}
        .lf-sub{font-size:0.72rem;color:${colors.textMuted};margin-top:2px;}
        .lf-field{margin-bottom:14px;}
        .lf-label{display:block;font-size:0.68rem;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;color:${colors.textMuted};margin-bottom:6px;}
        .lf-pass-wrap{position:relative;}
        .lf-pass-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:${colors.textMuted};font-size:10px;font-family:${fonts.body};}
        .lf-mode-toggle{display:flex;gap:3px;margin-bottom:18px;background:rgba(255,255,255,0.03);border-radius:10px;padding:3px;}
        .lf-mode-btn{flex:1;padding:9px;border-radius:7px;border:none;cursor:pointer;font-family:${fonts.body};font-size:0.78rem;font-weight:500;transition:all 0.2s;}
        .lf-mode-btn.active{background:rgba(253,28,0,0.1);color:#fd1c00;}
        .lf-mode-btn:not(.active){background:transparent;color:${colors.textMuted};}
        .lf-link{text-align:center;margin-top:14px;font-size:0.75rem;color:${colors.textMuted};}
        .lf-link span{color:${colors.error};cursor:pointer;font-weight:500;}

        @keyframes lpUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}

        @media(max-width:520px){
          .rc-cards{gap:28px;}
          .rc-circle-wrap{width:110px;height:110px;}
          .rc-icon{width:50px;height:50px;}
          .rc-glow{width:50px;height:50px;}
          .lp-heading-text{font-size:0.68rem;letter-spacing:3px;}
          .lp-next{padding:12px 36px;font-size:0.75rem;}
          .lp-logo-wrap{margin-bottom:32px;}
          .lp-heading{margin-bottom:32px;}
          .rc-cards{margin-bottom:32px;}
          .lf-card{max-width:100%;padding:28px 20px 24px;border-radius:16px;}
        }
      
        /* ── Robot Mascot (desktop only) ── */
        .robo-mascot{position:fixed;bottom:24px;left:32px;z-index:20;display:flex;flex-direction:column;align-items:center;animation:roboFadeIn 1s ease 0.8s both;}
        .robo-spotlight-cone{position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:3;overflow:hidden;}
        .robo-cone-beam{position:absolute;top:47%;left:50%;width:200px;height:200vh;transform:translate(-50%,-50%) rotate(70deg);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,240,220,0.05) 20%,rgba(255,240,220,0.1) 45%,rgba(255,240,220,0.1) 55%,rgba(255,240,220,0.05) 80%,rgba(255,255,255,0) 100%);filter:blur(2px);animation:coneFlicker 4s ease-in-out infinite;}
        .robo-cone-outer{position:absolute;top:47%;left:50%;width:350px;height:200vh;transform:translate(-50%,-50%) rotate(70deg);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,230,200,0.02) 25%,rgba(255,230,200,0.05) 45%,rgba(255,230,200,0.05) 55%,rgba(255,230,200,0.02) 75%,rgba(255,255,255,0) 100%);filter:blur(15px);animation:coneFlicker 4s ease-in-out 1s infinite;}
        .robo-ground-light{position:absolute;bottom:3%;left:2%;width:300px;height:300px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,240,220,0.12) 0%,rgba(255,240,220,0.05) 35%,transparent 65%);filter:blur(25px);animation:groundPulse 3s ease-in-out infinite;}
        .robo-img{width:250px;height:250px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(255,255,255,0.15)) drop-shadow(0 0 60px rgba(255,255,255,0.06));animation:roboBounce 2s ease-in-out infinite;position:relative;z-index:2;}
        .robo-shadow{width:160px;height:20px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.3) 40%,transparent 75%);margin-top:-12px;filter:blur(4px);animation:shadowPulse 2s ease-in-out infinite;z-index:1;}
        @keyframes shadowPulse{0%,100%{transform:scaleX(1);opacity:1;}30%{transform:scaleX(0.65);opacity:0.4;}50%{transform:scaleX(0.7);opacity:0.5;}70%{transform:scaleX(0.65);opacity:0.4;}}
        @keyframes roboBounce{0%,100%{transform:translateY(0);}30%{transform:translateY(-18px);}50%{transform:translateY(-14px);}70%{transform:translateY(-18px);}}
        @keyframes coneFlicker{0%,100%{opacity:0.8;}25%{opacity:1;}50%{opacity:0.7;}75%{opacity:0.95;}}
        @keyframes groundPulse{0%,100%{opacity:1;transform:translateX(-50%) scaleX(1);}30%{opacity:0.5;transform:translateX(-50%) scaleX(0.75);}50%{opacity:0.6;transform:translateX(-50%) scaleX(0.8);}70%{opacity:0.5;transform:translateX(-50%) scaleX(0.75);}}
        @keyframes roboFadeIn{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

        `}</style>

      {toast && <div className={`ps-toast ${toast.type}`}>{toast.msg}</div>}

      <button className="ps-back" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* ═══ ROLE SELECTION ═══ */}
      {!proceed && (
        <div className="lp-wrap">
          <div className="lp-logo-wrap">
            <div className="ps-logo">PS</div>
            <div className="lp-logo-title">PROJECT SPACE</div>
          </div>
          <div className="lp-heading">
            <span className="lp-heading-text">Select your role</span>
          </div>
          <div className="rc-cards">
            <RoleCard id="leader" icon={LEADER_ICON} label="TEAM LEADER" />
            <RoleCard id="member" icon={MEMBER_ICON} label="TEAM MEMBER" />
          </div>
          <button className={`lp-next ${role ? 'on' : 'off'}`} disabled={!role}
            onClick={() => role && setProceed(true)}>
            NEXT STEP
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button className="lp-back-link" onClick={() => router.push('/')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back to home
          </button>
        </div>
      )}

      {/* ═══ LOGIN FORMS ═══ */}
      {proceed && (
        <div className="lf-wrap">
          <div className="lf-card">
            <div className="lf-header">
              <div className="ps-logo">PS</div>
              <div className="lf-title">PROJECT SPACE</div>
              <div className="lf-sub">{role === 'leader' ? 'Team Leader Login' : 'Team Member'}</div>
            </div>

            {error && <div className="ps-error">{error}</div>}

            {role === 'leader' && (<>
              <div className="lf-field"><label className="lf-label">Roll Number</label>
                <input className="ps-input" placeholder="e.g. 23P31A4441" value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())} autoFocus /></div>
              <div className="lf-field"><label className="lf-label">Password</label>
                <div className="lf-pass-wrap">
                  <input className="ps-input" type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLeaderLogin()} style={{paddingRight:'52px'}} />
                  <button className="lf-pass-toggle" onClick={() => setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button>
                </div></div>
              <button className="ps-btn-primary" onClick={handleLeaderLogin} disabled={loading||!rollNumber||!password}>{loading?'Logging in...':'Login →'}</button>
              <div className="lf-link">Don&apos;t have an account? <span onClick={() => router.push('/auth/register')}>Create Account</span></div>
            </>)}

            {role === 'member' && (<>
              <div className="lf-mode-toggle">
                <button className={`lf-mode-btn ${mode==='signin'?'active':''}`} onClick={() => {setMode('signin');setStep(1);setError('')}}>Sign In</button>
                <button className={`lf-mode-btn ${mode==='signup'?'active':''}`} onClick={() => {setMode('signup');setStep(1);setError('')}}>Sign Up</button>
              </div>

              {mode==='signin' && (<>
                <div className="lf-field"><label className="lf-label">Roll Number</label><input className="ps-input" placeholder="e.g. 23P31A4441" value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())} autoFocus /></div>
                <div className="lf-field"><label className="lf-label">Password</label><div className="lf-pass-wrap"><input className="ps-input" type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleMemberSignin()} style={{paddingRight:'52px'}} /><button className="lf-pass-toggle" onClick={() => setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button></div></div>
                <button className="ps-btn-primary" onClick={handleMemberSignin} disabled={loading||!rollNumber||!password}>{loading?'Logging in...':'Sign In →'}</button>
              </>)}

              {mode==='signup' && step===1 && (<>
                <div className="lf-field"><label className="lf-label">Roll Number</label><input className="ps-input" placeholder="e.g. 23P31A4441" value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter' && handleMemberSendOTP()} autoFocus /></div>
                <button className="ps-btn-primary" onClick={handleMemberSendOTP} disabled={loading||!rollNumber}>{loading?'Sending...':'Send OTP →'}</button>
              </>)}

              {mode==='signup' && step===2 && (<>
                {studentInfo && <div className="ps-info">Hi <strong>{studentInfo.name}</strong>! OTP sent to <strong>{maskedEmail}</strong></div>}
                <div className="lf-field"><label className="lf-label">Enter OTP</label><input className="ps-input" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e => e.key==='Enter' && handleMemberVerifyOTP()} maxLength={6} autoFocus style={{letterSpacing:'4px',textAlign:'center'}} /></div>
                <button className="ps-btn-primary" onClick={handleMemberVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify OTP →'}</button>
              </>)}

              {mode==='signup' && step===3 && (<>
                <div className="lf-field"><label className="lf-label">Create Password</label><input className="ps-input" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoFocus /></div>
                <div className="lf-field"><label className="lf-label">Confirm Password</label><input className="ps-input" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleMemberSetPassword()} /></div>
                <button className="ps-btn-primary" onClick={handleMemberSetPassword} disabled={loading||!password||!confirmPassword}>{loading?'Creating...':'Create Account →'}</button>
              </>)}
            </>)}
          </div>
        </div>
      )}

      {/* Robot + Spotlight — desktop only */}
      {!isMobile && (
        <>
          <div className="robo-spotlight-cone">
            <div className="robo-cone-beam" />
            <div className="robo-cone-outer" />
            <div className="robo-ground-light" />
          </div>
          <div className="robo-mascot">
            <img className="robo-img" src="https://i.ibb.co/NdXXswGc/Gemini-Generated-Image-zecq2szecq2szecq-removebg-preview.png" alt="Robot mascot" />
            <div className="robo-shadow" />
          </div>
        </>
      )}
    </AuthBackground>
  )
} 