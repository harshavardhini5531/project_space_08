'use client'
import { useState, useEffect, useCallback } from 'react'

const FIELD_DEFS = [
  { key: 'name', section: 'basics', label: 'Project Title', min: 3, max: 200, type: 'text', placeholder: 'e.g., AI-Powered Code Review Assistant' },
  { key: 'github_url', section: 'basics', label: 'GitHub Repo URL', min: 0, max: 300, type: 'url', placeholder: 'https://github.com/username/repo (must be public)' },
  { key: 'description', section: 'basics', label: 'Project Description', min: 30, max: 2000, type: 'textarea', placeholder: 'Brief description of what your project does (~2-3 sentences)', rows: 3 },
  { key: 'problem_statement', section: 'problem', label: 'Problem Statement', min: 30, max: 2000, type: 'textarea', placeholder: 'What problem does your project solve? Who is affected?', rows: 4 },
  { key: 'proposed_solution', section: 'problem', label: 'Proposed Solution', min: 30, max: 2000, type: 'textarea', placeholder: 'How does your project solve the problem?', rows: 4 },
  { key: 'requirements', section: 'problem', label: 'Requirements', min: 30, max: 2000, type: 'textarea', placeholder: 'Functional & technical requirements', rows: 4 },
  { key: 'technologies_used', section: 'tech', label: 'Technologies Used', min: 1, max: 30, type: 'tags', placeholder: 'Type and press Enter (e.g., Next.js, Supabase, Tailwind)' },
  { key: 'system_architecture', section: 'tech', label: 'System Architecture', min: 30, max: 3000, type: 'textarea', placeholder: 'Describe how the components connect', rows: 5 },
  { key: 'in_scope', section: 'scope', label: 'In Scope', min: 20, max: 2000, type: 'textarea', placeholder: 'What features ARE included?', rows: 3 },
  { key: 'out_scope', section: 'scope', label: 'Out of Scope', min: 20, max: 2000, type: 'textarea', placeholder: 'What features are NOT included?', rows: 3 },
  { key: 'future_enhancements', section: 'future', label: 'Future Enhancements', min: 20, max: 2000, type: 'textarea', placeholder: 'What would you add next?', rows: 3 },
  { key: 'conclusion', section: 'future', label: 'Conclusion', min: 20, max: 2000, type: 'textarea', placeholder: 'Wrap-up: what did you achieve', rows: 3 },
]

const SECTIONS = [
  { id: 'basics', title: 'Basics' },
  { id: 'problem', title: 'Problem & Solution' },
  { id: 'tech', title: 'Technical' },
  { id: 'scope', title: 'Scope' },
  { id: 'future', title: 'Future & Conclusion' },
]

function emptyForm() {
  return {
    name:'',github_url:'',description:'',problem_statement:'',proposed_solution:'',
    requirements:'',technologies_used:[],system_architecture:'',in_scope:'',out_scope:'',
    future_enhancements:'',conclusion:'',
  }
}

