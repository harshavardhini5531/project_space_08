'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── LINE SVG ICONS ──
const I = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  code: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.77 1.05 1.39 1.22l.12.03H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

export default function MentorDashboard() {
  const router = useRouter()
  const [mentor, setMentor] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('overview')
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [pushEnabled, setPushEnabled] = useState(true) // default true to avoid flash of banner
  const [pushEnabling, setPushEnabling] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [reviews, setReviews] = useState({ pending: [], teams: [], stats: {} })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState({ leaderboard: [], stats: {} })
  const [lbLoading, setLbLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [liModal, setLiModal] = useState(false)
  const [liPost, setLiPost] = useState('')
  const [liTeam, setLiTeam] = useState(null)
  const [liSuggestion, setLiSuggestion] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const [reviewNotifs, setReviewNotifs] = useState([])
  const [reviewUnread, setReviewUnread] = useState(0)
  const [showReviewNotif, setShowReviewNotif] = useState(false)
  const [selectedMyTeam, setSelectedMyTeam] = useState(null)
  const [reenableByTeam, setReenableByTeam] = useState({}) // {teamNumber: [{id, roll_number, requester_name, reason, created_at}, ...]}
  const [reenableModal, setReenableModal] = useState(null) // {team} — shows modal for that team's requests
  const [reenableProcessing, setReenableProcessing] = useState(null) // request id being processed
  const [reenableFlash, setReenableFlash] = useState(null) // {type,text} for success/error feedback
  const [liAnalytics, setLiAnalytics] = useState({ byTeam: {} })
  const [liExpandedTeam, setLiExpandedTeam] = useState(null)
  const [selectedTechTeam, setSelectedTechTeam] = useState(null)

  useEffect(() => { const c=()=>setIsMobile(window.innerWidth<900); c(); window.addEventListener('resize',c); return ()=>window.removeEventListener('resize',c) }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('mentor_token')
    const saved = sessionStorage.getItem('mentor_data')
    if (!token || !saved) { router.push('/mentor'); return }
    const m = JSON.parse(saved)
    setMentor(m)
    fetchDashboard(m.email, token)
    import('@/lib/pushNotifications').then(mod => mod.registerPushNotifications(m.email, 'mentor').then(ok => setPushEnabled(!!ok))).catch(() => {})
  }, [])

  // Check push permission status every 5s (in case user changes it in browser settings)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const check = () => setPushEnabled(Notification.permission === 'granted')
    check()
    const iv = setInterval(check, 5000)
    return () => clearInterval(iv)
  }, [])

  async function handleEnablePush() {
    if (!mentor?.email) return
    setPushEnabling(true)
    try {
      const mod = await import('@/lib/pushNotifications')
      const ok = await mod.registerPushNotifications(mentor.email, 'mentor')
      setPushEnabled(!!ok)
      if (!ok && Notification.permission === 'denied') {
        alert('Push notifications are blocked in your browser. Please enable them in site settings (click the lock icon in the address bar) and refresh the page.')
      }
    } catch (e) { console.error('Enable push failed:', e) }
    finally { setPushEnabling(false) }
  }

  async function fetchDashboard(email, token) {
    setLoading(true)
    try {
      const t = token || sessionStorage.getItem('mentor_token')
      const r = await fetch('/api/mentor/dashboard', { method:'POST', headers:{'Content-Type':'application/json','x-mentor-token':t}, body:JSON.stringify({mentorEmail:email||mentor?.email}) })
      const d = await r.json()
      if (!r.ok) { router.push('/mentor'); return }
      setData(d)
    } catch {} finally { setLoading(false) }
  }

  async function handleSetPassword() {
    if (!newPass || newPass.length < 6) { setPassMsg('Min 6 characters'); return }
    setPassLoading(true); setPassMsg('')
    try {
      const r = await fetch('/api/mentor/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'set-password', email:mentor?.email, newPassword:newPass, confirmPassword:newPass}) })
      const d = await r.json()
      if (r.ok) { setPassMsg('Password set!'); setNewPass(''); const m={...mentor,hasPassword:true}; setMentor(m); sessionStorage.setItem('mentor_data',JSON.stringify(m)) }
      else setPassMsg(d.error)
    } catch { setPassMsg('Failed') } finally { setPassLoading(false) }
  }

  function handleLogout() { sessionStorage.removeItem('mentor_token'); sessionStorage.removeItem('mentor_data'); router.push('/mentor') }

  useEffect(() => {
    if (!mentor) return;
    fetchReviews(); fetchLeaderboard();
    const iv = setInterval(() => { fetchReviews(); fetchLeaderboard(); }, 30000);
    return () => clearInterval(iv);
  }, [mentor]);

  async function fetchReviews() {
    if (!mentor?.name) return; setReviewsLoading(true);
    try { const r = await fetch(`/api/milestones/pending-reviews?mentor=${encodeURIComponent(mentor.name)}`); const d = await r.json(); setReviews(d); } catch (e) { console.error(e); } finally { setReviewsLoading(false); }
  }

  async function fetchLeaderboard() {
    setLbLoading(true);
    try { const r = await fetch('/api/milestones/leaderboard?limit=50'); const d = await r.json(); setLeaderboard(d); } catch (e) { console.error(e); } finally { setLbLoading(false); }
  }

  async function handleMilestoneAction(teamNumber, stageNumber, action, comment) {
    setActionLoading(`${teamNumber}-${stageNumber}`);
    try { const r = await fetch('/api/milestones/mentor-action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ teamNumber, stageNumber, action, mentorEmail:mentor.email, mentorName:mentor.name, comment:comment||'' }) }); const d = await r.json(); if (r.ok) { fetchReviews(); fetchLeaderboard(); setRejectModal(null); setRejectComment(''); } else alert(d.error||'Failed'); } catch { alert('Network error'); } finally { setActionLoading(null); }
  }

  useEffect(() => {
    if (!mentor?.email) return;
    const fetchN = async () => { try { const r = await fetch(`/api/milestones/notifications?type=mentor&email=${encodeURIComponent(mentor.email)}&limit=15`); const d = await r.json(); setReviewNotifs(d.notifications||[]); setReviewUnread(d.unread_count||0); } catch {} };
    fetchN(); const iv = setInterval(fetchN, 30000); return () => clearInterval(iv);
  }, [mentor]);
  // Auto-select first team when data loads
  useEffect(() => {
    if (myTeams.length > 0 && !selectedMyTeam) setSelectedMyTeam(myTeams[0].serialNumber)

    // Fetch re-enable requests for all mentor's teams
    const teamNums = myTeams.map(t => t.teamNumber).filter(Boolean)
    if (teamNums.length > 0) {
      fetch('/api/linkedin-reenable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-by-team', teamNumbers: teamNums }) })
        .then(r => r.json()).then(d => { if (d.byTeam) setReenableByTeam(d.byTeam) }).catch(() => {})
      // Fetch LinkedIn post analytics for each team
      Promise.all(teamNums.map(tn =>
        fetch('/api/linkedin-share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check-team', teamNumber: tn }) })
          .then(r => r.json()).then(d => ({ tn, d })).catch(() => ({ tn, d: null }))
      )).then(results => {
        const byTeam = {}
        results.forEach(({ tn, d }) => {
          if (!d) return
          byTeam[tn] = {
            members: [...(d.postedMembers||[]), ...(d.pendingMembers||[])],
            posted: (d.postedMembers||[]).map(m => m.rollNumber),
            pending: (d.pendingMembers||[]).map(m => m.rollNumber)
          }
        })
        setLiAnalytics({ byTeam })
      }).catch(() => {})
    }
    if ((techProjects.teams||[]).length > 0 && !selectedTechTeam) setSelectedTechTeam((techProjects.teams||[])[0]?.serialNumber)
  }, [data])

  const glowColors = { 'Data Specialist':'59,130,246', 'AWS Development':'245,158,11', 'Full Stack':'16,185,129', 'Google Flutter':'6,182,212', 'ServiceNow':'139,92,246', 'VLSI':'239,68,68' }
  const solidColors = { 'Data Specialist':'#3b82f6', 'AWS Development':'#f59e0b', 'Full Stack':'#10b981', 'Google Flutter':'#06b6d4', 'ServiceNow':'#8b5cf6', 'VLSI':'#ef4444' }

  const navItems = [
    {id:'overview', label:'Overview', icon:I.grid},
    {id:'allteams', label:'My Teams', icon:I.users},
    {id:'techprojects', label:'Tech Teams', icon:I.code},
    {id:'reviews', label:'Project Status', icon:I.star},
    {id:'linkedin', label:'LinkedIn Stats', icon:I.star},
    {id:'leaderboard', label:'Leaderboard', icon:I.star},
    {id:'settings', label:'Settings', icon:I.settings},
  ]

  const myTeams = data?.teams || []
  const registeredTeams = myTeams.filter(t => t.registered)
  const pendingTeams = myTeams.filter(t => !t.registered)
  const techProjects = data?.techProjects || {}
  const stats = data?.stats || {}
