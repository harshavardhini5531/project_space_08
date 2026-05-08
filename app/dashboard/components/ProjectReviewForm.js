'use client'
import { useState, useEffect, useCallback } from 'react'

// Project Review Form
// Place at: app/dashboard/components/ProjectReviewForm.js
//
// 13-field form for team leaders to submit project for AI review.
// Features:
//   - Auto-saves draft to localStorage (per team_number)
//   - Inline validation with character counters
//   - Tag/chip input for technologies_used
//   - GitHub URL real-time validation feedback
//   - Submit POSTs to /api/project-review/submit

const FIELD_DEFS = [
  // Section 1: Basics
  { key: 'name',                section: 'basics',  label: 'Project Title',         min: 3,   max: 200,  type: 'text',     placeholder: 'e.g., CodeTalk Mock Interview Platform' },
  { key: 'github_url',          section: 'basics',  label: 'GitHub Repo URL',       min: 0,   max: 300,  type: 'url',      placeholder: 'https://github.com/username/repo (must be public)' },
  { key: 'description',         section: 'basics',  label: 'Project Description',   min: 30,  max: 2000, type: 'textarea', placeholder: 'Brief description of what your project does (~2-3 sentences)', rows: 3 },

  // Section 2: Problem & Solution
  { key: 'problem_statement',   section: 'problem', label: 'Problem Statement',     min: 30,  max: 2000, type: 'textarea', placeholder: 'What problem does your project solve? Who is affected?', rows: 4 },
  { key: 'proposed_solution',   section: 'problem', label: 'Proposed Solution',     min: 30,  max: 2000, type: 'textarea', placeholder: 'How does your project solve the problem?', rows: 4 },
  { key: 'requirements',        section: 'problem', label: 'Requirements',          min: 30,  max: 2000, type: 'textarea', placeholder: 'Functional & technical requirements', rows: 4 },

  // Section 3: Technical
  { key: 'technologies_used',   section: 'tech',    label: 'Technologies Used',     min: 1,   max: 30,   type: 'tags',     placeholder: 'Type and press Enter (e.g., Next.js, Supabase, Tailwind)' },
  { key: 'system_architecture', section: 'tech',    label: 'System Architecture',   min: 30,  max: 3000, type: 'textarea', placeholder: 'Describe how the components connect (frontend, backend, database, APIs)', rows: 5 },

  // Section 4: Scope
  { key: 'in_scope',            section: 'scope',   label: 'In Scope',              min: 20,  max: 2000, type: 'textarea', placeholder: 'What features ARE included in this project?', rows: 3 },
  { key: 'out_scope',           section: 'scope',   label: 'Out of Scope',          min: 20,  max: 2000, type: 'textarea', placeholder: 'What features are NOT included? (helps the AI calibrate expectations)', rows: 3 },

  // Section 5: Future & Conclusion
  { key: 'future_enhancements', section: 'future',  label: 'Future Enhancements',   min: 20,  max: 2000, type: 'textarea', placeholder: 'What would you add next if you had more time?', rows: 3 },
  { key: 'conclusion',          section: 'future',  label: 'Conclusion',            min: 20,  max: 2000, type: 'textarea', placeholder: 'Wrap-up: what did you achieve, key takeaways', rows: 3 },
]

const SECTIONS = [
  { id: 'basics',  title: 'Basics',                index: 1 },
  { id: 'problem', title: 'Problem & Solution',    index: 2 },
  { id: 'tech',    title: 'Technical',             index: 3 },
  { id: 'scope',   title: 'Scope',                 index: 4 },
  { id: 'future',  title: 'Future & Conclusion',   index: 5 },
]

