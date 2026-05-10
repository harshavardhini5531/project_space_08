'use client'
import { useState, useEffect, useRef } from 'react'

export default function ProjectPPT({ user }) {
  const roll = user?.rollNumber || user?.roll_number
  const [loading, setLoading] = useState(true)
  const [ppt, setPpt] = useState(null)
  const [isLeader, setIsLeader] = useState(false)
  const [teamNumber, setTeamNumber] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInput = useRef(null)

  async function load() {
    if (!roll) return
    setLoading(true)
    try {
      const r = await fetch('/api/uploads/ppt/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll }),
      })
      const d = await r.json()
      if (r.ok && d.ok) {
        setPpt(d.ppt || null)
        setIsLeader(d.is_leader)
        setTeamNumber(d.team_number)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [roll])

  async function handleUpload(file) {
    if (!file) return
    setError(null); setSuccess(null); setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('rollNumber', roll)
      const r = await fetch('/api/uploads/ppt/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setError(d.error || 'Upload failed')
        return
      }
      setSuccess('PPT uploaded successfully')
      setTimeout(() => setSuccess(null), 2500)
      await load()
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally { setUploading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this PPT? You can re-upload.')) return
    try {
      const r = await fetch('/api/uploads/ppt/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll }),
      })
      const d = await r.json()
      if (r.ok && d.ok) { setSuccess('Deleted'); setTimeout(() => setSuccess(null), 2000); load() }
      else setError(d.error || 'Delete failed')
    } catch { setError('Network error') }
  }

  function fmtSize(b) {
    if (!b) return '—'
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1024 / 1024).toFixed(2) + ' MB'
  }

  function fmtDate(iso) {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  return (
    <div className="pp">
      <style>{`
        .pp{font-family:'DM Sans',sans-serif;color:#fff;animation:ppIn .35s ease;max-width:780px}
        @keyframes ppIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .pp-hdr{margin-bottom:18px}
        .pp-title{font-size:1.3rem;font-weight:800;letter-spacing:-.01em}
        .pp-sub{font-size:.72rem;color:rgba(255,255,255,.45);margin-top:4px}
        .pp-help{padding:11px 14px;background:rgba(238,167,39,.05);border:1px solid rgba(238,167,39,.18);border-left:3px solid #EEA727;border-radius:0 8px 8px 0;font-size:.7rem;color:rgba(255,255,255,.75);line-height:1.55;margin-bottom:18px}
        .pp-msg{padding:10px 14px;border-radius:8px;font-size:.74rem;font-weight:600;margin-bottom:12px}
        .pp-msg.err{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}
        .pp-msg.ok{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
        .pp-card{padding:22px 24px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
        .pp-card.has-ppt{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.03)}
        .pp-uploaded-top{display:flex;align-items:center;gap:14px;margin-bottom:14px}
        .pp-icon{width:50px;height:50px;border-radius:11px;background:rgba(74,222,128,.12);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
        .pp-name{font-size:.95rem;font-weight:700;color:#fff;word-break:break-all;margin-bottom:3px}
        .pp-meta{font-size:.66rem;color:rgba(255,255,255,.55);line-height:1.5}
        .pp-empty{text-align:center;padding:30px 20px}
        .pp-empty-icon{font-size:2.5rem;margin-bottom:10px;opacity:.4}
        .pp-empty-h{font-size:.95rem;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:4px}
        .pp-empty-m{font-size:.74rem;color:rgba(255,255,255,.5);margin-bottom:18px;line-height:1.5}
        .pp-actions{display:flex;gap:8px;flex-wrap:wrap}
        .pp-btn{padding:11px 22px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;border:1px solid;transition:all .15s;display:inline-flex;align-items:center;gap:8px;text-decoration:none}
        .pp-btn-up{background:linear-gradient(135deg,#EEA727,#fd1c00);border-color:transparent;color:#fff;font-weight:800;box-shadow:0 4px 14px rgba(238,167,39,.25)}
        .pp-btn-up:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(238,167,39,.4)}
        .pp-btn-rep{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.3);color:#60a5fa}
        .pp-btn-rep:hover:not(:disabled){background:rgba(59,130,246,.18)}
        .pp-btn-dl{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);color:#4ade80}
        .pp-btn-dl:hover{background:rgba(74,222,128,.18)}
        .pp-btn-del{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.25);color:#fd1c00;padding:11px 16px}
        .pp-btn-del:hover{background:rgba(253,28,0,.15)}
        .pp-btn:disabled{opacity:.5;cursor:not-allowed}
        .pp-readonly{padding:13px 16px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:.72rem;color:rgba(255,255,255,.6);margin-top:14px;line-height:1.6}
        .pp-readonly strong{color:#EEA727}
        .pp-loading{padding:50px;text-align:center;color:rgba(255,255,255,.4);font-size:.78rem}
      `}</style>

      <div className="pp-hdr">
        <div className="pp-title">Project Presentation</div>
        <div className="pp-sub">{teamNumber || ''} · Upload your team's project PPT (PPTX/PPT · max 10 MB)</div>
      </div>

      <div className="pp-help">
        📊 {isLeader ? 'You can upload, replace, or delete the team PPT.' : 'Only the team leader can upload or modify the project PPT. You can view and download once uploaded.'}
      </div>

      {error && <div className="pp-msg err">{error}</div>}
      {success && <div className="pp-msg ok">✓ {success}</div>}

      {loading && <div className="pp-loading">Loading…</div>}

      {!loading && (
        <div className={`pp-card ${ppt ? 'has-ppt' : ''}`}>
          <input
            ref={fileInput} type="file" accept=".pptx,.ppt"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
              e.target.value = ''
            }}
          />

          {ppt ? (
            <>
              <div className="pp-uploaded-top">
                <div className="pp-icon">📊</div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="pp-name">{ppt.file_name}</div>
                  <div className="pp-meta">{fmtSize(ppt.file_size)} · uploaded by <strong style={{color:'#EEA727'}}>{ppt.uploaded_by_name || ppt.uploaded_by_roll}</strong></div>
                  <div className="pp-meta" style={{marginTop:2}}>{fmtDate(ppt.uploaded_at)}{ppt.updated_at && ppt.updated_at !== ppt.uploaded_at ? ` · last updated ${fmtDate(ppt.updated_at)}` : ''}</div>
                </div>
              </div>
              <div className="pp-actions">
                <a href={ppt.url} target="_blank" rel="noopener noreferrer" className="pp-btn pp-btn-dl" download={ppt.file_name}>
                  ↓ Download
                </a>
                {isLeader && (
                  <>
                    <button className="pp-btn pp-btn-rep" onClick={() => fileInput.current?.click()} disabled={uploading}>
                      {uploading ? '⏳ Uploading…' : '↑ Replace PPT'}
                    </button>
                    <button className="pp-btn pp-btn-del" onClick={handleDelete}>✕ Delete</button>
                  </>
                )}
              </div>
              {!isLeader && (
                <div className="pp-readonly">
                  Only the team leader can replace or delete this PPT. If updates are needed, contact your team leader.
                </div>
              )}
            </>
          ) : (
            <div className="pp-empty">
              <div className="pp-empty-icon">📊</div>
              <div className="pp-empty-h">No PPT uploaded yet</div>
              <div className="pp-empty-m">
                {isLeader
                  ? 'Upload your team\'s project presentation (PPTX or PPT, max 10 MB).'
                  : 'Your team leader hasn\'t uploaded the project PPT yet.'}
              </div>
              {isLeader && (
                <button className="pp-btn pp-btn-up" onClick={() => fileInput.current?.click()} disabled={uploading}>
                  {uploading ? '⏳ Uploading…' : '↑ Upload Project PPT'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}