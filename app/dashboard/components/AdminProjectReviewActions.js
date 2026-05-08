'use client'
import { useState } from 'react'

// Admin Project Review Actions
// Place at: app/dashboard/components/AdminProjectReviewActions.js
//
// Renders:
//   - "Run All Reviews" button → POST /api/admin/project-review/run-batch
//   - "Notify Leaders" button → POST /api/admin/project-review/notify-leaders
//   - Live progress bar when batch is running
//   - Confirmation dialogs before destructive actions
//   - Toast notifications for results

export default function AdminProjectReviewActions({
  user,
  adminEmail,
  summary,
  activeBatch,
  onActionComplete,
}) {
  const [runConfirmOpen, setRunConfirmOpen] = useState(false)
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false)
  const [runningRun, setRunningRun] = useState(false)
  const [runningNotify, setRunningNotify] = useState(false)
  const [toast, setToast] = useState(null)

  const isBatchRunning = activeBatch && (activeBatch.status === 'queued' || activeBatch.status === 'running')

  // Counts for confirmations
  const pendingCount = summary?.pending || 0
  const reviewedCount = summary?.reviewed || 0

  // Progress for live bar
  const progressData = activeBatch ? {
    total: activeBatch.total_teams || 0,
    completed: activeBatch.completed_teams || 0,
    failed: activeBatch.failed_teams || 0,
    inProgress: activeBatch.in_progress_teams || 0,
    progressPct: activeBatch.total_teams > 0
      ? Math.round(((activeBatch.completed_teams || 0) + (activeBatch.failed_teams || 0)) / activeBatch.total_teams * 100)
      : 0,
    currentTeam: activeBatch.current_team_number,
    cost: parseFloat(activeBatch.total_cost_usd || 0),
  } : null

  // ─── Run All Reviews ───
  async function handleRunAll() {
    setRunConfirmOpen(false)
    setRunningRun(true)
    try {
      const r = await fetch('/api/admin/project-review/run-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          notes: `Batch run by ${adminEmail} on ${new Date().toLocaleDateString()}`,
        }),
      })
      const d = await r.json()
      if (d.ok) {
        showToast('success', d.message || `Queued ${d.run?.total_teams} teams. Processing will start within 1 minute.`)
        if (onActionComplete) onActionComplete()
      } else {
        showToast('error', d.error || 'Failed to start batch')
      }
    } catch (e) {
      console.error('[run-batch] error:', e)
      showToast('error', 'Network error. Please try again.')
    } finally {
      setRunningRun(false)
    }
  }

  // ─── Notify Leaders ───
  async function handleNotify() {
    setNotifyConfirmOpen(false)
    setRunningNotify(true)
    try {
      const r = await fetch('/api/admin/project-review/notify-leaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
      })
      const d = await r.json()
      if (d.ok) {
        const sent = d.summary?.sent ?? 0
        const failed = d.summary?.failed ?? 0
        if (failed === 0) {
          showToast('success', `✅ Notified ${sent} team leaders successfully.`)
        } else {
          showToast('warning', `Sent ${sent}, failed ${failed}. Check failures list.`)
        }
        if (onActionComplete) onActionComplete()
      } else {
        showToast('error', d.error || 'Failed to send notifications')
      }
    } catch (e) {
      console.error('[notify-leaders] error:', e)
      showToast('error', 'Network error. Please try again.')
    } finally {
      setRunningNotify(false)
    }
  }

  function showToast(type, text) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 6000)
  }

  return (
    <div className="apra-wrap">
      <style>{COMPONENT_STYLES}</style>

      {/* Action buttons row */}
      <div className="apra-actions">
        <button
          type="button"
          className="apra-btn apra-btn-run"
          onClick={() => setRunConfirmOpen(true)}
          disabled={runningRun || isBatchRunning || pendingCount === 0}
          title={
            isBatchRunning
              ? 'A batch is already running'
              : pendingCount === 0
                ? 'No pending submissions to review'
                : `Start AI review for ${pendingCount} pending teams`
          }
        >
          {runningRun ? (
            <><SpinnerIcon /> Starting...</>
          ) : (
            <><PlayIcon /> Run All Reviews{pendingCount > 0 ? ` (${pendingCount})` : ''}</>
          )}
        </button>

        <button
          type="button"
          className="apra-btn apra-btn-notify"
          onClick={() => setNotifyConfirmOpen(true)}
          disabled={runningNotify || reviewedCount === 0}
          title={
            reviewedCount === 0
              ? 'No reviewed teams to notify yet'
              : `Send email to ${reviewedCount} team leaders`
          }
        >
          {runningNotify ? (
            <><SpinnerIcon /> Sending emails...</>
          ) : (
            <><MailIcon /> Notify Leaders ({reviewedCount})</>
          )}
        </button>
      </div>

      {/* Active batch progress display */}
      {isBatchRunning && progressData && (
        <div className="apra-progress">
          <div className="apra-progress-head">
            <div className="apra-progress-title">
              <span className="apra-pulse-dot" />
              {activeBatch.status === 'queued'
                ? 'Queued — processing will start within 1 minute'
                : `Running batch · ${progressData.completed + progressData.failed}/${progressData.total} teams`}
            </div>
            <div className="apra-progress-pct">{progressData.progressPct}%</div>
          </div>

          <div className="apra-progress-bar">
            <div
              className="apra-progress-fill apra-progress-completed"
              style={{ width: `${progressData.total > 0 ? (progressData.completed / progressData.total) * 100 : 0}%` }}
            />
            <div
              className="apra-progress-fill apra-progress-failed"
              style={{
                width: `${progressData.total > 0 ? (progressData.failed / progressData.total) * 100 : 0}%`,
                left: `${progressData.total > 0 ? (progressData.completed / progressData.total) * 100 : 0}%`,
              }}
            />
            <div
              className="apra-progress-fill apra-progress-inprogress"
              style={{
                width: `${progressData.total > 0 ? (progressData.inProgress / progressData.total) * 100 : 0}%`,
                left: `${progressData.total > 0 ? ((progressData.completed + progressData.failed) / progressData.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="apra-progress-stats">
            <span className="apra-stat-item">
              <span className="apra-stat-dot" style={{ background: '#4ade80' }} />
              <strong>{progressData.completed}</strong> completed
            </span>
            <span className="apra-stat-item">
              <span className="apra-stat-dot" style={{ background: '#fd1c00' }} />
              <strong>{progressData.failed}</strong> failed
            </span>
            <span className="apra-stat-item">
              <span className="apra-stat-dot apra-stat-dot-pulse" style={{ background: '#EEA727' }} />
              <strong>{progressData.inProgress}</strong> in progress
            </span>
            {progressData.cost > 0 && (
              <span className="apra-stat-item apra-stat-cost">
                💰 <strong>${progressData.cost.toFixed(2)}</strong> spent
              </span>
            )}
            {progressData.currentTeam && (
              <span className="apra-stat-item apra-stat-team">
                Currently processing: <strong>{progressData.currentTeam}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Run confirmation dialog */}
      {runConfirmOpen && (
        <ConfirmDialog
          icon={<PlayIcon />}
          iconColor="#fd1c00"
          title="Run AI Review for All Pending Teams?"
          message={`This will start AI review for ${pendingCount} team${pendingCount === 1 ? '' : 's'}. Processing happens in the background and takes ~10-15 minutes for all teams.`}
          extra={
            <div className="apra-confirm-cost-est">
              <div className="apra-cost-row">
                <span>Estimated cost:</span>
                <strong>${(pendingCount * 0.13).toFixed(2)} – ${(pendingCount * 0.18).toFixed(2)}</strong>
              </div>
              <div className="apra-cost-row">
                <span>Daily cap:</span>
                <strong>$30.00 / day</strong>
              </div>
            </div>
          }
          confirmLabel="Run All Reviews"
          cancelLabel="Cancel"
          onConfirm={handleRunAll}
          onCancel={() => setRunConfirmOpen(false)}
        />
      )}

      {/* Notify confirmation dialog */}
      {notifyConfirmOpen && (
        <ConfirmDialog
          icon={<MailIcon />}
          iconColor="#EEA727"
          title="Send Notification Emails?"
          message={`This will send an email to ${reviewedCount} team leader${reviewedCount === 1 ? '' : 's'} letting them know their AI review is ready. Email will go to all reviewed teams (not just newly-reviewed ones).`}
          extra={
            <div className="apra-confirm-warning">
              ⚠️ Once sent, emails cannot be unsent.
            </div>
          }
          confirmLabel="Send Emails"
          cancelLabel="Cancel"
          onConfirm={handleNotify}
          onCancel={() => setNotifyConfirmOpen(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`apra-toast apra-toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircleIcon />}
          {toast.type === 'error' && <XCircleIcon />}
          {toast.type === 'warning' && <WarningIcon />}
          <span>{toast.text}</span>
          <button
            type="button"
            className="apra-toast-x"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            <XIconSm />
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────────────────
function ConfirmDialog({ icon, iconColor, title, message, extra, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="apra-modal-bg" onClick={onCancel}>
      <div className="apra-modal" onClick={(e) => e.stopPropagation()}>
        <div className="apra-modal-icon" style={{ color: iconColor, background: iconColor + '15' }}>
          {icon}
        </div>
        <div className="apra-modal-title">{title}</div>
        <div className="apra-modal-msg">{message}</div>
        {extra}
        <div className="apra-modal-actions">
          <button
            type="button"
            className="apra-btn apra-btn-ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="apra-btn apra-btn-confirm"
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="16" height="16">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" className="apra-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function XCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function XIconSm() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES (apra- prefix)
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.apra-wrap{margin-bottom:14px;font-family:'DM Sans',sans-serif}

/* Buttons row */
.apra-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.apra-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;letter-spacing:.4px;cursor:pointer;border:none;transition:all .2s;white-space:nowrap}
.apra-btn:disabled{opacity:.4;cursor:not-allowed}
.apra-btn-run{background:linear-gradient(135deg,#fd1c00,#c41600);color:#fff;box-shadow:0 4px 14px rgba(253,28,0,.25)}
.apra-btn-run:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(253,28,0,.4)}
.apra-btn-notify{background:linear-gradient(135deg,#EEA727,#c8861a);color:#fff;box-shadow:0 4px 14px rgba(238,167,39,.2)}
.apra-btn-notify:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 22px rgba(238,167,39,.35)}
.apra-btn-ghost{background:rgba(255,255,255,.05);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1)}
.apra-btn-ghost:hover:not(:disabled){background:rgba(255,255,255,.08);color:#fff}
.apra-btn-confirm{background:#fd1c00;color:#fff;font-weight:700}
.apra-btn-confirm:hover{background:#e51800;transform:translateY(-1px);box-shadow:0 4px 14px rgba(253,28,0,.4)}

.apra-spin{animation:apraSpin 1s linear infinite}
@keyframes apraSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Live progress bar */
.apra-progress{padding:18px 22px;border-radius:12px;background:linear-gradient(135deg,rgba(253,28,0,.06),rgba(238,167,39,.04));border:1px solid rgba(253,28,0,.25);margin-bottom:8px;animation:apraIn .3s ease both}
@keyframes apraIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}

.apra-progress-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:10px;flex-wrap:wrap}
.apra-progress-title{display:flex;align-items:center;gap:8px;font-size:.82rem;font-weight:600;color:#fff}
.apra-pulse-dot{width:8px;height:8px;border-radius:50%;background:#fd1c00;flex-shrink:0;animation:apraPulse 1.4s ease-in-out infinite;box-shadow:0 0 8px rgba(253,28,0,.6)}
@keyframes apraPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
.apra-progress-pct{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.4rem;font-weight:800;color:#EEA727;letter-spacing:1px;line-height:1}

.apra-progress-bar{position:relative;height:10px;border-radius:5px;background:rgba(255,255,255,.06);overflow:hidden;margin-bottom:12px}
.apra-progress-fill{position:absolute;top:0;height:100%;border-radius:5px;transition:all .35s ease}
.apra-progress-completed{background:linear-gradient(90deg,#4ade80,#22c55e);left:0;box-shadow:0 0 8px rgba(74,222,128,.3)}
.apra-progress-failed{background:linear-gradient(90deg,#fd1c00,#c41600);box-shadow:0 0 8px rgba(253,28,0,.3)}
.apra-progress-inprogress{background:linear-gradient(90deg,rgba(238,167,39,.5),rgba(238,167,39,.7));animation:apraShimmer 2s linear infinite}
@keyframes apraShimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}

.apra-progress-stats{display:flex;flex-wrap:wrap;gap:14px 18px;font-size:.74rem;color:rgba(255,255,255,.65)}
.apra-stat-item{display:inline-flex;align-items:center;gap:5px}
.apra-stat-item strong{color:#fff;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-weight:800;letter-spacing:.4px}
.apra-stat-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.apra-stat-dot-pulse{animation:apraPulse 1.4s ease-in-out infinite}
.apra-stat-cost{color:#EEA727}
.apra-stat-team{color:rgba(255,255,255,.5);font-style:italic}
.apra-stat-team strong{font-style:normal;color:#fd1c00}

/* Modal (confirmation dialog) */
.apra-modal-bg{position:fixed;inset:0;background:rgba(5,0,8,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;animation:apraBgIn .2s ease both}
@keyframes apraBgIn{from{opacity:0}to{opacity:1}}
.apra-modal{background:#0a0612;border:1px solid rgba(255,255,255,.1);border-radius:16px;width:100%;max-width:460px;padding:32px 28px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;animation:apraModalIn .25s ease both;box-shadow:0 24px 64px rgba(0,0,0,.6)}
@keyframes apraModalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
.apra-modal-icon{width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center}
.apra-modal-icon svg{width:28px;height:28px}
.apra-modal-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;color:#fff;letter-spacing:1px;text-transform:uppercase;line-height:1.3}
.apra-modal-msg{font-size:.85rem;color:rgba(255,255,255,.65);line-height:1.6;max-width:380px}
.apra-confirm-cost-est{display:flex;flex-direction:column;gap:6px;width:100%;padding:14px 18px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);margin-top:6px}
.apra-cost-row{display:flex;justify-content:space-between;font-size:.78rem;color:rgba(255,255,255,.6)}
.apra-cost-row strong{color:#EEA727;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-weight:800;letter-spacing:.3px}
.apra-confirm-warning{font-size:.78rem;color:#EEA727;background:rgba(238,167,39,.06);border:1px solid rgba(238,167,39,.2);border-radius:8px;padding:10px 14px;font-weight:500;margin-top:6px}
.apra-modal-actions{display:flex;gap:10px;width:100%;margin-top:8px}
.apra-modal-actions .apra-btn{flex:1;justify-content:center;padding:12px 20px;font-size:.85rem}

/* Toast */
.apra-toast{position:fixed;bottom:24px;right:24px;display:flex;align-items:center;gap:10px;padding:14px 18px;border-radius:11px;font-size:.85rem;font-weight:500;z-index:10000;max-width:420px;backdrop-filter:blur(12px);box-shadow:0 12px 32px rgba(0,0,0,.4);animation:apraToastIn .35s cubic-bezier(0.34,1.56,0.64,1) both}
@keyframes apraToastIn{from{opacity:0;transform:translateX(20px) scale(.9)}to{opacity:1;transform:none}}
.apra-toast-success{background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.4);color:#4ade80}
.apra-toast-error{background:rgba(253,28,0,.12);border:1px solid rgba(253,28,0,.4);color:#fd1c00}
.apra-toast-warning{background:rgba(238,167,39,.12);border:1px solid rgba(238,167,39,.4);color:#EEA727}
.apra-toast-x{background:transparent;border:none;color:currentColor;cursor:pointer;padding:2px;display:flex;opacity:.6;transition:opacity .15s}
.apra-toast-x:hover{opacity:1}

/* Mobile */
@media(max-width:560px){
  .apra-actions{flex-direction:column}
  .apra-btn-run,.apra-btn-notify{width:100%;justify-content:center}
  .apra-progress-stats{font-size:.72rem;gap:10px 14px}
  .apra-toast{bottom:16px;right:16px;left:16px;max-width:none}
  .apra-modal{padding:24px 20px}
}
`