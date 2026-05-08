'use client'
import { useState } from 'react'

// Project Review Report
// Place at: app/dashboard/components/ProjectReviewReport.js
//
// Displays AI-generated review report.
// Shown when state === 'reviewed' in ProjectReview.js
//
// Sections:
//   - Score circle + breakdown bars
//   - Summary
//   - Tabs: Positives / Bugs / Improvements / Tech Stack Validation

export default function ProjectReviewReport({ submission, report, isLeader }) {
  const [activeTab, setActiveTab] = useState('positives')

  if (!report) return null

  const overall = report.score?.overall ?? 0
  const breakdown = report.score?.breakdown || {}
  const grade = getGrade(overall)
  const reviewedAt = report.reviewed_at
    ? new Date(report.reviewed_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'recently'

  const positives = Array.isArray(report.positives) ? report.positives : []
  const bugs = Array.isArray(report.bugs) ? report.bugs : []
  const improvements = Array.isArray(report.improvements) ? report.improvements : []
  const techValidation = report.tech_stack_validation || null

  const tabs = [
    { id: 'positives',    label: 'Positives',    count: positives.length,    icon: <CheckIcon /> },
    { id: 'bugs',         label: 'Bugs',         count: bugs.length,         icon: <BugIcon /> },
    { id: 'improvements', label: 'Improvements', count: improvements.length, icon: <LightbulbIcon /> },
  ]
  if (techValidation) tabs.push({ id: 'tech', label: 'Tech Stack', count: null, icon: <CodeIcon /> })

  return (
    <div className="prvr-wrap">
      <style>{COMPONENT_STYLES}</style>

      {/* Top — score circle + breakdown */}
      <div className="prvr-score-card">
        <div className="prvr-score-circle-wrap">
          <ScoreCircle score={overall} grade={grade} />
        </div>
        <div className="prvr-breakdown">
          {Object.entries(breakdown).map(([key, val]) => (
            <BreakdownRow key={key} label={formatBreakdownLabel(key)} value={val} />
          ))}
        </div>
      </div>

      {/* Reviewed timestamp + AI model */}
      <div className="prvr-meta-bar">
        <span className="prvr-meta-item">
          <ClockIconSmall /> Reviewed {reviewedAt}
        </span>
        {report.ai_model && (
          <span className="prvr-meta-item">
            <SparkleIcon /> {formatModelName(report.ai_model)}
          </span>
        )}
        {report.duration_seconds != null && (
          <span className="prvr-meta-item">
            <TimerIcon /> Took {report.duration_seconds}s
          </span>
        )}
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="prvr-summary">
          <div className="prvr-summary-head">
            <SummaryIcon /> <span>Summary</span>
          </div>
          <p className="prvr-summary-text">{report.summary}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="prvr-tabs-wrap">
        <div className="prvr-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`prvr-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="prvr-tab-icon">{tab.icon}</span>
              <span className="prvr-tab-label">{tab.label}</span>
              {tab.count != null && (
                <span className="prvr-tab-count">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="prvr-tab-content">
          {activeTab === 'positives' && (
            <PositivesList items={positives} />
          )}
          {activeTab === 'bugs' && (
            <BugsList items={bugs} />
          )}
          {activeTab === 'improvements' && (
            <ImprovementsList items={improvements} />
          )}
          {activeTab === 'tech' && techValidation && (
            <TechValidation data={techValidation} />
          )}
        </div>
      </div>

      {/* Footer note */}
      <div className="prvr-footer-note">
        <InfoIcon /> This review is AI-generated. Use it as guidance, but your mentor's feedback always takes precedence.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Score circle (animated SVG ring)
// ─────────────────────────────────────────────────────────
function ScoreCircle({ score, grade }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className="prvr-score-circle">
      <svg viewBox="0 0 180 180" className="prvr-score-svg">
        {/* Background ring */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Progress ring */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="prvr-score-text">
        <div className="prvr-score-num" style={{ color }}>{score}</div>
        <div className="prvr-score-of">/100</div>
        <div className="prvr-score-grade" style={{ color }}>{grade}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Breakdown row (horizontal bar)
// ─────────────────────────────────────────────────────────
function BreakdownRow({ label, value }) {
  const v = typeof value === 'number' ? value : 0
  const color = getScoreColor(v)
  return (
    <div className="prvr-bd-row">
      <span className="prvr-bd-label">{label}</span>
      <div className="prvr-bd-bar">
        <div
          className="prvr-bd-fill"
          style={{ width: `${v}%`, background: color }}
        />
      </div>
      <span className="prvr-bd-val" style={{ color }}>{v}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Positives list
// ─────────────────────────────────────────────────────────
function PositivesList({ items }) {
  if (items.length === 0) {
    return <EmptyTab text="No specific positives noted." />
  }
  return (
    <div className="prvr-list">
      {items.map((p, idx) => (
        <div key={idx} className="prvr-item prvr-item-positive">
          <div className="prvr-item-marker prvr-marker-green">
            <CheckIcon />
          </div>
          <div className="prvr-item-body">
            {p.area && <div className="prvr-item-title">{p.area}</div>}
            <div className="prvr-item-desc">{p.comment || p.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Bugs list (with severity)
// ─────────────────────────────────────────────────────────
function BugsList({ items }) {
  if (items.length === 0) {
    return <EmptyTab text="No bugs found! Your code is clean. 🎉" />
  }
  // Sort by severity high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  const sorted = [...items].sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))

  return (
    <div className="prvr-list">
      {sorted.map((b, idx) => (
        <div key={idx} className={`prvr-item prvr-item-bug prvr-sev-${b.severity || 'low'}`}>
          <div className={`prvr-item-marker prvr-marker-${b.severity || 'low'}`}>
            <BugIcon />
          </div>
          <div className="prvr-item-body">
            <div className="prvr-item-titlebar">
              {b.severity && (
                <span className={`prvr-sev-badge prvr-sev-badge-${b.severity}`}>
                  {b.severity.toUpperCase()}
                </span>
              )}
              {b.file && <span className="prvr-file">{b.file}</span>}
            </div>
            <div className="prvr-item-desc">
              <strong>Issue:</strong> {b.issue || b.description}
            </div>
            {b.fix && (
              <div className="prvr-item-fix">
                <strong>Fix:</strong> {b.fix}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Improvements list
// ─────────────────────────────────────────────────────────
function ImprovementsList({ items }) {
  if (items.length === 0) {
    return <EmptyTab text="No specific improvement suggestions." />
  }
  const order = { high: 0, medium: 1, low: 2 }
  const sorted = [...items].sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))

  return (
    <div className="prvr-list">
      {sorted.map((i, idx) => (
        <div key={idx} className="prvr-item prvr-item-improvement">
          <div className={`prvr-item-marker prvr-marker-${i.priority || 'low'}`}>
            <LightbulbIcon />
          </div>
          <div className="prvr-item-body">
            <div className="prvr-item-titlebar">
              {i.priority && (
                <span className={`prvr-sev-badge prvr-sev-badge-${i.priority}`}>
                  {i.priority.toUpperCase()} PRIORITY
                </span>
              )}
              {i.area && <span className="prvr-area">{i.area}</span>}
            </div>
            <div className="prvr-item-desc">
              {i.suggestion || i.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tech Stack Validation
// ─────────────────────────────────────────────────────────
function TechValidation({ data }) {
  const claimed = Array.isArray(data.claimed) ? data.claimed : []
  const actual = Array.isArray(data.actual) ? data.actual : []
  const match = data.match
  const notes = data.notes || ''

  return (
    <div className="prvr-tech-wrap">
      <div className={`prvr-tech-banner ${match ? 'prvr-tech-match' : 'prvr-tech-mismatch'}`}>
        {match ? <CheckIcon /> : <WarningIconSmall />}
        <span>{match ? 'Tech stack matches what was claimed' : 'Tech stack mismatch detected'}</span>
      </div>

      <div className="prvr-tech-cols">
        <div className="prvr-tech-col">
          <div className="prvr-tech-col-head">You Claimed</div>
          <div className="prvr-tech-tags">
            {claimed.length === 0
              ? <span className="prvr-tech-empty">None listed</span>
              : claimed.map((t) => (
                  <span key={t} className="prvr-tech-tag prvr-tech-claimed">{t}</span>
                ))}
          </div>
        </div>
        <div className="prvr-tech-col">
          <div className="prvr-tech-col-head">AI Detected</div>
          <div className="prvr-tech-tags">
            {actual.length === 0
              ? <span className="prvr-tech-empty">None detected</span>
              : actual.map((t) => (
                  <span key={t} className="prvr-tech-tag prvr-tech-actual">{t}</span>
                ))}
          </div>
        </div>
      </div>

      {notes && (
        <div className="prvr-tech-notes">{notes}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Empty tab
// ─────────────────────────────────────────────────────────
function EmptyTab({ text }) {
  return (
    <div className="prvr-empty">
      <div className="prvr-empty-icon"><InfoIcon /></div>
      <div className="prvr-empty-text">{text}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────
function getGrade(score) {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 80) return 'GREAT'
  if (score >= 70) return 'GOOD'
  if (score >= 60) return 'OKAY'
  if (score >= 50) return 'NEEDS WORK'
  return 'INCOMPLETE'
}

function getScoreColor(score) {
  if (score >= 80) return '#4ade80'  // green
  if (score >= 60) return '#EEA727'  // amber
  if (score >= 40) return '#fd1c00'  // red
  return '#7B2FBE'                   // purple (very low)
}

function formatBreakdownLabel(key) {
  const map = {
    code_quality: 'Code Quality',
    completion: 'Completion',
    documentation: 'Documentation',
    innovation: 'Innovation',
    tech_alignment: 'Tech Alignment',
  }
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatModelName(model) {
  if (model.includes('sonnet')) return 'Claude Sonnet 4'
  if (model.includes('haiku')) return 'Claude Haiku 4.5'
  if (model.includes('opus')) return 'Claude Opus 4'
  return model
}

// ─────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function BugIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" /><path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" /><path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" /><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  )
}
function LightbulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  )
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function ClockIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3z" />
      <path d="M5 18l-.5 1.5L3 20l1.5.5L5 22l.5-1.5L7 20l-1.5-.5L5 18z" />
      <path d="M19 14l-.5 1.5L17 16l1.5.5L19 18l.5-1.5L21 16l-1.5-.5L19 14z" />
    </svg>
  )
}
function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="12" cy="14" r="8" />
      <path d="M9 2h6" /><path d="M12 14v-4" />
    </svg>
  )
}
function SummaryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  )
}
function WarningIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.prvr-wrap{font-family:'DM Sans',sans-serif;animation:prvrIn .5s ease both}
@keyframes prvrIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* Score card — top */
.prvr-score-card{display:grid;grid-template-columns:240px 1fr;gap:32px;padding:30px;border-radius:16px;background:linear-gradient(135deg,rgba(12,8,18,.7),rgba(12,8,18,.5));border:1px solid rgba(255,255,255,.08);margin-bottom:14px;align-items:center}

/* Score circle */
.prvr-score-circle-wrap{display:flex;justify-content:center}
.prvr-score-circle{position:relative;width:180px;height:180px}
.prvr-score-svg{width:100%;height:100%}
.prvr-score-text{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.prvr-score-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:3rem;font-weight:800;line-height:1;letter-spacing:1px}
.prvr-score-of{font-size:.7rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:1px;margin-top:2px}
.prvr-score-grade{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.62rem;font-weight:800;letter-spacing:2px;margin-top:8px}

/* Breakdown */
.prvr-breakdown{display:flex;flex-direction:column;gap:10px}
.prvr-bd-row{display:grid;grid-template-columns:130px 1fr 36px;gap:14px;align-items:center}
.prvr-bd-label{font-size:.78rem;color:rgba(255,255,255,.7);font-weight:500;letter-spacing:.2px}
.prvr-bd-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden}
.prvr-bd-fill{height:100%;border-radius:4px;transition:width 1s ease;box-shadow:0 0 10px currentColor}
.prvr-bd-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.86rem;font-weight:800;text-align:right;letter-spacing:.5px}

/* Meta bar */
.prvr-meta-bar{display:flex;flex-wrap:wrap;gap:18px;padding:12px 22px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:14px}
.prvr-meta-item{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;color:rgba(255,255,255,.55);font-weight:500;letter-spacing:.3px}
.prvr-meta-item svg{color:rgba(255,255,255,.4)}

/* Summary */
.prvr-summary{padding:20px 24px;border-radius:14px;background:linear-gradient(135deg,rgba(238,167,39,.04),rgba(12,8,18,.5));border:1px solid rgba(238,167,39,.15);margin-bottom:18px}
.prvr-summary-head{display:flex;align-items:center;gap:8px;font-family:'Astro','Orbitron','DM Sans',sans-serif;color:#EEA727;font-size:.78rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px}
.prvr-summary-text{color:rgba(255,255,255,.85);font-size:.88rem;line-height:1.65;margin:0}

/* Tabs */
.prvr-tabs-wrap{border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);overflow:hidden}
.prvr-tabs{display:flex;background:linear-gradient(135deg,rgba(253,28,0,.04),transparent);border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;scrollbar-width:none}
.prvr-tabs::-webkit-scrollbar{display:none}
.prvr-tab{flex:1;min-width:120px;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 18px;background:transparent;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.4px;transition:all .2s;border-bottom:2px solid transparent;white-space:nowrap}
.prvr-tab:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.02)}
.prvr-tab.active{color:#fff;border-bottom-color:#fd1c00;background:rgba(253,28,0,.04)}
.prvr-tab-icon{display:flex;align-items:center}
.prvr-tab-icon svg{width:16px;height:16px}
.prvr-tab-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 7px;border-radius:10px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);font-size:.65rem;font-weight:700;letter-spacing:.3px}
.prvr-tab.active .prvr-tab-count{background:rgba(253,28,0,.2);color:#fd1c00}

.prvr-tab-content{padding:22px}

/* Item list */
.prvr-list{display:flex;flex-direction:column;gap:10px}
.prvr-item{display:flex;gap:12px;padding:14px 18px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:transform .2s}
.prvr-item:hover{transform:translateY(-1px);background:rgba(255,255,255,.03)}

.prvr-item-marker{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
.prvr-item-marker svg{width:16px;height:16px}
.prvr-marker-green{background:rgba(74,222,128,.15);color:#4ade80}
.prvr-marker-high{background:rgba(253,28,0,.15);color:#fd1c00}
.prvr-marker-medium{background:rgba(238,167,39,.15);color:#EEA727}
.prvr-marker-low{background:rgba(123,47,190,.15);color:#7B2FBE}

.prvr-item-body{flex:1;min-width:0}
.prvr-item-titlebar{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
.prvr-item-title{font-size:.85rem;font-weight:700;color:#fff;margin-bottom:4px;letter-spacing:.2px}
.prvr-sev-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:5px;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.58rem;font-weight:800;letter-spacing:1.2px}
.prvr-sev-badge-high{background:rgba(253,28,0,.15);color:#fd1c00}
.prvr-sev-badge-medium{background:rgba(238,167,39,.15);color:#EEA727}
.prvr-sev-badge-low{background:rgba(123,47,190,.15);color:#7B2FBE}
.prvr-file{font-family:'JetBrains Mono','Courier New',monospace;font-size:.7rem;color:rgba(255,255,255,.5);background:rgba(255,255,255,.04);padding:2px 8px;border-radius:4px;letter-spacing:.2px}
.prvr-area{font-size:.7rem;color:rgba(255,255,255,.55);font-style:italic}
.prvr-item-desc{font-size:.82rem;color:rgba(255,255,255,.78);line-height:1.55;margin-top:2px}
.prvr-item-fix{font-size:.78rem;color:rgba(74,222,128,.85);line-height:1.55;margin-top:6px;padding-top:6px;border-top:1px dashed rgba(255,255,255,.06)}
.prvr-item-fix strong{color:#4ade80}

/* Empty tab */
.prvr-empty{padding:40px 20px;text-align:center;color:rgba(255,255,255,.5);display:flex;flex-direction:column;align-items:center;gap:10px}
.prvr-empty-icon{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4)}
.prvr-empty-icon svg{width:22px;height:22px}
.prvr-empty-text{font-size:.82rem}

/* Tech validation */
.prvr-tech-wrap{display:flex;flex-direction:column;gap:14px}
.prvr-tech-banner{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;font-size:.82rem;font-weight:600;letter-spacing:.2px}
.prvr-tech-banner svg{width:18px;height:18px;flex-shrink:0}
.prvr-tech-match{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);color:#4ade80}
.prvr-tech-mismatch{background:rgba(238,167,39,.08);border:1px solid rgba(238,167,39,.25);color:#EEA727}
.prvr-tech-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.prvr-tech-col{padding:14px 16px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05)}
.prvr-tech-col-head{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.65rem;font-weight:800;color:rgba(255,255,255,.45);letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px}
.prvr-tech-tags{display:flex;flex-wrap:wrap;gap:6px}
.prvr-tech-tag{padding:4px 10px;border-radius:6px;font-size:.72rem;font-weight:600;letter-spacing:.2px}
.prvr-tech-claimed{background:rgba(238,167,39,.12);color:#EEA727;border:1px solid rgba(238,167,39,.25)}
.prvr-tech-actual{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
.prvr-tech-empty{font-size:.76rem;color:rgba(255,255,255,.35);font-style:italic}
.prvr-tech-notes{padding:12px 16px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);font-size:.78rem;color:rgba(255,255,255,.7);line-height:1.55}

/* Footer note */
.prvr-footer-note{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);font-size:.74rem;color:rgba(255,255,255,.5);margin-top:14px}
.prvr-footer-note svg{width:14px;height:14px;color:rgba(255,255,255,.4);flex-shrink:0}

/* Mobile */
@media(max-width:740px){
  .prvr-score-card{grid-template-columns:1fr;gap:20px;padding:22px}
  .prvr-bd-row{grid-template-columns:100px 1fr 32px;gap:10px}
  .prvr-tech-cols{grid-template-columns:1fr}
  .prvr-tab{min-width:90px;padding:12px 10px;font-size:.74rem}
}
`