'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [rollNumber, setRollNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const c = () => setIsMobile(window.innerWidth < 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  const passwordRules = [
    { label: 'At least 8 characters', test: v => v.length >= 8 },
    { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { label: 'One number', test: v => /[0-9]/.test(v) },
    { label: 'One special character', test: v => /[^A-Za-z0-9]/.test(v) },
  ]

  async function handleSendOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), role: 'reset' })
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Failed to send OTP'); return }
      setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), otp: otp.trim() })
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Invalid OTP'); return }
      setStep(3)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleResetPassword() {
    setError('')
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    const failed = passwordRules.find(r => !r.test(newPassword))
    if (failed) { setError(failed.label + ' is required'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: rollNumber.trim().toUpperCase(), newPassword })
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'Failed to reset password'); return }
      setSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        sessionStorage.setItem('registeredRoll', rollNumber.trim().toUpperCase())
        router.push('/auth/login')
      }, 1500)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  if (!mounted) return <div style={{ width: '100%', height: '100vh', background: '#050008' }} />

  const totalSteps = 3
  const StepDots = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
        <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
          {n > 1 && <div style={{ width: '32px', height: '1px', background: step >= n ? 'rgba(255,96,64,0.35)' : 'rgba(255,255,255,0.1)' }} />}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600,
            background: step > n ? 'rgba(255,40,0,0.2)' : step === n ? '#ff2800' : 'rgba(255,255,255,0.06)',
            color: step > n ? '#ff6040' : step === n ? '#fff' : 'rgba(255,255,255,0.25)',
            boxShadow: step === n ? '0 0 14px rgba(255,40,0,0.4)' : 'none'
          }}>{step > n ? '✓' : n}</div>
        </div>
      ))}
    </div>
  )

  const card = (
    <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(12,8,20,.9)', border: '1px solid rgba(255,255,255,.06)', borderRadius: '20px', padding: '40px 32px', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#fd1c00,#faa000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#fff', boxShadow: '0 0 24px rgba(253,28,0,.3)' }}>PS</div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '3px', color: '#fff', marginTop: '12px' }}>RESET PASSWORD</div>
        <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', marginTop: '4px', textAlign: 'center' }}>
          {step === 1 && 'Enter your roll number to receive an OTP'}
          {step === 2 && `Enter the 6-digit code sent to ${rollNumber}`}
          {step === 3 && 'Set your new password'}
        </div>
      </div>

      <StepDots />

      {error && <div style={{ background: 'rgba(255,40,0,0.08)', border: '1px solid rgba(255,40,0,0.18)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '.78rem', color: '#ff6040' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '.78rem', color: '#4ade80' }}>{success}</div>}

      {step === 1 && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Roll Number</label>
            <input type="text" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }} placeholder="e.g. 23A91A6193" value={rollNumber} onChange={e => setRollNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && rollNumber && handleSendOTP()} autoFocus />
          </div>
          <button style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#ff2800,#ff5535)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', opacity: (loading || !rollNumber) ? 0.5 : 1 }} onClick={handleSendOTP} disabled={loading || !rollNumber}>{loading ? 'Sending OTP...' : 'Send Reset Code →'}</button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>6-Digit OTP</label>
            <input type="text" maxLength="6" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '1rem', outline: 'none', boxSizing: 'border-box', letterSpacing: '8px', textAlign: 'center' }} placeholder="------" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOTP()} autoFocus />
          </div>
          <button style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#ff2800,#ff5535)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', opacity: (loading || otp.length !== 6) ? 0.5 : 1, marginBottom: '12px' }} onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify OTP →'}</button>
          <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>Didn't receive? <span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={handleSendOTP}>Resend</span></div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} style={{ width: '100%', padding: '12px 40px 12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' }} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }} onClick={() => setShowPass(!showPass)}>{showPass ? 'Hide' : 'Show'}</span>
            </div>
          </div>
          <div style={{ marginBottom: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            {passwordRules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.7rem', color: r.test(newPassword) ? '#4ade80' : 'rgba(255,255,255,.3)', marginBottom: i < passwordRules.length - 1 ? '4px' : 0 }}>
                <span>{r.test(newPassword) ? '✓' : '○'}</span>{r.label}
              </div>
            ))}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirm ? 'text' : 'password'} style={{ width: '100%', padding: '12px 40px 12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' }} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleResetPassword()} />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? 'Hide' : 'Show'}</span>
            </div>
          </div>
          <button style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#ff2800,#ff5535)', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', opacity: (loading || !newPassword || !confirmPassword) ? 0.5 : 1 }} onClick={handleResetPassword} disabled={loading || !newPassword || !confirmPassword}>{loading ? 'Resetting...' : 'Reset Password →'}</button>
        </>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>
        Remember your password? <span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>Back to Login</span>
      </div>
    </div>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', minHeight: '100vh', background: '#050008', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans',sans-serif" }}>
        <AuthBackground />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px 16px' : '40px', boxSizing: 'border-box' }}>
          {card}
        </div>
      </div>
    </>
  )
}