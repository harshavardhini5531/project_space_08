'use client'
import { useState, useRef, useEffect, useMemo } from 'react'

// Mapping: technology track → its tech stacks (for reverse search)
const TRACK_MAP = {
  'full stack':       ['React Native', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'Next.js', 'PostgreSQL', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'REST API', 'Docker', 'Supabase'],
  'google flutter':   ['Flutter', 'Dart', 'Firebase', 'Firestore', 'Provider'],
  'vlsi':             ['Verilog', 'SystemVerilog', 'VHDL', 'Cadence Virtuoso', 'Xilinx Vivado'],
  'servicenow':       ['ServiceNow Platform', 'Flow Designer', 'Service Portal', 'Glide API', 'REST API', 'JavaScript'],
  'data specialist':  ['Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'Power Fx', 'Python', 'SQL'],
  'power platform':   ['Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'Power Fx'],
  'aws development':  ['AWS Lambda', 'EC2', 'S3', 'DynamoDB', 'API Gateway'],
  'aws':              ['AWS Lambda', 'EC2', 'S3', 'DynamoDB', 'API Gateway'],
  'react':            ['React Native', 'React.js', 'Next.js'],
  'python':           ['Python'],
  'microsoft':        ['Power Apps', 'Power Automate', 'Power BI', 'Dataverse', 'Power Fx'],
}

export default function MultiDropdown({ label, options, selected, onChange, counts = {}, accent = '#EEA727', cardBg = '#211512', onCustomAdd }) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [search, setSearch] = useState('')
  const [animKey, setAnimKey] = useState(0)
  const ref = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus()
    if (!open) setSearch('')
  }, [open])

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.trim().toLowerCase()
    const nameMatches = new Set(options.filter(o => o.toLowerCase().includes(q)))
    for (const [track, stacks] of Object.entries(TRACK_MAP)) {
      if (track.includes(q)) {
        stacks.forEach(s => { if (options.includes(s)) nameMatches.add(s) })
      }
    }
    return [...nameMatches]
  }, [search, options])

  useEffect(() => {
    if (search.trim()) setAnimKey(k => k + 1)
  }, [filtered.length, search])

  const pick = (v) => selected.includes(v) ? onChange(selected.filter(x => x !== v)) : onChange([...selected, v])
  const addC = () => { const v = custom.trim(); if (v && !selected.includes(v)) { onChange([...selected, v]); setCustom('') } }

  const uid = label.replace(/[^a-zA-Z]/g, '').toLowerCase()
  const [r, g, b] = [parseInt(accent.slice(1, 3), 16), parseInt(accent.slice(3, 5), 16), parseInt(accent.slice(5, 7), 16)]
  const rgb = `${r},${g},${b}`
  const isSearching = search.trim().length > 0
  const S = `.mdd-${uid}`

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <style>{`
/* Tags — scoped */
${S} .mdt{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
${S} .mdt-t{display:inline-flex;align-items:center;gap:6px;padding:5px 8px 5px 13px;background:rgba(${rgb},.08);border:1px solid rgba(${rgb},.18);border-radius:20px;font-size:.74rem;font-weight:500;color:rgba(255,255,255,.85);animation:mdtPop .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes mdtPop{from{opacity:0;transform:scale(.65) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
${S} .mdt-t:hover{background:rgba(${rgb},.14);border-color:rgba(${rgb},.28)}
${S} .mdt-h{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:10px;background:rgba(${rgb},.12)}
${S} .mdt-h svg{width:9px;height:9px;fill:${accent}}
${S} .mdt-h span{font-size:.56rem;font-weight:700;color:#fff}
${S} .mdt-x{width:15px;height:15px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;flex-shrink:0}
${S} .mdt-x:hover{background:rgba(${rgb},.3);transform:scale(1.15)}
${S} .mdt-x svg{width:9px;height:9px;stroke:rgba(255,255,255,.4);stroke-width:2.5;stroke-linecap:round;fill:none}

/* Dropdown base */
.mdd{position:relative}
${S} .mdd-fl{position:absolute;top:0;left:16px;transform:translateY(-50%);padding:0 8px;background:${cardBg};font-size:.7rem;font-weight:500;color:rgba(255,255,255,.22);z-index:4;pointer-events:none;transition:all .25s;letter-spacing:.3px;font-family:'DM Sans',sans-serif}
${S}.on .mdd-fl{color:${accent};transform:translateY(-50%) translateX(2px) scale(1.04);text-shadow:0 0 12px rgba(${rgb},.3)}

${S} .mdd-tr{width:100%;display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:transparent;border:1.5px solid rgba(255,255,255,.08);border-radius:14px;cursor:pointer;user-select:none;transition:all .3s cubic-bezier(.4,0,.2,1)}
${S} .mdd-tr:hover{border-color:rgba(255,255,255,.14)}
${S}.on .mdd-tr{border-color:${accent};box-shadow:0 0 0 3px rgba(${rgb},.06),0 0 20px rgba(${rgb},.08);background:transparent}
${S} .mdd-ph{font-size:.86rem;font-weight:400;color:rgba(255,255,255,.22);font-family:'DM Sans',sans-serif}
${S} .mdd-ph.has{color:rgba(255,255,255,.55);font-weight:500}
${S} .mdd-ch{width:18px;height:18px;stroke:rgba(255,255,255,.22);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;transition:transform .35s cubic-bezier(.34,1.56,.64,1),stroke .25s}
${S}.on .mdd-ch{transform:rotate(180deg);stroke:${accent}}

/* Panel */
${S} .mdd-pn{position:absolute;top:calc(100% + 10px);left:0;right:0;background:${cardBg};border:1px solid rgba(${rgb},.2);border-radius:16px;z-index:500;padding:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(${rgb},.08),0 0 30px rgba(${rgb},.08),0 0 60px rgba(${rgb},.04),0 8px 40px rgba(0,0,0,.4),inset 0 1px 0 rgba(${rgb},.06);opacity:0;transform:translateY(-12px) scale(.97);transform-origin:top center;pointer-events:none;transition:opacity .3s cubic-bezier(.16,1,.3,1),transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
${S} .mdd-pn.show{opacity:1;transform:translateY(0) scale(1);pointer-events:all;box-shadow:0 0 0 1px rgba(${rgb},.15),0 0 40px rgba(${rgb},.1),0 0 80px rgba(${rgb},.05),0 12px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(${rgb},.08)}

/* Search */
${S} .mdd-search{position:relative;margin-bottom:10px}
${S} .mdd-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:14px;height:14px;stroke:rgba(255,255,255,.2);stroke-width:2;stroke-linecap:round;fill:none;pointer-events:none;transition:stroke .25s}
${S} .mdd-search:focus-within .mdd-search-icon{stroke:${accent}}
${S} .mdd-search input{width:100%;padding:10px 14px 10px 34px;border-radius:10px;background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.06);color:#fff;font-size:.78rem;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .25s,background .25s,box-shadow .25s}
${S} .mdd-search input::placeholder{color:rgba(255,255,255,.18)}
${S} .mdd-search input:focus{border-color:rgba(${rgb},.3);background:rgba(${rgb},.03);box-shadow:0 0 12px rgba(${rgb},.06)}
${S} .mdd-search-hint{font-size:.58rem;color:rgba(255,255,255,.15);margin-top:5px;padding-left:2px;font-family:'DM Sans',sans-serif}
${S} .mdd-search-count{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:.6rem;font-weight:600;color:${accent};opacity:0;transition:opacity .2s}
${S} .mdd-search-count.vis{opacity:1}

/* Grid */
${S} .mdd-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px;max-height:280px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(${rgb},.15) transparent}
${S} .mdd-g::-webkit-scrollbar{width:3px}
${S} .mdd-g::-webkit-scrollbar-thumb{background:rgba(${rgb},.15);border-radius:3px}

/* Item */
${S} .mdd-it{display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-radius:9px;cursor:pointer;position:relative;background:rgba(${rgb},.03);border:1px solid rgba(${rgb},.1);transition:all .2s cubic-bezier(.4,0,.2,1);min-width:0;overflow:hidden}
${S} .mdd-it:hover{background:rgba(${rgb},.08);border-color:rgba(${rgb},.2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.15)}
${S} .mdd-it.on{background:rgba(${rgb},.1);border-color:rgba(${rgb},.3);box-shadow:0 0 16px rgba(${rgb},.08),inset 0 0 12px rgba(${rgb},.04);animation:mdSel .35s cubic-bezier(.34,1.56,.64,1)}
@keyframes mdSel{0%{transform:scale(1)}35%{transform:scale(.94)}70%{transform:scale(1.04)}100%{transform:scale(1)}}
${S} .mdd-it.on::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;background:${accent};border-radius:0 3px 3px 0;animation:mdBar .25s cubic-bezier(.34,1.56,.64,1)}
@keyframes mdBar{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
${S} .mdd-n{flex:1;min-width:0;font-size:.73rem;font-weight:430;color:rgba(255,255,255,.55);transition:color .15s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'DM Sans',sans-serif}
${S} .mdd-it:hover .mdd-n,${S} .mdd-it.on .mdd-n{color:#fff;font-weight:500}

/* Search result animation */
${S} .mdd-it.srch{animation:mdSearchIn .35s cubic-bezier(.34,1.56,.64,1) both}
${S} .mdd-it.srch:nth-child(1){animation-delay:0s}
${S} .mdd-it.srch:nth-child(2){animation-delay:.03s}
${S} .mdd-it.srch:nth-child(3){animation-delay:.06s}
${S} .mdd-it.srch:nth-child(4){animation-delay:.09s}
${S} .mdd-it.srch:nth-child(5){animation-delay:.12s}
${S} .mdd-it.srch:nth-child(6){animation-delay:.15s}
${S} .mdd-it.srch:nth-child(7){animation-delay:.18s}
${S} .mdd-it.srch:nth-child(8){animation-delay:.21s}
@keyframes mdSearchIn{0%{opacity:0;transform:translateY(8px) scale(.92)}60%{opacity:1;transform:translateY(-2px) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}

/* No results */
${S} .mdd-empty{grid-column:1/-1;text-align:center;padding:20px 10px;color:rgba(255,255,255,.2);font-size:.76rem;font-family:'DM Sans',sans-serif}
${S} .mdd-empty span{color:${accent};font-weight:500}

/* Heart badge */
${S} .mdd-hb{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:12px;background:rgba(${rgb},.15);flex-shrink:0;margin-left:4px;transition:all .25s cubic-bezier(.4,0,.2,1)}
${S} .mdd-it:hover .mdd-hb{background:rgba(${rgb},.18);transform:scale(1.08)}
${S} .mdd-it.on .mdd-hb{background:rgba(${rgb},.15)}
${S} .mdd-hb svg{width:10px;height:10px;fill:${accent};transition:transform .2s}
${S} .mdd-it:hover .mdd-hb svg{animation:mdHeart .4s ease}
@keyframes mdHeart{0%{transform:scale(1)}25%{transform:scale(1.35) rotate(-8deg)}50%{transform:scale(.9) rotate(4deg)}75%{transform:scale(1.15)}100%{transform:scale(1) rotate(0)}}
${S} .mdd-hb span{font-size:.6rem;font-weight:700;color:#fff;min-width:8px;text-align:center}

/* Custom */
${S} .mdd-add{display:flex;gap:6px;padding:10px 4px 4px;margin-top:6px;border-top:1px solid rgba(255,255,255,.04);grid-column:1/-1}
${S} .mdd-add input{flex:1;padding:9px 14px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);color:#fff;font-size:.78rem;outline:none;font-family:'DM Sans',sans-serif}
${S} .mdd-add input:focus{border-color:rgba(${rgb},.3)}
${S} .mdd-add input::placeholder{color:rgba(255,255,255,.14)}
${S} .mdd-add button{padding:9px 14px;border-radius:10px;background:rgba(${rgb},.06);border:1px solid rgba(${rgb},.14);color:${accent};font-size:.72rem;font-weight:500;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:background .15s}
${S} .mdd-add button:hover{background:rgba(${rgb},.12)}
      `}</style>

      <div className={`mdd-${uid}`}>
        {selected.length > 0 && (
          <div className="mdt">
            {selected.map(v => (
              <span key={v} className="mdt-t">
                {v}
                {(counts[v] || 0) > 0 && <span className="mdt-h"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>{counts[v]}</span></span>}
                <span className="mdt-x" onClick={e => { e.stopPropagation(); onChange(selected.filter(x => x !== v)) }}><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              </span>
            ))}
          </div>
        )}

        <div className={`mdd mdd-${uid} ${open ? 'on' : ''}`}>
          <span className="mdd-fl">{label}</span>
          <div className="mdd-tr" onClick={() => setOpen(!open)}>
            <span className={`mdd-ph ${selected.length ? 'has' : ''}`}>{selected.length ? `${selected.length} selected` : `Select ${label.toLowerCase()}...`}</span>
            <svg className="mdd-ch" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className={`mdd-pn ${open ? 'show' : ''}`}>
            <div className="mdd-search">
              <svg className="mdd-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                ref={searchRef}
                placeholder="Search tech or type a track name (e.g. Flutter, AWS)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className={`mdd-search-count ${isSearching ? 'vis' : ''}`}>{filtered.length} found</span>
            </div>
            {isSearching && filtered.length > 0 && (
              <div className="mdd-search-hint">
                Showing results for &quot;{search.trim()}&quot;
              </div>
            )}
            <div className="mdd-g" key={isSearching ? animKey : 'all'}>
              {filtered.length === 0 && (
                <div className="mdd-empty">No results for <span>&quot;{search}&quot;</span></div>
              )}
              {filtered.map(v => (
                <div key={v} className={`mdd-it ${selected.includes(v) ? 'on' : ''} ${isSearching ? 'srch' : ''}`} onClick={() => pick(v)}>
                  <span className="mdd-n">{v}</span>
                  <span className="mdd-hb"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>{counts[v] || 0}</span></span>
                </div>
              ))}
              {onCustomAdd && <div className="mdd-add"><input placeholder="Add custom..." value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addC()} /><button onClick={addC}>+ Add</button></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}