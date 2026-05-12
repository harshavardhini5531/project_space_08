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

const CRITERIA = [
  { key: 'project_idea',  label: 'Project Idea',          hint: 'Originality, problem clarity, real-world relevance' },
  { key: 'ai_usage',      label: 'AI Usage',              hint: 'Effective, appropriate, and creative use of AI' },
  { key: 'presentation',  label: 'Presentation',          hint: 'Clarity, storytelling, slide quality' },
  { key: 'technical',     label: 'Technical Implementation', hint: 'Complexity of project, code quality, technical depth' },
  { key: 'qa_defense',    label: 'Q&A / Defense',         hint: 'How well team handled questions and showed understanding' },
]

export default function MentorPanelScoring({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form state
  const [selectedTeam, setSelectedTeam] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false)
  const [scores, setScores] = useState({ project_idea: 0, ai_usage: 0, presentation: 0, technical: 0, qa_defense: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const mentorEmail = mentor?.email

  async function fetchData() {
    if (!mentorEmail) return
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/mentor/panel-score?mentorEmail=${encodeURIComponent(mentorEmail)}`)
      const d = await r.json()
      if (!r.ok || !d.ok) { setError(d.error || 'Failed to load'); return }
      setData(d)
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mentorEmail])

  // When team is selected — if mentor has scored this team before, prefill the form
  useEffect(() => {
    if (!selectedTeam || !data) return
    const existing = (data.myScores || []).find(s => s.team_number === selectedTeam)
    if (existing) {
      setScores({
        project_idea: Number(existing.score_project_idea),
        ai_usage: Number(existing.score_ai_usage),
        presentation: Number(existing.score_presentation),
        technical: Number(existing.score_technical),
        qa_defense: Number(existing.score_qa_defense),
      })
    } else {
      setScores({ project_idea: 0, ai_usage: 0, presentation: 0, technical: 0, qa_defense: 0 })
    }
    setSuccessMsg(''); setErrorMsg('')
  }, [selectedTeam, data])

  const filteredTeams = useMemo(() => {
    if (!data?.teams) return []
    if (!teamSearch) return data.teams
    const q = teamSearch.toLowerCase()
    return data.teams.filter(t =>
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q) ||
      (t.technology || '').toLowerCase().includes(q)
    )
  }, [data, teamSearch])

  const selectedTeamObj = useMemo(() => {
    return (data?.teams || []).find(t => t.team_number === selectedTeam) || null
  }, [data, selectedTeam])

  const existingScore = useMemo(() => {
    return (data?.myScores || []).find(s => s.team_number === selectedTeam) || null
  }, [data, selectedTeam])

  const totalScore = useMemo(() =>
    Math.round((scores.project_idea + scores.ai_usage + scores.presentation + scores.technical + scores.qa_defense) * 10) / 10,
    [scores]
  )

  async function submitScores() {
    if (!selectedTeam) { setErrorMsg('Pick a team first'); return }
    setSubmitting(true); setErrorMsg(''); setSuccessMsg('')
    try {
      const r = await fetch('/api/mentor/panel-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorEmail, teamNumber: selectedTeam, scores }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) { setErrorMsg(d.error || 'Could not save'); return }
      setSuccessMsg(existingScore ? `Score updated for ${selectedTeam}` : `Score submitted for ${selectedTeam}`)
      await fetchData()  // refresh past scores
    } catch (e) {
      setErrorMsg('Network error: ' + e.message)
    } finally {
      setSubmitting(false)
      setTimeout(() => setSuccessMsg(''), 3500)
    }
  }

  if (loading) {
    return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'Inter,DM Sans,sans-serif',fontSize:'.85rem'}}>Loading panel scoring…</div>
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

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.ps{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.ps-hdr{margin-bottom:20px}
.ps-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ps-badge{padding:5px 12px;border-radius:8px;font-size:.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.3)}
.ps-sub{font-size:.78rem;color:rgba(255,255,255,.5);margin-top:5px;font-weight:500}

.ps-card{padding:22px;border-radius:14px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);margin-bottom:16px}

.ps-section-title{font-size:.7rem;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,.55);font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.ps-section-title::before{content:'';width:3px;height:14px;background:linear-gradient(180deg,#a78bfa,#7c3aed);border-radius:2px}

.ps-dropdown{position:relative}
.ps-team-btn{width:100%;padding:14px 16px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;transition:all .15s}
.ps-team-btn:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.18)}
.ps-team-btn.has{border-color:rgba(167,139,250,.4);background:rgba(167,139,250,.05)}
.ps-team-btn-l{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.ps-team-btn-l-1{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ps-team-num{color:#fd1c00;font-weight:800;font-size:.85rem}
.ps-team-tech{font-size:.6rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;border-radius:5px}
.ps-team-btn-l-2{color:rgba(255,255,255,.7);font-size:.74rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps-team-btn-placeholder{color:rgba(255,255,255,.35);font-weight:400}
.ps-chev{color:rgba(255,255,255,.4);font-size:.75rem;flex-shrink:0;margin-left:10px}

.ps-dd{position:absolute;top:calc(100% + 6px);left:0;right:0;max-height:400px;overflow-y:auto;background:#13101a;border:1px solid rgba(255,255,255,.12);border-radius:11px;z-index:50;box-shadow:0 12px 40px rgba(0,0,0,.5);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.ps-dd::-webkit-scrollbar{width:6px}
.ps-dd::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
.ps-dd-srch{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06)}
.ps-dd-srch input{width:100%;padding:9px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;outline:none}
.ps-dd-srch input:focus{border-color:rgba(167,139,250,.4)}
.ps-dd-srch input::placeholder{color:rgba(255,255,255,.3)}
.ps-dd-item{padding:11px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.03);transition:background .12s;display:flex;flex-direction:column;gap:4px}
.ps-dd-item:hover{background:rgba(255,255,255,.04)}
.ps-dd-item.scored{background:rgba(74,222,128,.04)}
.ps-dd-item:last-child{border-bottom:none}
.ps-dd-empty{padding:24px;text-align:center;color:rgba(255,255,255,.3);font-size:.76rem}
.ps-dd-item-r1{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ps-dd-item-r2{color:rgba(255,255,255,.6);font-size:.72rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps-dd-scored-tag{font-size:.55rem;padding:2px 6px;border-radius:4px;background:rgba(74,222,128,.15);color:#4ade80;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border:1px solid rgba(74,222,128,.3)}

.ps-scoring-grid{display:flex;flex-direction:column;gap:14px}
.ps-row{padding:14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05)}
.ps-row-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:8px}
.ps-row-label{font-size:.85rem;font-weight:700;color:#fff;letter-spacing:-0.01em}
.ps-row-hint{font-size:.66rem;color:rgba(255,255,255,.45);margin-top:3px;font-weight:500;line-height:1.4}
.ps-row-val{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:1.4rem;font-weight:800;color:#a78bfa;letter-spacing:-0.02em;min-width:55px;text-align:right}
.ps-row-val-max{color:rgba(255,255,255,.35);font-weight:500;font-size:.78rem;margin-left:3px}
.ps-row-slider{display:flex;align-items:center;gap:10px;margin-top:6px}
.ps-slider{flex:1;-webkit-appearance:none;appearance:none;height:6px;background:rgba(255,255,255,.08);border-radius:3px;outline:none;cursor:pointer}
.ps-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#7c3aed);cursor:pointer;box-shadow:0 0 0 4px rgba(167,139,250,.15);transition:transform .15s}
.ps-slider::-webkit-slider-thumb:hover{transform:scale(1.15)}
.ps-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#7c3aed);cursor:pointer;border:none}
.ps-row-input{width:60px;padding:7px 9px;border-radius:7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.85rem;font-weight:700;text-align:center;outline:none}
.ps-row-input:focus{border-color:rgba(167,139,250,.4)}

.ps-total{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-radius:12px;background:linear-gradient(135deg,rgba(167,139,250,.08),rgba(124,58,237,.04));border:1px solid rgba(167,139,250,.25);margin-top:16px}
.ps-total-l{font-size:.78rem;font-weight:600;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em}
.ps-total-v{font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:2rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.03em}
.ps-total-v-max{color:rgba(255,255,255,.35);font-weight:600;font-size:.95rem;margin-left:5px;-webkit-text-fill-color:rgba(255,255,255,.35)}

.ps-actions{display:flex;gap:10px;margin-top:16px;align-items:center;flex-wrap:wrap}
.ps-btn-primary{padding:11px 22px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#7c3aed);border:none;color:#fff;font-family:'Inter',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;letter-spacing:-0.01em;transition:all .15s}
.ps-btn-primary:hover:not(:disabled){box-shadow:0 0 20px rgba(167,139,250,.4);transform:translateY(-1px)}
.ps-btn-primary:disabled{opacity:.4;cursor:not-allowed}
.ps-msg-success{padding:9px 14px;border-radius:8px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);color:#4ade80;font-size:.74rem;font-weight:600}
.ps-msg-error{padding:9px 14px;border-radius:8px;background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);color:#ff6b5e;font-size:.74rem;font-weight:600}
.ps-existing-tag{padding:5px 10px;border-radius:6px;background:rgba(238,167,39,.1);border:1px solid rgba(238,167,39,.25);color:#EEA727;font-size:.66rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}

.ps-history{margin-top:24px}
.ps-history-tbl{width:100%;border-collapse:separate;border-spacing:0;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden}
.ps-history-tbl th{padding:11px;text-align:left;font-size:.58rem;font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(12,8,20,.5)}
.ps-history-tbl th.num{text-align:right}
.ps-history-tbl td{padding:11px;font-size:.74rem;color:rgba(255,255,255,.85);border-bottom:1px solid rgba(255,255,255,.04);font-weight:500}
.ps-history-tbl td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
.ps-history-tbl tr:last-child td{border-bottom:none}
.ps-history-tbl tr:hover td{background:rgba(255,255,255,.02)}
.ps-history-team{color:#fd1c00;font-weight:800;font-variant-numeric:tabular-nums}
.ps-history-empty{padding:30px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem;background:rgba(0,0,0,.18);border:1px dashed rgba(255,255,255,.08);border-radius:12px}
.ps-history-edit{padding:5px 12px;border-radius:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.7);font-family:'Inter',sans-serif;font-size:.68rem;font-weight:600;cursor:pointer;transition:all .15s}
.ps-history-edit:hover{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.3);color:#a78bfa}
.ps-history-total{color:#a78bfa;font-weight:800}
      `}</style>

      <div className="ps">

        {/* HEADER */}
        <div className="ps-hdr">
          <div className="ps-title">
            Panel Scoring
            <span className="ps-badge">{data.panel?.name}</span>
          </div>
          <div className="ps-sub">Score teams on 5 criteria, 10 points each. Total per team: <strong style={{color:'#a78bfa'}}>50 points</strong>. You can update your scores anytime.</div>
        </div>

        {/* SCORING CARD */}
        <div className="ps-card">
          <div className="ps-section-title">Step 1 · Select a Team</div>

          <div className="ps-dropdown">
            <button className={`ps-team-btn ${selectedTeam ? 'has' : ''}`} onClick={() => setTeamDropdownOpen(o => !o)}>
              {selectedTeamObj ? (
                <div className="ps-team-btn-l">
                  <div className="ps-team-btn-l-1">
                    <span className="ps-team-num">{selectedTeamObj.team_number}</span>
                    <span className="ps-team-tech" style={{background:`${TC[selectedTeamObj.technology]||'#888'}18`,color:TC[selectedTeamObj.technology]||'#888',border:`1px solid ${TC[selectedTeamObj.technology]||'#888'}30`}}>
                      {selectedTeamObj.technology}
                    </span>
                    {existingScore && <span className="ps-existing-tag">✎ Editing existing score</span>}
                  </div>
                  <div className="ps-team-btn-l-2">{selectedTeamObj.project_title}</div>
                </div>
              ) : (
                <span className="ps-team-btn-placeholder">Click to select a team to score…</span>
              )}
              <span className="ps-chev">{teamDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {teamDropdownOpen && (
              <div className="ps-dd">
                <div className="ps-dd-srch">
                  <input
                    placeholder="Search by team number, project, or technology…"
                    value={teamSearch}
                    onChange={e => setTeamSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                {filteredTeams.length === 0 ? (
                  <div className="ps-dd-empty">No teams found</div>
                ) : filteredTeams.map(t => {
                  const scored = (data.myScores || []).some(s => s.team_number === t.team_number)
                  return (
                    <div
                      key={t.team_number}
                      className={`ps-dd-item ${scored ? 'scored' : ''}`}
                      onClick={() => {
                        setSelectedTeam(t.team_number)
                        setTeamDropdownOpen(false)
                        setTeamSearch('')
                      }}
                    >
                      <div className="ps-dd-item-r1">
                        <span className="ps-team-num">{t.team_number}</span>
                        <span className="ps-team-tech" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>{t.technology}</span>
                        {scored && <span className="ps-dd-scored-tag">✓ Scored</span>}
                      </div>
                      <div className="ps-dd-item-r2">{t.project_title || '—'}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SCORING SLIDERS */}
          {selectedTeam && (
            <>
              <div className="ps-section-title" style={{marginTop:24}}>Step 2 · Score Each Criterion (0–10)</div>

              <div className="ps-scoring-grid">
                {CRITERIA.map(c => (
                  <div key={c.key} className="ps-row">
                    <div className="ps-row-top">
                      <div style={{flex:1,minWidth:0}}>
                        <div className="ps-row-label">{c.label}</div>
                        <div className="ps-row-hint">{c.hint}</div>
                      </div>
                      <div className="ps-row-val">
                        {scores[c.key]}<span className="ps-row-val-max">/10</span>
                      </div>
                    </div>
                    <div className="ps-row-slider">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores[c.key]}
                        onChange={e => setScores(s => ({...s, [c.key]: Number(e.target.value)}))}
                        className="ps-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={scores[c.key]}
                        onChange={e => {
                          let v = Number(e.target.value)
                          if (isNaN(v)) v = 0
                          v = Math.max(0, Math.min(10, v))
                          setScores(s => ({...s, [c.key]: v}))
                        }}
                        className="ps-row-input"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ps-total">
                <div className="ps-total-l">Total Score</div>
                <div className="ps-total-v">{totalScore}<span className="ps-total-v-max">/ 50</span></div>
              </div>

              <div className="ps-actions">
                <button
                  className="ps-btn-primary"
                  onClick={submitScores}
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : (existingScore ? 'Update Score' : 'Submit Score')}
                </button>
                {successMsg && <div className="ps-msg-success">✓ {successMsg}</div>}
                {errorMsg && <div className="ps-msg-error">{errorMsg}</div>}
              </div>
            </>
          )}
        </div>

        {/* HISTORY */}
        <div className="ps-history">
          <div className="ps-section-title">Your Submitted Scores ({(data.myScores || []).length})</div>

          {(data.myScores || []).length === 0 ? (
            <div className="ps-history-empty">No scores submitted yet. Pick a team above to start.</div>
          ) : (
            <table className="ps-history-tbl">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Project</th>
                  <th className="num">Idea</th>
                  <th className="num">AI</th>
                  <th className="num">Pres.</th>
                  <th className="num">Tech</th>
                  <th className="num">Q&A</th>
                  <th className="num">Total/50</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data.myScores || []).map(s => {
                  const team = (data.teams || []).find(t => t.team_number === s.team_number)
                  const updated = s.updated_at ? new Date(s.updated_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}) : '—'
                  return (
                    <tr key={s.id}>
                      <td className="ps-history-team">{s.team_number}</td>
                      <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'rgba(255,255,255,.75)'}}>{team?.project_title || '—'}</td>
                      <td className="num">{Number(s.score_project_idea)}</td>
                      <td className="num">{Number(s.score_ai_usage)}</td>
                      <td className="num">{Number(s.score_presentation)}</td>
                      <td className="num">{Number(s.score_technical)}</td>
                      <td className="num">{Number(s.score_qa_defense)}</td>
                      <td className="num ps-history-total">{Number(s.total_score)}</td>
                      <td style={{color:'rgba(255,255,255,.45)',fontSize:'.7rem'}}>{updated}</td>
                      <td><button className="ps-history-edit" onClick={() => { setSelectedTeam(s.team_number); window.scrollTo({top:0, behavior:'smooth'}) }}>Edit</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}