'use client'
// Register push notifications
import { registerPushNotifications } from '@/lib/pushNotifications'
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  User, Users, FolderKanban, Activity, GraduationCap,
  UtensilsCrossed, Compass, CalendarDays, Megaphone,
  Rocket, ChevronLeft, ChevronRight, LogOut, Settings, Search, Bell,
  Phone, Award, Code, BookOpen, Star, CreditCard, Shield, Trophy,
  Target, Layers, CheckCircle, XCircle, Briefcase, Hash,
  Lightbulb, PenTool, Wrench, Bug, CloudUpload, FileText, Lock,
  AlertCircle, Send, X, Clock, MessageSquare, Zap, ChevronDown,
  MapPin, Bus, Home, Calendar, TrendingUp, BarChart3, Eye, Mail, Sparkles, Cpu
} from "lucide-react";

const NAV_SECTIONS = [
  { title:"Main", items:[
    {id:"my-profile",label:"My Profile",icon:User},
    {id:"team-profile",label:"Team Profile",icon:Users},
    {id:"project-details",label:"Project Details",icon:FolderKanban},
    {id:"project-status",label:"Project Status",icon:Activity},
  ]},
  { title:"Services", items:[
    {id:"mentor-request",label:"Mentor Request",icon:GraduationCap},
    {id:"food-section",label:"Food Section",icon:UtensilsCrossed},
    {id:"explore-teams",label:"Explore Teams",icon:Compass},
  ]},
  { title:"Updates", items:[
    {id:"event-details",label:"Event Details",icon:CalendarDays},
    {id:"announcements",label:"Announcements",icon:Megaphone},
    {id:"space-jam",label:"Space Jam",icon:Rocket},
  ]},
];
const PAGE_TITLES={"my-profile":"My Profile","team-profile":"Team Profile","project-details":"Project Details","project-status":"Project Status","mentor-request":"Mentor Request","food-section":"Food Section","explore-teams":"Explore Teams","event-details":"Event Details","announcements":"Announcements","space-jam":"Space Jam"};

/* ═══ HELPER COMPONENTS ═══ */
function StatCard({icon:Icon,label,value,color="#ff1d00"}){
  return(
    <div className="mp-stat-card">
      <div className="mp-stat-icon" style={{background:`${color}12`,borderColor:`${color}20`}}><Icon size={16} style={{color}}/></div>
      <div className="mp-stat-info"><div className="mp-stat-label">{label}</div><div className="mp-stat-value">{value||"—"}</div></div>
    </div>
  );
}
function Badge({text,color="#ff1d00",variant="default"}){
  const bg=variant==="success"?"rgba(74,222,128,.08)":variant==="fail"?"rgba(253,28,0,.08)":`${color}10`;
  const bc=variant==="success"?"rgba(74,222,128,.18)":variant==="fail"?"rgba(253,28,0,.18)":`${color}22`;
  const tc=variant==="success"?"#4ade80":variant==="fail"?"#fd1c00":color;
  return <span className="mp-badge" style={{background:bg,borderColor:bc,color:tc}}>{text}</span>;
}

