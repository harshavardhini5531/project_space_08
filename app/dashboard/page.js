'use client'
import { useState, useEffect } from "react";
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
  AlertCircle, Send, X, Clock, MessageSquare, Zap, ChevronDown
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

/* ═══ MY PROFILE ═══ */
function MyProfile({ profile, loading, videoRatings, videoLoading, mayaCoding, mayaLoading, hootData, codingLevel, problemsData }){
  if (loading) return <div style={{color:'rgba(255,255,255,.3)',textAlign:'center',padding:'60px 0'}}>Loading profile...</div>;
  if (!profile) return <div style={{color:'rgba(255,255,255,.4)',textAlign:'center',padding:'60px 0',fontSize:'.85rem'}}>Profile not found. Check if your roll number exists in the student database.</div>;
  const s = profile;
  const certs = s.certifications || [];
  const semesters = [s.sem1, s.sem2, s.sem3, s.sem4, s.sem5].filter(Boolean);
  const badgePct = parseFloat(s.badge_test_pct) || 0;

  return(
    <div className="mp">
      <div className="mp-hero">
        <div className="mp-avatar-wrap">{s.image_url?<img className="mp-avatar-img" src={s.image_url} alt={s.name} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>:null}<div className="mp-avatar" style={s.image_url?{display:'none'}:{}}>{(s.name||'?').charAt(0)}</div></div>
        <div className="mp-hero-info">
          <div className="mp-hero-name">{s.name}</div>
          <div className="mp-hero-roll"><Hash size={12}/> {s.roll_number} · {s.branch} · {s.college}</div>
          <div className="mp-hero-tags">
            <span className="mp-badge" style={{background:"rgba(255,255,255,.92)",border:"none",color:"#b91c1c",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>{s.technology}</span>
            {s.pool && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.pool}</span>}
            {s.seat_type && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.seat_type}</span>}
            {s.scholar_type && <span className="mp-badge" style={{background:"rgba(255,255,255,.18)",border:"none",color:"#fff",boxShadow:"inset 0 0 0 1px rgba(255,255,255,.2)"}}>{s.scholar_type}</span>}
          </div>
          <div className="mp-hero-details">
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#1abc9c",borderRadius:10,boxShadow:"0 4px 14px rgba(26,188,156,.35)"}}><Phone size={15} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>Mobile</div><div className="mp-hd-val">{s.mobile||'—'}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#3498db",borderRadius:10,boxShadow:"0 4px 14px rgba(52,152,219,.35)"}}><GraduationCap size={15} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>Entrance</div><div className="mp-hd-val">{s.entrance_type||'—'} {s.rank ? `· #${s.rank}` : ''}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{background:"#f1c40f",borderRadius:10,boxShadow:"0 4px 14px rgba(241,196,15,.35)"}}><Target size={15} style={{color:"#fff"}}/></div>
              <div><div className="mp-hd-lb" style={{color:"rgba(255,255,255,.55)"}}>T-Hub Attendance</div><div className="mp-hd-val">{s.thub_attendance||0}%</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mp-grid">
        <div className="mp-card">
          <div className="mp-card-title"><GraduationCap size={16} style={{color:"#3b82f6"}}/> Academic Performance</div>
          <div className="mp-stats-grid">
            <StatCard icon={BookOpen} label="B.Tech %" value={s.btech_pct ? `${s.btech_pct}%` : '—'} color="#3b82f6"/>
            <StatCard icon={Award} label="CGPA" value={s.btech_cgpa||'—'} color="#8b5cf6"/>
            <StatCard icon={Target} label="Attendance" value={`${s.thub_attendance||0}%`} color="#4ade80"/>
            <StatCard icon={XCircle} label="Backlogs" value={s.backlogs||0} color={s.backlogs>0?"#ef4444":"#4ade80"}/>
          </div>
          <div className="mp-sub-section">
            <div className="mp-sub-title">Badge Test</div>
            <div className="mp-prog-row">
              <span className="mp-prog-lb">Score</span>
              <div className="mp-prog-bar"><div className="mp-prog-fill" style={{width:`${badgePct}%`,background:s.badge_test_status==="Pass"?"linear-gradient(90deg,#4ade80,#22c55e)":"linear-gradient(90deg,#ef4444,#f97316)"}}/></div>
              <span className="mp-prog-val">{s.badge_test_pct||0}%</span>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}><Badge text={s.badge_test_status||'—'} variant={s.badge_test_status==="Pass"?"success":"fail"}/></div>
          </div>
        </div>

        <div className="mp-card">
          <div className="mp-card-title"><Code size={16} style={{color:"#06b6d4"}}/> Coding Profiles</div>
          <div className="mp-coding-grid">
            {[["LeetCode",s.leetcode],["GeeksForGeeks",s.geeksforgeeks],["CodeChef",s.codechef],["HackerRank",s.hackerrank_stars?`${s.hackerrank_stars}★`:0]].map(([n,v])=>(
              <div key={n} className="mp-coding-item"><div className="mp-coding-left"><Code size={14} style={{color:"rgba(255,255,255,.3)"}}/><span className="mp-coding-name">{n}</span></div><span className="mp-coding-score" style={{color:"#22d3ee"}}>{v||"—"}</span></div>
            ))}
          </div>
          {/* Maya Coding Profile */}
          <div className="mp-sub-section" style={{marginTop:16}}>
            <div className="mp-sub-title">Maya Coding Profile</div>
            {(s.maya_total > 0) ? (
              <>
                <div className="mp-maya-grid">
                  {[
                    {lang:'C',count:s.maya_c||0,color:'#3b82f6',icon:'🔷'},
                    {lang:'C++',count:s.maya_cpp||0,color:'#8b5cf6',icon:'🟣'},
                    {lang:'Java',count:s.maya_java||0,color:'#ef4444',icon:'🔴'},
                    {lang:'Python',count:s.maya_python||0,color:'#10b981',icon:'🟢'},
                  ].map(({lang,count,color,icon})=>(
                    <div key={lang} className="mp-maya-item" style={{borderColor:`${color}20`}}>
                      <div className="mp-maya-icon" style={{background:`${color}12`,color}}>{icon}</div>
                      <div className="mp-maya-info">
                        <div className="mp-maya-lang">{lang}</div>
                        <div className="mp-maya-count" style={{color}}>{count}</div>
                      </div>
                      <div className="mp-maya-label">programs</div>
                    </div>
                  ))}
                </div>
                <div className="mp-maya-total">
                  <span>Total Programs: <strong style={{color:'#22d3ee'}}>{s.maya_total||0}</strong></span>
                  <span style={{color:'rgba(255,255,255,.25)'}}>·</span>
                  <span>Active Days: <strong style={{color:'#4ade80'}}>{s.maya_active_days||0}</strong></span>
                </div>
              </>
            ) : (
              <div style={{color:'rgba(255,255,255,.2)',fontSize:'.72rem',padding:'8px 0'}}>No Maya data available</div>
            )}
          </div>
        </div>

        {/* Communication — Self-Intro Video Ratings */}
        <div className="mp-card">
          <div className="mp-card-title"><MessageSquare size={16} style={{color:"#f59e0b"}}/> Communication</div>
          <div className="mp-sub-title" style={{marginBottom:12}}>Self-Introduction Video Ratings</div>
          {videoRatings ? (
            <div className="mp-video-ratings">
              {[
                {name:'Gemini AI',data:videoRatings.gemini,color:'#4285F4',logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Google_Bard_logo.svg/1200px-Google_Bard_logo.svg.png'},
                {name:'ChatGPT',data:videoRatings.chatgpt,color:'#10a37f',logo:'https://socialmarketing90.com/wp-content/uploads/2023/12/OpenAI-Insta-Version-SVG-8.svg'},
                {name:'Claude AI',data:videoRatings.claude,color:'#cc785c',logo:'https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg'},
                {name:'Mentor',data:videoRatings.mentor,color:'#f59e0b',logo:'https://cdn-icons-png.flaticon.com/512/9187/9187532.png'},
              ].map(({name,data,color,logo})=>(
                <div key={name} className="mp-vr-row">
                  <div className="mp-vr-logo" style={{borderColor:`${color}25`}}>
                    <img src={logo} alt={name} style={{width:18,height:18,objectFit:'contain',filter:data?.overall?'none':'grayscale(1) brightness(2) opacity(0.3)'}}/>
                  </div>
                  <span className="mp-vr-name">{name}</span>
                  <div className="mp-prog-bar" style={{flex:1}}>
                    <div className="mp-prog-fill" style={{width:`${((data?.overall||0)/10)*100}%`,background:`linear-gradient(90deg,${color},${color}88)`}}/>
                  </div>
                  <span className="mp-vr-score" style={{color:data?.overall?color:'rgba(255,255,255,.15)'}}>{data?.overall ? `${data.overall}/10` : '—'}</span>
                </div>
              ))}
              {(videoRatings.gemini?.level || videoRatings.chatgpt?.level || videoRatings.claude?.level) && (
                <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
                  {videoRatings.gemini?.level && <Badge text={`Gemini: ${videoRatings.gemini.level}`} color="#4285F4"/>}
                  {videoRatings.chatgpt?.level && <Badge text={`GPT: ${videoRatings.chatgpt.level}`} color="#10a37f"/>}
                  {videoRatings.claude?.level && <Badge text={`Claude: ${videoRatings.claude.level}`} color="#cc785c"/>}
                  {videoRatings.mentor?.level && <Badge text={`Mentor: ${videoRatings.mentor.level}`} color="#f59e0b"/>}
                  {videoRatings.gemini?.readiness && <Badge text={`${videoRatings.gemini.readiness}% Interview Ready`} color="#4ade80" variant="success"/>}
                </div>
              )}
            </div>
          ) : (
            <div style={{color:'rgba(255,255,255,.2)',fontSize:'.72rem',padding:'12px 0'}}>{videoLoading ? 'Loading ratings...' : 'No video ratings available'}</div>
          )}
        </div>

        <div className="mp-card">
          <div className="mp-card-title"><Shield size={16} style={{color:"#10b981"}}/> Certifications <span className="mp-card-count">{s.cert_count||0}</span></div>
          {certs.length > 0 ? certs.map((c,i)=>(<div key={i} className="mp-list-item"><div className="mp-list-num" style={{background:"rgba(16,185,129,.06)",borderColor:"rgba(16,185,129,.12)",color:"#10b981"}}>{i+1}</div><div className="mp-list-text">{c}</div><CheckCircle size={15} style={{color:"#4ade80",flexShrink:0}}/></div>))
          : <div style={{color:'rgba(255,255,255,.2)',fontSize:'.76rem',padding:'12px 0'}}>No certifications yet</div>}
        </div>

        <div className="mp-card">
          <div className="mp-card-title"><Layers size={16} style={{color:"#8b5cf6"}}/> T-Hub Courses <span className="mp-card-count">{semesters.length}</span></div>
          {semesters.length > 0 ? semesters.map((c,i)=>(<div key={i} className="mp-list-item"><div className="mp-list-num" style={{background:"rgba(139,92,246,.06)",borderColor:"rgba(139,92,246,.12)",color:"#8b5cf6"}}>SEM-{i+1}</div><div className="mp-list-text">{c}</div></div>))
          : <div style={{color:'rgba(255,255,255,.2)',fontSize:'.76rem',padding:'12px 0'}}>No courses recorded</div>}
        </div>

        <div className="mp-card mp-full">
          <div className="mp-card-title"><CreditCard size={16} style={{color:"#4ade80"}}/> Payment Status</div>
          <div className="mp-pay-grid">{["payment_term1","payment_term2","payment_term3","payment_term4","payment_term5"].map((t,i)=>{const p=s[t]==="Paid";return(<div key={t} className={`mp-pay-item ${p?"paid":"unpaid"}`}><div className="mp-pay-lb">Term {i+1}</div><div className="mp-pay-st">{p?"✓ Paid":s[t]||"Pending"}</div></div>)})}</div>
        </div>

        <div className="mp-card mp-full">
          <div className="mp-card-title"><Briefcase size={16} style={{color:"#f59e0b"}}/> Placement / Internship</div>
          <div className="mp-stat-card" style={{maxWidth:320}}><div className="mp-stat-icon" style={{background:"rgba(245,158,11,.08)",borderColor:"rgba(245,158,11,.15)"}}><Briefcase size={16} style={{color:"#f59e0b"}}/></div><div className="mp-stat-info"><div className="mp-stat-label">Status</div><div className="mp-stat-value">{s.placement||"Not yet placed"}</div></div></div>
        </div>

      </div>

      {/* ASSESSMENTS SECTION */}
      <div style={{marginTop:'28px'}}>
  <div style={{marginBottom:'16px'}}>
    <div style={{fontSize:'15px',fontWeight:700,color:'#fff',fontFamily:"'DM Sans',sans-serif"}}>Assessments</div>
    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',fontFamily:"'DM Sans',sans-serif",marginTop:'3px'}}>Communication & coding evaluations</div>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'14px'}}>

    {/* Self Intro Video */}
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
        <div style={{width:'3px',height:'16px',background:'#BDE8F5',borderRadius:'2px'}}/>
        <span style={{fontSize:'11px',fontWeight:700,color:'#BDE8F5',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.06em',textTransform:'uppercase'}}>Self Intro Video</span>
      </div>
      <div style={{width:'100%',aspectRatio:'16/9',background:'rgba(189,232,245,0.04)',border:'1.5px dashed rgba(189,232,245,0.2)',borderRadius:'10px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px'}}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(189,232,245,0.4)" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span style={{fontSize:'11px',color:'rgba(189,232,245,0.35)',fontFamily:"'DM Sans',sans-serif",textAlign:'center',lineHeight:1.5}}>Self introduction video<br/>will appear here</span>
      </div>
      <div style={{display:'flex',justifyContent:'center',marginTop:'12px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'5px',background:'rgba(189,232,245,0.06)',border:'1px solid rgba(189,232,245,0.15)',borderRadius:'20px',padding:'4px 12px'}}>
          <div style={{width:'5px',height:'5px',borderRadius:'50%',background:'#EEA727',boxShadow:'0 0 5px #EEA727'}}/>
          <span style={{fontSize:'10px',color:'rgba(189,232,245,0.6)',fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:'0.05em'}}>PENDING UPLOAD</span>
        </div>
      </div>
    </div>

    {/* HOOT Result */}
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
        <div style={{width:'3px',height:'16px',background:'#EEA727',borderRadius:'2px'}}/>
        <span style={{fontSize:'11px',fontWeight:700,color:'#EEA727',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.06em',textTransform:'uppercase'}}>HOOT — Communication</span>
      </div>
      {!hootData?(
        <div style={{textAlign:'center',padding:'20px 0',color:'rgba(255,255,255,0.25)',fontSize:'12px',fontFamily:"'DM Sans',sans-serif"}}>No assessment data found</div>
      ):(
        <>
          {[['Listening',hootData.listening,'#EEA727'],['Speaking',hootData.speaking,'#fd1c00'],['Reading',hootData.reading,'#10b981'],['Writing',hootData.writing,'#7B2FBE']].map(([label,val,color])=>(
            <div key={label} style={{marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'5px'}}>
                <span style={{fontSize:'12px',color:'#bbb',fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{label}</span>
                <span style={{fontSize:'12px',fontWeight:700,color:color,fontFamily:"'DM Sans',sans-serif"}}>{val?.toFixed(1)}%</span>
              </div>
              <div style={{height:'7px',background:'rgba(255,255,255,0.05)',borderRadius:'4px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${val}%`,background:color,borderRadius:'4px',boxShadow:`0 0 6px ${color}55`}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:'14px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:'#666',fontFamily:"'DM Sans',sans-serif"}}>Overall</span>
            <div style={{background:'rgba(238,167,39,0.1)',border:'1px solid rgba(238,167,39,0.25)',borderRadius:'7px',padding:'3px 10px'}}>
              <span style={{fontSize:'15px',fontWeight:800,color:'#EEA727',fontFamily:"'DM Sans',sans-serif"}}>{hootData.total?.toFixed(1)}<span style={{fontSize:'10px',fontWeight:400,marginLeft:'2px'}}>/100</span></span>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Coding Assessment */}
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
        <div style={{width:'3px',height:'16px',background:'#10b981',borderRadius:'2px'}}/>
        <span style={{fontSize:'11px',fontWeight:700,color:'#10b981',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.06em',textTransform:'uppercase'}}>Coding Assessment</span>
      </div>
      {codingLevel&&(
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',padding:'9px 12px',background:codingLevel==='Advanced'?'rgba(16,185,129,0.08)':'rgba(238,167,39,0.08)',border:`1px solid ${codingLevel==='Advanced'?'rgba(16,185,129,0.25)':'rgba(238,167,39,0.25)'}`,borderRadius:'9px'}}>
          <span style={{fontSize:'16px'}}>{codingLevel==='Advanced'?'◆':'◈'}</span>
          <div>
            <div style={{fontSize:'10px',color:'#666',fontFamily:"'DM Sans',sans-serif",fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Level</div>
            <div style={{fontSize:'15px',fontWeight:800,color:codingLevel==='Advanced'?'#10b981':'#EEA727',fontFamily:"'DM Sans',sans-serif"}}>{codingLevel==='Advanced'?'Advanced':'Level 0'}</div>
          </div>
          {problemsData&&(
            <div style={{marginLeft:'auto',textAlign:'right'}}>
              <div style={{fontSize:'10px',color:'#666',fontFamily:"'DM Sans',sans-serif",fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Solved</div>
              <div style={{fontSize:'15px',fontWeight:800,color:'#fff',fontFamily:"'DM Sans',sans-serif"}}>{Object.values(problemsData).reduce((a,b)=>a+b,0)}</div>
            </div>
          )}
        </div>
      )}
      {!problemsData?(
        <div style={{textAlign:'center',padding:'12px 0',color:'rgba(255,255,255,0.25)',fontSize:'12px',fontFamily:"'DM Sans',sans-serif"}}>No problems data found</div>
      ):(
        <>
          <div style={{fontSize:'10px',color:'#555',fontFamily:"'DM Sans',sans-serif",fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'10px'}}>Problems by Language</div>
          {Object.entries(problemsData).sort(([,a],[,b])=>b-a).map(([lang,count])=>{
            const max=Math.max(...Object.values(problemsData),1);
            const LANGC={c:'#A8B9CC',cpp:'#659AD2',java:'#F89820',python:'#3572A5',sql:'#e38c00'};
            const color=LANGC[lang.toLowerCase()]||'#BDE8F5';
            return(
              <div key={lang} style={{marginBottom:'9px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',fontWeight:600,color:color,fontFamily:"'DM Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.07em'}}>{lang.toUpperCase()}</span>
                  <span style={{fontSize:'12px',fontWeight:700,color:'#fff',fontFamily:"'DM Sans',sans-serif",background:'rgba(255,255,255,0.07)',padding:'1px 7px',borderRadius:'4px'}}>{count}</span>
                </div>
                <div style={{height:'5px',background:'rgba(255,255,255,0.05)',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${(count/max)*100}%`,background:color,borderRadius:'3px',boxShadow:`0 0 5px ${color}55`}}/>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>

  </div>
</div>
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
        {members.map((m,i)=>{
          const isMe = m.roll_number === myRoll;
          const isLeader = m.is_leader;
          return(
          <div key={m.roll_number||i} className="tp-card" style={{animationDelay:`${i*.06}s`,border:isMe?'1px solid rgba(253,28,0,.2)':'1px solid rgba(255,255,255,.06)'}}>
            <div className="tp-card-top">
              <div className="tp-card-avatar" style={isMe?{borderColor:'rgba(253,28,0,.3)',background:'linear-gradient(135deg,rgba(253,28,0,.2),rgba(250,160,0,.1))'}:{}}>{m.image_url?<img src={m.image_url} alt={m.name} style={{width:'100%',height:'100%',borderRadius:'inherit',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/>:null}{(!m.image_url)&&(m.name||'?').charAt(0)}<div className="tp-card-online"/></div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {isLeader && <span className="tp-tag tp-tag-leader">Team Leader</span>}
                {isMe && <span className="tp-tag tp-tag-you">You</span>}
              </div>
            </div>
            <div className="tp-card-name">{m.name}</div>
            <div className="tp-card-role">{isLeader?'Team Leader':'Member'}</div>
            <div className="tp-card-details">
              <div className="tp-card-detail-row">
                <div className="tp-card-detail"><div className="tp-card-detail-lb">Branch</div><div className="tp-card-detail-val">{m.branch||'—'}</div></div>
                <div className="tp-card-detail"><div className="tp-card-detail-lb">Roll No</div><div className="tp-card-detail-val">{m.roll_number}</div></div>
              </div>
            </div>
            <div className="tp-card-contact">
              {m.email && <div className="tp-card-contact-row"><Phone size={12}/><span>{m.email}</span></div>}
              {m.phone && <div className="tp-card-contact-row"><Phone size={12}/><span>{m.phone}</span></div>}
            </div>
          </div>
          );
        })}
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
  const [mayaLoading,setMayaLoading]=useState(false);
  const [hootData,setHootData]=useState(null);
  const [codingLevel,setCodingLevel]=useState(null);
  const [problemsData,setProblemsData]=useState(null);
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
    console.log('Dashboard session:', { roll, name: u.name, role });
    setUser({ ...u, rollNumber: roll, name: u.name || '', role });

    if (roll) {
      // Try API first, then direct Supabase
      fetch('/api/auth/student-profile', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({rollNumber:roll}) })
        .then(r=>r.json())
        .then(d=>{
          console.log('Profile API response:', d);
          if(d.profile) { setProfile(d.profile); setLoading(false); }
          else {
            // Fallback: try direct Supabase query
            import('@supabase/supabase-js').then(({createClient})=>{
              const sb = createClient('https://yiwyfhdzgvlsmdeshdgv.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'');
              sb.from('student_profiles').select('*').eq('roll_number',roll).single()
                .then(({data})=>{ if(data) setProfile(data); else console.log('No profile found for roll:', roll); })
                .finally(()=>setLoading(false));
            });
          }
        })
        .catch(e=>{console.error('Profile fetch error:',e);setLoading(false)});
      // Fetch video ratings from MongoDB
      setVideoLoading(true);
      fetch('/api/auth/video-ratings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({rollNumber:roll}) })
        .then(r=>r.json())
        .then(d=>{ if(d.ratings) setVideoRatings(d.ratings); })
        .catch(e=>console.error('Video ratings error:',e))
        .finally(()=>setVideoLoading(false));

      // Fetch HOOT assessment
      supabase.from('hoot_assessments').select('listening,speaking,reading,writing,total')
        .eq('roll_number',roll).single()
        .then(({data})=>{ if(data) setHootData(data); });

      // Fetch Coding Level
      supabase.from('coding_levels').select('level')
        .eq('roll_number',roll).single()
        .then(({data})=>{ if(data) setCodingLevel(data.level); });

      // Fetch Problems from Maya API
      fetch('https://maya.technicalhub.io/node/api/get-student-problems-count',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({roll_no:roll})
      }).then(r=>r.ok?r.json():null)
        .then(json=>{
          if(!json) return;
          const skip=['roll_no','roll_number','student_id','id','total_problems','total'];
          const langs={};
          for(const [k,v] of Object.entries(json)){
            if(!skip.includes(k.toLowerCase())&&typeof v==='number') langs[k]=v;
          }
          setProblemsData(langs);
        }).catch(()=>{});
      // Maya coding data comes from student_profiles table (no external API call)
    } else { setLoading(false); }
  },[]);

  const activeItem=NAV_SECTIONS.flatMap(s=>s.items).find(i=>i.id===active);
  const displayName = profile?.name || user?.name || 'Student';
  const displayTeam = user?.teamNumber || profile?.roll_number || '';

  if (loading) return <div style={{width:'100%',height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'rgba(255,255,255,.4)',fontFamily:'sans-serif'}}>Loading...</div>;

  return(
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
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
.main-content{flex:1;overflow-y:auto;padding:28px 32px;}
.main-content::-webkit-scrollbar{width:4px}.main-content::-webkit-scrollbar-thumb{background:rgba(253,28,0,.1);border-radius:4px;}

.page-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px;}
.page-icon{width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,rgba(253,28,0,.08),rgba(250,160,0,.04));border:1px solid rgba(253,28,0,.1);display:flex;align-items:center;justify-content:center;}
.page-icon svg{color:rgba(253,28,0,.4);}
.page-label{font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.8);}
.page-sub{font-size:.76rem;color:rgba(255,255,255,.25);text-align:center;max-width:300px;}

/* ═══ MY PROFILE ═══ */
.mp{display:flex;flex-direction:column;gap:24px;animation:mpIn .5s ease both;}
@keyframes mpIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.mp-hero{display:flex;gap:28px;align-items:flex-start;padding:32px;border-radius:20px;background:linear-gradient(135deg,hsla(7,94%,59%,1) 0%,hsla(7,98%,46%,1) 48%,hsla(30,92%,66%,1) 100%);position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(232,29,2,.12);}
.mp-hero::before{content:'';position:absolute;top:-80px;right:-80px;width:350px;height:350px;background:radial-gradient(circle,rgba(255,255,255,.1),transparent 55%);pointer-events:none;}
.mp-avatar-wrap{flex-shrink:0;}
.mp-avatar{width:100px;height:100px;border-radius:22px;background:rgba(255,255,255,.15);backdrop-filter:blur(16px);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:800;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,.08);overflow:hidden;}
.mp-avatar-img{width:100px;height:100px;border-radius:22px;object-fit:cover;border:2px solid rgba(255,255,255,.3);box-shadow:0 8px 32px rgba(0,0,0,.08);}
.mp-hero-info{flex:1;}
.mp-hero-name{font-size:1.35rem;font-weight:800;color:#fff;margin-bottom:3px;}
.mp-hero-roll{font-size:.74rem;color:rgba(255,255,255,.75);display:flex;align-items:center;gap:6px;margin-bottom:12px;}
.mp-hero-tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;}
.mp-badge{padding:6px 14px;border-radius:20px;font-size:.6rem;font-weight:700;letter-spacing:.5px;display:inline-flex;align-items:center;gap:4px;transition:transform .2s;}
.mp-hero-details{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.mp-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.08);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);transition:all .25s;}
.mp-hd:hover{background:rgba(255,255,255,.12);}
.mp-hd-ic{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mp-hd-lb{font-size:.5rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:2px;}
.mp-hd-val{font-size:.84rem;font-weight:800;color:#fff;}

.mp-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.mp-full{grid-column:1/-1;}
.mp-card{padding:22px;border-radius:16px;background:rgba(12,8,18,.5);border:1px solid rgba(255,255,255,.06);transition:border-color .3s;}
.mp-card:hover{border-color:rgba(255,255,255,.1);}
.mp-card-title{font-size:.8rem;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.mp-card-count{font-size:.55rem;color:rgba(255,255,255,.25);font-weight:500;margin-left:auto;}
.mp-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
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
.mp-coding-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mp-coding-item{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-coding-item:hover{border-color:rgba(255,255,255,.1);}
.mp-coding-left{display:flex;align-items:center;gap:8px;}
.mp-coding-name{font-size:.74rem;color:rgba(255,255,255,.65);font-weight:500;}
.mp-coding-score{font-size:.8rem;font-weight:700;}

/* Video Ratings */
.mp-video-ratings{display:flex;flex-direction:column;gap:10px;}
.mp-vr-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);transition:all .2s;}
.mp-vr-row:hover{border-color:rgba(255,255,255,.08);background:rgba(255,255,255,.03);}
.mp-vr-logo{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mp-vr-name{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.55);width:75px;flex-shrink:0;}
.mp-vr-score{font-size:.78rem;font-weight:700;width:50px;text-align:right;flex-shrink:0;}

/* Maya Coding */
.mp-maya-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mp-maya-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .2s;}
.mp-maya-item:hover{border-color:rgba(255,255,255,.1);}
.mp-maya-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.mp-maya-info{flex:1;min-width:0;}
.mp-maya-lang{font-size:.62rem;color:rgba(255,255,255,.4);font-weight:600;text-transform:uppercase;letter-spacing:1px;}
.mp-maya-count{font-size:1.1rem;font-weight:800;}
.mp-maya-label{font-size:.5rem;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:1px;writing-mode:vertical-rl;text-orientation:mixed;}
.mp-maya-total{display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.02);font-size:.68rem;color:rgba(255,255,255,.4);font-weight:500;}
.mp-list-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:6px;transition:all .2s;}
.mp-list-item:hover{border-color:rgba(255,255,255,.1);}
.mp-list-num{min-width:42px;height:24px;padding:0 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.5rem;font-weight:700;flex-shrink:0;letter-spacing:.5px;border:1px solid;}
.mp-list-text{font-size:.74rem;color:rgba(255,255,255,.7);font-weight:500;flex:1;}
.mp-pay-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
.mp-pay-item{padding:16px 10px;border-radius:12px;text-align:center;border:1px solid;transition:all .2s;}
.mp-pay-item.paid{background:rgba(74,222,128,.04);border-color:rgba(74,222,128,.14);}
.mp-pay-item.unpaid{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.06);}
.mp-pay-lb{font-size:.52rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:4px;}
.mp-pay-st{font-size:.76rem;font-weight:700;}
.mp-pay-item.paid .mp-pay-st{color:#4ade80;}
.mp-pay-item.unpaid .mp-pay-st{color:rgba(255,255,255,.2);}

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

/* Role Tags */
.tp-tag{padding:3px 10px;border-radius:6px;font-size:.5rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.tp-tag-leader{background:rgba(253,28,0,.08);border:1px solid rgba(253,28,0,.15);color:#fd1c00;}
.tp-tag-you{background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.15);color:#4ade80;}

/* Mobile sidebar overlay */
.mob-overlay{position:fixed;inset:0;background:rgba(5,0,8,.85);z-index:99;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.mob-sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:100;animation:slideIn .3s cubic-bezier(.22,1,.36,1);box-shadow:4px 0 30px rgba(0,0,0,.5);background:#0c0616!important}
@keyframes slideIn{from{transform:translateX(-100%)}to{transform:none}}
.mob-menu-btn{width:40px;height:40px;border-radius:10px;background:rgba(253,28,0,.1);border:1px solid rgba(253,28,0,.2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fd1c00;transition:all .2s;-webkit-tap-highlight-color:transparent}
.mob-menu-btn:active{background:rgba(253,28,0,.2);transform:scale(.95)}

@media(max-width:900px){
  .mp-hero{flex-direction:column;align-items:center;text-align:center;}
  .mp-hero-details{grid-template-columns:1fr 1fr;}
  .mp-grid{grid-template-columns:1fr;}
  .mp-stats-grid,.mp-coding-grid{grid-template-columns:1fr;}
  .mp-pay-grid{grid-template-columns:1fr 1fr;}
  .tp-header{flex-direction:column;align-items:flex-start;gap:16px;}
  .tp-cards-grid{grid-template-columns:1fr 1fr;}
}
@media(max-width:768px){
  .sidebar:not(.mob-sidebar){display:none!important}
  .mob-sidebar{display:flex!important}
  .topbar{padding:14px 16px}
  .topbar-search{display:none}
  .topbar-title{font-size:.9rem}
  .main-content{padding:16px 14px}
  .mp-hero{padding:24px 20px}
  .mp-avatar{width:72px;height:72px;font-size:1.6rem}
  .mp-hero-name{font-size:1.1rem}
  .mp-hero-details{grid-template-columns:1fr}
  .mp-hd{padding:8px 10px}
  .mp-pay-grid{grid-template-columns:repeat(3,1fr)}
  .tp-cards-grid{grid-template-columns:1fr}
  .mp-maya-grid{grid-template-columns:1fr 1fr}
  .mp-vr-name{width:60px;font-size:.65rem}
}
@media(max-width:480px){
  .mp-hero-details{grid-template-columns:1fr}
  .mp-pay-grid{grid-template-columns:1fr 1fr}
  .mp-hero{padding:20px 16px}
  .mp-stats-grid{grid-template-columns:1fr}
  .topbar-credits{display:none}
}
      `}</style>

      <div className="dash">
        {/* Mobile overlay backdrop */}
        {isMobile && mobileMenuOpen && <div className="mob-overlay" onClick={()=>setMobileMenuOpen(false)}/>}

        {/* Sidebar - hidden on mobile, shown as overlay when menu is open */}
        {(!isMobile || mobileMenuOpen) && (
        <nav className={`sidebar ${isMobile?'mob-sidebar':''}`} style={isMobile?{width:280,minWidth:280}:{width:collapsed?78:260,minWidth:collapsed?78:260}}>
          <div className="sb-profile" style={{padding:isMobile?"24px 20px 18px":collapsed?"20px 12px 16px":"24px 20px 18px"}}>
            <div className="sb-profile-row" style={{justifyContent:(!isMobile&&collapsed)?"center":"space-between"}}>
              <div className="sb-avatar" style={{width:(!isMobile&&collapsed)?40:48,height:(!isMobile&&collapsed)?40:48,fontSize:(!isMobile&&collapsed)?14:18}}>{displayName.charAt(0)}</div>
              {isMobile?<button className="sb-toggle" onClick={()=>setMobileMenuOpen(false)}><X size={16}/></button>
              :!collapsed&&<button className="sb-toggle" onClick={()=>setCollapsed(true)}><ChevronLeft size={14}/></button>}
            </div>
            {!isMobile&&collapsed&&<div style={{display:"flex",justifyContent:"center",marginTop:10}}><button className="sb-toggle" onClick={()=>setCollapsed(false)}><ChevronRight size={14}/></button></div>}
            {(isMobile||!collapsed)&&<div className="sb-profile-info"><div className="sb-greeting">Good Day 👋</div><div className="sb-name">{displayName}</div><div className="sb-team-tag">{displayTeam} · {profile?.technology||''}</div></div>}
          </div>

          <div className="sb-nav">
            {NAV_SECTIONS.map(sec=>(
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
            {active==="my-profile"?<MyProfile profile={profile} loading={loading} videoRatings={videoRatings} videoLoading={videoLoading} mayaCoding={profile} mayaLoading={mayaLoading} hootData={hootData} codingLevel={codingLevel} problemsData={problemsData}/>:
             active==="team-profile"?<TeamProfile user={user}/>:(
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