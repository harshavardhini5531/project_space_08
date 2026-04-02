'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { globalStyles, colors, fonts, TECH_STACK_OPTIONS, AI_TOOLS } from '@/lib/theme'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'
import SpaceBot from '@/components/SpaceBot'
import MultiDropdown from '@/components/MultiDropdown'
import FloatingField from '@/components/FloatingField'
import { Layers, Settings, Users, Zap, Code } from 'lucide-react'

const PROJECT_AREAS = ['Web Development','App Development','Machine Learning','Data Analytics','Cloud Computing','Cybersecurity','DevOps','Automation','IoT Development','Chip Design','Service Management','SoC Architecture','Protocol Design','Project Management']
const AXIS = 45
const SIDE_BG = '#0a0510'
const SECTION_COLORS = { project:'#EEA727', ai:'#f21d32', tech:'#10b981', team:'#7B2FBE', review:'#BDE8F5' }
const CARD_BG = { project:'#0a0a0a', ai:'#0a0a0a', tech:'#0a0a0a', team:'#0a0a0a', review:'#0a0a0a' }
const STEP_ICONS = { project:Layers, ai:Settings, tech:Code, team:Users, review:Zap }

const STEPS_CONFIG = [
  { num:1, id:'project', label:'Project Details', subs:['Project Title','Project Area','Project Description','Problem Statement'], fields:['projectTitle','projectArea','projectDescription','problemStatement'] },
  { num:2, id:'tech', label:'Tech Stack', subs:['Tech Stack'], fields:['techStack'] },
  { num:3, id:'ai', label:'AI', subs:['AI Capabilities','AI Tools'], fields:['aiCapabilities','aiTools'] },
  { num:4, id:'team', label:'Team Members', subs:['Load Members','Verify Details','Contact Info'], fields:['membersLoaded','membersVerified','contactsFilled'] },
  { num:5, id:'review', label:'Register Team', subs:[], fields:[] },
]

