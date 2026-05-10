'use client'
import { useState, useEffect } from 'react'

export default function MentorSubmissions({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!mentor?.email) return
    const token = sessionStorage.getItem('mentor_token') || ''
    fetch('/api/mentor/uploads/team-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mentor-token': token },
      body: JSON.stringify({ mentorEmail: mentor.email })
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(e => console.error('[MentorSubmissions]', e))
      .finally(() => setLoading(false))
  }, [mentor?.email])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)'}}>Loading…</div>
  if (!data) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)'}}>Failed to load. Check console.</div>

  const teams = data.teams || []
  const totalCerts = teams.reduce((s,t) => s + (t.certs?.uploaded||0), 0)
  const expectedCerts = teams.reduce((s,t) => s + (t.certs?.total||0), 0)
  const teamsWithPpt = teams.filter(t => t.ppt).length
  const fullTeams = teams.filter(t => t.certs?.percent === 100).length

  const filtered = teams.filter(t => {
    if (filter === 'full' && t.certs?.percent !== 100) return false
    if (filter === 'partial' && (t.certs?.percent === 0 || t.certs?.percent === 100)) return false
    if (filter === 'none' && t.certs?.percent !== 0) return false
    if (filter === 'has_ppt' && !t.ppt) return false
    if (filter === 'no_ppt' && t.ppt) return false
    if (search) {
      const q = search.toLowerCase()
      return (t.team_number||'').toLowerCase().includes(q) ||
             (t.project_title||'').toLowerCase().includes(q)
    }
    return true
  })

  const S = {
    wrap: { fontFamily: 'DM Sans,sans-serif', animation: 'fadeUp .4s ease both' },
    title: { fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 },
    sub: { fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginBottom: 18 },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 18 },
    stat: { padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' },
    statV: { fontFamily: "'Orbitron',sans-serif", fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 },
    statL: { fontSize: '.55rem', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginTop: 6 },
    filters: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    search: { flex: 1, minWidth: 200, padding: '9px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, color: '#fff', fontSize: '.78rem', outline: 'none', fontFamily: 'inherit' },
    pill: (on) => ({ padding: '7px 14px', borderRadius: 8, background: on ? 'rgba(253,28,0,.12)' : 'rgba(255,255,255,.03)', border: on ? '1px solid rgba(253,28,0,.3)' : '1px solid rgba(255,255,255,.06)', color: on ? '#fd1c00' : 'rgba(255,255,255,.55)', fontSize: '.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
    card: { padding: '14px 16px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 12, marginBottom: 8 },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    teamNum: { fontWeight: 700, color: '#fd1c00', fontSize: '.9rem' },
    projTitle: { color: 'rgba(255,255,255,.85)', fontSize: '.78rem', fontWeight: 600, marginTop: 3 },
    bar: { width: 100, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: 8 },
    barF: (pct) => ({ height: '100%', borderRadius: 3, background: pct === 100 ? '#4ade80' : pct > 50 ? '#EEA727' : '#fd1c00', width: `${pct}%` }),
    pillSm: (color, bg) => ({ fontSize: '.6rem', padding: '3px 8px', borderRadius: 5, fontWeight: 700, color, background: bg, display: 'inline-flex', alignItems: 'center', gap: 4 }),
    expand: { background: 'none', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: '.65rem', fontFamily: 'inherit' },
    memList: { marginTop: 12, padding: 12, background: 'rgba(0,0,0,.2)', borderRadius: 8 },
    memRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '.7rem', borderTop: '1px solid rgba(255,255,255,.04)' },
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>Submissions</div>
      <div style={S.sub}>Track certificate &amp; PPT uploads for your assigned teams</div>

      <div style={S.stats}>
        <div style={S.stat}><div style={{...S.statV,color:'#fd1c00'}}>{teams.length}</div><div style={S.statL}>My Teams</div></div>
        <div style={S.stat}><div style={{...S.statV,color:'#4ade80'}}>{fullTeams}</div><div style={S.statL}>Full Certs</div></div>
        <div style={S.stat}><div style={{...S.statV,color:'#EEA727'}}>{totalCerts}/{expectedCerts}</div><div style={S.statL}>Total Certs</div></div>
        <div style={S.stat}><div style={{...S.statV,color:'#3b82f6'}}>{teamsWithPpt}/{teams.length}</div><div style={S.statL}>Have PPT</div></div>
      </div>

      <div style={S.filters}>
        <input style={S.search} placeholder="Search team or project…" value={search} onChange={e=>setSearch(e.target.value)} />
        <button style={S.pill(filter==='all')} onClick={()=>setFilter('all')}>All ({teams.length})</button>
        <button style={S.pill(filter==='full')} onClick={()=>setFilter('full')}>Full Certs</button>
        <button style={S.pill(filter==='partial')} onClick={()=>setFilter('partial')}>Partial</button>
        <button style={S.pill(filter==='none')} onClick={()=>setFilter('none')}>No Certs</button>
        <button style={S.pill(filter==='has_ppt')} onClick={()=>setFilter('has_ppt')}>Has PPT</button>
        <button style={S.pill(filter==='no_ppt')} onClick={()=>setFilter('no_ppt')}>No PPT</button>
      </div>

      {filtered.length === 0 && <div style={{padding:30,textAlign:'center',color:'rgba(255,255,255,.3)',fontSize:'.78rem'}}>No teams match the filter.</div>}

      {filtered.map(t => (
        <div key={t.team_number} style={S.card}>
          <div style={S.cardTop}>
            <div>
              <div style={S.teamNum}>{t.team_number}</div>
              <div style={S.projTitle}>{t.project_title || '—'}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
              <span><span style={S.bar}><span style={S.barF(t.certs?.percent || 0)}/></span><span style={{fontWeight:700,fontSize:'.74rem',color:t.certs?.percent===100?'#4ade80':t.certs?.percent>0?'#EEA727':'#fd1c00'}}>{t.certs?.uploaded}/{t.certs?.total}</span></span>
              {t.ppt
                ? <span style={S.pillSm('#4ade80','rgba(74,222,128,.08)')}>✓ PPT</span>
                : <span style={S.pillSm('#fd1c00','rgba(253,28,0,.08)')}>✗ No PPT</span>}
              <button style={S.expand} onClick={()=>setExpanded(expanded===t.team_number?null:t.team_number)}>{expanded===t.team_number?'Hide ▲':'Details ▼'}</button>
            </div>
          </div>

          {expanded === t.team_number && (
            <div style={S.memList}>
              <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:1,fontWeight:700,marginBottom:6}}>Members ({t.member_size})</div>
              {(t.members || []).map(m => (
                <div key={m.roll_number} style={S.memRow}>
                  <span style={{color:m.is_leader?'#fd1c00':'rgba(255,255,255,.7)',fontWeight:m.is_leader?700:500}}>{m.short_name}{m.is_leader?' ★':''} <span style={{fontSize:'.6rem',color:'rgba(255,255,255,.4)',marginLeft:6}}>{m.roll_number}</span></span>
                  <span style={{fontWeight:700,color:m.uploaded===4?'#4ade80':m.uploaded>0?'#EEA727':'#fd1c00'}}>{m.uploaded}/4 {m.missing_types?.length>0?<span style={{fontSize:'.58rem',color:'rgba(255,255,255,.4)',marginLeft:6,fontWeight:500}}>missing: {m.missing_types.join(', ')}</span>:''}</span>
                </div>
              ))}
              {t.ppt && <div style={{marginTop:10,padding:'8px 10px',background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.18)',borderRadius:8,fontSize:'.7rem'}}>📎 PPT: <a href={t.ppt.url} target="_blank" rel="noopener noreferrer" style={{color:'#60a5fa',textDecoration:'none'}}>{t.ppt.file_name}</a> <span style={{color:'rgba(255,255,255,.4)',marginLeft:6}}>by {t.ppt.uploaded_by_name}</span></div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}