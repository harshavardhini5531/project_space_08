'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const STAGES = [
  { id:1, name:'Ideation', desc:'Brainstorm ideas, define the problem, and finalize the project concept',
    icon:'M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color:'#e8650a' },
  { id:2, name:'Planning', desc:'Set milestones, assign responsibilities, and create the project timeline',
    icon:'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM9 14l2 2 4-4', color:'#1a73e8' },
  { id:3, name:'Design', desc:'Create architecture diagrams, wireframes, and plan the system structure',
    icon:'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586', color:'#d93025' },
  { id:4, name:'Development', desc:'Build core features, integrate components, and implement the solution',
    icon:'M16 18l6-6-6-6M8 6l-6 6 6 6', color:'#2d9d4f' },
  { id:5, name:'Testing', desc:'Validate functionality, identify issues, and ensure quality standards',
    icon:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', color:'#f5a623' },
  { id:6, name:'Deployment', desc:'Launch the project, configure the environment, and go live',
    icon:'M22 12h-4l-3 9L9 3l-3 9H2', color:'#0d8abc' },
  { id:7, name:'Documentation', desc:'Prepare the final report, user guide, and presentation materials',
    icon:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', color:'#e6c419' },
]

export default function ProjectStatus() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [teamNumber, setTeamNumber] = useState(null)
  const [stages, setStages] = useState([])
  const [progress, setProgress] = useState({ completed:0, total:7, percent:0, credits:0 })
  const [teamInfo, setTeamInfo] = useState(null)
  const [mentor, setMentor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modalStage, setModalStage] = useState(null)
  const [toast, setToast] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const toastTimer = useRef()

  // Get user from session
  useEffect(() => {
    const saved = localStorage.getItem('ps_user')
    if (!saved) { router.push('/auth/login'); return }
    const u = JSON.parse(saved)
    setUser(u)
    setTeamNumber(u.teamNumber)
  }, [])

  // Fetch milestone status
  const fetchStatus = useCallback(async () => {
    if (!teamNumber) return
    setLoading(true)
    try {
      const r = await fetch(`/api/milestones/team-status?team=${teamNumber}`)
      const d = await r.json()
      if (d.stages) setStages(d.stages)
      if (d.progress) setProgress(d.progress)
      if (d.team) setTeamInfo(d.team)
      if (d.mentor) setMentor(d.mentor)
    } catch (err) { console.error('Fetch status error:', err) }
    finally { setLoading(false) }
  }, [teamNumber])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.rollNumber) return
    try {
      const r = await fetch(`/api/milestones/notifications?type=student&email=${user.rollNumber}&limit=10`)
      const d = await r.json()
      if (d.notifications) setNotifications(d.notifications)
      if (d.unread_count !== undefined) setUnreadCount(d.unread_count)
    } catch {}
  }, [user])

  useEffect(() => { fetchNotifications(); const iv = setInterval(fetchNotifications, 30000); return () => clearInterval(iv) }, [fetchNotifications])

  // Submit for review
  async function handleSubmitReview() {
    if (!modalStage || submitting) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/milestones/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber,
          stageNumber: modalStage.stage_number,
          submittedByRoll: user.rollNumber,
          submittedByName: user.name,
        })
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error || 'Failed', true); return }
      showToast(`Stage ${modalStage.stage_number}: ${modalStage.stage_name} sent for review!`)
      setModalStage(null)
      fetchStatus()
    } catch { showToast('Network error', true) }
    finally { setSubmitting(false) }
  }

  function showToast(msg, isError) {
    setToast({ msg, isError })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  async function markAllRead() {
    if (!user?.rollNumber) return
    await fetch('/api/milestones/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read', type: 'student', email: user.rollNumber })
    })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Determine stage display status
  function getStageStatus(stage, idx) {
    if (stage.status === 'completed') return 'completed'
    if (stage.status === 'in-review') return 'active'
    if (stage.status === 'rejected') return 'ready' // can re-submit
    if (stage.actionable) return 'ready'
    return 'disabled'
  }

  if (loading && !stages.length) {
    return <div style={{ width:'100%', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050008', color:'rgba(255,255,255,.3)', fontFamily:"'DM Sans',sans-serif" }}>Loading project status...</div>
  }

  const completedCount = progress.completed
  const pct = progress.percent

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:auto}
body{font-family:'DM Sans',sans-serif;color:#e8e0f0}

/* Particles */
.ps-particles{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.ps-particle{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(255,255,255,.12);animation:psFloat linear infinite}
.ps-particle:nth-child(odd){background:rgba(255,29,0,.1)}
.ps-particle:nth-child(3n){background:rgba(123,47,190,.08);width:3px;height:3px}
@keyframes psFloat{0%{transform:translateY(100vh) scale(0);opacity:0}10%{opacity:1;transform:translateY(90vh) scale(1)}90%{opacity:.5}100%{transform:translateY(-10vh) scale(.3);opacity:0}}

.ps-glow{position:fixed;top:-200px;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(255,29,0,.035) 0%,transparent 70%);pointer-events:none;z-index:0;animation:psDrift 8s ease-in-out infinite alternate}
@keyframes psDrift{0%{transform:translateX(-50%) translateY(0)}100%{transform:translateX(-50%) translateY(40px)}}

.ps-wrap{width:100%;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;position:relative;z-index:1}
.ps-section{width:100%;max-width:680px}

/* Header */
.ps-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;animation:psFadeDown .6s cubic-bezier(.16,1,.3,1)}
@keyframes psFadeDown{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}
.ps-hdr-left{display:flex;align-items:center;gap:14px}
.ps-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ff1d00,#c41600);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(255,29,0,.2);flex-shrink:0;animation:psIconFloat 3s ease-in-out infinite}
@keyframes psIconFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.ps-icon svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ps-title{font-size:22px;font-weight:700;color:#fff}
.ps-subtitle{font-size:13px;color:#8a7f96;margin-top:2px}
.ps-badge{font-size:12px;font-weight:600;color:#ff1d00;background:rgba(255,29,0,.06);border:1px solid rgba(255,29,0,.18);padding:6px 16px;border-radius:100px;white-space:nowrap}
.ps-hdr-right{display:flex;align-items:center;gap:10px}
.ps-notif-btn{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;color:rgba(255,255,255,.4);transition:all .2s}
.ps-notif-btn:hover{background:rgba(255,255,255,.06);color:#fff}
.ps-notif-dot{position:absolute;top:4px;right:4px;min-width:16px;height:16px;border-radius:8px;background:#ff1d00;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #050008}
.ps-notif-drop{position:absolute;top:44px;right:0;width:320px;background:#13101a;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 0;z-index:100;box-shadow:0 12px 40px rgba(0,0,0,.6);max-height:360px;overflow-y:auto}
.ps-notif-drop::-webkit-scrollbar{width:3px}
.ps-notif-drop::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}
.ps-notif-item{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.03);cursor:default;transition:background .15s}
.ps-notif-item:hover{background:rgba(255,255,255,.02)}
.ps-notif-item.unread{background:rgba(255,29,0,.03)}
.ps-notif-title{font-size:11px;font-weight:600;color:#fff;margin-bottom:2px}
.ps-notif-msg{font-size:10px;color:#8a7f96;line-height:1.4}
.ps-notif-time{font-size:9px;color:#4a4258;margin-top:3px}
.ps-notif-hdr{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
.ps-notif-hdr-title{font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em}
.ps-notif-mark{font-size:10px;color:#ff1d00;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif}
.ps-back{font-size:12px;color:rgba(255,255,255,.3);cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;padding:6px 12px;border-radius:8px;transition:all .2s}
.ps-back:hover{color:#fff;background:rgba(255,255,255,.04)}

/* Progress bar */
.ps-prog{margin-bottom:32px;animation:psFadeDown .6s .15s cubic-bezier(.16,1,.3,1) both}
.ps-prog-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ps-prog-label{font-size:11px;font-weight:600;color:#4a4258;text-transform:uppercase;letter-spacing:.06em}
.ps-prog-pct{font-size:13px;font-weight:700;color:#ff1d00}
.ps-prog-track{height:4px;border-radius:4px;background:#1e1a28;overflow:hidden;position:relative}
.ps-prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#ff1d00,#f5a623,#2d9d4f);transition:width .8s cubic-bezier(.34,1.56,.64,1);position:relative}
.ps-prog-fill::after{content:'';position:absolute;right:0;top:-2px;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.5);animation:psPDot 1.5s ease-in-out infinite}
@keyframes psPDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}
.ps-prog-dots{display:flex;justify-content:space-between;margin-top:8px;padding:0 2px}
.ps-prog-dot{width:8px;height:8px;border-radius:50%;border:1.5px solid #1e1a28;background:transparent;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.ps-prog-dot.filled{border-color:transparent}

/* Timeline */
.ps-timeline{position:relative;padding-left:120px}
.ps-timeline::before{content:'';position:absolute;left:88px;top:0;bottom:0;width:2px;background:#1e1a28;border-radius:2px;transform:translateX(-1px)}
@keyframes psStageIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

.ps-stage{position:relative;margin-bottom:16px;animation:psStageIn .5s ease both}
.ps-stage:last-child{margin-bottom:0}

.ps-stage-num{position:absolute;left:-120px;top:22px;width:58px;text-align:right;display:flex;align-items:baseline;justify-content:flex-end;gap:1px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#4a4258;transition:color .4s}
.ps-stage.completed .ps-stage-num,.ps-stage.active .ps-stage-num{color:var(--sc)}

/* Dot */
.ps-dot{position:absolute;left:-50px;top:14px;width:38px;height:38px;border-radius:50%;background:#13101a;border:2px solid #1e1a28;display:flex;align-items:center;justify-content:center;z-index:3;transition:all .5s cubic-bezier(.34,1.56,.64,1)}
.ps-dot svg{width:16px;height:16px;fill:none;stroke:#4a4258;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:all .4s}
.ps-stage.completed .ps-dot{background:var(--sc);border-color:var(--sc);box-shadow:0 0 16px color-mix(in srgb,var(--sc) 35%,transparent)}
.ps-stage.completed .ps-dot svg{stroke:#fff}
.ps-stage.completed:hover .ps-dot{transform:scale(1.15);box-shadow:0 0 24px color-mix(in srgb,var(--sc) 50%,transparent)}
.ps-stage.active .ps-dot{background:#13101a;border-color:var(--sc);box-shadow:0 0 14px color-mix(in srgb,var(--sc) 20%,transparent);animation:psActivePulse 2s ease-in-out infinite}
.ps-stage.active .ps-dot svg{stroke:var(--sc)}
@keyframes psActivePulse{0%,100%{box-shadow:0 0 14px color-mix(in srgb,var(--sc) 20%,transparent);transform:scale(1)}50%{box-shadow:0 0 24px color-mix(in srgb,var(--sc) 45%,transparent);transform:scale(1.08)}}

/* Connector */
.ps-connector{position:absolute;left:-32px;top:calc(14px + 38px);width:2px;height:calc(100% - 38px + 2px);transform:translateX(-1px);z-index:2;border-radius:2px;display:none}
.ps-stage.completed .ps-connector{display:block;background:var(--sc);box-shadow:0 0 8px color-mix(in srgb,var(--sc) 30%,transparent);animation:psLineGrow .7s .2s ease-out both}
.ps-stage:last-child .ps-connector{display:none!important}
@keyframes psLineGrow{from{transform:translateX(-1px) scaleY(0);transform-origin:top}to{transform:translateX(-1px) scaleY(1);transform-origin:top}}

/* Card */
.ps-card{background:#0d0a14;border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:20px 22px;margin-left:14px;transition:all .35s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.ps-card::before{content:'';position:absolute;top:0;left:0;width:3px;height:0;border-radius:0 0 3px 3px;background:var(--sc);transition:height .5s ease}
.ps-stage.completed .ps-card::before,.ps-stage.active .ps-card::before{height:100%}
.ps-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.25)}
.ps-stage.completed .ps-card{border-color:color-mix(in srgb,var(--sc) 18%,transparent);background:color-mix(in srgb,var(--sc) 3%,#0d0a14)}
.ps-stage.active .ps-card{border-color:color-mix(in srgb,var(--sc) 22%,transparent);background:color-mix(in srgb,var(--sc) 4%,#0d0a14);animation:psCardGlow 3s ease-in-out infinite}
@keyframes psCardGlow{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 4px 28px color-mix(in srgb,var(--sc) 12%,transparent)}}

.ps-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.ps-stage-name{font-size:16px;font-weight:600;color:#fff;margin-bottom:5px;transition:color .4s}
.ps-stage.completed .ps-stage-name,.ps-stage.active .ps-stage-name{color:var(--sc)}
.ps-stage.disabled .ps-stage-name{color:#8a7f96}
.ps-stage-desc{font-size:12.5px;color:#8a7f96;line-height:1.55}
.ps-stage.disabled .ps-stage-desc{color:#4a4258}

/* Chip */
.ps-chip{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 12px;border-radius:100px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:5px}
.ps-chip svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.ps-chip.locked{color:#4a4258;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05)}
.ps-chip.review{animation:psChipPulse 2s ease-in-out infinite}
@keyframes psChipPulse{0%,100%{opacity:1}50%{opacity:.65}}

/* Actions */
.ps-actions{display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04)}
.ps-btn{display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;padding:9px 20px;border-radius:9px;cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);border:1px solid;position:relative;overflow:hidden}
.ps-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s}
.ps-btn-review{color:#ff1d00;background:rgba(255,29,0,.06);border-color:rgba(255,29,0,.2)}
.ps-btn-review:hover:not(:disabled){background:rgba(255,29,0,.12);border-color:rgba(255,29,0,.4);transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,29,0,.18)}
.ps-btn-review:hover:not(:disabled) svg{transform:rotate(15deg) scale(1.1)}
.ps-btn-review:disabled{opacity:.2;cursor:not-allowed;color:#4a4258;background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.05)}
.ps-btn-review.pending{cursor:default;pointer-events:none;animation:psAwaitPulse 2.5s ease-in-out infinite}
.ps-btn-review.pending svg{animation:psPendSpin 3s linear infinite}
@keyframes psAwaitPulse{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 20px color-mix(in srgb,var(--sc) 22%,transparent)}}
@keyframes psPendSpin{to{transform:rotate(360deg)}}
.ps-btn-done{color:#4a4258;background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.05);cursor:not-allowed;opacity:.25}
.ps-btn-done.completed{opacity:1;cursor:default}

.ps-mentor-row{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11.5px;color:#8a7f96}
.ps-mentor-row svg{width:13px;height:13px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.ps-reject-msg{margin-top:8px;padding:8px 12px;border-radius:8px;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);font-size:11px;color:#ff6040}

/* Toast */
.ps-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);background:#13101a;border:1px solid rgba(255,29,0,.25);color:#fff;font-size:13px;font-weight:500;padding:12px 24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:center;gap:10px;z-index:100;opacity:0;transition:all .5s cubic-bezier(.16,1,.3,1);pointer-events:none;backdrop-filter:blur(8px)}
.ps-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.ps-toast.error{border-color:rgba(239,68,68,.3)}
.ps-toast svg{width:18px;height:18px;stroke:#10b981;fill:none;stroke-width:2;flex-shrink:0}
.ps-toast.error svg{stroke:#ef4444}

/* Modal */
.ps-modal-overlay{position:fixed;inset:0;background:rgba(5,0,8,.88);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(6px)}
.ps-modal{background:#13101a;border:1px solid rgba(255,29,0,.15);border-radius:20px;padding:32px;width:92%;max-width:420px;text-align:center;animation:psModIn .4s cubic-bezier(.16,1,.3,1);box-shadow:0 20px 80px rgba(0,0,0,.5)}
@keyframes psModIn{from{opacity:0;transform:translateY(28px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
.ps-modal-icon{width:60px;height:60px;margin:0 auto 18px;border-radius:50%;background:rgba(255,29,0,.06);border:1px solid rgba(255,29,0,.15);display:flex;align-items:center;justify-content:center;animation:psModIcon .7s cubic-bezier(.34,1.56,.64,1)}
@keyframes psModIcon{0%{transform:scale(0) rotate(-120deg)}100%{transform:scale(1) rotate(0)}}
.ps-modal-icon svg{width:26px;height:26px;stroke:#ff1d00;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ps-modal-title{font-size:17px;font-weight:600;color:#fff;margin-bottom:8px}
.ps-modal-desc{font-size:13px;color:#8a7f96;line-height:1.55;margin-bottom:16px}
.ps-modal-mentor{font-size:12px;font-weight:500;color:#EEA727;margin-bottom:22px;display:flex;align-items:center;justify-content:center;gap:6px}
.ps-modal-mentor svg{width:14px;height:14px;stroke:#EEA727;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ps-modal-actions{display:flex;gap:10px;justify-content:center}
.ps-modal-btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:11px 26px;border-radius:11px;cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);border:none}
.ps-modal-btn.confirm{color:#fff;background:linear-gradient(135deg,#ff1d00,#c41600);box-shadow:0 4px 16px rgba(255,29,0,.2)}
.ps-modal-btn.confirm:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,29,0,.3)}
.ps-modal-btn.confirm:disabled{opacity:.5;cursor:not-allowed}
.ps-modal-btn.cancel{color:#8a7f96;background:transparent;border:1px solid rgba(255,255,255,.08)}
.ps-modal-btn.cancel:hover{border-color:rgba(255,255,255,.2);color:#e8e0f0}

@media(max-width:640px){
  .ps-wrap{padding:16px 10px}
  .ps-hdr{flex-direction:column;align-items:flex-start;gap:10px}
  .ps-title{font-size:19px}
  .ps-timeline{padding-left:70px}
  .ps-timeline::before{left:52px}
  .ps-stage-num{left:-70px;width:38px;font-size:8px}
  .ps-dot{left:-32px;width:28px;height:28px}
  .ps-dot svg{width:12px;height:12px}
  .ps-connector{left:-19px;top:calc(14px + 28px)}
  .ps-card{padding:14px;margin-left:6px;border-radius:12px}
  .ps-stage-name{font-size:14px}
  .ps-stage-desc{font-size:11.5px}
  .ps-actions{flex-direction:column;align-items:stretch;gap:6px}
  .ps-btn{justify-content:center;padding:10px 16px;font-size:11.5px}
  .ps-chip{font-size:9px;padding:3px 8px}
  .ps-particles,.ps-glow{display:none}
  .ps-notif-drop{width:280px;right:-40px}
}
      `}</style>

      {/* Particles */}
      <div className="ps-particles">{Array.from({length:25},(_,i)=><div key={i} className="ps-particle" style={{left:`${Math.random()*100}%`,animationDuration:`${8+Math.random()*12}s`,animationDelay:`${Math.random()*10}s`}}/>)}</div>
      <div className="ps-glow"/>

      <div className="ps-wrap">
        <div className="ps-section">
          {/* Header */}
          <div className="ps-hdr">
            <div className="ps-hdr-left">
              <div className="ps-icon"><svg viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div>
              <div>
                <div className="ps-title">Project Status</div>
                <div className="ps-subtitle">{teamInfo?.project_title || 'Track your project through each stage'}</div>
              </div>
            </div>
            <div className="ps-hdr-right">
              {/* Notification bell */}
              <div className="ps-notif-btn" onClick={() => setShowNotif(!showNotif)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {unreadCount > 0 && <div className="ps-notif-dot">{unreadCount}</div>}
                {showNotif && (
                  <div className="ps-notif-drop" onClick={e => e.stopPropagation()}>
                    <div className="ps-notif-hdr">
                      <span className="ps-notif-hdr-title">Notifications</span>
                      {unreadCount > 0 && <button className="ps-notif-mark" onClick={markAllRead}>Mark all read</button>}
                    </div>
                    {notifications.length === 0 ? <div style={{padding:'20px',textAlign:'center',fontSize:'11px',color:'#4a4258'}}>No notifications yet</div> :
                      notifications.map(n => (
                        <div key={n.id} className={`ps-notif-item ${!n.read ? 'unread' : ''}`}>
                          <div className="ps-notif-title">{n.title}</div>
                          <div className="ps-notif-msg">{n.message}</div>
                          <div className="ps-notif-time">{new Date(n.created_at).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <div className="ps-badge">{completedCount} / 7 Completed</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="ps-prog">
            <div className="ps-prog-top">
              <span className="ps-prog-label">Overall Progress</span>
              <span className="ps-prog-pct">{pct}%</span>
            </div>
            <div className="ps-prog-track">
              <div className="ps-prog-fill" style={{width:`${pct}%`}}/>
            </div>
            <div className="ps-prog-dots">
              {STAGES.map((st, i) => {
                const s = stages[i]
                const filled = s?.status === 'completed'
                return <div key={st.id} className={`ps-prog-dot ${filled ? 'filled' : ''}`} style={filled ? {background:st.color,borderColor:st.color,boxShadow:`0 0 6px ${st.color}50`} : {}} title={`Stage ${st.id}: ${st.name}`}/>
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="ps-timeline">
            {STAGES.map((st, idx) => {
              const s = stages[idx] || { status: 'pending', actionable: false }
              const status = getStageStatus(s, idx)
              const isCom = status === 'completed'
              const isAct = status === 'active'
              const isRdy = status === 'ready'
              const isDis = status === 'disabled'

              return (
                <div key={st.id} className={`ps-stage ${status}`} style={{'--sc': st.color, animationDelay: `${idx * 0.08}s`}}>
                  <div className="ps-stage-num"><span>STAGE-</span><span>{st.id}</span></div>
                  <div className="ps-dot"><svg viewBox="0 0 24 24"><path d={st.icon}/></svg></div>
                  <div className="ps-connector"/>
                  <div className="ps-card">
                    <div className="ps-card-top">
                      <div>
                        <div className="ps-stage-name">{st.name}</div>
                        <div className="ps-stage-desc">{st.desc}</div>
                      </div>
                      {/* Status chip */}
                      {isAct && <span className="ps-chip review" style={{color:st.color,background:`${st.color}12`,border:`1px solid ${st.color}40`}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> In Review</span>}
                      {isDis && <span className="ps-chip locked"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Locked</span>}
                      {isCom && <span className="ps-chip" style={{color:st.color,background:`${st.color}12`,border:`1px solid ${st.color}30`}}><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Done</span>}
                    </div>

                    {/* Actions */}
                    <div className="ps-actions">
                      {isRdy && <button className="ps-btn ps-btn-review" onClick={() => setModalStage({...st,...s})}><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg><span>Mark for Review</span></button>}
                      {isAct && <button className="ps-btn ps-btn-review pending" style={{color:st.color,background:`${st.color}0F`,borderColor:`${st.color}30`}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Awaiting Mentor</span></button>}
                      {isDis && <button className="ps-btn ps-btn-review" disabled><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg><span>Mark for Review</span></button>}
                      {isCom ? <button className="ps-btn ps-btn-done completed" style={{color:st.color,background:`${st.color}12`,borderColor:`${st.color}30`}}><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Completed</span></button> : <button className="ps-btn ps-btn-done" disabled><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Completed</span></button>}
                    </div>

                    {/* Mentor info */}
                    {isAct && mentor && <div className="ps-mentor-row"><svg viewBox="0 0 24 24" style={{stroke:st.color}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Sent to <strong style={{marginLeft:3}}>{mentor.name || teamInfo?.mentor_assigned}</strong></div>}
                    {isCom && s.reviewed_by_name && <div className="ps-mentor-row"><svg viewBox="0 0 24 24" style={{stroke:st.color}}><polyline points="20 6 9 17 4 12"/></svg> Approved by <strong style={{marginLeft:3}}>{s.reviewed_by_name}</strong> · {s.reviewed_at && new Date(s.reviewed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>}
                    {s.status === 'pending' && s.mentor_comment && <div className="ps-reject-msg">Mentor feedback: "{s.mentor_comment}"</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`ps-toast ${toast ? 'show' : ''} ${toast?.isError ? 'error' : ''}`}>
        <svg viewBox="0 0 24 24">{toast?.isError ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}</svg>
        <span>{toast?.msg}</span>
      </div>

      {/* Modal */}
      {modalStage && (
        <div className="ps-modal-overlay" onClick={() => !submitting && setModalStage(null)}>
          <div className="ps-modal" onClick={e => e.stopPropagation()}>
            <div className="ps-modal-icon"><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
            <div className="ps-modal-title">Send "{modalStage.name}" for Review?</div>
            <div className="ps-modal-desc">Your mentor will be notified to review Stage {modalStage.id}: {modalStage.name}. They will visit your team to verify completion.</div>
            {mentor && <div className="ps-modal-mentor"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {mentor.name || teamInfo?.mentor_assigned}</div>}
            <div className="ps-modal-actions">
              <button className="ps-modal-btn cancel" onClick={() => setModalStage(null)} disabled={submitting}>Cancel</button>
              <button className="ps-modal-btn confirm" onClick={handleSubmitReview} disabled={submitting}>{submitting ? 'Sending...' : 'Send for Review'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}