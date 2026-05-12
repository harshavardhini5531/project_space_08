'use client'
import { useState, useEffect, useMemo } from 'react'

const TC = {
  'AWS Development': '#ff9900',
  'Google Flutter': '#42a5f5',
  'Full Stack': '#4ade80',
  'Data Specialist': '#a78bfa',
  'ServiceNow': '#22c55e',
  'VLSI': '#ef4444',
  'SkillUp Coder': '#f59e0b',
}

const STAGE_NAMES = {
  1: 'Idea & Problem',
  2: 'Solution Design',
  3: 'Architecture',
  4: 'Implementation',
  5: 'Testing',
  6: 'Documentation',
  7: 'Final Demo',
}

const STAGE_COLORS = {
  completed: { bg: 'rgba(74,222,128,.12)', fg: '#4ade80', border: 'rgba(74,222,128,.3)' },
  'in-review': { bg: 'rgba(238,167,39,.12)', fg: '#EEA727', border: 'rgba(238,167,39,.3)' },
  rejected: { bg: 'rgba(253,28,0,.1)', fg: '#fd1c00', border: 'rgba(253,28,0,.3)' },
  pending: { bg: 'rgba(255,255,255,.04)', fg: 'rgba(255,255,255,.5)', border: 'rgba(255,255,255,.08)' },
  not_started: { bg: 'rgba(255,255,255,.02)', fg: 'rgba(255,255,255,.3)', border: 'rgba(255,255,255,.05)' },
}

