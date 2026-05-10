'use client'
import { useState, useEffect, useRef } from 'react'

export default function MyCertificates({ user }) {
  const roll = user?.rollNumber || user?.roll_number
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState([])
  const [uploadingType, setUploadingType] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const fileInputs = useRef({})

  async function loadSlots() {
    if (!roll) return
    setLoading(true)
    try {
      const r = await fetch('/api/uploads/cert/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll }),
      })
      const d = await r.json()
      if (r.ok && d.ok) setSlots(d.slots || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadSlots() /* eslint-disable-next-line */ }, [roll])

  async function handleUpload(certType, file) {
    if (!file) return
    setError(null); setSuccess(null); setUploadingType(certType)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('rollNumber', roll)
      fd.append('certType', certType)
      const r = await fetch('/api/uploads/cert/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setError(d.error || 'Upload failed')
        return
      }
      setSuccess(`${certType.replace(/_/g, ' ')} uploaded`)
      setTimeout(() => setSuccess(null), 2500)
      await loadSlots()
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally { setUploadingType(null) }
  }

  async function handleDelete(certType) {
    if (!confirm('Delete this certificate? You can re-upload.')) return
    try {
      const r = await fetch('/api/uploads/cert/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll, certType }),
      })
      const d = await r.json()
      if (r.ok && d.ok) {
        setSuccess('Deleted')
        setTimeout(() => setSuccess(null), 2000)
        loadSlots()
      } else setError(d.error || 'Delete failed')
    } catch (e) { setError('Network error') }
  }

  function fmtSize(b) {
    if (!b) return '—'
    if (b < 1024) return b + ' B'
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB'
    return (b / 1024 / 1024).toFixed(2) + ' MB'
  }

  function fmtDate(iso) {
    if (!iso) return ''
    try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  const uploadedCount = slots.filter(s => s.uploaded).length
  const total = slots.length || 4

  return (
    <div className="mc">
      <style>{`
        .mc{font-family:'DM Sans',sans-serif;color:#fff;animation:mcIn .35s ease}
        @keyframes mcIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .mc-hdr{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px;flex-wrap:wrap;gap:12px}
        .mc-title{font-size:1.3rem;font-weight:800;letter-spacing:-.01em}
        .mc-sub{font-size:.72rem;color:rgba(255,255,255,.45);margin-top:3px}
        .mc-progress{display:flex;align-items:center;gap:14px;padding:11px 18px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}
        .mc-progress-num{font-size:1.5rem;font-weight:800;color:#fd1c00;line-height:1}
        .mc-progress-num strong{color:#4ade80}
        .mc-progress-l{font-size:.62rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.1px;font-weight:700}
        .mc-progress-bar{width:140px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
        .mc-progress-fill{height:100%;background:linear-gradient(90deg,#4ade80,#EEA727);border-radius:3px;transition:width .3s}
        .mc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        @media(max-width:780px){.mc-grid{grid-template-columns:1fr}}
        .mc-card{padding:18px 20px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:11px;transition:all .2s}
        .mc-card.uploaded{border-color:rgba(74,222,128,.25);background:rgba(74,222,128,.03)}
        .mc-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
        .mc-cert-l{font-size:.95rem;font-weight:700;line-height:1.3;flex:1}
        .mc-cert-tag{font-size:.6rem;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.2px;margin-top:3px}
        .mc-status{padding:3px 10px;border-radius:6px;font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;flex-shrink:0}
        .mc-status.uploaded{background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.3)}
        .mc-status.empty{background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.08)}
        .mc-info{padding:10px 12px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.04)}
        .mc-info-name{font-size:.78rem;color:#fff;word-break:break-all;margin-bottom:4px}
        .mc-info-meta{font-size:.65rem;color:rgba(255,255,255,.5)}
        .mc-empty-msg{padding:14px;background:rgba(255,255,255,.02);border-radius:8px;border:1px dashed rgba(255,255,255,.1);text-align:center;font-size:.74rem;color:rgba(255,255,255,.45)}
        .mc-actions{display:flex;gap:7px}
        .mc-btn{padding:9px 14px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:.7rem;font-weight:700;cursor:pointer;border:1px solid;transition:all .15s;flex:1;display:flex;align-items:center;justify-content:center;gap:6px}
        .mc-btn-upload{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.3);color:#EEA727}
        .mc-btn-upload:hover:not(:disabled){background:rgba(238,167,39,.18)}
        .mc-btn-replace{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.3);color:#60a5fa}
        .mc-btn-replace:hover:not(:disabled){background:rgba(59,130,246,.18)}
        .mc-btn-view{background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.3);color:#4ade80;text-decoration:none}
        .mc-btn-view:hover{background:rgba(74,222,128,.18)}
        .mc-btn-del{background:rgba(253,28,0,.06);border-color:rgba(253,28,0,.25);color:#fd1c00;flex:0;padding:9px 12px}
        .mc-btn-del:hover{background:rgba(253,28,0,.15)}
        .mc-btn:disabled{opacity:.5;cursor:not-allowed}
        .mc-help{padding:11px 14px;background:rgba(168,85,247,.05);border:1px solid rgba(168,85,247,.18);border-left:3px solid #c084fc;border-radius:0 8px 8px 0;font-size:.7rem;color:rgba(255,255,255,.7);line-height:1.55;margin-bottom:14px}
        .mc-msg{padding:10px 14px;border-radius:8px;font-size:.74rem;font-weight:600;margin-bottom:14px}
        .mc-msg.err{background:rgba(253,28,0,.08);color:#fd1c00;border:1px solid rgba(253,28,0,.25)}
        .mc-msg.ok{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.25)}
        .mc-loading{padding:50px;text-align:center;color:rgba(255,255,255,.4);font-size:.78rem}
      `}</style>

      <div className="mc-hdr">
        <div>
          <div className="mc-title">My Claude Certificates</div>
          <div className="mc-sub">Upload your 4 Anthropic Academy course certificates (PDF, PNG, or JPG · max 2 MB each)</div>
        </div>
        <div className="mc-progress">
          <div>
            <div className="mc-progress-num"><strong>{uploadedCount}</strong>/{total}</div>
            <div className="mc-progress-l">Uploaded</div>
          </div>
          <div className="mc-progress-bar">
            <div className="mc-progress-fill" style={{ width: `${(uploadedCount/total)*100}%` }} />
          </div>
        </div>
      </div>

      <div className="mc-help">
        💡 Each member uploads their own 4 certificates from <strong>Anthropic Academy</strong> (Agent Skills · Claude API · MCP · Code in Action). Only PDF, PNG, JPG accepted. Maximum file size: 2 MB.
      </div>

      {error && <div className="mc-msg err">{error}</div>}
      {success && <div className="mc-msg ok">✓ {success}</div>}

      {loading && <div className="mc-loading">Loading your certificates…</div>}

      {!loading && (
        <div className="mc-grid">
          {slots.map(slot => (
            <div key={slot.type} className={`mc-card ${slot.uploaded ? 'uploaded' : ''}`}>
              <div className="mc-card-top">
                <div>
                  <div className="mc-cert-l">{slot.label}</div>
                  <div className="mc-cert-tag">{slot.type.replace(/_/g, ' ')}</div>
                </div>
                <span className={`mc-status ${slot.uploaded ? 'uploaded' : 'empty'}`}>
                  {slot.uploaded ? '✓ Uploaded' : 'Pending'}
                </span>
              </div>

              {slot.uploaded ? (
                <div className="mc-info">
                  <div className="mc-info-name">{slot.file_name}</div>
                  <div className="mc-info-meta">{fmtSize(slot.file_size)} · uploaded {fmtDate(slot.uploaded_at)}</div>
                </div>
              ) : (
                <div className="mc-empty-msg">No certificate uploaded yet</div>
              )}

              <input
                ref={el => { fileInputs.current[slot.type] = el }}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(slot.type, f)
                  e.target.value = ''
                }}
              />

              <div className="mc-actions">
                {slot.uploaded ? (
                  <>
                    <a href={slot.url} target="_blank" rel="noopener noreferrer" className="mc-btn mc-btn-view">
                      👁 View
                    </a>
                    <button
                      className="mc-btn mc-btn-replace"
                      onClick={() => fileInputs.current[slot.type]?.click()}
                      disabled={uploadingType === slot.type}
                    >
                      {uploadingType === slot.type ? '⏳ Uploading…' : '↑ Replace'}
                    </button>
                    <button className="mc-btn mc-btn-del" onClick={() => handleDelete(slot.type)} title="Delete">✕</button>
                  </>
                ) : (
                  <button
                    className="mc-btn mc-btn-upload"
                    onClick={() => fileInputs.current[slot.type]?.click()}
                    disabled={uploadingType === slot.type}
                  >
                    {uploadingType === slot.type ? '⏳ Uploading…' : '↑ Upload Certificate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}