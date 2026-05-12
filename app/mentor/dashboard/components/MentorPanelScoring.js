'use client'
import { useState, useEffect, useMemo, useRef } from 'react'

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
  { key: 'project_idea',       label: 'Project Idea' },
  { key: 'ai_usage',           label: 'AI Usage' },
  { key: 'presentation',       label: 'Presentation' },
  { key: 'technical',          label: 'Technical Implementation' },
  { key: 'project_complexity', label: 'Project Complexity' },
]

const EMPTY_SCORES = { project_idea: '', ai_usage: '', presentation: '', technical: '', project_complexity: '' }

export default function MentorPanelScoring({ mentor }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pending row state: { teamNumber, scores }
  const [showPendingRow, setShowPendingRow] = useState(true)
  const [pendingRow, setPendingRow] = useState({ teamNumber: '', scores: { ...EMPTY_SCORES } })
  const [submitting, setSubmitting] = useState(false)
  const [flashMsg, setFlashMsg] = useState(null) // { type: 'success'|'error', text }
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [ddPos, setDdPos] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef(null)
  const ddBtnRef = useRef(null)

  function openDropdown() {
    if (ddBtnRef.current) {
      const rect = ddBtnRef.current.getBoundingClientRect()
      const ddWidth = 340
      let left = rect.left
      // Keep within viewport
      if (left + ddWidth > window.innerWidth - 10) {
        left = Math.max(10, window.innerWidth - ddWidth - 10)
      }
      let top = rect.bottom + 4
      // Flip up if not enough room below
      if (top + 380 > window.innerHeight - 10 && rect.top > 380) {
        top = rect.top - 384
      }
      setDdPos({ top, left })
    }
    setDropdownOpen(true)
  }

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

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target)
      const inBtn = ddBtnRef.current && ddBtnRef.current.contains(e.target)
      if (!inDropdown && !inBtn) setDropdownOpen(false)
    }
    const onScroll = () => setDropdownOpen(false)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Listen for cross-page nav events that pre-select a team (from Panel View)
  useEffect(() => {
    const handler = (e) => {
      const team = e?.detail?.team
      if (team && !alreadyScoredTeams.has(team)) {
        setPendingRow({ teamNumber: team, scores: { ...EMPTY_SCORES } })
        setShowPendingRow(true)
        setTimeout(() => {
          const el = document.getElementById('pending-row')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
    }
    window.addEventListener('mentor-switch-page', handler)
    return () => window.removeEventListener('mentor-switch-page', handler)
  }, [data])

  const alreadyScoredTeams = useMemo(() => {
    if (!data?.myScores) return new Set()
    return new Set(data.myScores.map(s => s.team_number))
  }, [data])

  // Teams available to pick (not already scored)
  const availableTeams = useMemo(() => {
    if (!data?.teams) return []
    return data.teams.filter(t => !alreadyScoredTeams.has(t.team_number))
  }, [data, alreadyScoredTeams])

  const filteredAvailableTeams = useMemo(() => {
    if (!searchQ) return availableTeams
    const q = searchQ.toLowerCase()
    return availableTeams.filter(t =>
      (t.team_number || '').toLowerCase().includes(q) ||
      (t.project_title || '').toLowerCase().includes(q) ||
      (t.technology || '').toLowerCase().includes(q)
    )
  }, [availableTeams, searchQ])

  const selectedTeamObj = useMemo(() => {
    if (!pendingRow.teamNumber || !data?.teams) return null
    return data.teams.find(t => t.team_number === pendingRow.teamNumber) || null
  }, [pendingRow.teamNumber, data])

  const pendingTotal = useMemo(() => {
    return CRITERIA.reduce((sum, c) => {
      const v = Number(pendingRow.scores[c.key])
      return sum + (isNaN(v) ? 0 : v)
    }, 0)
  }, [pendingRow])

  function updateScore(key, value) {
    let v = value
    if (v === '') {
      // allow empty
    } else {
      v = Number(v)
      if (isNaN(v)) v = ''
      else v = Math.max(0, Math.min(10, v))
    }
    setPendingRow(prev => ({ ...prev, scores: { ...prev.scores, [key]: v } }))
  }

  async function submitPendingRow() {
    if (!pendingRow.teamNumber) {
      setFlashMsg({ type: 'error', text: 'Pick a team first' })
      return
    }
    // Validate all 5 scores are filled
    for (const c of CRITERIA) {
      const v = pendingRow.scores[c.key]
      if (v === '' || v === null || v === undefined) {
        setFlashMsg({ type: 'error', text: `Enter a value for ${c.label} (0-10)` })
        return
      }
      const n = Number(v)
      if (isNaN(n) || n < 0 || n > 10) {
        setFlashMsg({ type: 'error', text: `${c.label} must be 0-10` })
        return
      }
    }

    setSubmitting(true)
    setFlashMsg(null)
    try {
      const r = await fetch('/api/mentor/panel-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorEmail,
          teamNumber: pendingRow.teamNumber,
          scores: pendingRow.scores,
        }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setFlashMsg({ type: 'error', text: d.error || 'Submission failed' })
        if (r.status === 409) {
          // Already scored — refresh to show it in list and reset
          await fetchData()
          setPendingRow({ teamNumber: '', scores: { ...EMPTY_SCORES } })
          setShowPendingRow(false)
        }
        return
      }
      setFlashMsg({ type: 'success', text: `✓ Score submitted for ${pendingRow.teamNumber}` })
      setPendingRow({ teamNumber: '', scores: { ...EMPTY_SCORES } })
      setShowPendingRow(false)  // hide row; user clicks "+ Add Row" for next
      await fetchData()
    } catch (e) {
      setFlashMsg({ type: 'error', text: 'Network error: ' + e.message })
    } finally {
      setSubmitting(false)
      setTimeout(() => setFlashMsg(null), 4500)
    }
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.4)',fontFamily:'Inter,DM Sans,sans-serif',fontSize:'.85rem'}}>Loading panel scoring…</div>

  if (error) return (
    <div style={{padding:24,borderRadius:14,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.25)',fontFamily:'Inter,DM Sans,sans-serif'}}>
      <div style={{fontWeight:700,fontSize:'.95rem',color:'#fd1c00',marginBottom:6}}>
        {error.toLowerCase().includes('panel') ? 'You are not on a panel' : 'Could not load'}
      </div>
      <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.7)',marginBottom:10}}>{error}</div>
      <button onClick={fetchData} style={{padding:'6px 14px',borderRadius:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#fff',fontFamily:'inherit',fontSize:'.72rem',fontWeight:600,cursor:'pointer'}}>Retry</button>
    </div>
  )

  if (!data) return null

  return (
    <div style={{color:'#fff',paddingBottom:30}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
.ps{font-family:'Inter','DM Sans',sans-serif;font-feature-settings:'tnum';font-variant-numeric:tabular-nums;letter-spacing:-0.01em}

.ps-hdr{margin-bottom:18px}
.ps-title{font-size:1.35rem;font-weight:700;letter-spacing:-0.02em;color:#fff;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ps-badge{padding:5px 12px;border-radius:8px;font-size:.7rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.3)}
.ps-sub{font-size:.78rem;color:rgba(255,255,255,.5);margin-top:5px;font-weight:500}
.ps-sub-info{font-size:.72rem;color:rgba(255,255,255,.4);margin-top:4px;font-weight:500;display:flex;gap:14px;flex-wrap:wrap}
.ps-sub-info strong{color:#fff;font-weight:700}

.ps-flash{margin-bottom:14px;padding:11px 16px;border-radius:10px;font-size:.78rem;font-weight:600;animation:psFadeIn .2s ease}
@keyframes psFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.ps-flash.success{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);color:#4ade80}
.ps-flash.error{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.3);color:#ff6b5e}

.ps-tbl-wrap{background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow-x:auto;overflow-y:visible;-webkit-overflow-scrolling:touch}
.ps-tbl{width:100%;border-collapse:separate;border-spacing:0;min-width:1100px;font-family:'Inter','DM Sans',sans-serif}
.ps-tbl thead{background:rgba(12,8,20,.97);position:sticky;top:0;z-index:2}
.ps-tbl th{padding:12px 11px;text-align:left;font-size:.6rem;font-weight:700;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap}
.ps-tbl th.num{text-align:center;padding:12px 6px}
.ps-tbl td{padding:11px;font-size:.74rem;color:rgba(255,255,255,.88);border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle;font-weight:500}
.ps-tbl tr.row-pending td{background:rgba(167,139,250,.05);border-color:rgba(167,139,250,.18)}
.ps-tbl tr.row-pending td:first-child{border-left:3px solid #a78bfa}
.ps-tbl tr:hover td{background:rgba(255,255,255,.02)}
.ps-tbl tr.row-submitted td{color:rgba(255,255,255,.7)}
.ps-tbl tr:last-child td{border-bottom:none}

.ps-team-cell{color:#fd1c00;font-weight:800;font-variant-numeric:tabular-nums;font-size:.82rem;letter-spacing:-0.01em;white-space:nowrap}
.ps-proj-cell{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,.88);font-weight:600;letter-spacing:-0.005em}
.ps-tech-pill{padding:3px 9px;border-radius:5px;font-size:.56rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;display:inline-block;white-space:nowrap}

.ps-score-cell{text-align:center;font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-weight:700;font-size:.85rem;color:#a78bfa}
.ps-score-input{width:55px;padding:7px 6px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#fff;font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums;font-size:.85rem;font-weight:700;text-align:center;outline:none;-moz-appearance:textfield}
.ps-score-input::-webkit-outer-spin-button,.ps-score-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.ps-score-input:focus{border-color:rgba(167,139,250,.45);background:rgba(167,139,250,.06)}
.ps-score-input.invalid{border-color:rgba(253,28,0,.4)}

.ps-total-cell{text-align:center;color:#fff;font-weight:800;font-size:.95rem;font-family:'Inter',sans-serif;font-variant-numeric:tabular-nums}

.ps-action-cell{text-align:center;white-space:nowrap}
.ps-submit-btn{padding:7px 14px;border-radius:7px;background:linear-gradient(135deg,#a78bfa,#7c3aed);border:none;color:#fff;font-family:'Inter',sans-serif;font-size:.72rem;font-weight:700;cursor:pointer;letter-spacing:-0.005em;transition:all .15s;white-space:nowrap}
.ps-submit-btn:hover:not(:disabled){box-shadow:0 0 12px rgba(167,139,250,.4);transform:translateY(-1px)}
.ps-submit-btn:disabled{opacity:.4;cursor:not-allowed}
.ps-submitted-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;background:rgba(74,222,128,.1);color:#4ade80;font-size:.62rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;border:1px solid rgba(74,222,128,.25)}

.ps-dropdown{position:relative;width:100%;max-width:380px}
.ps-dd-btn{width:100%;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(167,139,250,.3);color:#fff;font-family:'Inter',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:8px;outline:none}
.ps-dd-btn:hover{background:rgba(255,255,255,.06)}
.ps-dd-btn.placeholder{color:rgba(255,255,255,.4);font-weight:400}
.ps-dd-chev{color:rgba(255,255,255,.4);font-size:.65rem;flex-shrink:0}

.ps-dd-pop{position:fixed;max-height:380px;width:340px;overflow-y:auto;background:#13101a;border:1px solid rgba(167,139,250,.3);border-radius:10px;z-index:99999;box-shadow:0 16px 48px rgba(0,0,0,.7);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}
.ps-dd-pop::-webkit-scrollbar{width:5px}
.ps-dd-pop::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
.ps-dd-srch{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,.05);position:sticky;top:0;background:#13101a;z-index:1}
.ps-dd-srch input{width:100%;padding:8px 11px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'Inter',sans-serif;font-size:.76rem;outline:none;box-sizing:border-box}
.ps-dd-srch input:focus{border-color:rgba(167,139,250,.4)}
.ps-dd-srch input::placeholder{color:rgba(255,255,255,.3)}
.ps-dd-item{padding:9px 12px;cursor:pointer;transition:background .12s;display:flex;flex-direction:column;gap:3px;border-bottom:1px solid rgba(255,255,255,.03)}
.ps-dd-item:hover{background:rgba(167,139,250,.06)}
.ps-dd-item:last-child{border-bottom:none}
.ps-dd-item-r1{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ps-dd-item-team{color:#fd1c00;font-weight:800;font-variant-numeric:tabular-nums;font-size:.76rem}
.ps-dd-item-title{font-size:.7rem;color:rgba(255,255,255,.7);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps-dd-empty{padding:24px;text-align:center;color:rgba(255,255,255,.3);font-size:.72rem}

.ps-add-row-section{margin-top:14px}
.ps-add-btn{padding:9px 18px;border-radius:9px;background:rgba(167,139,250,.08);border:1px dashed rgba(167,139,250,.4);color:#a78bfa;font-family:'Inter',sans-serif;font-size:.74rem;font-weight:700;cursor:pointer;letter-spacing:-0.005em;transition:all .15s;display:inline-flex;align-items:center;gap:7px}
.ps-add-btn:hover{background:rgba(167,139,250,.15);border-style:solid}
.ps-add-btn::before{content:'+';font-size:1rem;font-weight:600}

.ps-empty-state{padding:30px 16px;text-align:center;color:rgba(255,255,255,.35);font-size:.78rem;background:rgba(0,0,0,.15);border:1px dashed rgba(255,255,255,.08);border-radius:10px}

.ps-pending-meta{font-size:.62rem;color:rgba(255,255,255,.4);font-weight:500;margin-top:3px}
      `}</style>

      <div className="ps">
        {/* HEADER */}
        <div className="ps-hdr">
          <div className="ps-title">
            Panel Scoring
            <span className="ps-badge">{data.panel?.name}</span>
          </div>
          <div className="ps-sub">Score teams on 5 criteria (0-10 each). Total per team: <strong style={{color:'#a78bfa'}}>50 points</strong>. One submission per team — no duplicates.</div>
          <div className="ps-sub-info">
            <span>Scored: <strong>{data.myScores?.length || 0}</strong></span>
            <span>Available teams: <strong>{availableTeams.length}</strong> of {data.teams?.length || 0}</span>
          </div>
        </div>

        {/* FLASH MESSAGE */}
        {flashMsg && <div className={`ps-flash ${flashMsg.type}`}>{flashMsg.text}</div>}

        {/* SCORING TABLE */}
        <div className="ps-tbl-wrap">
          <table className="ps-tbl">
            <thead>
              <tr>
                <th>Team Number</th>
                <th>Project Title</th>
                <th>Technology</th>
                <th className="num">Project Idea</th>
                <th className="num">AI Usage</th>
                <th className="num">Presentation</th>
                <th className="num">Technical Implementation</th>
                <th className="num">Project Complexity</th>
                <th className="num">Total / 50</th>
                <th style={{textAlign:'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* SUBMITTED ROWS */}
              {(data.myScores || []).map(s => {
                const team = data.teams?.find(t => t.team_number === s.team_number)
                return (
                  <tr key={s.id} className="row-submitted">
                    <td className="ps-team-cell">{s.team_number}</td>
                    <td className="ps-proj-cell" title={team?.project_title}>{team?.project_title || '—'}</td>
                    <td>
                      {team?.technology ? (
                        <span className="ps-tech-pill" style={{background:`${TC[team.technology]||'#888'}18`,color:TC[team.technology]||'#888',border:`1px solid ${TC[team.technology]||'#888'}30`}}>
                          {team.technology}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="ps-score-cell">{Number(s.score_project_idea)}</td>
                    <td className="ps-score-cell">{Number(s.score_ai_usage)}</td>
                    <td className="ps-score-cell">{Number(s.score_presentation)}</td>
                    <td className="ps-score-cell">{Number(s.score_technical)}</td>
                    <td className="ps-score-cell">{Number(s.score_qa_defense)}</td>
                    <td className="ps-total-cell">{Number(s.total_score)}</td>
                    <td className="ps-action-cell">
                      <span className="ps-submitted-tag">✓ Submitted</span>
                    </td>
                  </tr>
                )
              })}

              {/* PENDING ROW (only if user clicked "+ Add Row") */}
              {showPendingRow && (
                <tr id="pending-row" className="row-pending">
                  <td>
                    <div className="ps-dropdown">
                      <button
                        ref={ddBtnRef}
                        className={`ps-dd-btn ${!pendingRow.teamNumber ? 'placeholder' : ''}`}
                        onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
                      >
                        <span>
                          {pendingRow.teamNumber || 'Pick team...'}
                        </span>
                        <span className="ps-dd-chev">{dropdownOpen ? '▲' : '▼'}</span>
                      </button>
                      {dropdownOpen && (
                        <div className="ps-dd-pop" ref={dropdownRef} style={{top:ddPos.top, left:ddPos.left}}>
                          <div className="ps-dd-srch">
                            <input
                              placeholder="Search team or project..."
                              value={searchQ}
                              onChange={e => setSearchQ(e.target.value)}
                              autoFocus
                            />
                          </div>
                          {filteredAvailableTeams.length === 0 ? (
                            <div className="ps-dd-empty">
                              {availableTeams.length === 0 ? 'All teams scored ✓' : 'No matches'}
                            </div>
                          ) : (
                            filteredAvailableTeams.map(t => (
                              <div
                                key={t.team_number}
                                className="ps-dd-item"
                                onClick={() => {
                                  setPendingRow(prev => ({ ...prev, teamNumber: t.team_number }))
                                  setDropdownOpen(false)
                                  setSearchQ('')
                                  setFlashMsg(null)
                                }}
                              >
                                <div className="ps-dd-item-r1">
                                  <span className="ps-dd-item-team">{t.team_number}</span>
                                  <span className="ps-tech-pill" style={{background:`${TC[t.technology]||'#888'}18`,color:TC[t.technology]||'#888',border:`1px solid ${TC[t.technology]||'#888'}30`}}>{t.technology}</span>
                                </div>
                                <div className="ps-dd-item-title" title={t.project_title}>{t.project_title || '—'}</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="ps-proj-cell" title={selectedTeamObj?.project_title}>{selectedTeamObj?.project_title || '—'}</td>
                  <td>
                    {selectedTeamObj?.technology ? (
                      <span className="ps-tech-pill" style={{background:`${TC[selectedTeamObj.technology]||'#888'}18`,color:TC[selectedTeamObj.technology]||'#888',border:`1px solid ${TC[selectedTeamObj.technology]||'#888'}30`}}>
                        {selectedTeamObj.technology}
                      </span>
                    ) : '—'}
                  </td>
                  {CRITERIA.map(c => (
                    <td key={c.key} style={{textAlign:'center'}}>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        className="ps-score-input"
                        value={pendingRow.scores[c.key]}
                        onChange={e => updateScore(c.key, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td className="ps-total-cell">{Math.round(pendingTotal * 10) / 10}</td>
                  <td className="ps-action-cell">
                    <button
                      className="ps-submit-btn"
                      disabled={submitting || !pendingRow.teamNumber}
                      onClick={submitPendingRow}
                    >
                      {submitting ? 'Saving…' : 'Submit'}
                    </button>
                  </td>
                </tr>
              )}

              {/* EMPTY STATE */}
              {(data.myScores || []).length === 0 && !showPendingRow && (
                <tr>
                  <td colSpan={10}>
                    <div className="ps-empty-state">No scores yet. Click "+ Add Row" below to start scoring.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ADD ROW button - only show if there's no pending row */}
        {!showPendingRow && (
          <div className="ps-add-row-section">
            <button
              className="ps-add-btn"
              onClick={() => {
                if (availableTeams.length === 0) {
                  setFlashMsg({ type: 'error', text: 'You have scored all teams.' })
                  return
                }
                setPendingRow({ teamNumber: '', scores: { ...EMPTY_SCORES } })
                setShowPendingRow(true)
              }}
              disabled={availableTeams.length === 0}
            >
              Add Row
            </button>
          </div>
        )}
      </div>
    </div>
  )
}