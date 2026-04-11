'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/AuthBackground'

export default function AdminDashboard() {
  const router = useRouter()
  const [phase, setPhase] = useState('auth') // auth, dashboard
  const [mode, setMode] = useState('login') // login, create, forgot
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

  const passwordRules = [
    { label: 'At least 8 characters', test: v => v.length >= 8 },
    { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { label: 'One number', test: v => /[0-9]/.test(v) },
    { label: 'One special character', test: v => /[^A-Za-z0-9]/.test(v) },
  ]

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token')
    const savedEmail = sessionStorage.getItem('adminEmail')
    if (savedEmail) { setEmail(savedEmail); sessionStorage.removeItem('adminEmail') }
    if (saved) { setToken(saved); setPhase('dashboard') }
  }, [])

  useEffect(() => { if (phase === 'dashboard' && token) fetchDashboard() }, [phase, token])

  // ── AUTH FUNCTIONS ──
  async function handleCheckAndSendOTP() {
    setError(''); setLoading(true)
    try {
      const check = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check-account', email }) })
      const checkData = await check.json()
      if (!check.ok) { setError(checkData.error); return }
      setAdminName(checkData.name)

      if (mode === 'login' && checkData.hasPassword) { setStep(2); return }
      if (mode === 'login' && !checkData.hasPassword) { setMode('create') }

      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleVerifyOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify-otp', email, otp }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setStep(3)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleSetPassword() {
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    const failed = passwordRules.find(r => !r.test(password))
    if (failed) { setError(failed.label + ' is required'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-password', email, newPassword: password, confirmPassword }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      sessionStorage.setItem('adminEmail', email)
      window.location.reload()
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handlePasswordLogin() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'password-login', email, password }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setToken(d.token); sessionStorage.setItem('admin_token', d.token); setPhase('dashboard')
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  async function handleForgotSendOTP() {
    setError(''); setLoading(true)
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send-otp', email }) })
      const d = await r.json()
      if (!r.ok) { setError(d.error); return }
      setAdminName(d.name); setStep(2)
    } catch { setError('Network error') } finally { setLoading(false) }
  }

  // ── DASHBOARD FUNCTIONS ──
  async function fetchDashboard() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/dashboard', { headers: { 'x-admin-token': token } })
      const d = await r.json()
      if (!r.ok) { setError(d.error); setPhase('auth'); sessionStorage.removeItem('admin_token'); return }
      setData(d)
    } catch { setError('Failed to load') } finally { setLoading(false) }
  }

  async function handleExport(type) {
    const r = await fetch(`/api/admin/export?type=${type}`, { headers: { 'x-admin-token': token } })
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `project-space-${type}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleRemind() {
    setReminding(true); setReminderMsg('')
    try {
      const r = await fetch('/api/admin/remind', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ type: 'all-pending' }) })
      const d = await r.json()
      setReminderMsg(d.message || `Sent ${d.sent} reminders`)
    } catch { setReminderMsg('Failed') } finally { setReminding(false) }
  }

  function handleLogout() { sessionStorage.removeItem('admin_token'); setToken(''); setPhase('auth'); setData(null) }

  const filteredTeams = data?.teamList?.filter(t => {
    if (filterTech !== 'all' && t.technology !== filterTech) return false
    if (filterStatus === 'registered' && !t.registered) return false
    if (filterStatus === 'pending' && t.registered) return false
    if (search) { const s = search.toLowerCase(); return (t.projectTitle || '').toLowerCase().includes(s) || (t.leaderName || '').toLowerCase().includes(s) || (t.leaderRoll || '').toLowerCase().includes(s) || (t.teamNumber || '').toLowerCase().includes(s) || String(t.serialNumber).includes(s) }
    return true
  }) || []

  const techColors = { 'Data Specialist': '#3b82f6', 'AWS Development': '#f59e0b', 'Full Stack': '#10b981', 'Google Flutter': '#06b6d4', 'ServiceNow': '#8b5cf6', 'VLSI': '#ef4444' }

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c) : ''

  // ═══ AUTH SCREEN ═══
  if (phase === 'auth') {
    const totalSteps = mode === 'login' ? 2 : 3
    return (
      <>
        <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:auto}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.adm-wrap{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#050008;position:relative}
.adm-card{width:100%;max-width:420px;background:rgba(12,8,20,.9);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:40px 32px;backdrop-filter:blur(20px);animation:fadeUp .5s ease;position:relative;z-index:2}
@media(max-width:480px){.adm-card{padding:28px 20px;border-radius:16px}}
        `}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />
        <AuthBackground>
          <div className="adm-wrap">
            <div className="adm-card">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#fd1c00,#faa000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', color: '#fff', boxShadow: '0 0 24px rgba(253,28,0,.3)' }}>PS</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '3px', color: '#fff', marginTop: '12px' }}>
                {mode === 'login' ? 'ADMIN LOGIN' : mode === 'create' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
              </div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', marginTop: '4px' }}>
                {mode === 'login' && step === 1 && 'Enter your admin email'}
                {mode === 'login' && step === 2 && `Welcome back, ${adminName}`}
                {mode === 'create' && step === 2 && 'Verify your email'}
                {mode === 'create' && step === 3 && 'Set your login password'}
                {mode === 'forgot' && step === 1 && 'Enter email to reset password'}
                {mode === 'forgot' && step === 2 && 'Enter verification code'}
                {mode === 'forgot' && step === 3 && 'Set new password'}
              </div>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px' }}>
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
                <React.Fragment key={n}>
                  {n > 1 && <div style={{ width: '32px', height: '1px', background: step >= n ? 'rgba(255,96,64,0.35)' : 'rgba(255,255,255,0.1)' }} />}
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, background: step > n ? 'rgba(255,40,0,0.2)' : step === n ? '#ff2800' : 'rgba(255,255,255,0.06)', color: step > n ? '#ff6040' : step === n ? '#fff' : 'rgba(255,255,255,0.25)', boxShadow: step === n ? '0 0 14px rgba(255,40,0,0.4)' : 'none' }}>{step > n ? '✓' : n}</div>
                </React.Fragment>
              ))}
            </div>

            {error && <div style={{ background: 'rgba(255,40,0,.06)', border: '1px solid rgba(255,40,0,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#ff6040', marginBottom: '14px', animation: 'fadeUp .3s ease' }}>{error}</div>}

            {/* LOGIN - Step 1: Email */}
            {mode === 'login' && step === 1 && (<>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Admin Email</label>
                <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheckAndSendOTP()} autoFocus />
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleCheckAndSendOTP} disabled={loading || !email}>{loading ? 'Checking...' : 'Continue →'}</button>
              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '.76rem', color: 'rgba(255,255,255,.35)', cursor: 'pointer' }} onClick={() => router.push('/')}>← Back to Home</div>
            </>)}

            {/* LOGIN - Step 2: Password */}
            {mode === 'login' && step === 2 && (<>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} autoFocus />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer' }} onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handlePasswordLogin} disabled={loading || !password}>{loading ? 'Logging in...' : 'Login →'}</button>
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '.76rem' }}><span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => { setMode('forgot'); setStep(1); setError(''); setPassword('') }}>Forgot password?</span></div>
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '.72rem', color: 'rgba(255,255,255,.25)', cursor: 'pointer' }} onClick={() => { setStep(1); setPassword(''); setError('') }}>← Change email</div>
            </>)}

            {/* CREATE - Step 2: OTP */}
            {mode === 'create' && step === 2 && (<>
              <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#4ade80', marginBottom: '14px' }}>OTP sent to {maskedEmail}</div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Enter OTP</label>
                <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', outline: 'none', fontFamily: "'DM Sans',sans-serif", letterSpacing: '6px', textAlign: 'center' }} placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} maxLength={6} autoFocus />
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify OTP →'}</button>
            </>)}

            {/* CREATE/FORGOT - Step 3: Set Password */}
            {(mode === 'create' || mode === 'forgot') && step === 3 && (<>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>{mode === 'forgot' ? 'New Password' : 'Create Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} type={showPass ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer' }} onClick={() => setShowPass(v => !v)}>{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
                {password && (<div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>{passwordRules.map(r => (<div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.65rem', color: r.test(password) ? '#4ade80' : 'rgba(255,255,255,.35)' }}><span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />{r.label}</div>))}</div>)}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ width: '100%', padding: '12px 16px', paddingRight: '52px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetPassword()} />
                  <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: '10px', cursor: 'pointer' }} onClick={() => setShowConfirm(v => !v)}>{showConfirm ? 'HIDE' : 'SHOW'}</button>
                </div>
                {confirmPassword && password !== confirmPassword && <div style={{ fontSize: '.68rem', color: '#ff6040', marginTop: '4px' }}>Passwords do not match</div>}
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleSetPassword} disabled={loading || !password || !confirmPassword}>{loading ? 'Setting...' : mode === 'forgot' ? 'Reset Password →' : 'Create Account →'}</button>
            </>)}

            {/* FORGOT - Step 1: Email */}
            {mode === 'forgot' && step === 1 && (<>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Email</label>
                <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '.88rem', outline: 'none', fontFamily: "'DM Sans',sans-serif" }} placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgotSendOTP()} autoFocus />
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleForgotSendOTP} disabled={loading || !email}>{loading ? 'Sending...' : 'Send Reset Code →'}</button>
              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '.76rem' }}><span style={{ color: '#fd1c00', cursor: 'pointer' }} onClick={() => { setMode('login'); setStep(1); setError('') }}>← Back to Login</span></div>
            </>)}

            {/* FORGOT - Step 2: OTP */}
            {mode === 'forgot' && step === 2 && (<>
              <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '.78rem', color: '#4ade80', marginBottom: '14px' }}>Reset code sent to {maskedEmail}</div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '6px' }}>Enter OTP</label>
                <input style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', outline: 'none', fontFamily: "'DM Sans',sans-serif", letterSpacing: '6px', textAlign: 'center' }} placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/, '').slice(0, 6))} onKeyDown={e => e.key === 'Enter' && handleVerifyOTP()} maxLength={6} autoFocus />
              </div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg,#fd1c00,#fd3a20)', border: 'none', color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }} onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify →'}</button>
            </>)}
          </div>
          </div>
        </AuthBackground>
      </>
    )
  }
