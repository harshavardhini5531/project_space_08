'use client'
import { useState, useEffect } from 'react'

export default function EditRequestToast({ user }) {
  const [toasts, setToasts] = useState([])
  const roll = user?.rollNumber || user?.roll_number

  useEffect(() => {
    if (!roll) return
    let cancelled = false

    async function checkUnseen() {
      try {
        const r = await fetch('/api/project-review/edit-request/unseen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNumber: roll, markSeen: true }),
        })
        const d = await r.json()
        if (cancelled) return
        if (r.ok && d.ok && d.unseen && d.unseen.length > 0) {
          setToasts(d.unseen.map(req => ({ ...req, dismissed: false })))
        }
      } catch {}
    }

    checkUnseen()
    const interval = setInterval(checkUnseen, 60000) // re-check every minute

    return () => { cancelled = true; clearInterval(interval) }
  }, [roll])

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map(t =>
      setTimeout(() => dismiss(t.id), 10000)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts.length])

  if (toasts.length === 0) return null

  return (
    <div className="ert-stack">
      <style>{`
        .ert-stack{position:fixed;top:80px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px;font-family:'DM Sans',sans-serif;pointer-events:none}
        @media(max-width:640px){.ert-stack{top:70px;right:10px;left:10px;max-width:none}}
        .ert-toast{pointer-events:auto;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#0f0a1a,#0a0612);border:1px solid;display:flex;gap:12px;align-items:flex-start;animation:ertSlide .35s cubic-bezier(.16,1,.3,1) both;box-shadow:0 8px 32px rgba(0,0,0,.5)}
        @keyframes ertSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
        .ert-toast.approved{border-color:rgba(74,222,128,.4)}
        .ert-toast.rejected{border-color:rgba(253,28,0,.4)}
        .ert-icon{flex-shrink:0;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800}
        .ert-toast.approved .ert-icon{background:rgba(74,222,128,.15);color:#4ade80}
        .ert-toast.rejected .ert-icon{background:rgba(253,28,0,.15);color:#fd1c00}
        .ert-content{flex:1;min-width:0}
        .ert-title{font-size:.82rem;font-weight:800;color:#fff;letter-spacing:.3px;margin-bottom:3px;text-transform:uppercase}
        .ert-toast.approved .ert-title{color:#4ade80}
        .ert-toast.rejected .ert-title{color:#fd1c00}
        .ert-team{font-size:.7rem;color:rgba(255,255,255,.6);margin-bottom:6px}
        .ert-team strong{color:#EEA727}
        .ert-fields{font-size:.7rem;color:rgba(255,255,255,.5);margin-bottom:6px}
        .ert-fields strong{color:rgba(255,255,255,.85)}
        .ert-notes{margin-top:6px;padding:7px 10px;border-radius:7px;background:rgba(255,255,255,.04);border-left:2px solid;font-size:.7rem;color:rgba(255,255,255,.85);line-height:1.5;font-style:italic}
        .ert-toast.approved .ert-notes{border-left-color:#4ade80}
        .ert-toast.rejected .ert-notes{border-left-color:#fd1c00}
        .ert-mentor{margin-top:5px;font-size:.62rem;color:rgba(255,255,255,.45)}
        .ert-close{flex-shrink:0;width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,.06);border:none;color:rgba(255,255,255,.5);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
        .ert-close:hover{background:rgba(255,255,255,.12);color:#fff}
      `}</style>
      {toasts.map(t => {
        const fields = (t.field_changes || []).map(c => c.field).join(', ')
        return (
          <div key={t.id} className={`ert-toast ${t.status}`}>
            <div className="ert-icon">{t.status === 'approved' ? '✓' : '✕'}</div>
            <div className="ert-content">
              <div className="ert-title">
                Edit Request {t.status === 'approved' ? 'Approved' : 'Rejected'}
              </div>
              <div className="ert-team">Team <strong>{t.team_number}</strong></div>
              {fields && <div className="ert-fields"><strong>Fields:</strong> {fields}</div>}
              {t.mentor_notes && <div className="ert-notes">"{t.mentor_notes}"</div>}
              {t.reviewed_by_mentor_name && <div className="ert-mentor">— {t.reviewed_by_mentor_name}</div>}
            </div>
            <button className="ert-close" onClick={() => dismiss(t.id)} title="Dismiss">×</button>
          </div>
        )
      })}
    </div>
  )
}