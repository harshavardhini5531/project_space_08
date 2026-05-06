'use client'
import { useState, useEffect, useRef } from 'react'

// Admin attendance dashboard
// Place at: app/admin/components/AdminAttendance.js
export default function AdminAttendance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ technology: '', mentor: '', mode: '', date: '' })
  const [view, setView] = useState('overview') // overview | mentors | teams | students | upload
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [manualRolls, setManualRolls] = useState('')
  const [manualMode, setManualMode] = useState('dark')
  const [manualDate, setManualDate] = useState('')
  const [manualResult, setManualResult] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const fileRef = useRef(null)

  async function handleSync(type = 'both') {
    setSyncing(true)
    setSyncMsg('Syncing attendance...')
    try {
      const r = await fetch('/api/attendance/manual-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const d = await r.json()
      if (d.success) {
        const s = d.results.student
        const m = d.results.mentor
        const parts = []
        if (s) parts.push(`Students: +${s.inserted} (${s.api_total} from API)`)
        if (m) parts.push(`Mentors: +${m.inserted} (${m.mentor_count} matched)`)
        setSyncMsg('✓ ' + parts.join(' · '))
        fetchData()
      } else {
        setSyncMsg('✗ ' + (d.error || 'Sync failed'))
      }
    } catch (e) {
      setSyncMsg('✗ ' + e.message)
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 10000)
  }

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 60000)
    return () => clearInterval(iv)
  }, [filters])

  async function fetchData() {
    try {
      const r = await fetch('/api/attendance/admin-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      })
      const d = await r.json()
      setData(d)
    } catch (e) {
      console.error('Admin attendance error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setUploadResult({ error: 'Pick a file first' }); return }
    const date = filters.date || data?.target_date || new Date().toISOString().split('T')[0]
    setUploading(true)
    setUploadResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('date', date)
      const r = await fetch('/api/attendance/upload-dark-mode', { method: 'POST', body: fd })
      const j = await r.json()
      setUploadResult(j)
      if (j.ok) { fileRef.current.value = ''; fetchData() }
    } catch (e) {
      setUploadResult({ error: e.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleManualMark() {
    const rolls = manualRolls.split(/[\s,]+/).filter(Boolean)
    if (rolls.length === 0) { setManualResult({ error: 'Paste at least one roll number' }); return }
    const date = manualDate || data?.target_date || new Date().toISOString().split('T')[0]
    setManualResult(null)
    try {
      const r = await fetch('/api/attendance/mark-dark-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumbers: rolls, date, mode: manualMode }),
      })
      const j = await r.json()
      setManualResult(j)
      if (j.ok) { setManualRolls(''); fetchData() }
    } catch (e) {
      setManualResult({ error: e.message })
    }
  }

  if (loading && !data) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>Loading attendance dashboard...</div>
  if (!data) return <div style={{padding:60,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No data</div>

  const { stats, mode_stats, modes_meta, mentors, teams, students, filter_options, target_date } = data

  const MODE_COLORS = {
    light:  { fg: '#EEA727', bg: 'rgba(238,167,39,.1)', bd: 'rgba(238,167,39,.3)' },
    bright: { fg: '#fd1c00', bg: 'rgba(253,28,0,.1)',   bd: 'rgba(253,28,0,.3)'   },
    dark:   { fg: '#7B2FBE', bg: 'rgba(123,47,190,.1)', bd: 'rgba(123,47,190,.3)' },
    moon:   { fg: '#3b82f6', bg: 'rgba(59,130,246,.1)', bd: 'rgba(59,130,246,.3)' },
  }

  // Apply search filter on top of API filter
  const q = searchQuery.toLowerCase().trim()
  const filteredMentors = q ? mentors.filter(m => m.name.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)) : mentors
  const filteredTeams = q ? teams.filter(t => t.team_number.toLowerCase().includes(q) || (t.project_title||'').toLowerCase().includes(q) || (t.mentor||'').toLowerCase().includes(q)) : teams
  const filteredStudents = q ? students.filter(s => s.name?.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q) || (s.team_number||'').toLowerCase().includes(q)) : students

  const VIEWS = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'mentors', label: `Mentors (${mentors.length})`, icon: 'users' },
    { id: 'teams', label: `Teams (${teams.length})`, icon: 'box' },
    { id: 'students', label: `Students (${students.length})`, icon: 'student' },
    { id: 'upload', label: 'Upload Dark Mode', icon: 'upload' },
  ]

  return (
    <div className="aa-wrap">
      <style>{`
        .aa-wrap{animation:aaIn .5s ease both;font-family:'DM Sans',sans-serif}
        @keyframes aaIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes aa-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}

        .aa-hdr{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:20px;flex-wrap:wrap}
        .aa-hdr-left h2{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.2rem;font-weight:800;color:#fff;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:3px}
        .aa-hdr-sub{font-size:.7rem;color:rgba(255,255,255,.4);font-weight:500}
        .aa-hdr-date{font-family:'Astro','Orbitron','DM Sans',sans-serif;padding:9px 16px;border-radius:11px;background:linear-gradient(135deg,rgba(253,28,0,.1),rgba(238,167,39,.05));border:1px solid rgba(253,28,0,.2);font-size:.78rem;font-weight:700;color:#fd1c00;letter-spacing:.5px}

        /* View tabs */
        .aa-tabs{display:flex;gap:5px;padding:5px;border-radius:13px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);margin-bottom:18px;overflow-x:auto}
        .aa-tabs::-webkit-scrollbar{display:none}
        .aa-tab{padding:9px 16px;border-radius:9px;background:transparent;border:none;color:rgba(255,255,255,.45);font-family:'DM Sans',sans-serif;font-size:.74rem;font-weight:600;cursor:pointer;transition:all .25s;white-space:nowrap;letter-spacing:.5px}
        .aa-tab:hover{color:#fff;background:rgba(255,255,255,.04)}
        .aa-tab.active{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08));color:#fff;box-shadow:0 2px 12px rgba(253,28,0,.1)}

        /* Filters */
        .aa-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:center;padding:12px 14px;border-radius:12px;background:rgba(12,8,18,.4);border:1px solid rgba(255,255,255,.05)}
        .aa-filter-lb{font-size:.58rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-right:4px}
        .aa-filter-input,.aa-filter-select{padding:8px 12px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.72rem;outline:none;font-weight:500}
        .aa-filter-input:focus,.aa-filter-select:focus{border-color:rgba(253,28,0,.3)}
        .aa-filter-input::placeholder{color:rgba(255,255,255,.25)}
        .aa-clear-btn{padding:8px 12px;border-radius:9px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.2);color:#fd1c00;font-size:.66rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.5px}
        .aa-clear-btn:hover{background:rgba(253,28,0,.12)}

        /* Stat cards */
        .aa-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:18px}
        .aa-stat{padding:16px 18px;border-radius:13px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06);position:relative;overflow:hidden}
        .aa-stat-lb{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px}
        .aa-stat-val{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:1px;line-height:1}
        .aa-stat-sub{font-size:.6rem;color:rgba(255,255,255,.35);margin-top:5px}
        .aa-stat-bar{height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:10px}
        .aa-stat-bar-fill{height:100%;border-radius:3px;transition:width .6s}

        /* Mode cards */
        .aa-mode-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:18px}
        .aa-mode-card{padding:16px 18px;border-radius:13px;background:rgba(12,8,18,.55);border:1px solid var(--bd)}
        .aa-mode-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .aa-mode-name{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:var(--fg)}
        .aa-mode-window{font-size:.58rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px}
        .aa-mode-cnts{display:flex;gap:14px;margin-top:10px}
        .aa-mode-cnt{flex:1}
        .aa-mode-cnt-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.2rem;font-weight:800;line-height:1;letter-spacing:.5px}
        .aa-mode-cnt-lb{font-size:.5rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:4px}

        /* Section title */
        .aa-section-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px}
        .aa-section-title::before{content:'';width:3px;height:14px;background:linear-gradient(180deg,#fd1c00,#faa000);border-radius:2px;box-shadow:0 0 10px rgba(253,28,0,.5)}

        /* Search */
        .aa-search{position:relative;margin-bottom:14px}
        .aa-search input{width:100%;padding:10px 16px 10px 36px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;outline:none}
        .aa-search input:focus{border-color:rgba(253,28,0,.3)}
        .aa-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.3)}

        /* Mentor table */
        .aa-mentor-row{display:flex;align-items:center;gap:14px;padding:13px 18px;border-radius:11px;background:rgba(12,8,18,.4);border:1px solid rgba(255,255,255,.05);margin-bottom:6px;transition:all .25s;flex-wrap:wrap}
        .aa-mentor-row:hover{border-color:rgba(255,255,255,.1)}
        .aa-mr-photo{width:40px;height:40px;border-radius:10px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,rgba(238,167,39,.15),rgba(253,28,0,.05))}
        .aa-mr-photo img{width:100%;height:100%;object-fit:cover}
        .aa-mr-photo-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Astro',sans-serif;font-size:.92rem;font-weight:800;color:#EEA727}
        .aa-mr-info{flex:1;min-width:160px}
        .aa-mr-name{font-size:.82rem;font-weight:700;color:#fff;margin-bottom:2px}
        .aa-mr-tech{font-size:.6rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.5px}
        .aa-mr-pill{padding:5px 11px;border-radius:7px;font-size:.55rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;flex-shrink:0}
        .aa-mr-pill.present{background:rgba(74,222,128,.1);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
        .aa-mr-pill.absent{background:rgba(253,28,0,.1);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}
        .aa-mr-stats{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap}
        .aa-mr-stat{display:flex;flex-direction:column;align-items:center;padding:5px 11px;border-radius:8px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);min-width:48px}
        .aa-mr-stat-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:.5px;line-height:1}
        .aa-mr-stat-lb{font-size:.48rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:3px}

        /* Team card (expandable) */
        .aa-team{border-radius:13px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);overflow:hidden;margin-bottom:8px;transition:all .35s}
        .aa-team:hover{border-color:rgba(255,255,255,.1)}
        .aa-team.expanded{border-color:rgba(253,28,0,.2)}
        .aa-team-hdr{display:flex;align-items:center;gap:14px;padding:14px 18px;cursor:pointer;flex-wrap:wrap}
        .aa-team-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;padding:7px 12px;border-radius:9px;background:linear-gradient(135deg,rgba(253,28,0,.12),rgba(238,167,39,.06));border:1px solid rgba(253,28,0,.25);font-size:.74rem;font-weight:800;color:#fd1c00;letter-spacing:1px;flex-shrink:0}
        .aa-team-info{flex:1;min-width:200px}
        .aa-team-title{font-size:.78rem;font-weight:700;color:#fff;line-height:1.3;margin-bottom:3px}
        .aa-team-meta{font-size:.6rem;color:rgba(255,255,255,.4);font-weight:600;letter-spacing:.3px}
        .aa-team-counts{display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap}
        .aa-team-count{padding:5px 10px;border-radius:8px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);text-align:center;min-width:42px}
        .aa-team-count.t{background:rgba(255,255,255,.04)}
        .aa-team-count.p{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.15)}
        .aa-team-count.a{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.15)}
        .aa-team-count-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.85rem;font-weight:800;letter-spacing:.5px;line-height:1}
        .aa-team-count-lb{font-size:.46rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-top:3px}
        .aa-team-pct{font-family:'Astro','Orbitron','DM Sans',sans-serif;padding:6px 13px;border-radius:9px;font-size:.95rem;font-weight:800;letter-spacing:.5px;flex-shrink:0;border:1px solid;min-width:60px;text-align:center}
        .aa-team-toggle{flex-shrink:0;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);transition:all .3s}
        .aa-team.expanded .aa-team-toggle{transform:rotate(180deg);color:#fd1c00}

        .aa-team-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s}
        .aa-team.expanded .aa-team-body{grid-template-rows:1fr}
        .aa-team-body-inner{overflow:hidden;min-height:0}
        .aa-team-body-content{padding:0 18px 16px}
        .aa-list-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.05)}
        .aa-list-col-title{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
        .aa-list-col-title.p{color:#4ade80}
        .aa-list-col-title.a{color:#fd1c00}
        .aa-list-name{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);font-size:.68rem;color:rgba(255,255,255,.7);margin-bottom:4px;font-weight:500}
        .aa-list-name.p{background:rgba(74,222,128,.04);border-color:rgba(74,222,128,.12)}
        .aa-list-name.a{background:rgba(253,28,0,.04);border-color:rgba(253,28,0,.12)}
        .aa-list-name-roll{font-size:.55rem;color:rgba(255,255,255,.3);margin-left:auto;font-weight:600;letter-spacing:.5px}

        /* Student row */
        .aa-student-row{display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:10px;background:rgba(12,8,18,.4);border:1px solid rgba(255,255,255,.05);margin-bottom:4px;flex-wrap:wrap}
        .aa-student-row.absent{border-color:rgba(253,28,0,.15);background:rgba(253,28,0,.02)}
        .aa-student-name{flex:1;min-width:160px;font-size:.74rem;color:#fff;font-weight:600}
        .aa-student-name small{display:block;font-size:.54rem;color:rgba(255,255,255,.35);font-weight:500;margin-top:2px;letter-spacing:.5px}
        .aa-student-team{font-size:.6rem;color:#fd1c00;font-weight:700;letter-spacing:.5px}
        .aa-student-modes{display:flex;gap:4px}
        .aa-student-status{padding:4px 10px;border-radius:7px;font-size:.52rem;font-weight:700;letter-spacing:1px;text-transform:uppercase}

        /* Upload section */
        .aa-upload{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .aa-upload-card{padding:20px;border-radius:14px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06)}
        .aa-upload-card h3{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:.92rem;font-weight:800;color:#fff;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px}
        .aa-upload-card p{font-size:.7rem;color:rgba(255,255,255,.5);margin-bottom:14px;line-height:1.5}
        .aa-upload-input{display:block;width:100%;padding:18px;border-radius:10px;background:rgba(255,255,255,.03);border:2px dashed rgba(253,28,0,.25);color:rgba(255,255,255,.5);text-align:center;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.74rem;margin-bottom:10px}
        .aa-upload-input:hover{border-color:rgba(253,28,0,.5);background:rgba(253,28,0,.03)}
        .aa-textarea{width:100%;min-height:130px;padding:12px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;font-family:'DM Sans',monospace;font-size:.74rem;outline:none;resize:vertical;margin-bottom:10px;line-height:1.5}
        .aa-textarea:focus{border-color:rgba(253,28,0,.3)}
        .aa-row-2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
        .aa-btn-primary{width:100%;padding:11px 18px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#c41600);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;letter-spacing:.5px;text-transform:uppercase;box-shadow:0 4px 14px rgba(253,28,0,.3)}
        .aa-btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .aa-result{margin-top:10px;padding:10px 12px;border-radius:9px;font-size:.7rem;font-weight:600}
        .aa-result.ok{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.25);color:#4ade80}
        .aa-result.err{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.25);color:#fd1c00}

        @media(max-width:900px){
          .aa-upload{grid-template-columns:1fr}
          .aa-mode-grid{grid-template-columns:1fr 1fr}
        }
        @media(max-width:768px){
          .aa-team-counts{display:none}
          .aa-team-pct{padding:5px 10px;min-width:50px}
          .aa-list-cols{grid-template-columns:1fr}
          .aa-mr-stats{display:none}
        }
      `}</style>

      {/* Header */}
      <div className="aa-hdr">
        <div className="aa-hdr-left">
          <h2>Attendance Dashboard</h2>
          <div className="aa-hdr-sub">Mode-wise tracking · Real-time · Project Space 2026</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          {syncMsg && (
            <div style={{
              fontSize:'.68rem',
              fontWeight:600,
              padding:'6px 11px',
              borderRadius:8,
              background: syncMsg.startsWith('✓') ? 'rgba(74,222,128,.08)' : syncMsg.startsWith('✗') ? 'rgba(253,28,0,.08)' : 'rgba(238,167,39,.08)',
              border: `1px solid ${syncMsg.startsWith('✓') ? 'rgba(74,222,128,.25)' : syncMsg.startsWith('✗') ? 'rgba(253,28,0,.25)' : 'rgba(238,167,39,.25)'}`,
              color: syncMsg.startsWith('✓') ? '#4ade80' : syncMsg.startsWith('✗') ? '#fd1c00' : '#EEA727',
              maxWidth:340,
              letterSpacing:'.3px',
            }}>{syncMsg}</div>
          )}
          <button
            onClick={()=>handleSync('both')}
            disabled={syncing}
            style={{
              display:'flex',
              alignItems:'center',
              gap:7,
              padding:'9px 16px',
              borderRadius:11,
              background: syncing
                ? 'rgba(253,28,0,.15)'
                : 'linear-gradient(135deg,rgba(253,28,0,.12),rgba(238,167,39,.06))',
              border: '1px solid rgba(253,28,0,.3)',
              color: syncing ? 'rgba(255,255,255,.5)' : '#fd1c00',
              fontFamily:"'Astro','Orbitron','DM Sans',sans-serif",
              fontSize:'.7rem',
              fontWeight:700,
              letterSpacing:'1px',
              textTransform:'uppercase',
              cursor: syncing ? 'wait' : 'pointer',
              transition:'all .25s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation: syncing ? 'aa-spin 1s linear infinite' : 'none'}}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <div className="aa-hdr-date">{new Date(target_date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
      </div>

      {/* View tabs */}
      <div className="aa-tabs">
        {VIEWS.map(v => (
          <button key={v.id} className={`aa-tab ${view===v.id?'active':''}`} onClick={()=>setView(v.id)}>{v.label}</button>
        ))}
      </div>

      {/* Filters (hide on upload tab) */}
      {view !== 'upload' && (
        <div className="aa-filters">
          <span className="aa-filter-lb">Filters</span>
          <input
            type="date"
            className="aa-filter-input"
            value={filters.date || target_date}
            onChange={e => setFilters({...filters, date: e.target.value})}
          />
          <select className="aa-filter-select" value={filters.technology} onChange={e => setFilters({...filters, technology: e.target.value})}>
            <option value="">All Technologies</option>
            {filter_options.technologies.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="aa-filter-select" value={filters.mentor} onChange={e => setFilters({...filters, mentor: e.target.value})}>
            <option value="">All Mentors</option>
            {filter_options.mentors.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="aa-filter-select" value={filters.mode} onChange={e => setFilters({...filters, mode: e.target.value})}>
            <option value="">All Modes</option>
            {filter_options.modes.map(m => <option key={m} value={m}>{modes_meta[m]?.label}</option>)}
          </select>
          {(filters.technology || filters.mentor || filters.mode || filters.date) && (
            <button className="aa-clear-btn" onClick={()=>setFilters({technology:'', mentor:'', mode:'', date:''})}>✕ Clear</button>
          )}
        </div>
      )}

      {/* OVERVIEW */}
      {view === 'overview' && (
        <>
          <div className="aa-stats">
            <div className="aa-stat">
              <div className="aa-stat-lb">Total Students</div>
              <div className="aa-stat-val" style={{color:'#fff'}}>{stats.total_students}</div>
              <div className="aa-stat-sub">In {stats.total_teams} teams</div>
            </div>
            <div className="aa-stat">
              <div className="aa-stat-lb">Students Present</div>
              <div className="aa-stat-val" style={{color:'#4ade80'}}>{stats.present_students}</div>
              <div className="aa-stat-bar"><div className="aa-stat-bar-fill" style={{width:`${stats.student_pct}%`,background:'linear-gradient(90deg,#4ade80,#22c55e)'}}/></div>
            </div>
            <div className="aa-stat">
              <div className="aa-stat-lb">Students Absent</div>
              <div className="aa-stat-val" style={{color:'#fd1c00'}}>{stats.absent_students}</div>
              <div className="aa-stat-sub">Need follow-up</div>
            </div>
            <div className="aa-stat">
              <div className="aa-stat-lb">Mentors Present</div>
              <div className="aa-stat-val" style={{color:'#EEA727'}}>{stats.present_mentors}<span style={{fontSize:'.7rem',opacity:.4,marginLeft:4}}>/{stats.total_mentors}</span></div>
              <div className="aa-stat-bar"><div className="aa-stat-bar-fill" style={{width:`${stats.mentor_pct}%`,background:'linear-gradient(90deg,#EEA727,#fd1c00)'}}/></div>
            </div>
            <div className="aa-stat">
              <div className="aa-stat-lb">Overall Pct</div>
              <div className="aa-stat-val" style={{color: stats.student_pct>=75?'#4ade80':stats.student_pct>=50?'#EEA727':'#fd1c00'}}>{stats.student_pct}%</div>
              <div className="aa-stat-sub">Today's turnout</div>
            </div>
          </div>

          {/* Mode breakdown */}
          <div className="aa-section-title">Mode-wise Breakdown</div>
          <div className="aa-mode-grid">
            {Object.entries(mode_stats).map(([mode, m]) => (
              <div key={mode} className="aa-mode-card" style={{'--fg':MODE_COLORS[mode].fg, '--bd':MODE_COLORS[mode].bd}}>
                <div className="aa-mode-hdr">
                  <div>
                    <div className="aa-mode-name">{m.label} Mode</div>
                    <div className="aa-mode-window">{m.window}</div>
                  </div>
                </div>
                <div className="aa-mode-cnts">
                  <div className="aa-mode-cnt">
                    <div className="aa-mode-cnt-num" style={{color:'#4ade80'}}>{m.students_present}</div>
                    <div className="aa-mode-cnt-lb">Students In</div>
                  </div>
                  <div className="aa-mode-cnt">
                    <div className="aa-mode-cnt-num" style={{color:'#fd1c00'}}>{m.students_missed}</div>
                    <div className="aa-mode-cnt-lb">Missed</div>
                  </div>
                  <div className="aa-mode-cnt">
                    <div className="aa-mode-cnt-num" style={{color:'#EEA727'}}>{m.mentors_present}</div>
                    <div className="aa-mode-cnt-lb">Mentors In</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MENTORS view */}
      {view === 'mentors' && (
        <>
          <div className="aa-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by name or email..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          {filteredMentors.length === 0 && <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No mentors</div>}
          {filteredMentors.map(m => (
            <div key={m.id} className="aa-mentor-row">
              <div className="aa-mr-photo">
                {m.image_url
                  ? <img src={m.image_url} alt={m.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>
                  : null}
                <div className="aa-mr-photo-fb" style={{display:m.image_url?'none':'flex'}}>{(m.name||'?').charAt(0).toUpperCase()}</div>
              </div>
              <div className="aa-mr-info">
                <div className="aa-mr-name">{m.name}</div>
                <div className="aa-mr-tech">{m.technology} · {m.team_count} teams · {m.student_count} students</div>
              </div>
              <span className={`aa-mr-pill ${m.self_present?'present':'absent'}`}>
                {m.self_present ? `Present ${m.self_count}/4` : 'Absent'}
              </span>
              <div className="aa-mr-stats">
                <div className="aa-mr-stat">
                  <div className="aa-mr-stat-num" style={{color:'#4ade80'}}>{m.students_present}</div>
                  <div className="aa-mr-stat-lb">Present</div>
                </div>
                <div className="aa-mr-stat">
                  <div className="aa-mr-stat-num" style={{color:'#fd1c00'}}>{m.students_absent}</div>
                  <div className="aa-mr-stat-lb">Absent</div>
                </div>
                <div className="aa-mr-stat" style={{borderColor:m.mentorship_pct>=75?'rgba(74,222,128,.25)':'rgba(253,28,0,.25)'}}>
                  <div className="aa-mr-stat-num" style={{color: m.mentorship_pct>=75?'#4ade80':m.mentorship_pct>=50?'#EEA727':'#fd1c00'}}>{m.mentorship_pct}%</div>
                  <div className="aa-mr-stat-lb">Score</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* TEAMS view */}
      {view === 'teams' && (
        <>
          <div className="aa-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search team number, project, or mentor..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          {filteredTeams.length === 0 && <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No teams</div>}
          {filteredTeams.map(team => {
            const isExpanded = expandedTeam === team.team_number
            return (
              <div key={team.team_number} className={`aa-team ${isExpanded?'expanded':''}`}>
                <div className="aa-team-hdr" onClick={()=>setExpandedTeam(isExpanded?null:team.team_number)}>
                  <div className="aa-team-num">{team.team_number}</div>
                  <div className="aa-team-info">
                    <div className="aa-team-title">{team.project_title || 'Untitled'}</div>
                    <div className="aa-team-meta">{team.technology} · {team.mentor || 'No mentor'}</div>
                  </div>
                  <div className="aa-team-counts">
                    <div className="aa-team-count t">
                      <div className="aa-team-count-num" style={{color:'#fff'}}>{team.total_members}</div>
                      <div className="aa-team-count-lb">Total</div>
                    </div>
                    <div className="aa-team-count p">
                      <div className="aa-team-count-num" style={{color:'#4ade80'}}>{team.present_count}</div>
                      <div className="aa-team-count-lb">Present</div>
                    </div>
                    <div className="aa-team-count a">
                      <div className="aa-team-count-num" style={{color:'#fd1c00'}}>{team.absent_count}</div>
                      <div className="aa-team-count-lb">Absent</div>
                    </div>
                  </div>
                  <div className="aa-team-pct" style={{color: team.attendance_pct>=75?'#4ade80':team.attendance_pct>=50?'#EEA727':'#fd1c00', borderColor: team.attendance_pct>=75?'rgba(74,222,128,.25)':team.attendance_pct>=50?'rgba(238,167,39,.25)':'rgba(253,28,0,.25)'}}>{team.attendance_pct}%</div>
                  <div className="aa-team-toggle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div className="aa-team-body">
                  <div className="aa-team-body-inner">
                    <div className="aa-team-body-content">
                      <div className="aa-list-cols">
                        <div>
                          <div className="aa-list-col-title p">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Present ({team.presentees.length})
                          </div>
                          {team.presentees.length === 0 && <div style={{fontSize:'.66rem',color:'rgba(255,255,255,.3)',padding:'10px 0'}}>None</div>}
                          {team.presentees.map(p => (
                            <div key={p.roll} className="aa-list-name p">
                              <span>{p.name || p.roll}</span>
                              <div style={{display:'flex',gap:3,marginLeft:'auto'}}>
                                {p.modes.map(mode => <span key={mode} style={{width:6,height:6,borderRadius:'50%',background:MODE_COLORS[mode].fg,boxShadow:`0 0 4px ${MODE_COLORS[mode].fg}`}}/>)}
                              </div>
                              <span className="aa-list-name-roll">{p.roll}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="aa-list-col-title a">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Absent ({team.absentees.length})
                          </div>
                          {team.absentees.length === 0 && <div style={{fontSize:'.66rem',color:'#4ade80',padding:'10px 0',fontWeight:600}}>✓ All present</div>}
                          {team.absentees.map(a => (
                            <div key={a.roll} className="aa-list-name a">
                              <span>{a.name || a.roll}</span>
                              <span className="aa-list-name-roll">{a.roll}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* STUDENTS view */}
      {view === 'students' && (
        <>
          <div className="aa-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search name, roll, or team..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          {filteredStudents.length === 0 && <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.3)'}}>No students</div>}
          {filteredStudents.slice(0, 200).map(s => (
            <div key={s.roll_number} className={`aa-student-row ${!s.is_present?'absent':''}`}>
              <div className="aa-student-name">
                {s.name || s.roll_number}
                <small>{s.roll_number} · {s.technology}</small>
              </div>
              <span className="aa-student-team">{s.team_number}</span>
              <div className="aa-student-modes">
                {['light','bright','dark','moon'].map(mode => {
                  const on = s.present_modes.includes(mode)
                  return <div key={mode} style={{width:9,height:9,borderRadius:'50%',background: on ? MODE_COLORS[mode].fg : 'rgba(255,255,255,.1)', boxShadow: on ? `0 0 6px ${MODE_COLORS[mode].fg}` : 'none'}} title={`${mode}: ${on?'present':'missed'}`}/>
                })}
              </div>
              <span className="aa-student-status" style={{background: s.is_present?'rgba(74,222,128,.1)':'rgba(253,28,0,.1)', color: s.is_present?'#4ade80':'#fd1c00', border: `1px solid ${s.is_present?'rgba(74,222,128,.25)':'rgba(253,28,0,.25)'}`}}>
                {s.is_present ? `${s.present_count}/4` : 'Absent'}
              </span>
            </div>
          ))}
          {filteredStudents.length > 200 && (
            <div style={{padding:14,textAlign:'center',fontSize:'.7rem',color:'rgba(255,255,255,.4)'}}>
              Showing first 200 of {filteredStudents.length} — refine your filters or search
            </div>
          )}
        </>
      )}

      {/* UPLOAD view */}
      {view === 'upload' && (
        <div className="aa-upload">
          {/* Excel Upload */}
          <div className="aa-upload-card">
            <h3>Excel Upload — Dark Mode</h3>
            <p>Upload an Excel file (.xlsx) with roll numbers in column A, one per row. All listed students will be marked present for Dark Mode (5:30 – 6:30 PM) on the selected date.</p>
            <input type="date" className="aa-filter-input" value={filters.date || target_date} onChange={e=>setFilters({...filters, date: e.target.value})} style={{width:'100%',marginBottom:10}}/>
            <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" className="aa-upload-input"/>
            <button className="aa-btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Mark Dark Mode'}
            </button>
            {uploadResult && (
              <div className={`aa-result ${uploadResult.ok?'ok':'err'}`}>
                {uploadResult.ok
                  ? `✓ Inserted: ${uploadResult.inserted} · Skipped (already exists): ${uploadResult.skipped} · Total in file: ${uploadResult.total_in_file}`
                  : `✗ ${uploadResult.error}`}
              </div>
            )}
          </div>

          {/* Manual paste */}
          <div className="aa-upload-card">
            <h3>Quick Manual Mark</h3>
            <p>Paste roll numbers (comma, space, or newline separated). Choose mode and date.</p>
            <div className="aa-row-2">
              <select className="aa-filter-select" value={manualMode} onChange={e=>setManualMode(e.target.value)} style={{width:'100%'}}>
                <option value="dark">Dark Mode (5:30 PM)</option>
                <option value="light">Light Mode (9 AM)</option>
                <option value="bright">Bright Mode (1 PM)</option>
                <option value="moon">Moon Mode (8 PM)</option>
              </select>
              <input type="date" className="aa-filter-input" value={manualDate || target_date} onChange={e=>setManualDate(e.target.value)} style={{width:'100%'}}/>
            </div>
            <textarea className="aa-textarea" placeholder="23A91A61G9&#10;24P31A4211&#10;..." value={manualRolls} onChange={e=>setManualRolls(e.target.value)}/>
            <button className="aa-btn-primary" onClick={handleManualMark}>Mark Present</button>
            {manualResult && (
              <div className={`aa-result ${manualResult.ok?'ok':'err'}`}>
                {manualResult.ok
                  ? `✓ Inserted: ${manualResult.inserted} · Skipped: ${manualResult.skipped}`
                  : `✗ ${manualResult.error}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}