/* ═══ REPORT CARD COMPONENT ═══ */
/* Add this function BEFORE the main Dashboard export in app/admin/page.js */
/* Also add a "Report Card" tab to the admin tabs array */

// This is a standalone component — paste it into admin/page.js

function ReportCard() {
  const [roll, setRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchReport = async () => {
    if (!roll.trim()) { setError('Enter a roll number'); return; }
    setLoading(true); setError(''); setReport(null);
    try {
      const r = await fetch('/api/admin/report-card', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll.trim().toUpperCase() })
      });
      const d = await r.json();
      if (d.error) { setError(d.error); }
      else if (d.report) { setReport(d.report); }
    } catch { setError('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  const downloadPDF = async () => {
    if (!report) return;
    setGenerating(true);
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = 210, h = 297;
      let y = 0;

      // Colors
      const RED = [253, 28, 0];
      const BLACK = [0, 0, 0];
      const WHITE = [255, 255, 255];
      const GRAY = [120, 120, 120];
      const DARK = [30, 30, 30];
      const LIGHT_BG = [248, 248, 248];

      // Header band
      doc.setFillColor(...RED);
      doc.rect(0, 0, w, 28, 'F');
      doc.setFillColor(...BLACK);
      doc.rect(0, 22, w, 6, 'F'); // black strip at bottom of header

      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PROJECT SPACE', 10, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('STUDENT REPORT CARD', 10, 18);
      doc.setFontSize(7);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, w - 10, 12, { align: 'right' });
      doc.text('Technical Hub · Aditya University', w - 10, 18, { align: 'right' });

      y = 32;

      // Helper functions
      const sectionTitle = (title, yPos) => {
        doc.setFillColor(253, 28, 0);
        doc.rect(10, yPos, 2, 5, 'F');
        doc.setTextColor(...DARK);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 15, yPos + 4);
        return yPos + 8;
      };

      const labelValue = (label, value, x, yPos, labelW = 28) => {
        doc.setTextColor(...GRAY);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x, yPos);
        doc.setTextColor(...DARK);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(String(value || '—'), x + labelW, yPos);
      };

      const drawBar = (x, yPos, width, pct, color) => {
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(x, yPos, width, 2.5, 1, 1, 'F');
        const fillW = Math.max(0, (pct / 100) * width);
        doc.setFillColor(...color);
        doc.roundedRect(x, yPos, fillW, 2.5, 1, 1, 'F');
      };

      // ═══ SECTION 1: PERSONAL INFO ═══
      y = sectionTitle('PERSONAL INFORMATION', y);
      
      // Row 1
      labelValue('Name', report.name, 10, y, 18);
      labelValue('Roll No', report.roll_number, 75, y, 18);
      labelValue('College', report.college, 140, y, 18);
      y += 5;
      // Row 2
      labelValue('Branch', report.branch, 10, y, 18);
      labelValue('Gender', report.gender, 75, y, 18);
      labelValue('DOB', report.dob, 140, y, 18);
      y += 5;
      // Row 3
      labelValue('Mobile', report.mobile, 10, y, 18);
      labelValue('Email', report.email, 75, y, 18);
      labelValue('Passout', report.passout_year, 140, y, 18);
      y += 5;
      // Row 4
      labelValue('Technology', report.technology, 10, y, 22);
      labelValue('Pool', report.pool, 75, y, 18);
      labelValue('Rank', report.rank ? `#${report.rank}` : '—', 140, y, 18);
      y += 5;
      // Row 5
      labelValue('Seat', report.seat_type, 10, y, 18);
      labelValue('Scholar', report.scholar_type, 75, y, 18);
      labelValue('Town', report.town, 140, y, 18);
      y += 7;

      // Separator
      doc.setDrawColor(230, 230, 230);
      doc.line(10, y, w - 10, y);
      y += 3;

      // ═══ SECTION 2: ACADEMICS ═══
      y = sectionTitle('ACADEMIC PERFORMANCE', y);

      // Academic stats in boxes
      const academicData = [
        { label: 'B.Tech CGPA', value: report.btech || '—' },
        { label: 'B.Tech %', value: report.btech_pct ? `${report.btech_pct}%` : '—' },
        { label: 'Inter/Diploma', value: report.inter ? `${report.inter}%` : '—' },
        { label: 'SSC', value: report.ssc ? `${report.ssc}%` : '—' },
        { label: 'Backlogs', value: report.backlogs || '0' },
        { label: 'Badge Test', value: `${report.badge_test_pct}% (${report.badge_test_status || '—'})` },
      ];

      const boxW = 30, boxH = 10, boxGap = 2;
      academicData.forEach((item, i) => {
        const bx = 10 + (i % 6) * (boxW + boxGap);
        doc.setFillColor(...LIGHT_BG);
        doc.roundedRect(bx, y, boxW, boxH, 1.5, 1.5, 'F');
        doc.setTextColor(...GRAY);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, bx + 2, y + 3.5);
        doc.setTextColor(...DARK);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), bx + 2, y + 8);
      });
      y += boxH + 4;

      // Separator
      doc.setDrawColor(230, 230, 230);
      doc.line(10, y, w - 10, y);
      y += 3;

      // ═══ SECTION 3: CODING PLATFORMS ═══
      y = sectionTitle('CODING PROFILES', y);

      const platforms = [];
      if (report.leetcode) platforms.push({ name: 'LeetCode', total: report.leetcode.total, details: `E:${report.leetcode.easy} M:${report.leetcode.medium} H:${report.leetcode.hard} | Rank #${report.leetcode.rank} | Streak: ${report.leetcode.streak}d` });
      if (report.hackerrank) platforms.push({ name: 'HackerRank', total: `${report.hackerrank.stars}★`, details: `Badges:${report.hackerrank.badges} Certs:${report.hackerrank.certs} | C:${report.hackerrank.c}★ Java:${report.hackerrank.java}★ Py:${report.hackerrank.python}★ SQL:${report.hackerrank.sql}★` });
      if (report.codechef) platforms.push({ name: 'CodeChef', total: report.codechef.total, details: `Rating:${report.codechef.rating} (${report.codechef.stars}★) | Contests:${report.codechef.contests} | Streak:${report.codechef.streak}d` });
      if (report.gfg) platforms.push({ name: 'GFG', total: report.gfg.total, details: `Score:${report.gfg.score} | Streak:${report.gfg.streak}d` });

      platforms.forEach(p => {
        doc.setTextColor(...RED);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(p.name, 10, y);
        doc.setTextColor(...DARK);
        doc.setFontSize(8);
        doc.text(String(p.total), 38, y);
        doc.setTextColor(...GRAY);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(p.details, 55, y);
        y += 5;
      });

      // Maya Coding
      if (report.mayaCoding) {
        doc.setTextColor(...RED);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Maya Portal', 10, y);
        doc.setTextColor(...DARK);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        const langs = report.mayaCoding.languages ? Object.entries(report.mayaCoding.languages).map(([l, c]) => `${l.toUpperCase()}:${c}`).join(' ') : '';
        doc.text(`Rank #${report.mayaCoding.globalRank} (Batch #${report.mayaCoding.batchRank}) | Score:${report.mayaCoding.score} | E:${report.mayaCoding.easy} M:${report.mayaCoding.medium} H:${report.mayaCoding.hard} | ${langs} | Time:${report.mayaCoding.totalTime}`, 38, y);
        y += 5;
      }

      y += 2;
      doc.setDrawColor(230, 230, 230);
      doc.line(10, y, w - 10, y);
      y += 3;

      // ═══ SECTION 4: ATTENDANCE ═══
      y = sectionTitle(`ATTENDANCE — Overall: ${report.overallAttendance}% (${report.totalPresent}/${report.totalSessions})`, y);

      // Compact attendance grid
      const attCols = 4;
      const attBoxW = (w - 20 - (attCols - 1) * 2) / attCols;
      report.attendance.forEach((a, i) => {
        const col = i % attCols;
        const row = Math.floor(i / attCols);
        const ax = 10 + col * (attBoxW + 2);
        const ay = y + row * 11;
        
        doc.setFillColor(...LIGHT_BG);
        doc.roundedRect(ax, ay, attBoxW, 9, 1, 1, 'F');

        doc.setTextColor(...DARK);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const techName = a.tech.length > 18 ? a.tech.substring(0, 18) + '..' : a.tech;
        doc.text(techName, ax + 2, ay + 3.5);

        const pctColor = parseFloat(a.pct) >= 75 ? [34, 197, 94] : [239, 68, 68];
        doc.setTextColor(...pctColor);
        doc.setFontSize(7);
        doc.text(`${a.pct}%`, ax + attBoxW - 2, ay + 3.5, { align: 'right' });

        // Mini bar
        drawBar(ax + 2, ay + 5.5, attBoxW - 4, parseFloat(a.pct), pctColor);

        doc.setTextColor(...GRAY);
        doc.setFontSize(4.5);
        doc.text(`P:${a.present} A:${a.absent} T:${a.total}`, ax + 2, ay + 8.5);
      });
      
      const attRows = Math.ceil(report.attendance.length / attCols);
      y += attRows * 11 + 2;

      doc.setDrawColor(230, 230, 230);
      doc.line(10, y, w - 10, y);
      y += 3;

      // ═══ SECTION 5: CERTIFICATIONS ═══
      y = sectionTitle(`CERTIFICATIONS — Global:${report.certCounts.global} Training:${report.certCounts.training} Badges:${report.certCounts.badges} Internship:${report.certCounts.internship}`, y);

      if (report.globalCerts.length > 0) {
        doc.setTextColor(...DARK);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        report.globalCerts.forEach((c, i) => {
          doc.text(`${i + 1}. ${c}`, 14, y);
          y += 4;
        });
      } else {
        doc.setTextColor(...GRAY);
        doc.setFontSize(6.5);
        doc.text('No certifications recorded', 14, y);
        y += 4;
      }
      y += 2;

      // ═══ SECTION 6: APTITUDE ═══
      if (report.aptMandatory) {
        doc.setDrawColor(230, 230, 230);
        doc.line(10, y, w - 10, y);
        y += 3;
        y = sectionTitle(`APTITUDE — ${report.aptMandatory.pct}% (${report.aptMandatory.attempts}/${report.aptMandatory.total} attempts)`, y);
        doc.setTextColor(...DARK);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Easy:${report.aptMandatory.easy} Medium:${report.aptMandatory.medium} Hard:${report.aptMandatory.hard} | Aptitude:${report.aptMandatory.aptitude} Reasoning:${report.aptMandatory.reasoning} Verbal:${report.aptMandatory.verbal}`, 14, y);
        y += 5;
      }

      // ═══ SECTION 7: COURSES, PAYMENTS, STATUS ═══
      doc.setDrawColor(230, 230, 230);
      doc.line(10, y, w - 10, y);
      y += 3;

      // Courses (compact, inline)
      y = sectionTitle(`ENROLLED COURSES (${report.courses.length})`, y);
      if (report.courses.length > 0) {
        doc.setTextColor(...DARK);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        const courseLine = report.courses.join(' · ');
        const courseLines = doc.splitTextToSize(courseLine, w - 24);
        doc.text(courseLines, 14, y);
        y += courseLines.length * 3.5;
      }
      y += 2;

      // Semesters
      if (report.semesters.length > 0) {
        doc.setTextColor(...GRAY);
        doc.setFontSize(6);
        doc.text(`Semesters: ${report.semesters.map((s, i) => `S${i+1}:${s}`).join(' · ')}`, 14, y);
        y += 4;
      }

      // Payment row
      doc.setTextColor(...GRAY);
      doc.setFontSize(6);
      const payLine = report.payments.map((p, i) => `T${i+1}:${p || 'Pending'}`).join('  ');
      doc.text(`Payments: ${payLine}`, 14, y);
      y += 4;

      // Status row
      doc.text(`Violations: ${report.violations} | Placement: ${report.placement}`, 14, y);
      y += 6;

      // ═══ FOOTER ═══
      doc.setFillColor(...BLACK);
      doc.rect(0, h - 10, w, 10, 'F');
      doc.setFillColor(...RED);
      doc.rect(0, h - 10, w, 1.5, 'F');

      doc.setTextColor(...WHITE);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text('Project Space · Technical Hub · Aditya University', 10, h - 4);
      doc.text('projectspace.technicalhub.io', w - 10, h - 4, { align: 'right' });

      // Save
      doc.save(`Report_Card_${report.roll_number}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Search Box */}
      <div className="mp-card" style={{ marginBottom: 20 }}>
        <div className="mp-card-title" style={{ marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fd1c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Generate Report Card
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={roll}
            onChange={e => setRoll(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && fetchReport()}
            placeholder="Enter Roll Number (e.g. 23A91A61G9)"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.82rem',
              outline: 'none',
            }}
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#fd1c00,#ff5349)', color: '#fff',
              fontFamily: "'DM Sans',sans-serif", fontSize: '.78rem', fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Fetch'}
          </button>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: '.75rem', marginTop: 8 }}>{error}</div>}
      </div>

      {/* Report Preview */}
      {report && (
        <div className="mp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{report.name}</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>{report.roll_number} · {report.branch} · {report.college}</div>
            </div>
            <button
              onClick={downloadPDF}
              disabled={generating}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: generating ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#fd1c00,#ff5349)',
                color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: '.78rem',
                fontWeight: 700, cursor: generating ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {generating ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

          {/* Preview sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Technology', value: report.technology },
              { label: 'Pool', value: report.pool },
              { label: 'B.Tech CGPA', value: report.btech },
              { label: 'Attendance', value: `${report.overallAttendance}%` },
              { label: 'Backlogs', value: report.backlogs },
              { label: 'Violations', value: report.violations },
            ].map((item, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ fontSize: '.5rem', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '.82rem', color: '#fff', fontWeight: 700, marginTop: 2 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Coding summary */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(253,28,0,.04)', border: '1px solid rgba(253,28,0,.08)', marginBottom: 8 }}>
            <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 4 }}>Coding Platforms</div>
            <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.7)' }}>
              {[
                report.leetcode && `LeetCode: ${report.leetcode.total}`,
                report.hackerrank && `HackerRank: ${report.hackerrank.stars}★`,
                report.codechef && `CodeChef: ${report.codechef.total}`,
                report.gfg && `GFG: ${report.gfg.total}`,
              ].filter(Boolean).join(' · ') || 'No data'}
            </div>
          </div>

          {/* Certs summary */}
          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', marginTop: 8 }}>
            Certifications: Global({report.certCounts.global}) · Training({report.certCounts.training}) · Badges({report.certCounts.badges}) · Internship({report.certCounts.internship})
          </div>
          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', marginTop: 4 }}>
            Courses: {report.courses.length} enrolled · Placement: {report.placement}
          </div>
        </div>
      )}
    </div>
  );
}
  // ═══ DASHBOARD ═══
  const s = data?.stats || {}
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'mentors', label: 'Mentors', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: 'teams', label: 'Teams', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
    { id: 'actions', label: 'Actions', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
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
.db-tab{padding:8px 18px;border-radius:10px;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.55);cursor:pointer;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:6px;border:none;background:none;font-family:'DM Sans',sans-serif}
.db-tab:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.db-tab.on{color:#fd1c00;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.12)}
.db-body{padding:24px 28px;max-width:1400px;margin:0 auto}
.st-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.st-card{padding:22px 20px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:countUp .5s ease both}
.st-card:nth-child(2){animation-delay:.1s}.st-card:nth-child(3){animation-delay:.2s}.st-card:nth-child(4){animation-delay:.3s}
.st-val{font-size:2rem;font-weight:800;color:#fff;line-height:1}
.st-label{font-size:.68rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px;font-weight:500}
.prog-wrap{margin-bottom:28px;padding:20px 24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.prog-title{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.7)}
.prog-pct{font-size:1.2rem;font-weight:800;color:#fd1c00}
.prog-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s cubic-bezier(.4,0,.2,1)}
.tech-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.tech-card{padding:18px 16px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:14px}
.tech-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tech-info{flex:1}
.tech-name{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.8)}
.tech-stat{font-size:.65rem;color:rgba(255,255,255,.35);margin-top:2px}
.tech-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:6px;overflow:hidden}
.tech-bar-fill{height:100%;border-radius:2px;transition:width .8s ease}
.mn-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.mn-card{padding:20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);cursor:pointer;transition:all .2s}
.mn-card:hover{border-color:rgba(255,255,255,.1)}
.mn-card.expanded{border-color:rgba(253,28,0,.15)}
.mn-hdr{display:flex;justify-content:space-between;align-items:center}
.mn-name{font-size:.88rem;font-weight:600;color:#fff}
.mn-badge{font-size:.65rem;padding:3px 10px;border-radius:6px;font-weight:500}
.mn-badge.done{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.15)}
.mn-badge.pending{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.mn-stats{display:flex;gap:16px;margin-top:10px;font-size:.72rem;color:rgba(255,255,255,.4)}
.mn-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.06);margin-top:10px;overflow:hidden}
.mn-bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#4ade80,#10b981);transition:width .6s ease}
.mn-teams{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:8px}
.mn-team{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.02);font-size:.74rem}
.mn-team-name{color:rgba(255,255,255,.7);flex:1}
.mn-team-status{font-size:.65rem;padding:2px 8px;border-radius:4px}
.mn-team-status.reg{background:rgba(74,222,128,.08);color:#4ade80}
.mn-team-status.pen{background:rgba(255,255,255,.04);color:rgba(255,255,255,.35)}
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
.tbl-expand{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.72rem;padding:4px 8px;border-radius:6px;font-family:'DM Sans',sans-serif}
.tbl-detail{padding:16px 20px;background:rgba(255,255,255,.01);border:1px solid rgba(255,255,255,.03);border-radius:12px;margin:4px 0 8px;font-size:.74rem;color:rgba(255,255,255,.5)}
.tbl-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.tbl-detail-item{padding:10px;border-radius:8px;background:rgba(255,255,255,.02)}
.tbl-detail-label{font-size:.6rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.tbl-detail-val{font-size:.76rem;color:rgba(255,255,255,.7)}
.act-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.act-card{padding:24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.act-title{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.act-desc{font-size:.74rem;color:rgba(255,255,255,.35);margin-bottom:16px;line-height:1.5}
.act-btn{padding:10px 20px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px}
.act-btn.primary{background:linear-gradient(135deg,#fd1c00,#fd3a20);color:#fff}
.act-btn.secondary{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.6)}
.act-btn:disabled{opacity:.5;cursor:not-allowed}
.act-msg{margin-top:10px;font-size:.74rem;padding:8px 12px;border-radius:8px;background:rgba(74,222,128,.06);color:#4ade80}
.recent-title{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:12px;margin-top:28px}
.recent-item{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03);margin-bottom:8px}
.recent-num{font-size:.82rem;font-weight:700;color:#fd1c00;min-width:60px}
.recent-proj{font-size:.78rem;font-weight:500;color:rgba(255,255,255,.75)}
.recent-meta{font-size:.65rem;color:rgba(255,255,255,.3);margin-top:2px}
.recent-time{font-size:.65rem;color:rgba(255,255,255,.25);white-space:nowrap;margin-left:auto}
@media(max-width:900px){.st-grid{grid-template-columns:repeat(2,1fr)}.tech-grid{grid-template-columns:repeat(2,1fr)}.mn-grid{grid-template-columns:1fr}.act-grid{grid-template-columns:1fr}}
@media(max-width:640px){.st-grid{grid-template-columns:1fr}.tech-grid{grid-template-columns:1fr}.db-hdr{padding:12px 16px}.db-body{padding:16px}.db-tabs{padding:10px 16px}.tbl-controls{flex-direction:column}.tbl{display:block;overflow-x:auto}.tbl-detail-grid{grid-template-columns:1fr}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="db">
        <div className="db-hdr">
          <div className="db-logo"><div className="db-logo-icon">PS</div><div><div className="db-logo-text">ADMIN PANEL</div><div className="db-logo-sub">Project Space · May 2026</div></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="db-logout" onClick={fetchDashboard}>↻ Refresh</button>
            <button className="db-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="db-tabs">{tabs.map(t => <button key={t.id} className={`db-tab ${activeTab === t.id ? 'on' : ''}`} onClick={() => setActiveTab(t.id)}>{t.icon} {t.label}</button>)}</div>
        <div className="db-body">
          {loading && !data && <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,.3)' }}>Loading dashboard...</div>}
          {data && activeTab === 'overview' && (<>
            <div className="st-grid">
              <div className="st-card"><div className="st-val" style={{ color: '#fd1c00' }}>{s.totalTeams}</div><div className="st-label">Total Teams</div></div>
              <div className="st-card"><div className="st-val" style={{ color: '#4ade80' }}>{s.registeredCount}</div><div className="st-label">Registered</div></div>
              <div className="st-card"><div className="st-val" style={{ color: '#EEA727' }}>{s.pendingCount}</div><div className="st-label">Pending</div></div>
              <div className="st-card"><div className="st-val" style={{ color: '#3b82f6' }}>{s.accountsCreated}</div><div className="st-label">Accounts Created</div></div>
            </div>
            <div className="prog-wrap"><div className="prog-hdr"><span className="prog-title">Registration Progress</span><span className="prog-pct">{s.progressPercent}%</span></div><div className="prog-bar"><div className="prog-fill" style={{ width: `${s.progressPercent}%` }} /></div></div>
            <div className="tech-grid">{Object.entries(data.techBreakdown || {}).map(([tech, v]) => (<div key={tech} className="tech-card"><div className="tech-dot" style={{ background: techColors[tech] || '#888' }} /><div className="tech-info"><div className="tech-name">{tech}</div><div className="tech-stat">{v.registered}/{v.total} registered</div><div className="tech-bar"><div className="tech-bar-fill" style={{ width: `${v.total > 0 ? Math.round(v.registered / v.total * 100) : 0}%`, background: techColors[tech] || '#888' }} /></div></div></div>))}</div>
            <div className="recent-title"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Recent Registrations</div>
            {(data.recentRegistrations || []).map((r, i) => (<div key={i} className="recent-item"><div className="recent-num">{r.teamNumber}</div><div><div className="recent-proj">{r.projectTitle}</div><div className="recent-meta">{r.technology}</div></div><div className="recent-time">{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div></div>))}
          </>)}
          {data && activeTab === 'mentors' && (<div className="mn-grid">{Object.entries(data.mentorBreakdown || {}).sort((a, b) => b[1].total - a[1].total).map(([name, v]) => (<div key={name} className={`mn-card ${expandedMentor === name ? 'expanded' : ''}`} onClick={() => setExpandedMentor(expandedMentor === name ? null : name)}><div className="mn-hdr"><div className="mn-name">{name}</div><div className={`mn-badge ${v.registered === v.total ? 'done' : 'pending'}`}>{v.registered === v.total ? '✓ All Done' : `${v.pending} pending`}</div></div><div className="mn-stats"><span>{v.total} teams</span><span>{v.registered} registered</span><span>{v.pending} pending</span></div><div className="mn-bar"><div className="mn-bar-fill" style={{ width: `${v.total > 0 ? Math.round(v.registered / v.total * 100) : 0}%` }} /></div>{expandedMentor === name && (<div className="mn-teams">{v.teams.map(t => (<div key={t.serialNumber} className="mn-team"><span className="mn-team-name">#{t.serialNumber} {t.projectTitle || t.leaderName} {!t.registered && t.leaderPhone && t.leaderPhone.length>=10 && <a href={`tel:${t.leaderPhone}`} onClick={e=>e.stopPropagation()} style={{color:'#4ade80',textDecoration:'none',marginLeft:'4px'}} title={t.leaderPhone}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></a>}</span><span className={`mn-team-status ${t.registered ? 'reg' : 'pen'}`}>{t.registered ? 'Registered' : 'Pending'}</span></div>))}</div>)}</div>))}</div>)}
          {data && activeTab === 'teams' && (<><div className="tbl-controls"><input className="tbl-search" placeholder="Search teams..." value={search} onChange={e => setSearch(e.target.value)} /><button className={`tbl-filter ${filterStatus === 'all' ? 'on' : ''}`} onClick={() => setFilterStatus('all')}>All</button><button className={`tbl-filter ${filterStatus === 'registered' ? 'on' : ''}`} onClick={() => setFilterStatus('registered')}>Registered</button><button className={`tbl-filter ${filterStatus === 'pending' ? 'on' : ''}`} onClick={() => setFilterStatus('pending')}>Pending</button><select className="tbl-filter" value={filterTech} onChange={e => setFilterTech(e.target.value)} style={{ appearance: 'auto' }}><option value="all">All Technologies</option>{Object.keys(data.techBreakdown || {}).map(t => <option key={t} value={t}>{t}</option>)}</select><span className="tbl-count">{filteredTeams.length} teams</span></div><table className="tbl"><thead><tr><th>#</th><th>Team</th><th>Project</th><th>Technology</th><th>Leader</th><th>Mentor</th><th>Status</th><th></th></tr></thead><tbody>{filteredTeams.map(t => (<React.Fragment key={t.serialNumber}><tr><td style={{ fontWeight: 600, color: 'rgba(255,255,255,.4)' }}>{t.serialNumber}</td><td style={{ fontWeight: 600, color: '#fd1c00' }}>{t.teamNumber || '—'}</td><td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.projectTitle || '—'}</td><td><span style={{ fontSize: '.65rem', padding: '3px 8px', borderRadius: '6px', background: `${techColors[t.technology] || '#888'}15`, color: techColors[t.technology] || '#888', border: `1px solid ${techColors[t.technology] || '#888'}30` }}>{t.technology}</span></td><td><span>{t.leaderName}</span>{t.leaderPhone && t.leaderPhone.length>=10 && <a href={`tel:${t.leaderPhone}`} style={{marginLeft:'6px',color:'rgba(255,255,255,.3)',textDecoration:'none'}} title={t.leaderPhone}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg></a>}</td><td style={{ color: 'rgba(255,255,255,.4)' }}>{t.mentorAssigned || '—'}</td><td><span style={{ fontSize: '.68rem', padding: '3px 10px', borderRadius: '6px', fontWeight: 500, background: t.registered ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)', color: t.registered ? '#4ade80' : 'rgba(255,255,255,.35)' }}>{t.registered ? '✓ Registered' : 'Pending'}</span></td><td><button className="tbl-expand" onClick={() => setExpandedTeam(expandedTeam === t.serialNumber ? null : t.serialNumber)}>{expandedTeam === t.serialNumber ? '▲' : '▼'}</button></td></tr>{expandedTeam === t.serialNumber && (<tr><td colSpan={8}><div className="tbl-detail"><div style={{ fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: 8 }}>{t.projectTitle}</div>{t.projectDescription && <div style={{ marginBottom: 8, lineHeight: 1.5 }}>{t.projectDescription}</div>}<div className="tbl-detail-grid"><div className="tbl-detail-item"><div className="tbl-detail-label">Problem Statement</div><div className="tbl-detail-val">{t.problemStatement || '—'}</div></div><div className="tbl-detail-item"><div className="tbl-detail-label">AI Usage</div><div className="tbl-detail-val">{t.aiUsage}</div></div><div className="tbl-detail-item"><div className="tbl-detail-label">Tech Stack</div><div className="tbl-detail-val">{(t.techStack || []).join(', ') || '—'}</div></div><div className="tbl-detail-item"><div className="tbl-detail-label">Members ({t.memberCount})</div><div className="tbl-detail-val">{(t.members || []).map(m => `${m.name}${m.isLeader ? ' ★' : ''}`).join(', ')}</div></div></div></div></td></tr>)}</React.Fragment>))}</tbody></table></>)}
          {data && activeTab === 'actions' && (<div className="act-grid"><div className="act-card"><div className="act-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> Send Reminders</div><div className="act-desc">Send reminder emails to {s.pendingCount} pending team leaders</div><button className="act-btn primary" onClick={handleRemind} disabled={reminding || s.pendingCount === 0}>{reminding ? 'Sending...' : 'Send Reminders'}</button>{reminderMsg && <div className="act-msg">{reminderMsg}</div>}</div><div className="act-card"><div className="act-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export Data</div><div className="act-desc">Download CSV reports</div><div style={{ display: 'flex', gap: 10 }}><button className="act-btn secondary" onClick={() => handleExport('teams')}>All Teams</button><button className="act-btn secondary" onClick={() => handleExport('registrations')}>Registrations</button></div></div><div className="act-card"><div className="act-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Quick Stats</div><div className="act-desc">At a glance</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><div style={{ padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,.02)', fontSize: '.74rem' }}><span style={{ color: 'rgba(255,255,255,.35)' }}>Students</span><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginTop: 2 }}>{s.totalStudents}</div></div><div style={{ padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,.02)', fontSize: '.74rem' }}><span style={{ color: 'rgba(255,255,255,.35)' }}>Accounts</span><div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#3b82f6', marginTop: 2 }}>{s.accountsCreated}</div></div></div></div><div className="act-card"><div className="act-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> Refresh</div><div className="act-desc">Reload latest data</div><button className="act-btn secondary" onClick={fetchDashboard} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button></div></div>)}
        </div>
      </div>
    </>
  )
}