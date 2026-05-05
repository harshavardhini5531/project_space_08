'use client'
import { useState } from 'react'

// ═══ EVENT SCHEDULE DATA — 7 days ═══
const SCHEDULE = [
  {
    day: 1, date: '06 May 2026', dateLong: 'Tuesday, 6th May 2026',
    title: 'Inauguration & Welcome',
    subtitle: 'The journey begins — check in, meet your team, and dive into Project Space.',
    accent: '#fd1c00',
    events: [
      { time: '9:00 AM', endTime: '', label: 'Hostel Check-in', desc: 'Arrive at allocated hostel rooms by 9:00 AM. Settle in before kickoff.', kind: 'logistics', icon: 'home' },
      { time: '9:00 AM', endTime: '10:00 AM', label: 'Welcome Kit Distribution', desc: 'Collect your Project Space welcome kit, ID card, and event badge.', kind: 'logistics', icon: 'gift' },
      { time: '10:00 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Inauguration ceremony and project space orientation.', kind: 'session', icon: 'sun' },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Light refreshments served.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch break at the dining hall.', kind: 'meal', icon: 'utensils' },
      { time: '1:30 PM', endTime: '5:00 PM', label: 'Afternoon Session', desc: 'Team formation, project ideation, and mentor allocation.', kind: 'session', icon: 'users' },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '4:30 PM', endTime: '6:30 PM', label: 'Project Street', desc: 'Outdoor project showcase and team networking on Project Street.', kind: 'highlight', icon: 'sparkles' },
      { time: '7:00 PM', endTime: '8:00 PM', label: 'Dinner', desc: 'Dinner at the dining hall.', kind: 'meal', icon: 'utensils' },
      { time: '8:00 PM', endTime: '12:00 AM', label: 'Night Session', desc: 'Late-night collaborative coding and project building.', kind: 'session', icon: 'moon' },
      { time: '9:30 PM', endTime: '', label: 'Snacks Break', desc: 'Late-night refreshments to keep you fueled.', kind: 'break', icon: 'coffee' },
    ]
  },
  {
    day: 2, date: '07 May 2026', dateLong: 'Wednesday, 7th May 2026',
    title: 'Build Day · Robotics Insights',
    subtitle: 'Industry guest from Japan joins us — start building your prototypes.',
    accent: '#EEA727',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Continued project development with mentor guidance.', kind: 'session', icon: 'sun' },
      { time: '10:00 AM', endTime: '11:00 AM', label: 'Guest Interaction', desc: 'Druvith Kumar Rao — Robotics Engineer, Nagano Sankoh Ltd, Japan.', kind: 'guest', icon: 'mic', guests: ['Druvith Kumar Rao · Robotics Engineer, Nagano Sankoh Ltd, Japan'] },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Light refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch at dining hall.', kind: 'meal', icon: 'utensils' },
      { time: '1:30 PM', endTime: '5:00 PM', label: 'Afternoon Session', desc: 'Hands-on development sprint.', kind: 'session', icon: 'sun' },
      { time: '2:00 PM', endTime: '3:00 PM', label: 'Guest Interaction', desc: 'Druvith Kumar Rao — Robotics Engineer, Nagano Sankoh Ltd, Japan.', kind: 'guest', icon: 'mic', guests: ['Druvith Kumar Rao · Robotics Engineer, Nagano Sankoh Ltd, Japan'] },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '4:30 PM', endTime: '6:30 PM', label: 'Project Street', desc: 'Project showcase and peer interaction.', kind: 'highlight', icon: 'sparkles' },
      { time: '7:00 PM', endTime: '8:00 PM', label: 'Dinner', desc: 'Dinner break.', kind: 'meal', icon: 'utensils' },
      { time: '8:00 PM', endTime: '12:00 AM', label: 'Night Session', desc: 'Continued building and team collaboration.', kind: 'session', icon: 'moon' },
      { time: '9:30 PM', endTime: '', label: 'Snacks Break', desc: 'Late-night fuel.', kind: 'break', icon: 'coffee' },
    ]
  },
  {
    day: 3, date: '08 May 2026', dateLong: 'Thursday, 8th May 2026',
    title: 'Industry Stories Day',
    subtitle: 'ZOHO, ServiceNow, and global robotics — three perspectives in one day.',
    accent: '#10b981',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Project development continues.', kind: 'session', icon: 'sun' },
      { time: '10:00 AM', endTime: '11:00 AM', label: 'Guest Interactions', desc: 'Three industry leaders share their journeys.', kind: 'guest', icon: 'mic', guests: ['Sankar · Software Engineer, ZOHO', 'Venkat · Associate Technical Support Engineer, ServiceNow', 'Druvith Kumar Rao · Robotics Engineer, Nagano Sankoh Ltd, Japan'] },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Light refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch at dining hall.', kind: 'meal', icon: 'utensils' },
      { time: '2:00 PM', endTime: '3:00 PM', label: 'Afternoon Guest Session', desc: 'Continued industry interactions.', kind: 'guest', icon: 'mic', guests: ['Sankar · Software Engineer, ZOHO', 'Venkat · Associate Technical Support Engineer, ServiceNow', 'Druvith Kumar Rao · Robotics Engineer, Nagano Sankoh Ltd, Japan'] },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '4:30 PM', endTime: '6:30 PM', label: 'Project Street', desc: 'Project showcase and networking.', kind: 'highlight', icon: 'sparkles' },
      { time: '7:00 PM', endTime: '8:00 PM', label: 'Dinner', desc: 'Dinner break.', kind: 'meal', icon: 'utensils' },
      { time: '8:00 PM', endTime: '12:00 AM', label: 'Night Session', desc: 'Late-night sprint with team.', kind: 'session', icon: 'moon' },
      { time: '9:30 PM', endTime: '', label: 'Snacks Break', desc: 'Late-night fuel.', kind: 'break', icon: 'coffee' },
    ]
  },
  {
    day: 4, date: '09 May 2026', dateLong: 'Friday, 9th May 2026',
    title: 'Power Day · Industry Marathon',
    subtitle: 'Six guests, two sessions — Qualcomm, Dentsu, AWS, ServiceNow, SOTI, and Oracle.',
    accent: '#7B2FBE',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Project development with mentors.', kind: 'session', icon: 'sun' },
      { time: '10:00 AM', endTime: '11:00 AM', label: 'Morning Guest Block', desc: 'Five industry experts share insights.', kind: 'guest', icon: 'mic', guests: ['Sri Vidya · Software Engineer, Qualcomm', 'Mohit · Head of Engineering, Dentsu Global Services', 'Saikiran · Cloud Database Engineer, Amazon Web Services', 'Shaik Muzna Jawhar · Associate Technical Support Engineer, ServiceNow', 'Varun · Associate Software Developer, SOTI'] },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch break.', kind: 'meal', icon: 'utensils' },
      { time: '2:00 PM', endTime: '3:00 PM', label: 'Afternoon Guest Block', desc: 'Six industry leaders, including a Cloud Director from Oracle.', kind: 'guest', icon: 'mic', guests: ['Arun · Cloud Director, Oracle', 'Sri Vidya · Software Engineer, Qualcomm', 'Mohit · Head of Engineering, Dentsu Global Services', 'Saikiran · Cloud Database Engineer, Amazon Web Services', 'Shaik Muzna Jawhar · Associate Technical Support Engineer, ServiceNow', 'Varun · Associate Software Developer, SOTI'] },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '4:30 PM', endTime: '6:30 PM', label: 'Project Street', desc: 'Project showcase.', kind: 'highlight', icon: 'sparkles' },
      { time: '7:00 PM', endTime: '8:00 PM', label: 'Dinner', desc: 'Dinner break.', kind: 'meal', icon: 'utensils' },
      { time: '8:00 PM', endTime: '12:00 AM', label: 'Night Session', desc: 'Late-night build sprint.', kind: 'session', icon: 'moon' },
      { time: '9:30 PM', endTime: '', label: 'Snacks Break', desc: 'Late-night fuel.', kind: 'break', icon: 'coffee' },
    ]
  },
  {
    day: 5, date: '10 May 2026', dateLong: 'Saturday, 10th May 2026',
    title: 'Showcase Eve',
    subtitle: 'Final touches on your project, then the first round of presentations at the gallery.',
    accent: '#3b82f6',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Final project polishing with mentors.', kind: 'session', icon: 'sun' },
      { time: '10:00 AM', endTime: '11:00 AM', label: 'Guest Interaction', desc: 'Industry insights from DeltaX and Wissda.', kind: 'guest', icon: 'mic', guests: ['Omteja · Associate Product Engineer, DeltaX', 'Kowshik · ServiceNow Developer, Wissda'] },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch break.', kind: 'meal', icon: 'utensils' },
      { time: '1:30 PM', endTime: '5:00 PM', label: 'Afternoon Session', desc: 'Final preparations for presentations.', kind: 'session', icon: 'sun' },
      { time: '2:00 PM', endTime: '3:00 PM', label: 'Guest Interaction', desc: 'Continued mentorship and Q&A with industry guests.', kind: 'guest', icon: 'mic', guests: ['Omteja · Associate Product Engineer, DeltaX', 'Kowshik · ServiceNow Developer, Wissda'] },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '6:00 PM', endTime: '', label: 'Gathering at Gallery', desc: 'All teams gather at the presentation gallery.', kind: 'highlight', icon: 'sparkles' },
      { time: '6:00 PM', endTime: '8:00 PM', label: 'Presentations at Gallery', desc: 'Round 1 — first set of teams present their projects.', kind: 'highlight', icon: 'sparkles' },
      { time: '8:00 PM', endTime: '9:00 PM', label: 'Dinner at Gallery', desc: 'Networking dinner at the presentation gallery.', kind: 'meal', icon: 'utensils' },
      { time: '9:00 PM', endTime: '', label: 'Presentations Conclusion', desc: 'Wrap-up of the day\u2019s presentations.', kind: 'session', icon: 'flag' },
      { time: '11:30 PM', endTime: '', label: 'Return to Hostels', desc: 'Head back to hostels.', kind: 'logistics', icon: 'home' },
    ]
  },
  {
    day: 6, date: '11 May 2026', dateLong: 'Sunday, 11th May 2026',
    title: 'Showcase Day · Round 2',
    subtitle: 'Second round of project presentations at the gallery.',
    accent: '#ec4899',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Last-minute preparation for evening presentations.', kind: 'session', icon: 'sun' },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch break.', kind: 'meal', icon: 'utensils' },
      { time: '1:30 PM', endTime: '5:00 PM', label: 'Afternoon Session', desc: 'Final rehearsals and refinement.', kind: 'session', icon: 'sun' },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '6:00 PM', endTime: '', label: 'Gathering at Gallery', desc: 'All teams gather at the gallery.', kind: 'highlight', icon: 'sparkles' },
      { time: '6:00 PM', endTime: '8:00 PM', label: 'Presentations at Gallery', desc: 'Round 2 — second set of teams present.', kind: 'highlight', icon: 'sparkles' },
      { time: '8:00 PM', endTime: '9:00 PM', label: 'Dinner at Gallery', desc: 'Networking dinner.', kind: 'meal', icon: 'utensils' },
      { time: '9:00 PM', endTime: '', label: 'Presentations Conclusion', desc: 'Wrap-up of the day\u2019s presentations.', kind: 'session', icon: 'flag' },
      { time: '11:30 PM', endTime: '', label: 'Return to Hostels', desc: 'Head back to hostels.', kind: 'logistics', icon: 'home' },
    ]
  },
  {
    day: 7, date: '12 May 2026', dateLong: 'Monday, 12th May 2026',
    title: 'Grand Finale',
    subtitle: 'Final day — last presentations and the closing of Project Space 2026.',
    accent: '#22d3ee',
    events: [
      { time: '9:30 AM', endTime: '12:00 PM', label: 'Morning Session', desc: 'Final project session.', kind: 'session', icon: 'sun' },
      { time: '11:00 AM', endTime: '', label: 'Snacks Break', desc: 'Refreshments.', kind: 'break', icon: 'coffee' },
      { time: '12:00 PM', endTime: '1:30 PM', label: 'Lunch', desc: 'Lunch break.', kind: 'meal', icon: 'utensils' },
      { time: '1:30 PM', endTime: '5:00 PM', label: 'Afternoon Session', desc: 'Final presentation prep.', kind: 'session', icon: 'sun' },
      { time: '3:30 PM', endTime: '', label: 'Snacks Break', desc: 'Evening refreshments.', kind: 'break', icon: 'coffee' },
      { time: '6:00 PM', endTime: '', label: 'Gathering at Gallery', desc: 'Final gathering at the presentation gallery.', kind: 'highlight', icon: 'sparkles' },
      { time: '6:00 PM', endTime: '8:00 PM', label: 'Final Presentations', desc: 'Last round of project presentations and closing showcase.', kind: 'highlight', icon: 'sparkles' },
      { time: '8:00 PM', endTime: '9:00 PM', label: 'Dinner at Gallery', desc: 'Closing dinner with all teams and mentors.', kind: 'meal', icon: 'utensils' },
      { time: '9:00 PM', endTime: '', label: 'Presentations Conclusion', desc: 'Closing ceremony and Project Space 2026 wrap-up.', kind: 'highlight', icon: 'flag' },
      { time: '11:30 PM', endTime: '', label: 'Return to Hostels', desc: 'Final return to hostels — Project Space ends.', kind: 'logistics', icon: 'home' },
    ]
  },
]