export default function MentorProjectSubmission({ mentor }) {
  const draftKey = `mentor-proj-${mentor?.email || 'unknown'}`
  const [loading, setLoading] = useState(true)
  const [submission, setSubmission] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const d = localStorage.getItem(draftKey)
        if (d) return JSON.parse(d)
      } catch {}
    }
    return emptyForm()
  })

  // Load existing submission
  useEffect(() => {
    if (!mentor?.email) return
    fetch('/api/mentor/project-submission/my-report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorEmail: mentor.email })
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.submission) {
          setSubmission(d.submission)
          setFormData({
            name: d.submission.name || '',
            github_url: d.submission.github_url || '',
            description: d.submission.description || '',
            problem_statement: d.submission.problem_statement || '',
            proposed_solution: d.submission.proposed_solution || '',
            requirements: d.submission.requirements || '',
            technologies_used: d.submission.technologies_used || [],
            system_architecture: d.submission.system_architecture || '',
            in_scope: d.submission.in_scope || '',
            out_scope: d.submission.out_scope || '',
            future_enhancements: d.submission.future_enhancements || '',
            conclusion: d.submission.conclusion || '',
          })
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [mentor?.email])

  // Autosave draft
  useEffect(() => {
    if (loading || submission) return
    try { localStorage.setItem(draftKey, JSON.stringify(formData)) } catch {}
  }, [formData, loading, submission, draftKey])

  function updateField(key, value) {
    setFormData(p => ({ ...p, [key]: value }))
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t) return
    if (formData.technologies_used.includes(t)) { setTagInput(''); return }
    setFormData(p => ({ ...p, technologies_used: [...p.technologies_used, t] }))
    setTagInput('')
  }

  function removeTag(t) {
    setFormData(p => ({ ...p, technologies_used: p.technologies_used.filter(x => x !== t) }))
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitError(null); setSubmitSuccess(false)
    try {
      const r = await fetch('/api/mentor/project-submission/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorEmail: mentor.email, ...formData })
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setSubmitError(d.error || 'Submission failed')
        return
      }
      setSubmission(d.submission)
      setSubmitSuccess(true)
      try { localStorage.removeItem(draftKey) } catch {}
    } catch (e) {
      setSubmitError('Network error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'DM Sans,sans-serif'}}>Loading…</div>

  // ── Already submitted: show readonly view ──
  if (submission && !submission.admin_locked) {
    return (
      <div style={{fontFamily:'DM Sans,sans-serif',color:'#fff',paddingBottom:20}}>
        <div style={{padding:'14px 18px',borderRadius:13,background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.25)',marginBottom:14}}>
          <div style={{fontSize:'.95rem',fontWeight:700,color:'#4ade80',marginBottom:4}}>✓ Project submitted</div>
          <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.6)'}}>Submitted at {new Date(submission.submitted_at).toLocaleString('en-IN')}</div>
        </div>

        <div style={{padding:'16px 20px',borderRadius:13,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:14}}>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:6}}>Project Title</div>
          <div style={{fontSize:'1.1rem',fontWeight:800,marginBottom:14}}>{submission.name}</div>
          <a href={submission.github_url} target="_blank" rel="noopener noreferrer" style={{fontSize:'.78rem',color:'#60a5fa',textDecoration:'none'}}>{submission.github_url}</a>
        </div>

        {[
          ['description','Description'],['problem_statement','Problem Statement'],['proposed_solution','Proposed Solution'],
          ['requirements','Requirements'],['system_architecture','System Architecture'],
          ['in_scope','In Scope'],['out_scope','Out of Scope'],
          ['future_enhancements','Future Enhancements'],['conclusion','Conclusion'],
        ].map(([k,lbl]) => (
          <div key={k} style={{padding:'14px 18px',borderRadius:11,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)',marginBottom:10}}>
            <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:4}}>{lbl}</div>
            <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.85)',whiteSpace:'pre-wrap',lineHeight:1.6}}>{submission[k]}</div>
          </div>
        ))}

        <div style={{padding:'14px 18px',borderRadius:11,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.05)'}}>
          <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:6}}>Technologies</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {(submission.technologies_used || []).map(t => (
              <span key={t} style={{fontSize:'.7rem',padding:'4px 10px',borderRadius:6,background:'rgba(238,167,39,.1)',color:'#EEA727',fontWeight:600}}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Form view ──
  const S = {
    wrap: { fontFamily:'DM Sans,sans-serif', color:'#fff', paddingBottom:30 },
    title: { fontSize:'1.15rem', fontWeight:700, marginBottom:4 },
    sub: { fontSize:'.72rem', color:'rgba(255,255,255,.4)', marginBottom:18 },
    section: { padding:'16px 20px', borderRadius:13, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', marginBottom:14 },
    sectionH: { fontSize:'.78rem', fontWeight:700, marginBottom:14, color:'#EEA727' },
    field: { marginBottom:12 },
    label: { display:'block', fontSize:'.66rem', color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:1.1, fontWeight:700, marginBottom:6 },
    input: { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#fff', fontFamily:'inherit', fontSize:'.78rem', outline:'none', boxSizing:'border-box' },
    textarea: { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#fff', fontFamily:'inherit', fontSize:'.78rem', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.5 },
    counter: { fontSize:'.62rem', color:'rgba(255,255,255,.35)', marginTop:4, textAlign:'right' },
    counterBad: { color:'#fd1c00' },
    tag: { display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, background:'rgba(238,167,39,.1)', color:'#EEA727', fontSize:'.7rem', fontWeight:600, marginRight:6, marginBottom:6 },
    btn: { padding:'10px 22px', borderRadius:10, background:'linear-gradient(135deg,#fd1c00 0%,#ff5349 100%)', border:'none', color:'#fff', fontFamily:'inherit', fontSize:'.85rem', fontWeight:800, cursor:'pointer', boxShadow:'0 4px 12px rgba(253,28,0,.3)' },
    btnDis: { background:'rgba(255,255,255,.1)', cursor:'not-allowed', boxShadow:'none', color:'rgba(255,255,255,.4)' },
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>My Project Submission</div>
      <div style={S.sub}>Submit your project for AI review · {mentor?.name} · {mentor?.technology || '—'}</div>

      {submitSuccess && (
        <div style={{padding:'14px 18px',borderRadius:13,background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.3)',marginBottom:14,fontSize:'.78rem',color:'#4ade80',fontWeight:700}}>
          ✓ Project submitted successfully! It will be reviewed by AI shortly.
        </div>
      )}

      {submitError && (
        <div style={{padding:'14px 18px',borderRadius:13,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.3)',marginBottom:14,fontSize:'.78rem',color:'#fd1c00'}}>
          {submitError}
        </div>
      )}

      {SECTIONS.map(sec => (
        <div key={sec.id} style={S.section}>
          <div style={S.sectionH}>{sec.title}</div>
          {FIELD_DEFS.filter(f => f.section === sec.id).map(f => {
            const val = formData[f.key]
            const len = f.type === 'tags' ? (val || []).length : (val || '').length
            const tooShort = f.type !== 'tags' && len > 0 && len < f.min

            return (
              <div key={f.key} style={S.field}>
                <label style={S.label}>{f.label} {f.min > 0 && f.type !== 'tags' && <span style={{color:'rgba(255,255,255,.3)',fontWeight:500,marginLeft:6}}>min {f.min} chars</span>}</label>
                {f.type === 'text' || f.type === 'url' ? (
                  <input type={f.type} value={val} maxLength={f.max} placeholder={f.placeholder} onChange={e => updateField(f.key, e.target.value)} style={S.input}/>
                ) : f.type === 'textarea' ? (
                  <textarea value={val} maxLength={f.max} rows={f.rows || 3} placeholder={f.placeholder} onChange={e => updateField(f.key, e.target.value)} style={S.textarea}/>
                ) : f.type === 'tags' ? (
                  <div>
                    <div style={{display:'flex',flexWrap:'wrap',marginBottom:8}}>
                      {(val || []).map(t => (
                        <span key={t} style={S.tag}>
                          {t}
                          <button type="button" onClick={() => removeTag(t)} style={{background:'none',border:'none',color:'#EEA727',cursor:'pointer',fontSize:'.85rem',padding:0,lineHeight:1}}>×</button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      placeholder={f.placeholder}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                      onBlur={addTag}
                      style={S.input}
                    />
                  </div>
                ) : null}
                {f.type !== 'tags' && f.min > 0 && (
                  <div style={{...S.counter, ...(tooShort ? S.counterBad : {})}}>{len} / {f.max}{tooShort ? ` (need ${f.min - len} more)` : ''}</div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting} style={{...S.btn, ...(submitting ? S.btnDis : {})}}>
        {submitting ? 'Submitting…' : 'Submit Project for Review'}
      </button>
    </div>
  )
}