'use client'
import { useState, useEffect } from 'react'

export default function AdminMentorSubmissions({ adminEmail }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/admin/mentor-submissions/list', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail })
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.submissions || []) })
      .finally(() => setLoading(false))
  }, [adminEmail])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'DM Sans,sans-serif'}}>Loading mentor submissions…</div>

  const techOptions = Array.from(new Set(data.map(s => s.technology).filter(Boolean))).sort()

  const filtered = data.filter(s => {
    if (techFilter !== 'all' && s.technology !== techFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (s.mentor_name || '').toLowerCase().includes(q) ||
             (s.mentor_email || '').toLowerCase().includes(q) ||
             (s.name || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',color:'#fff',paddingBottom:20}}>
      <div style={{fontSize:'1.15rem',fontWeight:700,marginBottom:4}}>Mentor Project Submissions</div>
      <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.4)',marginBottom:18}}>{data.length} mentors submitted · {data.filter(s => s.dev_api_id).length} synced to AI review</div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}>
        <div style={{padding:'14px 16px',borderRadius:11,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:7}}>Total submissions</div>
          <div style={{fontFamily:"'Orbitron','DM Sans',sans-serif",fontSize:'1.6rem',fontWeight:800,color:'#fd1c00'}}>{data.length}</div>
        </div>
        <div style={{padding:'14px 16px',borderRadius:11,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:7}}>Synced to AI</div>
          <div style={{fontFamily:"'Orbitron','DM Sans',sans-serif",fontSize:'1.6rem',fontWeight:800,color:'#4ade80'}}>{data.filter(s => s.dev_api_id).length}</div>
        </div>
        <div style={{padding:'14px 16px',borderRadius:11,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:7}}>Pending sync</div>
          <div style={{fontFamily:"'Orbitron','DM Sans',sans-serif",fontSize:'1.6rem',fontWeight:800,color:'#EEA727'}}>{data.filter(s => !s.dev_api_id).length}</div>
        </div>
      </div>

      <div style={{padding:'14px 20px',borderRadius:13,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:14,display:'flex',gap:10,flexWrap:'wrap'}}>
        <input type="text" placeholder="Search mentor name, email, project…" value={search} onChange={e => setSearch(e.target.value)} style={{flex:1,minWidth:200,padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.75rem',outline:'none'}}/>
        <select value={techFilter} onChange={e => setTechFilter(e.target.value)} style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.75rem',outline:'none'}}>
          <option value="all" style={{background:'#13101a'}}>All technologies</option>
          {techOptions.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontSize:'.85rem'}}>No mentor submissions yet.</div>
      ) : (
        filtered.map(s => (
          <div key={s.id} style={{padding:'16px 20px',borderRadius:13,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
              <div style={{flex:1,minWidth:240}}>
                <div style={{fontSize:'.95rem',fontWeight:700,marginBottom:4}}>{s.name}</div>
                <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.6)'}}>{s.mentor_name} · {s.mentor_email}</div>
                <div style={{fontSize:'.66rem',color:'rgba(255,255,255,.4)',marginTop:3}}>{s.technology || '—'} · Submitted {new Date(s.submitted_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {s.dev_api_id
                  ? <span style={{fontSize:'.62rem',padding:'4px 10px',borderRadius:6,background:'rgba(74,222,128,.1)',color:'#4ade80',fontWeight:700}}>✓ AI-Synced</span>
                  : <span style={{fontSize:'.62rem',padding:'4px 10px',borderRadius:6,background:'rgba(238,167,39,.1)',color:'#EEA727',fontWeight:700}}>⏳ Pending</span>}
                <a href={s.github_url} target="_blank" rel="noopener noreferrer" style={{fontSize:'.7rem',padding:'5px 12px',borderRadius:7,background:'rgba(96,165,250,.1)',color:'#60a5fa',textDecoration:'none',fontWeight:600}}>GitHub ↗</a>
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} style={{padding:'5px 12px',borderRadius:7,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.7rem',fontWeight:600,cursor:'pointer'}}>{expanded === s.id ? 'Hide ▲' : 'Details ▼'}</button>
              </div>
            </div>

            {expanded === s.id && (
              <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid rgba(255,255,255,.06)'}}>
                {[
                  ['description','Description'],['problem_statement','Problem Statement'],['proposed_solution','Proposed Solution'],
                  ['requirements','Requirements'],['system_architecture','System Architecture'],
                  ['in_scope','In Scope'],['out_scope','Out of Scope'],
                  ['future_enhancements','Future Enhancements'],['conclusion','Conclusion'],
                ].map(([k,lbl]) => (
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:4}}>{lbl}</div>
                    <div style={{fontSize:'.74rem',color:'rgba(255,255,255,.8)',whiteSpace:'pre-wrap',lineHeight:1.5}}>{s[k]}</div>
                  </div>
                ))}
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:4}}>Technologies</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {(s.technologies_used || []).map(t => (
                      <span key={t} style={{fontSize:'.66rem',padding:'3px 9px',borderRadius:5,background:'rgba(238,167,39,.1)',color:'#EEA727',fontWeight:600}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}