/* ═══ MY PROFILE — ENHANCED ═══ */
function MyProfile({ user, hootData, videoRatings, videoLoading }) {
  const [hub, setHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [imgError, setImgError] = useState(false);
  const [shortName, setShortName] = useState('');
  const [editingShort, setEditingShort] = useState(false);
  const [shortDraft, setShortDraft] = useState('');
  const [shortSaving, setShortSaving] = useState(false);
  const [shortMsg, setShortMsg] = useState(null);

  const roll = user?.rollNumber || '';
  useEffect(() => {
    if (!roll) return;
    fetch('/api/auth/team-data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: roll })
    })
      .then(r => r.json())
      .then(d => {
        const me = (d.members || []).find(m => m.roll_number === roll);
        if (me?.short_name) setShortName(me.short_name);
      })
      .catch(() => {});
  }, [roll]);

  useEffect(() => {
    if (!roll) { setHubLoading(false); return; }
    fetch('/api/student-hub-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: roll }),
    })
      .then(r => r.json())
      .then(d => { if (d.profile) setHub(d.profile); })
      .catch(e => console.error('Hub profile error:', e))
      .finally(() => setHubLoading(false));
  }, [roll]);

  if (hubLoading) return (
    <div className="mp-loading">
      <div className="mp-loading-spinner" />
      <div style={{color:'rgba(255,255,255,.25)',fontSize:'.8rem',marginTop:8}}>Loading profile data...</div>
    </div>
  );

  if (!hub) return (
    <div style={{color:'rgba(255,255,255,.3)',textAlign:'center',padding:'60px 0',fontSize:'.85rem'}}>
      <AlertCircle size={28} style={{color:'rgba(255,255,255,.12)',marginBottom:8}}/>
      <div>Profile not found for {roll}</div>
    </div>
  );

  const s = hub;
  const cod = hub;
  const mc = hub.mayaCoding;
  const att = hub.attendance || [];
  const courses = hub.courses || [];

  // Calculate overall attendance
  const totalPresent = att.reduce((sum, a) => sum + (a.present || 0), 0);
  const totalSessions = att.reduce((sum, a) => sum + (a.total_sessions || 0), 0);
  const overallAtt = totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(1) : 0;

  const semesters = [s.sem1, s.sem2, s.sem3, s.sem4, s.sem5].filter(Boolean);
  const badgePct = parseFloat(s.badge_test_pct) || 0;

  async function saveShortName() {
    const trimmed = shortDraft.trim();
    if (!trimmed) { setShortMsg({ type: 'error', text: 'Short name cannot be empty' }); return; }
    if (trimmed.length > 15) { setShortMsg({ type: 'error', text: 'Max 15 characters' }); return; }
    if (!/^[A-Za-z ]+$/.test(trimmed)) { setShortMsg({ type: 'error', text: 'Only letters and spaces allowed' }); return; }

    setShortSaving(true);
    setShortMsg(null);
    try {
      const r = await fetch('/api/auth/update-short-name', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: roll, shortName: trimmed })
      });
      const d = await r.json();
      if (!r.ok) { setShortMsg({ type: 'error', text: d.error || 'Failed to save' }); return; }
      setShortName(trimmed);
      setEditingShort(false);
      setShortMsg({ type: 'success', text: 'Short name updated!' });
      setTimeout(() => setShortMsg(null), 3000);
    } catch {
      setShortMsg({ type: 'error', text: 'Network error' });
    } finally {
      setShortSaving(false);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'coding', label: 'Coding', icon: Code },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'certs', label: 'Certifications', icon: Award },
    { id: 'assessments', label: 'Assessments', icon: Target },
  ];

  return (
    <div className="mp">
      {/* ═══ HERO CARD ═══ */}
      <div className="mp-hero-row">
        <div className="mp-avatar-wrap">
          <div className="mp-avatar-wrap-ring"></div>
          <div className="mp-avatar-wrap-ring2"></div>
          <div className="mp-avatar">
            {!imgError ? (
              <img className="mp-avatar-img" src={s.image_url} alt={s.name}
                onError={() => setImgError(true)} />
            ) : (
              (s.name||'?').charAt(0)
            )}
          </div>
          <div className="mp-float-badge mp-fb-1">{s.technology||'Student'}</div>
          <div className="mp-float-badge mp-fb-2">{s.branch||'Branch'}</div>
          <div className="mp-float-badge mp-fb-3">{s.passout_year?`Batch ${s.passout_year}`:'Student'}</div>
        </div>
        <div className="mp-hero">
        <div className="mp-hero-info">
          <div className="mp-hero-left">
            <div className="mp-hero-name">{s.name}</div>
            <div className="mp-hero-roll"><Hash size={12}/> {s.roll_number} · {s.branch} · {s.college}</div>
            <div className="mp-hero-tags">
              {s.technology && <span className="mp-badge" style={{background:"rgba(255,255,255,.92)",border:"none",color:"#b91c1c",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>{s.technology}</span>}
              {s.pool && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.pool}</span>}
              {s.seat_type && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.seat_type}</span>}
              {s.scholar_type && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.scholar_type}</span>}
              {s.passout_year && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>Class of {s.passout_year}</span>}
              {s.is_eamcet && <span className="mp-badge" style={{background:"rgba(74,222,128,.08)",border:"none",color:"#4ade80"}}>EAMCET</span>}
            </div>
          </div>
          <div className="mp-hero-right">
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#1abc9c",borderRadius:8,boxShadow:"0 4px 14px rgba(26,188,156,.35)"}}><Phone size={13} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>Mobile</div><div className="mp-hd-val">{s.mobile||'—'}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#3498db",borderRadius:8,boxShadow:"0 4px 14px rgba(52,152,219,.35)"}}><GraduationCap size={13} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>Entrance</div><div className="mp-hd-val">{s.entrance_type||'—'} {s.rank ? `· #${s.rank}` : ''}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#f1c40f",borderRadius:8,boxShadow:"0 4px 14px rgba(241,196,15,.35)"}}><Target size={13} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>Attendance</div><div className="mp-hd-val">{overallAtt}%</div></div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ═══ TAB NAV ═══ */}
      <div className="mp-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`mp-tab ${activeTab===t.id?'mp-tab-active':''}`} onClick={()=>setActiveTab(t.id)}>
            <t.icon size={14}/><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
           TAB: OVERVIEW
         ═══════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="mp-tab-content">

          {/* Short Name Card */}
          <div className="mp-card" style={{background:'linear-gradient(135deg,rgba(253,28,0,.06),rgba(238,167,39,.03))',borderColor:'rgba(253,28,0,.15)'}}>
            <div className="mp-card-title"><User size={16} style={{color:'#fd1c00'}}/> Your Short Name <span style={{fontSize:'.55rem',color:'rgba(255,255,255,.3)',fontWeight:400,marginLeft:'auto'}}>Shown on team & leaderboard</span></div>
            {!editingShort ? (
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <div style={{padding:'10px 18px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',fontSize:'.95rem',fontWeight:700,color:'#fff',minWidth:120}}>
                  {shortName || <span style={{color:'rgba(255,255,255,.3)',fontStyle:'italic',fontWeight:400}}>Not set</span>}
                </div>
                <button onClick={()=>{setShortDraft(shortName);setEditingShort(true);setShortMsg(null)}} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:10,background:'rgba(253,28,0,.08)',border:'1px solid rgba(253,28,0,.2)',color:'#fd1c00',fontFamily:"'DM Sans',sans-serif",fontSize:'.72rem',fontWeight:600,cursor:'pointer'}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {shortName ? 'Edit' : 'Set Short Name'}
                </button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <input
                  type="text"
                  value={shortDraft}
                  onChange={e=>setShortDraft(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')saveShortName();if(e.key==='Escape'){setEditingShort(false);setShortMsg(null)}}}
                  maxLength={15}
                  placeholder="e.g. Harsha"
                  autoFocus
                  style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,.05)',border:'1px solid rgba(253,28,0,.3)',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.9rem',fontWeight:600,outline:'none',minWidth:160,flex:'1 1 160px'}}
                />
                <button onClick={saveShortName} disabled={shortSaving} style={{padding:'10px 18px',borderRadius:10,background:'linear-gradient(135deg,#fd1c00,#ff5535)',border:'none',color:'#fff',fontFamily:"'DM Sans',sans-serif",fontSize:'.72rem',fontWeight:600,cursor:shortSaving?'wait':'pointer',opacity:shortSaving?.6:1}}>
                  {shortSaving?'Saving...':'Save'}
                </button>
                <button onClick={()=>{setEditingShort(false);setShortMsg(null)}} disabled={shortSaving} style={{padding:'10px 16px',borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.6)',fontFamily:"'DM Sans',sans-serif",fontSize:'.72rem',fontWeight:500,cursor:'pointer'}}>
                  Cancel
                </button>
                <div style={{fontSize:'.58rem',color:'rgba(255,255,255,.35)',width:'100%',marginTop:4}}>Max 15 chars · Letters & spaces only · Unique within team</div>
              </div>
            )}
            {shortMsg && (
              <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:shortMsg.type==='success'?'rgba(74,222,128,.08)':'rgba(253,28,0,.08)',border:`1px solid ${shortMsg.type==='success'?'rgba(74,222,128,.2)':'rgba(253,28,0,.2)'}`,fontSize:'.72rem',color:shortMsg.type==='success'?'#4ade80':'#ff6040',fontWeight:500}}>
                {shortMsg.text}
              </div>
            )}
          </div>

          {/* Personal Info */}
          <div className="mp-card">
            <div className="mp-card-title"><User size={16} style={{color:'#3b82f6'}}/> Personal Information</div>
            <div className="mp-info-grid">
              {[
                {icon:Hash, label:'Roll Number', value:s.roll_number, color:'#fd1c00'},
                {icon:User, label:'Gender', value:s.gender, color:'#8b5cf6'},
                {icon:Calendar, label:'Date of Birth', value:s.dob, color:'#f59e0b'},
                {icon:GraduationCap, label:'Branch', value:s.branch, color:'#3b82f6'},
                {icon:Home, label:'College', value:s.college, color:'#10b981'},
                {icon:Calendar, label:'Passout Year', value:s.passout_year, color:'#22d3ee'},
                {icon:Phone, label:'Mobile', value:s.mobile, color:'#1abc9c'},
                {icon:Phone, label:'Parent Mobile', value:s.parent_mobile, color:'#e74c3c'},
                {icon:MapPin, label:'Town', value:s.town, color:'#f59e0b'},
                {icon:Bus, label:'Bus Route', value:s.bus_route || s.bus_stage, color:'#8b5cf6'},
                {icon:Home, label:'Hosteler', value:s.is_hosteler ? 'Yes' : 'No', color:'#10b981'},
                {icon:Code, label:'GitHub', value:s.github_username || s.github_profile, color:'#fff'},
              ].map((item,i) => (
                <div key={i} className="mp-info-item">
                  <div className="mp-info-icon" style={{background:`${item.color}12`,borderColor:`${item.color}20`}}>
                    <item.icon size={14} style={{color:item.color}}/>
                  </div>
                  <div className="mp-info-content">
                    <div className="mp-info-label">{item.label}</div>
                    <div className="mp-info-value">{item.value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Performance */}
          <div className="mp-card">
            <div className="mp-card-title"><GraduationCap size={16} style={{color:"#3b82f6"}}/> Academic Performance</div>
            <div className="mp-stats-grid">
              <StatCard icon={BookOpen} label="B.Tech CGPA" value={s.btech || '—'} color="#3b82f6"/>
              <StatCard icon={Award} label="B.Tech %" value={s.btech_pct ? `${s.btech_pct}%` : '—'} color="#8b5cf6"/>
              <StatCard icon={Target} label="Intermediate %" value={s.inter ? `${s.inter}%` : '—'} color="#f59e0b"/>
              <StatCard icon={Star} label="SSC %" value={s.ssc ? `${s.ssc}%` : '—'} color="#22d3ee"/>
              <StatCard icon={XCircle} label="Backlogs" value={s.backlogs||0} color={s.backlogs>0?"#ef4444":"#4ade80"}/>
              <StatCard icon={Hash} label="Entrance Rank" value={s.rank ? `#${s.rank}` : '—'} color="#fd1c00"/>
            </div>
            {/* Badge Test */}
            <div className="mp-sub-section">
              <div className="mp-sub-title">Badge Test</div>
              <div className="mp-prog-row">
                <span className="mp-prog-lb">Score</span>
                <div className="mp-prog-bar"><div className="mp-prog-fill" style={{width:`${badgePct}%`,background:s.badge_test_status==="Pass"?"linear-gradient(90deg,#4ade80,#22c55e)":"linear-gradient(90deg,#ef4444,#f97316)"}}/></div>
                <span className="mp-prog-val">{s.badge_test_pct||0}%</span>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
                <Badge text={s.badge_test_status||'—'} variant={s.badge_test_status==="Pass"?"success":"fail"}/>
              </div>
            </div>
          </div>

          {/* Quick Coding Platforms */}
          <div className="mp-card">
            <div className="mp-card-title"><Code size={16} style={{color:"#06b6d4"}}/> Coding Platforms — Quick View</div>
            <div className="mp-coding-grid">
              {[
                {name:'LeetCode', val:s.leetcode?.lc_total_progarms, sub:`Rank #${s.leetcode?.lc_rank||'—'}`, color:'#f89f1b'},
                {name:'HackerRank', val:`${s.hackerrank?.hr_total_stars||0}★`, sub:`${s.hackerrank?.hr_badges||0} badges`, color:'#2ec866'},
                {name:'CodeChef', val:s.codechef?.total_problems, sub:`${s.codechef?.rating||0} rating`, color:'#5b4638'},
                {name:'GeeksForGeeks', val:s.gfg?.gfg_total_problems||0, sub:`Score: ${s.gfg?.gfg_score||0}`, color:'#2f8d46'},
              ].map(p=>(
                <div key={p.name} className="mp-coding-item">
                  <div className="mp-coding-left">
                    <div className="mp-coding-dot" style={{background:p.color}}/>
                    <div><span className="mp-coding-name">{p.name}</span><span className="mp-coding-sub">{p.sub}</span></div>
                  </div>
                  <span className="mp-coding-score" style={{color:p.color}}>{p.val||'—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Counts */}
          <div className="mp-card">
            <div className="mp-card-title"><Shield size={16} style={{color:"#10b981"}}/> Certifications Summary</div>
            <div className="mp-stats-grid">
              <StatCard icon={Award} label="Global Certifications" value={s.certCounts?.Global_Certifications||0} color="#10b981"/>
              <StatCard icon={FileText} label="Training Certificates" value={s.certCounts?.Training_Certificates||0} color="#3b82f6"/>
              <StatCard icon={Trophy} label="Digital Badges" value={s.certCounts?.Digitalbadge_Certificates||0} color="#f59e0b"/>
              <StatCard icon={Briefcase} label="Internship Certs" value={s.certCounts?.Internship_Certificate||0} color="#8b5cf6"/>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mp-grid">
            {/* Violations */}
            <div className="mp-card">
              <div className="mp-card-title"><AlertCircle size={16} style={{color:s.violations?.length>0?'#ef4444':'#4ade80'}}/> Violations</div>
              {(!s.violations || s.violations.length===0) ? (
                <div className="mp-empty-section"><CheckCircle size={18} style={{color:'#4ade80'}}/><span>No violations — great job!</span></div>
              ) : (
                s.violations.map((v,i) => (
                  <div key={i} className="mp-violation-item"><AlertCircle size={14} style={{color:'#ef4444'}}/><span>{v.description||v.violation||JSON.stringify(v)}</span></div>
                ))
              )}
            </div>

            {/* Placement */}
            <div className="mp-card">
              <div className="mp-card-title"><Briefcase size={16} style={{color:"#f59e0b"}}/> Placement Status</div>
              <div className="mp-empty-section">
                <Briefcase size={18} style={{color: s.placement ? '#4ade80' : 'rgba(255,255,255,.15)'}}/>
                <span>{s.placement ? JSON.stringify(s.placement) : (s.placement_status || 'Not yet placed')}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="mp-card mp-full">
            <div className="mp-card-title"><CreditCard size={16} style={{color:"#4ade80"}}/> Payment Status</div>
            <div className="mp-pay-grid">
              {["payment_term1","payment_term2","payment_term3","payment_term4","payment_term5"].map((t,i)=>{
                const p=s[t]==="Paid";
                return(
                  <div key={t} className={`mp-pay-item ${p?"paid":"unpaid"}`}>
                    <div className="mp-pay-lb">Term {i+1}</div>
                    <div className="mp-pay-st">{p?"✓ Paid":s[t]||"Pending"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* T-Hub Courses / Semesters */}
          <div className="mp-card">
            <div className="mp-card-title"><Layers size={16} style={{color:"#8b5cf6"}}/> T-Hub Semesters <span className="mp-card-count">{semesters.length}</span></div>
            {semesters.length > 0 ? semesters.map((c,i)=>(
              <div key={i} className="mp-list-item">
                <div className="mp-list-num" style={{background:"rgba(139,92,246,.06)",borderColor:"rgba(139,92,246,.12)",color:"#8b5cf6"}}>SEM-{i+1}</div>
                <div className="mp-list-text">{c}</div>
              </div>
            )) : <div className="mp-empty-section"><Layers size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No semesters recorded</span></div>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           TAB: CODING
         ═══════════════════════════════════════════════ */}
      {activeTab === 'coding' && (
        <div className="mp-tab-content">

          {/* LeetCode */}
          {s.leetcode && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{background:'#f89f1b'}}/>LeetCode
                <a href={s.leetcode.lc_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Target} label="Total Solved" value={s.leetcode.lc_total_progarms} color="#f89f1b"/>
                <StatCard icon={Trophy} label="Rank" value={`#${s.leetcode.lc_rank}`} color="#f89f1b"/>
                <StatCard icon={Zap} label="Weekly Solved" value={s.leetcode.lc_weekly_solved} color="#22d3ee"/>
                <StatCard icon={Star} label="Streak" value={`${s.leetcode.lc_streak} days`} color="#4ade80"/>
              </div>
              <div className="mp-difficulty-row">
                {[{label:'Easy',val:s.leetcode.lc_easy,color:'#4ade80'},{label:'Medium',val:s.leetcode.lc_medium,color:'#f59e0b'},{label:'Hard',val:s.leetcode.lc_hard,color:'#ef4444'}].map(d=>(
                  <div key={d.label} className="mp-diff-chip" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                    <span className="mp-diff-label">{d.label}</span><span className="mp-diff-val" style={{color:d.color}}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HackerRank */}
          {s.hackerrank && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{background:'#2ec866'}}/>HackerRank
                <a href={s.hackerrank.hr_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-3">
                <StatCard icon={Star} label="Total Stars" value={s.hackerrank.hr_total_stars} color="#2ec866"/>
                <StatCard icon={Award} label="Badges" value={s.hackerrank.hr_badges} color="#2ec866"/>
                <StatCard icon={Shield} label="Certifications" value={s.hackerrank.hr_certification_count} color="#22d3ee"/>
              </div>
              <div className="mp-sub-section">
                <div className="mp-sub-title">Stars by Language</div>
                <div className="mp-hr-stars">
                  {[{lang:'C',stars:s.hackerrank.hr_c},{lang:'C++',stars:s.hackerrank.hr_cpp},{lang:'Java',stars:s.hackerrank.hr_java},{lang:'Python',stars:s.hackerrank.hr_python},{lang:'SQL',stars:s.hackerrank.hr_sql},{lang:'Problem Solving',stars:s.hackerrank.hr_problem_solving}].map(h=>(
                    <div key={h.lang} className="mp-hr-star-row">
                      <span className="mp-hr-lang">{h.lang}</span>
                      <div className="mp-hr-stars-visual">
                        {[1,2,3,4,5].map(n=>(
                          <Star key={n} size={12} fill={n<=(h.stars||0)?'#f59e0b':'none'} color={n<=(h.stars||0)?'#f59e0b':'rgba(255,255,255,.1)'}/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {s.hackerrank.hr_certifications?.length>0 && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">Certifications</div>
                  {s.hackerrank.hr_certifications.map((c,i)=>(
                    <div key={i} className="mp-list-item"><CheckCircle size={14} style={{color:'#4ade80'}}/><div className="mp-list-text">{c}</div></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CodeChef */}
          {s.codechef && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{background:'#5b4638'}}/>CodeChef
                <a href={s.codechef.cc_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Target} label="Total Problems" value={s.codechef.total_problems} color="#5b4638"/>
                <StatCard icon={Trophy} label="Rating" value={s.codechef.rating} color="#f59e0b"/>
                <StatCard icon={Star} label="Star Rating" value={`${s.codechef.star_rating}★`} color="#f59e0b"/>
                <StatCard icon={Activity} label="Contests" value={s.codechef.contests} color="#22d3ee"/>
              </div>
              <div className="mp-stats-grid" style={{marginTop:10}}>
                <StatCard icon={Zap} label="Weekly Solved" value={s.codechef.weekly_solved} color="#4ade80"/>
                <StatCard icon={Star} label="Streak" value={`${s.codechef.streak} days`} color="#8b5cf6"/>
              </div>
            </div>
          )}

          {/* GeeksForGeeks */}
          {s.gfg && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{background:'#2f8d46'}}/>GeeksForGeeks
                <a href={s.gfg.gfg_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-3">
                <StatCard icon={Target} label="Total Solved" value={s.gfg.gfg_total_problems} color="#2f8d46"/>
                <StatCard icon={Trophy} label="Score" value={s.gfg.gfg_score} color="#2f8d46"/>
                <StatCard icon={Star} label="Streak" value={`${s.gfg.gfg_streak} days`} color="#4ade80"/>
              </div>
              {s.gfg.gfg_total_problems > 0 && (
                <div className="mp-difficulty-row">
                  {[{label:'School',val:s.gfg.gfg_school,color:'#a78bfa'},{label:'Basic',val:s.gfg.gfg_basic,color:'#60a5fa'},{label:'Easy',val:s.gfg.gfg_easy,color:'#4ade80'},{label:'Medium',val:s.gfg.gfg_medium,color:'#f59e0b'},{label:'Hard',val:s.gfg.gfg_hard,color:'#ef4444'}].map(d=>(
                    <div key={d.label} className="mp-diff-chip" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                      <span className="mp-diff-label">{d.label}</span><span className="mp-diff-val" style={{color:d.color}}>{d.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Maya Coding */}
          {mc && (
            <div className="mp-card">
              <div className="mp-card-title"><Code size={16} style={{color:'#22d3ee'}}/> Maya Coding Profile</div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Trophy} label="Global Rank" value={`#${mc.globalRank}`} color="#22d3ee"/>
                <StatCard icon={Target} label="Batch Rank" value={`#${mc.batchRank}`} color="#8b5cf6"/>
                <StatCard icon={Star} label="Score" value={mc.problems?.score||0} color="#f59e0b"/>
                <StatCard icon={Clock} label="Total Time" value={mc.totalTime} color="#4ade80"/>
              </div>
              {mc.problems && (
                <div className="mp-difficulty-row" style={{marginTop:12}}>
                  {[{label:'Easy',val:mc.problems.easy,color:'#4ade80'},{label:'Medium',val:mc.problems.medium,color:'#f59e0b'},{label:'Hard',val:mc.problems.hard,color:'#ef4444'}].map(d=>(
                    <div key={d.label} className="mp-diff-chip" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                      <span className="mp-diff-label">{d.label}</span><span className="mp-diff-val" style={{color:d.color}}>{d.val}</span>
                    </div>
                  ))}
                </div>
              )}
              {mc.languages && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">Languages Used</div>
                  {Object.entries(mc.languages).sort(([,a],[,b])=>b-a).map(([lang,count])=>{
                    const max=Math.max(...Object.values(mc.languages),1);
                    const LANGC={c:'#A8B9CC',cpp:'#659AD2',java:'#F89820',python:'#3572A5',sql:'#e38c00'};
                    const color=LANGC[lang.toLowerCase()]||'#BDE8F5';
                    return(
                      <div key={lang} className="mp-lang-bar-row">
                        <span className="mp-lang-name" style={{color}}>{lang.toUpperCase()}</span>
                        <div className="mp-lang-bar-track"><div className="mp-lang-bar-fill" style={{width:`${(count/max)*100}%`,background:color}}/></div>
                        <span className="mp-lang-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           TAB: ATTENDANCE
         ═══════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div className="mp-tab-content">
          <div className="mp-card">
            <div className="mp-card-title"><Clock size={16} style={{color:'#f59e0b'}}/> Overall Attendance</div>
            <div className="mp-stats-grid mp-stats-3">
              <StatCard icon={CheckCircle} label="Total Present" value={totalPresent} color="#4ade80"/>
              <StatCard icon={XCircle} label="Total Absent" value={totalSessions-totalPresent} color="#ef4444"/>
              <StatCard icon={Target} label="Overall %" value={`${overallAtt}%`} color={parseFloat(overallAtt)>=75?'#4ade80':'#ef4444'}/>
            </div>
          </div>

          <div className="mp-card">
            <div className="mp-card-title"><Layers size={16} style={{color:'#8b5cf6'}}/> Course-wise Attendance <span className="mp-card-count">{att.length} courses</span></div>
            <div className="mp-att-grid">
              {att.sort((a,b)=>(b.percentage||0)-(a.percentage||0)).map((a,i)=>{
                const pct=parseFloat(a.percentage||0).toFixed(1);
                const isGood=pct>=75;
                const color=isGood?'#4ade80':'#ef4444';
                return(
                  <div key={i} className="mp-att-card">
                    <div className="mp-att-card-head">
                      <div className="mp-att-card-name">{a.technology_name}</div>
                      <div className="mp-att-card-pct" style={{color}}>{pct}%</div>
                    </div>
                    <div className="mp-att-card-sub">{a.course_name}</div>
                    <div className="mp-att-card-bar"><div className="mp-att-card-fill" style={{width:`${pct}%`,background:color}}/></div>
                    <div className="mp-att-card-nums">
                      <span><span style={{color:'#4ade80'}}>{a.present}</span> present</span>
                      <span><span style={{color:'#ef4444'}}>{a.absent}</span> absent</span>
                      <span>{a.total_sessions} total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enrolled Courses */}
          {courses.length > 0 && (
            <div className="mp-card">
              <div className="mp-card-title"><BookOpen size={16} style={{color:'#22d3ee'}}/> Enrolled Courses <span className="mp-card-count">{courses.length}</span></div>
              <div className="mp-courses-grid">
                {courses.map((c,i) => (
                  <div key={i} className="mp-course-card">
                    <div className="mp-course-num">{i+1}</div>
                    <div className="mp-course-info">
                      <div className="mp-course-tech">{c.technology_name}</div>
                      <div className="mp-course-name">{c.course_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           TAB: CERTIFICATIONS
         ═══════════════════════════════════════════════ */}
      {activeTab === 'certs' && (
        <div className="mp-tab-content">
          {/* Global Certifications */}
          <div className="mp-card">
            <div className="mp-card-title"><Award size={16} style={{color:'#10b981'}}/> Global Certifications <span className="mp-card-count">{s.globalCerts?.length||0}</span></div>
            {s.globalCerts?.length > 0 ? (
              <div className="mp-cert-grid">
                {s.globalCerts.map((c,i)=>(
                  <div key={i} className="mp-cert-item">
                    <div className="mp-cert-logo-wrap">
                      {c.certification_logo ? <img src={c.certification_logo} alt="" className="mp-cert-logo" onError={e=>{e.target.style.display='none'}}/> : <Award size={20} style={{color:'#10b981'}}/>}
                    </div>
                    <div className="mp-cert-info">
                      <div className="mp-cert-name">{c.certifications_name}</div>
                      <div className="mp-cert-id">ID: {c.certifications_id}</div>
                    </div>
                    {c.certification && <a href={c.certification} target="_blank" rel="noopener" className="mp-cert-view"><Eye size={14}/></a>}
                  </div>
                ))}
              </div>
            ) : <div className="mp-empty-section"><Award size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No global certifications yet</span></div>}
          </div>

          {/* Digital Badges */}
          <div className="mp-card">
            <div className="mp-card-title"><Trophy size={16} style={{color:'#f59e0b'}}/> Digital Badges <span className="mp-card-count">{s.digitalBadges?.length||0}</span></div>
            {s.digitalBadges?.length > 0 ? s.digitalBadges.map((b,i)=>(
              <div key={i} className="mp-list-item"><Trophy size={14} style={{color:'#f59e0b'}}/><div className="mp-list-text">{b.badge_name||JSON.stringify(b)}</div></div>
            )) : <div className="mp-empty-section"><Trophy size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No digital badges yet</span></div>}
          </div>

          {/* Training Certificates */}
          <div className="mp-card">
            <div className="mp-card-title"><FileText size={16} style={{color:'#3b82f6'}}/> Training Certificates <span className="mp-card-count">{s.trainingCerts?.length||0}</span></div>
            {s.trainingCerts?.length > 0 ? s.trainingCerts.map((t,i)=>(
              <div key={i} className="mp-list-item"><FileText size={14} style={{color:'#3b82f6'}}/><div className="mp-list-text">{t.certificate_name||JSON.stringify(t)}</div></div>
            )) : <div className="mp-empty-section"><FileText size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No training certificates yet</span></div>}
          </div>

          {/* Internship Certificates */}
          <div className="mp-card">
            <div className="mp-card-title"><Briefcase size={16} style={{color:'#8b5cf6'}}/> Internship Certificates <span className="mp-card-count">{s.internshipCerts?.length||0}</span></div>
            {s.internshipCerts?.length > 0 ? s.internshipCerts.map((ic,i)=>(
              <div key={i} className="mp-list-item"><Briefcase size={14} style={{color:'#8b5cf6'}}/><div className="mp-list-text">{ic.certificate_name||JSON.stringify(ic)}</div></div>
            )) : <div className="mp-empty-section"><Briefcase size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No internship certificates yet</span></div>}
          </div>

          {/* Supabase cert list */}
          {s.certifications_list?.length > 0 && (
            <div className="mp-card">
              <div className="mp-card-title"><Shield size={16} style={{color:'#10b981'}}/> All Certifications (T-Hub) <span className="mp-card-count">{s.cert_count||0}</span></div>
              {s.certifications_list.map((c,i)=>(
                <div key={i} className="mp-list-item">
                  <div className="mp-list-num" style={{background:"rgba(16,185,129,.06)",borderColor:"rgba(16,185,129,.12)",color:"#10b981"}}>{i+1}</div>
                  <div className="mp-list-text">{c}</div>
                  <CheckCircle size={15} style={{color:"#4ade80",flexShrink:0}}/>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
           TAB: ASSESSMENTS
         ═══════════════════════════════════════════════ */}
      {activeTab === 'assessments' && (
        <div className="mp-tab-content">
          <div className="mp-assess-grid">

            {/* Video Ratings */}
            <div className="mp-card">
              <div className="mp-card-title"><Star size={16} style={{color:'#f59e0b'}}/> Video Ratings</div>
              {videoRatings ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {[
                    {name:'Gemini AI',data:videoRatings.gemini,color:'#4285F4'},
                    {name:'ChatGPT',data:videoRatings.chatgpt,color:'#10a37f'},
                    {name:'Claude AI',data:videoRatings.claude,color:'#cc785c'},
                    {name:'Mentor',data:videoRatings.mentor,color:'#f59e0b'},
                  ].map(({name,data,color})=>(
                    <div key={name} className="mp-vr-row">
                      <span className="mp-vr-name">{name}</span>
                      <div className="mp-vr-bar"><div className="mp-vr-fill" style={{width:`${((data?.overall||0)/10)*100}%`,background:color}}/></div>
                      <span className="mp-vr-score" style={{color:data?.overall?color:'rgba(255,255,255,.15)'}}>{data?.overall?`${data.overall}/10`:'—'}</span>
                    </div>
                  ))}
                  {(videoRatings.gemini?.level||videoRatings.chatgpt?.level||videoRatings.claude?.level)&&(
                    <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
                      {videoRatings.gemini?.level&&<Badge text={`Gemini: ${videoRatings.gemini.level}`} color="#4285F4"/>}
                      {videoRatings.chatgpt?.level&&<Badge text={`GPT: ${videoRatings.chatgpt.level}`} color="#10a37f"/>}
                      {videoRatings.claude?.level&&<Badge text={`Claude: ${videoRatings.claude.level}`} color="#cc785c"/>}
                      {videoRatings.mentor?.level&&<Badge text={`Mentor: ${videoRatings.mentor.level}`} color="#f59e0b"/>}
                    </div>
                  )}
                </div>
              ) : <div className="mp-empty-section"><Star size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>{videoLoading?'Loading...':'No video ratings'}</span></div>}
            </div>

            {/* HOOT */}
            <div className="mp-card">
              <div className="mp-card-title"><MessageSquare size={16} style={{color:'#EEA727'}}/> HOOT — Communication</div>
              {hootData ? (
                <>
                  {[['Listening',hootData.listening,'#EEA727'],['Speaking',hootData.speaking,'#fd1c00'],['Reading',hootData.reading,'#10b981'],['Writing',hootData.writing,'#7B2FBE']].map(([label,val,color])=>(
                    <div key={label} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:'.75rem',color:'#bbb',fontWeight:500}}>{label}</span>
                        <span style={{fontSize:'.75rem',fontWeight:700,color}}>{val?.toFixed(1)}%</span>
                      </div>
                      <div className="mp-att-bar-track"><div className="mp-att-bar-fill" style={{width:`${val}%`,background:color}}/></div>
                    </div>
                  ))}
                  <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'.75rem',color:'#666'}}>Overall</span>
                    <div style={{background:'rgba(238,167,39,.1)',border:'1px solid rgba(238,167,39,.25)',borderRadius:7,padding:'3px 10px'}}>
                      <span style={{fontSize:'.9rem',fontWeight:800,color:'#EEA727'}}>{hootData.total?.toFixed(1)}<span style={{fontSize:'.65rem',fontWeight:400,marginLeft:2}}>/100</span></span>
                    </div>
                  </div>
                </>
              ) : <div className="mp-empty-section"><MessageSquare size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No assessment data</span></div>}
            </div>

            {/* ATS Report */}
            <div className="mp-card">
              <div className="mp-card-title"><FileText size={16} style={{color:'#3b82f6'}}/> ATS Report</div>
              {s.atsReport ? (
                <pre style={{color:'rgba(255,255,255,.6)',fontSize:'.72rem',whiteSpace:'pre-wrap',lineHeight:1.6}}>{JSON.stringify(s.atsReport,null,2)}</pre>
              ) : <div className="mp-empty-section"><FileText size={18} style={{color:'rgba(255,255,255,.12)'}}/><span>No ATS report found</span></div>}
            </div>
          </div>

          {/* Aptitude — Mandatory Tests */}
          {s.aptMandatory && (
            <div className="mp-card" style={{marginTop:16}}>
              <div className="mp-card-title"><BarChart3 size={16} style={{color:'#8b5cf6'}}/> Aptitude — Mandatory Tests</div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Target} label="Total Attempts" value={`${s.aptMandatory.noof_attempts}/${s.aptMandatory.total_attempts}`} color="#8b5cf6"/>
                <StatCard icon={Clock} label="Duration" value={`${Math.round(s.aptMandatory.duration/60)} min`} color="#22d3ee"/>
                <StatCard icon={TrendingUp} label="Overall %" value={`${s.aptMandatory.total_percentage?.toFixed(1)}%`} color="#4ade80"/>
                <StatCard icon={Zap} label="Aptitude" value={s.aptMandatory.aptitude_tests} color="#f59e0b"/>
              </div>
              <div className="mp-difficulty-row" style={{marginTop:12}}>
                {[{label:'Easy',val:s.aptMandatory.easy_tests,color:'#4ade80'},{label:'Medium',val:s.aptMandatory.medium_tests,color:'#f59e0b'},{label:'Hard',val:s.aptMandatory.hard_tests,color:'#ef4444'}].map(d=>(
                  <div key={d.label} className="mp-diff-chip" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                    <span className="mp-diff-label">{d.label}</span><span className="mp-diff-val" style={{color:d.color}}>{d.val}</span>
                  </div>
                ))}
                <div className="mp-diff-chip" style={{borderColor:'#3b82f630',background:'#3b82f608'}}>
                  <span className="mp-diff-label">Reasoning</span><span className="mp-diff-val" style={{color:'#3b82f6'}}>{s.aptMandatory.reasoning_tests}</span>
                </div>
                <div className="mp-diff-chip" style={{borderColor:'#a78bfa30',background:'#a78bfa08'}}>
                  <span className="mp-diff-label">Verbal</span><span className="mp-diff-val" style={{color:'#a78bfa'}}>{s.aptMandatory.verbal_tests}</span>
                </div>
              </div>
              {/* Technology-wise breakdown */}
              {s.mandatoryTests?.length > 0 && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">By Technology</div>
                  {s.mandatoryTests.map((t,i) => (
                    <div key={i} className="mp-att-item" style={{marginBottom:8}}>
                      <div className="mp-att-top">
                        <div className="mp-att-course">{t._id}</div>
                        <div className="mp-att-pct" style={{color:t.total_percentage>=60?'#4ade80':'#ef4444'}}>{t.total_percentage?.toFixed(1)}%</div>
                      </div>
                      <div className="mp-att-bar-track"><div className="mp-att-bar-fill" style={{width:`${t.total_percentage}%`,background:t.total_percentage>=60?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,#ef4444,#f97316)'}}/></div>
                      <div className="mp-att-bottom"><span>Tests: {t.technology_tests}</span><span>Attempts: {t.noof_attempts}</span><span>Duration: {Math.round(t.total_duration/60)}min</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aptitude — Practice Tests */}
          {s.aptPractice && (
            <div className="mp-card" style={{marginTop:16}}>
              <div className="mp-card-title"><Target size={16} style={{color:'#22d3ee'}}/> Aptitude — Practice Tests</div>
              <div className="mp-stats-grid mp-stats-3">
                <StatCard icon={Target} label="Attempts" value={`${s.aptPractice.noof_attempts}/${s.aptPractice.total_attempts}`} color="#22d3ee"/>
                <StatCard icon={Clock} label="Duration" value={`${Math.round(s.aptPractice.duration/60)} min`} color="#8b5cf6"/>
                <StatCard icon={Zap} label="Aptitude" value={s.aptPractice.aptitude_tests} color="#f59e0b"/>
              </div>
              <div className="mp-difficulty-row" style={{marginTop:12}}>
                {[{label:'Easy',val:s.aptPractice.easy_tests,color:'#4ade80'},{label:'Medium',val:s.aptPractice.medium_tests,color:'#f59e0b'},{label:'Hard',val:s.aptPractice.hard_tests,color:'#ef4444'}].map(d=>(
                  <div key={d.label} className="mp-diff-chip" style={{borderColor:`${d.color}30`,background:`${d.color}08`}}>
                    <span className="mp-diff-label">{d.label}</span><span className="mp-diff-val" style={{color:d.color}}>{d.val}</span>
                  </div>
                ))}
              </div>
              {s.practiceTests?.length > 0 && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">By Technology</div>
                  {s.practiceTests.map((t,i) => (
                    <div key={i} className="mp-list-item">
                      <div className="mp-list-num" style={{background:'rgba(34,211,238,.06)',borderColor:'rgba(34,211,238,.12)',color:'#22d3ee'}}>{t._id}</div>
                      <div className="mp-list-text">Tests: {t.technology_tests} · Attempts: {t.noof_attempts} · {Math.round(t.total_duration/60)}min</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ═══ TEAM PROFILE ═══ */
function TeamProfile({ user }){
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  useEffect(()=>{
    if(!user?.rollNumber) return;
    fetch('/api/auth/team-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rollNumber:user.rollNumber})})
      .then(r=>r.json()).then(d=>{setTeam(d.team);setMembers(d.members||[])}).catch(()=>{})
  },[user]);
  if(!team) return <div style={{color:'rgba(255,255,255,.3)',textAlign:'center',padding:'60px 0'}}>Loading team data...</div>;
  
  const myRoll = user?.rollNumber || '';
  
  return(
    <div className="tp">
      <div className="tp-header">
        <div className="tp-header-left">
          <div className="tp-team-badge">{team.teamNumber}</div>
          <div><div className="tp-team-title">{team.projectTitle||"Untitled Project"}</div><div className="tp-team-sub">{team.technology} · {team.college||''}</div></div>
        </div>
        <div className="tp-header-right">
          <div className="tp-header-stat"><div className="tp-header-stat-val">{members.length}</div><div className="tp-header-stat-lb">Members</div></div>
        </div>
      </div>
      <div className="tp-members-header"><div className="tp-members-count"><span>{members.length}</span> Team Members</div></div>
      <div className="tp-cards-grid">
        {[...members].sort((a,b)=>{
          // Me first, then leader, then rest by roll number
          if (a.roll_number === myRoll) return -1;
          if (b.roll_number === myRoll) return 1;
          if (a.is_leader && !b.is_leader) return -1;
          if (!a.is_leader && b.is_leader) return 1;
          return (a.roll_number||'').localeCompare(b.roll_number||'');
        }).map((m,i)=>{
          const isMe = m.roll_number === myRoll;
          const isLeader = m.is_leader;
          return(
          <div key={m.roll_number||i} className="tp-card" style={{animationDelay:`${i*.06}s`,border:isMe?'1px solid rgba(253,28,0,.3)':isLeader?'1px solid rgba(238,167,39,.2)':'1px solid rgba(255,255,255,.06)'}}>
            <div className="tp-card-top">
              <div className="tp-card-avatar" style={isMe?{borderColor:'rgba(253,28,0,.4)',background:'linear-gradient(135deg,rgba(253,28,0,.2),rgba(250,160,0,.1))'}:isLeader?{borderColor:'rgba(238,167,39,.3)',background:'linear-gradient(135deg,rgba(238,167,39,.15),rgba(238,167,39,.05))'}:{}}>{m.image_url?<img src={m.image_url} alt={m.name} style={{width:'100%',height:'100%',borderRadius:'inherit',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>:null}{(!m.image_url)&&(m.name||'?').charAt(0)}<div className="tp-card-online"/></div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',justifyContent:'flex-end'}}>
                {isMe && <span className="tp-tag tp-tag-you">You</span>}
                {isLeader && <span className="tp-tag tp-tag-leader">Team Leader</span>}
              </div>
            </div>
            <div className="tp-card-name">{m.name||'—'}</div>
            <div className="tp-card-role">{isLeader?'Team Leader':'Member'}</div>
            <div className="tp-card-details">
              <div className="tp-card-detail-row">
                <div className="tp-card-detail"><div className="tp-card-detail-lb">Branch</div><div className="tp-card-detail-val">{m.branch||'—'}</div></div>
                <div className="tp-card-detail"><div className="tp-card-detail-lb">Roll No</div><div className="tp-card-detail-val">{m.roll_number||'—'}</div></div>
              </div>
              {m.short_name && (
                <div className="tp-card-detail-row" style={{marginTop:'10px'}}>
                  <div className="tp-card-detail"><div className="tp-card-detail-lb">Short Name</div><div className="tp-card-detail-val">{m.short_name}</div></div>
                  <div className="tp-card-detail"><div className="tp-card-detail-lb">College</div><div className="tp-card-detail-val">{m.college||'—'}</div></div>
                </div>
              )}
            </div>
            <div className="tp-card-contact">
              <div className="tp-card-contact-row"><Mail size={12}/><span>{m.email||'—'}</span></div>
              <div className="tp-card-contact-row"><Phone size={12}/><span>{m.phone||'—'}</span></div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
/* ═══ PROJECT STATUS — MILESTONE TRACKER ═══ */
function ProjectStatus({ user }) {
  const [stages, setStages] = useState([]);
  const [progress, setProgress] = useState({ completed:0, total:7, percent:0, credits:0 });
  const [teamInfo, setTeamInfo] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [psLoading, setPsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalStage, setModalStage] = useState(null);
  const [psToast, setPsToast] = useState(null);
  const [psNotifs, setPsNotifs] = useState([]);
  const [showPsNotif, setShowPsNotif] = useState(false);
  const [psUnread, setPsUnread] = useState(0);
  const psToastTimer = useRef(null);

  const teamNumber = user?.teamNumber || user?.team_number || user?.team_number;
  const rollNumber = user?.rollNumber || user?.roll_number || user?.roll_number;

  const fetchStatus = useCallback(async () => {
    if (!teamNumber) return;
    setPsLoading(true);
    try {
      const r = await fetch(`/api/milestones/team-status?team=${teamNumber}`);
      const d = await r.json();
      if (d.stages) setStages(d.stages);
      if (d.progress) setProgress(d.progress);
      if (d.team) setTeamInfo(d.team);
      if (d.mentor) setMentor(d.mentor);
    } catch (err) { console.error(err); }
    finally { setPsLoading(false); }
  }, [teamNumber]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Notifications polling
  useEffect(() => {
    if (!rollNumber) return;
    const fetchN = async () => {
      try {
        const r = await fetch(`/api/milestones/notifications?type=student&email=${rollNumber}&limit=10`);
        const d = await r.json();
        if (d.notifications) setPsNotifs(d.notifications);
        if (d.unread_count !== undefined) setPsUnread(d.unread_count);
      } catch {}
    };
    fetchN();
    const iv = setInterval(fetchN, 30000);
    return () => clearInterval(iv);
  }, [rollNumber]);

  async function handleSubmitReview() {
    if (!modalStage || submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/milestones/submit-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNumber, stageNumber: modalStage.stage_number, submittedByRoll: rollNumber, submittedByName: user.name })
      });
      const d = await r.json();
      if (!r.ok) { showPsToast(d.error || 'Failed', true); return; }
      showPsToast(`Stage ${modalStage.stage_number}: ${modalStage.stage_name} sent for review!`);
      setModalStage(null);
      fetchStatus();
    } catch { showPsToast('Network error', true); }
    finally { setSubmitting(false); }
  }

  function showPsToast(msg, isError) {
    setPsToast({ msg, isError });
    clearTimeout(psToastTimer.current);
    psToastTimer.current = setTimeout(() => setPsToast(null), 3500);
  }

  async function markAllPsRead() {
    await fetch('/api/milestones/notifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read', type: 'student', email: rollNumber })
    });
    setPsUnread(0);
    setPsNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function getStatus(stage, idx) {
    if (stage.status === 'completed') return 'completed';
    if (stage.status === 'in-review') return 'active';
    if (stage.status === 'pending' && idx === 0) return 'ready';
    if (stage.status === 'pending' && idx > 0 && stages[idx - 1]?.status === 'completed') return 'ready';
    if (stage.actionable) return 'ready';
    return 'disabled';
  }

  const STAGE_META = [
    { name:'Ideation', desc:'Brainstorm ideas, define the problem, and finalize the project concept', icon:'M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color:'#e8650a' },
    { name:'Planning', desc:'Set milestones, assign responsibilities, and create the project timeline', icon:'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM9 14l2 2 4-4', color:'#1a73e8' },
    { name:'Design', desc:'Create architecture diagrams, wireframes, and plan the system structure', icon:'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586', color:'#d93025' },
    { name:'Development', desc:'Build core features, integrate components, and implement the solution', icon:'M16 18l6-6-6-6M8 6l-6 6 6 6', color:'#2d9d4f' },
    { name:'Testing', desc:'Validate functionality, identify issues, and ensure quality standards', icon:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', color:'#f5a623' },
    { name:'Deployment', desc:'Launch the project, configure the environment, and go live', icon:'M22 12h-4l-3 9L9 3l-3 9H2', color:'#0d8abc' },
    { name:'Documentation', desc:'Prepare the final report, user guide, and presentation materials', icon:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', color:'#e6c419' },
  ];

  if (psLoading && !stages.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'rgba(255,255,255,.3)',fontSize:'.8rem'}}><div className="mp-loading-spinner" style={{marginRight:10}}/> Loading milestones...</div>;

  const pct = progress.percent;

  return (
    <div className="ps-wrap-inner">
      <style>{`
.ps-wrap-inner{animation:psIn .5s ease both}
@keyframes psIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* Header */
.ps-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.ps-header-left{display:flex;align-items:center;gap:14px}
.ps-header-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ff1d00,#c41600);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(255,29,0,.2);flex-shrink:0;animation:psIconBob 3s ease-in-out infinite}
@keyframes psIconBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.ps-header-icon svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ps-header-title{font-size:1.2rem;font-weight:700;color:#fff}
.ps-header-sub{font-size:.72rem;color:rgba(255,255,255,.35);margin-top:2px}
.ps-header-right{display:flex;align-items:center;gap:10px}
.ps-badge-pill{font-size:.72rem;font-weight:600;color:#ff1d00;background:rgba(255,29,0,.06);border:1px solid rgba(255,29,0,.18);padding:6px 16px;border-radius:100px}
.ps-notif-wrap{position:relative}
.ps-notif-btn2{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.4);transition:all .2s;position:relative}
.ps-notif-btn2:hover{background:rgba(255,255,255,.06);color:#fff}
.ps-notif-badge{position:absolute;top:3px;right:3px;min-width:16px;height:16px;border-radius:8px;background:#ff1d00;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #050008}
.ps-notif-dd{position:absolute;top:44px;right:0;width:310px;background:#13101a;border:1px solid rgba(255,255,255,.08);border-radius:12px;z-index:100;box-shadow:0 12px 40px rgba(0,0,0,.6);max-height:340px;overflow-y:auto}
.ps-notif-dd-hdr{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.06);font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em}
.ps-notif-dd-mark{font-size:10px;color:#ff1d00;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif}
.ps-notif-dd-item{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.03)}
.ps-notif-dd-item.unread{background:rgba(255,29,0,.03)}
.ps-notif-dd-item-t{font-size:11px;font-weight:600;color:#fff;margin-bottom:2px}
.ps-notif-dd-item-m{font-size:10px;color:rgba(255,255,255,.35);line-height:1.4}
.ps-notif-dd-item-time{font-size:9px;color:rgba(255,255,255,.15);margin-top:3px}

/* Progress */
.ps-prog-wrap{margin-bottom:28px}
.ps-prog-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.ps-prog-lb{font-size:11px;font-weight:600;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:.06em}
.ps-prog-pct{font-size:13px;font-weight:700;color:#ff1d00}
.ps-prog-track{height:4px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.ps-prog-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#ff1d00,#f5a623,#2d9d4f);transition:width .8s cubic-bezier(.34,1.56,.64,1);position:relative}
.ps-prog-fill::after{content:'';position:absolute;right:0;top:-2px;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.5);animation:psDotPulse 1.5s ease-in-out infinite}
@keyframes psDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}
.ps-prog-dots{display:flex;justify-content:space-between;margin-top:8px}
.ps-prog-dot{width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.08);transition:all .4s cubic-bezier(.34,1.56,.64,1)}

/* Timeline */
.ps-tl{position:relative;padding-left:90px}
.ps-tl::before{content:'';position:absolute;left:68px;top:0;bottom:0;width:2px;background:rgba(255,255,255,.06);border-radius:2px}

@keyframes psStageSlide{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.ps-stage{position:relative;margin-bottom:16px;animation:psStageSlide .5s cubic-bezier(.16,1,.3,1) both}
.ps-stage:last-child{margin-bottom:0}

.ps-stage-label{position:absolute;left:-90px;top:22px;width:48px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(255,255,255,.15);transition:color .4s}
.ps-stage.completed .ps-stage-label,.ps-stage.active .ps-stage-label{color:var(--sc)}

/* Dot */
.ps-dot{position:absolute;left:-38px;top:14px;width:36px;height:36px;border-radius:50%;background:#13101a;border:2px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;z-index:3;transition:all .5s cubic-bezier(.34,1.56,.64,1)}
.ps-dot svg{width:15px;height:15px;fill:none;stroke:rgba(255,255,255,.2);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:all .4s}
.ps-stage.completed .ps-dot{background:var(--sc);border-color:var(--sc);box-shadow:0 0 16px color-mix(in srgb,var(--sc) 35%,transparent)}
.ps-stage.completed .ps-dot svg{stroke:#fff}
.ps-stage.completed:hover .ps-dot{transform:scale(1.12)}
.ps-stage.active .ps-dot{border-color:var(--sc);animation:psActivePulse 2s ease-in-out infinite}
.ps-stage.active .ps-dot svg{stroke:var(--sc)}
@keyframes psActivePulse{0%,100%{box-shadow:0 0 10px color-mix(in srgb,var(--sc) 15%,transparent);transform:scale(1)}50%{box-shadow:0 0 22px color-mix(in srgb,var(--sc) 40%,transparent);transform:scale(1.06)}}

/* Connector */
.ps-conn{position:absolute;left:-21px;top:calc(14px + 36px);width:2px;height:calc(100% - 36px + 2px);z-index:2;border-radius:2px;display:none}
.ps-stage.completed .ps-conn{display:block;background:var(--sc);box-shadow:0 0 8px color-mix(in srgb,var(--sc) 30%,transparent);animation:psLineGrow .7s .2s ease-out both}
.ps-stage:last-child .ps-conn{display:none!important}
@keyframes psLineGrow{from{transform:scaleY(0);transform-origin:top}to{transform:scaleY(1);transform-origin:top}}

/* Card */
.ps-card{background:rgba(13,10,20,.6);border:1px solid rgba(255,255,255,.05);border-radius:14px;padding:18px 20px;margin-left:10px;transition:all .3s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden}
.ps-card::before{content:'';position:absolute;top:0;left:0;width:3px;height:0;background:var(--sc);transition:height .5s}
.ps-stage.completed .ps-card::before,.ps-stage.active .ps-card::before{height:100%}
.ps-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
.ps-stage.completed .ps-card{border-color:color-mix(in srgb,var(--sc) 15%,transparent);background:color-mix(in srgb,var(--sc) 3%,rgba(13,10,20,.6))}
.ps-stage.active .ps-card{border-color:color-mix(in srgb,var(--sc) 20%,transparent);animation:psCardGlow 3s ease-in-out infinite}
@keyframes psCardGlow{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 4px 24px color-mix(in srgb,var(--sc) 10%,transparent)}}

.ps-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.ps-stage-name{font-size:15px;font-weight:600;color:#fff;margin-bottom:4px;transition:color .4s}
.ps-stage.completed .ps-stage-name,.ps-stage.active .ps-stage-name{color:var(--sc)}
.ps-stage.disabled .ps-stage-name{color:rgba(255,255,255,.35)}
.ps-stage-desc{font-size:12px;color:rgba(255,255,255,.35);line-height:1.5}
.ps-stage.disabled .ps-stage-desc{color:rgba(255,255,255,.15)}

.ps-chip{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 12px;border-radius:100px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:5px}
.ps-chip svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.ps-chip.locked{color:rgba(255,255,255,.15);background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.ps-chip.review{animation:psChipPulse 2s ease-in-out infinite}
@keyframes psChipPulse{0%,100%{opacity:1}50%{opacity:.6}}

.ps-actions{display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.04)}
.ps-btn{display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;padding:9px 18px;border-radius:9px;cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);border:1px solid;position:relative;overflow:hidden}
.ps-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s}
.ps-btn-review{color:#ff1d00;background:rgba(255,29,0,.06);border-color:rgba(255,29,0,.18)}
.ps-btn-review:hover:not(:disabled){background:rgba(255,29,0,.12);border-color:rgba(255,29,0,.35);transform:translateY(-2px);box-shadow:0 6px 20px rgba(255,29,0,.15)}
.ps-btn-review:hover:not(:disabled) svg{transform:rotate(15deg) scale(1.1)}
.ps-btn-review:disabled{opacity:.15;cursor:not-allowed;color:rgba(255,255,255,.2);background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.04)}
.ps-btn-review.pending{cursor:default;pointer-events:none;animation:psAwait 2.5s ease-in-out infinite}
.ps-btn-review.pending svg{animation:psSpin 3s linear infinite}
@keyframes psAwait{0%,100%{box-shadow:0 0 0 transparent}50%{box-shadow:0 0 18px color-mix(in srgb,var(--sc) 20%,transparent)}}
@keyframes psSpin{to{transform:rotate(360deg)}}
.ps-btn-done{color:rgba(255,255,255,.15);background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.04);cursor:not-allowed;opacity:.2}
.ps-btn-done.completed{opacity:1;cursor:default}

.ps-mentor-row{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;color:rgba(255,255,255,.35)}
.ps-mentor-row svg{width:13px;height:13px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
.ps-reject-msg{margin-top:8px;padding:8px 12px;border-radius:8px;background:rgba(253,28,0,.04);border:1px solid rgba(253,28,0,.1);font-size:11px;color:#ff6040}

/* Toast */
.ps-toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(80px);background:#13101a;border:1px solid rgba(255,29,0,.25);color:#fff;font-size:13px;font-weight:500;padding:12px 24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:center;gap:10px;z-index:9999;opacity:0;transition:all .5s cubic-bezier(.16,1,.3,1);pointer-events:none;backdrop-filter:blur(8px)}
.ps-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.ps-toast svg{width:18px;height:18px;fill:none;stroke-width:2;flex-shrink:0}

/* Modal */
.ps-modal-bg{position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(5,0,8,.88);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(6px)}
.ps-modal{background:#13101a;border:1px solid rgba(255,29,0,.15);border-radius:20px;padding:32px;width:92%;max-width:420px;text-align:center;animation:psModIn .4s cubic-bezier(.16,1,.3,1);box-shadow:0 20px 80px rgba(0,0,0,.5)}
@keyframes psModIn{from{opacity:0;transform:translateY(28px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
.ps-modal-icon{width:56px;height:56px;margin:0 auto 16px;border-radius:50%;background:rgba(255,29,0,.06);border:1px solid rgba(255,29,0,.15);display:flex;align-items:center;justify-content:center;animation:psModSpin .7s cubic-bezier(.34,1.56,.64,1)}
@keyframes psModSpin{0%{transform:scale(0) rotate(-120deg)}100%{transform:scale(1) rotate(0)}}
.ps-modal-icon svg{width:24px;height:24px;stroke:#ff1d00;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ps-modal-title{font-size:16px;font-weight:600;color:#fff;margin-bottom:8px}
.ps-modal-desc{font-size:12.5px;color:rgba(255,255,255,.35);line-height:1.5;margin-bottom:14px}
.ps-modal-mentor{font-size:12px;font-weight:500;color:#EEA727;margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:6px}
.ps-modal-mentor svg{width:14px;height:14px;stroke:#EEA727;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ps-modal-btns{display:flex;gap:10px;justify-content:center}
.ps-modal-btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:11px 24px;border-radius:11px;cursor:pointer;transition:all .3s cubic-bezier(.34,1.56,.64,1);border:none}
.ps-modal-btn.confirm{color:#fff;background:linear-gradient(135deg,#ff1d00,#c41600);box-shadow:0 4px 16px rgba(255,29,0,.2)}
.ps-modal-btn.confirm:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,29,0,.3)}
.ps-modal-btn.confirm:disabled{opacity:.5;cursor:not-allowed}
.ps-modal-btn.cancel{color:rgba(255,255,255,.35);background:transparent;border:1px solid rgba(255,255,255,.08)}
.ps-modal-btn.cancel:hover{border-color:rgba(255,255,255,.2);color:#fff}

@media(max-width:640px){
  .ps-header{flex-direction:column;align-items:flex-start;gap:10px}
  .ps-tl{padding-left:60px}
  .ps-tl::before{left:42px}
  .ps-stage-label{left:-60px;width:32px;font-size:8px}
  .ps-dot{left:-26px;width:28px;height:28px}
  .ps-dot svg{width:12px;height:12px}
  .ps-conn{left:-13px;top:calc(14px + 28px)}
  .ps-card{padding:14px;margin-left:6px;border-radius:12px}
  .ps-stage-name{font-size:13px}
  .ps-stage-desc{font-size:11px}
  .ps-actions{flex-direction:column;align-items:stretch}
  .ps-btn{justify-content:center}
  .ps-notif-dd{width:280px;right:-20px}
}
      `}</style>

      {/* Header */}
      <div className="ps-header">
        <div className="ps-header-left">
          <div className="ps-header-icon"><svg viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div>
          <div>
            <div className="ps-header-title">Project Status</div>
            <div className="ps-header-sub">{teamInfo?.project_title || teamNumber || 'Track your project'}</div>
          </div>
        </div>
        <div className="ps-header-right">
          {/* Notification bell */}
          <div className="ps-notif-wrap">
            <div className="ps-notif-btn2" onClick={() => setShowPsNotif(!showPsNotif)}>
              <Bell size={16}/>
              {psUnread > 0 && <div className="ps-notif-badge">{psUnread}</div>}
            </div>
            {showPsNotif && (
              <div className="ps-notif-dd" onClick={e => e.stopPropagation()}>
                <div className="ps-notif-dd-hdr">
                  <span>Notifications</span>
                  {psUnread > 0 && <button className="ps-notif-dd-mark" onClick={markAllPsRead}>Mark all read</button>}
                </div>
                {psNotifs.length === 0 ? <div style={{padding:20,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.15)'}}>No notifications</div> :
                  psNotifs.map(n => (
                    <div key={n.id} className={`ps-notif-dd-item ${!n.read?'unread':''}`}>
                      <div className="ps-notif-dd-item-t">{n.title}</div>
                      <div className="ps-notif-dd-item-m">{n.message}</div>
                      <div className="ps-notif-dd-item-time">{new Date(n.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <div className="ps-badge-pill">{progress.completed} / 7 Completed</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ps-prog-wrap">
        <div className="ps-prog-top"><span className="ps-prog-lb">Overall Progress</span><span className="ps-prog-pct">{pct}%</span></div>
        <div className="ps-prog-track"><div className="ps-prog-fill" style={{width:`${pct}%`}}/></div>
        <div className="ps-prog-dots">
          {STAGE_META.map((st, i) => {
            const filled = stages[i]?.status === 'completed';
            return <div key={i} className="ps-prog-dot" style={filled ? {background:st.color,borderColor:st.color,boxShadow:`0 0 6px ${st.color}50`} : {}} title={`Stage ${i+1}: ${st.name}`}/>
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="ps-tl">
        {STAGE_META.map((st, idx) => {
          const s = stages[idx] || { status: 'pending', actionable: idx === 0 };
          const status = getStatus(s, idx);
          const isCom = status === 'completed', isAct = status === 'active', isRdy = status === 'ready', isDis = status === 'disabled';

          return (
            <div key={idx} className={`ps-stage ${status}`} style={{'--sc': st.color, animationDelay: `${idx * 0.08}s`}}>
              <div className="ps-stage-label">S-{idx+1}</div>
              <div className="ps-dot"><svg viewBox="0 0 24 24"><path d={st.icon}/></svg></div>
              <div className="ps-conn"/>
              <div className="ps-card">
                <div className="ps-card-top">
                  <div>
                    <div className="ps-stage-name">{st.name}</div>
                    <div className="ps-stage-desc">{st.desc}</div>
                  </div>
                  {isAct && <span className="ps-chip review" style={{color:st.color,background:`${st.color}12`,border:`1px solid ${st.color}40`}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> In Review</span>}
                  {isDis && <span className="ps-chip locked"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Locked</span>}
                  {isCom && <span className="ps-chip" style={{color:st.color,background:`${st.color}12`,border:`1px solid ${st.color}30`}}><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Done</span>}
                </div>

                <div className="ps-actions">
                  {isRdy && <button className="ps-btn ps-btn-review" onClick={() => setModalStage({stage_number:idx+1,stage_name:st.name,...st,...s})}><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg><span>Mark for Review</span></button>}
                  {isAct && <button className="ps-btn ps-btn-review pending" style={{color:st.color,background:`${st.color}0F`,borderColor:`${st.color}30`}}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Awaiting Mentor</span></button>}
                  {isDis && <button className="ps-btn ps-btn-review" disabled><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg><span>Mark for Review</span></button>}
                  {isCom ? <button className="ps-btn ps-btn-done completed" style={{color:st.color,background:`${st.color}12`,borderColor:`${st.color}30`}}><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Completed</span></button> : <button className="ps-btn ps-btn-done" disabled><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><span>Completed</span></button>}
                </div>

                {isAct && <div className="ps-mentor-row"><svg viewBox="0 0 24 24" style={{stroke:st.color}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Sent to <strong style={{marginLeft:3}}>{mentor?.name || teamInfo?.mentor_assigned || 'Mentor'}</strong></div>}
                {isCom && s.reviewed_by_name && <div className="ps-mentor-row"><svg viewBox="0 0 24 24" style={{stroke:st.color}}><polyline points="20 6 9 17 4 12"/></svg> Approved by <strong style={{marginLeft:3}}>{s.reviewed_by_name}</strong> · {s.reviewed_at && new Date(s.reviewed_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>}
                {s.status === 'pending' && s.mentor_comment && <div className="ps-reject-msg">Mentor feedback: "{s.mentor_comment}"</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      <div className={`ps-toast ${psToast ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" style={{stroke:psToast?.isError?'#ef4444':'#10b981'}}>{psToast?.isError ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}</svg>
        <span>{psToast?.msg}</span>
      </div>

      {/* Modal */}
      {modalStage && (
        <div className="ps-modal-bg" onClick={() => !submitting && setModalStage(null)}>
          <div className="ps-modal" onClick={e => e.stopPropagation()}>
            <div className="ps-modal-icon"><svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
            <div className="ps-modal-title">Send "{modalStage.name}" for Review?</div>
            <div className="ps-modal-desc">Your mentor will be notified to review Stage {modalStage.stage_number}: {modalStage.name}. They will visit your team to verify.</div>
            {(mentor || teamInfo?.mentor_assigned) && <div className="ps-modal-mentor"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {mentor?.name || teamInfo?.mentor_assigned}</div>}
            <div className="ps-modal-btns">
              <button className="ps-modal-btn cancel" onClick={() => setModalStage(null)} disabled={submitting}>Cancel</button>
              <button className="ps-modal-btn confirm" onClick={handleSubmitReview} disabled={submitting}>{submitting ? 'Sending...' : 'Send for Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* ═══ PROJECT DETAILS — BROWSE ALL PROJECTS ═══ */
function ProjectDetails({ user }) {
  const [projects, setProjects] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTech, setActiveTech] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const myTeamNumber = user?.teamNumber || '';

  // Fetch all projects once
  useEffect(() => {
    fetch('/api/projects/list')
      .then(r => r.json())
      .then(d => {
        if (d.projects) {
          setProjects(d.projects);
          // Default to user's own team, or first project
          const myProject = d.projects.find(p => p.teamNumber === myTeamNumber);
          const initial = myProject || d.projects[0];
          if (initial) setSelectedTeam(initial.teamNumber);
        }
      })
      .catch(e => console.error('Fetch projects error:', e))
      .finally(() => setLoading(false));
  }, [myTeamNumber]);

  // Fetch details when selection changes
  useEffect(() => {
    if (!selectedTeam) return;
    setDetailsLoading(true);
    fetch('/api/projects/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamNumber: selectedTeam })
    })
      .then(r => r.json())
      .then(d => { if (d.project) setDetails(d.project); })
      .catch(e => console.error('Fetch details error:', e))
      .finally(() => setDetailsLoading(false));
  }, [selectedTeam]);

  // Unique technologies
  const technologies = ['all', ...Array.from(new Set(projects.map(p => p.technology).filter(Boolean)))];

  // Filter projects by tech + search (searches title, team number, mentor name, technology)
  const filteredProjects = projects.filter(p => {
    const matchesTech = activeTech === 'all' || p.technology === activeTech;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.projectTitle.toLowerCase().includes(q) ||
      (p.teamNumber || '').toLowerCase().includes(q) ||
      (p.mentor || '').toLowerCase().includes(q) ||
      (p.technology || '').toLowerCase().includes(q);
    return matchesTech && matchesSearch;
  });

  const TECH_COLORS = {
    'AWS Development': '#ff9900',
    'Google Flutter': '#42a5f5',
    'Full Stack': '#4ade80',
    'Data Specialist': '#a78bfa',
    'ServiceNow': '#22c55e',
    'VLSI': '#ef4444',
    'SkillUp Coder': '#f59e0b'
  };

  const getTechColor = (tech) => TECH_COLORS[tech] || '#fd1c00';

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'rgba(255,255,255,.3)',fontSize:'.8rem'}}>
        <div className="mp-loading-spinner" style={{marginRight:10}}/> Loading projects...
      </div>
    );
  }

  return (
    <div className="pd-wrap">
      <style>{`
.pd-wrap{display:flex;flex-direction:column;gap:16px;animation:pdIn .5s ease both;position:relative}
@keyframes pdIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* Tech tabs */
.pd-tech-tabs{display:flex;gap:6px;padding:6px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);overflow-x:auto;-webkit-overflow-scrolling:touch}
.pd-tech-tabs::-webkit-scrollbar{display:none}
.pd-tech-tab{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);color:rgba(255,255,255,.45);font-size:.72rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .25s;white-space:nowrap;flex-shrink:0}
.pd-tech-tab:hover{color:rgba(255,255,255,.75);border-color:rgba(255,255,255,.15)}
.pd-tech-tab.active{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08))!important;color:#fff!important;border-color:rgba(253,28,0,.3)!important;box-shadow:0 2px 12px rgba(253,28,0,.1)}
.pd-tech-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

/* Main layout */
.pd-main{display:grid;grid-template-columns:1fr 340px;gap:16px;min-height:0}

/* Showcase */
.pd-showcase{background:#0c0614;border:1px solid rgba(255,255,255,.06);border-radius:18px;overflow:hidden;position:relative;min-height:560px;display:flex;flex-direction:column}

/* Header with gradient */
.pd-show-hdr{padding:16px 28px 20px;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 50%,#0a0a0a 100%);position:relative;overflow:hidden}
.pd-show-hdr-inner{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.pd-show-hdr-left{flex:1;min-width:0}
.pd-show-mentor{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;align-self:flex-start;margin-top:-4px}
.pd-show-mentor-photo{width:80px;height:80px;border-radius:50%;overflow:hidden;flex-shrink:0;position:relative;background:#1a1a1a;padding:1px;background-image:linear-gradient(#1a1a1a,#1a1a1a),linear-gradient(135deg,#8a8a8a,#ffffff,#8a8a8a);background-origin:border-box;background-clip:content-box,border-box;border:1px solid transparent}
.pd-show-mentor-photo>img,.pd-show-mentor-photo>.pd-show-mentor-fallback{border-radius:50%;width:100%;height:100%}
.pd-show-mentor-photo img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.pd-show-mentor-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-size:1rem;font-weight:700;color:#EEA727;background:rgba(238,167,39,.08)}
.pd-show-mentor-info{display:flex;flex-direction:column;align-items:center;min-width:0}
.pd-show-mentor-label{display:none}
.pd-show-mentor-name{font-family:'DM Sans',sans-serif;font-size:.62rem;font-weight:600;color:rgba(255,255,255,.7);line-height:1.2;text-align:center;text-transform:uppercase;letter-spacing:.3px;max-width:200px;word-wrap:break-word;white-space:normal}
.pd-show-hdr::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 0%,transparent 40%,rgba(253,28,0,.08) 50%,rgba(238,167,39,.12) 55%,rgba(255,255,255,.08) 60%,transparent 70%,transparent 100%);background-size:200% 100%;animation:shinyWave 4s linear infinite;pointer-events:none}
.pd-show-hdr::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 50%,rgba(253,28,0,.04),transparent 50%),radial-gradient(circle at 70% 50%,rgba(238,167,39,.04),transparent 50%);pointer-events:none;animation:glowShift 6s ease-in-out infinite}
@keyframes shinyWave{0%{background-position:-100% 0}100%{background-position:200% 0}}
@keyframes glowShift{0%,100%{opacity:.6}50%{opacity:1}}
.pd-show-meta{display:flex;align-items:center;gap:10px;margin-bottom:22px;font-family:'DM Sans',sans-serif}
.pd-show-badge{padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,rgba(253,28,0,.2),rgba(238,167,39,.15));backdrop-filter:blur(10px);border:1px solid rgba(253,28,0,.35);font-size:.66rem;font-weight:800;letter-spacing:2px;color:#fff;font-family:'DM Sans',sans-serif}
.pd-show-tech{padding:6px 14px;border-radius:8px;background:rgba(255,255,255,.95);color:#fd1c00;font-size:.62rem;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;font-family:'DM Sans',sans-serif;box-shadow:0 4px 16px rgba(255,255,255,.08)}
.pd-show-title{font-family:'Astro','Orbitron',sans-serif;font-size:1.5rem;font-weight:800;color:#fff;line-height:1.15;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;word-break:break-word;word-spacing:6px;text-shadow:0 2px 20px rgba(238,167,39,.3),0 0 40px rgba(253,28,0,.15)}
.pd-show-sub{font-size:.8rem;color:rgba(255,255,255,.75);font-weight:500;font-family:'DM Sans',sans-serif;letter-spacing:.3px}

/* Members strip */
.pd-members-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:2px;padding:0;background:#0c0614}
.pd-member-col{position:relative;aspect-ratio:3/4;overflow:hidden;background:var(--photo-bg,#10233d);transition:all .4s ease}
.pd-member-col::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 50%,rgba(255,255,255,.02) 100%);pointer-events:none;z-index:1;opacity:0;transition:opacity .4s ease}
.pd-member-col:hover::before{opacity:1}
.pd-member-col:hover{transform:translateY(-4px);z-index:2;box-shadow:0 12px 32px rgba(0,0,0,.4)}
.pd-member-col::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.85) 100%),linear-gradient(90deg,rgba(0,0,0,.5) 0%,transparent 35%);pointer-events:none;z-index:2}
.pd-member-img{width:100%;height:100%;object-fit:cover;display:block}
.pd-member-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:2.2rem;font-weight:800;color:rgba(255,255,255,.5);background:var(--photo-bg,#10233d);position:relative;z-index:1}
.pd-member-name{position:absolute;left:8px;top:0;bottom:10px;z-index:3;display:flex;flex-direction:column;justify-content:flex-end;gap:0}
.pd-member-name-big{font-family:'Astro','Orbitron',sans-serif;font-size:.56rem;font-weight:800;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.95),0 0 8px rgba(253,28,0,.3);letter-spacing:2px;text-transform:uppercase;writing-mode:vertical-lr;transform:rotate(180deg);line-height:1}
.pd-member-name-sub{display:none}
.pd-member-roll-rt{position:absolute;bottom:13px;right:8px;z-index:5;font-family:'Astro','Orbitron',sans-serif;font-size:.5rem;color:rgba(255,255,255,.85);font-weight:700;letter-spacing:1.5px;text-shadow:0 2px 10px rgba(0,0,0,1)}
.pd-member-leader-star{position:absolute;top:8px;left:8px;z-index:4;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#EEA727,#fd1c00);display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 12px rgba(238,167,39,.5),0 0 0 2px rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.2)}

/* Info sections */
.pd-info-sections{padding:22px 32px 28px;display:flex;flex-direction:column;gap:18px;flex:1}
.pd-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pd-info-card{padding:16px 18px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.pd-info-title{font-size:.58rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.pd-info-text{font-size:.82rem;color:rgba(255,255,255,.85);line-height:1.6;font-weight:500}
.pd-info-text-muted{color:rgba(255,255,255,.4);font-style:italic}

/* Chips */
.pd-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.pd-chip{padding:5px 12px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);font-size:.68rem;color:rgba(255,255,255,.8);font-weight:500}
.pd-chip.tech{background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.2);color:#34d399}
.pd-chip.ai{background:rgba(242,29,50,.08);border-color:rgba(242,29,50,.25);color:#ff6b7a}
.pd-chip.area{background:rgba(238,167,39,.08);border-color:rgba(238,167,39,.25);color:#EEA727}

/* Right sidebar — project list */
</button>
        ))}
      </div>.pd-sidebar{background:rgba(12,6,20,.6);border:1px solid rgba(255,255,255,.06);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;align-self:start;max-height:100%}
.pd-main{align-items:stretch}
      </div>

      <div className="pd-main">
.pd-sidebar-hdr{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0}
.pd-sidebar-title{font-size:.72rem;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
.pd-search-wrap{position:relative;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.pd-search-wrap:focus-within{border-color:rgba(253,28,0,.3)}
.pd-search-wrap input{flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.74rem}
.pd-search-wrap input::placeholder{color:rgba(255,255,255,.3)}
.pd-search-wrap svg{color:rgba(255,255,255,.3);flex-shrink:0}

.pd-list{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:6px}
.pd-list::-webkit-scrollbar{width:4px}.pd-list::-webkit-scrollbar-thumb{background:rgba(253,28,0,.15);border-radius:4px}
.pd-list-item{padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:all .2s;position:relative}
.pd-list-item:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);transform:translateX(2px)}
.pd-list-item.active{background:linear-gradient(135deg,rgba(253,28,0,.1),rgba(238,167,39,.05));border-color:rgba(253,28,0,.25);box-shadow:0 2px 12px rgba(253,28,0,.08)}
.pd-list-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fd1c00,#EEA727)}
.pd-list-row1{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}
.pd-list-row2{display:flex;align-items:center;justify-content:space-between;gap:6px}
.pd-list-title{font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:600;color:#fff;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.pd-list-team-num{font-family:'DM Sans',sans-serif;font-size:.6rem;font-weight:700;color:rgba(253,28,0,.85);letter-spacing:.5px;flex-shrink:0}
.pd-list-mentor{font-family:'DM Sans',sans-serif;font-size:.58rem;font-weight:500;color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.pd-list-tech-pill{font-family:'DM Sans',sans-serif;padding:3px 8px;border-radius:5px;font-size:.54rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px}

/* Mentor Card */
.pd-mentor-card{display:flex;align-items:center;gap:16px;padding:16px 20px;border-radius:14px;background:linear-gradient(135deg,rgba(238,167,39,.08),rgba(253,28,0,.04));border:1px solid rgba(238,167,39,.2);position:relative;overflow:hidden}
.pd-mentor-card::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);animation:mentorShine 5s linear infinite}
@keyframes mentorShine{0%{left:-100%}100%{left:100%}}
.pd-mentor-photo{width:72px;height:72px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid rgba(238,167,39,.4);background:linear-gradient(135deg,#2a2a2a,#0a0a0a);position:relative;z-index:1;box-shadow:0 4px 16px rgba(238,167,39,.15)}
.pd-mentor-photo img{width:100%;height:100%;object-fit:cover;display:block}
.pd-mentor-photo-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:1.4rem;font-weight:800;color:#EEA727}
.pd-mentor-info{flex:1;min-width:0;position:relative;z-index:1}
.pd-mentor-label{font-family:'DM Sans',sans-serif;font-size:.56rem;color:#EEA727;letter-spacing:2px;font-weight:700;margin-bottom:4px}
.pd-mentor-name{font-family:'DM Sans',sans-serif;font-size:.98rem;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.2}
.pd-mentor-meta{display:flex;flex-wrap:wrap;gap:8px;font-family:'DM Sans',sans-serif;font-size:.68rem;color:rgba(255,255,255,.55);font-weight:500}
.pd-mentor-meta span{display:inline-flex;align-items:center;gap:4px}

.pd-empty{padding:40px 20px;text-align:center;color:rgba(255,255,255,.3);font-size:.78rem}

/* Mobile */
@media(max-width:1100px){
  .pd-main{grid-template-columns:1fr}
  .pd-sidebar{max-height:400px;order:-1}
}
@media(max-width:768px){
  .pd-show-hdr{padding:24px 20px}
  .pd-show-hdr-inner{flex-direction:column;align-items:flex-start;gap:16px}
  .pd-show-mentor{width:100%;padding:12px 16px}
  .pd-show-title{font-size:1.15rem;letter-spacing:1px}
  .pd-info-sections{padding:16px 18px 20px}
  .pd-info-grid{grid-template-columns:1fr}
  .pd-members-strip{grid-template-columns:repeat(auto-fit,minmax(90px,1fr))}
  .pd-mentor-card{flex-direction:column;align-items:flex-start;text-align:left;padding:14px}
  .pd-mentor-photo{width:56px;height:56px}
  .pd-member-name-big{font-size:.7rem}
  .pd-member-name-sub{font-size:.52rem}
  .pd-tech-tab{padding:8px 12px;font-size:.66rem}
  .pd-sidebar{max-height:350px}
  .pd-list-item{padding:10px}
  .pd-list-title{font-size:.72rem}
}
@media(max-width:480px){
  .pd-show-title{font-size:1.1rem}
  .pd-show-hdr{padding:16px}
  .pd-info-sections{padding:14px}
  .pd-members-strip{grid-template-columns:repeat(3,1fr)}
}
      `}</style>

      {/* Technology Tabs */}
      <div className="pd-tech-tabs" style={{position:'sticky',top:0,zIndex:100,background:'#050008',padding:'8px 0'}}>
        {technologies.map(tech => (
          <button
            key={tech}
            className={`pd-tech-tab ${activeTech === tech ? 'active' : ''}`}
            onClick={() => setActiveTech(tech)}
            style={activeTech === tech ? {'--tc': getTechColor(tech)} : {}}
          >
            <span className="pd-tech-dot" style={{background: tech === 'all' ? '#fd1c00' : getTechColor(tech)}}/>
            {tech === 'all' ? `All (${projects.length})` : `${tech} (${projects.filter(p=>p.technology===tech).length})`}
          </button>
        ))}
      </div>

      <div className="pd-main">
        {/* Main Showcase */}
        <div className="pd-showcase">
          {detailsLoading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1,color:'rgba(255,255,255,.3)',fontSize:'.78rem'}}>
              <div className="mp-loading-spinner" style={{marginRight:10}}/> Loading project...
            </div>
          ) : !details ? (
            <div className="pd-empty">
              <FolderKanban size={32} style={{color:'rgba(255,255,255,.15)',marginBottom:12}}/>
              <div>Select a project from the list</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="pd-show-hdr">
                <div className="pd-show-hdr-inner">
                  <div className="pd-show-hdr-left">
                    <div className="pd-show-meta">
                      <span className="pd-show-badge">{details.teamNumber}</span>
                      <span className="pd-show-tech" style={{background: getTechColor(details.technology), color: '#fff'}}>{details.technology}</span>
                    </div>
                    <div className="pd-show-title">{details.projectTitle}</div>
                    <div className="pd-show-sub">
                      {details.members.length} Members · {details.batch || 'Drive Ready'}
                    </div>
                  </div>
                  {details.mentorDetails && (
                    <div className="pd-show-mentor">
                      <div className="pd-show-mentor-photo">
                        {details.mentorDetails.image_url ? (
                          <img src={details.mentorDetails.image_url} alt={details.mentorDetails.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>
                        ) : null}
                        <div className="pd-show-mentor-fallback" style={{display: details.mentorDetails.image_url ? 'none' : 'flex'}}>
                          {(details.mentorDetails.name||'?').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="pd-show-mentor-info">
                        <div className="pd-show-mentor-name">{details.mentorDetails.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Members Strip */}
              {details.members.length > 0 && (
                <div className="pd-members-strip">
                  {details.members.map((m, i) => (
                    <div key={m.rollNumber||i} className="pd-member-col">
                      {m.isLeader && <div className="pd-member-leader-star">👑</div>}
                      {m.imageUrl ? (
                        <img className="pd-member-img" src={m.imageUrl} alt={m.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>
                      ) : null}
                      <div className="pd-member-fallback" style={{display: m.imageUrl ? 'none' : 'flex'}}>
                        {(m.name||'?').charAt(0).toUpperCase()}
                      </div>
                      <div className="pd-member-name">
                        <div className="pd-member-name-big">{(m.name || m.rollNumber).split(' ').slice(0,2).join(' ')}</div>
                      </div>
                      <div className="pd-member-roll-rt">{m.rollNumber}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info Sections */}
              <div className="pd-info-sections">
                {details.projectDescription && (
                  <div className="pd-info-card">
                    <div className="pd-info-title"><FileText size={11} style={{color:'#EEA727'}}/> Project Description</div>
                    <div className="pd-info-text">{details.projectDescription}</div>
                  </div>
                )}

                {details.problemStatement && (
                  <div className="pd-info-card">
                    <div className="pd-info-title"><Target size={11} style={{color:'#fd1c00'}}/> Problem Statement</div>
                    <div className="pd-info-text">{details.problemStatement}</div>
                  </div>
                )}

                <div className="pd-info-grid">
                  {details.projectArea?.length > 0 && (
                    <div className="pd-info-card">
                      <div className="pd-info-title"><Layers size={11} style={{color:'#EEA727'}}/> Project Area</div>
                      <div className="pd-chips">
                        {details.projectArea.map((a, i) => <span key={i} className="pd-chip area">{a}</span>)}
                      </div>
                    </div>
                  )}

                  {details.techStack?.length > 0 && (
                    <div className="pd-info-card">
                      <div className="pd-info-title"><Cpu size={11} style={{color:'#10b981'}}/> Tech Stack</div>
                      <div className="pd-chips">
                        {details.techStack.map((t, i) => <span key={i} className="pd-chip tech">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {details.aiUsage === 'Yes' && (
                  <div className="pd-info-card" style={{background:'rgba(242,29,50,.04)',borderColor:'rgba(242,29,50,.15)'}}>
                    <div className="pd-info-title"><Sparkles size={11} style={{color:'#f21d32'}}/> AI Integration</div>
                    {details.aiCapabilities && <div className="pd-info-text" style={{marginBottom:10}}>{details.aiCapabilities}</div>}
                    {details.aiTools?.length > 0 && (
                      <div className="pd-chips">
                        {details.aiTools.map((t, i) => <span key={i} className="pd-chip ai">{t}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar — Project List */}
        <div className="pd-sidebar">
          <div className="pd-sidebar-hdr">
            <div className="pd-sidebar-title">Projects ({filteredProjects.length})</div>
            <div className="pd-search-wrap">
              <Search size={14}/>
              <input
                type="text"
                placeholder="Search title, team, mentor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="pd-list">
            {filteredProjects.length === 0 ? (
              <div className="pd-empty">No projects found</div>
            ) : (
              filteredProjects.map(p => (
                <div
                  key={p.teamNumber}
                  className={`pd-list-item ${selectedTeam === p.teamNumber ? 'active' : ''}`}
                  onClick={() => setSelectedTeam(p.teamNumber)}
                >
                  <div className="pd-list-row1">
                    <span className="pd-list-title">{p.projectTitle}</span>
                    <span className="pd-list-team-num">{p.teamNumber}</span>
                  </div>
                  <div className="pd-list-row2">
                    <span className="pd-list-mentor">{p.mentor || '—'}</span>
                    <span className="pd-list-tech-pill" style={{background:`${getTechColor(p.technology)}18`,color:getTechColor(p.technology),border:`1px solid ${getTechColor(p.technology)}30`}}>
                      {p.technology}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ═══ MAIN DASHBOARD ═══ */
export default function Dashboard(){
  const router = useRouter();
  const [active,setActive]=useState("my-profile");
  const [collapsed,setCollapsed]=useState(false);
  const [hovered,setHovered]=useState(null);
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [videoRatings,setVideoRatings]=useState(null);
  const [videoLoading,setVideoLoading]=useState(false);
  const [hootData,setHootData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [isMobile,setIsMobile]=useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    check(); window.addEventListener('resize',check);
    return ()=>window.removeEventListener('resize',check);
  },[]);

  useEffect(()=>{
    let u = null;
    try { u = getSession(); } catch {}
    if (!u) {
      try { const raw = localStorage.getItem('ps_user'); if (raw) u = JSON.parse(raw); } catch {}
    }
    if (!u) { router.push('/auth/login'); return; }
    const roll = u.rollNumber || u.roll_number || '';
    const role = u.role || 'member';
    setUser({ ...u, rollNumber: roll, name: u.name || '', role });
    if (roll) { import('@/lib/pushNotifications').then(m => m.registerPushNotifications(roll, 'student')).catch(() => {}) }

    if (roll) {
      // Fetch profile for sidebar display
      fetch('/api/auth/student-profile', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({rollNumber:roll}) })
        .then(r=>r.json())
        .then(d=>{
          if(d.profile) { setProfile(d.profile); setLoading(false); }
          else {
            import('@supabase/supabase-js').then(({createClient})=>{
              const sb = createClient('https://yiwyfhdzgvlsmdeshdgv.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'');
              sb.from('student_profiles').select('*').eq('roll_number',roll).single()
                .then(({data})=>{ if(data) setProfile(data); })
                .finally(()=>setLoading(false));
            });
          }
        })
        .catch(e=>{console.error('Profile fetch error:',e);setLoading(false)});

      // Video ratings
      setVideoLoading(true);
      fetch('/api/auth/video-ratings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({rollNumber:roll}) })
        .then(r=>r.json())
        .then(d=>{ if(d.ratings) setVideoRatings(d.ratings); })
        .catch(e=>console.error('Video ratings error:',e))
        .finally(()=>setVideoLoading(false));

      // HOOT assessment
      supabase.from('hoot_assessments').select('listening,speaking,reading,writing,total')
        .eq('roll_number',roll).single()
        .then(({data})=>{ if(data) setHootData(data); });
    } else { setLoading(false); }
  },[]);

  // Only admin roll sees all sections; others see only My Profile + Team Profile
  const ADMIN_ROLL = '23A91A61G9';
  const isAdmin = ((user?.rollNumber) || '').toUpperCase() === ADMIN_ROLL;
  const VISIBLE_NAV_SECTIONS = isAdmin
    ? NAV_SECTIONS
    : NAV_SECTIONS.map(sec => ({
        ...sec,
        items: sec.items.filter(i => i.id === 'my-profile' || i.id === 'team-profile')
      })).filter(sec => sec.items.length > 0);
  const activeItem=VISIBLE_NAV_SECTIONS.flatMap(s=>s.items).find(i=>i.id===active);
  const displayName = profile?.name || user?.name || 'Student';
  const displayTeam = user?.teamNumber || profile?.roll_number || '';

  if (loading) return <div style={{width:'100%',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'rgba(255,255,255,.4)',fontFamily:'sans-serif'}}>Loading...</div>;

  return(
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.cdnfonts.com/css/astro');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;overflow:hidden;background:#050008;font-family:'DM Sans',sans-serif;}
.dash{display:flex;height:100vh;color:#fff;}

.sidebar{height:100vh;background:linear-gradient(180deg,#0c0616,#080310,#0a0614);border-right:1px solid rgba(253,28,0,.06);display:flex;flex-direction:column;overflow:hidden;transition:width .3s cubic-bezier(.22,1,.36,1),min-width .3s cubic-bezier(.22,1,.36,1);position:relative;z-index:10;}
.sidebar::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;background:linear-gradient(180deg,rgba(253,28,0,.12),rgba(250,160,0,.06),transparent);}
.sb-toggle{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;color:rgba(255,255,255,.5);flex-shrink:0;}
.sb-toggle:hover{background:rgba(253,28,0,.1);border-color:rgba(253,28,0,.2);color:#fd1c00;}
.sb-profile{padding:24px 20px 18px;border-bottom:1px solid rgba(255,255,255,.04);}
.sb-profile-row{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.sb-avatar{border-radius:14px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;box-shadow:0 0 20px rgba(253,28,0,.2);flex-shrink:0;}
.sb-profile-info{margin-top:12px;}
.sb-greeting{font-size:.62rem;color:rgba(255,255,255,.35);display:flex;align-items:center;gap:3px;}
.sb-name{font-size:.88rem;font-weight:700;color:#fff;}
.sb-team-tag{margin-top:8px;padding:4px 10px;border-radius:6px;background:rgba(253,28,0,.06);border:1px solid rgba(253,28,0,.12);font-size:.58rem;font-weight:600;color:#fd1c00;letter-spacing:1px;display:inline-block;}
.sb-nav{flex:1;overflow-y:auto;padding:12px 0;}
.sb-nav::-webkit-scrollbar{width:2px}.sb-nav::-webkit-scrollbar-thumb{background:rgba(253,28,0,.1);border-radius:2px;}
.sb-section{margin-bottom:8px;}
.sb-section-header{padding:6px 20px;font-size:.52rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.2);}
.sb-item{display:flex;align-items:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.sb-item-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:all .25s;flex-shrink:0;}
.sb-item-icon svg{color:rgba(255,255,255,.35);transition:color .25s;}
.sb-item-label{font-size:.8rem;font-weight:500;color:rgba(255,255,255,.45);transition:color .25s;white-space:nowrap;}
.sb-item:hover{background:rgba(255,255,255,.03);}
.sb-item:hover .sb-item-icon svg{color:rgba(255,255,255,.65);}
.sb-item:hover .sb-item-label{color:rgba(255,255,255,.7);}
.sb-item.active{background:linear-gradient(135deg,rgba(253,28,0,.12),rgba(250,160,0,.06));}
.sb-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fd1c00,#faa000);box-shadow:0 0 8px rgba(253,28,0,.4);}
.sb-item.active .sb-item-icon{background:linear-gradient(135deg,#fd1c00,#faa000);box-shadow:0 0 14px rgba(253,28,0,.2);}
.sb-item.active .sb-item-icon svg{color:#fff!important;}
.sb-item.active .sb-item-label{color:#fff;font-weight:600;}
.sb-tooltip{position:absolute;left:100%;top:50%;transform:translateY(-50%);margin-left:12px;padding:6px 12px;border-radius:8px;background:rgba(12,6,22,.95);border:1px solid rgba(253,28,0,.12);box-shadow:0 4px 20px rgba(0,0,0,.5);font-size:.72rem;font-weight:600;color:#fff;white-space:nowrap;pointer-events:none;z-index:50;animation:ttIn .15s ease;}
.sb-tooltip::before{content:'';position:absolute;left:-5px;top:50%;transform:translateY(-50%) rotate(45deg);width:8px;height:8px;background:rgba(12,6,22,.95);border-left:1px solid rgba(253,28,0,.12);border-bottom:1px solid rgba(253,28,0,.12);}
@keyframes ttIn{from{opacity:0;transform:translateY(-50%) translateX(-4px)}to{opacity:1;transform:translateY(-50%) translateX(0)}}
.sb-bottom{padding:14px;border-top:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;gap:4px;}
.sb-bottom-item{display:flex;align-items:center;border-radius:9px;cursor:pointer;transition:all .2s;}
.sb-bottom-item:hover{background:rgba(255,255,255,.03);}
.sb-bottom-item svg{color:rgba(255,255,255,.3);}
.sb-bottom-item:hover svg{color:rgba(255,255,255,.6);}
.sb-bottom-label{font-size:.74rem;color:rgba(255,255,255,.35);}

.content{flex:1;display:flex;flex-direction:column;overflow:hidden;background:#050008;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid rgba(255,255,255,.04);flex-shrink:0;}
.topbar-title{font-size:1.05rem;font-weight:700;color:#fff;}
.topbar-breadcrumb{font-size:.65rem;color:rgba(255,255,255,.3);}
.topbar-right{display:flex;align-items:center;gap:12px;}
.topbar-search{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);}
.topbar-search:focus-within{border-color:rgba(253,28,0,.2);}
.topbar-search input{background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.78rem;width:160px;}
.topbar-search input::placeholder{color:rgba(255,255,255,.2);}
.topbar-search svg{color:rgba(255,255,255,.2);}
.topbar-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:all .2s;position:relative;}
.topbar-icon:hover{background:rgba(255,255,255,.06);}
.topbar-icon svg{color:rgba(255,255,255,.4);}
.topbar-notif{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#fd1c00;border:1.5px solid #050008;}
.topbar-credits{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,rgba(255,29,0,.08),rgba(253,28,0,.04));border:1px solid rgba(255,29,0,.15);font-size:.74rem;font-weight:600;color:#ff1d00;cursor:pointer;transition:all .2s;}
.topbar-credits span{font-weight:800;font-size:.82rem;color:#fff;}
.topbar-credits:hover{background:linear-gradient(135deg,rgba(250,160,0,.12),rgba(253,28,0,.06));border-color:rgba(250,160,0,.25);}
.main-content{flex:1;overflow-y:auto;padding:28px 32px;position:relative;}
.main-content::-webkit-scrollbar{width:4px}.main-content::-webkit-scrollbar-thumb{background:rgba(253,28,0,.1);border-radius:4px;}

.page-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px;}
.page-icon{width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,rgba(253,28,0,.08),rgba(250,160,0,.04));border:1px solid rgba(253,28,0,.1);display:flex;align-items:center;justify-content:center;}
.page-icon svg{color:rgba(253,28,0,.4);}
.page-label{font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.8);}
.page-sub{font-size:.76rem;color:rgba(255,255,255,.25);text-align:center;max-width:300px;}

/* ═══ MY PROFILE ═══ */
.mp{display:flex;flex-direction:column;gap:20px;animation:mpIn .5s ease both;}
@keyframes mpIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.mp-hero-row{display:flex;align-items:center;gap:24px;}
.mp-hero{flex:1;display:flex;align-items:center;padding:16px 24px;border-radius:16px;background:linear-gradient(to right,#fd1c00 0%,#ff4e50 50%,#EEA727 100%);position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(253,28,0,.12),0 2px 8px rgba(238,167,39,.1);}
.mp-hero::before{content:'';position:absolute;top:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(255,255,255,.08),transparent 55%);pointer-events:none;}
.mp-avatar-wrap{flex-shrink:0;position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;}
.mp-avatar-wrap-ring{position:absolute;width:125px;height:125px;background:linear-gradient(to right,#fd1c00,#ff4e50,#EEA727);border-radius:50% 50% 50% 50%/60% 40% 60% 40%;z-index:1;animation:blobMorph 8s ease-in-out infinite,blobSpin 12s linear infinite;box-shadow:0 0 25px rgba(253,28,0,.3),0 0 50px rgba(238,167,39,.15),0 0 80px rgba(253,28,0,.06);border:2px solid rgba(255,255,255,.7);outline:2px solid rgba(255,255,255,.15);outline-offset:4px;}
@keyframes blobMorph{0%,100%{border-radius:50% 50% 50% 50%/60% 40% 60% 40%;transform:rotate(0deg) scale(1)}20%{border-radius:40% 60% 60% 40%/50% 50% 60% 50%;transform:rotate(8deg) scale(1.03)}40%{border-radius:55% 45% 38% 62%/45% 55% 50% 50%;transform:rotate(-5deg) scale(.97)}60%{border-radius:50% 40% 50% 60%/40% 60% 40% 60%;transform:rotate(6deg) scale(1.02)}80%{border-radius:60% 50% 40% 50%/60% 40% 50% 50%;transform:rotate(-3deg) scale(.98)}}
@keyframes blobSpin{0%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(15deg)}100%{filter:hue-rotate(0deg)}}
@keyframes blobMorph2{0%,100%{border-radius:60% 40% 50% 50%/50% 60% 40% 50%;transform:rotate(0deg) scale(1)}25%{border-radius:50% 50% 40% 60%/60% 40% 50% 50%;transform:rotate(-6deg) scale(1.02)}50%{border-radius:40% 60% 55% 45%/50% 50% 45% 55%;transform:rotate(4deg) scale(.98)}75%{border-radius:55% 45% 50% 50%/40% 60% 55% 45%;transform:rotate(-3deg) scale(1.01)}}
.mp-avatar-wrap-ring2{position:absolute;width:115px;height:115px;background:linear-gradient(to left,#EEA727,#ff4e50,#fd1c00);border-radius:60% 40% 50% 50%/50% 60% 40% 50%;z-index:2;animation:blobMorph2 7s ease-in-out infinite;opacity:.5;filter:blur(1px);}
.mp-avatar{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#fd1c00,#EEA727);border:none;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#fd1c00;overflow:hidden;position:relative;z-index:3;margin-top:-2px;}
.mp-avatar-img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;}
.mp-float-badge{position:absolute;z-index:5;border-radius:12px;padding:3px 8px;box-shadow:0 3px 12px rgba(0,0,0,.4);font-size:.5rem;font-weight:700;backdrop-filter:blur(12px);white-space:nowrap;letter-spacing:.3px;}
.mp-fb-1{top:-14px;left:-10px;background:rgba(139,92,246,.9);color:#fff;border:1px solid rgba(139,92,246,1);animation:fbFloat 4s ease-in-out infinite;}
.mp-fb-2{bottom:-14px;left:10px;background:rgba(34,211,238,.85);color:#fff;border:1px solid rgba(34,211,238,.9);animation:fbFloat 4s ease-in-out infinite 1s;}
.mp-fb-3{top:50%;right:-40px;background:rgba(16,185,129,.85);color:#fff;border:1px solid rgba(16,185,129,.9);animation:fbFloat 4s ease-in-out infinite 2s;} 
@keyframes fbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.mp-hero-info{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:12px;}
.mp-hero-left{flex:1;min-width:200px;}
.mp-hero-right{display:flex;gap:8px;flex-shrink:0;}
.mp-hero-name{font-size:1.14rem;font-weight:800;color:#fff;margin-bottom:0;padding-bottom:0;line-height:1.2;font-family:'Astro',sans-serif;letter-spacing:1.5px;text-transform:uppercase;}
.mp-hero-roll{font-size:.72rem;color:#000;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:16px;margin-top:3px;line-height:1;}
.mp-hero-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:0;padding-bottom:0;}
.mp-badge{padding:4px 10px;border-radius:14px;font-size:.55rem;font-weight:700;letter-spacing:.5px;display:inline-flex;align-items:center;gap:4px;transition:transform .2s;}
.mp-hero-details{display:flex;flex-direction:column;gap:6px;}
.mp-hd{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:8px;background:rgba(255,255,255,.08);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);transition:all .25s;}
.mp-hd:hover{background:rgba(255,255,255,.12);}
.mp-hd-ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mp-hd-lb{font-size:.5rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:2px;}
.mp-hd-val{font-size:.76rem;font-weight:800;color:#fff;}

/* Tabs */
.mp-tabs{display:flex;gap:4px;padding:4px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);overflow-x:auto;-webkit-overflow-scrolling:touch;}
.mp-tabs::-webkit-scrollbar{display:none;}
.mp-tab{display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);color:rgba(255,255,255,.4);font-size:.76rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .25s;white-space:nowrap;flex:1;justify-content:center;}
.mp-tab:hover{color:rgba(255,255,255,.65);background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);}
.mp-tab-active{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(250,160,0,.08))!important;color:#fff!important;box-shadow:0 2px 12px rgba(253,28,0,.1);border-color:rgba(253,28,0,.2)!important;}
.mp-tab-active svg{color:#fd1c00!important;}
.mp-tab-content{display:flex;flex-direction:column;gap:16px;animation:mpIn .4s ease both;}

.mp-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.mp-full{grid-column:1/-1;}
.mp-card{padding:22px;border-radius:16px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);transition:border-color .3s;}
.mp-card:hover{border-color:rgba(255,255,255,.1);}
.mp-card-title{font-size:.8rem;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.mp-card-count{font-size:.55rem;color:rgba(255,255,255,.25);font-weight:500;margin-left:auto;}
.mp-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.mp-stats-3{grid-template-columns:repeat(3,1fr)!important;}
.mp-stats-4{grid-template-columns:repeat(4,1fr)!important;}
.mp-stat-card{display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-stat-card:hover{border-color:rgba(255,255,255,.1);}
.mp-stat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid;}
.mp-stat-info{min-width:0;}
.mp-stat-label{font-size:.52rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;font-weight:600;}
.mp-stat-value{font-size:.85rem;color:rgba(255,255,255,.9);font-weight:700;}
.mp-sub-section{margin-top:16px;}
.mp-sub-title{font-size:.58rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:8px;}
.mp-prog-row{display:flex;align-items:center;gap:12px;padding:6px 0;}
.mp-prog-lb{font-size:.7rem;color:rgba(255,255,255,.45);width:90px;flex-shrink:0;font-weight:500;}
.mp-prog-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;}
.mp-prog-fill{height:100%;border-radius:3px;}
.mp-prog-val{font-size:.7rem;color:rgba(255,255,255,.6);font-weight:600;width:50px;text-align:right;}

/* Coding */
.mp-coding-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mp-coding-item{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-coding-item:hover{border-color:rgba(255,255,255,.1);}
.mp-coding-left{display:flex;align-items:center;gap:10px;}
.mp-coding-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.mp-coding-name{display:block;font-size:.76rem;color:rgba(255,255,255,.65);font-weight:600;}
.mp-coding-sub{display:block;font-size:.6rem;color:rgba(255,255,255,.25);margin-top:1px;}
.mp-coding-score{font-size:.8rem;font-weight:700;}

/* Platform link */
.mp-profile-link{margin-left:auto;font-size:.65rem;color:rgba(255,255,255,.3);text-decoration:none;font-weight:500;transition:color .2s;}
.mp-profile-link:hover{color:#fd1c00;}
.mp-platform-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}

/* Difficulty chips */
.mp-difficulty-row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.mp-diff-chip{display:flex;flex-direction:column;align-items:center;padding:10px 16px;border-radius:10px;border:1px solid;flex:1;min-width:60px;}
.mp-diff-label{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:3px;}
.mp-diff-val{font-size:1.1rem;font-weight:800;}

/* HackerRank stars */
.mp-hr-stars{display:flex;flex-direction:column;gap:8px;}
.mp-hr-star-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;}
.mp-hr-lang{font-size:.72rem;color:rgba(255,255,255,.5);font-weight:500;width:120px;}
.mp-hr-stars-visual{display:flex;gap:3px;}

/* Language bars */
.mp-lang-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.mp-lang-name{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.07em;width:60px;flex-shrink:0;}
.mp-lang-bar-track{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-lang-bar-fill{height:100%;border-radius:3px;}
.mp-lang-count{font-size:.72rem;font-weight:700;color:#fff;background:rgba(255,255,255,.07);padding:1px 7px;border-radius:4px;min-width:36px;text-align:center;}

/* Personal info grid */
.mp-info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.mp-info-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);}
.mp-info-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid;}
.mp-info-content{min-width:0;overflow:hidden;}
.mp-info-label{font-size:.5rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;font-weight:600;}
.mp-info-value{font-size:.76rem;color:rgba(255,255,255,.8);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* Empty/violation/cert */
.mp-empty-section{display:flex;align-items:center;gap:10px;padding:16px 0;color:rgba(255,255,255,.25);font-size:.78rem;}
.mp-violation-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.1);font-size:.76rem;color:rgba(255,255,255,.65);margin-bottom:6px;}

/* Attendance */
.mp-att-list{display:flex;flex-direction:column;gap:12px;}
.mp-att-item{padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:border-color .2s;}
.mp-att-item:hover{border-color:rgba(255,255,255,.1);}
.mp-att-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;}
.mp-att-course{font-size:.82rem;font-weight:700;color:rgba(255,255,255,.85);}
.mp-att-batch{font-size:.62rem;color:rgba(255,255,255,.3);margin-top:2px;}
.mp-att-pct{font-size:1rem;font-weight:800;}
.mp-att-bar-track{height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-att-bar-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.mp-att-bottom{display:flex;gap:16px;margin-top:8px;font-size:.62rem;color:rgba(255,255,255,.25);}

/* Cert grid */
.mp-cert-grid{display:flex;flex-direction:column;gap:8px;}
.mp-cert-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-cert-item:hover{border-color:rgba(16,185,129,.2);}
.mp-cert-logo-wrap{width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
.mp-cert-logo{width:28px;height:28px;object-fit:contain;}
.mp-cert-info{flex:1;min-width:0;}
.mp-cert-name{font-size:.76rem;font-weight:600;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mp-cert-id{font-size:.58rem;color:rgba(255,255,255,.25);margin-top:2px;}
.mp-cert-view{width:32px;height:32px;border-radius:8px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;color:#10b981;text-decoration:none;flex-shrink:0;transition:all .2s;}
.mp-cert-view:hover{background:rgba(16,185,129,.15);}

/* Attendance Grid */
.mp-att-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.mp-att-card{padding:14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-att-card:hover{border-color:rgba(255,255,255,.12);transform:translateY(-1px);}
.mp-att-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px;}
.mp-att-card-name{font-size:.72rem;font-weight:700;color:rgba(255,255,255,.85);line-height:1.3;flex:1;}
.mp-att-card-pct{font-size:.82rem;font-weight:800;flex-shrink:0;}
.mp-att-card-sub{font-size:.56rem;color:rgba(255,255,255,.25);margin-bottom:8px;}
.mp-att-card-bar{height:4px;border-radius:2px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-att-card-fill{height:100%;border-radius:2px;}
.mp-att-card-nums{display:flex;gap:8px;margin-top:8px;font-size:.55rem;color:rgba(255,255,255,.2);}
.mp-att-card-nums span span{font-weight:700;}

/* Courses Grid */
.mp-courses-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.mp-course-card{display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-course-card:hover{border-color:rgba(34,211,238,.15);}
.mp-course-num{width:26px;height:26px;border-radius:7px;background:rgba(34,211,238,.06);border:1px solid rgba(34,211,238,.12);display:flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:800;color:#22d3ee;flex-shrink:0;}
.mp-course-info{min-width:0;overflow:hidden;}
.mp-course-tech{font-size:.7rem;font-weight:700;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mp-course-name{font-size:.55rem;color:rgba(255,255,255,.25);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* Assess grid */
.mp-assess-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}

/* Video ratings */
.mp-vr-row{display:flex;align-items:center;gap:10px;padding:8px 0;}
.mp-vr-name{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.45);width:80px;flex-shrink:0;}
.mp-vr-bar{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-vr-fill{height:100%;border-radius:3px;}
.mp-vr-score{font-size:.76rem;font-weight:700;width:45px;text-align:right;flex-shrink:0;}

/* Lists */
.mp-list-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:6px;transition:all .2s;}
.mp-list-item:hover{border-color:rgba(255,255,255,.1);}
.mp-list-num{min-width:42px;height:24px;padding:0 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.5rem;font-weight:700;flex-shrink:0;letter-spacing:.5px;border:1px solid;}
.mp-list-text{font-size:.74rem;color:rgba(255,255,255,.7);font-weight:500;flex:1;}

/* Payments */
.mp-pay-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.mp-pay-item{padding:16px 10px;border-radius:12px;text-align:center;border:1px solid;transition:all .2s;}
.mp-pay-item.paid{background:rgba(74,222,128,.04);border-color:rgba(74,222,128,.14);}
.mp-pay-item.unpaid{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.06);}
.mp-pay-lb{font-size:.52rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px;}
.mp-pay-st{font-size:.76rem;font-weight:700;}
.mp-pay-item.paid .mp-pay-st{color:#4ade80;}
.mp-pay-item.unpaid .mp-pay-st{color:rgba(255,255,255,.2);}

/* Loading */
.mp-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:16px;}
.mp-loading-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.06);border-top-color:#fd1c00;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ═══ TEAM PROFILE ═══ */
.tp{display:flex;flex-direction:column;gap:24px;animation:mpIn .5s ease both;}
.tp-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px;border-radius:18px;background:linear-gradient(135deg,hsla(7,94%,59%,1) 0%,hsla(7,98%,46%,1) 48%,hsla(30,92%,66%,1) 100%);position:relative;overflow:hidden;box-shadow:0 6px 30px rgba(232,29,2,.1);}
.tp-header::before{content:'';position:absolute;top:-60px;right:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(255,255,255,.08),transparent 55%);pointer-events:none;}
.tp-header-left{display:flex;align-items:center;gap:16px;}
.tp-team-badge{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,.15);backdrop-filter:blur(12px);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:800;color:#fff;letter-spacing:1px;}
.tp-team-title{font-size:1.15rem;font-weight:800;color:#fff;}
.tp-team-sub{font-size:.7rem;color:rgba(255,255,255,.7);margin-top:2px;}
.tp-header-right{display:flex;gap:20px;}
.tp-header-stat{text-align:center;}
.tp-header-stat-val{font-size:1.2rem;font-weight:800;color:#fff;}
.tp-header-stat-lb{font-size:.48rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-top:2px;}
.tp-members-header{display:flex;align-items:center;justify-content:space-between;}
.tp-members-count{font-size:1.1rem;font-weight:800;color:rgba(255,255,255,.85);}
.tp-members-count span{color:#ff1d00;font-size:1.3rem;}
.tp-cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
@keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.tp-card{padding:22px 20px 18px;border-radius:16px;background:rgba(12,8,18,.45);border:1px solid rgba(255,255,255,.06);transition:all .25s;animation:cardIn .4s ease both;}
.tp-card:hover{border-color:rgba(255,255,255,.12);transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,.15);}
.tp-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
.tp-card-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,rgba(255,29,0,.15),rgba(250,160,0,.08));border:2px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:#ff1d00;position:relative;}
.tp-card-online{position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#4ade80;border:2px solid #0c0616;}
.tp-card-name{font-size:.88rem;font-weight:700;color:#fff;margin-bottom:2px;}
.tp-card-role{font-size:.66rem;color:rgba(255,255,255,.4);margin-bottom:14px;}
.tp-card-details{padding:12px 0;border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);}
.tp-card-detail-row{display:flex;gap:16px;}
.tp-card-detail{flex:1;}
.tp-card-detail-lb{font-size:.48rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:2px;}
.tp-card-detail-val{font-size:.76rem;color:rgba(255,255,255,.75);font-weight:600;}
.tp-card-contact{padding-top:12px;display:flex;flex-direction:column;gap:6px;}
.tp-card-contact-row{display:flex;align-items:center;gap:8px;font-size:.68rem;color:rgba(255,255,255,.45);}
.tp-card-contact-row svg{color:#ff1d00;flex-shrink:0;}
.tp-card-contact-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tp-tag{padding:3px 10px;border-radius:6px;font-size:.5rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.tp-tag-leader{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.15);color:#fd1c00;}
.tp-tag-you{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.15);color:#4ade80;}

/* Mobile */
.mob-overlay{position:fixed;inset:0;background:rgba(5,0,8,.85);z-index:99;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.mob-sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:100;animation:slideIn .3s cubic-bezier(.22,1,.36,1);box-shadow:4px 0 30px rgba(0,0,0,.5);background:#0c0616!important}
@keyframes slideIn{from{transform:translateX(-100%)}to{transform:none}}
.mob-menu-btn{width:40px;height:40px;border-radius:10px;background:rgba(253,28,0,.1);border:1px solid rgba(253,28,0,.2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fd1c00;transition:all .2s;-webkit-tap-highlight-color:transparent}
.mob-menu-btn:active{background:rgba(253,28,0,.2);transform:scale(.95)}

@media(max-width:900px){
  .mp-hero-row{flex-direction:column;align-items:center;gap:0;}
  .mp-hero{flex-direction:column;align-items:center;text-align:center;padding:18px 16px;width:100%;}
  .mp-avatar-wrap{margin-bottom:-20px;z-index:2;}
  .mp-hero-info{flex-direction:column;}
  .mp-hero-left{min-width:unset;width:100%;}
  .mp-hero-right{flex-wrap:wrap;justify-content:center;margin-top:8px;}
  .mp-hero-tags{justify-content:center;}
  .mp-hero-roll{justify-content:center;}
  .mp-hero-details{grid-template-columns:1fr 1fr;}
  .mp-hero-tags{justify-content:center;}
  .mp-hero-roll{justify-content:center;}
  .mp-grid{grid-template-columns:1fr;}
  .mp-stats-grid,.mp-coding-grid{grid-template-columns:1fr 1fr;}
  .mp-pay-grid{grid-template-columns:1fr 1fr 1fr;}
  .mp-info-grid{grid-template-columns:1fr 1fr;}
  .mp-att-grid{grid-template-columns:1fr 1fr;}
  .mp-courses-grid{grid-template-columns:1fr 1fr;}
  .mp-stats-3{grid-template-columns:repeat(3,1fr)!important;}
  .mp-stats-4{grid-template-columns:repeat(2,1fr)!important;}
  .mp-difficulty-row{flex-wrap:wrap;}
  .mp-diff-chip{min-width:55px;padding:8px 10px;}
  .mp-assess-grid{grid-template-columns:1fr 1fr;}
  .tp-header{flex-direction:column;align-items:flex-start;gap:16px;}
  .tp-cards-grid{grid-template-columns:1fr 1fr;}
}
@media(max-width:768px){
  .sidebar:not(.mob-sidebar){display:none!important}
  .mob-sidebar{display:flex!important}
  .topbar{padding:14px 16px;}
  .topbar-search{display:none;}
  .topbar-title{font-size:.9rem;}
  .main-content{padding:16px 12px;}
  .mp-hero{padding:22px 18px;padding-top:60px;gap:18px;margin-top:45px;}
  .mp-avatar-wrap{width:100px;height:100px;}.mp-avatar-wrap-ring{width:100px;height:100px;}.mp-avatar{width:88px;height:88px;font-size:1.5rem;}.mp-float-badge{font-size:.48rem;padding:3px 7px;}.mp-fb-3{display:none;}
  .mp-avatar-img{width:80px;height:80px;border-radius:50%;}
  .mp-avatar-wrap{top:-42px;left:50%;transform:translateX(-50%);}
  .mp-hero-name{font-size:1.05rem;}
  .mp-hero-roll{font-size:.68rem;}
  .mp-hero-details{grid-template-columns:1fr;}
  .mp-hero-tags{gap:5px;}
  .mp-hero-tags .mp-badge{padding:4px 10px;font-size:.55rem;}
  .mp-hd{padding:8px 10px;}
  .mp-hd-ic{width:30px;height:30px;}
  .mp-hd-val{font-size:.76rem;}
  .mp-pay-grid{grid-template-columns:repeat(3,1fr);}
  .tp-cards-grid{grid-template-columns:1fr;}
  .mp-info-grid{grid-template-columns:1fr 1fr;}
  .mp-info-item{padding:8px 10px;}
  .mp-info-icon{width:28px;height:28px;}
  .mp-info-value{font-size:.7rem;}
  .mp-stats-grid{grid-template-columns:1fr 1fr;}
  .mp-stats-3,.mp-stats-4{grid-template-columns:1fr 1fr!important;}
  .mp-coding-grid{grid-template-columns:1fr!important;}
  .mp-tabs{padding:3px;gap:2px;}
  .mp-tab{padding:8px 12px;font-size:.68rem;gap:5px;}
  .mp-assess-grid{grid-template-columns:1fr!important;}
  .mp-att-grid{grid-template-columns:1fr 1fr!important;}
  .mp-courses-grid{grid-template-columns:1fr 1fr!important;}
  .mp-card{padding:16px;border-radius:14px;}
  .mp-card-title{font-size:.76rem;margin-bottom:12px;}
  .mp-stat-card{padding:10px;gap:8px;}
  .mp-stat-icon{width:30px;height:30px;}
  .mp-stat-label{font-size:.48rem;}
  .mp-stat-value{font-size:.78rem;}
  .mp-hr-lang{width:80px;font-size:.65rem;}
  .mp-lang-name{width:45px;font-size:.58rem;}
  .mp-diff-chip{padding:7px 8px;min-width:50px;}
  .mp-diff-label{font-size:.48rem;}
  .mp-diff-val{font-size:.9rem;}
  .mp-att-card{padding:12px;}
  .mp-att-card-name{font-size:.66rem;}
  .mp-att-card-pct{font-size:.76rem;}
  .mp-att-card-nums{font-size:.5rem;gap:6px;}
  .mp-course-card{padding:10px;gap:8px;}
  .mp-course-num{width:22px;height:22px;font-size:.5rem;}
  .mp-course-tech{font-size:.64rem;}
}
@media(max-width:480px){
  .main-content{padding:12px 10px;}
  .mp-hero{padding:14px 12px;}
  .mp-avatar-wrap{width:86px;height:86px;}.mp-avatar-wrap-ring{width:86px;height:86px;}.mp-avatar{width:74px;height:74px;font-size:1.2rem;}.mp-float-badge{display:none;}
  .mp-hero-name{font-size:.9rem;letter-spacing:.5px;}
  .mp-hero-name{font-size:.95rem;}
  .mp-hero-details{grid-template-columns:1fr;}
  .mp-pay-grid{grid-template-columns:1fr 1fr;}
  .mp-stats-grid{grid-template-columns:1fr!important;}
  .mp-stats-3,.mp-stats-4{grid-template-columns:1fr!important;}
  .mp-info-grid{grid-template-columns:1fr!important;}
  .mp-att-grid{grid-template-columns:1fr!important;}
  .mp-courses-grid{grid-template-columns:1fr 1fr!important;}
  .mp-assess-grid{grid-template-columns:1fr!important;}
  .topbar-credits{display:none;}
  .mp-tab span{display:none;}
  .mp-tab{padding:10px 14px;flex:0;justify-content:center;}
  .mp-tabs{justify-content:center;}
  .mp-card{padding:14px;border-radius:12px;}
  .mp-difficulty-row{gap:5px;}
  .mp-diff-chip{min-width:45px;padding:6px 6px;}
  .mp-diff-label{font-size:.45rem;letter-spacing:.5px;}
  .mp-diff-val{font-size:.82rem;}
}
@media(max-width:360px){
  .mp-courses-grid{grid-template-columns:1fr!important;}
  .mp-pay-grid{grid-template-columns:1fr 1fr;}
  .mp-hero{padding:16px 12px;}
  .mp-card{padding:12px;}
}
      `}</style>

      <div className="dash">
        {isMobile && mobileMenuOpen && <div className="mob-overlay" onClick={()=>setMobileMenuOpen(false)}/>}

        {(!isMobile || mobileMenuOpen) && (
        <nav className={`sidebar ${isMobile?'mob-sidebar':''}`} style={isMobile?{width:280,minWidth:280}:{width:collapsed?78:260,minWidth:collapsed?78:260}}>
          <div className="sb-profile" style={{padding:isMobile?"24px 20px 18px":collapsed?"20px 12px 16px":"24px 20px 18px"}}>
            <div className="sb-profile-row" style={{justifyContent:(!isMobile&&collapsed)?"center":"space-between"}}>
              <div className="sb-avatar" style={{width:(!isMobile&&collapsed)?40:48,height:(!isMobile&&collapsed)?40:48,fontSize:(!isMobile&&collapsed)?14:18}}>{displayName.charAt(0)}</div>
              {isMobile?<button className="sb-toggle" onClick={()=>setMobileMenuOpen(false)}><X size={16}/></button>
              :!collapsed&&<button className="sb-toggle" onClick={()=>setCollapsed(true)}><ChevronLeft size={14}/></button>}
            </div>
            {!isMobile&&collapsed&&<div style={{display:"flex",justifyContent:"center",marginTop:10}}><button className="sb-toggle" onClick={()=>setCollapsed(false)}><ChevronRight size={14}/></button></div>}
            {(isMobile||!collapsed)&&<div className="sb-profile-info"><div className="sb-greeting">Good Day</div><div className="sb-name">{displayName}</div><div className="sb-team-tag">{displayTeam} · {profile?.technology||''}</div></div>}
          </div>

          <div className="sb-nav">
            {VISIBLE_NAV_SECTIONS.map(sec=>(
              <div key={sec.title} className="sb-section">
                {(isMobile||!collapsed)&&<div className="sb-section-header">{sec.title}</div>}
                {sec.items.map(item=>(
                  <div key={item.id} className={`sb-item ${active===item.id?"active":""}`}
                    onClick={()=>{setActive(item.id);if(isMobile)setMobileMenuOpen(false)}}
                    onMouseEnter={()=>!isMobile&&collapsed&&setHovered(item.id)} onMouseLeave={()=>setHovered(null)}
                    style={{padding:(!isMobile&&collapsed)?"10px 0":"9px 16px",margin:(!isMobile&&collapsed)?"2px 8px":"2px 10px",justifyContent:(!isMobile&&collapsed)?"center":"flex-start",gap:(!isMobile&&collapsed)?0:12,borderRadius:(!isMobile&&collapsed)?12:10}}>
                    <div className="sb-item-icon"><item.icon size={18}/></div>
                    {(isMobile||!collapsed)&&<span className="sb-item-label">{item.label}</span>}
                    {!isMobile&&collapsed&&hovered===item.id&&<div className="sb-tooltip">{item.label}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="sb-bottom" style={{padding:(!isMobile&&collapsed)?"12px 8px":"14px 14px"}}>
            <div className="sb-bottom-item" style={{padding:(!isMobile&&collapsed)?"8px 0":"8px 10px",justifyContent:(!isMobile&&collapsed)?"center":"flex-start",gap:(!isMobile&&collapsed)?0:10}}><Settings size={18}/>{(isMobile||!collapsed)&&<span className="sb-bottom-label">Settings</span>}</div>
            <div className="sb-bottom-item" onClick={()=>{localStorage.removeItem('ps_user');localStorage.removeItem('ps_session');router.push('/auth/login')}} style={{padding:(!isMobile&&collapsed)?"8px 0":"8px 10px",justifyContent:(!isMobile&&collapsed)?"center":"flex-start",gap:(!isMobile&&collapsed)?0:10}}><LogOut size={18}/>{(isMobile||!collapsed)&&<span className="sb-bottom-label">Logout</span>}</div>
          </div>
        </nav>
        )}

        <div className="content">
          <div className="topbar">
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {isMobile&&<button className="mob-menu-btn" onClick={()=>setMobileMenuOpen(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>}
              <div><div className="topbar-title">{PAGE_TITLES[active]}</div><div className="topbar-breadcrumb">Project Space / {PAGE_TITLES[active]}</div></div>
            </div>
            <div className="topbar-right">
              {!isMobile&&<div className="topbar-search"><Search size={15}/><input placeholder="Search..."/></div>}
              <div className="topbar-icon"><Bell size={17}/><div className="topbar-notif"/></div>
              {!isMobile&&<div className="topbar-credits"><Award size={15}/> <span>20</span> Credits</div>}
            </div>
          </div>
          <div className="main-content">
            {active==="my-profile"?<MyProfile user={user} hootData={hootData} videoRatings={videoRatings} videoLoading={videoLoading}/>:
             active==="team-profile"?<TeamProfile user={user}/>:
             active==="project-details"?<ProjectDetails user={user}/>:
             active==="project-status"?<ProjectStatus user={user}/>:(
              <div className="page-placeholder">
                <div className="page-icon">{activeItem&&<activeItem.icon size={36}/>}</div>
                <div className="page-label">{PAGE_TITLES[active]}</div>
                <div className="page-sub">This section is ready to be built.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}