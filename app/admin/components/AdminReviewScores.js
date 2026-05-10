'use client'
import { useState, useEffect, useMemo } from 'react'

export default function AdminReviewScores({ adminEmail }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score-desc')

  async function fetchScores() {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/review-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setError(d.error || 'Request failed')
        return
      }
      setData(d)
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchScores() }, [adminEmail])

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let list = data.teams
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      list = list.filter(t =>
        (t.team_number || '').toLowerCase().includes(s) ||
        (t.project_title || '').toLowerCase().includes(s)
      )
    }
    if (techFilter !== 'all') list = list.filter(t => t.technology === techFilter)
    const sorted = [...list]
    if (sortBy === 'score-desc') sorted.sort((a, b) => (b.latest_score ?? -1) - (a.latest_score ?? -1))
    else if (sortBy === 'score-asc') sorted.sort((a, b) => (a.latest_score ?? 999) - (b.latest_score ?? 999))
    else if (sortBy === 'delta-desc') sorted.sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))
    else if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.last_run_at || 0) - new Date(a.last_run_at || 0))
    return sorted
  }, [data, search, techFilter, sortBy])

  const techOptions = useMemo(() => {
    if (!data?.teams) return []
    return Array.from(new Set(data.teams.map(t => t.technology).filter(Boolean))).sort()
  }, [data])

  function scoreColor(s) {
    if (s == null) return 'rgba(255,255,255,.4)'
    if (s >= 80) return '#4ade80'
    if (s >= 60) return '#EEA727'
    if (s >= 40) return '#ff5349'
    return '#fd1c00'
  }

  function deltaColor(d) {
    if (d == null) return 'rgba(255,255,255,.4)'
    if (d > 0) return '#4ade80'
    if (d < 0) return '#fd1c00'
    return 'rgba(255,255,255,.5)'
  }

  function exportCSV() {
    if (!filteredTeams.length) return
    const headers = ['Team','Project','Technology','Latest Score','Delta','Runs','Last Run','Mentor Eval Avg']
    const rows = filteredTeams.map(t => [
      t.team_number,
      '"' + (t.project_title || '').replace(/"/g, '""') + '"',
      t.technology,
      t.latest_score ?? '',
      t.delta ?? '',
      t.total_runs ?? '',
      t.last_run_at ? new Date(t.last_run_at).toLocaleDateString('en-IN') : '',
      t.mentor_eval_avg ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'review_scores_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'DM Sans,sans-serif',fontSize:'.85rem'}}>Loading review scores…</div>

  if (error) return (
    <div style={{padding:24,borderRadius:14,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.25)',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{fontWeight:700,fontSize:'.95rem',color:'#fd1c00',marginBottom:6}}>Could not load scores</div>
      <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.7)',marginBottom:10}}>{error}</div>
      <button onClick={fetchScores} style={{padding:'5px 12px',borderRadius:7,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.7rem',fontWeight:600,cursor:'pointer'}}>Retry</button>
    </div>
  )

  const stats = data?.stats || {}
  const distribution = data?.distribution || {}
  const techAvg = data?.tech_avg || []
  const distBuckets = ['0-20','21-40','41-60','61-80','81-100']
  const distColors = ['#fd1c00','#ff5349','#EEA727','#a3e635','#4ade80']
  const maxDist = Math.max(...distBuckets.map(b => distribution[b] || 0), 1)
  const kpiCard = {padding:'14px 16px',borderRadius:11,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)'}
  const kpiL = {fontSize:'.62rem',color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1.1,fontWeight:700,marginBottom:7}
  const kpiV = {fontFamily:"'Orbitron','DM Sans',sans-serif",fontSize:'1.6rem',fontWeight:800,lineHeight:1}
  const kpiSub = {fontSize:'.62rem',color:'rgba(255,255,255,.4)',marginTop:5}
  const card = {padding:'16px 20px',borderRadius:13,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',marginBottom:14}
  const th = {textAlign:'left',padding:'9px 12px',fontSize:'.58rem',fontWeight:700,color:'rgba(255,255,255,.5)',textTransform:'uppercase',letterSpacing:1.1}
  const td = {padding:'10px 12px',background:'rgba(255,255,255,.02)'}

  return (
    <div style={{fontFamily:'DM Sans,sans-serif',color:'#fff',paddingBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:'1.15rem',fontWeight:700}}>Project review scores</div>
          <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.45)',marginTop:3}}>{stats.total_teams_with_reviews} of {stats.total_teams} teams reviewed · {stats.total_runs} total runs</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={fetchScores} style={{padding:'7px 14px',borderRadius:8,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.7rem',fontWeight:600,cursor:'pointer'}}>↻ Refresh</button>
          <button onClick={exportCSV} style={{padding:'7px 14px',borderRadius:8,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.7rem',fontWeight:600,cursor:'pointer'}}>↓ Export CSV</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}>
        <div style={kpiCard}>
          <div style={kpiL}>Teams reviewed</div>
          <div style={kpiV}>{stats.total_teams_with_reviews || 0}<span style={{fontSize:'.85rem',color:'rgba(255,255,255,.4)',fontWeight:600}}> / {stats.total_teams || 0}</span></div>
          <div style={kpiSub}>{stats.total_teams > 0 ? Math.round((stats.total_teams_with_reviews / stats.total_teams) * 100) : 0}% coverage</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiL}>Avg score</div>
          <div style={{...kpiV,color:scoreColor(stats.avg_score)}}>{stats.avg_score || 0}<span style={{fontSize:'.85rem',color:'rgba(255,255,255,.4)',fontWeight:600}}> / 100</span></div>
          <div style={kpiSub}>across {stats.total_teams_with_reviews || 0} teams</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiL}>Total runs</div>
          <div style={kpiV}>{stats.total_runs || 0}</div>
          <div style={kpiSub}>{stats.total_teams_with_reviews > 0 ? (stats.total_runs / stats.total_teams_with_reviews).toFixed(1) : 0} avg per team</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiL}>Improving</div>
          <div style={{...kpiV,color:'#4ade80'}}>{stats.improving || 0}</div>
          <div style={kpiSub}>vs {stats.declining || 0} declining</div>
        </div>
      </div>

      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,fontSize:'.85rem',fontWeight:700}}>
          <div>Score distribution</div>
          <span style={{fontSize:'.62rem',color:'rgba(255,255,255,.4)',fontWeight:500}}>{stats.total_teams_with_reviews} teams</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end',height:120,padding:'8px 0'}}>
          {distBuckets.map((b, i) => {
            const value = distribution[b] || 0
            const heightPct = (value / maxDist) * 100
            return (
              <div key={b} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:'.7rem',fontWeight:700,color:'rgba(255,255,255,.85)'}}>{value}</div>
                <div style={{width:'100%',height:`${heightPct}%`,minHeight:value > 0 ? 6 : 0,background:distColors[i],borderRadius:'4px 4px 0 0'}}/>
                <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.5)'}}>{b}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={card}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input type="text" placeholder="Search team or project…" value={search} onChange={e => setSearch(e.target.value)} style={{flex:1,minWidth:200,padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.75rem',outline:'none'}}/>
          <select value={techFilter} onChange={e => setTechFilter(e.target.value)} style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.75rem',outline:'none'}}>
            <option value="all" style={{background:'#13101a'}}>All technologies</option>
            {techOptions.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{padding:'8px 12px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontFamily:'inherit',fontSize:'.75rem',outline:'none'}}>
            <option value="score-desc" style={{background:'#13101a'}}>Score (high → low)</option>
            <option value="score-asc" style={{background:'#13101a'}}>Score (low → high)</option>
            <option value="delta-desc" style={{background:'#13101a'}}>Δ (most improved)</option>
            <option value="recent" style={{background:'#13101a'}}>Most recent run</option>
          </select>
        </div>
      </div>

      <div style={{borderRadius:13,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',overflow:'hidden',marginBottom:14}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 4px',fontSize:'.74rem'}}>
            <thead>
              <tr>
                <th style={th}>Team</th>
                <th style={th}>Project</th>
                <th style={th}>Tech</th>
                <th style={{...th,textAlign:'right'}}>Score</th>
                <th style={{...th,textAlign:'right'}}>Δ</th>
                <th style={{...th,textAlign:'right'}}>Runs</th>
                <th style={{...th,textAlign:'right'}}>Mentor</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.slice(0, 200).map(t => (
                <tr key={t.team_number}>
                  <td style={{...td,color:'#fd1c00',fontWeight:800}}>{t.team_number}</td>
                  <td style={{...td,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'rgba(255,255,255,.85)'}}>{t.project_title || '—'}</td>
                  <td style={{...td,color:'rgba(255,255,255,.6)',fontSize:'.7rem'}}>{t.technology || '—'}</td>
                  <td style={{...td,textAlign:'right',fontWeight:800,color:scoreColor(t.latest_score)}}>{t.latest_score ?? '—'}</td>
                  <td style={{...td,textAlign:'right',fontWeight:700,fontSize:'.7rem',color:deltaColor(t.delta)}}>{t.delta == null ? '—' : (t.delta > 0 ? '+' : '') + t.delta}</td>
                  <td style={{...td,textAlign:'right',color:'rgba(255,255,255,.6)'}}>{t.total_runs ?? 0}</td>
                  <td style={{...td,textAlign:'right',color:'rgba(255,255,255,.75)',fontSize:'.7rem'}}>{t.mentor_eval_avg != null ? `${t.mentor_eval_avg} / 10` : '—'}</td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:'center',padding:24,color:'rgba(255,255,255,.4)',fontSize:'.78rem'}}>No teams match filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredTeams.length > 0 && (
          <div style={{padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,.05)',fontSize:'.65rem',color:'rgba(255,255,255,.4)',textAlign:'center'}}>
            Showing {Math.min(200, filteredTeams.length)} of {filteredTeams.length}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{marginBottom:12,fontSize:'.85rem',fontWeight:700}}>Average score by technology</div>
        <div>
          {techAvg.map(t => (
            <div key={t.technology} style={{display:'grid',gridTemplateColumns:'140px 1fr 50px 80px',gap:10,alignItems:'center',marginBottom:9}}>
              <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.85)'}}>{t.technology}</div>
              <div style={{background:'rgba(255,255,255,.04)',height:8,borderRadius:999,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:999,background:scoreColor(t.avg),width:`${Math.max(0,Math.min(100,t.avg))}%`}}/>
              </div>
              <div style={{textAlign:'right',fontWeight:800,fontSize:'.85rem',color:scoreColor(t.avg)}}>{t.avg}</div>
              <div style={{textAlign:'right',fontSize:'.65rem',color:'rgba(255,255,255,.4)'}}>{t.count} teams</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
