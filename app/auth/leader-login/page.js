'use client'
import { setSession } from '@/lib/session'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { globalStyles, colors, fonts } from '@/lib/theme'
import { PHASE } from '@/lib/phase'

export default function LeaderLoginPage() {
  const router = useRouter()
  const [rollNumber, setRollNumber] = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [isMobile, setIsMobile]     = useState(false)
  const [showPass, setShowPass]     = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const savedRoll = sessionStorage.getItem('registeredRoll')
    if (savedRoll) {
      setRollNumber(savedRoll)
      setShowSuccess(true)
      sessionStorage.removeItem('registeredRoll')
    }
  }, [])

  async function handleLogin() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, password, role: 'leader' })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSession(data.user)
      router.push('/dashboard/register-team')
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  // ═══ MOBILE LAYOUT ═══
  if (isMobile) {
    const inputStyle = {width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#fff',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',outline:'none'}
    const labelStyle = {display:'block',fontSize:'0.65rem',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,0.4)',marginBottom:'5px'}
    const btnStyle = {width:'100%',padding:'12px',background:'linear-gradient(135deg,#ff2800,#ff5535)',color:'#fff',border:'none',borderRadius:'10px',fontFamily:"'Poppins',sans-serif",fontSize:'0.85rem',fontWeight:600,cursor:'pointer'}

    return (
      <>
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box;}
          html,body{background:#050008;overflow:auto!important;}
          body{font-family:'Poppins',sans-serif;color:#fff;}
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
          <button className="ma-back" onClick={() => router.push('/')}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
            Back
          </button>
          <div className="ma-card">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'24px'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'10px',background:'linear-gradient(135deg,#ff2800,#ff5535)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Orbitron',sans-serif",fontSize:'12px',fontWeight:600,color:'#fff',boxShadow:'0 0 20px rgba(255,40,0,0.4)'}}>PS</div>
              <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'0.85rem',fontWeight:600,letterSpacing:'3px',color:'#fff',marginTop:'10px'}}>WELCOME BACK</div>
              <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.35)',fontWeight:300,marginTop:'2px'}}>Team Leader Login</div>
            </div>

            {showSuccess && <div style={{background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',borderRadius:'8px',padding:'9px 12px',fontSize:'0.75rem',color:'#4ade80',marginBottom:'12px'}}>Account created successfully! Login to continue.</div>}
            {error && <div style={{background:'rgba(255,40,0,0.1)',border:'1px solid rgba(255,40,0,0.25)',borderRadius:'8px',padding:'9px 12px',fontSize:'0.75rem',color:'#ff6040',marginBottom:'12px'}}>{error}</div>}

            <div style={{marginBottom:'14px'}}><label style={labelStyle}>Roll Number</label>
              <input style={inputStyle} placeholder="e.g. 23P31A4441" value={rollNumber} onChange={e => setRollNumber(e.target.value.toUpperCase())} autoFocus />
            </div>
            <div style={{marginBottom:'14px'}}><label style={labelStyle}>Password</label>
              <div style={{position:'relative'}}>
                <input style={{...inputStyle,paddingRight:'52px'}} type={showPass?'text':'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()} />
                <button style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(255,255,255,0.35)',fontSize:'10px',cursor:'pointer',fontFamily:"'Poppins',sans-serif"}} onClick={() => setShowPass(v=>!v)}>{showPass?'HIDE':'SHOW'}</button>
              </div>
            </div>
            <button style={btnStyle} onClick={handleLogin} disabled={loading||!rollNumber||!password}>
              {loading ? 'Logging in...' : 'Login →'}
            </button>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'16px',fontSize:'0.72rem',color:'rgba(255,255,255,0.35)'}}>
              <span style={{cursor:'pointer'}} onClick={() => router.push('/auth/register')}>Create Account</span>
              {PHASE !== 'registration' && <span style={{cursor:'pointer'}} onClick={() => router.push('/auth/login')}>Switch Role</span>}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ═══ DESKTOP LAYOUT ═══
  return (
    <AuthBackground>
      <style>{`
        ${globalStyles}
        .ll-page {
          width:100%;height:100vh;
          display:flex;align-items:center;justify-content:center;
          font-family:${fonts.body};padding:20px;
        }
        .ll-card {
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

        .success-banner {
          display:flex;align-items:center;gap:8px;
          padding:12px 16px;border-radius:10px;
          background:rgba(74,222,128,0.08);
          border:1px solid rgba(74,222,128,0.2);
          margin-bottom:20px;
          animation:psFadeUp 0.4s ease both;
        }
        .success-icon {
          width:22px;height:22px;border-radius:50%;
          background:rgba(74,222,128,0.2);
          display:flex;align-items:center;justify-content:center;
          color:#4ade80;font-size:12px;font-weight:700;flex-shrink:0;
        }
        .success-text { font-size:0.78rem;color:#4ade80;line-height:1.4; }

        .field { margin-bottom:16px; }
        .pass-wrap { position:relative; }
        .pass-toggle {
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;
          color:${colors.textMuted};font-size:11px;font-family:${fonts.body};
          transition:color 0.2s;padding:4px;
        }
        .pass-toggle:hover { color:${colors.textSecondary}; }

        .divider {
          display:flex;align-items:center;gap:12px;
          margin:20px 0;
        }
        .divider-line { flex:1;height:1px;background:${colors.border}; }
        .divider-text { font-size:0.7rem;color:${colors.textMuted};white-space:nowrap; }

        .alt-link {
          text-align:center;margin-top:16px;font-size:0.78rem;color:${colors.textMuted};
        }
        .alt-link a {
          color:${colors.error};text-decoration:none;font-weight:500;cursor:pointer;
        }
        .alt-link a:hover { color:#ff9ffc; }

        .robo-mascot {
          position:fixed;bottom:24px;left:32px;z-index:20;
          display:flex;flex-direction:column;align-items:center;
          animation:roboFadeIn 1s ease 0.8s both;
        }
        .robo-spotlight-cone {
          position:fixed;top:0;left:0;width:100vw;height:100vh;
          pointer-events:none;z-index:3;overflow:hidden;
        }
        .robo-cone-beam {
          position:absolute;top:47%;left:50%;width:200px;height:200vh;
          transform:translate(-50%,-50%) rotate(70deg);
          background:linear-gradient(90deg,rgba(255,255,255,0.0) 0%,rgba(255,240,220,0.05) 20%,rgba(255,240,220,0.1) 45%,rgba(255,240,220,0.1) 55%,rgba(255,240,220,0.05) 80%,rgba(255,255,255,0.0) 100%);
          filter:blur(2px);animation:coneFlicker 4s ease-in-out infinite;
        }
        .robo-cone-outer {
          position:absolute;top:47%;left:50%;width:350px;height:200vh;
          transform:translate(-50%,-50%) rotate(70deg);
          background:linear-gradient(90deg,rgba(255,255,255,0.0) 0%,rgba(255,230,200,0.02) 25%,rgba(255,230,200,0.05) 45%,rgba(255,230,200,0.05) 55%,rgba(255,230,200,0.02) 75%,rgba(255,255,255,0.0) 100%);
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

        @keyframes roboBounce {
          0%, 100% { transform:translateY(0); }
          30% { transform:translateY(-18px); }
          50% { transform:translateY(-14px); }
          70% { transform:translateY(-18px); }
        }
        @keyframes shadowPulse {
          0%, 100% { transform:scaleX(1); opacity:1; }
          30% { transform:scaleX(0.65); opacity:0.4; }
          50% { transform:scaleX(0.7); opacity:0.5; }
          70% { transform:scaleX(0.65); opacity:0.4; }
        }
        @keyframes coneFlicker {
          0%, 100% { opacity:0.8; }
          25% { opacity:1; }
          50% { opacity:0.7; }
          75% { opacity:0.95; }
        }
        @keyframes groundPulse {
          0%, 100% { opacity:1; transform:translateX(-50%) scaleX(1); }
          30% { opacity:0.5; transform:translateX(-50%) scaleX(0.75); }
          50% { opacity:0.6; transform:translateX(-50%) scaleX(0.8); }
          70% { opacity:0.5; transform:translateX(-50%) scaleX(0.75); }
        }
        @keyframes roboFadeIn {
          from { opacity:0; transform:translateY(30px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes psFadeUp {
          from { opacity:0; transform:translateY(10px); }
          to { opacity:1; transform:translateY(0); }
        }

        @media(max-width:1024px) {
          .ll-card { max-width:380px; padding:32px 28px 28px; }
          .robo-img { width:200px; height:200px; }
          .robo-shadow { width:130px; }
          .robo-mascot { bottom:20px; left:20px; }
        }
        @media(max-width:640px) {
          .ll-page { padding:15px; height:auto; min-height:100vh; }
          .ll-card { max-width:100%; padding:28px 20px 24px; border-radius:16px; }
          .card-title { font-size:0.85rem; letter-spacing:3px; }
          .robo-mascot { display:none; }
          .robo-spotlight-cone { display:none; }
          .ps-back { top:16px; left:16px; font-size:12px; }
        }
        @media(max-width:380px) {
          .ll-card { padding:22px 16px 20px; }
          .ps-input { padding:11px 12px; font-size:0.82rem; }
          .ps-btn-primary { padding:12px; font-size:0.82rem; }
        }
      `}</style>

      <button className="ps-back" onClick={() => router.push('/')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <div className="ll-page">
        <div className="ll-card">
          <div className="card-header">
            <div className="ps-logo">PS</div>
            <div className="card-title">PROJECT SPACE</div>
            <div className="card-sub">Team Leader Sign In</div>
          </div>

          {showSuccess && (
            <div className="success-banner">
              <div className="success-icon">✓</div>
              <div className="success-text">Account created successfully! Sign in to continue.</div>
            </div>
          )}

          {error && <div className="ps-error">{error}</div>}

          <div className="field">
            <label className="ps-label">Roll Number</label>
            <input
              className="ps-input"
              placeholder="e.g. 23P31A4441"
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value.toUpperCase())}
              readOnly={!!showSuccess}
              style={showSuccess ? { opacity:0.6, cursor:'default' } : {}}
            />
          </div>

          <div className="field">
            <label className="ps-label">Password</label>
            <div className="pass-wrap">
              <input
                className="ps-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ paddingRight:'52px' }}
                autoFocus
              />
              <button className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <button
            className="ps-btn-primary"
            onClick={handleLogin}
            disabled={loading || !rollNumber || !password}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <div className="divider">
            <div className="divider-line" />
            <div className="divider-text">or</div>
            <div className="divider-line" />
          </div>

          <div className="alt-link">
            Don&apos;t have an account? <a onClick={() => router.push('/auth/register')}>Create Account</a>
          </div>
          {PHASE !== 'registration' && (
          <div className="alt-link" style={{ marginTop:'8px' }}>
            Not a Team Leader? <a onClick={() => router.push('/auth/login')}>Switch Role</a>
          </div>
          )}
        </div>
      </div>

      {!isMobile && (<>
      <div className="robo-spotlight-cone">
        <div className="robo-cone-beam" />
        <div className="robo-cone-outer" />
        <div className="robo-ground-light" />
      </div>

      <div className="robo-mascot">
        <img
          className="robo-img"
          src="https://i.ibb.co/NdXXswGc/Gemini-Generated-Image-zecq2szecq2szecq-removebg-preview.png"
          alt="Robot mascot"
        />
        <div className="robo-shadow" />
      </div>
      </>)}

    </AuthBackground>
  )
}