export default function RegisterTeamPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [membersLoaded, setMembersLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [areaCounts, setAreaCounts] = useState({})
  const [activeSection, setActiveSection] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Confetti animation when registration succeeds
  useEffect(() => {
    if (!showSuccess) return
    const c = document.getElementById('confettiCanvas')
    if (!c) return
    const ctx = c.getContext('2d')
    c.width = window.innerWidth; c.height = window.innerHeight
    const colors = ['#fd1c00','#faa000','#EEA727','#10b981','#4ade80','#7B2FBE','#BDE8F5','#f21d32','#ff6b6b','#ffd93d','#6bcf63','#4dabf7','#e64980','#ff922b']
    const pieces = []
    for (let i = 0; i < 150; i++) {
      pieces.push({ x:Math.random()*c.width, y:Math.random()*c.height-c.height, w:Math.random()*10+5, h:Math.random()*6+3, color:colors[Math.floor(Math.random()*colors.length)], vy:Math.random()*3+2, vx:(Math.random()-.5)*2, rot:Math.random()*360, vr:(Math.random()-.5)*8, shape:Math.floor(Math.random()*3) })
    }
    let animId
    function draw() {
      ctx.clearRect(0,0,c.width,c.height)
      pieces.forEach(p => {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillStyle=p.color
        if(p.shape===0) ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h)
        else if(p.shape===1){ctx.beginPath();ctx.arc(0,0,p.w/3,0,Math.PI*2);ctx.fill()}
        else{ctx.beginPath();ctx.moveTo(0,-p.h);ctx.lineTo(p.w/2,p.h/2);ctx.lineTo(-p.w/2,p.h/2);ctx.closePath();ctx.fill()}
        ctx.restore(); p.y+=p.vy; p.x+=p.vx; p.rot+=p.vr; p.vy+=0.05
        if(p.y>c.height+20){p.y=-20;p.x=Math.random()*c.width;p.vy=Math.random()*3+2}
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [showSuccess])
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [problemStatement, setProblemStatement] = useState('')
  const [projectArea, setProjectArea] = useState([])
  const [aiUsage, setAiUsage] = useState('No')
  const [aiCapabilities, setAiCapabilities] = useState([])
  const [aiTools, setAiTools] = useState([])
  const [techStack, setTechStack] = useState([])
  const [capInput, setCapInput] = useState('')

  const sectionRefs = { project:useRef(null), ai:useRef(null), tech:useRef(null), team:useRef(null), review:useRef(null) }

  useEffect(() => { const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener('resize',c); return ()=>window.removeEventListener('resize',c) }, [])

  useEffect(() => {
    async function fetchCounts() { try { const r=await fetch('/api/auth/area-counts'); const d=await r.json(); if(r.ok) setAreaCounts(d.counts||{}) } catch{} }
    fetchCounts()
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://yiwyfhdzgvlsmdeshdgv.supabase.co'
    const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''
    if(key){ const sb=createClient(url,key); const ch=sb.channel('teams-rt').on('postgres_changes',{event:'*',schema:'public',table:'teams'},()=>fetchCounts()).subscribe(); return ()=>{sb.removeChannel(ch)} }
  }, [])

  useEffect(() => {
    let u = null
    try { u = getSession() } catch {}
    if (!u) {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('ps_user') : null
        if (raw) u = JSON.parse(raw)
      } catch {}
    }
    if(!u){router.push('/auth/login');return}
    if(u.role!=='leader'){router.push('/auth/login');return}
    const roll = u.rollNumber || u.roll_number || ''
    if(!roll){setError('Session missing roll number. Please login again.');setLoading(false);return}
    setUser({...u, rollNumber: roll}); fetchTeamInfo(roll)
  }, [])

  async function fetchTeamInfo(roll) {
    try { const res=await fetch('/api/auth/team-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:roll})}); const data=await res.json(); if(!res.ok){setError(data.error);setLoading(false);return} setTeam(data.team) } catch{setError('Failed to load team data')} finally{setLoading(false)}
  }
  async function fetchMembers() {
    if(!user) return; setLoading(true)
    try { const res=await fetch('/api/auth/team-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:user.rollNumber||user.roll_number})}); const data=await res.json(); if(!res.ok){setError(data.error);return} setMembers(data.members||[]); setMembersLoaded(true) } catch{setError('Failed to load members')} finally{setLoading(false)}
  }

  function addChip(val,list,setList,setInput) { const v=val.trim(); if(v&&!list.includes(v)){setList([...list,v]);setInput('')} }
  function removeChip(val,list,setList) { setList(list.filter(x=>x!==val)) }
  function updateMember(i,field,val) { const u=[...members]; u[i]={...u[i],[field]:val}; setMembers(u) }

  function isFieldFilled(f) {
    switch(f) {
      case 'projectArea': return projectArea.length>0
      case 'projectTitle': return !!projectTitle.trim()
      case 'projectDescription': return !!projectDescription.trim()
      case 'problemStatement': return !!problemStatement.trim()
      case 'aiCapabilities': return aiCapabilities.length>0
      case 'aiTools': return aiTools.length>0
      case 'techStack': return techStack.length>0
      case 'membersLoaded': return membersLoaded
      case 'membersVerified': return membersLoaded&&members.length>0
      case 'contactsFilled': return membersLoaded&&members.some(m=>m.phone||m.email)
      default: return false
    }
  }

  const fieldStatus = {}
  STEPS_CONFIG.forEach(s=>s.subs.forEach((sub,i)=>{fieldStatus[sub]=isFieldFilled(s.fields[i])}))
  const totalFields = ['projectArea','projectTitle','projectDescription','problemStatement','aiCapabilities','aiTools','techStack','membersLoaded']
  const progressPct = Math.round(totalFields.filter(f=>isFieldFilled(f)).length/totalFields.length*100)

  function scrollToSection(id) { sectionRefs[id]?.current?.scrollIntoView({behavior:'smooth',block:'start'}) }

  function handleRegisterClick() {
    setError('')
    if(!projectTitle.trim()){setError('Project title is required');scrollToSection('project');return}
    if(!projectDescription.trim()){setError('Project description is required');scrollToSection('project');return}
    setShowConfirm(true)
  }

  async function handleConfirmSubmit() {
    setShowConfirm(false);setError('');setSuccess('');setSaving(true)
    try {
      const res=await fetch('/api/auth/register-team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:user.rollNumber||user.roll_number,serialNumber:team.serialNumber,projectTitle,projectDescription,problemStatement,projectArea,aiUsage,aiCapabilities,aiTools,techStack,members})})
      const data=await res.json(); if(!res.ok){setError(data.error);setSaving(false);return}
      // Update team with assigned team number
      if(data.teamNumber) setTeam(prev=>({...prev, teamNumber: data.teamNumber}))
      // Send email notifications to all team members
      try {
        console.log('Sending notifications to members:', members.map(m=>({name:m.name,roll:m.roll_number,email:m.email})))
        const notifRes=await fetch('/api/auth/notify-team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamNumber:data.teamNumber||team.serialNumber,projectTitle,technology:team.technology,leaderName:user?.name||'',members})})
        const notifData=await notifRes.json()
        console.log('Notify response:', notifData)
      } catch(e){console.error('Notify failed:',e)}
      setSaving(false);setShowSuccess(true)
    } catch{setError('Network error. Try again.');setSaving(false)}
  }

  const techOptions = TECH_STACK_OPTIONS
  const teamDataForBot = team ? {teamNumber:team.teamNumber||'Not assigned yet',serialNumber:team.serialNumber,technology:team.technology,leaderName:user?.name||'',memberCount:members.length,currentTitle:projectTitle,currentDescription:projectDescription,currentProblem:problemStatement,currentArea:projectArea,currentAI:aiCapabilities,currentTech:techStack} : {}

  const StepIcon = ({id,size}) => {
    if(id==='ai') return React.createElement('img',{src:'https://i.ibb.co/MD0SRjWB/chat-bot.png',alt:'',style:{width:size+'px',height:size+'px',objectFit:'contain',filter:'brightness(0) invert(1)'}})
    return React.createElement(STEP_ICONS[id],{size,color:'#fff'})
  }

  if(loading&&!team) return <div style={{width:'100%',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'rgba(255,255,255,.4)',fontFamily:'sans-serif'}}>Loading...</div>

  return (
    <>
      <style>{`
${globalStyles}
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
@keyframes dotPop{0%{transform:translateX(-3.5px) scale(1)}50%{transform:translateX(-3.5px) scale(1.4)}100%{transform:translateX(-3.5px) scale(1)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
html,body{overflow:hidden!important;background:#050008}

.pg{display:flex;height:100vh}
.pg-m{flex:1;display:flex;flex-direction:column;overflow:hidden;transition:margin-right .3s ease;container-type:inline-size;container-name:main}
.pg-m.co{margin-right:370px}

/* ═══ STEPPER — AXIS=45, evenly distributed ═══ */
.stepper{
  width:280px;flex-shrink:0;height:100vh;position:sticky;top:0;
  background:linear-gradient(180deg,#0c0616 0%,#080310 100%);
  border-right:1px solid rgba(253,28,0,.06);
  display:flex;flex-direction:column;overflow-y:auto;
  font-family:${fonts.body};color:#fff;
}
.stepper::-webkit-scrollbar{width:3px}.stepper::-webkit-scrollbar-thumb{background:rgba(253,28,0,.15);border-radius:3px}

.st-logo{display:flex;align-items:center;gap:10px;padding:22px 22px 0;}
.st-logo-badge{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-family:${fonts.display};font-size:11px;font-weight:700;color:#fff;box-shadow:0 0 16px rgba(253,28,0,.25);font-style:normal;}
.st-logo-text{font-family:${fonts.display};font-size:0.68rem;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,.85);}

.st-badge{margin:16px 22px 10px;padding:10px 16px;background:linear-gradient(135deg,rgba(253,28,0,0.1),rgba(250,160,0,.04));border:1px solid rgba(253,28,0,0.18);border-radius:10px;font-size:.72rem;font-weight:600;color:#fd1c00;letter-spacing:1px;}
.st-badge span{color:rgba(255,255,255,0.5);font-weight:400;}

.st-progress{margin:4px 22px 0;height:4px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden;}
.st-progress-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width .5s cubic-bezier(.4,0,.2,1);}
.st-progress-label{margin:4px 22px 20px;font-size:.55rem;color:rgba(255,255,255,.3);letter-spacing:1px;}

/* Timeline — evenly distributed with justify-content:space-between */
.st-tl{flex:1;padding:0 0 24px;position:relative;display:flex;flex-direction:column;justify-content:space-between;}
.st-line{position:absolute;left:${AXIS}px;top:0;bottom:0;width:1.5px;background:linear-gradient(180deg,rgba(253,28,0,.12),rgba(255,255,255,.04) 30%,rgba(255,255,255,.04) 70%,transparent);z-index:0;transform:translateX(-0.75px);}
.st-step-block{position:relative;z-index:1;}

.st-row{display:flex;align-items:center;padding:3px 16px 3px 0;}
.st-iw{width:${AXIS*2}px;display:flex;justify-content:center;flex-shrink:0;position:relative;z-index:3;}
.st-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:3;transition:all .3s;}
.st-info{flex:1;cursor:pointer;padding:10px 14px 10px 0;margin-left:-14px;border-radius:10px;transition:background .2s;}
.st-info:hover{background:rgba(255,255,255,0.04);}
.st-label{font-family:${fonts.display};font-size:.61rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.9);}

.st-subs{padding:8px 0 4px;}
.st-sub{display:flex;align-items:center;padding:8px 0;position:relative;cursor:pointer;}
.st-sub:hover .st-stxt{color:rgba(255,255,255,.65);}
.st-dot{position:absolute;left:${AXIS}px;width:7px;height:7px;border-radius:50%;background:${SIDE_BG};border:1.5px solid rgba(255,255,255,0.12);transform:translateX(-3.5px);z-index:3;transition:all .4s cubic-bezier(.4,0,.2,1);}
.st-dot.filled{background:#fd1c00;border-color:#fd1c00;box-shadow:0 0 8px rgba(253,28,0,0.3);animation:dotPop .4s cubic-bezier(.34,1.56,.64,1);}
.st-stxt{font-size:.73rem;color:rgba(255,255,255,0.35);margin-left:${AXIS+16}px;transition:color .3s;}
.st-stxt.filled{color:rgba(255,255,255,.8);}

/* Mobile stepper */
.mob{display:none}

/* ═══ MAIN CONTENT ═══ */
.ct{flex:1;overflow-y:auto;padding:0 44px 100px;-webkit-overflow-scrolling:touch;will-change:scroll-position}
.ct::-webkit-scrollbar{display:none}.ct{scrollbar-width:none}
.ct-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:28px 0 18px;margin:0 0 8px;border-bottom:1px solid rgba(255,255,255,.04);position:sticky;top:0;z-index:200;background:#050008}
.ct-t{font-family:${fonts.display};font-size:1rem;font-weight:600;letter-spacing:3px;text-transform:uppercase}
.ct-s{font-size:.72rem;color:rgba(255,255,255,.35);margin-top:5px}
.ct-b{padding:6px 14px;border-radius:8px;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);font-size:.65rem;color:#fd1c00;font-weight:500;text-transform:uppercase;letter-spacing:2px;font-family:${fonts.display}}

/* ═══ SECTION CARDS ═══ */
.sec{margin-bottom:28px;animation:fadeUp .4s ease both;scroll-margin-top:80px;position:relative}
.sec:first-child{margin-top:20px}
.sec:focus-within{z-index:100!important}
.sec:nth-child(2){z-index:50}
.sec:nth-child(3){z-index:40}
.sec:nth-child(4){z-index:30}
.sec:nth-child(5){z-index:20}
.sec:nth-child(6){z-index:10}
.card{border-radius:16px;padding:27px 32px 32px;position:relative;transition:border-color .3s,box-shadow .3s;border:none;overflow:visible;z-index:1}
.card:focus-within{z-index:100}
.card-glow{position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:-2;pointer-events:none}
.card-glow::before{content:'';position:absolute;top:50%;left:50%;width:300%;height:300%;transform-origin:center;animation:glowSpin 12s linear infinite;opacity:0;transition:opacity .5s}
.card:focus-within .card-glow::before{opacity:1}
.card::after{content:'';position:absolute;inset:1.5px;border-radius:15px;background:#0a0a0a;z-index:-1;pointer-events:none}
@keyframes glowSpin{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}

.card.cp{box-shadow:0 0 20px rgba(238,167,39,.06),0 0 40px rgba(238,167,39,.03);border:1px solid rgba(238,167,39,.15)}
.card.cp .card-glow::before{background:conic-gradient(from 0deg,transparent 0%,transparent 18.5%,rgba(238,167,39,.5) 19.5%,#EEA727 20%,rgba(238,167,39,.5) 20.5%,transparent 21.5%,transparent 100%)}
.card.cp::after{background:${CARD_BG.project}}
.card.cp:focus-within{box-shadow:0 0 30px rgba(238,167,39,.12),0 0 60px rgba(238,167,39,.06);border-color:rgba(238,167,39,.25)}

.card.ca{box-shadow:0 0 20px rgba(242,29,50,.06),0 0 40px rgba(242,29,50,.03);border:1px solid rgba(242,29,50,.15)}
.card.ca .card-glow::before{background:conic-gradient(from 0deg,transparent 0%,transparent 18.5%,rgba(242,29,50,.5) 19.5%,#f21d32 20%,rgba(242,29,50,.5) 20.5%,transparent 21.5%,transparent 100%)}
.card.ca::after{background:${CARD_BG.ai}}
.card.ca:focus-within{box-shadow:0 0 30px rgba(242,29,50,.12),0 0 60px rgba(242,29,50,.06);border-color:rgba(242,29,50,.25)}

.card.ck{box-shadow:0 0 20px rgba(16,185,129,.06),0 0 40px rgba(16,185,129,.03);border:1px solid rgba(16,185,129,.15)}
.card.ck .card-glow::before{background:conic-gradient(from 0deg,transparent 0%,transparent 18.5%,rgba(16,185,129,.5) 19.5%,#10b981 20%,rgba(16,185,129,.5) 20.5%,transparent 21.5%,transparent 100%)}
.card.ck::after{background:${CARD_BG.tech}}
.card.ck:focus-within{box-shadow:0 0 30px rgba(16,185,129,.12),0 0 60px rgba(16,185,129,.06);border-color:rgba(16,185,129,.25)}

.card.ct2{box-shadow:0 0 20px rgba(123,47,190,.06),0 0 40px rgba(123,47,190,.03);border:1px solid rgba(123,47,190,.15)}
.card.ct2 .card-glow::before{background:conic-gradient(from 0deg,transparent 0%,transparent 18.5%,rgba(123,47,190,.5) 19.5%,#7B2FBE 20%,rgba(123,47,190,.5) 20.5%,transparent 21.5%,transparent 100%)}
.card.ct2::after{background:${CARD_BG.team}}
.card.ct2:focus-within{box-shadow:0 0 30px rgba(123,47,190,.12),0 0 60px rgba(123,47,190,.06);border-color:rgba(123,47,190,.25)}

.card.cr{box-shadow:0 0 20px rgba(189,232,245,.06),0 0 40px rgba(189,232,245,.03);border:1px solid rgba(189,232,245,.15)}
.card.cr .card-glow::before{background:conic-gradient(from 0deg,transparent 0%,transparent 18.5%,rgba(189,232,245,.5) 19.5%,#BDE8F5 20%,rgba(189,232,245,.5) 20.5%,transparent 21.5%,transparent 100%)}
.card.cr::after{background:${CARD_BG.review}}
.card.cr:focus-within{box-shadow:0 0 30px rgba(189,232,245,.12),0 0 60px rgba(189,232,245,.06);border-color:rgba(189,232,245,.25)}

.card-h{font-size:.76rem;font-weight:600;font-family:${fonts.display};letter-spacing:2px;text-transform:uppercase;margin-bottom:28px;display:flex;align-items:center;gap:10px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.05)}
.card-h svg{width:18px;height:18px;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.cp .card-h{color:#EEA727;border-bottom-color:rgba(238,167,39,.15)}
.cp .card-h svg{stroke:#EEA727}
.ca .card-h{color:#f21d32;border-bottom-color:rgba(242,29,50,.15)}
.ca .card-h svg{stroke:#f21d32}
.ck .card-h{color:#10b981;border-bottom-color:rgba(16,185,129,.15)}
.ck .card-h svg{stroke:#10b981}
.ct2 .card-h{color:#7B2FBE;border-bottom-color:rgba(123,47,190,.15)}
.ct2 .card-h svg{stroke:#7B2FBE}
.cr .card-h{color:#BDE8F5;border-bottom-color:rgba(189,232,245,.15)}
.cr .card-h svg{stroke:#BDE8F5}

/* Floating field labels — colored per section */
.cp .pf-lbl,.cp .mdd-fl{color:#EEA727!important}
.ck .pf-lbl,.ck .mdd-fl{color:#10b981!important}
.ca .pf-lbl,.ca .mdd-fl{color:#f21d32!important}
.ct2 .pf-lbl,.ct2 .mdd-fl{color:#7B2FBE!important}
.cr .pf-lbl,.cr .mdd-fl{color:#BDE8F5!important}

/* Form grid */
.fg{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px}
.fg-full{grid-column:1/-1}
@container main (max-width:800px){.fg{grid-template-columns:1fr}.fg-full{grid-column:1}.mem-grid{grid-template-columns:1fr 1fr}.rev-g{grid-template-columns:1fr 1fr}}
@container main (max-width:600px){.mem-grid{grid-template-columns:1fr 1fr}.rev-g{grid-template-columns:1fr!important}}
@container main (max-width:500px){.card{padding:22px 18px}.ct{padding:0 16px 80px}.ct-hdr{flex-direction:column;gap:8px}}

/* Toggle */
.tg-w{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.tg{width:48px;height:26px;border-radius:13px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08);cursor:pointer;position:relative;transition:all .3s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;flex-shrink:0}
.tg.on{background:rgba(242,29,50,.3);border-color:rgba(242,29,50,.2)}
.tg-d{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 4px rgba(0,0,0,.2)}
.tg.on .tg-d{transform:translateX(22px)}
.tg-t{font-size:.82rem;color:rgba(255,255,255,.5);user-select:none}

/* Chips */
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:rgba(242,29,50,.06);border:1px solid rgba(242,29,50,.12);font-size:.74rem;color:rgba(255,255,255,.65)}
.chip-x{width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);cursor:pointer;font-size:9px;color:rgba(255,255,255,.4);border:none;transition:all .15s}
.chip-x:hover{background:rgba(242,29,50,.2);color:#fff}
.chip-tk{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.12)}
.chip-tk .chip-x:hover{background:rgba(16,185,129,.2);color:#fff}

/* Team */
.gt{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:12px;background:rgba(123,47,190,.04);border:1.5px dashed rgba(123,47,190,.15);color:#7B2FBE;font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;cursor:pointer;transition:all .2s}
.gt:hover{background:rgba(123,47,190,.08);border-style:solid}
.mem-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;justify-items:center}
.mem{padding:20px 16px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .3s;width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;text-align:center}
.mem:hover{border-color:rgba(253,28,0,.15);background:rgba(255,255,255,.03)}
.mem-av{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(250,160,0,.1));border:2px solid rgba(253,28,0,.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#fd1c00;font-weight:700;flex-shrink:0;margin-bottom:10px}
.mem-i{width:100%}.mem-n{font-size:.85rem;font-weight:600;color:#fff;margin-bottom:3px}.mem-r{font-size:.6rem;color:rgba(255,255,255,.35);line-height:1.4}
.mem-b{padding:3px 10px;border-radius:20px;font-size:.48rem;background:rgba(253,28,0,.08);color:#fd1c00;letter-spacing:1.5px;font-weight:600;text-transform:uppercase;font-family:${fonts.display};margin-top:8px;display:inline-block;border:1px solid rgba(253,28,0,.12)}
.mem-e{padding:5px 14px;border-radius:20px;background:none;border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.4);font-size:.62rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:10px}
.mem-e:hover{border-color:rgba(253,28,0,.2);color:#fd1c00}
.mem-f{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04);width:100%;text-align:left}

/* Review */
.rev-g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.rev-c{padding:14px 16px;border-radius:10px;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.04)}
.rev-c.full{grid-column:1/-1}
.rev-l{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:2px;font-weight:500;margin-bottom:4px;font-family:${fonts.display}}
.rev-v{font-size:.82rem;color:rgba(255,255,255,.75);line-height:1.5}
.rev-ch{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.rev-ch span{padding:3px 8px;border-radius:6px;font-size:.65rem;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);color:#fd1c00}

.sub-btn{width:100%;padding:15px;border-radius:12px;background:${colors.gradientPrimary};border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;box-shadow:0 4px 20px ${colors.primaryGlow};transition:all .25s}
.sub-btn:hover{box-shadow:0 6px 28px rgba(253,28,0,.4);transform:translateY(-1px)}
.sub-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
.err{padding:10px 14px;border-radius:10px;margin-bottom:14px;background:${colors.errorBg};border:1px solid ${colors.errorBorder};color:${colors.error};font-size:.76rem}
.suc{padding:10px 14px;border-radius:10px;margin-bottom:14px;background:${colors.successBg};border:1px solid ${colors.successBorder};color:${colors.success};font-size:.76rem}

/* Modals */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:modalFadeIn .25s ease}
@keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
.modal{width:min(440px,90vw);border-radius:20px;background:linear-gradient(160deg,#12101a,#0a0810);border:1px solid rgba(255,255,255,.06);padding:36px 32px;animation:modalPop .35s cubic-bezier(.22,1,.36,1);box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 40px rgba(253,28,0,.04)}
@keyframes modalPop{from{opacity:0;transform:scale(.9) translateY(20px)}to{opacity:1;transform:none}}
.modal-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}
.modal-icon.warn{background:rgba(238,167,39,.08);border:1px solid rgba(238,167,39,.15)}
.modal-icon.done{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.15)}
.modal-title{font-family:${fonts.display};font-size:.9rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:#fff;margin-bottom:10px}
.modal-desc{font-size:.8rem;color:rgba(255,255,255,.5);text-align:center;line-height:1.6;margin-bottom:28px}
.modal-desc strong{color:rgba(255,255,255,.8);font-weight:600}
.modal-btns{display:flex;gap:12px}
.modal-btn{flex:1;padding:13px;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s;border:none}
.modal-btn.cancel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.modal-btn.cancel:hover{background:rgba(255,255,255,.08);color:#fff}
.modal-btn.confirm{background:${colors.gradientPrimary};color:#fff;box-shadow:0 4px 16px ${colors.primaryGlow}}
.modal-btn.confirm:hover{box-shadow:0 6px 24px rgba(253,28,0,.35);transform:translateY(-1px)}
.modal-btn.success{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 4px 16px rgba(16,185,129,.2)}
.modal-btn.success:hover{box-shadow:0 6px 24px rgba(16,185,129,.3);transform:translateY(-1px)}
.modal-btn.ghost{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.modal-btn.ghost:hover{background:rgba(255,255,255,.08);color:#fff}
.modal-team{margin-bottom:20px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.modal-team-h{font-size:.6rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;font-family:${fonts.display};margin-bottom:8px}
.modal-team-v{font-size:.78rem;color:rgba(255,255,255,.7)}
.modal-check{display:flex;align-items:flex-start;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(238,167,39,.04);border:1px solid rgba(238,167,39,.1);margin-bottom:20px;font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.5}
.modal-check svg{flex-shrink:0;margin-top:2px;stroke:#EEA727;width:16px;height:16px}
.modal-notif{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.1);margin-bottom:20px;font-size:.72rem;color:rgba(74,222,128,.8)}
.modal-notif svg{flex-shrink:0;stroke:#4ade80;width:16px;height:16px}

/* Celebration */
.celebrate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;animation:modalFadeIn .3s ease}
.celebrate-card{position:relative;z-index:10001;width:min(500px,90vw);border-radius:24px;background:linear-gradient(170deg,#14101e 0%,#0a0810 50%,#12101a 100%);border:1px solid rgba(255,255,255,.08);padding:48px 40px;text-align:center;animation:celebPop .6s cubic-bezier(.22,1,.36,1);box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 60px rgba(253,28,0,.05)}
@keyframes celebPop{0%{opacity:0;transform:scale(.7) translateY(40px)}60%{transform:scale(1.03)}100%{opacity:1;transform:none}}
.celebrate-emoji{font-size:64px;margin-bottom:20px;animation:celebBounce 1s ease infinite}
@keyframes celebBounce{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-12px) rotate(-5deg)}60%{transform:translateY(-6px) rotate(3deg)}}
.celebrate-title{font-family:${fonts.display};font-size:1.4rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;margin-bottom:12px;background:linear-gradient(135deg,#fff,#faa000);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.celebrate-quote{font-size:.85rem;color:rgba(255,255,255,.4);font-style:italic;margin-bottom:32px;line-height:1.5}
.celebrate-info{display:flex;flex-direction:column;gap:6px;align-items:center;margin-bottom:24px}
.celebrate-team{font-family:${fonts.display};font-size:.7rem;font-weight:700;letter-spacing:2px;color:#fd1c00;padding:6px 16px;border-radius:8px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.12)}
.celebrate-proj{font-size:1rem;font-weight:600;color:#fff;margin-top:4px}
.celebrate-track{font-size:.72rem;color:rgba(255,255,255,.4)}
.celebrate-notif{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:10px;background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.1);margin-bottom:28px;font-size:.74rem;color:rgba(74,222,128,.8)}
.celebrate-notif svg{flex-shrink:0;width:16px;height:16px}
.celebrate-btns{display:flex;gap:12px}
.celebrate-go{flex:1;padding:14px;border-radius:12px;border:none;background:${colors.gradientPrimary};color:#fff;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;box-shadow:0 4px 20px ${colors.primaryGlow};transition:all .25s;letter-spacing:.5px}
.celebrate-go:hover{box-shadow:0 6px 28px rgba(253,28,0,.4);transform:translateY(-2px)}

@media(max-width:768px){
  .stepper{display:none}
  .pg-m.co{margin-right:0}
  .mob{display:flex;gap:2px;padding:10px 12px 8px;background:rgba(5,0,8,.95);position:sticky;top:0;z-index:20;border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0}
  .mob-s{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 2px;border-radius:8px;cursor:pointer;-webkit-tap-highlight-color:transparent}
  .mob-i{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center}
  .mob-l{font-size:.5rem;color:rgba(255,255,255,.4);text-align:center;font-weight:500}
  .ct{padding:0 14px 100px}
  .ct-hdr{padding:16px 0 12px;flex-direction:column;gap:8px}
  .fg{grid-template-columns:1fr}
  .card{padding:20px 16px}
  .mem-grid{grid-template-columns:1fr 1fr}
  .mem-f{grid-template-columns:1fr}
  .rev-g{grid-template-columns:1fr}
  .sub-btn{padding:16px;font-size:.88rem;-webkit-tap-highlight-color:transparent}
  .tg-w{gap:10px}
  .tg{min-width:48px}
  .modal{padding:28px 20px}
  .modal-btns{flex-direction:column}
  .chips{gap:8px}
  .chip{padding:8px 12px;font-size:.76rem}
  .gt{padding:16px;font-size:.82rem}
  .mem-e{padding:8px 12px;font-size:.68rem}
  .sec{margin-bottom:20px}
}
      `}</style>

      <div className="pg">
        {/* ═══ STEPPER SIDEBAR ═══ */}
        <aside className="stepper">
          <div className="st-logo"><div className="st-logo-badge">PS</div><span className="st-logo-text">PROJECT SPACE</span></div>
          {team && <div className="st-badge">{team.teamNumber||`#${team.serialNumber}`} <span>· {team.technology}</span></div>}
          <div className="st-progress"><div className="st-progress-fill" style={{width:`${progressPct}%`}} /></div>
          <div className="st-progress-label">{progressPct}% COMPLETE</div>
          <div className="st-tl">
            <div className="st-line" />
            {STEPS_CONFIG.map(s => (
              <div key={s.num} className="st-step-block">
                <div className="st-row">
                  <div className="st-iw"><div className="st-ic" style={{background:SECTION_COLORS[s.id],boxShadow:`0 0 12px ${SECTION_COLORS[s.id]}30`}}><StepIcon id={s.id} size={18} /></div></div>
                  <div className="st-info" onClick={()=>scrollToSection(s.id)}><div className="st-label">{s.label}</div></div>
                </div>
                {s.subs.length > 0 && (
                  <div className="st-subs">{s.subs.map((sub,i) => {
                    const f=fieldStatus[sub]||false
                    return <div className="st-sub" key={i} onClick={()=>scrollToSection(s.id)}><div className={`st-dot${f?' filled':''}`}/><div className={`st-stxt${f?' filled':''}`}>{sub}</div></div>
                  })}</div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className={`pg-m ${chatOpen?'co':''}`}>
          {isMobile && (
            <div className="mob">
              {STEPS_CONFIG.map(s => (
                <div key={s.id} className="mob-s" onClick={()=>scrollToSection(s.id)}>
                  <div className="mob-i" style={{background:SECTION_COLORS[s.id]}}><StepIcon id={s.id} size={13} /></div>
                  <div className="mob-l">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="ct">
            <div className="ct-hdr">
              <div><div className="ct-t">Team Registration</div><div className="ct-s">Fill all sections below · {progressPct}% complete</div></div>
              {team && <div className="ct-b">{team.technology}</div>}
            </div>
            {error && <div className="err">{error}</div>}
            {success && <div className="suc">{success}</div>}

            {/* ── PROJECT ── */}
            <div className="sec" ref={sectionRefs.project} style={{zIndex:activeSection==='project'?100:50}} onClick={()=>setActiveSection('project')}>
              <div className="card cp"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Project Information</div>
                <div className="fg">
                  <div><FloatingField label="Project Title" required type="input" placeholder="Enter your project title" value={projectTitle} onChange={setProjectTitle} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} /></div>
                  <div><MultiDropdown label="Project Area" options={PROJECT_AREAS} selected={projectArea} onChange={setProjectArea} counts={areaCounts} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} onCustomAdd={()=>{}} /></div>
                  <div><FloatingField label="Project Description" required type="textarea" placeholder="Describe what your project does, expected outcomes..." value={projectDescription} onChange={setProjectDescription} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} rows={4} maxLen={500} /></div>
                  <div><FloatingField label="Problem Statement" type="textarea" placeholder="What problem does your project solve?" value={problemStatement} onChange={setProblemStatement} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} rows={3} maxLen={300} /></div>
                </div>
              </div>
            </div>

            {/* ── TECH STACK ── */}
            <div className="sec" ref={sectionRefs.tech} style={{zIndex:activeSection==='tech'?100:40}} onClick={()=>setActiveSection('tech')}>
              <div className="card ck"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>Tech Stack</div>
                <div className="fg"><div className="fg-full"><MultiDropdown label="Tech Stack" options={techOptions} selected={techStack} onChange={setTechStack} counts={{}} accent={SECTION_COLORS.tech} cardBg={CARD_BG.tech} onCustomAdd={()=>{}} /></div></div>
              </div>
            </div>

            {/* ── AI ── */}
            <div className="sec" ref={sectionRefs.ai} style={{zIndex:activeSection==='ai'?100:30}} onClick={()=>setActiveSection('ai')}>
              <div className="card ca"><div className="card-glow"/>
                <div className="card-h"><img src="https://i.ibb.co/MD0SRjWB/chat-bot.png" alt="" style={{width:'20px',height:'20px',objectFit:'contain',filter:'invert(22%) sepia(90%) saturate(6000%) hue-rotate(345deg) brightness(95%)'}} />Artificial Intelligence</div>
                <div className="tg-w"><button className={`tg ${aiUsage==='Yes'?'on':''}`} onClick={()=>setAiUsage(aiUsage==='Yes'?'No':'Yes')}><div className="tg-d"/></button><span className="tg-t">{aiUsage==='Yes'?'Using AI in project':'No AI usage'}</span></div>
                {aiUsage === 'Yes' && (
                  <div className="fg">
                    <div>
                      <FloatingField label="AI Capabilities" type="input" placeholder="e.g. Image Recognition, NLP..." value={capInput} onChange={setCapInput} accent={SECTION_COLORS.ai} cardBg={CARD_BG.ai} />
                      {capInput.trim() && <button style={{marginTop:'8px',padding:'6px 14px',borderRadius:'8px',background:'rgba(242,29,50,.06)',border:'1px solid rgba(242,29,50,.12)',color:'#f21d32',fontSize:'.74rem',cursor:'pointer',fontFamily:'DM Sans'}} onClick={()=>addChip(capInput,aiCapabilities,setAiCapabilities,setCapInput)}>+ Add Capability</button>}
                      {aiCapabilities.length > 0 && <div className="chips" style={{marginTop:'10px'}}>{aiCapabilities.map(c=><div key={c} className="chip">{c}<button className="chip-x" onClick={()=>removeChip(c,aiCapabilities,setAiCapabilities)}>×</button></div>)}</div>}
                    </div>
                    <div><MultiDropdown label="AI Tools" options={AI_TOOLS} selected={aiTools} onChange={setAiTools} counts={{}} accent={SECTION_COLORS.ai} cardBg={CARD_BG.ai} onCustomAdd={()=>{}} /></div>
                  </div>
                )}
              </div>
            </div>

            {/* ── TEAM ── */}
            <div className="sec" ref={sectionRefs.team} style={{zIndex:activeSection==='team'?100:20}} onClick={()=>setActiveSection('team')}>
              <div className="card ct2"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>Team Members</div>
                {!membersLoaded ? (
                  <button className="gt" onClick={fetchMembers} disabled={loading}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {loading?'Loading...':'Load Team Members'}
                  </button>
                ) : (
                  <>
                    <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.35)',marginBottom:'14px'}}>{members.length} members loaded</div>
                    <div className="mem-grid">
                    {members.map((m,i) => (
                      <div key={m.roll_number} className="mem">
                        <div className="mem-av" style={{overflow:'hidden'}}>{m.image_url?<img src={m.image_url} alt={m.name} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} onError={e=>{e.target.style.display='none';e.target.parentNode.textContent=(m.name||'?')[0].toUpperCase()}}/>:(m.name||'?')[0].toUpperCase()}</div>
                        <div className="mem-i">
                          <div className="mem-n">{m.name}</div>
                          <div className="mem-r">{m.roll_number} · {m.college} · {m.branch}</div>
                        </div>
                        {m.is_leader && <div className="mem-b">Leader</div>}
                        <button className="mem-e" onClick={()=>setEditingMember(editingMember===i?null:i)}>{editingMember===i?'Done':'Edit'}</button>
                        {editingMember===i && (
                          <div className="mem-f">
                            <FloatingField label="Roll Number" type="input" value={m.roll_number||''} onChange={v=>updateMember(i,'roll_number',v)} accent={SECTION_COLORS.team} cardBg={CARD_BG.team} />
                            <FloatingField label="College" type="input" value={m.college||''} onChange={v=>updateMember(i,'college',v)} accent={SECTION_COLORS.team} cardBg={CARD_BG.team} />
                            <FloatingField label="Branch" type="input" value={m.branch||''} onChange={v=>updateMember(i,'branch',v)} accent={SECTION_COLORS.team} cardBg={CARD_BG.team} />
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── REVIEW ── */}
            <div className="sec" ref={sectionRefs.review} style={{zIndex:activeSection==='review'?100:10}} onClick={()=>setActiveSection('review')}>
              <div className="card cr"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Review & Register</div>
                <div className="rev-g">
                  <div className="rev-c"><div className="rev-l">Team</div><div className="rev-v">{team?.teamNumber||`#${team?.serialNumber}`||'—'}</div></div>
                  <div className="rev-c"><div className="rev-l">Technology</div><div className="rev-v">{team?.technology||'—'}</div></div>
                  <div className="rev-c"><div className="rev-l">Title</div><div className="rev-v">{projectTitle||'—'}</div></div>
                  <div className="rev-c"><div className="rev-l">Area</div><div className="rev-v">{projectArea.length?projectArea.join(', '):'—'}</div></div>
                  <div className="rev-c full"><div className="rev-l">Description</div><div className="rev-v">{projectDescription||'—'}</div></div>
                  {techStack.length>0 && <div className="rev-c full"><div className="rev-l">Tech Stack</div><div className="rev-ch">{techStack.map(t=><span key={t}>{t}</span>)}</div></div>}
                  <div className="rev-c"><div className="rev-l">Members</div><div className="rev-v">{membersLoaded?`${members.length} loaded`:'Not loaded'}</div></div>
                  <div className="rev-c"><div className="rev-l">AI</div><div className="rev-v">{aiUsage}</div></div>
                </div>
                <button className="sub-btn" onClick={handleRegisterClick} disabled={saving||!projectTitle.trim()||!projectDescription.trim()}>{saving?'Registering...':'Register Team'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {user && <SpaceBot teamData={teamDataForBot} onToggle={setChatOpen} onAddToField={(key, text) => {
        switch(key) {
          case 'title': setProjectTitle(text); scrollToSection('project'); break
          case 'desc': setProjectDescription(text); scrollToSection('project'); break
          case 'problem': setProblemStatement(text); scrollToSection('project'); break
          case 'ai': setAiCapabilities(prev => prev.includes(text) ? prev : [...prev, text]); scrollToSection('ai'); break
          case 'tech': setTechStack(prev => prev.includes(text) ? prev : [...prev, text]); scrollToSection('tech'); break
        }
      }} />}

      {/* ═══ CONFIRM MODAL ═══ */}
      {showConfirm && (
        <div className="modal-overlay" onClick={()=>setShowConfirm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-icon warn">⚠️</div>
            <div className="modal-title">Confirm Registration</div>
            <div className="modal-desc">Are you sure you want to submit your registration?<br/>Once submitted, <strong>details cannot be edited</strong>.</div>
            <div className="modal-team">
              <div className="modal-team-h">Submitting for</div>
              <div className="modal-team-v"><strong>{team?.teamNumber||`#${team?.serialNumber}`}</strong> · {projectTitle} · {members.length||0} members</div>
            </div>
            <div className="modal-check">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Please review all sections carefully before confirming. Check project title, description, tech stack, and team member details.
            </div>
            <div className="modal-btns">
              <button className="modal-btn cancel" onClick={()=>setShowConfirm(false)}>Go Back</button>
              <button className="modal-btn confirm" onClick={handleConfirmSubmit} disabled={saving}>{saving?'Submitting...':'Yes, Register'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUCCESS CELEBRATION ═══ */}
      {showSuccess && (
        <div className="celebrate-overlay">
          <canvas id="confettiCanvas" style={{position:'fixed',inset:0,zIndex:10000,pointerEvents:'none'}}/>
          <div className="celebrate-card">
            <div className="celebrate-emoji">🎉</div>
            <div className="celebrate-title">Welcome on Board!</div>
            <div className="celebrate-quote">"Every great project begins with a single commit."</div>
            <div className="celebrate-info">
              <div className="celebrate-team">{team?.teamNumber||`Team #${team?.serialNumber}`}</div>
              <div className="celebrate-proj">{projectTitle}</div>
              <div className="celebrate-track">{team?.technology} Track</div>
            </div>
            <div className="celebrate-notif">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              All team members have been notified via email
            </div>
            <div className="celebrate-btns">
              <button className="modal-btn ghost" onClick={()=>{setShowSuccess(false);router.push('/auth/login')}}>Login Page</button>
              <button className="celebrate-go" onClick={()=>{setShowSuccess(false);router.push('/dashboard')}}>Let's Go! →</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}