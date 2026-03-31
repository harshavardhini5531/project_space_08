'use client'
import { useState, useRef } from 'react'

export default function FloatingField({ label, required, type = 'input', placeholder, value, onChange, rows = 3, accent = '#EEA727', cardBg = '#211512', maxLen }) {
  const [focused, setFocused] = useState(false)
  const [wasFilled, setWasFilled] = useState(false)
  const sparkRef = useRef(null)
  const shimRef = useRef(null)

  const [r, g, b] = [parseInt(accent.slice(1, 3), 16), parseInt(accent.slice(3, 5), 16), parseInt(accent.slice(5, 7), 16)]
  const rgb = `${r},${g},${b}`
  const isFilled = value && value.trim().length > 0

  const handleChange = (e) => {
    const v = e.target.value
    onChange(v)
    if (v.trim().length > 0 && !wasFilled) {
      setWasFilled(true)
      sparkRef.current?.classList.remove('burst')
      void sparkRef.current?.offsetWidth
      sparkRef.current?.classList.add('burst')
      shimRef.current?.classList.remove('run')
      void shimRef.current?.offsetWidth
      shimRef.current?.classList.add('run')
    } else if (v.trim().length === 0) {
      setWasFilled(false)
    }
  }

  const uid = label.replace(/[^a-zA-Z]/g, '').toLowerCase()

  return (
    <div className={`pf pf-${uid} ${focused ? 'focus' : ''} ${isFilled ? 'filled' : ''}`}>
      <style>{`
@property --pf-dot{syntax:'<angle>';initial-value:0deg;inherits:false}
@property --pf-comet{syntax:'<angle>';initial-value:180deg;inherits:false}
@keyframes pfOrbit{to{--pf-dot:360deg}}
@keyframes pfComet{to{--pf-comet:540deg}}
@keyframes pfCorner{0%{opacity:.4;transform:scale(.8)}100%{opacity:1;transform:scale(1.2)}}
@keyframes pfFocus{0%{transform:scale(1)}50%{transform:scale(1.005)}100%{transform:scale(1)}}
@keyframes pfLblGlow{0%{opacity:.6;transform:translateY(-50%) translateX(0) scale(1)}50%{opacity:1;transform:translateY(-50%) translateX(3px) scale(1.1)}100%{opacity:1;transform:translateY(-50%) translateX(2px) scale(1.06)}}
@keyframes pfDot{0%{transform:translateY(-50%) scale(1)}15%{transform:translateY(-50%) scale(2.5)}35%{transform:translateY(-50%) scale(.6)}55%{transform:translateY(-50%) scale(1.8)}75%{transform:translateY(-50%) scale(.85)}100%{transform:translateY(-50%) scale(1)}}
@keyframes pfSpark{0%{opacity:1;transform:translate(0,0) scale(1)}50%{opacity:.8}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(0)}}
@keyframes pfShimmer{0%{left:-50%;opacity:1}100%{left:120%;opacity:0}}
@keyframes pfType{0%{left:-30%}100%{left:100%}}

.pf{position:relative;animation:pfReveal .5s cubic-bezier(.16,1,.3,1) both}
@keyframes pfReveal{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}

/* Orbiting light */
.pf-${uid} .pf-light{position:absolute;inset:-2px;border-radius:16px;z-index:0;opacity:0;transition:opacity .4s;pointer-events:none;background:conic-gradient(from var(--pf-dot) at 50% 50%,transparent 0%,transparent 44%,rgba(${rgb},.15) 46%,rgba(${rgb},.4) 48%,${accent} 50%,rgba(${rgb},.4) 52%,rgba(${rgb},.15) 54%,transparent 56%,transparent 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:1.5px}
.pf-${uid}.focus .pf-light{opacity:1;animation:pfOrbit 3s linear infinite}

/* Comet trail */
.pf-${uid} .pf-comet{position:absolute;inset:-2px;border-radius:16px;z-index:0;opacity:0;transition:opacity .4s;pointer-events:none;background:conic-gradient(from var(--pf-comet) at 50% 50%,transparent 0%,transparent 46%,rgba(${rgb},.08) 48%,rgba(${rgb},.2) 50%,rgba(${rgb},.08) 52%,transparent 54%,transparent 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:1.5px}
.pf-${uid}.focus .pf-comet{opacity:1;animation:pfComet 3s linear infinite}

/* Corner flares */
.pf-${uid} .pf-corners{position:absolute;inset:0;border-radius:14px;z-index:0;pointer-events:none;opacity:0;transition:opacity .5s}
.pf-${uid}.focus .pf-corners{opacity:1}
.pf-${uid} .pf-corners::before,.pf-${uid} .pf-corners::after{content:'';position:absolute;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,rgba(${rgb},.25),transparent 70%);filter:blur(5px);animation:pfCorner 2s ease-in-out infinite alternate}
.pf .pf-corners::before{top:-5px;left:-5px}
.pf .pf-corners::after{bottom:-5px;right:-5px;animation-delay:1s}

/* Floating label */
.pf-${uid} .pf-lbl{position:absolute;top:0;left:16px;transform:translateY(-50%);padding:0 8px;background:${cardBg};font-size:.7rem;font-weight:500;color:rgba(255,255,255,.22);z-index:4;pointer-events:none;transition:all .35s cubic-bezier(.34,1.56,.64,1);font-family:'DM Sans',sans-serif;letter-spacing:.3px}
.pf-${uid}.focus .pf-lbl{color:${accent};transform:translateY(-50%) translateX(2px) scale(1.06);text-shadow:0 0 16px rgba(${rgb},.4),0 0 32px rgba(${rgb},.15);animation:pfLblGlow .4s cubic-bezier(.34,1.56,.64,1)}
.pf-${uid} .pf-lbl .pf-req{color:rgba(${rgb},.35);margin-left:2px;transition:color .3s}
.pf-${uid}.focus .pf-lbl .pf-req{color:${accent}}

/* Input/Textarea */
.pf-input,.pf-ta{width:100%;position:relative;z-index:1;padding:15px 18px;background:transparent;border:1.5px solid rgba(255,255,255,.07);border-radius:14px;color:#fff;font-family:'DM Sans',sans-serif;font-size:.86rem;font-weight:400;outline:none;transition:border-color .3s,box-shadow .4s cubic-bezier(.4,0,.2,1),background .3s}
.pf-ta{resize:vertical;min-height:90px;line-height:1.65}
.pf-input::placeholder,.pf-ta::placeholder{color:rgba(255,255,255,.12)}
.pf-input:hover,.pf-ta:hover{border-color:rgba(255,255,255,.12)}
.pf-${uid} .pf-input:focus,.pf-${uid} .pf-ta:focus{border-color:rgba(${rgb},.35);background:transparent;box-shadow:0 0 24px rgba(${rgb},.06),0 0 48px rgba(${rgb},.03);animation:pfFocus .3s cubic-bezier(.34,1.56,.64,1)}

/* Filled dot */
.pf-dot{position:absolute;top:0;right:16px;transform:translateY(-50%);width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.06);z-index:4;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.pf-${uid}.filled .pf-dot{background:${accent};box-shadow:0 0 6px rgba(${rgb},.7),0 0 18px rgba(${rgb},.35),0 0 36px rgba(${rgb},.15);animation:pfDot .6s cubic-bezier(.34,1.56,.64,1)}

/* Sparkles */
.pf-sp{position:absolute;top:0;right:16px;transform:translate(50%,-50%);width:0;height:0;z-index:3;pointer-events:none}
.pf-${uid} .pf-sp i{position:absolute;width:2px;height:2px;border-radius:50%;background:${accent};opacity:0}
.pf-sp.burst i{animation:pfSpark .7s cubic-bezier(.16,1,.3,1) forwards}
.pf-sp.burst i:nth-child(1){--sx:-20px;--sy:-22px;width:3px;height:3px}
.pf-sp.burst i:nth-child(2){--sx:14px;--sy:-14px;animation-delay:.04s}
.pf-sp.burst i:nth-child(3){--sx:22px;--sy:8px;animation-delay:.08s;width:3px;height:3px}
.pf-sp.burst i:nth-child(4){--sx:-12px;--sy:14px;animation-delay:.06s}
.pf-sp.burst i:nth-child(5){--sx:6px;--sy:18px;animation-delay:.1s}
.pf-sp.burst i:nth-child(6){--sx:-22px;--sy:6px;animation-delay:.03s;width:4px;height:4px}

/* Shimmer */
.pf-shim{position:absolute;inset:0;border-radius:14px;overflow:hidden;z-index:1;pointer-events:none}
.pf-shim::after{content:'';position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(${rgb},.04),rgba(${rgb},.1),rgba(${rgb},.04),transparent);opacity:0}
.pf-shim.run::after{animation:pfShimmer .8s ease forwards}

/* Typing bar */
.pf-type{position:absolute;bottom:1px;left:20px;right:20px;height:2px;border-radius:1px;z-index:2;overflow:hidden;pointer-events:none}
.pf-type::after{content:'';position:absolute;left:-30%;top:0;width:30%;height:100%;background:linear-gradient(90deg,transparent,${accent},transparent);border-radius:1px;opacity:0}
.pf-${uid}.focus .pf-type::after{opacity:.6;animation:pfType 1.2s ease-in-out infinite}

/* Counter */
.pf-cnt{position:absolute;bottom:8px;right:14px;font-size:.58rem;font-weight:500;color:rgba(255,255,255,.08);pointer-events:none;z-index:2;transition:color .3s}
.pf-${uid}.focus .pf-cnt{color:rgba(${rgb},.25)}
      `}</style>

      <div className="pf-light" />
      <div className="pf-comet" />
      <div className="pf-corners" />
      <span className="pf-lbl">{label}{required && <span className="pf-req"> *</span>}</span>
      <div className="pf-dot" />
      <div className="pf-sp" ref={sparkRef}><i/><i/><i/><i/><i/><i/></div>
      <div className="pf-shim" ref={shimRef} />

      {type === 'textarea' ? (
        <textarea className="pf-ta" placeholder={placeholder} value={value} onChange={handleChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} rows={rows} />
      ) : (
        <input className="pf-input" placeholder={placeholder} value={value} onChange={handleChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      )}

      <div className="pf-type" />
      {maxLen && <span className="pf-cnt">{(value || '').length} / {maxLen}</span>}
    </div>
  )
}