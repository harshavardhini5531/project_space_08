'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import AdminProjectReviewTable from './AdminProjectReviewTable'
import AdminProjectReviewActions from './AdminProjectReviewActions'

// Admin Project Review main shell
// Place at: app/dashboard/components/AdminProjectReview.js
//
// Admin sees:
//   - Header with current batch status indicator
//   - Summary cards (counts, avg score, cost)
//   - Action bar (Run All, Notify Leaders, Filters)
//   - 160-team table (Phase 5.2)
//   - Progress modal when batch is running (Phase 5.3)
//
// Auto-refreshes every 30s (always).

const REFRESH_INTERVAL_MS = 30 * 1000 // 30s per Q2 decision

export default function AdminProjectReview({ user }) {
  // Data state
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastRefreshAt, setLastRefreshAt] = useState(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)

  // Filter state (sent to API + applied to table)
  const [filterTechnology, setFilterTechnology] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Run batch state (passed to AdminProjectReviewActions)
  const [activeBatch, setActiveBatch] = useState(null)
  const refreshIvRef = useRef(null)

  const adminEmail = user?.email || 'harshavardhini@technicalhub.io'

  // ─── Fetch list with filters ───
  const fetchList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ adminEmail })
      if (filterTechnology) params.set('technology', filterTechnology)
      if (filterBatch) params.set('batch', filterBatch)
      if (filterStatus) params.set('status', filterStatus)

      const r = await fetch(`/api/admin/project-review/list?${params.toString()}`, {
        cache: 'no-store',
      })
      const d = await r.json()
      if (!d.ok) {
        setError(d.error || 'Failed to load review data')
        return
      }
      setData(d)
      setLastRefreshAt(Date.now())
    } catch (e) {
      console.error('[AdminProjectReview] fetch error:', e)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setIsAutoRefreshing(false)
    }
  }, [adminEmail, filterTechnology, filterBatch, filterStatus])

  // ─── Fetch active batch run status ───
  const fetchBatchStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({ adminEmail })
      const r = await fetch(
        `/api/admin/project-review/run-batch?${params.toString()}`,
        { cache: 'no-store' }
      )
      const d = await r.json()
      if (d.ok && d.run) {
        setActiveBatch(d.run)
      } else {
        setActiveBatch(null)
      }
    } catch (e) {
      console.error('[AdminProjectReview] batch status error:', e)
    }
  }, [adminEmail])

  // ─── Initial load + filter changes ───
  useEffect(() => {
    fetchList()
    fetchBatchStatus()
  }, [fetchList, fetchBatchStatus, refreshKey])

  // ─── Auto-refresh every 30s ───
  useEffect(() => {
    refreshIvRef.current = setInterval(() => {
      setIsAutoRefreshing(true)
      fetchList(true)
      fetchBatchStatus()
    }, REFRESH_INTERVAL_MS)
    return () => {
      if (refreshIvRef.current) clearInterval(refreshIvRef.current)
    }
  }, [fetchList, fetchBatchStatus])

  // ─── Manual refresh ───
  function manualRefresh() {
    setRefreshKey((k) => k + 1)
  }

  // ─── Filter handlers ───
  function resetFilters() {
    setFilterTechnology('')
    setFilterBatch('')
    setFilterStatus('')
  }

  const hasActiveFilters = filterTechnology || filterBatch || filterStatus

  // ─── Loading state ───
  if (loading && !data) {
    return (
      <div className="apv-wrap">
        <style>{COMPONENT_STYLES}</style>
        <div className="apv-loading">
          <SpinnerIcon />
          <span>Loading admin review dashboard...</span>
        </div>
      </div>
    )
  }

  // ─── Error state ───
  if (error && !data) {
    return (
      <div className="apv-wrap">
        <style>{COMPONENT_STYLES}</style>
        <div className="apv-error-state">
          <WarningIcon />
          <div className="apv-error-title">Could not load</div>
          <div className="apv-error-msg">{error}</div>
          <button className="apv-btn apv-btn-primary" onClick={manualRefresh}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summary = data?.summary || {}
  const teams = data?.teams || []
  const filtersAvailable = data?.filters_available || {}

  // Batch state determines UI behavior
  const isBatchRunning = activeBatch && (activeBatch.status === 'queued' || activeBatch.status === 'running')

  return (
    <div className="apv-wrap">
      <style>{COMPONENT_STYLES}</style>

      {/* ────── Top header ────── */}
      <div className="apv-header">
        <div className="apv-header-text">
          <h1 className="apv-title">Project Review (Admin)</h1>
          <p className="apv-subtitle">AI-powered analysis · Manage all team reviews</p>
        </div>
        <div className="apv-header-status">
          <BatchStatusIndicator batch={activeBatch} />
          <RefreshIndicator
            lastRefreshAt={lastRefreshAt}
            isRefreshing={isAutoRefreshing}
            onClick={manualRefresh}
          />
        </div>
      </div>

      {/* ────── Summary cards ────── */}
      <div className="apv-summary">
        <SummaryCard
          label="Total Teams"
          value={summary.total_teams || 0}
          color="#fff"
        />
        <SummaryCard
          label="Submitted"
          value={summary.submitted_total || 0}
          color="#EEA727"
          sub={`${summary.total_teams ? Math.round((summary.submitted_total / summary.total_teams) * 100) : 0}%`}
        />
        <SummaryCard
          label="Reviewed"
          value={summary.reviewed || 0}
          color="#4ade80"
          sub={summary.reviewed_pct != null ? `${summary.reviewed_pct}%` : null}
        />
        <SummaryCard
          label="Failed"
          value={summary.failed || 0}
          color="#fd1c00"
        />
        <SummaryCard
          label="Pending"
          value={(summary.pending || 0) + (summary.queued || 0) + (summary.reviewing || 0)}
          color="#7B2FBE"
        />
      </div>

      {/* Average + Cost row */}
      {(summary.avg_score != null || summary.total_cost_usd != null) && (
        <div className="apv-extras">
          {summary.avg_score != null && (
            <div className="apv-extra">
              <span className="apv-extra-label">AVG SCORE</span>
              <span className="apv-extra-val" style={{ color: getScoreColor(summary.avg_score) }}>
                {summary.avg_score}
              </span>
            </div>
          )}
          {summary.total_cost_usd != null && (
            <div className="apv-extra">
              <span className="apv-extra-label">TOTAL AI COST</span>
              <span className="apv-extra-val" style={{ color: '#EEA727' }}>
                ${parseFloat(summary.total_cost_usd).toFixed(2)}
              </span>
            </div>
          )}
          {summary.locked_for_resubmit > 0 && (
            <div className="apv-extra">
              <span className="apv-extra-label">UNLOCKED FOR RESUBMIT</span>
              <span className="apv-extra-val" style={{ color: '#7B2FBE' }}>
                {summary.locked_for_resubmit}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ────── Actions bar (Phase 5.3) ────── */}
      <AdminProjectReviewActions
        user={user}
        adminEmail={adminEmail}
        summary={summary}
        activeBatch={activeBatch}
        onActionComplete={() => {
          fetchBatchStatus()
          fetchList(true)
        }}
      />

      {/* ────── Filters bar ────── */}
      <div className="apv-filters">
        <div className="apv-filters-left">
          <FilterSelect
            label="Technology"
            value={filterTechnology}
            onChange={setFilterTechnology}
            options={filtersAvailable.technologies || []}
          />
          <FilterSelect
            label="Batch"
            value={filterBatch}
            onChange={setFilterBatch}
            options={filtersAvailable.batches || []}
          />
          <FilterSelect
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={filtersAvailable.statuses || []}
            optionLabelMap={{
              not_submitted: 'Not Submitted',
              pending: 'Pending',
              queued: 'Queued',
              reviewing: 'Reviewing',
              reviewed: 'Reviewed',
              failed: 'Failed',
            }}
          />
        </div>
        <div className="apv-filters-right">
          {hasActiveFilters && (
            <button className="apv-btn apv-btn-ghost" onClick={resetFilters}>
              <XIcon /> Clear filters
            </button>
          )}
          <span className="apv-result-count">
            Showing {teams.length} {teams.length === 1 ? 'team' : 'teams'}
          </span>
        </div>
      </div>

      {/* ────── Table (Phase 5.2) ────── */}
      <AdminProjectReviewTable
        teams={teams}
        adminEmail={adminEmail}
        onForceResubmit={() => fetchList(true)}
        isBatchRunning={isBatchRunning}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function BatchStatusIndicator({ batch }) {
  if (!batch) {
    return (
      <span className="apv-batch-pill apv-batch-idle">
        <span className="apv-dot" />
        IDLE
      </span>
    )
  }

  const status = batch.status
  if (status === 'queued') {
    return (
      <span className="apv-batch-pill apv-batch-queued">
        <span className="apv-dot apv-dot-pulse" />
        QUEUED · {batch.total_teams} teams
      </span>
    )
  }
  if (status === 'running') {
    const progress = batch.total_teams > 0
      ? Math.round(((batch.completed_teams || 0) + (batch.failed_teams || 0)) / batch.total_teams * 100)
      : 0
    return (
      <span className="apv-batch-pill apv-batch-running">
        <span className="apv-dot apv-dot-pulse" />
        RUNNING · {progress}%
      </span>
    )
  }
  if (status === 'complete') {
    return (
      <span className="apv-batch-pill apv-batch-complete">
        <CheckIconSmall />
        COMPLETE · {batch.completed_teams || 0}/{batch.total_teams || 0}
      </span>
    )
  }
  if (status === 'error' || status === 'cancelled') {
    return (
      <span className="apv-batch-pill apv-batch-error">
        <WarningIconSmall />
        {status.toUpperCase()}
      </span>
    )
  }
  return null
}

function RefreshIndicator({ lastRefreshAt, isRefreshing, onClick }) {
  if (!lastRefreshAt) return null
  const ageSec = Math.round((Date.now() - lastRefreshAt) / 1000)
  const ageLabel = ageSec < 60
    ? `${ageSec}s ago`
    : `${Math.round(ageSec / 60)}m ago`

  return (
    <button
      type="button"
      className="apv-refresh-btn"
      onClick={onClick}
      title="Refresh now"
    >
      <span className={isRefreshing ? 'apv-spin' : ''}>
        <RefreshIcon />
      </span>
      <span className="apv-refresh-text">{ageLabel}</span>
    </button>
  )
}

function SummaryCard({ label, value, color = '#fff', sub = null }) {
  return (
    <div className="apv-card">
      <div className="apv-card-val" style={{ color }}>
        {value}
      </div>
      <div className="apv-card-label">{label}</div>
      {sub && <div className="apv-card-sub">{sub}</div>}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, optionLabelMap = {} }) {
  return (
    <div className="apv-filter-wrap">
      <label className="apv-filter-label">{label}</label>
      <select
        className="apv-filter-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabelMap[opt] || opt}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function getScoreColor(score) {
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#EEA727'
  if (score >= 40) return '#fd1c00'
  return '#7B2FBE'
}

// ─────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="apv-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
function CheckIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function WarningIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES (apv- prefix scoped)
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.apv-wrap{font-family:'DM Sans',sans-serif;color:#fff;animation:apvIn .4s ease both;padding-bottom:40px}
@keyframes apvIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* Loading */
.apv-loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:80px 20px;color:rgba(255,255,255,.45);font-size:.88rem;font-weight:500}
.apv-loading svg{width:24px;height:24px;color:#EEA727}

/* Error state */
.apv-error-state{padding:50px 32px;border-radius:14px;background:linear-gradient(135deg,rgba(253,28,0,.04),rgba(12,8,18,.5));border:1px solid rgba(253,28,0,.2);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px}
.apv-error-state svg{color:#fd1c00}
.apv-error-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
.apv-error-msg{color:rgba(255,255,255,.6);font-size:.85rem;max-width:480px;line-height:1.5}

/* Header */
.apv-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:24px 28px;border-radius:16px;background:linear-gradient(135deg,rgba(253,28,0,.05),rgba(238,167,39,.03));border:1px solid rgba(253,28,0,.15);margin-bottom:18px;flex-wrap:wrap}
.apv-header-text{flex:1;min-width:240px}
.apv-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.4rem;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px 0;line-height:1.2}
.apv-subtitle{font-size:.85rem;color:rgba(255,255,255,.5);margin:0;font-weight:500}
.apv-header-status{display:flex;align-items:center;gap:10px;flex-wrap:wrap}

/* Batch status pill */
.apv-batch-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:8px;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.66rem;font-weight:800;letter-spacing:1.3px;border:1px solid;text-transform:uppercase}
.apv-batch-idle{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.5)}
.apv-batch-queued{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.3);color:#EEA727}
.apv-batch-running{background:rgba(253,28,0,.08);border-color:rgba(253,28,0,.4);color:#fd1c00}
.apv-batch-complete{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);color:#4ade80}
.apv-batch-error{background:rgba(253,28,0,.1);border-color:rgba(253,28,0,.3);color:#fd1c00}
.apv-dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}
.apv-dot-pulse{animation:apvPulse 1.5s ease-in-out infinite}
@keyframes apvPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}

/* Refresh button */
.apv-refresh-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(255,255,255,.55);font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.3px;padding:6px 10px;cursor:pointer;transition:all .2s}
.apv-refresh-btn:hover{background:rgba(255,255,255,.08);color:#fff}
.apv-refresh-btn svg{flex-shrink:0}
.apv-refresh-text{font-variant-numeric:tabular-nums}

.apv-spin{animation:apvSpin 1s linear infinite}
@keyframes apvSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Summary cards */
.apv-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}
.apv-card{padding:18px 16px;border-radius:12px;background:linear-gradient(135deg,rgba(12,8,18,.6),rgba(12,8,18,.4));border:1px solid rgba(255,255,255,.06);text-align:center;transition:transform .2s}
.apv-card:hover{transform:translateY(-1px);border-color:rgba(255,255,255,.1)}
.apv-card-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.7rem;font-weight:800;line-height:1;letter-spacing:1px;margin-bottom:6px}
.apv-card-label{font-size:.58rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.4px;font-weight:700}
.apv-card-sub{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.65rem;color:rgba(255,255,255,.4);margin-top:4px;letter-spacing:.5px;font-weight:600}

/* Extras row (avg score, cost) */
.apv-extras{display:flex;gap:14px;padding:12px 22px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:18px;flex-wrap:wrap}
.apv-extra{display:flex;align-items:center;gap:10px}
.apv-extra-label{font-size:.6rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1.3px;font-weight:700}
.apv-extra-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;letter-spacing:.5px}

/* Filters */
.apv-filters{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);margin-bottom:14px;flex-wrap:wrap}
.apv-filters-left{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
.apv-filters-right{display:flex;align-items:center;gap:14px;flex-wrap:wrap}

.apv-filter-wrap{display:flex;flex-direction:column;gap:4px}
.apv-filter-label{font-size:.58rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1.3px;font-weight:700}
.apv-filter-select{padding:7px 10px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;cursor:pointer;min-width:130px;appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>");background-repeat:no-repeat;background-position:right 8px center;padding-right:28px}
.apv-filter-select:focus{outline:none;border-color:rgba(253,28,0,.4);background-color:rgba(253,28,0,.04)}

.apv-result-count{font-size:.72rem;color:rgba(255,255,255,.4);font-weight:600}

/* Generic buttons */
.apv-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.76rem;font-weight:600;letter-spacing:.3px;cursor:pointer;border:none;transition:all .2s}
.apv-btn-primary{background:#fd1c00;color:#fff}
.apv-btn-primary:hover{background:#e51800;transform:translateY(-1px);box-shadow:0 4px 14px rgba(253,28,0,.3)}
.apv-btn-ghost{background:rgba(255,255,255,.04);color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.1)}
.apv-btn-ghost:hover{background:rgba(255,255,255,.08);color:#fff}

/* Mobile */
@media(max-width:900px){
  .apv-summary{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:560px){
  .apv-header{padding:18px 20px}
  .apv-summary{grid-template-columns:repeat(2,1fr)}
  .apv-filter-select{min-width:100px}
  .apv-extras{flex-direction:column;gap:8px}
}
`