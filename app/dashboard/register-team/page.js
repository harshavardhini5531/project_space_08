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
  const [shortNameInput, setShortNameInput] = useState('')
  const [shortNameError, setShortNameError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [areaCounts, setAreaCounts] = useState({})
  const [activeSection, setActiveSection] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoLoaded, setInfoLoaded] = useState(false)

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
  const [projectShortName, setProjectShortName] = useState('')
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
    if (!u) { try { const raw = typeof window !== 'undefined' ? localStorage.getItem('ps_user') : null; if (raw) u = JSON.parse(raw) } catch {} }
    if(!u){router.push('/auth/login');return}
    if(u.role!=='leader'){router.push('/auth/login');return}
    const roll = u.rollNumber || u.roll_number || ''
    if(!roll){setError('Session missing roll number. Please login again.');setLoading(false);return}
    setUser({...u, rollNumber: roll}); fetchTeamInfo(roll)
  }, [])

  async function fetchTeamInfo(roll) {
    try {
      const res=await fetch('/api/auth/team-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:roll})})
      const data=await res.json()
      if(!res.ok){setError(data.error);setLoading(false);return}
      setTeam(data.team)
    } catch{setError('Failed to load team data')} finally{setLoading(false)}
  }

  async function fetchProjectInfo() {
    if(!user || infoLoading) return
    setInfoLoading(true)
    try {
      const res = await fetch('/api/auth/get-team-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: user.rollNumber || user.roll_number })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setInfoLoading(false); return }
      const t = data.team
      if (t.projectTitle) setProjectTitle(t.projectTitle)
      if (t.projectDescription) setProjectDescription(t.projectDescription)
      if (t.problemStatement) setProblemStatement(t.problemStatement)
      if (t.aiUsage) setAiUsage(t.aiUsage)
      setInfoLoaded(true)
    } catch { setError('Failed to fetch project info') }
    finally { setInfoLoading(false) }
  }

  async function fetchMembers() {
    if(!user) return; setLoading(true)
    try {
      const res=await fetch('/api/auth/team-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:user.rollNumber||user.roll_number})})
      const data=await res.json()
      if(!res.ok){setError(data.error);return}
      const membersWithShort = (data.members||[]).map(m => ({...m, short_name: m.short_name || generateShortName(m.name)}))
      setMembers(membersWithShort); setMembersLoaded(true)
    } catch{setError('Failed to load members')} finally{setLoading(false)}
  }

  function addChip(val,list,setList,setInput) { const v=val.trim(); if(v&&!list.includes(v)){setList([...list,v]);setInput('')} }
  function removeChip(val,list,setList) { setList(list.filter(x=>x!==val)) }
  function updateMember(i,field,val) { const u=[...members]; u[i]={...u[i],[field]:val}; setMembers(u) }

  function generateShortName(fullName) {
    if (!fullName) return ''
    const words = fullName.trim().split(/\s+/)
    return words.reduce((a,b) => b.length > a.length ? b : a, '')
  }

  function validateShortName(shortName, fullName) {
    if (!shortName || !fullName) return false
    return fullName.toLowerCase().includes(shortName.toLowerCase())
  }

  function saveShortName(i) {
    const m = members[i]
    if (!validateShortName(shortNameInput, m.name)) {
      setShortNameError('Short name must be a part of your full name')
      return
    }
    updateMember(i, 'short_name', shortNameInput.trim())
    setShortNameInput('')
    setShortNameError('')
  }

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

  function isSectionFilled(sectionId) {
    const step = STEPS_CONFIG.find(s=>s.id===sectionId)
    if(!step || !step.fields.length) return false
    return step.fields.some(f=>isFieldFilled(f))
  }

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
      if(data.teamNumber) setTeam(prev=>({...prev, teamNumber: data.teamNumber}))
      try {
        const notifRes=await fetch('/api/auth/notify-team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamNumber:data.teamNumber||team.serialNumber,projectTitle,technology:team.technology,leaderName:user?.name||'',members})})
        await notifRes.json()
      } catch(e){console.error('Notify failed:',e)}
      setSaving(false);setShowSuccess(true)
    } catch{setError('Network error. Try again.');setSaving(false)}
  }

  const techOptions = TECH_STACK_OPTIONS
  const teamDataForBot = team ? {
    teamNumber: team.teamNumber || 'Not assigned yet',
    serialNumber: team.serialNumber,
    technology: team.technology,
    leaderName: user?.name || '',
    memberCount: members.length,
    currentTitle: projectTitle,
    currentDescription: projectDescription,
    currentProblem: problemStatement,
    currentArea: projectArea,
    currentAI: aiCapabilities,
    currentTech: techStack,
    // Master data from teams table for SpaceBot context
    masterTitle: team.projectTitle || '',
    masterDescription: team.projectDescription || '',
    masterProblem: team.problemStatement || '',
    masterAiUsage: team.aiUsage || 'No',
  } : {}

  const StepIcon = ({id,size}) => {
    if(id==='ai') return React.createElement('img',{src:'https://i.ibb.co/MD0SRjWB/chat-bot.png',alt:'',style:{width:size+'px',height:size+'px',objectFit:'contain',filter:'brightness(0) invert(1)'}})
    return React.createElement(STEP_ICONS[id],{size,color:'#fff'})
  }

  if(loading&&!team) return <div style={{width:'100%',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'rgba(255,255,255,.4)',fontFamily:'sans-serif'}}>Loading...</div>

  // Already registered — show simple message
  if(team && team.registered) return (
    <div style={{width:'100%',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:'center',maxWidth:'480px',padding:'48px 40px',borderRadius:'24px',background:'linear-gradient(170deg,#14101e,#0a0810)',border:'1px solid rgba(255,255,255,.08)',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}>
        <div style={{fontSize:'56px',marginBottom:'20px'}}>✅</div>
        <div style={{fontFamily:fonts.display,fontSize:'1.1rem',fontWeight:700,letterSpacing:'3px',textTransform:'uppercase',color:'#fff',marginBottom:'12px'}}>Already Registered</div>
        <div style={{fontSize:'.85rem',color:'rgba(255,255,255,.45)',lineHeight:1.6,marginBottom:'24px'}}>Your team <strong style={{color:'#fd1c00'}}>{team.teamNumber || `#${team.serialNumber}`}</strong> has been successfully registered for the <strong style={{color:'#EEA727'}}>{team.technology}</strong> track.</div>
        <div style={{padding:'14px 18px',borderRadius:'12px',background:'rgba(74,222,128,.04)',border:'1px solid rgba(74,222,128,.12)',marginBottom:'28px',fontSize:'.78rem',color:'rgba(74,222,128,.8)',lineHeight:1.5}}>All team members have been notified. See you at Project Space on May 6!</div>
        <button onClick={()=>router.push('/')} style={{padding:'13px 32px',borderRadius:'12px',background:colors.gradientPrimary,border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.88rem',fontWeight:600,cursor:'pointer',boxShadow:`0 4px 20px ${colors.primaryGlow}`,transition:'all .25s'}}>← Back to Home</button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
${globalStyles}
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap');
@keyframes dotPop{0%{transform:translateX(-3.5px) scale(1)}50%{transform:translateX(-3.5px) scale(1.4)}100%{transform:translateX(-3.5px) scale(1)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes shimmer{0%{transform:translateX(-50%)}100%{transform:translateX(50%)}}
@keyframes ringShine{0%{background-position:100% 100%}50%{background-position:0% 0%}100%{background-position:100% 100%}}
@keyframes editSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes glowSpin{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes modalFadeIn{from{opacity:0}to{opacity:1}}
@keyframes modalPop{from{opacity:0;transform:scale(.9) translateY(20px)}to{opacity:1;transform:none}}
@keyframes celebPop{0%{opacity:0;transform:scale(.7) translateY(40px)}60%{transform:scale(1.03)}100%{opacity:1;transform:none}}
@keyframes celebBounce{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-12px) rotate(-5deg)}60%{transform:translateY(-6px) rotate(3deg)}}
html,body{overflow:hidden!important;background:#050008}

.pg{display:flex;height:100vh}
.pg-m{flex:1;display:flex;flex-direction:column;overflow:hidden;transition:margin-right .3s ease;container-type:inline-size;container-name:main}
.pg-m.co{margin-right:370px}

.stepper{width:280px;flex-shrink:0;height:100vh;position:sticky;top:0;background:linear-gradient(180deg,#0c0616 0%,#080310 100%);border-right:1px solid rgba(253,28,0,.06);display:flex;flex-direction:column;overflow-y:auto;font-family:${fonts.body};color:#fff}
.stepper::-webkit-scrollbar{width:3px}.stepper::-webkit-scrollbar-thumb{background:rgba(253,28,0,.15);border-radius:3px}
.st-logo{display:flex;align-items:center;gap:10px;padding:22px 22px 0}
.st-logo-badge{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-family:${fonts.display};font-size:11px;font-weight:700;color:#fff;box-shadow:0 0 16px rgba(253,28,0,.25)}
.st-logo-text{font-family:${fonts.display};font-size:0.68rem;font-weight:700;letter-spacing:2.5px;color:rgba(255,255,255,.85)}
.st-badge{margin:16px 22px 10px;padding:10px 16px;background:linear-gradient(135deg,rgba(253,28,0,0.1),rgba(250,160,0,.04));border:1px solid rgba(253,28,0,0.18);border-radius:10px;font-size:.72rem;font-weight:600;color:#fd1c00;letter-spacing:1px}
.st-badge span{color:rgba(255,255,255,0.5);font-weight:400}
.st-progress{margin:4px 22px 0;height:4px;border-radius:4px;background:rgba(255,255,255,.05);overflow:hidden}
.st-progress-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width .5s cubic-bezier(.4,0,.2,1)}
.st-progress-label{margin:4px 22px 20px;font-size:.55rem;color:rgba(255,255,255,.3);letter-spacing:1px}
.st-tl{flex:1;padding:0 0 24px;position:relative;display:flex;flex-direction:column;justify-content:space-between}
.st-line{position:absolute;left:${AXIS}px;top:0;bottom:0;width:1.5px;background:#4b4e53;z-index:0;transform:translateX(-0.75px)}
.st-step-block{position:relative;z-index:1}
.st-row{display:flex;align-items:center;padding:3px 16px 3px 0}
.st-iw{width:${AXIS*2}px;display:flex;justify-content:center;flex-shrink:0;position:relative;z-index:3}
.st-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:3;transition:all .3s}
.st-info{flex:1;cursor:pointer;padding:10px 14px 10px 0;margin-left:-14px;border-radius:10px;transition:background .2s}
.st-info:hover{background:rgba(255,255,255,0.04)}
.st-label{font-family:${fonts.display};font-size:.61rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.9)}
.st-subs{padding:8px 0 4px}
.st-sub{display:flex;align-items:center;padding:8px 0;position:relative;cursor:pointer}
.st-sub:hover .st-stxt{color:rgba(255,255,255,.65)}
.st-dot{position:absolute;left:${AXIS}px;width:7px;height:7px;border-radius:50%;background:${SIDE_BG};border:1.5px solid #4b4e53;transform:translateX(-3.5px);z-index:3;transition:all .4s cubic-bezier(.4,0,.2,1)}
.st-dot.filled{box-shadow:0 0 8px currentColor;animation:dotPop .4s cubic-bezier(.34,1.56,.64,1)}
.st-dot.clr-project{border-color:#EEA727}.st-dot.clr-project.filled{background:#EEA727;border-color:#EEA727;color:#EEA727}
.st-dot.clr-tech{border-color:#10b981}.st-dot.clr-tech.filled{background:#10b981;border-color:#10b981;color:#10b981}
.st-dot.clr-ai{border-color:#f21d32}.st-dot.clr-ai.filled{background:#f21d32;border-color:#f21d32;color:#f21d32}
.st-dot.clr-team{border-color:#7B2FBE}.st-dot.clr-team.filled{background:#7B2FBE;border-color:#7B2FBE;color:#7B2FBE}
.st-dot.clr-review{border-color:#BDE8F5}.st-dot.clr-review.filled{background:#BDE8F5;border-color:#BDE8F5;color:#BDE8F5}
.st-stxt{font-family:'Open Sans',sans-serif;font-size:.73rem;color:rgba(255,255,255,0.35);margin-left:${AXIS+16}px;transition:color .3s}
.st-stxt.filled{color:rgba(255,255,255,.8)}
.mob{display:none}

.ct{flex:1;overflow-y:auto;padding:0 44px 100px;-webkit-overflow-scrolling:touch;will-change:scroll-position}
.ct::-webkit-scrollbar{display:none}.ct{scrollbar-width:none}
.ct-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:28px 0 18px;margin:0 0 8px;border-bottom:1px solid rgba(255,255,255,.04);position:sticky;top:0;z-index:200;background:#050008}
.ct-t{font-family:${fonts.display};font-size:1rem;font-weight:600;letter-spacing:3px;text-transform:uppercase}
.ct-s{font-size:.72rem;color:rgba(255,255,255,.35);margin-top:5px}
.ct-b{padding:6px 14px;border-radius:8px;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);font-size:.65rem;color:#fd1c00;font-weight:500;text-transform:uppercase;letter-spacing:2px;font-family:${fonts.display}}

.sec{margin-bottom:28px;animation:fadeUp .4s ease both;scroll-margin-top:80px;position:relative}
.sec:first-child{margin-top:20px}
.sec:focus-within{z-index:100!important}
.card{border-radius:16px;padding:27px 32px 32px;position:relative;transition:border-color .3s,box-shadow .3s;border:none;overflow:visible;z-index:1}
.card textarea{max-width:100%;overflow-y:auto;resize:vertical}
.card:focus-within{z-index:100}
.card-glow{position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:-2;pointer-events:none}
.card-glow::before{content:'';position:absolute;top:50%;left:50%;width:300%;height:300%;transform-origin:center;animation:glowSpin 12s linear infinite;opacity:0;transition:opacity .5s}
.card:focus-within .card-glow::before{opacity:1}
.card::after{content:'';position:absolute;inset:1.5px;border-radius:15px;background:#0a0a0a;z-index:-1;pointer-events:none}

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
.cp .card-h{color:#EEA727;border-bottom-color:rgba(238,167,39,.15)}.cp .card-h svg{stroke:#EEA727}
.ca .card-h{color:#f21d32;border-bottom-color:rgba(242,29,50,.15)}.ca .card-h svg{stroke:#f21d32}
.ck .card-h{color:#10b981;border-bottom-color:rgba(16,185,129,.15)}.ck .card-h svg{stroke:#10b981}
.ct2 .card-h{color:#7B2FBE;border-bottom-color:rgba(123,47,190,.15)}.ct2 .card-h svg{stroke:#7B2FBE}
.cr .card-h{color:#BDE8F5;border-bottom-color:rgba(189,232,245,.15)}.cr .card-h svg{stroke:#BDE8F5}

.cp .pf-lbl,.cp .mdd-fl{color:#EEA727!important}
.ck .pf-lbl,.ck .mdd-fl{color:#10b981!important}
.ca .pf-lbl,.ca .mdd-fl{color:#f21d32!important}
.ct2 .pf-lbl,.ct2 .mdd-fl{color:#7B2FBE!important}
.cr .pf-lbl,.cr .mdd-fl{color:#BDE8F5!important}

.fg{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px;position:relative}
.fg>div{position:relative;z-index:1}
.fg-full{grid-column:1/-1}
@container main (max-width:800px){.fg{grid-template-columns:1fr}.fg-full{grid-column:1}.rev-g{grid-template-columns:1fr 1fr}}
@container main (max-width:600px){.rev-g{grid-template-columns:1fr!important}}
@container main (max-width:500px){.card{padding:22px 18px}.ct{padding:0 16px 80px}.ct-hdr{flex-direction:column;gap:8px}}

.tg-w{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.tg{width:52px;height:28px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08);cursor:pointer;position:relative;transition:all .3s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;flex-shrink:0}
.tg.on{background:rgba(242,29,50,.3);border-color:rgba(242,29,50,.2)}
.tg-d{width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:transform .25s cubic-bezier(.34,1.56,.64,1);box-shadow:0 1px 4px rgba(0,0,0,.2)}
.tg.on .tg-d{transform:translateX(24px)}
.tg-t{font-size:.82rem;color:rgba(255,255,255,.5);user-select:none}

.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:rgba(242,29,50,.06);border:1px solid rgba(242,29,50,.12);font-size:.74rem;color:rgba(255,255,255,.65)}
.chip-x{width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.05);cursor:pointer;font-size:9px;color:rgba(255,255,255,.4);border:none;transition:all .15s}
.chip-x:hover{background:rgba(242,29,50,.2);color:#fff}
.chip-tk{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.12)}
.chip-tk .chip-x:hover{background:rgba(16,185,129,.2);color:#fff}

/* ═══ Get Info Button (amber, same style as Get Team) ═══ */
.gi{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 24px;border-radius:12px;background:linear-gradient(135deg,#EEA727,#d4911e);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .3s;box-shadow:0 4px 24px rgba(238,167,39,.25);position:relative;overflow:hidden;margin-top:8px;float:right}
.gi::before{content:'';position:absolute;top:0;left:-100%;width:200%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);animation:shimmer 3s infinite}
.gi:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(238,167,39,.35)}
.gi:disabled{opacity:.7;pointer-events:none}
.gi svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.gi-done{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);color:#4ade80;font-size:.72rem;font-weight:500;margin-top:8px;float:right}
.gi-done svg{width:14px;height:14px;stroke:#4ade80;fill:none;stroke-width:2.5}

/* ═══ TEAM — Get Team Button (gradient + shimmer) ═══ */
.gt{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px 32px;border-radius:12px;background:linear-gradient(135deg,#7B2FBE,#5a1fa0);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .3s;box-shadow:0 4px 24px rgba(123,47,190,.25);position:relative;overflow:hidden}
.gt::before{content:'';position:absolute;top:0;left:-100%;width:200%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);animation:shimmer 3s infinite}
.gt:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(123,47,190,.35)}
.gt:disabled{opacity:.7;pointer-events:none}
.gt svg{width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

.tm-count{font-family:${fonts.display};font-size:11px;font-weight:500;color:#9b5cd6;background:rgba(123,47,190,.08);border:1px solid rgba(123,47,190,.15);padding:4px 12px;border-radius:100px}

/* Avatar ring with shine */
.tm-avatar{position:relative;flex-shrink:0}
.tm-av-ring{width:52px;height:52px;border-radius:50%;padding:1px;background:conic-gradient(from 0deg,#c084fc,#5b21b6,#c084fc,#5b21b6);position:relative}
.tm-av-ring::after{content:'';position:absolute;inset:0;border-radius:50%;background:linear-gradient(45deg,transparent 40%,rgba(192,132,252,.5) 48%,rgba(192,132,252,.8) 50%,rgba(192,132,252,.5) 52%,transparent 60%);background-size:300% 300%;animation:ringShine 3s ease-in-out infinite;pointer-events:none;z-index:0}
.tm-av-inner{width:100%;height:100%;border-radius:50%;background:#13101a;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:#9b5cd6;overflow:hidden;position:relative;z-index:1}
.tm-av-inner img{width:100%;height:100%;object-fit:cover;border-radius:50%}

/* Leader badge — top left of card */
.ldr-badge{position:absolute;top:12px;left:14px;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#ff1d00,#c41600);padding:3px 10px;border-radius:100px;white-space:nowrap;box-shadow:0 2px 8px rgba(255,29,0,.3);z-index:3}

/* Tech badge — top right */
.tech-badge{position:absolute;top:12px;right:14px;font-size:10px;font-weight:600;color:#9b5cd6;background:rgba(123,47,190,.1);border:1px solid rgba(123,47,190,.25);padding:4px 12px;border-radius:100px;display:flex;align-items:center;gap:5px;z-index:2;white-space:nowrap;text-transform:uppercase}
.tech-badge svg{width:12px;height:12px;stroke:#9b5cd6;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

/* Unified member grid — ALL members same card */
.ct2 .card-h{margin-bottom:3px}
.tm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.tm-card{position:relative;background:#0d0a14;border:1px solid rgba(123,47,190,.15);border-radius:14px;padding:20px;padding-top:38px;display:flex;flex-direction:column;gap:14px;animation:cardIn .5s ease-out both;transition:border-color .3s,box-shadow .3s,transform .3s}
.tm-card:hover{border-color:rgba(123,47,190,.4);box-shadow:0 4px 24px rgba(123,47,190,.08);transform:translateY(-2px)}
.tm-card:nth-child(1){animation-delay:.05s}.tm-card:nth-child(2){animation-delay:.1s}.tm-card:nth-child(3){animation-delay:.15s}.tm-card:nth-child(4){animation-delay:.2s}.tm-card:nth-child(5){animation-delay:.25s}.tm-card:nth-child(6){animation-delay:.3s}
.tm-card-top{display:flex;align-items:center;gap:14px}
.tm-grid .tm-card:last-child:nth-child(odd){grid-column:1}

.tm-info{flex:1;min-width:0}
.tm-name{font-family:'DM Sans',sans-serif;font-size:14.5px;font-weight:600;color:#fff;margin-bottom:1px;text-transform:uppercase;letter-spacing:.3px}
.tm-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.tm-chip{font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:500;color:#8a7f96;background:#13101a;border:1px solid rgba(255,255,255,.05);padding:3px 10px;border-radius:6px;display:flex;align-items:center;gap:5px;white-space:nowrap}
.tm-chip svg{width:12px;height:12px;stroke:#5a5168;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tm-short-chip{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:500;color:#8a7f96;background:#13101a;border:1px solid rgba(255,255,255,.05);padding:3px 10px;border-radius:6px}
.tm-short-lb{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9b5cd6}

.tm-actions{display:flex;justify-content:flex-end;margin-top:auto;padding-top:4px}
.tm-btn-edit{display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:500;color:#9b5cd6;background:rgba(123,47,190,.06);border:1px solid rgba(123,47,190,.15);padding:7px 16px;border-radius:8px;cursor:pointer;transition:all .25s;text-transform:uppercase;letter-spacing:.5px}
.tm-btn-edit:hover{background:rgba(123,47,190,.15);border-color:rgba(123,47,190,.4);box-shadow:0 0 12px rgba(123,47,190,.1)}
.tm-btn-edit svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

.tm-edit{display:flex;flex-direction:column;gap:12px;padding-top:14px;border-top:1px solid rgba(123,47,190,.1);animation:editSlide .3s ease-out}
.tm-edit-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tm-edit-row.full{grid-template-columns:1fr}
.tm-field-lb{font-family:'DM Sans',sans-serif;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#5a5168;margin-bottom:5px;display:flex;align-items:center;gap:5px}
.tm-field-lb svg{width:11px;height:11px;stroke:#5a5168;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.tm-field-in{width:100%;font-family:'DM Sans',sans-serif;font-size:13px;color:#e8e0f0;background:#13101a;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:9px 12px;outline:none;transition:border-color .25s,box-shadow .25s}
.tm-field-in:focus{border-color:#7B2FBE;box-shadow:0 0 0 3px rgba(123,47,190,.25)}
.tm-field-in::placeholder{color:#5a5168}
.tm-field-in.readonly{color:#8a7f96;background:rgba(255,255,255,.02);border-style:dashed;cursor:default}
.tm-edit-btns{display:flex;justify-content:flex-end;gap:8px;padding-top:4px}
.tm-btn-save{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:#fff;background:linear-gradient(135deg,#7B2FBE,#5a1fa0);border:none;padding:8px 22px;border-radius:8px;cursor:pointer;transition:all .25s}
.tm-btn-save:hover{box-shadow:0 4px 16px rgba(123,47,190,.25);transform:translateY(-1px)}
.tm-btn-cancel{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:#8a7f96;background:transparent;border:1px solid rgba(255,255,255,.08);padding:8px 16px;border-radius:8px;cursor:pointer;transition:all .25s}
.tm-btn-cancel:hover{border-color:rgba(255,255,255,.15);color:#e8e0f0}
.tm-short-err{font-size:10px;color:#f21d32;margin-top:2px}

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

.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:modalFadeIn .25s ease}
.modal{width:min(440px,90vw);border-radius:20px;background:linear-gradient(160deg,#12101a,#0a0810);border:1px solid rgba(255,255,255,.06);padding:36px 32px;animation:modalPop .35s cubic-bezier(.22,1,.36,1);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.modal-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}
.modal-icon.warn{background:rgba(238,167,39,.08);border:1px solid rgba(238,167,39,.15)}
.modal-title{font-family:${fonts.display};font-size:.9rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:#fff;margin-bottom:10px}
.modal-desc{font-size:.8rem;color:rgba(255,255,255,.5);text-align:center;line-height:1.6;margin-bottom:28px}
.modal-desc strong{color:rgba(255,255,255,.8);font-weight:600}
.modal-btns{display:flex;gap:12px}
.modal-btn{flex:1;padding:13px;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s;border:none}
.modal-btn.cancel{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.modal-btn.cancel:hover{background:rgba(255,255,255,.08);color:#fff}
.modal-btn.confirm{background:${colors.gradientPrimary};color:#fff;box-shadow:0 4px 16px ${colors.primaryGlow}}
.modal-btn.confirm:hover{box-shadow:0 6px 24px rgba(253,28,0,.35);transform:translateY(-1px)}
.modal-btn.ghost{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
.modal-btn.ghost:hover{background:rgba(255,255,255,.08);color:#fff}
.modal-team{margin-bottom:20px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.modal-team-h{font-size:.6rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;font-family:${fonts.display};margin-bottom:8px}
.modal-team-v{font-size:.78rem;color:rgba(255,255,255,.7)}
.modal-check{display:flex;align-items:flex-start;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(238,167,39,.04);border:1px solid rgba(238,167,39,.1);margin-bottom:20px;font-size:.72rem;color:rgba(255,255,255,.55);line-height:1.5}
.modal-check svg{flex-shrink:0;margin-top:2px;stroke:#EEA727;width:16px;height:16px}

.celebrate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;animation:modalFadeIn .3s ease}
.celebrate-card{position:relative;z-index:10001;width:min(500px,90vw);border-radius:24px;background:linear-gradient(170deg,#14101e 0%,#0a0810 50%,#12101a 100%);border:1px solid rgba(255,255,255,.08);padding:48px 40px;text-align:center;animation:celebPop .6s cubic-bezier(.22,1,.36,1);box-shadow:0 30px 80px rgba(0,0,0,.6)}
.celebrate-emoji{font-size:64px;margin-bottom:20px;animation:celebBounce 1s ease infinite}
.celebrate-title{font-family:${fonts.display};font-size:1.4rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;margin-bottom:12px;background:linear-gradient(135deg,#fff,#faa000);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.celebrate-quote{font-size:.85rem;color:rgba(255,255,255,.4);font-style:italic;margin-bottom:32px;line-height:1.5}
.celebrate-info{display:flex;flex-direction:column;gap:6px;align-items:center;margin-bottom:24px}
.celebrate-team{font-family:${fonts.display};font-size:.7rem;font-weight:700;letter-spacing:2px;color:#fd1c00;padding:6px 16px;border-radius:8px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.12)}
.celebrate-proj{font-size:1rem;font-weight:600;color:#fff;margin-top:4px}
.celebrate-track{font-size:.72rem;color:rgba(255,255,255,.4)}
.celebrate-notif{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;border-radius:10px;background:rgba(74,222,128,.04);border:1px solid rgba(74,222,128,.1);margin-bottom:28px;font-size:.74rem;color:rgba(74,222,128,.8)}
.celebrate-notif svg{flex-shrink:0;width:16px;height:16px}
.celebrate-btns{display:flex;gap:12px}
.celebrate-go{flex:1;padding:14px;border-radius:12px;border:none;background:${colors.gradientPrimary};color:#fff;font-family:'DM Sans',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;box-shadow:0 4px 20px ${colors.primaryGlow};transition:all .25s}
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
  .rev-g{grid-template-columns:1fr}
  .sub-btn{padding:16px;font-size:.88rem;-webkit-tap-highlight-color:transparent}
  .tg-w{gap:10px}
  .modal{padding:28px 20px}
  .modal-btns{flex-direction:column}
  .chips{gap:8px}.chip{padding:8px 12px;font-size:.76rem}
  .gt{padding:14px 24px;font-size:13px}
  .gi{font-size:12px;padding:10px 20px}
  .sec{margin-bottom:20px}
  .tm-grid{grid-template-columns:1fr}
  .tm-card{padding:16px;padding-top:36px}
  .tm-card-top{flex-direction:column;text-align:center}
  .tm-card .tm-meta{justify-content:center}
  .tm-card .tm-short-chip{justify-content:center}
  .tm-edit-row{grid-template-columns:1fr}
  .tm-actions{justify-content:center}
}
      `}</style>

      <div className="pg">
        <aside className="stepper">
          <div className="st-logo"><div className="st-logo-badge">PS</div><span className="st-logo-text">PROJECT SPACE</span></div>
          {team && <div className="st-badge">{team.teamNumber||'Awaiting Registration'} <span>· {team.technology}</span></div>}
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
                    return <div className="st-sub" key={i} onClick={()=>scrollToSection(s.id)}><div className={`st-dot clr-${s.id}${f?' filled':''}`}/><div className={`st-stxt${f?' filled':''}`}>{sub}</div></div>
                  })}</div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className={`pg-m ${chatOpen?'co':''}`}>
          {isMobile && (
            <div className="mob">
              {STEPS_CONFIG.map(s => {
                const filled = isSectionFilled(s.id)
                return (
                <div key={s.id} className="mob-s" onClick={()=>scrollToSection(s.id)}>
                  <div className="mob-i" style={{background:filled?SECTION_COLORS[s.id]:'#2a2a2f',transition:'background .3s'}}><StepIcon id={s.id} size={13} /></div>
                  <div className="mob-l" style={{color:filled?SECTION_COLORS[s.id]:undefined}}>{s.label}</div>
                </div>
              )})}
            </div>
          )}

          <div className="ct">
            <div className="ct-hdr">
              <div><div className="ct-t">Team Registration</div><div className="ct-s">Fill all sections below · {progressPct}% complete</div></div>
              {team && <div className="ct-b">{team.technology}</div>}
            </div>
            {error && <div className="err" style={{position:'fixed',top:'16px',left:'50%',transform:'translateX(-50%)',zIndex:9999,maxWidth:'500px',width:'90%',boxShadow:'0 8px 32px rgba(0,0,0,.5)',animation:'fadeUp .3s ease',display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{flex:1}}>{error}</span>
              <button onClick={()=>setError('')} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:'16px',flexShrink:0}}>✕</button>
            </div>}
            {success && <div className="suc">{success}</div>}

            {/* ── PROJECT ── */}
            <div className="sec" ref={sectionRefs.project} style={{zIndex:activeSection==='project'?100:50}} onClick={()=>setActiveSection('project')}>
              <div className="card cp"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>Project Information</div>
                <div className="fg">
                  <div>
                    <FloatingField label="Project Title" required type="input" placeholder="Enter your project title (max 25 chars)" value={projectTitle} onChange={v=>{ if(v.length<=25) setProjectTitle(v) }} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} />
                    <div style={{textAlign:'right',fontSize:'.58rem',color:projectTitle.length>=23?'#fd1c00':'rgba(255,255,255,.2)',marginTop:'4px',fontWeight:500}}>{projectTitle.length}/25</div>
                  </div>
                  <div><MultiDropdown label="Project Area" options={PROJECT_AREAS} selected={projectArea} onChange={setProjectArea} counts={areaCounts} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} onCustomAdd={()=>{}} /></div>
                  <div><FloatingField label="Project Description" required type="textarea" placeholder="Describe what your project does..." value={projectDescription} onChange={setProjectDescription} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} rows={4} maxLen={500} /></div>
                  <div><FloatingField label="Problem Statement" type="textarea" placeholder="What problem does your project solve?" value={problemStatement} onChange={setProblemStatement} accent={SECTION_COLORS.project} cardBg={CARD_BG.project} rows={3} maxLen={300} /></div>
                </div>
                {/* Get Info Button — bottom right */}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:'16px',clear:'both'}}>
                  {infoLoaded ? (
                    <div className="gi-done">
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      Info Loaded — Edit fields above
                    </div>
                  ) : (
                    <button className="gi" onClick={fetchProjectInfo} disabled={infoLoading}>
                      <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {infoLoading ? 'Fetching...' : 'Get Info'}
                    </button>
                  )}
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

            {/* ── TEAM — Unified grid, all members same card ── */}
            <div className="sec" ref={sectionRefs.team} style={{zIndex:activeSection==='team'?100:20}} onClick={()=>setActiveSection('team')}>
              <div className="card ct2"><div className="card-glow"/>
                <div className="card-h" style={{justifyContent:'space-between'}}><span style={{display:'flex',alignItems:'center',gap:'8px'}}><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>Team Members</span>{membersLoaded&&<span className="tm-count">{members.length} Members</span>}</div>

                {!membersLoaded ? (
                  <button className="gt" onClick={fetchMembers} disabled={loading}>
                    <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <span>{loading?'Fetching...':'Get Team Members'}</span>
                  </button>
                ) : members.length > 0 && (
                  <div className="tm-grid">
                    {members.map((m)=>{const i=members.indexOf(m);return(
                      <div key={m.roll_number} className="tm-card">
                        {m.is_leader && <div className="ldr-badge">★ LEADER</div>}
                        <span className="tech-badge"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>{team?.technology}</span>
                        <div className="tm-card-top">
                          <div className="tm-avatar">
                            <div className="tm-av-ring"><div className="tm-av-inner">{m.image_url?<img src={m.image_url} alt={m.name} onError={e=>{e.target.style.display='none';e.target.parentNode.textContent=(m.name||'?')[0]}}/>:(m.name||'?')[0]}</div></div>
                          </div>
                          <div className="tm-info">
                            <div className="tm-name">{m.name}</div>
                            <div className="tm-meta">
                              <span className="tm-chip"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></svg>{m.roll_number}</span>
                              <span className="tm-chip"><svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>{m.college} · {m.branch}</span>
                            </div>
                            <div className="tm-short-chip"><span className="tm-short-lb">Short Name</span> {m.short_name||generateShortName(m.name)}</div>
                          </div>
                        </div>
                        <div className="tm-actions">
                          <button className="tm-btn-edit" onClick={()=>{if(editingMember===i){saveShortName(i);setEditingMember(null)}else{setEditingMember(i);setShortNameInput(m.short_name||generateShortName(m.name));setShortNameError('')}}}>
                            <svg viewBox="0 0 24 24"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>{editingMember===i?'DONE':'EDIT'}
                          </button>
                        </div>
                        {editingMember===i && (
                          <div className="tm-edit">
                            <div className="tm-edit-row">
                              <div><div className="tm-field-lb">Short Name</div><input className="tm-field-in" value={shortNameInput} onChange={e=>{setShortNameInput(e.target.value);setShortNameError('')}} placeholder="Part of full name"/>{shortNameError&&<div className="tm-short-err">{shortNameError}</div>}</div>
                              <div><div className="tm-field-lb">Roll Number</div><input className="tm-field-in readonly" value={m.roll_number} readOnly/></div>
                            </div>
                            <div className="tm-edit-row">
                              <div><div className="tm-field-lb">College</div><input className="tm-field-in" value={m.college||''} onChange={e=>updateMember(i,'college',e.target.value)}/></div>
                              <div><div className="tm-field-lb">Branch</div><input className="tm-field-in" value={m.branch||''} onChange={e=>updateMember(i,'branch',e.target.value)}/></div>
                            </div>
                            <div className="tm-edit-btns">
                              <button className="tm-btn-cancel" onClick={()=>{setEditingMember(null);setShortNameError('')}}>Cancel</button>
                              <button className="tm-btn-save" onClick={()=>{saveShortName(i);setEditingMember(null)}}>Save</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>

            {/* ── REGISTER ── */}
            <div className="sec" ref={sectionRefs.review} style={{zIndex:activeSection==='review'?100:10}} onClick={()=>setActiveSection('review')}>
              <div className="card cr"><div className="card-glow"/>
                <div className="card-h"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Register Team</div>
                <div style={{textAlign:'center',padding:'12px 0 8px'}}>
                  <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.45)',marginBottom:'16px',lineHeight:1.6}}>Review all your details before registering. Once submitted, details cannot be edited.</div>
                  <button className="sub-btn" onClick={handleRegisterClick} disabled={saving||!projectTitle.trim()||!projectDescription.trim()}>{saving?'Registering...':'Review & Register Team'}</button>
                </div>
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

      {showConfirm && (
        <div className="modal-overlay" onClick={()=>setShowConfirm(false)}>
          <div className="modal" style={{width:'min(560px,92vw)',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div className="modal-icon warn">📋</div>
            <div className="modal-title">Review Your Details</div>
            <div className="modal-desc">Please verify all information before submitting.</div>

            <div className="rev-g" style={{marginBottom:'16px'}}>
              <div className="rev-c"><div className="rev-l">Technology Track</div><div className="rev-v">{team?.technology||'—'}</div></div>
              <div className="rev-c"><div className="rev-l">Members</div><div className="rev-v">{membersLoaded?`${members.length} members`:'Not loaded'}</div></div>
              <div className="rev-c full"><div className="rev-l">Project Title</div><div className="rev-v" style={{fontWeight:600}}>{projectTitle||'—'}</div></div>
              <div className="rev-c full"><div className="rev-l">Project Area</div><div className="rev-v">{projectArea.length?projectArea.join(', '):'—'}</div></div>
              <div className="rev-c full"><div className="rev-l">Project Description</div><div className="rev-v">{projectDescription||'—'}</div></div>
              {problemStatement.trim() && <div className="rev-c full"><div className="rev-l">Problem Statement</div><div className="rev-v">{problemStatement}</div></div>}
              {techStack.length>0 && <div className="rev-c full"><div className="rev-l">Tech Stack</div><div className="rev-ch">{techStack.map(t=><span key={t}>{t}</span>)}</div></div>}
              <div className="rev-c"><div className="rev-l">AI Usage</div><div className="rev-v">{aiUsage}</div></div>
              {aiUsage==='Yes' && aiCapabilities.length>0 && <div className="rev-c"><div className="rev-l">AI Capabilities</div><div className="rev-ch">{aiCapabilities.map(c=><span key={c}>{c}</span>)}</div></div>}
              {aiUsage==='Yes' && aiTools.length>0 && <div className="rev-c full"><div className="rev-l">AI Tools</div><div className="rev-ch">{aiTools.map(t=><span key={t}>{t}</span>)}</div></div>}
              {membersLoaded && members.length>0 && <div className="rev-c full"><div className="rev-l">Team Members</div><div className="rev-v">{members.map(m=>m.name).join(', ')}</div></div>}
            </div>

            <div className="modal-check"><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Once registered, these details <strong>cannot be edited</strong>. Please review carefully.</div>

            <div className="modal-btns">
              <button className="modal-btn cancel" onClick={()=>setShowConfirm(false)}>Go Back & Edit</button>
              <button className="modal-btn confirm" onClick={handleConfirmSubmit} disabled={saving}>{saving?'Submitting...':'Confirm & Register'}</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="celebrate-notif"><svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>All team members have been notified via email</div>
            <div className="celebrate-btns">
              <button className="celebrate-go" onClick={()=>router.push('/')} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',boxShadow:'none',fontWeight:500,letterSpacing:'1px'}}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}