// ═══ ICON LIBRARY (line, currentColor) ═══
function Icon({ name, size = 16 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'gift': return <svg {...props}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
    case 'sun': return <svg {...props}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    case 'moon': return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    case 'coffee': return <svg {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
    case 'utensils': return <svg {...props}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>
    case 'users': return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'mic': return <svg {...props}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    case 'sparkles': return <svg {...props}><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>
    case 'flag': return <svg {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'chevron': return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>
    case 'clock': return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    default: return null
  }
}

// ═══ KIND → COLOR MAP ═══
const KIND_COLORS = {
  session:   { fg: '#fd1c00', bg: 'rgba(253,28,0,.08)',  bd: 'rgba(253,28,0,.22)',  label: 'SESSION' },
  guest:     { fg: '#7B2FBE', bg: 'rgba(123,47,190,.1)', bd: 'rgba(123,47,190,.3)', label: 'GUEST' },
  meal:      { fg: '#10b981', bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.22)', label: 'MEAL' },
  break:     { fg: '#EEA727', bg: 'rgba(238,167,39,.08)', bd: 'rgba(238,167,39,.22)', label: 'BREAK' },
  highlight: { fg: '#ec4899', bg: 'rgba(236,72,153,.08)', bd: 'rgba(236,72,153,.3)',  label: 'HIGHLIGHT' },
  logistics: { fg: '#3b82f6', bg: 'rgba(59,130,246,.08)', bd: 'rgba(59,130,246,.22)', label: 'LOGISTICS' },
}

// ═══ MAIN COMPONENT ═══
export default function EventDetails() {
  const [openDay, setOpenDay] = useState(1)
  const today = new Date()

  function getDayStatus(dateStr) {
    const [d, mon, y] = dateStr.split(' ')
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
    const eventDate = new Date(parseInt(y), months[mon], parseInt(d))
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (eventDate < todayMid) return 'past'
    if (eventDate.getTime() === todayMid.getTime()) return 'today'
    return 'future'
  }

  return (
    <div className="ed-wrap">
      <link href="https://fonts.cdnfonts.com/css/astro" rel="stylesheet"/>
      <style>{`
        .ed-wrap{animation:edFadeIn .5s ease both;font-family:'DM Sans',sans-serif}
        @keyframes edFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        /* Hero — roomier */
        .ed-hero{padding:24px 28px 22px;border-radius:18px;background:linear-gradient(135deg,#0c0614 0%,#1a0a1f 50%,#0c0614 100%);border:1px solid rgba(253,28,0,.18);position:relative;overflow:hidden;margin-bottom:20px}
        .ed-hero::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(253,28,0,.08) 50%,rgba(238,167,39,.1) 55%,transparent 70%);background-size:200% 100%;animation:edShine 5s linear infinite;pointer-events:none}
        @keyframes edShine{0%{background-position:-100% 0}100%{background-position:200% 0}}
        .ed-hero-inner{position:relative;z-index:2}
        .ed-hero-eyebrow{font-family:'DM Sans',sans-serif;font-size:.62rem;color:#fd1c00;letter-spacing:3.5px;font-weight:700;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:10px}
        .ed-hero-eyebrow::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(253,28,0,.3),transparent)}
        .ed-hero-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.625rem;font-weight:800;color:#fff;letter-spacing:2.5px;text-transform:uppercase;text-shadow:0 2px 24px rgba(253,28,0,.3);margin-bottom:10px;line-height:1.2;word-spacing:6px}
        .ed-hero-sub{font-family:'DM Sans',sans-serif;font-size:.88rem;color:rgba(255,255,255,.6);line-height:1.65;max-width:640px;font-weight:400}
        .ed-hero-meta{display:flex;gap:18px;margin-top:14px;flex-wrap:wrap}
        .ed-hero-meta-item{font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:8px;font-size:.74rem;color:rgba(255,255,255,.5);font-weight:500}
        .ed-hero-meta-item strong{color:#fff;font-weight:700}

        /* Progress strip */
        .ed-progress{display:flex;gap:8px;margin-bottom:16px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05)}
        .ed-progress-dot{flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,.06);position:relative;overflow:hidden;cursor:pointer;transition:all .25s}
        .ed-progress-dot.past{background:rgba(74,222,128,.4)}
        .ed-progress-dot.today{background:linear-gradient(90deg,#fd1c00,#EEA727);box-shadow:0 0 12px rgba(253,28,0,.5);animation:edDotPulse 2s ease-in-out infinite}
        .ed-progress-dot.future{background:rgba(255,255,255,.08)}
        .ed-progress-dot:hover{transform:scaleY(1.6)}
        @keyframes edDotPulse{0%,100%{box-shadow:0 0 12px rgba(253,28,0,.4)}50%{box-shadow:0 0 22px rgba(253,28,0,.7)}}

        /* Day cards stack */
        .ed-stack{display:flex;flex-direction:column;gap:10px}

        /* Day card */
        .ed-day{border-radius:16px;background:rgba(12,8,18,.55);border:1px solid rgba(255,255,255,.06);overflow:hidden;transition:all .35s cubic-bezier(.16,1,.3,1);animation:edDayIn .5s ease both;position:relative}
        @keyframes edDayIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .ed-day::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 0% 50%,color-mix(in srgb,var(--accent) 18%,transparent) 0%,transparent 35%);opacity:0;transition:opacity .4s ease;pointer-events:none;border-radius:16px}
        .ed-day.open::before,.ed-day:hover::before{opacity:1}
        .ed-day.open::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent 0%,var(--accent) 20%,var(--accent) 80%,transparent 100%);box-shadow:0 0 12px color-mix(in srgb,var(--accent) 60%,transparent);animation:edTopGlow 2s ease-in-out infinite;border-radius:16px 16px 0 0}
        @keyframes edTopGlow{0%,100%{opacity:.7}50%{opacity:1}}
        .ed-day:hover{border-color:rgba(255,255,255,.12);transform:translateY(-1px)}
        .ed-day.open{border-color:color-mix(in srgb,var(--accent) 25%,transparent);box-shadow:0 8px 32px color-mix(in srgb,var(--accent) 8%,transparent)}

        /* Day header */
        .ed-day-hdr{display:flex;align-items:center;gap:16px;padding:16px 22px;cursor:pointer;transition:background .25s}
        .ed-day-hdr:hover{background:rgba(255,255,255,.02)}

        .ed-day-num-box{flex-shrink:0;width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;transition:all .35s;padding:10px 6px 8px}
        .ed-day-num-box::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at top,color-mix(in srgb,var(--accent) 22%,transparent),transparent 70%);opacity:0;transition:opacity .35s}
        .ed-day.open .ed-day-num-box::before{opacity:1}
        .ed-day.today .ed-day-num-box{box-shadow:0 0 16px color-mix(in srgb,var(--accent) 35%,transparent);animation:edTodayPulse 3s ease-in-out infinite}
        @keyframes edTodayPulse{0%,100%{box-shadow:0 0 16px color-mix(in srgb,var(--accent) 30%,transparent)}50%{box-shadow:0 0 28px color-mix(in srgb,var(--accent) 50%,transparent)}}
        .ed-day-num-label{font-family:'DM Sans',sans-serif;font-size:.5rem;font-weight:700;color:var(--accent);letter-spacing:1.5px;text-transform:uppercase;position:relative;z-index:1;line-height:1;margin-bottom:4px;display:block}
        .ed-day-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.25rem;font-weight:800;color:#fff;line-height:1;position:relative;z-index:1;text-shadow:0 1px 8px color-mix(in srgb,var(--accent) 40%,transparent);letter-spacing:.5px;display:block}

        .ed-day-info{flex:1;min-width:0}
        .ed-day-meta{display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap}
        .ed-day-date{font-family:'DM Sans',sans-serif;font-size:.66rem;color:rgba(255,255,255,.4);letter-spacing:1.4px;text-transform:uppercase;font-weight:600}
        .ed-day-pill{font-family:'DM Sans',sans-serif;font-size:.55rem;font-weight:700;padding:4px 12px;border-radius:12px;letter-spacing:1.2px;text-transform:uppercase}
        .ed-day-pill.today{background:linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08));color:#fd1c00;border:1px solid rgba(253,28,0,.3);animation:edTodayPulse 2s ease-in-out infinite}
        .ed-day-pill.past{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.18)}
        .ed-day-pill.future{background:rgba(255,255,255,.04);color:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.08)}
        .ed-day-title{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:0.9rem;font-weight:800;color:#fff;letter-spacing:1.5px;line-height:1.3;margin-bottom:4px;text-transform:uppercase;word-spacing:4px}
        .ed-day-sub{font-family:'DM Sans',sans-serif;font-size:.78rem;color:rgba(255,255,255,.5);line-height:1.6;font-weight:400}

        .ed-day-counts{display:flex;gap:12px;flex-shrink:0}
        .ed-day-count{display:flex;flex-direction:column;align-items:center;padding:7px 13px;border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);min-width:48px}
        .ed-day-count-num{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:1.05rem;font-weight:800;color:var(--accent);line-height:1;letter-spacing:.5px}
        .ed-day-count-lb{font-family:'DM Sans',sans-serif;font-size:.5rem;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-top:5px}

        .ed-day-toggle{flex-shrink:0;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);transition:all .35s cubic-bezier(.16,1,.3,1)}
        .ed-day.open .ed-day-toggle{background:color-mix(in srgb,var(--accent) 12%,transparent);border-color:color-mix(in srgb,var(--accent) 30%,transparent);color:var(--accent);transform:rotate(180deg)}

        /* Day body (timeline) */
        .ed-day-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s cubic-bezier(.16,1,.3,1)}
        .ed-day.open .ed-day-body{grid-template-rows:1fr}
        .ed-day-body-inner{overflow:hidden;min-height:0}

        /* Timeline — much roomier */
        .ed-tl{padding:8px 24px 22px 24px;position:relative;margin-top:0}
        .ed-tl::before{display:none}

        @keyframes edEvIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        .ed-ev{position:relative;padding:10px 0 10px 64px;animation:edEvIn .45s cubic-bezier(.16,1,.3,1) both}
        .ed-ev:nth-child(1){animation-delay:.05s}
        .ed-ev:nth-child(2){animation-delay:.1s}
        .ed-ev:nth-child(3){animation-delay:.15s}
        .ed-ev:nth-child(4){animation-delay:.2s}
        .ed-ev:nth-child(5){animation-delay:.25s}
        .ed-ev:nth-child(6){animation-delay:.3s}
        .ed-ev:nth-child(7){animation-delay:.35s}
        .ed-ev:nth-child(8){animation-delay:.4s}
        .ed-ev:nth-child(9){animation-delay:.45s}
        .ed-ev:nth-child(10){animation-delay:.5s}
        .ed-ev:nth-child(n+11){animation-delay:.55s}
        .ed-ev:not(:last-child)::after{content:'';position:absolute;left:38px;top:40px;bottom:-10px;width:2px;background:rgba(255,255,255,.04)}

        .ed-ev-dot{position:absolute;left:24px;top:10px;width:28px;height:28px;border-radius:50%;background:#13101a;border:2px solid var(--ckind);display:flex;align-items:center;justify-content:center;color:var(--ckind);transition:all .3s;z-index:2;box-shadow:0 0 0 5px rgba(19,16,26,1)}
        .ed-ev:hover .ed-ev-dot{transform:scale(1.15);box-shadow:0 0 0 5px rgba(19,16,26,1),0 0 14px color-mix(in srgb,var(--ckind) 40%,transparent)}

        .ed-ev-card{padding:12px 16px;border-radius:11px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.05);transition:all .25s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden}
        .ed-ev-card::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,color-mix(in srgb,var(--ckind) 6%,transparent) 50%,transparent 60%);background-size:200% 100%;background-position:-100% 0;transition:background-position .8s ease;pointer-events:none}
        .ed-ev:hover .ed-ev-card{border-color:color-mix(in srgb,var(--ckind) 25%,transparent);transform:translateX(4px);box-shadow:0 4px 16px color-mix(in srgb,var(--ckind) 10%,transparent)}
        .ed-ev:hover .ed-ev-card::before{background-position:200% 0}

        .ed-ev-row1{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
        .ed-ev-time{font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:700;color:var(--ckind);letter-spacing:.4px;display:inline-flex;align-items:center;gap:6px}
        .ed-ev-tag{font-family:'DM Sans',sans-serif;font-size:.5rem;font-weight:700;padding:3px 10px;border-radius:7px;letter-spacing:1.2px;background:var(--cbg);color:var(--ckind);border:1px solid var(--cbd)}
        .ed-ev-label{font-family:'Astro','Orbitron','DM Sans',sans-serif;font-size:0.75rem;font-weight:700;color:#fff;line-height:1.3;margin-bottom:5px;letter-spacing:.8px;text-transform:uppercase;word-spacing:3px}
        .ed-ev-desc{font-family:'DM Sans',sans-serif;font-size:.74rem;color:rgba(255,255,255,.55);line-height:1.55;font-weight:400}

        .ed-ev-guests{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.05)}
        .ed-ev-guest{font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:9px;background:rgba(123,47,190,.05);border:1px solid rgba(123,47,190,.12);font-size:.7rem;color:rgba(255,255,255,.75);line-height:1.5;font-weight:500}
        .ed-ev-guest-dot{width:7px;height:7px;border-radius:50%;background:#7B2FBE;flex-shrink:0;box-shadow:0 0 8px rgba(123,47,190,.6)}

        /* Mobile */
        @media(max-width:768px){
          .ed-hero{padding:24px 20px;border-radius:16px;margin-bottom:22px}
          .ed-hero-title{font-size:0.975rem;letter-spacing:1.5px}
          .ed-hero-sub{font-size:.78rem;line-height:1.6}
          .ed-hero-meta{gap:14px;margin-top:18px}
          .ed-hero-meta-item{font-size:.66rem}

          .ed-day-hdr{padding:18px 18px;gap:14px}
          .ed-day-num-box{width:58px;height:58px}
          .ed-day-num{font-size:1.3rem}
          .ed-day-title{font-size:.67rem;letter-spacing:1px}
          .ed-day-sub{font-size:.7rem;line-height:1.55}
          .ed-day-counts{display:none}

          .ed-tl{padding:14px 18px 24px 18px}
          .ed-tl::before{left:30px}
          .ed-ev{padding:16px 0 16px 60px}
          .ed-ev-dot{left:16px;width:28px;height:28px}
          .ed-ev:not(:last-child)::after{left:30px;top:44px}
          .ed-ev-card{padding:14px 16px}
          .ed-ev-label{font-size:.63rem;letter-spacing:.5px}
          .ed-ev-desc{font-size:.74rem;line-height:1.6}
          .ed-ev-guest{font-size:.7rem;padding:8px 12px}

          .ed-progress{padding:10px 12px}
        }
        @media(max-width:480px){
          .ed-hero-meta{flex-direction:column;gap:8px}
          .ed-hero-title{font-size:1.15rem}
        }
      `}</style>

      {/* Hero */}
      <div className="ed-hero">
        <div className="ed-hero-inner">
          <div className="ed-hero-eyebrow"><Icon name="calendar" size={11}/> Project Space 2026 · 7 Day Schedule</div>
          <div className="ed-hero-title">The Week That Builds Builders</div>
          <div className="ed-hero-sub">From inauguration to grand finale — every day mapped out. Tap any day below to expand its full schedule and see the industry guests, sessions, and highlights waiting for you.</div>
          <div className="ed-hero-meta">
            <div className="ed-hero-meta-item"><Icon name="calendar" size={12}/> <strong>May 6 – May 12, 2026</strong></div>
            <div className="ed-hero-meta-item"><Icon name="users" size={12}/> <strong>900+</strong> students</div>
            <div className="ed-hero-meta-item"><Icon name="mic" size={12}/> <strong>12+</strong> industry guests</div>
            <div className="ed-hero-meta-item"><Icon name="sparkles" size={12}/> <strong>160</strong> teams</div>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="ed-progress">
        {SCHEDULE.map(d => {
          const status = getDayStatus(d.date)
          return (
            <div
              key={d.day}
              className={`ed-progress-dot ${status}`}
              onClick={() => setOpenDay(openDay === d.day ? 0 : d.day)}
              title={`Day ${d.day}: ${d.title} — ${d.date}`}
            />
          )
        })}
      </div>

      {/* Day cards */}
      <div className="ed-stack">
        {SCHEDULE.map((day, idx) => {
          const isOpen = openDay === day.day
          const status = getDayStatus(day.date)
          const isToday = status === 'today'
          const guestCount = day.events.filter(e => e.kind === 'guest').reduce((sum,e) => sum + (e.guests?.length || 1), 0)

          return (
            <div
              key={day.day}
              className={`ed-day ${isOpen?'open':''} ${isToday?'today':''}`}
              style={{ '--accent': day.accent, animationDelay: `${idx*.06}s` }}
            >
              <div className="ed-day-hdr" onClick={() => setOpenDay(isOpen ? 0 : day.day)}>
                <div className="ed-day-num-box">
                  <div className="ed-day-num-label">Day</div>
                  <div className="ed-day-num">{String(day.day).padStart(2,'0')}</div>
                </div>
                <div className="ed-day-info">
                  <div className="ed-day-meta">
                    <span className="ed-day-date">{day.dateLong}</span>
                    {status === 'today' && <span className="ed-day-pill today">Today</span>}
                    {status === 'past' && <span className="ed-day-pill past">Done</span>}
                    {status === 'future' && <span className="ed-day-pill future">Upcoming</span>}
                  </div>
                  <div className="ed-day-title">{day.title}</div>
                  <div className="ed-day-sub">{day.subtitle}</div>
                </div>
                <div className="ed-day-counts">
                  <div className="ed-day-count">
                    <div className="ed-day-count-num">{day.events.length}</div>
                    <div className="ed-day-count-lb">Events</div>
                  </div>
                  {guestCount > 0 && (
                    <div className="ed-day-count">
                      <div className="ed-day-count-num">{guestCount}</div>
                      <div className="ed-day-count-lb">Guests</div>
                    </div>
                  )}
                </div>
                <div className="ed-day-toggle"><Icon name="chevron" size={16}/></div>
              </div>

              <div className="ed-day-body">
                <div className="ed-day-body-inner">
                  <div className="ed-tl">
                    {day.events.map((ev, ei) => {
                      const c = KIND_COLORS[ev.kind] || KIND_COLORS.session
                      return (
                        <div key={ei} className="ed-ev" style={{ '--ckind': c.fg, '--cbg': c.bg, '--cbd': c.bd }}>
                          <div className="ed-ev-dot"><Icon name={ev.icon} size={13}/></div>
                          <div className="ed-ev-card">
                            <div className="ed-ev-row1">
                              <span className="ed-ev-time"><Icon name="clock" size={11}/> {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>
                              <span className="ed-ev-tag">{c.label}</span>
                            </div>
                            <div className="ed-ev-label">{ev.label}</div>
                            <div className="ed-ev-desc">{ev.desc}</div>
                            {ev.guests && ev.guests.length > 0 && (
                              <div className="ed-ev-guests">
                                {ev.guests.map((g, gi) => (
                                  <div key={gi} className="ed-ev-guest">
                                    <span className="ed-ev-guest-dot"/>
                                    <span>{g}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}