export default function MentorPanelView({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [search, setSearch] = useState('')
  const [techFilter, setTechFilter] = useState('all')
  const [expandedSection, setExpandedSection] = useState('docs')

  const mentorEmail = mentor?.email

  async function fetchData() {
    if (!mentorEmail) return
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/mentor/panel-view?mentorEmail=${encodeURIComponent(mentorEmail)}`)
      const d = await r.json()
      if (!r.ok || !d.ok) { setError(d.error || 'Failed to load'); return }
      setData(d)
      if (d.teams && d.teams.length > 0 && !selectedTeam) {
        setSelectedTeam(d.teams[0].team_number)
      }
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mentorEmail])

  const techCounts = useMemo(() => {
    if (!data?.teams) return {}
    const c = {}
    for (const t of data.teams) {
      c[t.technology] = (c[t.technology] || 0) + 1
    }
    return c
  }, [data])

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    let arr = data.teams
    if (techFilter !== 'all') arr = arr.filter(t => t.technology === techFilter)
    if (search) {
      const q = search.toLowerCase()
      arr = arr.filter(t =>
        (t.team_number || '').toLowerCase().includes(q) ||
        (t.project_title || '').toLowerCase().includes(q)
      )
    }
    return arr
  }, [data, search, techFilter])

  const activeTeam = useMemo(() => {
    if (!data?.teams || !selectedTeam) return null
    return data.teams.find(t => t.team_number === selectedTeam) || null
  }, [data, selectedTeam])

  if (loading) {
    return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'Inter,DM Sans,sans-serif',fontSize:'.85rem'}}>Loading Panel View…</div>
  }

  if (error) {
    return (
      <div style={{padding:24,borderRadius:14,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.25)',fontFamily:'Inter,DM Sans,sans-serif'}}>
        <div style={{fontWeight:700,fontSize:'.95rem',color:'#fd1c00',marginBottom:6}}>
          {error.toLowerCase().includes('panel') ? 'You are not on a panel' : 'Could not load'}
        </div>
        <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.7)',marginBottom:10}}>{error}</div>
        <button onClick={fetchData} style={{padding:'6px 14px',borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.72rem',fontWeight:600,cursor:'pointer'}}>Retry</button>
      </div>
    )
  }

  if (!data) return null
  const summary = data.summary || {}

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.pv{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.pv-hdr{margin-bottom:18px}
.pv-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.pv-panel-tag{padding:5px 12px;border-radius:8px;font-size:.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.3)}
.pv-sub{font-size:.78rem;color:rgba(255,255,255,.5);margin-top:5px;font-weight:500}

.pv-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:18px}
.pv-kpi{padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.pv-kpi-l{font-size:.58rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:5px}
.pv-kpi-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.4rem;font-weight:700;line-height:1;letter-spacing:-0.02em}

.pv-tech-bar{display:flex;gap:6px;padding:6px;border-radius:11px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
.pv-tech-bar::-webkit-scrollbar{display:none}
.pv-tech-pill{padding:7px 13px;border-radius:7px;background:transparent;border:1px solid transparent;color:rgba(255,255,255,.55);font-family:'Inter',sans-serif;font-size:.7rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .18s;display:flex;align-items:center;gap:7px}
.pv-tech-pill:hover{color:rgba(255,255,255,.9);background:rgba(255,255,255,.03)}
.pv-tech-pill.on{color:#fff;font-weight:700;box-shadow:inset 0 0 0 1px var(--c, rgba(167,139,250,.4))}
.pv-tech-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;background:var(--c, #a78bfa)}
.pv-tech-count{font-size:.58rem;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);font-weight:700}
.pv-tech-pill.on .pv-tech-count{background:rgba(255,255,255,.12);color:#fff}

.pv-layout{display:grid;grid-template-columns:340px 1fr;gap:14px;min-height:600px}
@media(max-width:1024px){.pv-layout{grid-template-columns:1fr}}

.pv-list-box{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;display:flex;flex-direction:column;overflow:hidden}
.pv-list-search{padding:11px;border-bottom:1px solid rgba(255,255,255,.05)}
.pv-list-search input{width:100%;padding:9px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.76rem;outline:none;box-sizing:border-box}
.pv-list-search input:focus{border-color:rgba(167,139,250,.3)}
.pv-list-search input::placeholder{color:rgba(255,255,255,.3)}
.pv-list{flex:1;overflow-y:auto;max-height:700px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.pv-list::-webkit-scrollbar{width:6px}
.pv-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
.pv-list-item{padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .12s;position:relative}
.pv-list-item:hover{background:rgba(255,255,255,.025)}
.pv-list-item.on{background:rgba(167,139,250,.06);border-left:3px solid #a78bfa;padding-left:11px}
.pv-list-item:last-child{border-bottom:none}
.pv-list-r1{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.pv-list-team{color:#fd1c00;font-weight:800;font-variant-numeric:tabular-nums;font-size:.8rem;letter-spacing:-0.01em}
.pv-list-tech{font-size:.55rem;padding:2px 7px;border-radius:4px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.pv-list-scored{font-size:.55rem;padding:1px 6px;border-radius:4px;background:rgba(74,222,128,.12);color:#4ade80;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1px solid rgba(74,222,128,.3);margin-left:auto}
.pv-list-title{font-size:.72rem;color:rgba(255,255,255,.85);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.005em}
.pv-list-meta{font-size:.6rem;color:rgba(255,255,255,.4);margin-top:4px;display:flex;gap:9px;font-weight:500}
.pv-list-meta-ai{color:#a78bfa}
.pv-list-meta-mev{color:#60a5fa}
.pv-list-empty{padding:30px;text-align:center;color:rgba(255,255,255,.3);font-size:.76rem}

.pv-detail-box{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden}
.pv-detail-empty{padding:60px;text-align:center;color:rgba(255,255,255,.3);font-size:.85rem}
.pv-detail-hdr{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.15)}
.pv-detail-team-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:5px}
.pv-detail-team{font-family:'Inter',sans-serif;color:#fd1c00;font-weight:800;font-size:1.1rem;font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
.pv-detail-tech-pill{padding:3px 10px;border-radius:6px;font-size:.6rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.pv-detail-batch{font-size:.62rem;color:rgba(255,255,255,.4);background:rgba(255,255,255,.04);padding:2px 8px;border-radius:5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.pv-detail-proj-title{font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:-0.015em;margin-top:3px;line-height:1.3}
.pv-detail-meta{display:flex;gap:14px;margin-top:9px;flex-wrap:wrap;font-size:.7rem;color:rgba(255,255,255,.55);font-weight:500}
.pv-detail-meta-item{display:flex;gap:5px;align-items:center}
.pv-detail-meta-item strong{color:rgba(255,255,255,.85);font-weight:600}

.pv-detail-actions{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}
.pv-act-btn{padding:7px 13px;border-radius:8px;border:1px solid;font-family:'Inter',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;letter-spacing:-0.005em;transition:all .15s;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.pv-act-github{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12);color:#fff}
.pv-act-github:hover{background:rgba(255,255,255,.08)}
.pv-act-ppt{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.3);color:#EEA727}
.pv-act-ppt:hover{background:rgba(238,167,39,.16)}
.pv-act-score{background:linear-gradient(135deg,#a78bfa,#7c3aed);border-color:transparent;color:#fff}
.pv-act-score:hover{box-shadow:0 0 12px rgba(167,139,250,.4)}

.pv-sections{padding:16px 20px}
.pv-sect{margin-bottom:12px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);overflow:hidden}
.pv-sect-hdr{padding:11px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background .12s}
.pv-sect-hdr:hover{background:rgba(255,255,255,.025)}
.pv-sect-title{font-size:.76rem;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px;letter-spacing:-0.005em}
.pv-sect-icon{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}
.pv-sect-meta{font-size:.65rem;color:rgba(255,255,255,.45);font-weight:600;margin-left:8px}
.pv-sect-chev{color:rgba(255,255,255,.4);font-size:.7rem;transition:transform .2s}
.pv-sect-chev.on{transform:rotate(180deg)}
.pv-sect-body{padding:0 14px 14px;border-top:1px solid rgba(255,255,255,.04);padding-top:11px}

/* Documentation section */
.pv-doc-grid{display:flex;flex-direction:column;gap:10px}
.pv-doc-row{padding:10px 12px;border-radius:8px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.04)}
.pv-doc-l{font-size:.6rem;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:5px}
.pv-doc-v{font-size:.76rem;color:rgba(255,255,255,.88);line-height:1.55;font-weight:500;white-space:pre-wrap;word-break:break-word}
.pv-doc-empty{font-size:.7rem;color:rgba(255,255,255,.3);font-style:italic}
.pv-doc-techs{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}
.pv-tech-chip{font-size:.62rem;padding:3px 8px;border-radius:5px;background:rgba(96,165,250,.08);color:#60a5fa;font-weight:600;border:1px solid rgba(96,165,250,.2)}

/* AI section */
.pv-ai-top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:14px;padding:14px 16px;border-radius:9px;background:linear-gradient(135deg,rgba(167,139,250,.07),rgba(124,58,237,.03));border:1px solid rgba(167,139,250,.2)}
.pv-ai-score-block{display:flex;flex-direction:column;align-items:flex-start;gap:3px}
.pv-ai-score-l{font-size:.58rem;text-transform:uppercase;color:rgba(255,255,255,.5);letter-spacing:.1em;font-weight:700}
.pv-ai-score-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:2rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.03em;line-height:1}
.pv-ai-score-vmax{color:rgba(255,255,255,.4);font-weight:500;font-size:.85rem;margin-left:3px;-webkit-text-fill-color:rgba(255,255,255,.4)}
.pv-ai-dimensions{flex:1;min-width:280px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.pv-ai-dim-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:5px 10px;border-radius:5px;background:rgba(255,255,255,.025)}
.pv-ai-dim-l{font-size:.64rem;color:rgba(255,255,255,.7);font-weight:500;text-transform:capitalize}
.pv-ai-dim-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:800;color:#a78bfa}

.pv-ai-feedback{margin-top:6px;padding:11px 14px;border-radius:8px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.05)}
.pv-ai-fb-l{font-size:.58rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:6px}
.pv-ai-fb-section{margin-bottom:8px}
.pv-ai-fb-section:last-child{margin-bottom:0}
.pv-ai-fb-dim{font-size:.66rem;font-weight:700;color:#a78bfa;margin-bottom:3px;text-transform:capitalize}
.pv-ai-fb-text{font-size:.72rem;color:rgba(255,255,255,.78);line-height:1.5;font-weight:400;white-space:pre-wrap}

.pv-empty-state{padding:14px;text-align:center;color:rgba(255,255,255,.3);font-size:.7rem;font-style:italic;background:rgba(0,0,0,.15);border-radius:8px}

/* Mentor Eval */
.pv-mev-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:11px;padding:13px 16px;border-radius:9px;background:linear-gradient(135deg,rgba(96,165,250,.07),rgba(59,130,246,.03));border:1px solid rgba(96,165,250,.2)}
.pv-mev-l{display:flex;flex-direction:column;gap:3px}
.pv-mev-name{font-size:.72rem;color:rgba(255,255,255,.75);font-weight:600}
.pv-mev-meta{font-size:.6rem;color:rgba(255,255,255,.42);font-weight:500}
.pv-mev-score{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.9rem;font-weight:800;background:linear-gradient(135deg,#60a5fa,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.03em;line-height:1}
.pv-mev-score-max{color:rgba(255,255,255,.4);font-weight:500;font-size:.8rem;margin-left:3px;-webkit-text-fill-color:rgba(255,255,255,.4)}
.pv-mev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;margin-bottom:11px}
.pv-mev-cell{padding:7px 10px;border-radius:6px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.04);display:flex;justify-content:space-between;align-items:center}
.pv-mev-cell-l{font-size:.64rem;color:rgba(255,255,255,.65);text-transform:capitalize;font-weight:500}
.pv-mev-cell-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.82rem;font-weight:800;color:#60a5fa}
.pv-mev-comments{padding:11px 14px;border-radius:8px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.05)}
.pv-mev-comments-l{font-size:.58rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:6px}
.pv-mev-comments-v{font-size:.74rem;color:rgba(255,255,255,.85);line-height:1.6;font-weight:400;white-space:pre-wrap}

/* Stages */
.pv-stages-grid{display:flex;flex-direction:column;gap:6px}
.pv-stage{padding:9px 12px;border-radius:8px;display:flex;align-items:flex-start;gap:11px;border:1px solid var(--border, rgba(255,255,255,.05));background:var(--bg, rgba(255,255,255,.02))}
.pv-stage-num{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.85rem;font-weight:800;color:var(--fg, rgba(255,255,255,.5));min-width:24px;letter-spacing:-0.02em}
.pv-stage-body{flex:1}
.pv-stage-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:3px}
.pv-stage-name{font-size:.74rem;font-weight:700;color:rgba(255,255,255,.85)}
.pv-stage-status{font-size:.55rem;padding:2px 7px;border-radius:4px;background:var(--statusbg, rgba(255,255,255,.05));color:var(--fg, rgba(255,255,255,.5));font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1px solid var(--border, rgba(255,255,255,.06))}
.pv-stage-comment{font-size:.68rem;color:rgba(255,255,255,.55);font-weight:400;line-height:1.5;margin-top:3px;font-style:italic;border-left:2px solid rgba(255,255,255,.1);padding-left:8px}
.pv-stage-meta{font-size:.58rem;color:rgba(255,255,255,.4);margin-top:3px;font-weight:500}

/* Attendance */
.pv-att-top{display:flex;align-items:center;gap:14px;margin-bottom:11px;padding:11px 14px;border-radius:9px;background:linear-gradient(135deg,rgba(34,211,238,.06),rgba(8,145,178,.02));border:1px solid rgba(34,211,238,.2)}
.pv-att-pct{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.7rem;font-weight:800;color:#22d3ee;letter-spacing:-0.02em;line-height:1}
.pv-att-info{flex:1}
.pv-att-l{font-size:.66rem;color:rgba(255,255,255,.65);font-weight:600;margin-bottom:2px}
.pv-att-meta{font-size:.62rem;color:rgba(255,255,255,.45);font-weight:500}
.pv-att-bar{width:100%;height:8px;background:rgba(255,255,255,.04);border-radius:99px;overflow:hidden;margin-top:5px}
.pv-att-bar-fill{height:100%;background:linear-gradient(90deg,#22d3ee,#0891b2);border-radius:99px;transition:width .3s}
.pv-att-members{display:flex;flex-direction:column;gap:4px}
.pv-att-mem{display:flex;align-items:center;gap:9px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.pv-att-mem-roll{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.66rem;color:rgba(255,255,255,.55);font-weight:600;min-width:90px}
.pv-att-mem-name{font-size:.7rem;color:rgba(255,255,255,.85);font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-att-mem-lead{font-size:.5rem;padding:1px 5px;border-radius:3px;background:rgba(238,167,39,.12);color:#EEA727;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
.pv-att-mem-pct{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.72rem;font-weight:700;color:#22d3ee;min-width:42px;text-align:right}

/* Certs */
.pv-cert-top{display:flex;align-items:center;gap:14px;margin-bottom:11px;padding:11px 14px;border-radius:9px;background:linear-gradient(135deg,rgba(245,158,11,.07),rgba(217,119,6,.02));border:1px solid rgba(245,158,11,.2)}
.pv-cert-pct{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.7rem;font-weight:800;color:#f59e0b;letter-spacing:-0.02em;line-height:1}
.pv-cert-meta{font-size:.62rem;color:rgba(255,255,255,.45);font-weight:500}
.pv-cert-members{display:flex;flex-direction:column;gap:4px}
.pv-cert-mem{display:flex;align-items:center;gap:9px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.pv-cert-mem-name{font-size:.7rem;color:rgba(255,255,255,.85);font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-cert-mem-count{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.72rem;font-weight:700;color:#f59e0b;min-width:42px;text-align:right}
.pv-cert-mem-types{display:flex;gap:3px;flex-wrap:wrap}
.pv-cert-chip{font-size:.55rem;padding:1px 6px;border-radius:3px;background:rgba(245,158,11,.1);color:#f59e0b;font-weight:600;border:1px solid rgba(245,158,11,.2)}

.pv-members-list{display:flex;flex-direction:column;gap:5px}
.pv-mem-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.pv-mem-roll{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.7rem;color:rgba(255,255,255,.55);font-weight:600;min-width:100px}
.pv-mem-nm{font-size:.74rem;color:rgba(255,255,255,.85);font-weight:600;flex:1}

.pv-sect-icon-docs{background:rgba(167,139,250,.12);color:#a78bfa}
.pv-sect-icon-ai{background:rgba(167,139,250,.12);color:#a78bfa}
.pv-sect-icon-mev{background:rgba(96,165,250,.12);color:#60a5fa}
.pv-sect-icon-stage{background:rgba(74,222,128,.12);color:#4ade80}
.pv-sect-icon-att{background:rgba(34,211,238,.12);color:#22d3ee}
.pv-sect-icon-cert{background:rgba(245,158,11,.12);color:#f59e0b}
.pv-sect-icon-team{background:rgba(238,167,39,.12);color:#EEA727}
      `}</style>

      <div className="pv">

        {/* HEADER */}
        <div className="pv-hdr">
          <div className="pv-title">
            Panel View
            <span className="pv-panel-tag">{data.panel?.name}</span>
          </div>
          <div className="pv-sub">{summary.total_finalists} finalists · documentation · AI score · mentor review · attendance · stages · certs</div>
        </div>

        {/* KPIs */}
        <div className="pv-kpis">
          <div className="pv-kpi"><div className="pv-kpi-l">Finalists</div><div className="pv-kpi-v" style={{color:'#fd1c00'}}>{summary.total_finalists || 0}</div></div>
          <div className="pv-kpi"><div className="pv-kpi-l">With AI Score</div><div className="pv-kpi-v" style={{color:'#a78bfa'}}>{summary.with_ai_score || 0}</div></div>
          <div className="pv-kpi"><div className="pv-kpi-l">Mentor Eval</div><div className="pv-kpi-v" style={{color:'#60a5fa'}}>{summary.with_mentor_eval || 0}</div></div>
          <div className="pv-kpi"><div className="pv-kpi-l">With PPT</div><div className="pv-kpi-v" style={{color:'#EEA727'}}>{summary.with_ppt || 0}</div></div>
          <div className="pv-kpi"><div className="pv-kpi-l">You Scored</div><div className="pv-kpi-v" style={{color:'#4ade80'}}>{summary.i_scored || 0}</div></div>
        </div>

        {/* TECH PILLS */}
        <div className="pv-tech-bar">
          <button className={`pv-tech-pill ${techFilter === 'all' ? 'on' : ''}`} style={techFilter === 'all' ? {'--c':'rgba(167,139,250,.5)'} : {}} onClick={() => setTechFilter('all')}>
            <span className="pv-tech-dot" style={{'--c':'#a78bfa'}}></span>
            All<span className="pv-tech-count">{data.teams.length}</span>
          </button>
          {Object.entries(techCounts).sort((a,b) => b[1]-a[1]).map(([tech, count]) => {
            const c = TC[tech] || '#888'
            const isOn = techFilter === tech
            return (
              <button key={tech} className={`pv-tech-pill ${isOn ? 'on' : ''}`} style={isOn ? {'--c':`${c}80`} : {}} onClick={() => setTechFilter(tech)}>
                <span className="pv-tech-dot" style={{'--c':c}}></span>
                {tech}<span className="pv-tech-count">{count}</span>
              </button>
            )
          })}
        </div>

        {/* MAIN LAYOUT */}
        <div className="pv-layout">

          {/* TEAM LIST */}
          <div className="pv-list-box">
            <div className="pv-list-search">
              <input
                placeholder="Search team or project…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="pv-list">
              {filteredTeams.length === 0 ? (
                <div className="pv-list-empty">No teams match filters</div>
              ) : filteredTeams.map(t => (
                <div
                  key={t.team_number}
                  className={`pv-list-item ${selectedTeam === t.team_number ? 'on' : ''}`}
                  onClick={() => setSelectedTeam(t.team_number)}
                >
                  <div className="pv-list-r1">
                    <span className="pv-list-team">{t.team_number}</span>
                    <span className="pv-list-tech" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>{t.technology}</span>
                    {t.panel_stats?.i_scored && <span className="pv-list-scored">✓ Scored</span>}
                  </div>
                  <div className="pv-list-title" title={t.project_title}>{t.project_title}</div>
                  <div className="pv-list-meta">
                    {t.ai_review?.score != null && <span className="pv-list-meta-ai">AI: {t.ai_review.score}</span>}
                    {t.mentor_evaluation && <span className="pv-list-meta-mev">M: {t.mentor_evaluation.average}/10</span>}
                    <span>{t.stages_completed}/7 stages</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TEAM DETAIL */}
          <div className="pv-detail-box">
            {!activeTeam ? (
              <div className="pv-detail-empty">Select a team to view full details</div>
            ) : (
              <>
                {/* Detail Header */}
                <div className="pv-detail-hdr">
                  <div className="pv-detail-team-row">
                    <span className="pv-detail-team">{activeTeam.team_number}</span>
                    <span className="pv-detail-tech-pill" style={{background:`${TC[activeTeam.technology]||'#888'}18`,color:TC[activeTeam.technology]||'#888',border:`1px solid ${TC[activeTeam.technology]||'#888'}30`}}>{activeTeam.technology}</span>
                    {activeTeam.batch && <span className="pv-detail-batch">{activeTeam.batch}</span>}
                  </div>
                  <div className="pv-detail-proj-title">{activeTeam.project_title}</div>
                  <div className="pv-detail-meta">
                    <div className="pv-detail-meta-item">Mentor: <strong>{activeTeam.mentor}</strong></div>
                    {activeTeam.leader && <div className="pv-detail-meta-item">Leader: <strong>{activeTeam.leader.short_name || activeTeam.leader.roll}</strong></div>}
                    <div className="pv-detail-meta-item"><strong>{activeTeam.member_count}</strong> members</div>
                  </div>
                  <div className="pv-detail-actions">
                    {activeTeam.documentation?.github_url && (
                      <a href={activeTeam.documentation.github_url} target="_blank" rel="noopener noreferrer" className="pv-act-btn pv-act-github">
                        ↗ GitHub
                      </a>
                    )}
                    {activeTeam.ppt?.storage_path && (
                      <a href={activeTeam.ppt.storage_path} target="_blank" rel="noopener noreferrer" className="pv-act-btn pv-act-ppt">
                        ↓ PPT ({activeTeam.ppt.file_name})
                      </a>
                    )}
                    <button className="pv-act-btn pv-act-score" onClick={() => {
                      if (typeof window !== 'undefined' && window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('mentor-nav', { detail: { page: 'panel-scoring', team: activeTeam.team_number } }))
                      }
                    }}>
                      ⚖ Score this team →
                    </button>
                  </div>
                </div>

                {/* Collapsible Sections */}
                <div className="pv-sections">

                  {/* DOCUMENTATION */}
                  <Section
                    id="docs"
                    title="Project Documentation"
                    iconCls="pv-sect-icon-docs"
                    icon="📄"
                    meta={activeTeam.documentation?.submitted_at ? `Submitted ${new Date(activeTeam.documentation.submitted_at).toLocaleDateString('en-IN')}` : null}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    <div className="pv-doc-grid">
                      <DocRow label="Problem Statement" value={activeTeam.documentation?.problem_statement} />
                      <DocRow label="Proposed Solution" value={activeTeam.documentation?.proposed_solution} />
                      <DocRow label="Description" value={activeTeam.documentation?.description} />
                      <DocRow label="Requirements" value={activeTeam.documentation?.requirements} />
                      <DocRow label="System Architecture" value={activeTeam.documentation?.system_architecture} />
                      {Array.isArray(activeTeam.documentation?.technologies_used) && activeTeam.documentation.technologies_used.length > 0 && (
                        <div className="pv-doc-row">
                          <div className="pv-doc-l">Technologies Used</div>
                          <div className="pv-doc-techs">
                            {activeTeam.documentation.technologies_used.map((t, i) => (
                              <span key={i} className="pv-tech-chip">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <DocRow label="In Scope" value={activeTeam.documentation?.in_scope} />
                      <DocRow label="Out of Scope" value={activeTeam.documentation?.out_scope} />
                      <DocRow label="Future Enhancements" value={activeTeam.documentation?.future_enhancements} />
                      <DocRow label="Conclusion" value={activeTeam.documentation?.conclusion} />
                    </div>
                  </Section>

                  {/* AI REVIEW */}
                  <Section
                    id="ai"
                    title="AI Analysis Report"
                    iconCls="pv-sect-icon-ai"
                    icon="🤖"
                    meta={activeTeam.ai_review?.score != null ? `Score: ${activeTeam.ai_review.score}/100` : 'Not yet reviewed'}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    {activeTeam.ai_review?.score != null ? (
                      <>
                        <div className="pv-ai-top">
                          <div className="pv-ai-score-block">
                            <div className="pv-ai-score-l">Overall Score</div>
                            <div className="pv-ai-score-v">{activeTeam.ai_review.score}<span className="pv-ai-score-vmax">/ 100</span></div>
                          </div>
                          {activeTeam.ai_review.dimensions && (
                            <div className="pv-ai-dimensions">
                              {Object.entries(activeTeam.ai_review.dimensions).map(([dim, val]) => (
                                <div key={dim} className="pv-ai-dim-row">
                                  <span className="pv-ai-dim-l">{dim.replace(/_/g,' ')}</span>
                                  <span className="pv-ai-dim-v">{typeof val === 'number' ? val.toFixed(1) : val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {activeTeam.ai_review.feedback && typeof activeTeam.ai_review.feedback === 'object' && (
                          <div className="pv-ai-feedback">
                            <div className="pv-ai-fb-l">AI Feedback</div>
                            {Object.entries(activeTeam.ai_review.feedback).map(([dim, fb]) => (
                              <div key={dim} className="pv-ai-fb-section">
                                <div className="pv-ai-fb-dim">{dim.replace(/_/g,' ')}</div>
                                <div className="pv-ai-fb-text">{typeof fb === 'string' ? fb : JSON.stringify(fb)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="pv-empty-state">No AI review available yet for this team.</div>
                    )}
                  </Section>

                  {/* MENTOR EVALUATION */}
                  <Section
                    id="mev"
                    title="Mentor Evaluation"
                    iconCls="pv-sect-icon-mev"
                    icon="⭐"
                    meta={activeTeam.mentor_evaluation ? `${activeTeam.mentor_evaluation.average}/10` : 'Not evaluated'}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    {activeTeam.mentor_evaluation ? (
                      <>
                        <div className="pv-mev-top">
                          <div className="pv-mev-l">
                            <div className="pv-mev-name">{activeTeam.mentor_evaluation.mentor_name}</div>
                            <div className="pv-mev-meta">Updated {new Date(activeTeam.mentor_evaluation.updated_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                          </div>
                          <div>
                            <div className="pv-mev-score">{activeTeam.mentor_evaluation.average}<span className="pv-mev-score-max">/ 10</span></div>
                          </div>
                        </div>
                        <div className="pv-mev-grid">
                          <MEvCell label="Innovation" value={activeTeam.mentor_evaluation.innovation}/>
                          <MEvCell label="Technical" value={activeTeam.mentor_evaluation.technical}/>
                          <MEvCell label="UI/UX" value={activeTeam.mentor_evaluation.uiux}/>
                          <MEvCell label="Relevance" value={activeTeam.mentor_evaluation.relevance}/>
                          <MEvCell label="Demo" value={activeTeam.mentor_evaluation.demo}/>
                          <MEvCell label="Documentation" value={activeTeam.mentor_evaluation.documentation}/>
                        </div>
                        {activeTeam.mentor_evaluation.comments && (
                          <div className="pv-mev-comments">
                            <div className="pv-mev-comments-l">Mentor's Comments</div>
                            <div className="pv-mev-comments-v">{activeTeam.mentor_evaluation.comments}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="pv-empty-state">Team has not yet been evaluated by a mentor.</div>
                    )}
                  </Section>

                  {/* PROJECT STAGES */}
                  <Section
                    id="stages"
                    title="Project Stages"
                    iconCls="pv-sect-icon-stage"
                    icon="✓"
                    meta={`${activeTeam.stages_completed}/${activeTeam.stages_total} completed`}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    <div className="pv-stages-grid">
                      {(activeTeam.stages || []).map(stage => {
                        const colors = STAGE_COLORS[stage.status] || STAGE_COLORS.not_started
                        return (
                          <div
                            key={stage.stage_number}
                            className="pv-stage"
                            style={{
                              '--bg': colors.bg,
                              '--fg': colors.fg,
                              '--border': colors.border,
                              '--statusbg': colors.bg,
                            }}
                          >
                            <div className="pv-stage-num">{stage.stage_number}</div>
                            <div className="pv-stage-body">
                              <div className="pv-stage-top">
                                <div className="pv-stage-name">{STAGE_NAMES[stage.stage_number] || `Stage ${stage.stage_number}`}</div>
                                <div className="pv-stage-status">{stage.status.replace(/_/g,' ')}</div>
                              </div>
                              {stage.mentor_comment && (
                                <div className="pv-stage-comment">"{stage.mentor_comment}"</div>
                              )}
                              {stage.reviewed_at && (
                                <div className="pv-stage-meta">Reviewed by {stage.reviewed_by || 'mentor'} · {new Date(stage.reviewed_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Section>

                  {/* ATTENDANCE */}
                  <Section
                    id="att"
                    title="Attendance"
                    iconCls="pv-sect-icon-att"
                    icon="📅"
                    meta={`${activeTeam.attendance?.pct || 0}% (${activeTeam.attendance?.total_modes || 0}/${activeTeam.attendance?.max_modes || 0} modes)`}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    <div className="pv-att-top">
                      <div className="pv-att-pct">{activeTeam.attendance?.pct || 0}%</div>
                      <div className="pv-att-info">
                        <div className="pv-att-l">Team Attendance</div>
                        <div className="pv-att-meta">{activeTeam.attendance?.total_modes || 0} of {activeTeam.attendance?.max_modes || 0} mode-punches across {activeTeam.member_count} members × 7 days × 4 modes</div>
                        <div className="pv-att-bar"><div className="pv-att-bar-fill" style={{width:`${activeTeam.attendance?.pct || 0}%`}}/></div>
                      </div>
                    </div>
                    <div className="pv-att-members">
                      {(activeTeam.attendance?.members || []).map(m => (
                        <div key={m.roll} className="pv-att-mem">
                          <span className="pv-att-mem-roll">{m.roll}</span>
                          <span className="pv-att-mem-name">{m.short_name || m.roll}</span>
                          {m.is_leader && <span className="pv-att-mem-lead">Leader</span>}
                          <span className="pv-att-mem-pct">{m.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* CLAUDE CERTIFICATES */}
                  <Section
                    id="cert"
                    title="Claude Certificates"
                    iconCls="pv-sect-icon-cert"
                    icon="🎓"
                    meta={`${activeTeam.certificates?.pct || 0}% (${activeTeam.certificates?.total || 0}/${activeTeam.certificates?.max || 0})`}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    <div className="pv-cert-top">
                      <div className="pv-cert-pct">{activeTeam.certificates?.pct || 0}%</div>
                      <div>
                        <div style={{fontSize:'.66rem',color:'rgba(255,255,255,.65)',fontWeight:600}}>Team Certs Uploaded</div>
                        <div className="pv-cert-meta">{activeTeam.certificates?.total || 0} of {activeTeam.certificates?.max || 0} expected · 4 certs per member</div>
                      </div>
                    </div>
                    <div className="pv-cert-members">
                      {(activeTeam.certificates?.members || []).map(m => (
                        <div key={m.roll} className="pv-cert-mem">
                          <span className="pv-cert-mem-name">{m.short_name || m.roll}</span>
                          <div className="pv-cert-mem-types">
                            {m.types.map(t => (
                              <span key={t} className="pv-cert-chip">{t}</span>
                            ))}
                          </div>
                          <span className="pv-cert-mem-count">{m.uploaded}/{m.max}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  {/* TEAM MEMBERS */}
                  <Section
                    id="team"
                    title="Team Members"
                    iconCls="pv-sect-icon-team"
                    icon="👥"
                    meta={`${activeTeam.member_count} member${activeTeam.member_count === 1 ? '' : 's'}`}
                    expanded={expandedSection}
                    setExpanded={setExpandedSection}
                  >
                    <div className="pv-members-list">
                      {(activeTeam.members || []).map(m => (
                        <div key={m.roll} className="pv-mem-row">
                          <span className="pv-mem-roll">{m.roll}</span>
                          <span className="pv-mem-nm">{m.short_name || m.roll}</span>
                          {m.is_leader && <span className="pv-att-mem-lead">Leader</span>}
                        </div>
                      ))}
                    </div>
                  </Section>

                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function Section({ id, title, iconCls, icon, meta, expanded, setExpanded, children }) {
  const isOpen = expanded === id
  return (
    <div className="pv-sect">
      <div className="pv-sect-hdr" onClick={() => setExpanded(isOpen ? null : id)}>
        <div className="pv-sect-title">
          <span className={`pv-sect-icon ${iconCls}`}>{icon}</span>
          {title}
          {meta && <span className="pv-sect-meta">{meta}</span>}
        </div>
        <div className={`pv-sect-chev ${isOpen ? 'on' : ''}`}>▼</div>
      </div>
      {isOpen && <div className="pv-sect-body">{children}</div>}
    </div>
  )
}

function DocRow({ label, value }) {
  return (
    <div className="pv-doc-row">
      <div className="pv-doc-l">{label}</div>
      <div className={value ? 'pv-doc-v' : 'pv-doc-empty'}>{value || 'Not provided'}</div>
    </div>
  )
}

function MEvCell({ label, value }) {
  return (
    <div className="pv-mev-cell">
      <span className="pv-mev-cell-l">{label}</span>
      <span className="pv-mev-cell-v">{value}</span>
    </div>
  )
}