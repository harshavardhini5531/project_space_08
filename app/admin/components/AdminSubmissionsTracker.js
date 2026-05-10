'use client'
import { useState, useEffect } from 'react'

export default function AdminSubmissionsTracker({ adminEmail }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/admin/uploads/all-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail })
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [adminEmail])

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)'}}>Loading submissions data…</div>
  if (!data) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)'}}>Failed to load. Check console.</div>

  const teams = data.teams || []
  const summary = data.summary || {}

  const filtered = teams.filter(t => {
    if (filter === 'full' && t.certs_percent !== 100) return false
    if (filter === 'partial' && (t.certs_percent === 0 || t.certs_percent === 100)) return false
    if (filter === 'none' && t.certs_percent !== 0) return false
    if (filter === 'has_ppt' && !t.has_ppt) return false
    if (filter === 'no_ppt' && t.has_ppt) return false
    if (search) {
      const q = search.toLowerCase()
      return (t.team_number||'').toLowerCase().includes(q) ||
             (t.project_title||'').toLowerCase().includes(q) ||
             (t.technology||'').toLowerCase().includes(q) ||
             (t.mentor_assigned||'').toLowerCase().includes(q)
    }
    return true
  })

  const styles = {
    wrap: { animation: 'fadeUp .4s ease both', fontFamily: 'DM Sans, sans-serif' },
    title: { fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 },
    sub: { fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginBottom: 18 },
    stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 18 },
    stat: { padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' },
    statV: { fontFamily: "'Orbitron',sans-serif", fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 },
    statL: { fontSize: '.55rem', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginTop: 6 },
    filters: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
    search: { flex: 1, minWidth: 200, padding: '9px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, color: '#fff', fontSize: '.78rem', outline: 'none', fontFamily: 'inherit' },
    pill: (on) => ({ padding: '7px 14px', borderRadius: 8, background: on ? 'rgba(253,28,0,.12)' : 'rgba(255,255,255,.03)', border: on ? '1px solid rgba(253,28,0,.3)' : '1px solid rgba(255,255,255,.06)', color: on ? '#fd1c00' : 'rgba(255,255,255,.55)', fontSize: '.7rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' },
    th: { textAlign: 'left', padding: '8px 12px', fontSize: '.55rem', fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '1.5px' },
    td: { padding: '11px 12px', background: 'rgba(255,255,255,.015)', fontSize: '.74rem', color: 'rgba(255,255,255,.7)' },
    bar: { width: 80, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.06)', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: 6 },
    barF: (pct) => ({ height: '100%', borderRadius: 3, background: pct === 100 ? '#4ade80' : pct > 50 ? '#EEA727' : '#fd1c00', width: `${pct}%` }),
    pillSm: (color, bg) => ({ fontSize: '.6rem', padding: '3px 8px', borderRadius: 5, fontWeight: 700, color, background: bg, display: 'inline-flex', alignItems: 'center', gap: 4 }),
    expRow: { padding: 14, background: 'rgba(0,0,0,.2)', borderRadius: 10, marginTop: 4, fontSize: '.72rem' },
    memTbl: { width: '100%', marginTop: 8, fontSize: '.7rem' },
  }

  function exportCSV() {
    const rows = [['Team', 'Project', 'Tech', 'Members', 'Certs Done', 'Certs %', 'PPT', 'Mentor']]
    filtered.forEach(t => {
      rows.push([t.team_number, t.project_title || '', t.technology || '', t.member_size, `${t.certs_uploaded}/${t.certs_total}`, `${t.certs_percent}%`, t.has_ppt ? 'Yes' : 'No', t.mentor_assigned || ''])
    })
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Submissions Tracker</div>
      <div style={styles.sub}>Track certificate &amp; PPT uploads across all teams</div>

      <div style={styles.stats}>
        <div style={styles.stat}><div style={{...styles.statV, color: '#fd1c00'}}>{summary.total_teams || 0}</div><div style={styles.statL}>Total Teams</div></div>
        <div style={styles.stat}><div style={{...styles.statV, color: '#4ade80'}}>{summary.teams_with_full_certs || 0}</div><div style={styles.statL}>Full Certs</div></div>
        <div style={styles.stat}><div style={{...styles.statV, color: '#EEA727'}}>{summary.teams_with_some_certs || 0}</div><div style={styles.statL}>Partial</div></div>
        <div style={styles.stat}><div style={{...styles.statV, color: '#ff6040'}}>{summary.teams_with_no_certs || 0}</div><div style={styles.statL}>No Certs</div></div>
        <div style={styles.stat}><div style={{...styles.statV, color: '#3b82f6'}}>{summary.teams_with_ppt || 0}</div><div style={styles.statL}>Have PPT</div></div>
        <div style={styles.stat}><div style={{...styles.statV, color: '#a78bfa'}}>{summary.teams_without_ppt || 0}</div><div style={styles.statL}>Missing PPT</div></div>
      </div>

      <div style={styles.filters}>
        <input style={styles.search} placeholder="Search team, project, tech, mentor…" value={search} onChange={e => setSearch(e.target.value)} />
        <button style={styles.pill(filter==='all')} onClick={()=>setFilter('all')}>All ({teams.length})</button>
        <button style={styles.pill(filter==='full')} onClick={()=>setFilter('full')}>Full Certs</button>
        <button style={styles.pill(filter==='partial')} onClick={()=>setFilter('partial')}>Partial</button>
        <button style={styles.pill(filter==='none')} onClick={()=>setFilter('none')}>No Certs</button>
        <button style={styles.pill(filter==='has_ppt')} onClick={()=>setFilter('has_ppt')}>Has PPT</button>
        <button style={styles.pill(filter==='no_ppt')} onClick={()=>setFilter('no_ppt')}>No PPT</button>
        <button style={{...styles.pill(false), background: 'rgba(74,222,128,.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,.3)', marginLeft: 'auto'}} onClick={exportCSV}>Export CSV</button>
      </div>

      <div style={{overflowX: 'auto'}}>
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Team</th><th style={styles.th}>Project</th><th style={styles.th}>Tech</th><th style={styles.th}>Members</th><th style={styles.th}>Certs</th><th style={styles.th}>PPT</th><th style={styles.th}>Mentor</th><th style={styles.th}></th></tr></thead>
          <tbody>
            {filtered.map(t => (
              <>
                <tr key={t.team_number}>
                  <td style={{...styles.td, fontWeight: 700, color: '#fd1c00'}}>{t.team_number}</td>
                  <td style={{...styles.td, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.project_title || '—'}</td>
                  <td style={{...styles.td, fontSize: '.66rem'}}>{t.technology || '—'}</td>
                  <td style={{...styles.td, textAlign: 'center'}}>{t.member_size}</td>
                  <td style={styles.td}>
                    <span style={styles.bar}><span style={styles.barF(t.certs_percent)}/></span>
                    <span style={{fontWeight: 700, color: t.certs_percent === 100 ? '#4ade80' : t.certs_percent > 0 ? '#EEA727' : '#fd1c00'}}>{t.certs_uploaded}/{t.certs_total}</span>
                  </td>
                  <td style={styles.td}>
                    {t.has_ppt
                      ? <span style={styles.pillSm('#4ade80', 'rgba(74,222,128,.08)')}>✓ Yes</span>
                      : <span style={styles.pillSm('#fd1c00', 'rgba(253,28,0,.08)')}>✗ No</span>}
                  </td>
                  <td style={{...styles.td, fontSize: '.66rem', color: 'rgba(255,255,255,.45)'}}>{t.mentor_assigned || '—'}</td>
                  <td style={styles.td}>
                    <button onClick={() => setExpanded(expanded === t.team_number ? null : t.team_number)} style={{background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '.7rem'}}>{expanded === t.team_number ? '▲' : '▼'}</button>
                  </td>
                </tr>
                {expanded === t.team_number && (
                  <tr><td colSpan={8} style={{padding: 0}}>
                    <div style={styles.expRow}>
                      <div style={{fontSize: '.62rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 8}}>Per-Member Breakdown</div>
                      <table style={styles.memTbl}>
                        <thead><tr><th style={{...styles.th, padding: '4px 8px'}}>Member</th><th style={{...styles.th, padding: '4px 8px'}}>Roll</th><th style={{...styles.th, padding: '4px 8px', textAlign: 'center'}}>Certs</th><th style={{...styles.th, padding: '4px 8px'}}>Done</th><th style={{...styles.th, padding: '4px 8px'}}>Missing</th></tr></thead>
                        <tbody>
                          {(t.members || []).map(m => {
                            const allTypes = ['agent_skills', 'api', 'mcp', 'code_in_action']
                            const missing = allTypes.filter(x => !(m.cert_types || []).includes(x))
                            return <tr key={m.roll_number}>
                              <td style={{padding: '4px 8px', color: m.is_leader ? '#fd1c00' : 'rgba(255,255,255,.7)', fontWeight: m.is_leader ? 700 : 500}}>{m.short_name}{m.is_leader ? ' ★' : ''}</td>
                              <td style={{padding: '4px 8px', fontSize: '.64rem', color: 'rgba(255,255,255,.5)'}}>{m.roll_number}</td>
                              <td style={{padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: m.certs_count === 4 ? '#4ade80' : m.certs_count > 0 ? '#EEA727' : '#fd1c00'}}>{m.certs_count}/4</td>
                              <td style={{padding: '4px 8px', fontSize: '.6rem', color: '#4ade80'}}>{(m.cert_types || []).join(', ') || '—'}</td>
                              <td style={{padding: '4px 8px', fontSize: '.6rem', color: '#fd1c00'}}>{missing.join(', ') || 'All done ✓'}</td>
                            </tr>
                          })}
                        </tbody>
                      </table>
                    </div>
                  </td></tr>
                )}
              </>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: '.78rem'}}>No teams match the filter</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}