'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'
import { globalStyles, colors, fonts } from '@/lib/theme'

export default function MentorLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // login, create, forgot
  const [step, setStep] = useState(1) // 1=email, 2=otp, 3=password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mentorName, setMentorName] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const c = () => setIsMobile(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  // Check if redirected from create account
  useEffect(() => {
    const saved = sessionStorage.getItem('mentorEmail')
    if (saved) { setEmail(saved); sessionStorage.removeItem('mentorEmail') }
  }, [])

  const passwordRules = [
    { label: 'At least 8 characters', test: v => v.length >= 8 },
    { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { label: 'One number', test: v => /[0-9]/.test(v) },
    { label: 'One special character', test: v => /[^A-Za-z0-9]/.test(v) },
  ]

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c) : ''

  // ── API CALLS ──
  async function handleCheckAndSendOTP() {
    setError(''); setLoading(true)
    try {
      // First check if account exists
      const check = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check-account', email }) })
      const checkData = await check.json()
      if (!check.ok) { setError(checkData.error); return }

      setMentorName(checkData.name)
      setHasPassword(checkData.hasPassword)

      if (mode === 'login' && checkData.hasPassword) {
        // Has password, go to password step
        setStep(2)
        return
      }

      if (mode === 'login' && !checkData.hasPassword) {
        // No password, switch to create mode
        setMode('create')
      }

      // Send OTP
      const r = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify-otp', email, otp }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setStep(3) // Go to set password
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleSetPassword() {
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    const failed = passwordRules.find(r => !r.test(password))
    if (failed) { setError(failed.label + ' is required'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-password', email, newPassword: password, confirmPassword }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      // Redirect to login with email pre-filled
      sessionStorage.setItem('mentorEmail', email)
      setMode('login'); setStep(1); setPassword(''); setConfirmPassword(''); setOtp('')
      setError(''); setHasPassword(true)
      // Show success briefly
      setError(''); setMentorName('')
      window.location.reload()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handlePasswordLogin() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password-login', email, password }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.setItem('mentor_token', d.token)
      sessionStorage.setItem('mentor_data', JSON.stringify(d.mentor))
      router.push('/mentor/dashboard')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleForgotSendOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/mentor/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setMentorName(d.name); setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  if (!mounted) return <div style={{ width: '100%', height: '100vh', background: '#050008' }} />

  // ── STEP DOTS ──
  const totalSteps = mode === 'login' ? 2 : 3
  const StepDots = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
        <React.Fragment key={n}>
          {n > 1 && <div style={{ width: '32px', height: '1px', background: step >= n ? 'rgba(255,96,64,0.35)' : 'rgba(255,255,255,0.1)' }} />}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600,
            background: step > n ? 'rgba(255,40,0,0.2)' : step === n ? '#ff2800' : 'rgba(255,255,255,0.06)',
            color: step > n ? '#ff6040' : step === n ? '#fff' : 'rgba(255,255,255,0.25)',
            boxShadow: step === n ? '0 0 14px rgba(255,40,0,0.4)' : 'none'
          }}>{step > n ? '✓' : n}</div>
        </React.Fragment>
      ))}
    </div>
  )

  const card = (
    <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(12,8,20,.9)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '20px', padding: '40px 32px', backdropFilter: 'blur(20px)', animation: 'fadeUp .5s ease', position: 'relative', zIndex: 2 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#fd1c00,#faa000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#fff', boxShadow: '0 0 24px rgba(253,28,0,.3)' }}>PS</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '3px', color: '#fff', marginTop: '12px' }}>
          {mode === 'login' ? 'MENTOR LOGIN' : mode === 'create' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
        </div>
        <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', marginTop: '4px' }}>
          {mode === 'login' && step === 1 && 'Enter your mentor email'}
          {mode === 'login' && step === 2 && `Welcome back, ${mentorName}`}
          {mode === 'create' && step === 2 && `Hi ${mentorName}, verify your email`}
          {mode === 'create' && step === 3 && 'Set your login password'}
          {mode === 'forgot' && step === 1 && 'Enter your email to reset password'}
          {mode === 'forgot' && step === 2 && 'Enter verification code'}
          {mode === 'forgot' && step === 3 && 'Set your new password'}
        </div>
      </div>

      <StepDots />

      {error && <div style={{ background: 'rgba(255,40,0,.06)', border: '1px solid rgba(255,40,0,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#ff6040', marginBottom: '14px', animation: 'fadeUp .3s ease' }}>{error}</div>}

      {/* ── LOGIN MODE ── */}
      {mode === 'login' && step === 1 && (<>
        <div style={{ marginBottom: '14px' }}>
          <label className="ps-label" style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Email</label>
          <input className="ps-input" style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
            placeholder="mentor@university.edu" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheckAndSendOTP()} autoFocus />
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleCheckAndSendOTP} disabled={loading || !email}>{loading ? 'Checking...' : 'Continue →'}</button>
        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '.76rem', color: 'rgba(255,255,255,.35)', cursor: 'pointer' }} onClick={() => router.push('/')}>← Back to Home</div>
      </>)}

      {mode === 'login' && step === 2 && (<>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
              type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} autoFocus />
            <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
          </div>
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handlePasswordLogin} disabled={loading || !password}>{loading ? 'Logging in...' : 'Login →'}</button>
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '.76rem', color: 'rgba(255,255,255,.35)' }}>
          <span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => { setMode('forgot'); setStep(1); setError(''); setPassword('') }}>Forgot password?</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '.72rem', color: 'rgba(255,255,255,.25)', cursor: 'pointer' }} onClick={() => { setStep(1); setPassword(''); setError('') }}>← Change email</div>
      </>)}

      {/* ── CREATE ACCOUNT MODE ── */}
      {mode === 'create' && step === 2 && (<>
        <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#4ade80', marginBottom: '14px' }}>OTP sent to {maskedEmail}</div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Enter OTP</label>
          <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', outline: 'none', fontFamily: "'DM Sans',sans-serif", letterSpacing: '6px', textAlign: 'center' }}
            placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} maxLength={6} autoFocus />
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify OTP →'}</button>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>
          Didn&apos;t receive it? <span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => { setStep(1); setOtp(''); setError(''); setMode('login') }}>Resend OTP</span>
        </div>
      </>)}

      {(mode === 'create' || mode === 'forgot') && step === 3 && (<>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>{mode === 'forgot' ? 'New Password' : 'Create Password'}</label>
          <div style={{ position: 'relative' }}>
            <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
              type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
          </div>
          {password && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {passwordRules.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.65rem', color: r.test(password) ? '#4ade80' : 'rgba(255,255,255,.35)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />{r.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
              type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetPassword()} />
            <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              onClick={() => setShowConfirm(v => !v)}>{showConfirm ? 'HIDE' : 'SHOW'}</button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <div style={{ fontSize: '.68rem', color: '#ff6040', marginTop: '4px' }}>Passwords do not match</div>
          )}
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleSetPassword} disabled={loading || !password || !confirmPassword}>{loading ? 'Setting Password...' : mode === 'forgot' ? 'Reset Password →' : 'Create Account →'}</button>
      </>)}

      {/* ── FORGOT PASSWORD MODE ── */}
      {mode === 'forgot' && step === 1 && (<>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Email</label>
          <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }}
            placeholder="mentor@university.edu" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgotSendOTP()} autoFocus />
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleForgotSendOTP} disabled={loading || !email}>{loading ? 'Sending OTP...' : 'Send Reset Code →'}</button>
        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '.76rem', color: 'rgba(255,255,255,.35)' }}>
          <span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => { setMode('login'); setStep(1); setError('') }}>← Back to Login</span>
        </div>
      </>)}

      {mode === 'forgot' && step === 2 && (<>
        <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#4ade80', marginBottom: '14px' }}>Reset code sent to {maskedEmail}</div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Enter OTP</label>
          <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', outline: 'none', fontFamily: "'DM Sans',sans-serif", letterSpacing: '6px', textAlign: 'center' }}
            placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} maxLength={6} autoFocus />
        </div>
        <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify →'}</button>
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />

      <button className="ps-back" onClick={() => step > 1 ? (setStep(s => s - 1), setError('')) : router.push('/')}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back
      </button>

      <div className="mn-wrap">{card}</div>

      {!isMobile && (
        <div className="robo-mascot">
          <img className="robo-img" src="https://i.ibb.co/NdXXswGc/Gemini-Generated-Image-zecq2szecq2szecq-removebg-preview.png" alt="Robot mascot" />
          <div className="robo-shadow" />
        </div>
      )}
    </AuthBackground>
  )
}