// Helper to get selected team object
  const getTeam = (teams, serial) => (teams || []).find(t => t.serialNumber === serial) || null
  // ── LinkedIn Share for Mentors ──
  function toBoldM(text) {
    if (!text) return '';
    const bm = {'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭','a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇','0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'};
    return text.split('').map(c => bm[c] || c).join('');
  }

  function generateMentorPost(t, customIntro = '') {
    if (!t) return '';
    const memberNames = (t.members || []).map(m => m.name).filter(Boolean);
    const boldNames = memberNames.map(n => toBoldM(n));
    let namesStr = '';
    if (boldNames.length === 1) namesStr = boldNames[0];
    else if (boldNames.length === 2) namesStr = `${boldNames[0]} and ${boldNames[1]}`;
    else if (boldNames.length > 2) namesStr = boldNames.slice(0, -1).join(', ') + ', and ' + boldNames[boldNames.length - 1];

    const techStack = (t.techStack || []).join(' · ');
    const projectArea = (t.projectArea || []).join(' · ');
    const projectDesc = t.projectDescription || t.problemStatement || '';
    const intro = customIntro || `There's something deeply fulfilling about watching students grow from curious learners into confident builders. As we gear up for Project Space, I'm proud to introduce one of the teams I've had the privilege of mentoring.`;

    const techLine = techStack ? `\n\n💻 ${toBoldM('Tech Stack:')} ${techStack}` : '';
    const areaLine = projectArea ? `\n🎯 ${toBoldM('Domain:')} ${projectArea}` : '';
    const aiLine = (t.aiUsage === 'Yes' && t.aiCapabilities) ? `\n\n🤖 ${toBoldM('AI Approach:')} ${t.aiCapabilities}` : '';
    const teamSection = namesStr
      ? `\n\n👥 ${toBoldM('The Team Behind This:')}\nThroughout their course journey, I've had the privilege of guiding this talented group — ${namesStr}. Watching them evolve from learners to innovators has been one of the most rewarding experiences of my journey as a mentor.`
      : '';

    return `${toBoldM('Proud Mentor Moment — Introducing Team ' + (t.teamNumber || ''))}

${intro}

🚀 ${toBoldM(t.projectTitle || 'Our Project')}

${projectDesc}${techLine}${areaLine}${aiLine}${teamSection}

${toBoldM('𝗘𝘃𝗲𝗻𝘁 𝗛𝗶𝗴𝗵𝗹𝗶𝗴𝗵𝘁𝘀 — 𝗠𝗮𝘆 𝟲 𝘁𝗼 𝟭𝟮, 𝟮𝟬𝟮𝟲')}

${toBoldM('Project Space')} brings together 900+ students across 160 teams, exploring 7 cutting-edge technology stacks with an AI-first theme. For 7 days straight, teams will be working 24/7 on real-world projects — supported by dedicated mentors, hands-on learning, and the vibrant energy of Project Street. Proud to be part of this incredible initiative!

Powered by ${toBoldM('Technical Hub')}, led by CEO ${toBoldM('Babji Neelam')} Sir, and proudly hosted at ${toBoldM('Aditya University')}.

#${(t.technology || 'Technology').replace(/\s+/g, '')} #ProjectSpace #TechnicalHub #ArtificialIntelligence #Mentorship #Projects #Teamwork`;
  }

  async function handleReenableApprove(reqId) {
    setReenableProcessing(reqId)
    setReenableFlash(null)
    let approveSucceeded = false
    try {
      const r = await fetch('/api/linkedin-reenable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', requestId: reqId, mentorName: mentor?.name || 'Mentor' }) })
      if (r.ok) {
        approveSucceeded = true
      } else {
        setReenableFlash({ type: 'error', text: 'Failed to approve. Try again.' })
      }
    } catch {
      setReenableFlash({ type: 'error', text: 'Network error. Try again.' })
    }
    if (approveSucceeded) {
      // Optimistic update: immediately remove this request from local state
      setReenableByTeam(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(tn => {
          next[tn] = (next[tn] || []).filter(req => req.id !== reqId)
        })
        return next
      })
      // Try to refresh in background (refresh might fail on network glitch, but that's OK)
      try { await refreshReenableRequests() } catch {}
      setReenableFlash({ type: 'success', text: '✓ Approved! Student can now re-post on LinkedIn.' })
      setTimeout(() => { setReenableModal(null); setReenableFlash(null) }, 1500)
    }
    setReenableProcessing(null)
  }

  async function handleReenableDeny(reqId) {
    setReenableProcessing(reqId)
    setReenableFlash(null)
    let denySucceeded = false
    try {
      const r = await fetch('/api/linkedin-reenable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deny', requestId: reqId, mentorName: mentor?.name || 'Mentor' }) })
      if (r.ok) {
        denySucceeded = true
      } else {
        setReenableFlash({ type: 'error', text: 'Failed to deny. Try again.' })
      }
    } catch {
      setReenableFlash({ type: 'error', text: 'Network error. Try again.' })
    }
    if (denySucceeded) {
      // Optimistic update: immediately remove this request from local state
      setReenableByTeam(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(tn => {
          next[tn] = (next[tn] || []).filter(req => req.id !== reqId)
        })
        return next
      })
      try { await refreshReenableRequests() } catch {}
      setReenableFlash({ type: 'success', text: 'Request denied.' })
      setTimeout(() => { setReenableModal(null); setReenableFlash(null) }, 1500)
    }
    setReenableProcessing(null)
  }

  async function openMentorLinkedIn(t) {
    setLiTeam(t);
    setLiPost('⏳ Generating your personalized post...');
    setLiSuggestion('');
    setLiModal(true);

    try {
      const res = await fetch('/api/linkedin-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: t.projectTitle,
          technology: t.technology,
          projectArea: (t.projectArea || []).join(', '),
          studentName: mentor?.name || '',
          isMentor: true
        })
      });
      const data = await res.json();
      if (data?.intro) {
        setLiPost(generateMentorPost(t, data.intro));
      } else {
        setLiPost(generateMentorPost(t));
      }
    } catch {
      setLiPost(generateMentorPost(t));
    }
  }

  const [liConfirm, setLiConfirm] = useState(false)

  function postMentorLinkedIn() {
    if (!liTeam?.teamNumber) { alert('This team does not have a team number yet. Cannot share until registration is complete.'); return; }
    const showcaseUrl = `https://projectspace.technicalhub.io/showcase/${liTeam.teamNumber}`;
    const url = encodeURIComponent(showcaseUrl);
    // Detect mobile via user-agent — LinkedIn mobile share endpoint chokes on long text
    const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    // Sanitizer: strip URL-like tokens (http(s)://, www.X, "socket.io", "next.js" etc.) so LinkedIn doesn't auto-unfurl competing OG cards
    // Then preserve newlines through LinkedIn's URL by converting \n to U+2028 LINE SEPARATOR (LinkedIn preserves it; \n is stripped)
    function sanitizeForLinkedIn(str) {
      if (!str) return '';
      const stripped = str
        .replace(/https?:\/\/[^\s]+/gi, '')
        .replace(/\bwww\.[^\s]+/gi, '')
        .replace(/\b([a-zA-Z][\w-]*)\.(io|js|com|net|org|co|app|dev|ai|tech|cloud|me)\b/gi, '$1');
      // Convert paragraph breaks (\n\n) to double LINE SEPARATOR; single \n to single LINE SEPARATOR
      return stripped
        .replace(/\n\n+/g, '\u2028\u2028')
        .replace(/\n/g, '\u2028')
        .replace(/[ \t]+/g, ' ')
        .trim();
    }
    let textToSend = liPost || '';
    if (isMobileDevice) {
      // Short ~200-char post for mobile — newlines preserved via \u2028
      const projectName = liTeam?.projectTitle || 'our team\'s project';
      const teamNum = liTeam?.teamNumber || '';
      textToSend = `Mentoring Team ${teamNum} at Project Space — ${projectName}.\n\nProud to guide this team through their journey of building, learning, and growing.\n\n#ProjectSpace #Mentorship #AdityaUniversity`;
    }
    textToSend = sanitizeForLinkedIn(textToSend);
    // Clipboard backup with proper newlines (no \u2028 — Ctrl+V uses real \n)
    if (liPost && navigator.clipboard) {
      const clipText = liPost
        .replace(/https?:\/\/[^\s]+/gi, '')
        .replace(/\bwww\.[^\s]+/gi, '')
        .replace(/\b([a-zA-Z][\w-]*)\.(io|js|com|net|org|co|app|dev|ai|tech|cloud|me)\b/gi, '$1');
      navigator.clipboard.writeText(clipText).catch(() => {});
    }
    const text = encodeURIComponent(textToSend);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    setLiConfirm(true);
  }

  async function confirmMentorLinkedInPost() {
    try {
      await fetch('/api/linkedin-share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save', rollNumber: mentor?.email || '', teamNumber: liTeam?.teamNumber || '',
          technology: liTeam?.technology || '', mentorName: mentor?.name || '',
          postedByName: mentor?.name || '', postedByRole: 'mentor'
        })
      });
    } catch {}
    setLiModal(false);
    setLiConfirm(false);
  }

  // ── TEAM CARD with glow ──
  const TeamCard = ({t}) => {
    const glow = glowColors[t.technology] || '255,255,255'
    const color = solidColors[t.technology] || '#888'
    return (
      <div className={`tc ${expandedTeam===t.serialNumber?'tc-exp':''}`} style={{'--glow':glow,'--color':color}} onClick={()=>setExpandedTeam(expandedTeam===t.serialNumber?null:t.serialNumber)}>
        <div className="tc-hdr">
          <div className="tc-info">
            <div className="tc-title">{t.projectTitle || 'Untitled Project'}</div>
            <div className="tc-meta">#{t.serialNumber} {t.teamNumber ? `· ${t.teamNumber}` : ''} · {t.memberCount} members {t.mentorAssigned ? `· ${t.mentorAssigned}` : ''}</div>
          </div>
          <div className="tc-right">
            <span className={`tc-badge ${t.registered?'reg':'pen'}`}>{t.registered?'Registered':'Pending'}</span>
            <span className="tc-arrow">{expandedTeam===t.serialNumber?'▲':'▼'}</span>
          </div>
        </div>

        {/* Leader with phone */}
        <div className="tc-leader">
          <div className="tc-avatar" style={{background:`linear-gradient(135deg,rgba(${glow},.3),rgba(${glow},.1))`}}>{t.leaderName?.charAt(0)||'L'}</div>
          <div className="tc-leader-info">
            <span className="tc-leader-name">{t.leaderName} {I.star}</span>
            <span className="tc-leader-roll">{t.leaderRoll}</span>
          </div>
          <div className="tc-contact">
            {t.leaderEmail && <a href={`mailto:${t.leaderEmail}`} className="tc-email">{I.mail}</a>}
          </div>
        </div>

        {/* Expanded */}
        {expandedTeam===t.serialNumber && (
          <div className="tc-details">
            <div className="tc-grid">
              {t.projectDescription && <div className="tc-box"><div className="tc-box-l">Description</div><div className="tc-box-v">{t.projectDescription}</div></div>}
              {t.problemStatement && <div className="tc-box"><div className="tc-box-l">Problem Statement</div><div className="tc-box-v">{t.problemStatement}</div></div>}
              {t.projectArea?.length>0 && <div className="tc-box"><div className="tc-box-l">Project Area</div><div className="tc-tags">{t.projectArea.map(a=><span key={a} className="tc-tag" style={{color,borderColor:`rgba(${glow},.2)`,background:`rgba(${glow},.06)`}}>{a}</span>)}</div></div>}
              {t.techStack?.length>0 && <div className="tc-box"><div className="tc-box-l">Tech Stack</div><div className="tc-tags">{t.techStack.map(s=><span key={s} className="tc-tag" style={{color:'#10b981',borderColor:'rgba(16,185,129,.2)',background:'rgba(16,185,129,.06)'}}>{s}</span>)}</div></div>}
              {t.aiUsage==='Yes' && <div className="tc-box"><div className="tc-box-l">AI Usage</div><div className="tc-box-v">{t.aiCapabilities||'Yes'}</div>{t.aiTools?.length>0 && <div className="tc-tags" style={{marginTop:'6px'}}>{t.aiTools.map(a=><span key={a} className="tc-tag" style={{color:'#f21d32',borderColor:'rgba(242,29,50,.15)',background:'rgba(242,29,50,.06)'}}>{a}</span>)}</div>}</div>}
              {t.registeredAt && <div className="tc-box"><div className="tc-box-l">Registered</div><div className="tc-box-v">{new Date(t.registeredAt).toLocaleString('en-IN')}</div></div>}
            </div>
            {t.mentorAssigned === mentor?.name && (
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button onClick={e => {e.stopPropagation(); openMentorLinkedIn(t)}} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'linear-gradient(135deg,#0077b5,#00a0dc)',border:'none',color:'#fff',fontSize:'.72rem',fontWeight:700,letterSpacing:'.5px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',boxShadow:'0 4px 14px rgba(0,119,181,.3)',transition:'all .25s'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                Share on LinkedIn
              </button>
            </div>
            )}
            <div className="tc-box" style={{marginTop:'10px'}}><div className="tc-box-l">Members ({t.memberCount})</div>
              <div className="tc-members">{t.members?.map(m=>(
                <div key={m.rollNumber} className="tc-member">
                  <div className="tc-m-avatar" style={{background:m.isLeader?`linear-gradient(135deg,rgba(${glow},.4),rgba(${glow},.15))`:'rgba(255,255,255,.04)'}}>{m.name?.charAt(0)||'?'}</div>
                  <div className="tc-m-info"><div className="tc-m-name">{m.name} {m.isLeader && '★'}</div><div className="tc-m-roll">{m.rollNumber}</div></div>
                </div>
              ))}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#050008;overflow:hidden}
body{font-family:'DM Sans',sans-serif;color:#fff}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 15px rgba(var(--glow),.08),inset 0 0 15px rgba(var(--glow),.03)}50%{box-shadow:0 0 25px rgba(var(--glow),.15),inset 0 0 20px rgba(var(--glow),.06)}}

.md-layout{display:flex;height:100vh}

.md-sb{width:260px;height:100vh;background:rgba(8,4,14,.95);border-right:1px solid rgba(255,255,255,.04);display:flex;flex-direction:column;flex-shrink:0;z-index:50;transition:transform .3s}
.md-sb-hdr{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.04)}
.md-sb-logo{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.md-sb-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#faa000);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff}
.md-sb-title{font-family:'Orbitron',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.8)}
.md-sb-sub{font-size:.6rem;color:rgba(255,255,255,.3);margin-top:2px}
.md-sb-mentor{padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04)}
.md-sb-mname{font-size:.82rem;font-weight:600;color:#fff}
.md-sb-mtech{font-size:.68rem;color:rgba(255,255,255,.35);margin-top:2px}
.md-sb-nav{flex:1;padding:16px 12px;overflow-y:auto}
.md-sb-item{display:flex;align-items:center;gap:12px;padding:9px 16px;margin:2px 10px;border-radius:10px;font-size:.8rem;color:rgba(255,255,255,.45);cursor:pointer;transition:all .25s;margin-bottom:0;border:none;background:none;width:calc(100% - 20px);text-align:left;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden}
.md-sb-item svg{flex-shrink:0;width:34px;height:34px;padding:8px;border-radius:9px;transition:all .25s}
.md-sb-item:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.md-sb-item.on{color:#fff;background:linear-gradient(135deg,rgba(253,28,0,.12),rgba(250,160,0,.06));font-weight:600;position:relative}
.md-sb-item.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fd1c00,#faa000);box-shadow:0 0 8px rgba(253,28,0,.4)}
.md-sb-item.on svg{background:linear-gradient(135deg,#fd1c00,#faa000)!important;color:#fff!important;box-shadow:0 0 14px rgba(253,28,0,.2)}
.md-sb-item:hover{background:rgba(255,255,255,.03)}
.md-sb-item:hover svg{color:rgba(255,255,255,.65)}
.md-sb-item svg{flex-shrink:0}
.md-sb-footer{padding:16px 12px;border-top:1px solid rgba(255,255,255,.04)}
.md-sb-logout{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-size:.78rem;color:rgba(255,255,255,.35);cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif;transition:all .2s}
.md-sb-logout:hover{color:#ff6040;background:rgba(255,40,0,.04)}

.md-main{flex:1;height:100vh;overflow-y:auto;padding:28px;background:#050008}
.md-main::-webkit-scrollbar{width:6px}
.md-main::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:3px}
.md-page-title{font-family:'Orbitron',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:4px}
@keyframes pushBannerPulse{0%,100%{box-shadow:0 0 0 rgba(253,28,0,.0)}50%{box-shadow:0 0 20px rgba(253,28,0,.15)}}
.md-page-sub{font-size:.78rem;color:rgba(255,255,255,.35);margin-bottom:24px}

/* Stat cards with glow */
.md-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.md-stat{padding:20px 18px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);animation:fadeUp .4s ease both;position:relative;overflow:hidden}
.md-stat::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(var(--glow),.04) 0%,transparent 70%);pointer-events:none}
.md-stat-val{font-size:1.8rem;font-weight:800;line-height:1;position:relative}
.md-stat-label{font-size:.65rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;margin-top:6px;position:relative}

.md-prog{padding:18px 22px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:28px}
.md-prog-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.md-prog-title{font-size:.8rem;font-weight:600;color:rgba(255,255,255,.6)}
.md-prog-pct{font-size:1rem;font-weight:800;color:#fd1c00}
.md-prog-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.md-prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#faa000);transition:width 1s ease}

/* Team cards with glow rectangles */
.tc{border-radius:16px;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.04);padding:18px 20px;margin-bottom:12px;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;animation:fadeUp .4s ease both}
.tc::before{content:'';position:absolute;inset:0;border-radius:16px;opacity:0;transition:opacity .3s;box-shadow:0 0 20px rgba(var(--glow),.1),inset 0 0 20px rgba(var(--glow),.03)}
.tc:hover::before{opacity:1}
.tc:hover{border-color:rgba(var(--glow),.15)}
.tc-exp{border-color:rgba(var(--glow),.2)!important}
.tc-exp::before{opacity:1;animation:glowPulse 3s ease-in-out infinite}
.tc-hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.tc-title{font-size:.9rem;font-weight:600;color:#fff}
.tc-meta{font-size:.68rem;color:rgba(255,255,255,.3);margin-top:4px}
.tc-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
.tc-badge{font-size:.65rem;padding:4px 12px;border-radius:8px;font-weight:500}
.tc-badge.reg{background:rgba(74,222,128,.06);color:#4ade80;border:1px solid rgba(74,222,128,.12)}
.tc-badge.pen{background:rgba(238,167,39,.06);color:#EEA727;border:1px solid rgba(238,167,39,.12)}
.tc-arrow{font-size:.7rem;color:rgba(255,255,255,.25)}
.tc-leader{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.03)}
.tc-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0}
.tc-leader-info{flex:1;min-width:0}
.tc-leader-name{font-size:.76rem;font-weight:500;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:4px}
.tc-leader-roll{font-size:.62rem;color:rgba(255,255,255,.25);display:block}
.tc-contact{display:flex;align-items:center;gap:8px;flex-shrink:0}
.tc-phone{display:flex;align-items:center;gap:4px;font-size:.68rem;color:#4ade80;text-decoration:none;padding:4px 10px;border-radius:8px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.1);transition:all .2s}
.tc-phone:hover{background:rgba(74,222,128,.12)}
.tc-email{display:flex;align-items:center;padding:4px 8px;border-radius:8px;color:rgba(255,255,255,.4);background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);text-decoration:none;transition:all .2s}
.tc-email:hover{color:#3b82f6;background:rgba(59,130,246,.06)}

.tc-details{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.04)}
.tc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tc-box{padding:12px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03)}
.tc-box-l{font-size:.58rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.tc-box-v{font-size:.74rem;color:rgba(255,255,255,.6);line-height:1.5}
.tc-tags{display:flex;flex-wrap:wrap;gap:4px}
.tc-tag{font-size:.65rem;padding:3px 8px;border-radius:6px;border:1px solid}
.tc-members{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-top:8px}
.tc-member{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.03)}
.tc-m-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0}
.tc-m-info{flex:1;min-width:0}
.tc-m-name{font-size:.74rem;color:rgba(255,255,255,.7)}
.tc-m-roll{font-size:.6rem;color:rgba(255,255,255,.2)}
.tc-m-phone{color:rgba(255,255,255,.3);padding:4px;border-radius:6px;transition:all .2s;text-decoration:none}
.tc-m-phone:hover{color:#4ade80;background:rgba(74,222,128,.06)}

.md-settings-card{max-width:500px;padding:24px;border-radius:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:16px}
.md-set-title{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:6px}
.md-set-desc{font-size:.74rem;color:rgba(255,255,255,.35);margin-bottom:16px}
.md-set-input{width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#fff;font-size:.85rem;outline:none;font-family:'DM Sans',sans-serif;margin-bottom:10px}
.md-set-btn{padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#fd1c00,#fd3a20);border:none;color:#fff;font-size:.82rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif}
.md-set-btn:disabled{opacity:.5}
.md-set-msg{margin-top:10px;font-size:.76rem;padding:8px 12px;border-radius:8px}

.md-mobile-hdr{display:none;position:fixed;top:0;left:0;right:0;z-index:100;padding:12px 16px;background:rgba(5,0,8,.95);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.04);align-items:center;justify-content:space-between}
.md-hamburger{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;padding:4px 8px}
.md-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}
.md-overlay.show{display:block}
body.sb-open{overflow:hidden}

@media(max-width:900px){
  .md-sb{position:fixed;left:0;top:0;transform:translateX(-100%);z-index:60}
  .md-sb.open{transform:translateX(0)}
  .md-mobile-hdr{display:flex}
  .md-overlay.show{display:block}
  .md-main{padding:16px;padding-top:70px}
  .md-stats{grid-template-columns:repeat(2,1fr)}
  .tc-grid{grid-template-columns:1fr}
  .tc-contact{flex-direction:column;align-items:flex-end;gap:4px}
  .tc-members{grid-template-columns:1fr}
}
@media(max-width:480px){.md-stats{grid-template-columns:repeat(2,1fr)}}

/* ═══ Mentor Project Details ═══ */
.mpd-wrap{animation:fadeUp .5s ease both}
.mpd-main{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
.mpd-showcase{background:#0c0614;border:1px solid rgba(255,255,255,.06);border-radius:18px;overflow:hidden}
.mpd-hdr{padding:20px 28px;background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 50%,#0a0a0a 100%);position:relative;overflow:hidden}
.mpd-hdr::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(253,28,0,.08) 50%,rgba(238,167,39,.12) 55%,transparent 70%);background-size:200% 100%;animation:mpdShine 4s linear infinite;pointer-events:none}
@keyframes mpdShine{0%{background-position:-100% 0}100%{background-position:200% 0}}
.mpd-hdr-inner{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.mpd-hdr-left{flex:1;min-width:0}
.mpd-meta{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.mpd-badge{padding:6px 14px;border-radius:8px;background:linear-gradient(135deg,rgba(253,28,0,.2),rgba(238,167,39,.15));border:1px solid rgba(253,28,0,.35);font-size:.66rem;font-weight:800;letter-spacing:2px;color:#fff;font-family:'DM Sans',sans-serif}
.mpd-li-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:linear-gradient(135deg,#0077b5,#00a0dc);border:none;color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:'DM Sans',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,119,181,.3);transition:all .25s}
.mpd-li-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,119,181,.5)}
.mpd-title{font-family:'Orbitron',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;line-height:1.15;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;text-shadow:0 2px 20px rgba(238,167,39,.3)}
.mpd-sub{font-size:.8rem;color:rgba(255,255,255,.65);font-family:'DM Sans',sans-serif}
.mpd-mentor-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0}
.mpd-mentor-photo{width:72px;height:72px;border-radius:50%;overflow:hidden;box-shadow:0 0 8px rgba(238,167,39,.8),0 0 14px rgba(74,222,128,.6);position:relative}
.mpd-mentor-photo img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.mpd-mentor-fb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:#EEA727;background:rgba(238,167,39,.08);border-radius:50%}
.mpd-mentor-name{font-family:'Orbitron',sans-serif;font-size:.58rem;font-weight:700;color:rgba(255,255,255,.85);text-align:center;text-transform:uppercase;letter-spacing:1px}
.mpd-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:2px;background:#0c0614}
.mpd-mcol{position:relative;aspect-ratio:3/4;overflow:hidden;background:#10233d;transition:all .4s}
.mpd-mcol:hover{transform:translateY(-4px);z-index:2;box-shadow:0 12px 32px rgba(0,0,0,.4)}
.mpd-mcol::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.5) 70%,rgba(0,0,0,.85) 100%);pointer-events:none;z-index:2}
.mpd-mimg{width:100%;height:100%;object-fit:cover;display:block}
.mpd-mfb{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:rgba(255,255,255,.5);background:#10233d}
.mpd-mname{position:absolute;left:8px;bottom:10px;z-index:3}
.mpd-mname-big{font-family:'Orbitron',sans-serif;font-size:.5rem;font-weight:800;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.95);letter-spacing:1.5px;text-transform:uppercase;writing-mode:vertical-lr;transform:rotate(180deg);line-height:1}
.mpd-mroll{position:absolute;bottom:0;right:6px;z-index:5;font-family:'Orbitron',sans-serif;font-size:.45rem;color:rgba(255,255,255,.85);font-weight:700;letter-spacing:1.5px;text-shadow:0 2px 10px rgba(0,0,0,1)}
.mpd-star{position:absolute;top:8px;left:8px;z-index:4;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#EEA727,#fd1c00);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(238,167,39,.5)}
.mpd-info{padding:22px 28px;display:flex;flex-direction:column;gap:14px}
.mpd-card{padding:16px 18px;border-radius:12px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06)}
.mpd-card.ai{background:rgba(242,29,50,.04);border-color:rgba(242,29,50,.15)}
.mpd-card-t{font-size:.58rem;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px}
.mpd-card-v{font-size:.82rem;color:rgba(255,255,255,.85);line-height:1.6;font-weight:500}
.mpd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mpd-chips{display:flex;flex-wrap:wrap;gap:6px}
.mpd-chip{padding:5px 12px;border-radius:8px;font-size:.68rem;font-weight:500}
.mpd-chip.area{background:rgba(238,167,39,.08);border:1px solid rgba(238,167,39,.25);color:#EEA727}
.mpd-chip.tech{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);color:#34d399}
.mpd-chip.ait{background:rgba(242,29,50,.08);border:1px solid rgba(242,29,50,.25);color:#ff6b7a}
.mpd-empty{padding:60px 20px;text-align:center;color:rgba(255,255,255,.2);font-size:.78rem}
.mpd-sidebar{background:rgba(12,6,20,.6);border:1px solid rgba(255,255,255,.06);border-radius:18px;display:flex;flex-direction:column;overflow:hidden;max-height:calc(100vh - 80px);position:sticky;top:0;align-self:start}
.mpd-sb-hdr{padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.05)}
.mpd-sb-title{font-size:.72rem;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:1.5px;text-transform:uppercase}
.mpd-list{flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:6px}
.mpd-list::-webkit-scrollbar{width:4px}.mpd-list::-webkit-scrollbar-thumb{background:rgba(253,28,0,.15);border-radius:4px}
@keyframes mpdReenablePulse{0%,100%{box-shadow:0 0 0 rgba(238,167,39,.0)}50%{box-shadow:0 0 12px rgba(238,167,39,.3)}}
.mpd-item{padding:12px 14px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);cursor:pointer;transition:all .2s;position:relative}
.mpd-item:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);transform:translateX(2px)}
.mpd-item.on{background:linear-gradient(135deg,rgba(253,28,0,.1),rgba(238,167,39,.05));border-color:rgba(253,28,0,.25);box-shadow:0 2px 16px rgba(253,28,0,.15),0 0 24px rgba(253,28,0,.08),inset 0 0 12px rgba(253,28,0,.04);animation:mpdGlow 2s ease-in-out infinite}
@keyframes mpdGlow{0%,100%{box-shadow:0 2px 16px rgba(253,28,0,.15),0 0 24px rgba(253,28,0,.08),inset 0 0 12px rgba(253,28,0,.04)}50%{box-shadow:0 4px 22px rgba(253,28,0,.25),0 0 32px rgba(238,167,39,.12),inset 0 0 16px rgba(253,28,0,.06)}}
.mpd-item.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;border-radius:0 3px 3px 0;background:linear-gradient(180deg,#fd1c00,#EEA727)}
.mpd-item-r1{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}
.mpd-item-r2{display:flex;align-items:center;justify-content:space-between;gap:6px}
.mpd-item-title{font-size:.76rem;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
.mpd-item-num{font-size:.6rem;font-weight:700;color:rgba(253,28,0,.85);letter-spacing:.5px;flex-shrink:0}
.mpd-item-mentor{font-size:.58rem;color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.mpd-item-st{font-size:.52rem;font-weight:600;padding:2px 8px;border-radius:5px}
.mpd-item-st.reg{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.12)}
.mpd-item-st.pen{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.12)}
@media(max-width:1100px){.mpd-main{grid-template-columns:1fr}.mpd-sidebar{max-height:400px;order:-1}}
@media(max-width:768px){.mpd-hdr{padding:20px 16px}.mpd-hdr-inner{flex-direction:column;align-items:flex-start;gap:16px}.mpd-title{font-size:1rem}.mpd-info{padding:16px}.mpd-grid2{grid-template-columns:1fr}.mpd-strip{grid-template-columns:repeat(3,1fr)}.mpd-sidebar{max-height:350px}}

.rv-section{animation:fadeUp .4s ease both}
.rv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.rv-stat{padding:18px 16px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);text-align:center}
.rv-stat-val{font-size:1.6rem;font-weight:800;line-height:1}
.rv-stat-lb{font-size:.6rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;font-weight:600}
.rv-empty{text-align:center;padding:40px;color:rgba(255,255,255,.2);font-size:.8rem}
.rv-card{padding:18px 20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);margin-bottom:12px;transition:all .2s;animation:fadeUp .4s ease both}
.rv-card:hover{border-color:rgba(255,255,255,.08)}
.rv-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.rv-team{font-size:1rem;font-weight:700;color:#fd1c00}
.rv-stage{font-size:.82rem;font-weight:600;color:#fff}
.rv-stage-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;font-size:.62rem;font-weight:600;background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.15)}
.rv-meta{font-size:.68rem;color:rgba(255,255,255,.3);margin-top:4px}
.rv-project{font-size:.74rem;color:rgba(255,255,255,.45);margin-top:6px}
.rv-actions{display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.04)}
.rv-btn{padding:9px 20px;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .25s;border:1px solid;display:flex;align-items:center;gap:6px}
.rv-btn:disabled{opacity:.4;cursor:not-allowed}
.rv-btn.approve{color:#4ade80;background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.18)}
.rv-btn.approve:hover:not(:disabled){background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.3);transform:translateY(-1px);box-shadow:0 4px 16px rgba(74,222,128,.12)}
.rv-btn.reject{color:#ff6040;background:rgba(255,96,64,.06);border-color:rgba(255,96,64,.15)}
.rv-btn.reject:hover:not(:disabled){background:rgba(255,96,64,.1);border-color:rgba(255,96,64,.25)}
.rv-progress{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.rv-team-prog{padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);display:flex;align-items:center;gap:16px}
.rv-team-prog-info{flex:1;min-width:0}
.rv-team-prog-name{font-size:.8rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rv-team-prog-sub{font-size:.62rem;color:rgba(255,255,255,.25);margin-top:2px}
.rv-team-prog-bar{flex:0 0 120px;height:6px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden}
.rv-team-prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#4ade80);transition:width .6s ease}
.rv-team-prog-pct{font-size:.82rem;font-weight:800;width:45px;text-align:right;flex-shrink:0}
.lb-section{animation:fadeUp .4s ease both}
.lb-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.lb-stat{padding:16px 14px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.04);text-align:center}
.lb-stat-val{font-size:1.4rem;font-weight:800;line-height:1}
.lb-stat-lb{font-size:.55rem;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;font-weight:600}
.lb-table{width:100%;border-collapse:separate;border-spacing:0 5px}
.lb-table th{text-align:left;padding:7px 12px;font-size:.55rem;font-weight:600;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:1.5px}
.lb-table td{padding:10px 12px;background:rgba(255,255,255,.015);border-top:1px solid rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.02);font-size:.76rem;color:rgba(255,255,255,.6)}
.lb-table tr td:first-child{border-left:1px solid rgba(255,255,255,.02);border-radius:10px 0 0 10px}
.lb-table tr td:last-child{border-right:1px solid rgba(255,255,255,.02);border-radius:0 10px 10px 0}
.lb-table tr:hover td{background:rgba(255,255,255,.03)}
.lb-rank{font-weight:800;font-size:.85rem}
.lb-rank.gold{color:#f59e0b}.lb-rank.silver{color:#94a3b8}.lb-rank.bronze{color:#c68a5b}
.lb-bar{width:80px;height:5px;border-radius:3px;background:rgba(255,255,255,.06);overflow:hidden;display:inline-block;vertical-align:middle;margin-right:6px}
.lb-bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#fd1c00,#4ade80)}
.lb-notif-wrap{position:relative;display:inline-block;margin-left:12px}
.lb-notif-btn{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.4);position:relative}
.lb-notif-btn:hover{background:rgba(255,255,255,.06);color:#fff}
.lb-notif-badge{position:absolute;top:3px;right:3px;min-width:14px;height:14px;border-radius:7px;background:#fd1c00;font-size:8px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid #050008}
.lb-notif-dd{position:absolute;top:42px;right:0;width:300px;background:#13101a;border:1px solid rgba(255,255,255,.08);border-radius:12px;z-index:100;box-shadow:0 12px 40px rgba(0,0,0,.6);max-height:320px;overflow-y:auto}
.lb-notif-dd-hdr{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.06);font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between}
.lb-notif-dd-mark{font-size:10px;color:#fd1c00;cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif}
.lb-notif-item{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.03)}
.lb-notif-item.unread{background:rgba(253,28,0,.03)}
.lb-notif-item-t{font-size:11px;font-weight:600;color:#fff;margin-bottom:2px}
.lb-notif-item-m{font-size:10px;color:rgba(255,255,255,.3);line-height:1.4}
.lb-notif-item-time{font-size:9px;color:rgba(255,255,255,.15);margin-top:3px}
.rv-modal-bg{position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(5,0,8,.88);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(6px)}
.rv-modal{background:#13101a;border:1px solid rgba(255,96,64,.15);border-radius:18px;padding:28px;width:92%;max-width:400px;animation:fadeUp .3s ease}
.rv-modal-title{font-size:15px;font-weight:600;color:#fff;margin-bottom:8px}
.rv-modal-desc{font-size:12px;color:rgba(255,255,255,.35);margin-bottom:16px}
.rv-modal-ta{width:100%;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#fff;font-size:.82rem;font-family:'DM Sans',sans-serif;outline:none;resize:vertical;min-height:80px}
.rv-modal-ta:focus{border-color:rgba(255,96,64,.3)}
.rv-modal-actions{display:flex;gap:10px;margin-top:16px;justify-content:flex-end}
.rv-modal-btn{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:10px 22px;border-radius:10px;cursor:pointer;border:none;transition:all .2s}
.rv-modal-btn.cancel{color:rgba(255,255,255,.35);background:transparent;border:1px solid rgba(255,255,255,.08)}
.rv-modal-btn.cancel:hover{border-color:rgba(255,255,255,.2);color:#fff}
.rv-modal-btn.reject{color:#fff;background:linear-gradient(135deg,#ff4040,#c41600);box-shadow:0 4px 14px rgba(255,64,64,.2)}
.rv-modal-btn.reject:hover{transform:translateY(-1px)}
.rv-modal-btn:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:900px){.rv-stats{grid-template-columns:1fr 1fr}.lb-stats{grid-template-columns:repeat(2,1fr)}.lb-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;font-size:.7rem}.lb-table td,.lb-table th{padding:8px 10px;white-space:nowrap}.rv-team-prog{flex-wrap:wrap;gap:8px}.rv-team-prog-bar{flex:1 1 100%}}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Orbitron:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div className="md-layout">
        <div className="md-mobile-hdr">
          <button className="md-hamburger" onClick={()=>{setSidebarOpen(true);document.body.classList.add('sb-open')}}>☰</button>
          <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'.7rem',fontWeight:700,letterSpacing:'2px'}}>MENTOR PANEL</div>
          <button className="md-hamburger" onClick={handleLogout}>{I.logout}</button>
        </div>

        <div className={`md-overlay ${sidebarOpen?'show':''}`} onClick={()=>{setSidebarOpen(false);document.body.classList.remove('sb-open')}}/>

        <div className={`md-sb ${sidebarOpen?'open':''}`}>
          <div className="md-sb-hdr">
            <div className="md-sb-logo"><div className="md-sb-icon">PS</div><div><div className="md-sb-title">MENTOR PANEL</div><div className="md-sb-sub">Project Space 2026</div></div></div>
            {mentor && <div className="md-sb-mentor"><div className="md-sb-mname">{mentor.name}</div><div className="md-sb-mtech">{mentor.technology}</div></div>}
          </div>
          <div className="md-sb-nav">
            {navItems.map(n => <button key={n.id} className={`md-sb-item ${activePage===n.id?'on':''}`} onClick={()=>{setActivePage(n.id);setSidebarOpen(false);document.body.classList.remove('sb-open')}}>{n.icon}<span>{n.label}</span></button>)}
          </div>
          <div className="md-sb-footer"><button className="md-sb-logout" onClick={handleLogout}>{I.logout} Logout</button></div>
        </div>

        <div className="md-main">
          {!pushEnabled && (
            <div style={{marginBottom:16,padding:'14px 18px',borderRadius:14,background:'linear-gradient(135deg,rgba(253,28,0,.08),rgba(238,167,39,.05))',border:'1px solid rgba(253,28,0,.25)',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap',animation:'pushBannerPulse 2.5s ease-in-out infinite'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'rgba(253,28,0,.12)',border:'1px solid rgba(253,28,0,.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fd1c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <div style={{flex:1,minWidth:240}}>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.88rem',fontWeight:700,color:'#fd1c00',lineHeight:1.2,marginBottom:4}}>Enable Push Notifications — Required</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.72rem',color:'rgba(255,255,255,.6)',lineHeight:1.45}}>Get instant alerts when your teams submit stage reviews or LinkedIn re-enable requests.</div>
              </div>
              <button onClick={handleEnablePush} disabled={pushEnabling} style={{padding:'10px 20px',borderRadius:10,background:'linear-gradient(135deg,#fd1c00,#c41600)',border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.74rem',fontWeight:700,cursor:pushEnabling?'wait':'pointer',opacity:pushEnabling?.7:1,boxShadow:'0 4px 14px rgba(253,28,0,.3)',flexShrink:0}}>
                {pushEnabling ? 'Enabling...' : '🔔 Enable Now'}
              </button>
            </div>
          )}
          {loading && <div style={{textAlign:'center',padding:'60px',color:'rgba(255,255,255,.3)'}}>Loading...</div>}

          {!loading && data && (<>
            {/* OVERVIEW */}
            {activePage==='overview' && (<>
              <div className="md-page-title">OVERVIEW</div>
              <div className="md-page-sub">Your team registration progress</div>
              <div className="md-stats">
                <div className="md-stat" style={{'--glow':'253,28,0'}}><div className="md-stat-val" style={{color:'#fd1c00'}}>{stats.totalTeams}</div><div className="md-stat-label">Total Teams</div></div>
                <div className="md-stat" style={{'--glow':'74,222,128',animationDelay:'.1s'}}><div className="md-stat-val" style={{color:'#4ade80'}}>{stats.registeredCount}</div><div className="md-stat-label">Registered</div></div>
                <div className="md-stat" style={{'--glow':'238,167,39',animationDelay:'.2s'}}><div className="md-stat-val" style={{color:'#EEA727'}}>{stats.pendingCount}</div><div className="md-stat-label">Pending</div></div>
                <div className="md-stat" style={{'--glow':'59,130,246',animationDelay:'.3s'}}><div className="md-stat-val" style={{color:'#3b82f6'}}>{stats.totalMembers}</div><div className="md-stat-label">Members</div></div>
              </div>
              <div className="md-prog"><div className="md-prog-hdr"><span className="md-prog-title">Registration Progress</span><span className="md-prog-pct">{stats.progressPercent}%</span></div><div className="md-prog-bar"><div className="md-prog-fill" style={{width:`${stats.progressPercent}%`}}/></div></div>
              <div style={{fontSize:'.82rem',fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:'12px'}}>Your Teams</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
              {myTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
              </div>
            </>)}

            {/* REGISTERED */}
            {activePage==='registered' && (<>
              <div className="md-page-title">REGISTERED TEAMS</div>
              <div className="md-page-sub">{registeredTeams.length} teams completed</div>
              {registeredTeams.length===0 && <div style={{padding:'40px',textAlign:'center',color:'rgba(255,255,255,.2)'}}>No teams registered yet</div>}
              {registeredTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* PENDING */}
            {activePage==='pending' && (<>
              <div className="md-page-title">PENDING TEAMS</div>
              <div className="md-page-sub">{pendingTeams.length} teams haven't registered</div>
              {pendingTeams.length===0 && <div style={{padding:'40px',textAlign:'center',color:'#4ade80',fontWeight:600}}>All teams registered!</div>}
              {pendingTeams.map(t=><TeamCard key={t.serialNumber} t={t}/>)}
            </>)}

            {/* TECH PROJECTS */}
          

           {/* MY TEAMS — Project Details Style */}
            {activePage==='allteams' && (()=>{
              const sel = getTeam(myTeams, selectedMyTeam)
              const isOwn = true
              return <div className="mpd-wrap">
                <div className="mpd-main">
                  <div className="mpd-showcase">
                    {!sel ? <div className="mpd-empty">Select a team from the sidebar</div> : <>
                      <div className="mpd-hdr">
                        <div className="mpd-hdr-inner">
                          <div className="mpd-hdr-left">
                            <div className="mpd-meta">
                              <span className="mpd-badge">{sel.teamNumber||`#${sel.serialNumber}`}</span>
                              <span className="mpd-badge" style={{borderColor:(solidColors[sel.technology]||'#fd1c00')+'60',background:`${solidColors[sel.technology]||'#fd1c00'}25`}}>{sel.technology}</span>
                              <span className={`tc-badge ${sel.registered?'reg':'pen'}`}>{sel.registered?'Registered':'Pending'}</span>
                              {isOwn && sel.teamNumber && <button onClick={e=>{e.stopPropagation();openMentorLinkedIn(sel)}} className="mpd-li-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>Share</button>}
                            </div>
                            <div className="mpd-title">{sel.projectTitle||'Untitled Project'}</div>
                            <div className="mpd-sub">{sel.memberCount} Members · {sel.mentorAssigned||'No mentor'}</div>
                          </div>
                          {data?.mentor && <div className="mpd-mentor-wrap">
                            <div className="mpd-mentor-photo">{data.mentor.image_url?<img src={data.mentor.image_url} alt={data.mentor.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>:null}<div className="mpd-mentor-fb" style={{display:data.mentor.image_url?'none':'flex'}}>{(data.mentor.name||'?').charAt(0)}</div></div>
                            <div className="mpd-mentor-name">{data.mentor.name}</div>
                          </div>}
                        </div>
                      </div>
                      {sel.members?.length>0&&<div className="mpd-strip">{sel.members.map((m,i)=><div key={m.rollNumber||i} className="mpd-mcol">{m.isLeader&&<div className="mpd-star"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>}{m.imageUrl?<img className="mpd-mimg" src={m.imageUrl} alt={m.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>:null}<div className="mpd-mfb" style={{display:m.imageUrl?'none':'flex'}}>{(m.name||'?').charAt(0)}</div><div className="mpd-mname"><div className="mpd-mname-big">{(m.name||m.rollNumber).split(' ').slice(0,2).join(' ')}</div></div><div className="mpd-mroll">{m.rollNumber}</div></div>)}</div>}
                      <div className="mpd-info">
                        {sel.projectDescription&&<div className="mpd-card"><div className="mpd-card-t">Project Description</div><div className="mpd-card-v">{sel.projectDescription}</div></div>}
                        {sel.problemStatement&&<div className="mpd-card"><div className="mpd-card-t">Problem Statement</div><div className="mpd-card-v">{sel.problemStatement}</div></div>}
                        <div className="mpd-grid2">
                          {sel.projectArea?.length>0&&<div className="mpd-card"><div className="mpd-card-t">Project Area</div><div className="mpd-chips">{sel.projectArea.map((a,i)=><span key={i} className="mpd-chip area">{a}</span>)}</div></div>}
                          {sel.techStack?.length>0&&<div className="mpd-card"><div className="mpd-card-t">Tech Stack</div><div className="mpd-chips">{sel.techStack.map((t,i)=><span key={i} className="mpd-chip tech">{t}</span>)}</div></div>}
                        </div>
                        {sel.aiUsage==='Yes'&&<div className="mpd-card ai"><div className="mpd-card-t">AI Integration</div>{sel.aiCapabilities&&<div className="mpd-card-v" style={{marginBottom:10}}>{sel.aiCapabilities}</div>}{sel.aiTools?.length>0&&<div className="mpd-chips">{sel.aiTools.map((t,i)=><span key={i} className="mpd-chip ait">{t}</span>)}</div>}</div>}
                      </div>
                    </>}
                  </div>
                  <div className="mpd-sidebar">
                    <div className="mpd-sb-hdr">
                      <div className="mpd-sb-title">My Teams ({myTeams.length})</div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        <span style={{fontSize:'.6rem',color:'#4ade80',padding:'3px 8px',borderRadius:6,background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.15)'}}>{registeredTeams.length} Reg</span>
                        {pendingTeams.length>0&&<span style={{fontSize:'.6rem',color:'#EEA727',padding:'3px 8px',borderRadius:6,background:'rgba(238,167,39,.08)',border:'1px solid rgba(238,167,39,.15)'}}>{pendingTeams.length} Pen</span>}
                      </div>
                    </div>
                    <div className="mpd-list">{myTeams.map(p=>{
                      const reqs = reenableByTeam[p.teamNumber] || []
                      return <div key={p.serialNumber} className={`mpd-item ${selectedMyTeam===p.serialNumber?'on':''}`} onClick={()=>setSelectedMyTeam(p.serialNumber)} style={{position:'relative'}}>
                        <div className="mpd-item-r1"><span className="mpd-item-title">{p.projectTitle||'Untitled'}</span><span className="mpd-item-num">{p.teamNumber||`#${p.serialNumber}`}</span></div>
                        <div className="mpd-item-r2"><span className="mpd-item-mentor">{p.memberCount} members</span><span className={`mpd-item-st ${p.registered?'reg':'pen'}`}>{p.registered?'Registered':'Pending'}</span></div>
                        {reqs.length > 0 && <button onClick={e=>{e.stopPropagation();setReenableModal({team:p,reqs})}} style={{marginTop:8,width:'100%',padding:'6px 10px',borderRadius:8,background:'linear-gradient(135deg,rgba(238,167,39,.15),rgba(253,28,0,.08))',border:'1px solid rgba(238,167,39,.3)',color:'#EEA727',fontSize:'.62rem',fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase',cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6,animation:'mpdReenablePulse 2s ease-in-out infinite'}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                          {reqs.length} Re-enable {reqs.length===1?'Request':'Requests'}
                        </button>}
                      </div>
                    })}</div>
                  </div>
                </div>
              </div>
            })()}

            {/* TECH TEAMS — Project Details Style */}
            {activePage==='techprojects' && (()=>{
              const techTeamsList = techProjects.teams || []
              const sel = getTeam(techTeamsList, selectedTechTeam)
              return <div className="mpd-wrap">
                <div className="mpd-main">
                  <div className="mpd-showcase">
                    {!sel ? <div className="mpd-empty">Select a team from the sidebar</div> : <>
                      <div className="mpd-hdr">
                        <div className="mpd-hdr-inner">
                          <div className="mpd-hdr-left">
                            <div className="mpd-meta">
                              <span className="mpd-badge">{sel.teamNumber||`#${sel.serialNumber}`}</span>
                              <span className="mpd-badge" style={{borderColor:(solidColors[sel.technology]||'#fd1c00')+'60',background:`${solidColors[sel.technology]||'#fd1c00'}25`}}>{sel.technology}</span>
                              <span className={`tc-badge ${sel.registered?'reg':'pen'}`}>{sel.registered?'Registered':'Pending'}</span>
                              {sel.mentorAssigned===mentor?.name && sel.teamNumber && <button onClick={e=>{e.stopPropagation();openMentorLinkedIn(sel)}} className="mpd-li-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>Share</button>}
                            </div>
                            <div className="mpd-title">{sel.projectTitle||'Untitled Project'}</div>
                            <div className="mpd-sub">{sel.memberCount} Members · {sel.mentorAssigned||'No mentor'}</div>
                          </div>
                          {sel.mentorAssigned && <div className="mpd-mentor-wrap">
                            <div className="mpd-mentor-photo">{sel.mentorAssigned===mentor?.name && data?.mentor?.image_url ? <img src={data.mentor.image_url} alt={sel.mentorAssigned} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/> : null}<div className="mpd-mentor-fb" style={{display:(sel.mentorAssigned===mentor?.name && data?.mentor?.image_url)?'none':'flex'}}>{(sel.mentorAssigned||'?').charAt(0)}</div></div>
                            <div className="mpd-mentor-name">{sel.mentorAssigned}</div>
                          </div>}
                        </div>
                      </div>
                      {sel.members?.length>0&&<div className="mpd-strip">{sel.members.map((m,i)=><div key={m.rollNumber||i} className="mpd-mcol">{m.isLeader&&<div className="mpd-star"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>}{m.imageUrl?<img className="mpd-mimg" src={m.imageUrl} alt={m.name} onError={e=>{e.target.style.display='none';e.target.nextElementSibling.style.display='flex'}}/>:null}<div className="mpd-mfb" style={{display:m.imageUrl?'none':'flex'}}>{(m.name||'?').charAt(0)}</div><div className="mpd-mname"><div className="mpd-mname-big">{(m.name||m.rollNumber).split(' ').slice(0,2).join(' ')}</div></div><div className="mpd-mroll">{m.rollNumber}</div></div>)}</div>}
                      <div className="mpd-info">
                        {sel.projectDescription&&<div className="mpd-card"><div className="mpd-card-t">Project Description</div><div className="mpd-card-v">{sel.projectDescription}</div></div>}
                        {sel.problemStatement&&<div className="mpd-card"><div className="mpd-card-t">Problem Statement</div><div className="mpd-card-v">{sel.problemStatement}</div></div>}
                        <div className="mpd-grid2">
                          {sel.projectArea?.length>0&&<div className="mpd-card"><div className="mpd-card-t">Project Area</div><div className="mpd-chips">{sel.projectArea.map((a,i)=><span key={i} className="mpd-chip area">{a}</span>)}</div></div>}
                          {sel.techStack?.length>0&&<div className="mpd-card"><div className="mpd-card-t">Tech Stack</div><div className="mpd-chips">{sel.techStack.map((t,i)=><span key={i} className="mpd-chip tech">{t}</span>)}</div></div>}
                        </div>
                        {sel.aiUsage==='Yes'&&<div className="mpd-card ai"><div className="mpd-card-t">AI Integration</div>{sel.aiCapabilities&&<div className="mpd-card-v" style={{marginBottom:10}}>{sel.aiCapabilities}</div>}{sel.aiTools?.length>0&&<div className="mpd-chips">{sel.aiTools.map((t,i)=><span key={i} className="mpd-chip ait">{t}</span>)}</div>}</div>}
                      </div>
                    </>}
                  </div>
                  <div className="mpd-sidebar">
                    <div className="mpd-sb-hdr">
                      <div className="mpd-sb-title">Tech Teams ({techTeamsList.length})</div>
                    </div>
                    <div className="mpd-list">{techTeamsList.map(p=><div key={p.serialNumber} className={`mpd-item ${selectedTechTeam===p.serialNumber?'on':''}`} onClick={()=>setSelectedTechTeam(p.serialNumber)}><div className="mpd-item-r1"><span className="mpd-item-title">{p.projectTitle||'Untitled'}</span><span className="mpd-item-num">{p.teamNumber||`#${p.serialNumber}`}</span></div><div className="mpd-item-r2"><span className="mpd-item-mentor">{p.mentorAssigned||'—'}</span><span className={`mpd-item-st ${p.registered?'reg':'pen'}`}>{p.registered?'Reg':'Pen'}</span></div></div>)}</div>
                  </div>
                </div>
              </div>
            })()}

            {/* PROJECT STATUS */}
            {activePage==='reviews' && (<div className="rv-section">
              <div className="md-page-title">PROJECT STATUS</div>
              <div className="md-page-sub" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>Review submissions from your teams</span>
                <div className="lb-notif-wrap"><div className="lb-notif-btn" onClick={()=>setShowReviewNotif(!showReviewNotif)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>{reviewUnread>0&&<div className="lb-notif-badge">{reviewUnread}</div>}</div>
                {showReviewNotif&&<div className="lb-notif-dd" onClick={e=>e.stopPropagation()}><div className="lb-notif-dd-hdr"><span>Notifications</span>{reviewUnread>0&&<button className="lb-notif-dd-mark" onClick={async()=>{await fetch('/api/milestones/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'mark-all-read',type:'mentor',email:mentor?.email})});setReviewUnread(0);setReviewNotifs(p=>p.map(n=>({...n,read:true})))}}>Mark all read</button>}</div>{reviewNotifs.length===0?<div style={{padding:20,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.15)'}}>No notifications</div>:reviewNotifs.map(n=><div key={n.id} className={`lb-notif-item ${!n.read?'unread':''}`}><div className="lb-notif-item-t">{n.title}</div><div className="lb-notif-item-m">{n.message}</div><div className="lb-notif-item-time">{new Date(n.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div>)}</div>}</div>
              </div>

              <div className="rv-stats"><div className="rv-stat"><div className="rv-stat-val" style={{color:'#EEA727'}}>{reviews.stats?.pending_reviews||0}</div><div className="rv-stat-lb">Pending</div></div><div className="rv-stat"><div className="rv-stat-val" style={{color:'#4ade80'}}>{reviews.stats?.total_completed_stages||0}</div><div className="rv-stat-lb">Approved</div></div><div className="rv-stat"><div className="rv-stat-val" style={{color:'#3b82f6'}}>{reviews.stats?.total_teams||0}</div><div className="rv-stat-lb">Teams</div></div></div>

              {reviewsLoading&&<div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,.2)'}}>Loading...</div>}
              {!reviewsLoading&&reviews.pending?.length===0&&<div className="rv-empty">No pending reviews — all caught up!</div>}

              {reviews.pending?.length>0&&<div style={{overflowX:'auto'}}>
                <table className="lb-table" style={{minWidth:700}}>
                  <thead><tr><th>Team</th><th>Project</th><th>Stage</th><th>Submitted By</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{reviews.pending.map((p,i)=><tr key={p.id||i}>
                    <td style={{fontWeight:700,color:'#fd1c00'}}>{p.team_number}</td>
                    <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'rgba(255,255,255,.6)'}}>{p.project_title||'—'}</td>
                    <td><span style={{fontSize:'.65rem',padding:'3px 10px',borderRadius:6,background:'rgba(238,167,39,.08)',color:'#EEA727',border:'1px solid rgba(238,167,39,.15)'}}>S-{p.stage_number}: {p.stage_name}</span></td>
                    <td style={{fontSize:'.72rem',color:'rgba(255,255,255,.5)'}}>{p.submitted_by_name||p.submitted_by_roll}</td>
                    <td style={{fontSize:'.68rem',color:'rgba(255,255,255,.3)'}}>{p.submitted_at?new Date(p.submitted_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</td>
                    <td><span style={{fontSize:'.62rem',padding:'3px 10px',borderRadius:6,background:'rgba(238,167,39,.08)',color:'#EEA727',border:'1px solid rgba(238,167,39,.15)'}}>In Review</span></td>
                    <td style={{display:'flex',gap:6}}><button className="rv-btn approve" style={{padding:'6px 14px',fontSize:'.7rem'}} disabled={actionLoading===`${p.team_number}-${p.stage_number}`} onClick={()=>handleMilestoneAction(p.team_number,p.stage_number,'approve')}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>{actionLoading===`${p.team_number}-${p.stage_number}`?'...':'Approve'}</button><button className="rv-btn reject" style={{padding:'6px 14px',fontSize:'.7rem'}} disabled={actionLoading===`${p.team_number}-${p.stage_number}`} onClick={()=>setRejectModal(p)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Reject</button></td>
                  </tr>)}</tbody>
                </table>
              </div>}

              {/* Team Progress */}
              {reviews.teams?.length>0&&<><div style={{fontSize:'.82rem',fontWeight:700,color:'rgba(255,255,255,.5)',marginTop:28,marginBottom:12}}>Team Progress</div><div className="rv-progress">{reviews.teams.map(t=><div key={t.team_number} className="rv-team-prog"><div style={{fontWeight:700,color:'#fd1c00',fontSize:'.8rem',minWidth:60}}>{t.team_number}</div><div className="rv-team-prog-info"><div className="rv-team-prog-name">{t.project_title||'Untitled'}</div><div className="rv-team-prog-sub">{t.completed}/7 done · {t.in_review} reviewing</div></div><div className="rv-team-prog-bar"><div className="rv-team-prog-fill" style={{width:`${t.percent}%`}}/></div><div className="rv-team-prog-pct" style={{color:t.percent>=70?'#4ade80':t.percent>=40?'#EEA727':'rgba(255,255,255,.3)'}}>{t.percent}%</div></div>)}</div></>}
            </div>)}

            {/* LINKEDIN STATS */}
            {activePage==='linkedin' && (<div className="li-mentor-section">
              <style>{`
.li-mentor-section{animation:fadeUp .4s ease both}
.li-m-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:22px}
.li-m-stat{padding:18px 20px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);position:relative}
.li-m-stat-lb{font-size:.58rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:8px}
.li-m-stat-v{font-family:'Orbitron',sans-serif;font-size:1.8rem;font-weight:800;line-height:1}
.li-m-stat-sub{font-size:.62rem;color:rgba(255,255,255,.35);margin-top:4px}
.li-m-bar{margin-top:10px;height:5px;border-radius:3px;background:rgba(255,255,255,.05);overflow:hidden}
.li-m-bar-f{height:100%;border-radius:3px;transition:width .6s}
.li-m-title{font-size:.82rem;font-weight:700;color:#fff;margin-top:24px;margin-bottom:12px;font-family:'Orbitron',sans-serif;letter-spacing:1.5px}
.li-m-team{padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);margin-bottom:8px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.li-m-team-hdr{flex:1;min-width:180px}
.li-m-team-num{font-family:'Orbitron',sans-serif;font-size:.9rem;font-weight:800;color:#fd1c00}
.li-m-team-title{font-size:.74rem;color:rgba(255,255,255,.55);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px}
.li-m-team-pbar{flex:1;max-width:220px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;min-width:100px}
.li-m-team-pfill{height:100%;border-radius:3px;transition:width .5s}
.li-m-team-count{font-family:'Orbitron',sans-serif;font-size:.95rem;font-weight:800;min-width:50px;text-align:right}
.li-m-pill{padding:3px 10px;border-radius:6px;font-size:.58rem;font-weight:700;letter-spacing:.5px}
.li-m-pill.done{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.2)}
.li-m-pill.partial{background:rgba(238,167,39,.08);color:#EEA727;border:1px solid rgba(238,167,39,.2)}
.li-m-pill.none{background:rgba(255,255,255,.03);color:rgba(255,255,255,.3);border:1px solid rgba(255,255,255,.08)}
.li-m-sub{margin-top:10px;padding:10px 14px;border-radius:10px;background:rgba(0,0,0,.2)}
.li-m-member{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:.72rem;border-bottom:1px solid rgba(255,255,255,.03)}
.li-m-member:last-child{border-bottom:none}
.li-m-member-name{flex:1;color:rgba(255,255,255,.7)}
.li-m-member-roll{color:rgba(255,255,255,.3);font-size:.62rem;margin-right:10px}
.li-m-expand-btn{background:none;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.5);padding:4px 10px;border-radius:6px;font-size:.6rem;font-weight:600;cursor:pointer;font-family:'DM Sans,sans-serif'}
.li-m-expand-btn:hover{color:#fff;border-color:rgba(255,255,255,.2)}
              `}</style>
              <div className="md-page-title">LINKEDIN STATS</div>
              <div className="md-page-sub">Your teams&apos; LinkedIn posting progress</div>

              {(() => {
                const teams = myTeams || []
                // Compute overall stats
                let totalMembers = 0, postedMembers = 0, fullyPostedTeams = 0
                const teamData = []
                teams.forEach(t => {
                  const shares = (liAnalytics?.byTeam?.[t.teamNumber]) || { members: [], posted: [], pending: [] }
                  const total = shares.members.length
                  const posted = shares.posted.length
                  totalMembers += total
                  postedMembers += posted
                  if (total > 0 && posted >= total) fullyPostedTeams++
                  teamData.push({ ...t, total, posted, members: shares.members, postedSet: new Set(shares.posted), pending: shares.pending })
                })
                const pct = totalMembers > 0 ? Math.round(postedMembers/totalMembers*100) : 0
                const teamPct = teams.length > 0 ? Math.round(fullyPostedTeams/teams.length*100) : 0
                return <>
                  <div className="li-m-grid">
                    <div className="li-m-stat"><div className="li-m-stat-lb">Total Members</div><div className="li-m-stat-v" style={{color:'#fd1c00'}}>{totalMembers}</div><div className="li-m-stat-sub">Across {teams.length} teams</div></div>
                    <div className="li-m-stat"><div className="li-m-stat-lb">Members Posted</div><div className="li-m-stat-v" style={{color:'#4ade80'}}>{postedMembers}</div><div className="li-m-bar"><div className="li-m-bar-f" style={{width:`${pct}%`,background:'#4ade80'}}/></div></div>
                    <div className="li-m-stat"><div className="li-m-stat-lb">Members Pending</div><div className="li-m-stat-v" style={{color:'#EEA727'}}>{totalMembers - postedMembers}</div><div className="li-m-stat-sub">Not yet posted</div></div>
                    <div className="li-m-stat"><div className="li-m-stat-lb">Teams Fully Posted</div><div className="li-m-stat-v" style={{color:'#a78bfa'}}>{fullyPostedTeams}<span style={{fontSize:'.75rem',color:'rgba(255,255,255,.3)',marginLeft:4}}>/ {teams.length}</span></div><div className="li-m-bar"><div className="li-m-bar-f" style={{width:`${teamPct}%`,background:'#a78bfa'}}/></div></div>
                  </div>
                  <div className="li-m-title">TEAM-WISE BREAKDOWN</div>
                  {teamData.length === 0 && <div style={{padding:40,textAlign:'center',color:'rgba(255,255,255,.2)'}}>No teams assigned</div>}
                  {teamData.map(t => {
                    const tpct = t.total > 0 ? Math.round(t.posted/t.total*100) : 0
                    const status = t.total === 0 ? 'none' : t.posted === 0 ? 'none' : t.posted >= t.total ? 'done' : 'partial'
                    const isExpanded = liExpandedTeam === t.teamNumber
                    return <div key={t.serialNumber}>
                      <div className="li-m-team">
                        <div className="li-m-team-hdr">
                          <div className="li-m-team-num">{t.teamNumber || `#${t.serialNumber}`}</div>
                          <div className="li-m-team-title">{t.projectTitle || t.leaderName || '—'}</div>
                        </div>
                        <div className="li-m-team-pbar"><div className="li-m-team-pfill" style={{width:`${tpct}%`,background:status==='done'?'#4ade80':status==='partial'?'#EEA727':'#444'}}/></div>
                        <div className="li-m-team-count" style={{color:status==='done'?'#4ade80':status==='partial'?'#EEA727':'rgba(255,255,255,.3)'}}>{t.posted}/{t.total}</div>
                        <span className={`li-m-pill ${status}`}>{status==='done'?'✓ All Posted':status==='partial'?`${tpct}%`:'Not Started'}</span>
                        <button className="li-m-expand-btn" onClick={()=>setLiExpandedTeam(isExpanded ? null : t.teamNumber)}>{isExpanded ? 'Hide' : 'Details'}</button>
                      </div>
                      {isExpanded && t.members.length > 0 && (
                        <div className="li-m-sub">
                          <div style={{fontSize:'.6rem',color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'1px',fontWeight:700,marginBottom:6}}>Members ({t.total})</div>
                          {t.members.map(m => {
                            const posted = t.postedSet.has(m.rollNumber)
                            return <div key={m.rollNumber} className="li-m-member">
                              <span style={{width:8,height:8,borderRadius:'50%',background:posted?'#4ade80':'rgba(255,255,255,.15)',flexShrink:0}}/>
                              <span className="li-m-member-name">{m.name || m.rollNumber}</span>
                              <span className="li-m-member-roll">{m.rollNumber}</span>
                              <span className={`li-m-pill ${posted?'done':'none'}`} style={{minWidth:70,textAlign:'center'}}>{posted?'Posted':'Pending'}</span>
                            </div>
                          })}
                        </div>
                      )}
                    </div>
                  })}
                </>
              })()}
            </div>)}

            {/* LEADERBOARD */}
            {activePage==='leaderboard' && (<div className="lb-section">
              <div className="md-page-title">LEADERBOARD</div>
              <div className="md-page-sub">All teams ranked by project completion</div>
              <div className="lb-stats"><div className="lb-stat"><div className="lb-stat-val" style={{color:'#fd1c00'}}>{leaderboard.stats?.total_teams||0}</div><div className="lb-stat-lb">Teams</div></div><div className="lb-stat"><div className="lb-stat-val" style={{color:'#4ade80'}}>{leaderboard.stats?.teams_all_done||0}</div><div className="lb-stat-lb">All Done</div></div><div className="lb-stat"><div className="lb-stat-val" style={{color:'#EEA727'}}>{leaderboard.stats?.avg_progress||0}%</div><div className="lb-stat-lb">Avg Progress</div></div><div className="lb-stat"><div className="lb-stat-val" style={{color:'#3b82f6'}}>{leaderboard.stats?.total_completed_stages||0}</div><div className="lb-stat-lb">Stages Done</div></div></div>
              {lbLoading&&<div style={{textAlign:'center',padding:30,color:'hsla(0, 0%, 100%, 0.20)'}}>Loading...</div>}
              {!lbLoading&&<table className="lb-table"><thead><tr><th>Rank</th><th>Team</th><th>Project</th><th>Tech</th><th>Progress</th><th>Credits</th></tr></thead><tbody>{(leaderboard.leaderboard||[]).map(t=><tr key={t.team_number}><td><span className={`lb-rank ${t.rank===1?'gold':t.rank===2?'silver':t.rank===3?'bronze':''}`}>#{t.rank}</span></td><td style={{fontWeight:700,color:'#fd1c00'}}>{t.team_number}</td><td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.project_title||'—'}</td><td><span style={{fontSize:'.62rem',padding:'2px 8px',borderRadius:5,background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.5)'}}>{t.technology}</span></td><td><div className="lb-bar"><div className="lb-bar-fill" style={{width:`${t.percent}%`}}/></div><span style={{fontSize:'.72rem',fontWeight:700,color:t.percent>=70?'#4ade80':t.percent>=40?'#EEA727':'rgba(255,255,255,.3)'}}>{t.completed_stages}/7</span></td><td style={{fontWeight:700,color:'#EEA727'}}>{t.total_credits}</td></tr>)}</tbody></table>}
            </div>)}
            {/* SETTINGS */}
            {activePage==='settings' && (<>
              <div className="md-page-title">SETTINGS</div>
              <div className="md-page-sub">Manage your account</div>
              <div className="md-settings-card">
                <div className="md-set-title">Profile</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
                  <div className="tc-box"><div className="tc-box-l">Name</div><div className="tc-box-v">{mentor?.name}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Email</div><div className="tc-box-v">{mentor?.email}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Technology</div><div className="tc-box-v">{mentor?.technology}</div></div>
                  <div className="tc-box"><div className="tc-box-l">Password</div><div className="tc-box-v" style={{color:mentor?.hasPassword?'#4ade80':'#EEA727'}}>{mentor?.hasPassword?'Set ✓':'Not set'}</div></div>
                </div>
              </div>
              <div className="md-settings-card">
                <div className="md-set-title">{mentor?.hasPassword?'Change Password':'Set Password'}</div>
                <div className="md-set-desc">{mentor?.hasPassword?'Update your password':'Set a password for quick login'}</div>
                <input className="md-set-input" type="password" placeholder="New password (min 6 chars)" value={newPass} onChange={e=>setNewPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSetPassword()}/>
                <button className="md-set-btn" onClick={handleSetPassword} disabled={passLoading||!newPass}>{passLoading?'Saving...':'Set Password'}</button>
                {passMsg && <div className="md-set-msg" style={{background:passMsg.includes('set')?'rgba(74,222,128,.06)':'rgba(255,40,0,.06)',color:passMsg.includes('set')?'#4ade80':'#ff6040'}}>{passMsg}</div>}
              </div>
            </>)}
          </>)}
        </div>
      </div>

      {rejectModal && (
        <div className="rv-modal-bg" onClick={()=>setRejectModal(null)}>
          <div className="rv-modal" onClick={e=>e.stopPropagation()}>
            <div className="rv-modal-title">Reject Stage {rejectModal.stage_number}: {rejectModal.stage_name}?</div>
            <div className="rv-modal-desc">Team {rejectModal.team_number} will be notified to revise.</div>
            <textarea className="rv-modal-ta" placeholder="Add feedback (optional)..." value={rejectComment} onChange={e=>setRejectComment(e.target.value)}/>
            <div className="rv-modal-actions">
              <button className="rv-modal-btn cancel" onClick={()=>{setRejectModal(null);setRejectComment('')}}>Cancel</button>
              <button className="rv-modal-btn reject" disabled={actionLoading} onClick={()=>handleMilestoneAction(rejectModal.team_number,rejectModal.stage_number,'reject',rejectComment)}>{actionLoading?'Rejecting...':'Reject Stage'}</button>
            </div>
          </div>
        </div>
      )}

      {reenableModal && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(5,0,8,.94)',zIndex:999999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,boxSizing:'border-box'}} onClick={()=>{if(!reenableProcessing) setReenableModal(null)}}>
          <div style={{background:'#13101a',border:'1px solid rgba(238,167,39,.25)',borderRadius:18,width:'100%',maxWidth:600,maxHeight:'85vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 30px 100px rgba(0,0,0,.7)'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#EEA727,#fd1c00)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.92rem',fontWeight:700,color:'#fff'}}>LinkedIn Re-enable Requests</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.65rem',color:'rgba(255,255,255,.35)',marginTop:2}}>{reenableModal.team.projectTitle} · {reenableModal.team.teamNumber}</div>
              </div>
              <button onClick={()=>setReenableModal(null)} disabled={!!reenableProcessing} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',color:'rgba(255,255,255,.5)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{padding:'16px 22px',overflowY:'auto',flex:1}}>
              {reenableFlash && (
                <div style={{marginBottom:14,padding:'11px 14px',borderRadius:10,background:reenableFlash.type==='success'?'rgba(74,222,128,.08)':'rgba(253,28,0,.08)',border:`1px solid ${reenableFlash.type==='success'?'rgba(74,222,128,.3)':'rgba(253,28,0,.3)'}`,color:reenableFlash.type==='success'?'#4ade80':'#ff6040',fontSize:'.78rem',fontWeight:600,fontFamily:'DM Sans,sans-serif',animation:'fadeUp .3s ease'}}>
                  {reenableFlash.text}
                </div>
              )}
              {(reenableByTeam[reenableModal.team.teamNumber] || []).length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:'rgba(255,255,255,.3)',fontSize:'.82rem'}}>✓ All requests processed</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {(reenableByTeam[reenableModal.team.teamNumber] || []).map(req => (
                    <div key={req.id} style={{padding:'14px 16px',borderRadius:12,background:'rgba(238,167,39,.04)',border:'1px solid rgba(238,167,39,.15)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,gap:8,flexWrap:'wrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                          <div style={{width:32,height:32,borderRadius:10,background:'rgba(238,167,39,.12)',border:'1px solid rgba(238,167,39,.3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#EEA727',fontWeight:700,fontSize:'.85rem',flexShrink:0}}>{(req.requester_name || '?').charAt(0).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.82rem',fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.requester_name || req.roll_number}</div>
                            <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.62rem',color:'rgba(255,255,255,.35)',marginTop:1}}>{req.roll_number} · {new Date(req.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                        </div>
                      </div>
                      {req.reason && <div style={{padding:'8px 12px',borderRadius:8,background:'rgba(0,0,0,.25)',border:'1px solid rgba(255,255,255,.04)',fontSize:'.74rem',color:'rgba(255,255,255,.75)',lineHeight:1.5,marginBottom:10,fontStyle:'italic'}}>"{req.reason}"</div>}
                      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                        <button onClick={()=>handleReenableDeny(req.id)} disabled={!!reenableProcessing} style={{padding:'8px 14px',borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.55)',fontFamily:'DM Sans,sans-serif',fontSize:'.68rem',fontWeight:600,cursor:reenableProcessing?'wait':'pointer',opacity:reenableProcessing===req.id?.5:1}}>Deny</button>
                        <button onClick={()=>handleReenableApprove(req.id)} disabled={!!reenableProcessing} style={{padding:'8px 18px',borderRadius:8,background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.68rem',fontWeight:700,cursor:reenableProcessing?'wait':'pointer',opacity:reenableProcessing===req.id?.6:1,boxShadow:'0 4px 14px rgba(74,222,128,.25)',display:'flex',alignItems:'center',gap:6}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Approve & Re-enable
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {liModal && liTeam && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(5,0,8,.94)',zIndex:999999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,boxSizing:'border-box'}} onClick={() => setLiModal(false)}>
          <div style={{background:'#13101a',border:'1px solid rgba(0,119,181,.25)',borderRadius:18,width:'100%',maxWidth:720,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 30px 100px rgba(0,0,0,.7)',position:'relative'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1px solid rgba(255,255,255,.05)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#0077b5,#00a0dc)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </div>
                <div>
                  <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.92rem',fontWeight:700,color:'#fff'}}>Share on LinkedIn</div>
                  <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.65rem',color:'rgba(255,255,255,.35)',marginTop:2}}>Introduce your team to your professional network</div>
                </div>
              </div>
              <button onClick={() => setLiModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',color:'rgba(255,255,255,.5)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{padding:'20px 22px'}}>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.58rem',color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'1.5px',fontWeight:700,marginBottom:8}}>Your Post (Editable)</div>
              <textarea value={liPost} onChange={e => setLiPost(e.target.value)} style={{width:'100%',minHeight:340,padding:14,borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.8rem',lineHeight:1.5,resize:'vertical',outline:'none',boxSizing:'border-box'}} placeholder="Your LinkedIn post will appear here..."/>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:'.58rem',color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:'1.5px',fontWeight:700,margin:'16px 0 8px'}}>Add Note</div>
              <div style={{display:'flex',gap:8}}>
                <input type="text" value={liSuggestion} onChange={e => setLiSuggestion(e.target.value)} onKeyDown={e => {if(e.key==='Enter'&&liSuggestion.trim()){setLiPost(liPost+'\n\n'+liSuggestion);setLiSuggestion('')}}} placeholder="e.g. Mention a specific achievement..." style={{flex:1,padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.78rem',outline:'none',boxSizing:'border-box'}}/>
                <button onClick={() => {if(liSuggestion.trim()){setLiPost(liPost+'\n\n'+liSuggestion);setLiSuggestion('')}}} style={{padding:'10px 18px',borderRadius:10,background:'rgba(0,119,181,.1)',border:'1px solid rgba(0,119,181,.25)',color:'#00a0dc',fontFamily:'DM Sans,sans-serif',fontSize:'.72rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>+ Add</button>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',padding:'16px 22px',borderTop:'1px solid rgba(255,255,255,.05)',alignItems:'center'}}>
              {!liConfirm ? <>
              <button onClick={() => openMentorLinkedIn(liTeam)} style={{padding:'10px 18px',borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.7)',fontFamily:'DM Sans,sans-serif',fontSize:'.74rem',fontWeight:600,cursor:'pointer'}}>🔄 Regenerate</button>
              <button onClick={postMentorLinkedIn} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:10,background:'linear-gradient(135deg,#0077b5,#00a0dc)',border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.78rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,119,181,.3)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                Post to LinkedIn
              </button>
              </> : <>
              <div style={{flex:1,fontSize:'.78rem',color:'#4ade80',fontWeight:600}}>Did you post it on LinkedIn?</div>
              <button onClick={()=>{setLiModal(false);setLiConfirm(false)}} style={{padding:'10px 18px',borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.5)',fontFamily:'DM Sans,sans-serif',fontSize:'.74rem',fontWeight:600,cursor:'pointer'}}>Not Yet</button>
              <button onClick={confirmMentorLinkedInPost} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 22px',borderRadius:10,background:'linear-gradient(135deg,#4ade80,#22c55e)',border:'none',color:'#fff',fontFamily:'DM Sans,sans-serif',fontSize:'.78rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(74,222,128,.3)'}}>✓ Yes, I Posted!</button>
              </>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}