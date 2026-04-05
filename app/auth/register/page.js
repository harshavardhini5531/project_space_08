'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { globalStyles, colors, fonts } from '@/lib/theme'
import { PHASE } from '@/lib/phase'
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep]                   = useState(1)
  const [rollNumber, setRollNumber]       = useState('')
  const [otp, setOtp]                     = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [studentInfo, setStudentInfo]     = useState(null)
  const [loading, setLoading]             // ═══ MOBILE LAYOUT ═══
  if (isMobile) {= useState(false)
  const [error, setError]                 = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const passwordRules = [
    { label: 'At least 8 characters',    test: v => v.length >= 8 },
    { label: 'One uppercase letter',     test: v => /[A-Z]/.test(v) },
    { label: 'One number',               test: v => /[0-9]/.test(v) },
    { label: 'One special character',    test: v => /[^A-Za-z0-9]/.test(v) },
  ]

  async function handleSendOTP() {
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ rollNumber, role: 'leader' })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStudentInfo(data); setStep(2)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ rollNumber, otp })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep(3)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  async function handleSetPassword() {
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    const failed = passwordRules.find(r => !r.test(password))
    if (failed) { setError(failed.label + ' is required'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/set-password', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ rollNumber, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      sessionStorage.setItem('registeredRoll', rollNumber)
      router.push('/auth/leader-login')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  const maskedEmail = studentInfo?.email
    ? studentInfo.email.replace(/(.{2})(.*)(@.*)/, (_,a,b,c) => a + '*'.repeat(Math.min(b.length,6)) + c)
    : ''

  const isAlreadyExistsError = error && error.toLowerCase().includes('already')

  // Shared error banner component for both views
  const ErrorBanner = () => {
    if (!error) return null
    return (
      <div style={{
        background: isAlreadyExistsError ? 'rgba(238,167,39,0.06)' : 'rgba(255,40,0,0.06)',
        border: `1px solid ${isAlreadyExistsError ? 'rgba(238,167,39,0.2)' : 'rgba(255,40,0,0.15)'}`,
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '16px',
        animation: 'errIn 0.3s ease'
      }}>
        <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
          <div style={{
            width:'28px',height:'28px',borderRadius:'8px',flexShrink:0,
            background: isAlreadyExistsError ? 'rgba(238,167,39,0.12)' : 'rgba(255,40,0,0.1)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'13px',marginTop:'1px'
          }}>
            {isAlreadyExistsError ? '🔑' : '⚠️'}
          </div>
          <div style={{flex:1}}>
            <div style={{
              fontSize:'0.8rem',
              color: isAlreadyExistsError ? '#EEA727' : '#ff6040',
              fontWeight:500,lineHeight:1.5
            }}>{error}</div>
            {isAlreadyExistsError && (
              <button
                onClick={() => router.push('/auth/leader-login')}
                style={{
                  marginTop:'10px',
                  display:'flex',alignItems:'center',gap:'6px',
                  padding:'9px 18px',borderRadius:'10px',
                  background:'linear-gradient(135deg,#EEA727,#d4911e)',
                  border:'none',color:'#fff',
                  fontFamily:"'DM Sans','Poppins',sans-serif",
                  fontSize:'0.78rem',fontWeight:600,
                  cursor:'pointer',
                  boxShadow:'0 2px 12px rgba(238,167,39,0.25)',
                  transition:'all 0.2s'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Login to complete registration
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const StepDot = ({ n }) => {
    const state = step > n ? 'done' : step === n ? 'active' : 'pending'
    return <div className={`ps-step-dot ${state}`}>{step > n ? '✓' : n}</div>
  }

  // ═══ MOBILE LAYOUT ═══
  if (isMobile) {
    return (
      <AuthBackground>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;}
          html,body{background:#050008;overflow:auto!important;}
          body{font-family:'Poppins',sans-serif;color:#fff;}
          @keyframes errIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
          .ma-wrap{
            width:100%;min-height:100vh;min-height:100dvh;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            padding:20px 6vw;background:#050008;position:relative;overflow:auto;
          }
          .ma-stars{
            position:fixed;inset:0;pointer-events:none;
            background-image:
              radial-gradient(1px 1px at 10% 20%,rgba(255,255,255,0.25),transparent),
              radial-gradient(1px 1px at 30% 60%,rgba(255,255,255,0.15),transparent),
              radial-gradient(1px 1px at 50% 10%,rgba(255,255,255,0.2),transparent),
              radial-gradient(1px 1px at 70% 40%,rgba(255,255,255,0.12),transparent),
              radial-gradient(1px 1px at 90% 70%,rgba(255,255,255,0.18),transparent),
              radial-gradient(1px 1px at 85% 15%,rgba(255,255,255,0.2),transparent);
          }
          .ma-glow{
            position:fixed;top:-20vh;left:50%;transform:translateX(-50%);
            width:80vw;height:40vh;border-radius:50%;
            background:radial-gradient(ellipse,rgba(253,28,0,0.05) 0%,transparent 70%);
            pointer-events:none;
          }
          .ma-back{
            position:absolute;top:16px;left:16px;
            display:flex;align-items:center;gap:5px;
            background:none;border:none;color:rgba(255,255,255,0.5);
            font-family:'Poppins',sans-serif;font-size:12px;cursor:pointer;z-index:10;
          }
          .ma-card{
            width:100%;max-width:380px;
            background:rgba(15,10,20,0.85);
            border:1px solid rgba(255,255,255,0.09);
            border-radius:16px;padding:28px 20px 24px;
            backdrop-filter:blur(12px);position:relative;z-index:2;
          }
        `}</style>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div className="ma-wrap">
          <div className="ma-stars" />
          <div className="ma-glow" />
          <button className="ma-back" onClick={() => step === 1 ? router.push('/') : setStep(s => s-1)}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
            Back
          </button>
          <div className="ma-card">
            <div className="card-header" style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'24px'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'10px',background:'linear-gradient(135deg,#ff2800,#ff5535)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Orbitron',sans-serif",fontSize:'12px',fontWeight:600,color:'#fff',boxShadow:'0 0 20px rgba(255,40,0,0.4)'}}>PS</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'0.85rem',fontWeight:600,letterSpacing:'3px',color:'#fff',marginTop:'10px'}}>PROJECT SPACE</div>
              <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.35)',fontWeight:300,marginTop:'2px'}}>Create your account — Team Leaders only</div>
            </div>

            <div className="ps-steps" style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'22px'}}>
              {[1,2,3].map(n => (
                <React.Fragment key={n}>
                  {n > 1 && <div style={{width:'32px',height:'1px',background:step > n-1 ? 'rgba(255,96,64,0.35)' : 'rgba(255,255,255,0.1)'}} />}
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,
                    background: step > n ? 'rgba(255,40,0,0.2)' : step === n ? '#ff2800' : 'rgba(255,255,255,0.06)',
                    color: step > n ? '#ff6040' : step === n ? '#fff' : 'rgba(255,255,255,0.25)',
                    boxShadow: step === n ? '0 0 14px rgba(255,40,0,0.4)' : 'none'
                  }}>{step > n ? '✓' : n}</div>
                </React.Fragment>
              ))}
            </div>

            <ErrorBanner />

            {step === 1 && (<>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'5px'}}>Roll Number</label>
                <input style={{width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',outline:'none'}}
                  placeholder="e.g. 23P31A4441" value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()} autoFocus />
              </div>
              <button style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#ff2800,#ff5535)',color:'#fff',border:'none',borderRadius:'10px',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleSendOTP} disabled={loading || !rollNumber}>
                {loading ? 'Checking...' : 'Send OTP →'}
              </button>
              {PHASE !== 'registration' && (
                <div style={{textAlign:'center',marginTop:'14px',fontSize:'0.75rem',color:'rgba(255,255,255,0.35)'}}>
                  Already have an account? <span style={{color:'#ff6040',cursor:'pointer'}} onClick={() => router.push('/auth/login')}>Login here</span>
                </div>
              )}
            </>)}

            {step === 2 && (<>
              {studentInfo && (
                <div style={{background:'rgba(255,40,0,0.08)',border:'1px solid rgba(255,40,0,0.2)',borderRadius:'10px',padding:'10px 12px',fontSize:'0.75rem',color:'rgba(255,255,255,0.65)',marginBottom:'14px'}}>
                  Hi <strong style={{color:'#ff6040'}}>{studentInfo.name}</strong>! OTP sent to <strong style={{color:'#ff6040'}}>{maskedEmail}</strong>
                </div>
              )}
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'5px'}}>Enter OTP</label>
                <input style={{width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',outline:'none',letterSpacing:'4px',textAlign:'center'}}
                  placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/,'').slice(0,6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} maxLength={6} autoFocus />
              </div>
              <button style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#ff2800,#ff5535)',color:'#fff',border:'none',borderRadius:'10px',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
              <div style={{textAlign:'center',marginTop:'10px',fontSize:'0.72rem',color:'rgba(255,255,255,0.35)'}}>
                Didn&apos;t receive it? <span style={{color:'#ff6040',cursor:'pointer'}} onClick={() => { setStep(1); setOtp('') }}>Resend OTP</span>
              </div>
            </>)}

            {step === 3 && (<>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'5px'}}>Create Password</label>
                <div style={{position:'relative'}}>
                  <input style={{width:'100%',padding:'11px 14px',paddingRight:'52px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',outline:'none'}}
                    type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password}
                    onChange={e => setPassword(e.target.value)} autoFocus />
                  <button style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:'10px',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}
                    onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {password && (
                  <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'4px'}}>
                    {passwordRules.map(r => (
                      <div key={r.label} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.65rem',color:r.test(password)?'#4ade80':'rgba(255,255,255,0.35)'}}>
                        <span style={{width:'4px',height:'4px',borderRadius:'50%',background:'currentColor'}} />{r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'5px'}}>Confirm Password</label>
                <div style={{position:'relative'}}>
                  <input style={{width:'100%',padding:'11px 14px',paddingRight:'52px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',outline:'none'}}
                    type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()} />
                  <button style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:'10px',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}
                    onClick={() => setShowConfirm(v => !v)}>{showConfirm ? 'HIDE' : 'SHOW'}</button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div style={{fontSize:'0.68rem',color:'#ff6040',marginTop:'4px'}}>Passwords do not match</div>
                )}
              </div>
              <button style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#ff2800,#ff5535)',color:'#fff',border:'none',borderRadius:'10px',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleSetPassword} disabled={loading || !password || !confirmPassword}>
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </>)}
          </div>
        </div>
      </AuthBackground>
    )
  }

  // ═══ DESKTOP LAYOUT ═══
  return (
    <AuthBackground>
      <style>{`
        ${globalStyles}
        @keyframes errIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        .reg-page {
          width:100%;min-height:100vh;
          display:flex;align-items:center;justify-content:center;
          font-family:${fonts.body};padding:20px;
        }
        .reg-card {
          width:100%;max-width:420px;
          background:${colors.bgCard};
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border:1px solid ${colors.border};
          border-radius:20px;padding:40px 36px 36px;
          animation:psCardIn 0.5s cubic-bezier(0.4,0,0.2,1) both;
        }
        .card-header { display:flex;flex-direction:column;align-items:center;margin-bottom:28px; }
        .card-title {
          font-family:${fonts.display};font-size:1rem;font-weight:600;
          letter-spacing:4px;color:${colors.textPrimary};margin-bottom:4px;margin-top:12px;
        }
        .card-sub { font-size:0.75rem;color:${colors.textMuted};font-weight:300; }
        .field { margin-bottom:16px; }
        .pass-wrap { position:relative; }
        .pass-toggle {
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;
          color:${colors.textMuted};font-size:11px;font-family:${fonts.body};padding:4px;
        }
        .pass-toggle:hover { color:${colors.textSecondary}; }
        .pass-rules { margin-top:10px;display:flex;flex-direction:column;gap:5px; }
        .rule { display:flex;align-items:center;gap:7px;font-size:0.7rem;color:${colors.textMuted};transition:color 0.2s; }
        .rule.ok { color:#4ade80; }
        .rule-dot { width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0; }
        .resend { text-align:center;margin-top:10px;font-size:0.74rem;color:${colors.textMuted}; }
        .resend button { background:none;border:none;cursor:pointer;color:${colors.error};font-family:${fonts.body};font-size:0.74rem; }
        .resend button:hover { color:${colors.textPrimary}; }
        .login-link { text-align:center;margin-top:16px;font-size:0.78rem;color:${colors.textMuted}; }
        .login-link a { color:${colors.error};text-decoration:none;font-weight:500;cursor:pointer; }
        .login-link a:hover { color:#ff9ffc; }
        .mismatch { font-size:0.7rem;color:${colors.error};margin-top:5px; }
        .robo-mascot,.robo-spotlight-cone { display:flex; }
        .robo-mascot {
          position:fixed;bottom:24px;left:32px;z-index:20;
          flex-direction:column;align-items:center;
          animation:roboFadeIn 1s ease 0.8s both;
        }
        .robo-spotlight-cone {
          position:fixed;top:0;left:0;width:100vw;height:100vh;
          pointer-events:none;z-index:3;overflow:hidden;
        }
        .robo-cone-beam {
          position:absolute;top:47%;left:50%;width:200px;height:200vh;
          transform:translate(-50%,-50%) rotate(70deg);
          background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,240,220,0.05) 20%,rgba(255,240,220,0.1) 45%,rgba(255,240,220,0.1) 55%,rgba(255,240,220,0.05) 80%,rgba(255,255,255,0) 100%);
          filter:blur(2px);animation:coneFlicker 4s ease-in-out infinite;
        }
        .robo-cone-outer {
          position:absolute;top:47%;left:50%;width:350px;height:200vh;
          transform:translate(-50%,-50%) rotate(70deg);
          background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,230,200,0.02) 25%,rgba(255,230,200,0.05) 45%,rgba(255,230,200,0.05) 55%,rgba(255,230,200,0.02) 75%,rgba(255,255,255,0) 100%);
          filter:blur(15px);animation:coneFlicker 4s ease-in-out 1s infinite;
        }
        .robo-ground-light {
          position:absolute;bottom:3%;left:2%;width:300px;height:300px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(255,240,220,0.12) 0%,rgba(255,240,220,0.05) 35%,transparent 65%);
          filter:blur(25px);animation:groundPulse 3s ease-in-out infinite;
        }
        .robo-img {
          width:250px;height:250px;object-fit:contain;
          filter:drop-shadow(0 0 20px rgba(255,255,255,0.15)) drop-shadow(0 0 60px rgba(255,255,255,0.06));
          animation:roboBounce 2s ease-in-out infinite;position:relative;z-index:2;
        }
        .robo-shadow {
          width:160px;height:20px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.3) 40%,transparent 75%);
          margin-top:-12px;filter:blur(4px);animation:shadowPulse 2s ease-in-out infinite;z-index:1;
        }
        @keyframes shadowPulse{0%,100%{transform:scaleX(1);opacity:1;}30%{transform:scaleX(0.65);opacity:0.4;}50%{transform:scaleX(0.7);opacity:0.5;}70%{transform:scaleX(0.65);opacity:0.4;}}
        @keyframes roboBounce{0%,100%{transform:translateY(0);}30%{transform:translateY(-18px);}50%{transform:translateY(-14px);}70%{transform:translateY(-18px);}}
        @keyframes coneFlicker{0%,100%{opacity:0.8;}25%{opacity:1;}50%{opacity:0.7;}75%{opacity:0.95;}}
        @keyframes groundPulse{0%,100%{opacity:1;transform:translateX(-50%) scaleX(1);}30%{opacity:0.5;transform:translateX(-50%) scaleX(0.75);}50%{opacity:0.6;transform:translateX(-50%) scaleX(0.8);}70%{opacity:0.5;transform:translateX(-50%) scaleX(0.75);}}
        @keyframes roboFadeIn{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:640px){
          .reg-card{max-width:100%;padding:28px 20px 24px;border-radius:16px;}
          .card-title{font-size:0.85rem;letter-spacing:3px;}
          .ps-back{top:16px;left:16px;font-size:12px;}
        }
      `}</style>

      <button className="ps-back" onClick={() => step === 1 ? router.push('/') : setStep(s => s-1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="reg-page">
        <div className="reg-card">
          <div className="card-header">
            <div className="ps-logo">PS</div>
            <div className="card-title">PROJECT SPACE</div>
            <div className="card-sub">Create your account — Team Leaders only</div>
          </div>

          <div className="ps-steps">
            <StepDot n={1} />
            <div className={`ps-step-line ${step > 1 ? 'done' : ''}`} />
            <StepDot n={2} />
            <div className={`ps-step-line ${step > 2 ? 'done' : ''}`} />
            <StepDot n={3} />
          </div>

          <ErrorBanner />

          {step === 1 && (
            <>
              <div className="field">
                <label className="ps-label">Roll Number</label>
                <input className="ps-input" placeholder="e.g. 23P31A4441"
                  value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()} autoFocus />
              </div>
              <button className="ps-btn-primary" onClick={handleSendOTP} disabled={loading || !rollNumber}>
                {loading ? 'Checking...' : 'Send OTP →'}
              </button>
              {PHASE !== 'registration' && (
                <div className="login-link">
                  Already have an account? <a onClick={() => router.push('/auth/login')}>Login here</a>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {studentInfo && (
                <div className="ps-info">
                  Hi <strong>{studentInfo.name}</strong>! OTP sent to <strong>{maskedEmail}</strong>
                </div>
              )}
              <div className="field">
                <label className="ps-label">Enter OTP</label>
                <input className="ps-input" placeholder="6-digit OTP"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/,'').slice(0,6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()}
                  maxLength={6} autoFocus />
              </div>
              <button className="ps-btn-primary" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
              <div className="resend">
                Didn&apos;t receive it? <button onClick={() => { setStep(1); setOtp('') }}>Resend OTP</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="field">
                <label className="ps-label">Create Password</label>
                <div className="pass-wrap">
                  <input className="ps-input" type={showPass ? 'text' : 'password'}
                    placeholder="Enter password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{paddingRight:'52px'}} autoFocus />
                  <button className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {password && (
                  <div className="pass-rules">
                    {passwordRules.map(r => (
                      <div key={r.label} className={`rule ${r.test(password) ? 'ok' : ''}`}>
                        <span className="rule-dot" />{r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label className="ps-label">Confirm Password</label>
                <div className="pass-wrap">
                  <input className="ps-input" type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                    style={{paddingRight:'52px'}} />
                  <button className="pass-toggle" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="mismatch">Passwords do not match</div>
                )}
              </div>
              <button className="ps-btn-primary" onClick={handleSetPassword}
                disabled={loading || !password || !confirmPassword}>
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="robo-spotlight-cone">
        <div className="robo-cone-beam" />
        <div className="robo-cone-outer" />
        <div className="robo-ground-light" />
      </div>
      <div className="robo-mascot">
        <img className="robo-img" src="https://i.ibb.co/NdXXswGc/Gemini-Generated-Image-zecq2szecq2szecq-removebg-preview.png" alt="Robot mascot" />
        <div className="robo-shadow" />
      </div>
    </AuthBackground>
  )
}