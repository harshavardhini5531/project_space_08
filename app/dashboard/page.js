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

/* ═══ ENHANCED MY PROFILE — Uses Technical Hub APIs ═══ */
/* This replaces the existing MyProfile function in dashboard/page.js */

function MyProfile({ user, hootData, videoRatings, videoLoading }) {
  const [hub, setHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [imgError, setImgError] = useState(false);

  const roll = user?.rollNumber || '';

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
      <div className="mp-loading-text">Loading your profile...</div>
    </div>
  );

  if (!hub) return (
    <div className="mp-empty">
      <AlertCircle size={32} style={{ color: 'rgba(255,255,255,.15)' }} />
      <div>Profile not found for {roll}</div>
    </div>
  );

  const b = hub.basic;
  const ac = hub.academic;
  const cod = hub.coding;
  const mc = hub.mayaCoding;
  const att = hub.attendance;
  const certs = hub.certifications;
  const vio = hub.violations;

  // Calculate overall attendance
  const totalPresent = att.reduce((s, a) => s + (a.present || 0), 0);
  const totalSessions = att.reduce((s, a) => s + (a.total_sessions || 0), 0);
  const overallAtt = totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(1) : 0;

  // Tab config
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
      <div className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-avatar-wrap">
          {!imgError ? (
            <img
              className="mp-avatar-img"
              src={b.image_url}
              alt={b.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="mp-avatar">{(b.name || '?').charAt(0)}</div>
          )}
        </div>
        <div className="mp-hero-info">
          <div className="mp-hero-name">{b.name}</div>
          <div className="mp-hero-roll">
            <Hash size={12} /> {b.roll_number}
            {ac && <> · {ac.branch} · {ac.college}</>}
          </div>
          <div className="mp-hero-tags">
            {ac?.passout_year && <span className="mp-htag">Class of {ac.passout_year}</span>}
            {ac?.is_eamcet && <span className="mp-htag mp-htag-dim">EAMCET</span>}
            {ac?.is_management && <span className="mp-htag mp-htag-dim">Management</span>}
          </div>
          <div className="mp-hero-details">
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{ background: '#1abc9c' }}><Phone size={15} color="#fff" /></div>
              <div><div className="mp-hd-lb">Mobile</div><div className="mp-hd-val">{b.mobile || '—'}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{ background: '#3498db' }}><GraduationCap size={15} color="#fff" /></div>
              <div><div className="mp-hd-lb">Entrance Rank</div><div className="mp-hd-val">{ac?.rank ? `#${ac.rank}` : '—'}</div></div>
            </div>
            <div className="mp-hd">
              <div className="mp-hd-ic" style={{ background: '#f1c40f' }}><Target size={15} color="#fff" /></div>
              <div><div className="mp-hd-lb">Overall Attendance</div><div className="mp-hd-val">{overallAtt}%</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div className="mp-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`mp-tab ${activeTab === t.id ? 'mp-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═══ */}

      {activeTab === 'overview' && (
        <div className="mp-tab-content">
          {/* Academic Performance */}
          {ac && (
            <div className="mp-card">
              <div className="mp-card-title"><GraduationCap size={16} style={{ color: '#3b82f6' }} /> Academic Performance</div>
              <div className="mp-stats-grid">
                <StatCard icon={BookOpen} label="B.Tech CGPA" value={ac.btech || '—'} color="#3b82f6" />
                <StatCard icon={Award} label="Intermediate %" value={ac.inter ? `${ac.inter}%` : '—'} color="#8b5cf6" />
                <StatCard icon={Star} label="SSC %" value={ac.ssc ? `${ac.ssc}%` : '—'} color="#f59e0b" />
                <StatCard icon={XCircle} label="Backlogs" value={ac.backlogs || 0} color={ac.backlogs > 0 ? '#ef4444' : '#4ade80'} />
              </div>
            </div>
          )}

          {/* Quick Coding Stats */}
          <div className="mp-card">
            <div className="mp-card-title"><Code size={16} style={{ color: '#06b6d4' }} /> Coding Platforms — Quick View</div>
            <div className="mp-coding-grid">
              {[
                { name: 'LeetCode', val: cod.leetcode?.lc_total_progarms, sub: `Rank #${cod.leetcode?.lc_rank || '—'}`, color: '#f89f1b' },
                { name: 'HackerRank', val: `${cod.hackerrank?.hr_total_stars || 0}★`, sub: `${cod.hackerrank?.hr_badges || 0} badges`, color: '#2ec866' },
                { name: 'CodeChef', val: cod.codechef?.total_problems, sub: `${cod.codechef?.rating || 0} rating`, color: '#5b4638' },
                { name: 'GeeksForGeeks', val: cod.gfg?.gfg_total_problems || 0, sub: `Score: ${cod.gfg?.gfg_score || 0}`, color: '#2f8d46' },
              ].map(p => (
                <div key={p.name} className="mp-coding-item">
                  <div className="mp-coding-left">
                    <div className="mp-coding-dot" style={{ background: p.color }} />
                    <div>
                      <span className="mp-coding-name">{p.name}</span>
                      <span className="mp-coding-sub">{p.sub}</span>
                    </div>
                  </div>
                  <span className="mp-coding-score" style={{ color: p.color }}>{p.val || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Counts */}
          <div className="mp-card">
            <div className="mp-card-title"><Shield size={16} style={{ color: '#10b981' }} /> Certifications Summary</div>
            <div className="mp-stats-grid">
              <StatCard icon={Award} label="Global Certifications" value={certs.counts.Global_Certifications || 0} color="#10b981" />
              <StatCard icon={FileText} label="Training Certificates" value={certs.counts.Training_Certificates || 0} color="#3b82f6" />
              <StatCard icon={Trophy} label="Digital Badges" value={certs.counts.Digitalbadge_Certificates || 0} color="#f59e0b" />
              <StatCard icon={Briefcase} label="Internship Certs" value={certs.counts.Internship_Certificate || 0} color="#8b5cf6" />
            </div>
          </div>

          {/* Violations */}
          <div className="mp-card">
            <div className="mp-card-title"><AlertCircle size={16} style={{ color: vio.length > 0 ? '#ef4444' : '#4ade80' }} /> Violations</div>
            {vio.length === 0 ? (
              <div className="mp-empty-section">
                <CheckCircle size={20} style={{ color: '#4ade80' }} />
                <span>No violations recorded — great job!</span>
              </div>
            ) : (
              <div className="mp-violations-list">
                {vio.map((v, i) => (
                  <div key={i} className="mp-violation-item">
                    <AlertCircle size={14} style={{ color: '#ef4444' }} />
                    <span>{v.description || v.violation || JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Placement */}
          <div className="mp-card">
            <div className="mp-card-title"><Briefcase size={16} style={{ color: '#f59e0b' }} /> Placement Status</div>
            {hub.placement ? (
              <div className="mp-placement-info">
                {typeof hub.placement === 'object' ? (
                  <pre style={{ color: 'rgba(255,255,255,.6)', fontSize: '.75rem', whiteSpace: 'pre-wrap' }}>{JSON.stringify(hub.placement, null, 2)}</pre>
                ) : (
                  <div className="mp-empty-section"><Briefcase size={20} style={{ color: '#f59e0b' }} /><span>{hub.placement}</span></div>
                )}
              </div>
            ) : (
              <div className="mp-empty-section"><Briefcase size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>No placement data yet</span></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'coding' && (
        <div className="mp-tab-content">

          {/* LeetCode Detailed */}
          {cod.leetcode && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{ background: '#f89f1b' }} />
                LeetCode
                <a href={cod.leetcode.lc_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Target} label="Total Solved" value={cod.leetcode.lc_total_progarms} color="#f89f1b" />
                <StatCard icon={Trophy} label="Rank" value={`#${cod.leetcode.lc_rank}`} color="#f89f1b" />
                <StatCard icon={Zap} label="Weekly Solved" value={cod.leetcode.lc_weekly_solved} color="#22d3ee" />
                <StatCard icon={Star} label="Streak" value={`${cod.leetcode.lc_streak} days`} color="#4ade80" />
              </div>
              <div className="mp-difficulty-row">
                {[
                  { label: 'Easy', val: cod.leetcode.lc_easy, color: '#4ade80' },
                  { label: 'Medium', val: cod.leetcode.lc_medium, color: '#f59e0b' },
                  { label: 'Hard', val: cod.leetcode.lc_hard, color: '#ef4444' },
                ].map(d => (
                  <div key={d.label} className="mp-diff-chip" style={{ borderColor: `${d.color}30`, background: `${d.color}08` }}>
                    <span className="mp-diff-label">{d.label}</span>
                    <span className="mp-diff-val" style={{ color: d.color }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HackerRank Detailed */}
          {cod.hackerrank && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{ background: '#2ec866' }} />
                HackerRank
                <a href={cod.hackerrank.hr_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-3">
                <StatCard icon={Star} label="Total Stars" value={cod.hackerrank.hr_total_stars} color="#2ec866" />
                <StatCard icon={Award} label="Badges" value={cod.hackerrank.hr_badges} color="#2ec866" />
                <StatCard icon={Shield} label="Certifications" value={cod.hackerrank.hr_certification_count} color="#22d3ee" />
              </div>
              <div className="mp-sub-section">
                <div className="mp-sub-title">Stars by Language</div>
                <div className="mp-hr-stars">
                  {[
                    { lang: 'C', stars: cod.hackerrank.hr_c },
                    { lang: 'C++', stars: cod.hackerrank.hr_cpp },
                    { lang: 'Java', stars: cod.hackerrank.hr_java },
                    { lang: 'Python', stars: cod.hackerrank.hr_python },
                    { lang: 'SQL', stars: cod.hackerrank.hr_sql },
                    { lang: 'Problem Solving', stars: cod.hackerrank.hr_problem_solving },
                  ].map(h => (
                    <div key={h.lang} className="mp-hr-star-row">
                      <span className="mp-hr-lang">{h.lang}</span>
                      <div className="mp-hr-stars-visual">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} fill={n <= (h.stars || 0) ? '#f59e0b' : 'none'} color={n <= (h.stars || 0) ? '#f59e0b' : 'rgba(255,255,255,.1)'} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {cod.hackerrank.hr_certifications?.length > 0 && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">Certifications</div>
                  {cod.hackerrank.hr_certifications.map((c, i) => (
                    <div key={i} className="mp-list-item">
                      <CheckCircle size={14} style={{ color: '#4ade80' }} />
                      <div className="mp-list-text">{c}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CodeChef Detailed */}
          {cod.codechef && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{ background: '#5b4638' }} />
                CodeChef
                <a href={cod.codechef.cc_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Target} label="Total Problems" value={cod.codechef.total_problems} color="#5b4638" />
                <StatCard icon={Trophy} label="Rating" value={cod.codechef.rating} color="#f59e0b" />
                <StatCard icon={Star} label="Star Rating" value={`${cod.codechef.star_rating}★`} color="#f59e0b" />
                <StatCard icon={Activity} label="Contests" value={cod.codechef.contests} color="#22d3ee" />
              </div>
              <div className="mp-stats-grid" style={{ marginTop: 10 }}>
                <StatCard icon={Zap} label="Weekly Solved" value={cod.codechef.weekly_solved} color="#4ade80" />
                <StatCard icon={Star} label="Streak" value={`${cod.codechef.streak} days`} color="#8b5cf6" />
              </div>
            </div>
          )}

          {/* GFG */}
          {cod.gfg && (
            <div className="mp-card">
              <div className="mp-card-title">
                <div className="mp-platform-dot" style={{ background: '#2f8d46' }} />
                GeeksForGeeks
                <a href={cod.gfg.gfg_profile} target="_blank" rel="noopener" className="mp-profile-link">View Profile →</a>
              </div>
              <div className="mp-stats-grid mp-stats-3">
                <StatCard icon={Target} label="Total Solved" value={cod.gfg.gfg_total_problems} color="#2f8d46" />
                <StatCard icon={Trophy} label="Score" value={cod.gfg.gfg_score} color="#2f8d46" />
                <StatCard icon={Star} label="Streak" value={`${cod.gfg.gfg_streak} days`} color="#4ade80" />
              </div>
              {cod.gfg.gfg_total_problems > 0 && (
                <div className="mp-difficulty-row">
                  {[
                    { label: 'School', val: cod.gfg.gfg_school, color: '#a78bfa' },
                    { label: 'Basic', val: cod.gfg.gfg_basic, color: '#60a5fa' },
                    { label: 'Easy', val: cod.gfg.gfg_easy, color: '#4ade80' },
                    { label: 'Medium', val: cod.gfg.gfg_medium, color: '#f59e0b' },
                    { label: 'Hard', val: cod.gfg.gfg_hard, color: '#ef4444' },
                  ].map(d => (
                    <div key={d.label} className="mp-diff-chip" style={{ borderColor: `${d.color}30`, background: `${d.color}08` }}>
                      <span className="mp-diff-label">{d.label}</span>
                      <span className="mp-diff-val" style={{ color: d.color }}>{d.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Maya Coding (Internal) */}
          {mc && (
            <div className="mp-card">
              <div className="mp-card-title"><Code size={16} style={{ color: '#22d3ee' }} /> Maya Coding Profile</div>
              <div className="mp-stats-grid mp-stats-4">
                <StatCard icon={Trophy} label="Global Rank" value={`#${mc.globalRank}`} color="#22d3ee" />
                <StatCard icon={Target} label="Batch Rank" value={`#${mc.batchRank}`} color="#8b5cf6" />
                <StatCard icon={Star} label="Score" value={mc.problems?.score || 0} color="#f59e0b" />
                <StatCard icon={Clock} label="Total Time" value={mc.totalTime} color="#4ade80" />
              </div>

              {mc.problems && (
                <div className="mp-difficulty-row" style={{ marginTop: 12 }}>
                  {[
                    { label: 'Easy', val: mc.problems.easy, color: '#4ade80' },
                    { label: 'Medium', val: mc.problems.medium, color: '#f59e0b' },
                    { label: 'Hard', val: mc.problems.hard, color: '#ef4444' },
                  ].map(d => (
                    <div key={d.label} className="mp-diff-chip" style={{ borderColor: `${d.color}30`, background: `${d.color}08` }}>
                      <span className="mp-diff-label">{d.label}</span>
                      <span className="mp-diff-val" style={{ color: d.color }}>{d.val}</span>
                    </div>
                  ))}
                </div>
              )}

              {mc.languages && (
                <div className="mp-sub-section">
                  <div className="mp-sub-title">Languages Used</div>
                  <div className="mp-lang-bars">
                    {Object.entries(mc.languages).sort(([, a], [, b]) => b - a).map(([lang, count]) => {
                      const max = Math.max(...Object.values(mc.languages), 1);
                      const LANGC = { c: '#A8B9CC', cpp: '#659AD2', java: '#F89820', python: '#3572A5', sql: '#e38c00' };
                      const color = LANGC[lang.toLowerCase()] || '#BDE8F5';
                      return (
                        <div key={lang} className="mp-lang-bar-row">
                          <span className="mp-lang-name" style={{ color }}>{lang.toUpperCase()}</span>
                          <div className="mp-lang-bar-track">
                            <div className="mp-lang-bar-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
                          </div>
                          <span className="mp-lang-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="mp-tab-content">
          {/* Overall Attendance Summary */}
          <div className="mp-card">
            <div className="mp-card-title"><Clock size={16} style={{ color: '#f59e0b' }} /> Overall Attendance</div>
            <div className="mp-stats-grid mp-stats-3">
              <StatCard icon={CheckCircle} label="Total Present" value={totalPresent} color="#4ade80" />
              <StatCard icon={XCircle} label="Total Absent" value={totalSessions - totalPresent} color="#ef4444" />
              <StatCard icon={Target} label="Overall %" value={`${overallAtt}%`} color={parseFloat(overallAtt) >= 75 ? '#4ade80' : '#ef4444'} />
            </div>
          </div>

          {/* Per-course attendance */}
          <div className="mp-card">
            <div className="mp-card-title"><Layers size={16} style={{ color: '#8b5cf6' }} /> Course-wise Attendance <span className="mp-card-count">{att.length} courses</span></div>
            <div className="mp-att-list">
              {att.sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).map((a, i) => {
                const pct = parseFloat(a.percentage || 0).toFixed(1);
                const isGood = pct >= 75;
                return (
                  <div key={i} className="mp-att-item">
                    <div className="mp-att-top">
                      <div>
                        <div className="mp-att-course">{a.technology_name}</div>
                        <div className="mp-att-batch">{a.course_name} · {a.batch_name}</div>
                      </div>
                      <div className="mp-att-pct" style={{ color: isGood ? '#4ade80' : '#ef4444' }}>{pct}%</div>
                    </div>
                    <div className="mp-att-bar-track">
                      <div
                        className="mp-att-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: isGood
                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                            : 'linear-gradient(90deg, #ef4444, #f97316)',
                        }}
                      />
                    </div>
                    <div className="mp-att-bottom">
                      <span>Present: {a.present}</span>
                      <span>Absent: {a.absent}</span>
                      <span>Total: {a.total_sessions}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certs' && (
        <div className="mp-tab-content">
          {/* Global Certifications */}
          <div className="mp-card">
            <div className="mp-card-title"><Award size={16} style={{ color: '#10b981' }} /> Global Certifications <span className="mp-card-count">{certs.globalCerts.length}</span></div>
            {certs.globalCerts.length > 0 ? (
              <div className="mp-cert-grid">
                {certs.globalCerts.map((c, i) => (
                  <div key={i} className="mp-cert-item">
                    <div className="mp-cert-logo-wrap">
                      {c.certification_logo ? (
                        <img src={c.certification_logo} alt="" className="mp-cert-logo" onError={e => { e.target.style.display = 'none' }} />
                      ) : (
                        <Award size={20} style={{ color: '#10b981' }} />
                      )}
                    </div>
                    <div className="mp-cert-info">
                      <div className="mp-cert-name">{c.certifications_name}</div>
                      <div className="mp-cert-id">ID: {c.certifications_id}</div>
                    </div>
                    {c.certification && (
                      <a href={c.certification} target="_blank" rel="noopener" className="mp-cert-view">
                        <FileText size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mp-empty-section"><Award size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>No global certifications yet</span></div>
            )}
          </div>

          {/* Digital Badges */}
          <div className="mp-card">
            <div className="mp-card-title"><Trophy size={16} style={{ color: '#f59e0b' }} /> Digital Badges <span className="mp-card-count">{certs.digitalBadges.length}</span></div>
            {certs.digitalBadges.length > 0 ? (
              certs.digitalBadges.map((badge, i) => (
                <div key={i} className="mp-list-item">
                  <Trophy size={14} style={{ color: '#f59e0b' }} />
                  <div className="mp-list-text">{badge.badge_name || JSON.stringify(badge)}</div>
                </div>
              ))
            ) : (
              <div className="mp-empty-section"><Trophy size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>No digital badges yet</span></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assessments' && (
        <div className="mp-tab-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

            {/* Video Ratings */}
            <div className="mp-card">
              <div className="mp-card-title"><Star size={16} style={{ color: '#f59e0b' }} /> Video Ratings</div>
              {videoRatings ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'Gemini AI', data: videoRatings.gemini, color: '#4285F4' },
                    { name: 'ChatGPT', data: videoRatings.chatgpt, color: '#10a37f' },
                    { name: 'Claude AI', data: videoRatings.claude, color: '#cc785c' },
                    { name: 'Mentor', data: videoRatings.mentor, color: '#f59e0b' },
                  ].map(({ name, data, color }) => (
                    <div key={name} className="mp-vr-row">
                      <span className="mp-vr-name">{name}</span>
                      <div className="mp-vr-bar">
                        <div className="mp-vr-fill" style={{ width: `${((data?.overall || 0) / 10) * 100}%`, background: color }} />
                      </div>
                      <span className="mp-vr-score" style={{ color: data?.overall ? color : 'rgba(255,255,255,.15)' }}>{data?.overall ? `${data.overall}/10` : '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mp-empty-section"><Star size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>{videoLoading ? 'Loading...' : 'No video ratings'}</span></div>
              )}
            </div>

            {/* HOOT Assessment */}
            <div className="mp-card">
              <div className="mp-card-title"><MessageSquare size={16} style={{ color: '#EEA727' }} /> HOOT — Communication</div>
              {hootData ? (
                <>
                  {[
                    ['Listening', hootData.listening, '#EEA727'],
                    ['Speaking', hootData.speaking, '#fd1c00'],
                    ['Reading', hootData.reading, '#10b981'],
                    ['Writing', hootData.writing, '#7B2FBE'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '.75rem', color: '#bbb', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color }}>{val?.toFixed(1)}%</span>
                      </div>
                      <div className="mp-att-bar-track">
                        <div className="mp-att-bar-fill" style={{ width: `${val}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.75rem', color: '#666' }}>Overall</span>
                    <div style={{ background: 'rgba(238,167,39,.1)', border: '1px solid rgba(238,167,39,.25)', borderRadius: 7, padding: '3px 10px' }}>
                      <span style={{ fontSize: '.9rem', fontWeight: 800, color: '#EEA727' }}>{hootData.total?.toFixed(1)}<span style={{ fontSize: '.65rem', fontWeight: 400, marginLeft: 2 }}>/100</span></span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mp-empty-section"><MessageSquare size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>No assessment data</span></div>
              )}
            </div>

            {/* ATS Report */}
            <div className="mp-card">
              <div className="mp-card-title"><FileText size={16} style={{ color: '#3b82f6' }} /> ATS Report</div>
              {hub.atsReport ? (
                <pre style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {JSON.stringify(hub.atsReport, null, 2)}
                </pre>
              ) : (
                <div className="mp-empty-section"><FileText size={20} style={{ color: 'rgba(255,255,255,.15)' }} /><span>No ATS report found</span></div>
              )}
            </div>
          </div>

          {/* Aptitude Stats */}
          {hub.aptitude?.badgeTestStats && (
            <div className="mp-card" style={{ marginTop: 16 }}>
              <div className="mp-card-title"><Target size={16} style={{ color: '#8b5cf6' }} /> Aptitude & Badge Tests</div>
              <pre style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {JSON.stringify(hub.aptitude.badgeTestStats, null, 2)}
              </pre>
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
  /* ═══ ENHANCED MY PROFILE — Additional CSS ═══ */
/* Add these styles to the existing <style> tag in dashboard/page.js */

/* Loading state */
.mp-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:16px;}
.mp-loading-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.06);border-top-color:#fd1c00;border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.mp-loading-text{font-size:.8rem;color:rgba(255,255,255,.25);font-family:'DM Sans',sans-serif;}
.mp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:40vh;gap:12px;color:rgba(255,255,255,.3);font-size:.82rem;}

/* Hero enhancements */
.mp-hero{position:relative;}
.mp-hero-bg{position:absolute;inset:0;border-radius:20px;overflow:hidden;pointer-events:none;}
.mp-htag{padding:5px 14px;border-radius:20px;font-size:.6rem;font-weight:700;letter-spacing:.5px;background:rgba(255,255,255,.92);color:#b91c1c;border:none;box-shadow:0 2px 10px rgba(0,0,0,.06);}
.mp-htag-dim{background:rgba(255,255,255,.18)!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)!important;}

/* Tabs */
.mp-tabs{display:flex;gap:4px;padding:4px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);overflow-x:auto;-webkit-overflow-scrolling:touch;}
.mp-tabs::-webkit-scrollbar{display:none;}
.mp-tab{display:flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;border:none;background:none;color:rgba(255,255,255,.4);font-size:.76rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .25s;white-space:nowrap;}
.mp-tab:hover{color:rgba(255,255,255,.65);background:rgba(255,255,255,.04);}
.mp-tab-active{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(250,160,0,.08))!important;color:#fff!important;box-shadow:0 2px 12px rgba(253,28,0,.1);}
.mp-tab-active svg{color:#fd1c00!important;}

/* Tab content */
.mp-tab-content{display:flex;flex-direction:column;gap:16px;animation:mpIn .4s ease both;}

/* Stats grid variants */
.mp-stats-3{grid-template-columns:repeat(3,1fr)!important;}
.mp-stats-4{grid-template-columns:repeat(4,1fr)!important;}

/* Coding items enhanced */
.mp-coding-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.mp-coding-sub{display:block;font-size:.6rem;color:rgba(255,255,255,.25);margin-top:1px;}
.mp-coding-left{display:flex;align-items:center;gap:10px;}
.mp-coding-name{display:block;font-size:.76rem;color:rgba(255,255,255,.65);font-weight:600;}

/* Difficulty chips */
.mp-difficulty-row{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.mp-diff-chip{display:flex;flex-direction:column;align-items:center;padding:10px 16px;border-radius:10px;border:1px solid;flex:1;min-width:70px;}
.mp-diff-label{font-size:.55rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:3px;}
.mp-diff-val{font-size:1.1rem;font-weight:800;}

/* Profile link */
.mp-profile-link{margin-left:auto;font-size:.65rem;color:rgba(255,255,255,.3);text-decoration:none;font-weight:500;transition:color .2s;}
.mp-profile-link:hover{color:#fd1c00;}
.mp-platform-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}

/* HackerRank stars */
.mp-hr-stars{display:flex;flex-direction:column;gap:8px;}
.mp-hr-star-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;}
.mp-hr-lang{font-size:.72rem;color:rgba(255,255,255,.5);font-weight:500;width:120px;}
.mp-hr-stars-visual{display:flex;gap:3px;}

/* Language bars */
.mp-lang-bars{display:flex;flex-direction:column;gap:8px;}
.mp-lang-bar-row{display:flex;align-items:center;gap:10px;}
.mp-lang-name{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.07em;width:60px;flex-shrink:0;}
.mp-lang-bar-track{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-lang-bar-fill{height:100%;border-radius:3px;}
.mp-lang-count{font-size:.72rem;font-weight:700;color:#fff;background:rgba(255,255,255,.07);padding:1px 7px;border-radius:4px;min-width:36px;text-align:center;}

/* Empty sections */
.mp-empty-section{display:flex;align-items:center;gap:10px;padding:16px 0;color:rgba(255,255,255,.25);font-size:.78rem;}

/* Violations */
.mp-violations-list{display:flex;flex-direction:column;gap:6px;}
.mp-violation-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;background:rgba(239,68,68,.04);border:1px solid rgba(239,68,68,.1);font-size:.76rem;color:rgba(255,255,255,.65);}

/* Attendance list */
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

/* Video ratings */
.mp-vr-row{display:flex;align-items:center;gap:10px;padding:8px 0;}
.mp-vr-name{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.45);width:80px;flex-shrink:0;}
.mp-vr-bar{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden;}
.mp-vr-fill{height:100%;border-radius:3px;}
.mp-vr-score{font-size:.76rem;font-weight:700;width:45px;text-align:right;flex-shrink:0;}

/* Mobile overrides for new styles */
@media(max-width:768px){
  .mp-tabs{padding:3px;gap:2px;}
  .mp-tab{padding:8px 12px;font-size:.7rem;}
  .mp-stats-3,.mp-stats-4{grid-template-columns:1fr 1fr!important;}
  .mp-difficulty-row{flex-wrap:wrap;}
  .mp-diff-chip{min-width:60px;padding:8px 10px;}
  .mp-att-bottom{flex-wrap:wrap;gap:10px;}
  .mp-hr-lang{width:80px;}
  .mp-coding-grid{grid-template-columns:1fr!important;}
}
@media(max-width:480px){
  .mp-stats-3,.mp-stats-4{grid-template-columns:1fr!important;}
  .mp-tab span{display:none;}
  .mp-tab{padding:10px 14px;}
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
            {active==="my-profile"?<MyProfile user={user} hootData={hootData} videoRatings={videoRatings} videoLoading={videoLoading}/>:
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