'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { globalStyles, colors, fonts } from '@/lib/theme'

export default function MentorLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('login') // login, otp, password
  const [loginMode, setLoginMode] = useState('otp') // otp or password
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mentorName, setMentorName] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const c = () => setIsMobile(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  async function handleSendOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'send-otp', email}) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setMentorName(d.name); setHasPassword(d.hasPassword); setStep('otp')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'verify-otp', email, otp}) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.setItem('mentor_token', d.token)
      sessionStorage.setItem('mentor_data', JSON.stringify(d.mentor))
      router.push('/mentor/dashboard')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handlePasswordLogin() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'password-login', email, password}) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.setItem('mentor_token', d.token)
      sessionStorage.setItem('mentor_data', JSON.stringify(d.mentor))
      router.push('/mentor/dashboard')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  if (!mounted) return <div style={{width:'100%',height:'100vh',background:'#050008'}} />

  const inputStyle = {width:'100%',padding:'12px 16px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'12px',color:'#fff',fontSize:'.88rem',outline:'none',fontFamily:"'DM Sans',sans-serif"}
  const labelStyle = {display:'block',fontSize:'.65rem',fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'rgba(255,255,255,.35)',marginBottom:'6px'}
  const btnStyle = {width:'100%',padding:'13px',borderRadius:'12px',background:'linear-gradient(135deg,#fd1c00,#fd3a20)',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.88rem',fontWeight:600,cursor:'pointer',marginTop:'16px'}

  const card = (
    <div style={{width:'100%',maxWidth:'400px',background:'rgba(12,8,20,.9)',border:'1px solid rgba(255,255,255,.06)',borderRadius:'20px',padding:'40px 32px',backdropFilter:'blur(20px)',animation:'fadeUp .5s ease',position:'relative',zIndex:2}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'24px'}}>
        <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'linear-gradient(135deg,#fd1c00,#faa000)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'16px',color:'#fff',boxShadow:'0 0 24px rgba(253,28,0,.3)'}}>PS</div>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'1rem',fontWeight:700,letterSpacing:'3px',color:'#fff',marginTop:'12px'}}>MENTOR LOGIN</div>
        <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.35)',marginTop:'4px'}}>
          {step === 'login' ? 'Enter your mentor email' : step === 'otp' ? `Hi ${mentorName}, enter OTP` : 'Login with password'}
        </div>
      </div>

      {error && <div style={{background:'rgba(255,40,0,.06)',border:'1px solid rgba(255,40,0,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#ff6040',marginBottom:'14px'}}>{error}</div>}

      {step === 'login' && (<>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} placeholder="mentor@university.edu" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendOTP()} autoFocus />
        <button style={btnStyle} onClick={handleSendOTP} disabled={loading||!email}>{loading?'Sending OTP...':'Send OTP →'}</button>
        <div style={{textAlign:'center',marginTop:'14px',fontSize:'.76rem',color:'rgba(255,255,255,.35)',cursor:'pointer'}} onClick={()=>router.push('/')}>← Back to Home</div>
      </>)}

      {step === 'otp' && (<>
        <div style={{background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:'10px',padding:'10px 14px',fontSize:'.78rem',color:'#4ade80',marginBottom:'14px'}}>OTP sent to {email}</div>
        <label style={labelStyle}>Enter OTP</label>
        <input style={{...inputStyle,letterSpacing:'6px',textAlign:'center',fontSize:'1.1rem'}} placeholder="6-digit code" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/,'').slice(0,6))} onKeyDown={e=>e.key==='Enter'&&handleVerifyOTP()} maxLength={6} autoFocus />
        <button style={btnStyle} onClick={handleVerifyOTP} disabled={loading||otp.length!==6}>{loading?'Verifying...':'Verify & Login →'}</button>
        {hasPassword && (
          <div style={{textAlign:'center',marginTop:'12px',fontSize:'.76rem',color:'rgba(255,255,255,.35)'}}>
            Or <span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setStep('password');setError('')}}>login with password</span>
          </div>
        )}
        <div style={{textAlign:'center',marginTop:'8px',fontSize:'.72rem',color:'rgba(255,255,255,.25)',cursor:'pointer'}} onClick={()=>{setStep('login');setOtp('');setError('')}}>← Change email</div>
      </>)}

      {step === 'password' && (<>
        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handlePasswordLogin()} autoFocus />
        <button style={btnStyle} onClick={handlePasswordLogin} disabled={loading||!password}>{loading?'Logging in...':'Login →'}</button>
        <div style={{textAlign:'center',marginTop:'12px',fontSize:'.76rem',color:'rgba(255,255,255,.35)'}}>
          Or <span style={{color:'#fd1c00',cursor:'pointer'}} onClick={()=>{setStep('otp');setPassword('');setError('')}}>login with OTP</span>
        </div>
      </>)}
    </div>
  )

  return (
    <AuthBackground>
      <style>{`
        ${globalStyles}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .mn-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .robo-mascot{position:fixed;bottom:24px;left:32px;z-index:20;display:flex;flex-direction:column;align-items:center;animation:roboFadeIn 1s ease 0.8s both}
        .robo-img{width:250px;height:250px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(255,255,255,.15));animation:roboBounce 2s ease-in-out infinite;position:relative;z-index:2}
        .robo-shadow{width:160px;height:20px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.6) 0%,transparent 75%);margin-top:-12px;filter:blur(4px);animation:shadowPulse 2s ease-in-out infinite}
        @keyframes roboBounce{0%,100%{transform:translateY(0)}30%{transform:translateY(-18px)}50%{transform:translateY(-14px)}70%{transform:translateY(-18px)}}
        @keyframes shadowPulse{0%,100%{transform:scaleX(1);opacity:1}30%{transform:scaleX(.65);opacity:.4}70%{transform:scaleX(.65);opacity:.4}}
        @keyframes roboFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){.robo-mascot{display:none}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div className="mn-wrap">{card}</div>
      {!isMobile && (
        <div className="robo-mascot">
          <img className="robo-img" src="https://i.ibb.co/NdXXswGc/Gemini-Generated-Image-zecq2szecq2szecq-removebg-preview.png" alt="Robot mascot"/>
          <div className="robo-shadow"/>
        </div>
      )}
    </AuthBackground>
  )
}