export default function ProjectReviewForm({ user, teamInfo, existingSubmission, onSubmitted }) {
  const teamNumber = teamInfo?.team_number || 'unknown'
  const draftKey = `prv-draft-${teamNumber}`

  const [formData, setFormData] = useState(() => {
    // Try restore from localStorage first, then existingSubmission, then empty
    if (typeof window !== 'undefined') {
      try {
        const draft = localStorage.getItem(draftKey)
        if (draft) return JSON.parse(draft)
      } catch {}
    }
    if (existingSubmission) {
      return {
        name: existingSubmission.name || '',
        github_url: existingSubmission.github_url || '',
        description: existingSubmission.description || '',
        requirements: existingSubmission.requirements || '',
        problem_statement: existingSubmission.problem_statement || '',
        proposed_solution: existingSubmission.proposed_solution || '',
        technologies_used: existingSubmission.technologies_used || [],
        system_architecture: existingSubmission.system_architecture || '',
        in_scope: existingSubmission.in_scope || '',
        out_scope: existingSubmission.out_scope || '',
        future_enhancements: existingSubmission.future_enhancements || '',
        conclusion: existingSubmission.conclusion || '',
      }
    }
    return defaultEmptyForm()
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [techInput, setTechInput] = useState('')
  const [savedTime, setSavedTime] = useState(null)

  // Auto-save draft to localStorage on every change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData))
      setSavedTime(Date.now())
    } catch (e) {
      // Quota exceeded or other — silently ignore
    }
  }, [formData, draftKey])

  function defaultEmptyForm() {
    const empty = {}
    for (const f of FIELD_DEFS) {
      empty[f.key] = f.type === 'tags' ? [] : ''
    }
    return empty
  }

  // ─── Field updates ───
  const updateField = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // Clear error for this field as user types
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // Tag input — handle Enter, comma to add tag
  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTechTag()
    }
  }

  const addTechTag = () => {
    const t = techInput.trim().replace(/,$/, '').trim()
    if (!t) return
    if (formData.technologies_used.includes(t)) {
      setTechInput('')
      return
    }
    if (formData.technologies_used.length >= 30) {
      setFieldErrors((p) => ({ ...p, technologies_used: 'Maximum 30 technologies' }))
      return
    }
    updateField('technologies_used', [...formData.technologies_used, t])
    setTechInput('')
  }

  const removeTechTag = (tag) => {
    updateField(
      'technologies_used',
      formData.technologies_used.filter((t) => t !== tag)
    )
  }

  // ─── Validation ───
  function validate() {
    const errors = {}
    for (const f of FIELD_DEFS) {
      const v = formData[f.key]
      if (f.type === 'tags') {
        if (!Array.isArray(v) || v.length < f.min) {
          errors[f.key] = `Add at least ${f.min} ${f.label.toLowerCase()}`
        }
      } else {
        const trimmed = (v || '').trim()
        if (!trimmed) {
          errors[f.key] = `${f.label} is required`
        } else if (trimmed.length < f.min) {
          errors[f.key] = `Need at least ${f.min} characters (you have ${trimmed.length})`
        } else if (trimmed.length > f.max) {
          errors[f.key] = `Maximum ${f.max} characters`
        }
      }
    }
    // Github URL must look like github.com/x/y
    const gh = (formData.github_url || '').trim()
    if (gh && !/^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/i.test(gh)) {
      errors.github_url = 'Must be a github.com URL like https://github.com/username/repo'
    }
    return errors
  }

  // ─── Submit ───
  async function handleSubmit() {
    setSubmitError(null)
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // Scroll to first error
      setTimeout(() => {
        const firstErrKey = Object.keys(errors)[0]
        const el = document.querySelector(`[data-field="${firstErrKey}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }

    setSubmitting(true)
    try {
      const r = await fetch('/api/project-review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: user?.rollNumber || user?.roll_number,
          ...formData,
        }),
      })
      const d = await r.json()

      if (!d.ok) {
        // Server-side errors — map back to field errors if possible
        if (d.missingFields && Array.isArray(d.missingFields)) {
          const fe = {}
          for (const f of d.missingFields) fe[f] = 'This field is required'
          setFieldErrors(fe)
        } else if (d.tooShort && Array.isArray(d.tooShort)) {
          const fe = {}
          for (const t of d.tooShort) fe[t.field] = `Need at least ${t.min} chars (you have ${t.got})`
          setFieldErrors(fe)
        } else if (d.repoError) {
          setFieldErrors({ github_url: d.error })
        }
        setSubmitError(d.error || 'Submission failed')
        return
      }

      // Success!
      setSubmitSuccess(true)
      // Clear local draft (no longer needed)
      try { localStorage.removeItem(draftKey) } catch {}
      // Notify parent to refetch & switch view
      setTimeout(() => {
        if (onSubmitted) onSubmitted()
      }, 1500)
    } catch (e) {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ───
  if (submitSuccess) {
    return (
      <div className="prvf-success">
        <div className="prvf-success-icon">
          <CheckIcon />
        </div>
        <div className="prvf-success-title">Submitted Successfully!</div>
        <div className="prvf-success-msg">
          Your project has been queued for AI review. You'll receive an email when it's complete.
        </div>
      </div>
    )
  }

  const filledCount = countFilled(formData)
  const totalFields = FIELD_DEFS.length

  return (
    <div className="prvf-wrap">
      <style>{COMPONENT_STYLES}</style>

      {/* Top progress strip */}
      <div className="prvf-top-strip">
        <div className="prvf-top-info">
          <h2 className="prvf-top-title">Submit Project for AI Review</h2>
          <p className="prvf-top-sub">
            Fill all 13 fields. Our AI will analyze your code and generate a detailed report.
          </p>
        </div>
        <div className="prvf-top-progress">
          <div className="prvf-progress-bar">
            <div
              className="prvf-progress-fill"
              style={{ width: `${(filledCount / totalFields) * 100}%` }}
            />
          </div>
          <div className="prvf-progress-text">
            {filledCount}/{totalFields} filled
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((sec) => (
        <FormSection
          key={sec.id}
          section={sec}
          fields={FIELD_DEFS.filter((f) => f.section === sec.id)}
          formData={formData}
          fieldErrors={fieldErrors}
          updateField={updateField}
          techInput={techInput}
          setTechInput={setTechInput}
          handleTechKeyDown={handleTechKeyDown}
          addTechTag={addTechTag}
          removeTechTag={removeTechTag}
        />
      ))}

      {/* Submit error banner */}
      {submitError && (
        <div className="prvf-error-banner">
          <WarningIconSmall />
          <span>{submitError}</span>
        </div>
      )}

      {/* Footer with submit button */}
      <div className="prvf-footer">
        <div className="prvf-footer-left">
          {savedTime && (
            <span className="prvf-saved-hint">
              <SavedIcon /> Draft auto-saved
            </span>
          )}
        </div>
        <div className="prvf-footer-right">
          <button
            type="button"
            className="prvf-btn prvf-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <SpinnerIcon /> Submitting...
              </>
            ) : (
              <>Submit for Review →</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// FormSection — group of fields under one heading
// ─────────────────────────────────────────────────────────
function FormSection({
  section,
  fields,
  formData,
  fieldErrors,
  updateField,
  techInput,
  setTechInput,
  handleTechKeyDown,
  addTechTag,
  removeTechTag,
}) {
  return (
    <div className="prvf-section">
      <div className="prvf-section-head">
        <span className="prvf-section-num">{section.index}</span>
        <span className="prvf-section-title">{section.title}</span>
      </div>
      <div className="prvf-section-body">
        {fields.map((f) => (
          <FormField
            key={f.key}
            def={f}
            value={formData[f.key]}
            error={fieldErrors[f.key]}
            onChange={(v) => updateField(f.key, v)}
            techInput={techInput}
            setTechInput={setTechInput}
            handleTechKeyDown={handleTechKeyDown}
            addTechTag={addTechTag}
            removeTechTag={removeTechTag}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// FormField — single field
// ─────────────────────────────────────────────────────────
function FormField({ def, value, error, onChange, techInput, setTechInput, handleTechKeyDown, addTechTag, removeTechTag }) {
  const charCount = def.type === 'tags' ? (value?.length || 0) : (value?.length || 0)
  const showCounter = def.type !== 'tags' && def.min > 0

  return (
    <div className="prvf-field" data-field={def.key}>
      <div className="prvf-field-head">
        <label className="prvf-field-label">
          {def.label} <span className="prvf-required">*</span>
        </label>
        {showCounter && (
          <span className={`prvf-counter ${charCount < def.min ? 'too-low' : ''}`}>
            {charCount} / min {def.min}
          </span>
        )}
        {def.type === 'tags' && (
          <span className="prvf-counter">
            {charCount} {charCount === 1 ? 'tech' : 'techs'}
          </span>
        )}
      </div>

      {def.type === 'text' || def.type === 'url' ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          maxLength={def.max}
          className={`prvf-input ${error ? 'has-error' : ''}`}
        />
      ) : def.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          maxLength={def.max}
          rows={def.rows || 3}
          className={`prvf-textarea ${error ? 'has-error' : ''}`}
        />
      ) : def.type === 'tags' ? (
        <div className={`prvf-tags-wrap ${error ? 'has-error' : ''}`}>
          {(value || []).map((tag) => (
            <span key={tag} className="prvf-tag">
              {tag}
              <button
                type="button"
                className="prvf-tag-x"
                onClick={() => removeTechTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            onBlur={addTechTag}
            placeholder={(value || []).length === 0 ? def.placeholder : 'Add another...'}
            className="prvf-tag-input"
          />
        </div>
      ) : null}

      {error && <div className="prvf-field-error">{error}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function countFilled(data) {
  let count = 0
  for (const f of FIELD_DEFS) {
    const v = data[f.key]
    if (f.type === 'tags') {
      if (Array.isArray(v) && v.length >= f.min) count += 1
    } else {
      if ((v || '').trim().length >= f.min) count += 1
    }
  }
  return count
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
function WarningIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function SavedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="prvf-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────
const COMPONENT_STYLES = `
.prvf-wrap{font-family:'DM Sans',sans-serif;animation:prvfIn .4s ease both}
@keyframes prvfIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* Top strip */
.prvf-top-strip{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 24px;border-radius:14px;background:linear-gradient(135deg,rgba(253,28,0,.08),rgba(238,167,39,.04));border:1px solid rgba(253,28,0,.2);margin-bottom:18px;flex-wrap:wrap}
.prvf-top-info{flex:1;min-width:200px}
.prvf-top-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 4px 0}
.prvf-top-sub{color:rgba(255,255,255,.55);font-size:.78rem;margin:0}
.prvf-top-progress{display:flex;flex-direction:column;gap:6px;min-width:180px}
.prvf-progress-bar{height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.prvf-progress-fill{height:100%;background:linear-gradient(90deg,#fd1c00,#EEA727);transition:width .35s ease;border-radius:4px;box-shadow:0 0 12px rgba(253,28,0,.4)}
.prvf-progress-text{font-size:.7rem;color:rgba(255,255,255,.5);text-align:right;font-weight:600;letter-spacing:.5px}

/* Section card */
.prvf-section{border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);margin-bottom:14px;overflow:hidden}
.prvf-section-head{display:flex;align-items:center;gap:12px;padding:16px 22px;background:linear-gradient(135deg,rgba(253,28,0,.04),transparent);border-bottom:1px solid rgba(255,255,255,.05)}
.prvf-section-num{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#fd1c00,#EEA727);color:#fff;font-family:'Astro','Orbitron','DM Sans',sans-serif;font-weight:800;font-size:.78rem;display:flex;align-items:center;justify-content:center;letter-spacing:.5px;flex-shrink:0}
.prvf-section-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;color:#fff;font-size:.85rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
.prvf-section-body{padding:18px 22px;display:flex;flex-direction:column;gap:18px}

/* Field */
.prvf-field{display:flex;flex-direction:column;gap:6px;scroll-margin-top:80px}
.prvf-field-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.prvf-field-label{font-size:.78rem;color:rgba(255,255,255,.85);font-weight:600;letter-spacing:.3px}
.prvf-required{color:#fd1c00}
.prvf-counter{font-size:.65rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.4px}
.prvf-counter.too-low{color:#EEA727}

.prvf-input,.prvf-textarea{width:100%;padding:11px 14px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.85rem;line-height:1.5;transition:all .2s;box-sizing:border-box}
.prvf-input:focus,.prvf-textarea:focus{outline:none;border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.03);box-shadow:0 0 0 3px rgba(253,28,0,.08)}
.prvf-input.has-error,.prvf-textarea.has-error{border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.04)}
.prvf-input::placeholder,.prvf-textarea::placeholder{color:rgba(255,255,255,.25)}
.prvf-textarea{resize:vertical;min-height:80px;font-family:'DM Sans',sans-serif}

/* Tag input */
.prvf-tags-wrap{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 12px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);min-height:46px;transition:all .2s}
.prvf-tags-wrap:focus-within{border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.03);box-shadow:0 0 0 3px rgba(253,28,0,.08)}
.prvf-tags-wrap.has-error{border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.04)}
.prvf-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;background:linear-gradient(135deg,rgba(238,167,39,.15),rgba(253,28,0,.1));border:1px solid rgba(238,167,39,.3);color:#EEA727;font-size:.75rem;font-weight:600;letter-spacing:.2px}
.prvf-tag-x{background:transparent;border:none;color:#EEA727;cursor:pointer;font-size:1rem;line-height:1;padding:0;font-weight:700;opacity:.7;transition:opacity .2s}
.prvf-tag-x:hover{opacity:1}
.prvf-tag-input{flex:1;min-width:120px;background:transparent;border:none;color:#fff;font-size:.85rem;outline:none;font-family:'DM Sans',sans-serif;padding:4px 0}
.prvf-tag-input::placeholder{color:rgba(255,255,255,.25)}

.prvf-field-error{font-size:.7rem;color:#fd1c00;font-weight:500;display:flex;align-items:center;gap:4px;letter-spacing:.2px}

/* Error banner */
.prvf-error-banner{display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:10px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.25);color:#fd1c00;font-size:.82rem;font-weight:500;margin-bottom:14px}

/* Footer */
.prvf-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 22px;border-radius:14px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);flex-wrap:wrap;margin-top:14px}
.prvf-footer-left{display:flex;align-items:center;gap:8px}
.prvf-saved-hint{display:inline-flex;align-items:center;gap:6px;font-size:.72rem;color:rgba(74,222,128,.7);font-weight:500;letter-spacing:.2px}
.prvf-saved-hint svg{color:#4ade80}
.prvf-footer-right{display:flex;gap:10px}
.prvf-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;letter-spacing:.4px;cursor:pointer;border:none;transition:all .2s}
.prvf-btn-primary{background:#fd1c00;color:#fff;min-width:200px;justify-content:center}
.prvf-btn-primary:hover:not(:disabled){background:#e51800;transform:translateY(-1px);box-shadow:0 6px 20px rgba(253,28,0,.35)}
.prvf-btn-primary:disabled{opacity:.6;cursor:not-allowed}

.prvf-spin{animation:prvfSpin 1s linear infinite}
@keyframes prvfSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* Success state */
.prvf-success{padding:60px 32px;border-radius:14px;background:linear-gradient(135deg,rgba(74,222,128,.06),rgba(12,8,18,.5));border:1px solid rgba(74,222,128,.25);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;animation:prvfIn .5s ease both}
.prvf-success-icon{width:64px;height:64px;border-radius:16px;background:rgba(74,222,128,.12);display:flex;align-items:center;justify-content:center;color:#4ade80}
.prvf-success-icon svg{width:32px;height:32px}
.prvf-success-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;color:#4ade80;font-size:1.1rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
.prvf-success-msg{color:rgba(255,255,255,.7);font-size:.85rem;max-width:480px;line-height:1.6}

/* Mobile */
@media(max-width:640px){
  .prvf-top-strip{padding:16px}
  .prvf-section-body{padding:14px 16px}
  .prvf-footer{padding:14px 16px}
  .prvf-btn-primary{min-width:0;width:100%}
}
`