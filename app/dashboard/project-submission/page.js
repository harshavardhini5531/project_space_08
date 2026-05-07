'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PROJECT_TYPES = ['Coding', 'Analytics', 'Electronics', 'Cloud', 'Enterprise Solutions']

const TECH_OPTIONS = [
  // Languages
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby',
  // Frontend
  'React', 'Next.js', 'Vue', 'Angular', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Flutter',
  // Backend
  'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', '.NET', 'Laravel',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Supabase', 'Firebase',
  // AI/ML
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Hugging Face', 'OpenAI', 'Google Gemini', 'Anthropic Claude', 'LangChain',
  // Cloud
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Vercel', 'Netlify',
  // Other
  'ServiceNow', 'Salesforce', 'VLSI', 'Verilog', 'Arduino', 'Raspberry Pi',
]

const LANGUAGE_OPTIONS = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'Other']

const GITHUB_PATTERN = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/i

export default function ProjectSubmissionPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState(null)
  const [showTechDropdown, setShowTechDropdown] = useState(false)
  const [techSearch, setTechSearch] = useState('')
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    github_url: '',
    requirements: '',
    problem_statement: '',
    proposed_solution: '',
    technologies_used: [],
    system_architecture: '',
    in_scope: '',
    out_scope: '',
    future_enhancements: '',
    conclusion: '',
    project_type: '',
    language: '',
  })
  const [docFile, setDocFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null')
    if (!u) { router.push('/login'); return }
    setUser(u)
    
    // Check leader status
    if (u.role !== 'leader' && !u.is_leader) {
      setErrorMsg('Only team leaders can submit projects.')
      setLoading(false)
      return
    }
    
    fetchExisting(u)
  }, [])

  async function fetchExisting(u) {
    try {
      const r = await fetch('/api/project-submission/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNumber: u.teamNumber || u.team_number }),
      })
      const d = await r.json()
      if (d.submitted) setExisting(d.submission)
      
      // Prefill from team_registrations if not yet submitted
      if (!d.submitted) {
        try {
          const reg = await fetch('/api/team/registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamNumber: u.teamNumber || u.team_number }),
          })
          const regData = await reg.json()
          if (regData?.registration) {
            setForm(prev => ({
              ...prev,
              name: regData.registration.project_title || '',
              description: regData.registration.project_description || '',
              problem_statement: regData.registration.problem_statement || '',
            }))
          }
        } catch {}
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrorMsg(null)
  }

  function toggleTech(tech) {
    setForm(prev => ({
      ...prev,
      technologies_used: prev.technologies_used.includes(tech)
        ? prev.technologies_used.filter(t => t !== tech)
        : [...prev.technologies_used, tech]
    }))
  }

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.docx')) {
      setErrorMsg('Only .docx files allowed')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large (max 10MB)')
      return
    }
    setDocFile(f)
    setErrorMsg(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.docx')) { setErrorMsg('Only .docx files allowed'); return }
    if (f.size > 10 * 1024 * 1024) { setErrorMsg('File too large (max 10MB)'); return }
    setDocFile(f)
    setErrorMsg(null)
  }

  // Validation state
  const githubValid = GITHUB_PATTERN.test(form.github_url.trim())
  const requiredFilled = form.name.trim() && form.description.trim() &&
    form.problem_statement.trim() && form.proposed_solution.trim() &&
    form.project_type && form.technologies_used.length > 0
  const canSubmit = requiredFilled && githubValid && docFile && !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setErrorMsg(null)
    
    try {
      const fd = new FormData()
      fd.append('document', docFile)
      fd.append('payload', JSON.stringify({
        team_number: user.teamNumber || user.team_number,
        team_leader_roll: user.roll_number || user.rollNumber,
        technology: user.technology,
        ...form,
        github_url: form.github_url.trim(),
        name: form.name.trim(),
      }))
      
      const r = await fetch('/api/project-submission/submit', { method: 'POST', body: fd })
      const d = await r.json()
      
      if (!r.ok) throw new Error(d.error || 'Submission failed')
      
      setSuccessMsg(d.message || 'Submitted successfully!')
      setTimeout(() => {
        router.push('/dashboard/project-reviews')
      }, 1500)
    } catch (e) {
      setErrorMsg(e.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="ps-load">Loading...</div>
  }

  // Already submitted view
  if (existing) {
    return (
      <div className="ps-wrap">
        <Styles/>
        <div className="ps-locked">
          <div className="ps-locked-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div className="ps-locked-t">Project Already Submitted</div>
          <div className="ps-locked-s">Your team has submitted the project documentation. Submissions are locked.</div>
          <div className="ps-locked-meta">
            <div className="ps-locked-meta-row">
              <span className="ps-locked-meta-l">Project</span>
              <span className="ps-locked-meta-v">{existing.name}</span>
            </div>
            <div className="ps-locked-meta-row">
              <span className="ps-locked-meta-l">Submitted</span>
              <span className="ps-locked-meta-v">{new Date(existing.submitted_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
            </div>
            <div className="ps-locked-meta-row">
              <span className="ps-locked-meta-l">Status</span>
              <span className={`ps-status-pill ${existing.status}`}>{existing.status.toUpperCase()}</span>
            </div>
            <div className="ps-locked-meta-row">
              <span className="ps-locked-meta-l">GitHub</span>
              <a href={existing.github_url} target="_blank" rel="noopener" className="ps-locked-link">{existing.github_url.replace('https://github.com/','')}</a>
            </div>
          </div>
          <button className="ps-btn-primary" onClick={() => router.push('/dashboard/project-reviews')}>View Reviews →</button>
        </div>
      </div>
    )
  }

  return (
    <div className="ps-wrap">
      <Styles/>

      <div className="ps-h">
        <div>
          <div className="ps-h-t">Project Documentation Submission</div>
          <div className="ps-h-s">Team {user?.teamNumber || user?.team_number} · Leader: {user?.name || user?.short_name}</div>
        </div>
        <div className="ps-progress">
          <span className={`ps-prog-step ${requiredFilled ? 'done' : 'pending'}`}>1. Form</span>
          <span className={`ps-prog-step ${docFile ? 'done' : 'pending'}`}>2. Document</span>
          <span className={`ps-prog-step ${githubValid ? 'done' : 'pending'}`}>3. GitHub</span>
        </div>
      </div>

      {/* Step 1: Download template */}
      <div className="ps-section">
        <div className="ps-section-h">
          <span className="ps-section-num">01</span>
          <span className="ps-section-t">Download Template</span>
        </div>
        <div className="ps-template-card">
          <div className="ps-template-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div className="ps-template-info">
            <div className="ps-template-t">Project Documentation Template</div>
            <div className="ps-template-d">Download the .docx template, fill in your project details, and upload it below.</div>
          </div>
          <a className="ps-btn-secondary" href="/templates/ProjectSpace_Documentation_Template.docx" download>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download
          </a>
        </div>
      </div>

      {/* Step 2: Fill form */}
      <div className="ps-section">
        <div className="ps-section-h">
          <span className="ps-section-num">02</span>
          <span className="ps-section-t">Project Details</span>
          <span className="ps-section-status">{requiredFilled ? '✓ Complete' : `${[form.name,form.description,form.problem_statement,form.proposed_solution,form.project_type,form.technologies_used.length>0?'1':''].filter(Boolean).length}/6 required`}</span>
        </div>
        <div className="ps-form">
          <Field label="Project Name" required>
            <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. CodeTalk — AI Interview Practice"/>
          </Field>

          <Field label="Description" required>
            <textarea rows={3} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Brief overview of what your project does..."/>
          </Field>

          <Field label="Problem Statement" required>
            <textarea rows={3} value={form.problem_statement} onChange={e => setField('problem_statement', e.target.value)} placeholder="What problem are you solving?"/>
          </Field>

          <Field label="Proposed Solution" required>
            <textarea rows={3} value={form.proposed_solution} onChange={e => setField('proposed_solution', e.target.value)} placeholder="How does your project solve the problem?"/>
          </Field>

          <Field label="Requirements">
            <textarea rows={2} value={form.requirements} onChange={e => setField('requirements', e.target.value)} placeholder="Functional and non-functional requirements"/>
          </Field>

          <div className="ps-form-row">
            <Field label="Project Type" required>
              <select value={form.project_type} onChange={e => setField('project_type', e.target.value)}>
                <option value="">Select type</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Primary Language">
              <select value={form.language} onChange={e => setField('language', e.target.value)}>
                <option value="">Select language</option>
                {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Technologies Used" required>
            <div className="ps-tech-trigger" onClick={() => setShowTechDropdown(true)}>
              {form.technologies_used.length === 0 ? (
                <span style={{ color: 'rgba(255,255,255,.4)' }}>Select technologies...</span>
              ) : (
                <div className="ps-tech-chips">
                  {form.technologies_used.map(t => (
                    <span key={t} className="ps-tech-chip">
                      {t}
                      <span className="ps-tech-chip-x" onClick={e => { e.stopPropagation(); toggleTech(t) }}>×</span>
                    </span>
                  ))}
                </div>
              )}
              <span className="ps-tech-arrow">▾</span>
            </div>

            {showTechDropdown && (
              <>
                <div className="ps-tech-backdrop" onClick={() => setShowTechDropdown(false)}/>
                <div className="ps-tech-dropdown">
                  <input
                    autoFocus
                    placeholder="Search technologies..."
                    value={techSearch}
                    onChange={e => setTechSearch(e.target.value)}
                    className="ps-tech-search"
                  />
                  <div className="ps-tech-list">
                    {TECH_OPTIONS.filter(t => t.toLowerCase().includes(techSearch.toLowerCase())).map(t => (
                      <label key={t} className={`ps-tech-opt ${form.technologies_used.includes(t) ? 'on' : ''}`}>
                        <input type="checkbox" checked={form.technologies_used.includes(t)} onChange={() => toggleTech(t)}/>
                        <span>{t}</span>
                      </label>
                    ))}
                  </div>
                  <div className="ps-tech-foot">
                    <span>{form.technologies_used.length} selected</span>
                    <button onClick={() => setShowTechDropdown(false)}>Done</button>
                  </div>
                </div>
              </>
            )}
          </Field>

          <Field label="System Architecture">
            <textarea rows={2} value={form.system_architecture} onChange={e => setField('system_architecture', e.target.value)} placeholder="e.g. User Browser → React UI → API → Database"/>
          </Field>

          <Field label="In Scope">
            <textarea rows={3} value={form.in_scope} onChange={e => setField('in_scope', e.target.value)} placeholder="What features are included in this project"/>
          </Field>

          <Field label="Out of Scope">
            <textarea rows={3} value={form.out_scope} onChange={e => setField('out_scope', e.target.value)} placeholder="What's intentionally excluded"/>
          </Field>

          <Field label="Future Enhancements">
            <textarea rows={3} value={form.future_enhancements} onChange={e => setField('future_enhancements', e.target.value)} placeholder="What could be added later"/>
          </Field>

          <Field label="Conclusion">
            <textarea rows={3} value={form.conclusion} onChange={e => setField('conclusion', e.target.value)} placeholder="Summary of project outcomes and impact"/>
          </Field>
        </div>
      </div>

      {/* Step 3: Upload doc */}
      <div className="ps-section">
        <div className="ps-section-h">
          <span className="ps-section-num">03</span>
          <span className="ps-section-t">Upload Documentation</span>
          <span className="ps-section-status">{docFile ? '✓ Uploaded' : 'Pending'}</span>
        </div>
        <div
          className={`ps-upload ${docFile ? 'has-file' : ''}`}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !docFile && fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFile} style={{ display: 'none' }}/>
          {docFile ? (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div className="ps-upload-name">{docFile.name}</div>
              <div className="ps-upload-size">{(docFile.size / 1024).toFixed(1)} KB</div>
              <button className="ps-upload-remove" onClick={e => { e.stopPropagation(); setDocFile(null); fileInputRef.current.value = '' }}>Remove</button>
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div className="ps-upload-t">Drop your .docx here or click to browse</div>
              <div className="ps-upload-s">Max 10 MB · Word document only</div>
            </>
          )}
        </div>
      </div>

      {/* Step 4: GitHub URL */}
      <div className="ps-section">
        <div className="ps-section-h">
          <span className="ps-section-num">04</span>
          <span className="ps-section-t">GitHub Repository</span>
          <span className="ps-section-status">{githubValid ? '✓ Valid' : form.github_url ? '✗ Invalid format' : 'Pending'}</span>
        </div>
        <Field label="Repository URL" required>
          <input
            type="url"
            value={form.github_url}
            onChange={e => setField('github_url', e.target.value)}
            placeholder="https://github.com/owner/repo"
            className={form.github_url && !githubValid ? 'invalid' : ''}
          />
          <div className="ps-help">Format: https://github.com/owner/repo</div>
        </Field>
      </div>

      {/* Submit */}
      {errorMsg && <div className="ps-toast err">{errorMsg}</div>}
      {successMsg && <div className="ps-toast ok">{successMsg}</div>}

      <div className="ps-submit">
        <div className="ps-submit-info">
          {!canSubmit && !submitting && (
            <div className="ps-submit-note">
              {!requiredFilled && '· Complete all required form fields '}
              {!docFile && '· Upload .docx document '}
              {!githubValid && '· Add valid GitHub URL '}
            </div>
          )}
        </div>
        <button className="ps-btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Submitting...' : 'Submit Project'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="ps-field">
      <label className="ps-field-l">
        {label}
        {required && <span className="ps-field-req">*</span>}
      </label>
      {children}
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .ps-load{padding:80px 20px;text-align:center;color:rgba(255,255,255,.3);font-family:'DM Sans',sans-serif}
      .ps-wrap{font-family:'DM Sans',sans-serif;color:#fff;padding:24px 20px;max-width:1100px;margin:0 auto;animation:psIn .4s ease both}
      @keyframes psIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

      .ps-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:14px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.06)}
      .ps-h-t{font-size:1.4rem;font-weight:700;letter-spacing:-.01em}
      .ps-h-s{font-size:.72rem;color:rgba(255,255,255,.45);margin-top:3px}
      .ps-progress{display:flex;gap:8px;flex-wrap:wrap}
      .ps-prog-step{padding:5px 11px;border-radius:7px;font-size:.65rem;font-weight:700;letter-spacing:.5px}
      .ps-prog-step.pending{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5)}
      .ps-prog-step.done{background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.3);color:#4ade80}

      .ps-section{margin-bottom:22px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:18px 20px}
      .ps-section-h{display:flex;align-items:center;gap:11px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.05)}
      .ps-section-num{font-family:'Orbitron','DM Sans',sans-serif;font-size:.65rem;font-weight:800;letter-spacing:1.5px;color:rgba(253,28,0,.7);background:rgba(253,28,0,.08);padding:3px 9px;border-radius:5px}
      .ps-section-t{font-size:.92rem;font-weight:700}
      .ps-section-status{margin-left:auto;font-size:.65rem;color:rgba(255,255,255,.45);font-weight:600}

      .ps-template-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(238,167,39,.04);border:1px solid rgba(238,167,39,.18);border-radius:11px}
      .ps-template-icon{width:54px;height:54px;border-radius:11px;background:rgba(238,167,39,.12);color:#EEA727;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .ps-template-info{flex:1}
      .ps-template-t{font-size:.85rem;font-weight:700;margin-bottom:2px}
      .ps-template-d{font-size:.66rem;color:rgba(255,255,255,.5);line-height:1.4}

      .ps-btn-primary{padding:10px 20px;border-radius:9px;background:linear-gradient(135deg,#fd1c00,#c41600);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 0 0 transparent}
      .ps-btn-primary:hover:not(:disabled){box-shadow:0 0 14px rgba(253,28,0,.4)}
      .ps-btn-primary:disabled{opacity:.4;cursor:not-allowed}
      .ps-btn-secondary{padding:8px 14px;border-radius:9px;background:rgba(238,167,39,.12);border:1px solid rgba(238,167,39,.3);color:#EEA727;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none;transition:all .15s}
      .ps-btn-secondary:hover{background:rgba(238,167,39,.2)}

      .ps-form{display:flex;flex-direction:column;gap:14px}
      .ps-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .ps-field{display:flex;flex-direction:column;gap:6px;position:relative}
      .ps-field-l{font-size:.62rem;letter-spacing:.5px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,.6)}
      .ps-field-req{color:#fd1c00;margin-left:3px}
      .ps-field input,.ps-field textarea,.ps-field select{padding:9px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;outline:none;transition:border-color .15s;resize:vertical;min-height:auto}
      .ps-field textarea{font-family:'DM Sans',sans-serif;line-height:1.5}
      .ps-field input:focus,.ps-field textarea:focus,.ps-field select:focus{border-color:rgba(253,28,0,.4)}
      .ps-field input.invalid{border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.04)}
      .ps-help{font-size:.6rem;color:rgba(255,255,255,.35);margin-top:2px}

      .ps-tech-trigger{padding:9px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:38px}
      .ps-tech-trigger:hover{border-color:rgba(255,255,255,.18)}
      .ps-tech-arrow{color:rgba(255,255,255,.4);font-size:.7rem}
      .ps-tech-chips{display:flex;flex-wrap:wrap;gap:5px;flex:1}
      .ps-tech-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:6px;background:rgba(253,28,0,.12);border:1px solid rgba(253,28,0,.3);color:#fd1c00;font-size:.65rem;font-weight:700}
      .ps-tech-chip-x{cursor:pointer;font-size:.85rem;line-height:1;opacity:.7}
      .ps-tech-chip-x:hover{opacity:1}

      .ps-tech-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998}
      .ps-tech-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:9999;background:#13101a;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);max-height:380px;display:flex;flex-direction:column}
      .ps-tech-search{padding:8px 11px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.75rem;outline:none;margin-bottom:8px}
      .ps-tech-list{flex:1;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px}
      .ps-tech-list::-webkit-scrollbar{width:6px}
      .ps-tech-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
      .ps-tech-opt{display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:.7rem;color:rgba(255,255,255,.7);transition:background .12s}
      .ps-tech-opt:hover{background:rgba(255,255,255,.05)}
      .ps-tech-opt.on{background:rgba(253,28,0,.1);color:#fd1c00;font-weight:600}
      .ps-tech-opt input{width:13px;height:13px;accent-color:#fd1c00}
      .ps-tech-foot{display:flex;justify-content:space-between;align-items:center;padding:8px 4px 2px;font-size:.65rem;color:rgba(255,255,255,.5)}
      .ps-tech-foot button{padding:5px 14px;border-radius:6px;background:rgba(253,28,0,.12);border:1px solid rgba(253,28,0,.3);color:#fd1c00;font-family:'DM Sans',sans-serif;font-size:.65rem;font-weight:700;cursor:pointer}

      .ps-upload{padding:32px 20px;border-radius:11px;background:rgba(255,255,255,.025);border:2px dashed rgba(255,255,255,.15);text-align:center;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:8px}
      .ps-upload:hover{border-color:rgba(253,28,0,.4);background:rgba(253,28,0,.03)}
      .ps-upload.has-file{border-style:solid;border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.04);cursor:default}
      .ps-upload-t{font-size:.78rem;font-weight:600;color:#fff;margin-top:6px}
      .ps-upload-s{font-size:.65rem;color:rgba(255,255,255,.4)}
      .ps-upload-name{font-size:.78rem;font-weight:700;color:#fff;margin-top:6px}
      .ps-upload-size{font-size:.62rem;color:rgba(255,255,255,.4)}
      .ps-upload-remove{margin-top:8px;padding:4px 11px;border-radius:6px;background:rgba(253,28,0,.12);border:1px solid rgba(253,28,0,.3);color:#fd1c00;font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:700;cursor:pointer}

      .ps-toast{padding:10px 14px;margin-bottom:14px;border-radius:9px;font-size:.72rem;font-weight:600}
      .ps-toast.err{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);color:#ff6040}
      .ps-toast.ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);color:#4ade80}

      .ps-submit{display:flex;align-items:center;justify-content:flex-end;gap:14px;padding:18px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:12px;flex-wrap:wrap}
      .ps-submit-info{flex:1}
      .ps-submit-note{font-size:.66rem;color:rgba(255,255,255,.45);line-height:1.6}

      /* Already submitted view */
      .ps-locked{max-width:520px;margin:60px auto;padding:32px;text-align:center;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);border-radius:14px}
      .ps-locked-icon{display:inline-flex;width:72px;height:72px;border-radius:18px;background:rgba(74,222,128,.1);color:#4ade80;align-items:center;justify-content:center;margin-bottom:14px}
      .ps-locked-t{font-size:1.05rem;font-weight:700;margin-bottom:5px}
      .ps-locked-s{font-size:.72rem;color:rgba(255,255,255,.5);margin-bottom:18px;line-height:1.5}
      .ps-locked-meta{display:flex;flex-direction:column;gap:9px;padding:14px 16px;background:rgba(0,0,0,.2);border-radius:10px;border:1px solid rgba(255,255,255,.05);margin-bottom:18px;text-align:left}
      .ps-locked-meta-row{display:flex;justify-content:space-between;align-items:center;font-size:.7rem;gap:12px}
      .ps-locked-meta-l{color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.5px;font-size:.55rem;font-weight:700}
      .ps-locked-meta-v{color:#fff;font-weight:600;text-align:right;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ps-locked-link{color:#EEA727;text-decoration:none;font-weight:600}
      .ps-status-pill{padding:3px 9px;border-radius:5px;font-size:.55rem;font-weight:700;letter-spacing:1px}
      .ps-status-pill.submitted{background:rgba(238,167,39,.12);color:#EEA727;border:1px solid rgba(238,167,39,.3)}
      .ps-status-pill.processing{background:rgba(59,130,246,.12);color:#3b82f6;border:1px solid rgba(59,130,246,.3)}
      .ps-status-pill.reviewed{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
      .ps-status-pill.failed{background:rgba(253,28,0,.12);color:#fd1c00;border:1px solid rgba(253,28,0,.3)}

      @media(max-width:780px){
        .ps-form-row{grid-template-columns:1fr}
        .ps-tech-list{grid-template-columns:1fr 1fr}
      }
      @media(max-width:560px){
        .ps-tech-list{grid-template-columns:1fr}
      }
    `}</style>
  )
}