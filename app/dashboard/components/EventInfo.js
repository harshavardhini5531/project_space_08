"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

/* ============================================================
   EVENT INFO v3 — Single-Scroll
   Path: app/dashboard/components/EventInfo.js
   Theme matches existing dashboard:
     - rgba(13,10,20,.6) cards
     - #fd1c00 → #fa0068 → #000000 hero gradient
     - DM Sans + Astro fonts, no emojis, line icons only
   Sections (no repetition):
     1. Welcome Kit (search any team + your kit panel)
     2. Hall Seating (4 unique halls A/B/C/D with chair grids)
     3. Schedule
     4. Dress Code
     5. Guidelines
     6. PPT Guide
     7. Contacts
   ============================================================ */

/* ---------- HALLS ---------- */
const HALLS = [
  { id: "h1", name: "Hall A", suffix: "4.1 Blue",  accent: "#3b82f6", accentSoft: "rgba(59,130,246,.10)",  accentBorder: "rgba(59,130,246,.30)", rows: 4, cols: 11, startTeam: 1,   endTeam: 44,  entranceLeft: true,  entranceRight: true,  description: "Teams 1 – 44" },
  { id: "h2", name: "Hall B", suffix: "4.2 Cyan",  accent: "#22d3ee", accentSoft: "rgba(34,211,238,.10)",  accentBorder: "rgba(34,211,238,.30)", rows: 4, cols: 9,  startTeam: 45,  endTeam: 80,  entranceLeft: false, entranceRight: true,  description: "Teams 45 – 80" },
  { id: "h3", name: "Hall C", suffix: "2.1 Brown", accent: "#b45309", accentSoft: "rgba(180,83,9,.12)",    accentBorder: "rgba(180,83,9,.35)",   rows: 4, cols: 11, startTeam: 81,  endTeam: 124, entranceLeft: true,  entranceRight: false, description: "Teams 81 – 124" },
  { id: "h4", name: "Hall D", suffix: "4.1 Green", accent: "#10b981", accentSoft: "rgba(16,185,129,.10)",  accentBorder: "rgba(16,185,129,.30)", rows: 4, cols: 9,  startTeam: 125, endTeam: 160, entranceLeft: false, entranceRight: true,  description: "Teams 125 – 160" },
];

const FLOOR_DESK_MAP = {
  1: [{ desk: 1, range: "PS-001 – PS-008" }, { desk: 2, range: "PS-009 – PS-016" }, { desk: 3, range: "PS-017 – PS-024" }, { desk: 4, range: "PS-025 – PS-032" }],
  2: [{ desk: 1, range: "PS-033 – PS-040" }, { desk: 2, range: "PS-041 – PS-048" }, { desk: 3, range: "PS-049 – PS-056" }, { desk: 4, range: "PS-057 – PS-064" }],
  3: [{ desk: 1, range: "PS-065 – PS-072" }, { desk: 2, range: "PS-073 – PS-080" }, { desk: 3, range: "PS-081 – PS-088" }, { desk: 4, range: "PS-089 – PS-096" }],
  4: [{ desk: 1, range: "PS-097 – PS-104" }, { desk: 2, range: "PS-105 – PS-112" }, { desk: 3, range: "PS-113 – PS-120" }, { desk: 4, range: "PS-121 – PS-128" }],
  5: [{ desk: 1, range: "PS-129 – PS-136" }, { desk: 2, range: "PS-137 – PS-144" }, { desk: 3, range: "PS-145 – PS-152" }, { desk: 4, range: "PS-153 – PS-160" }],
};

function getVenue(t) {
  if (!t || !t.startsWith("PS-")) return null;
  const n = parseInt(t.replace("PS-", ""), 10);
  if (isNaN(n) || n < 1 || n > 160) return null;
  const floor = Math.ceil(n / 32);
  const idx = ((n - 1) % 32) + 1;
  const desk = Math.ceil(idx / 8);
  const start = (floor - 1) * 32 + (desk - 1) * 8 + 1;
  return { floor, desk, range: `PS-${String(start).padStart(3, "0")} – PS-${String(start + 7).padStart(3, "0")}` };
}
function getHall(t) {
  if (!t || !t.startsWith("PS-")) return null;
  const n = parseInt(t.replace("PS-", ""), 10);
  if (isNaN(n)) return null;
  return HALLS.find((h) => n >= h.startTeam && n <= h.endTeam);
}

const DRESS_CODE = [
  { day: "DAY 1", week: "WED", attire: "Drive Ready / SkillUp T-Shirt (Black)" },
  { day: "DAY 2", week: "THU", attire: "Project Space T-Shirt" },
  { day: "DAY 3", week: "FRI", attire: "Civil Formal Wear" },
  { day: "DAY 4", week: "SAT", attire: "Project Space T-Shirt" },
  { day: "DAY 5", week: "SUN", attire: "White Code Dress" },
  { day: "DAY 6", week: "MON", attire: "Drive Ready / SkillUp T-Shirt (Black)" },
  { day: "DAY 7", week: "TUE", attire: "Project Space T-Shirt" },
];

const TIMINGS = {
  day1: [["Hostel Check-in", "By 9:00 AM"], ["Welcome Kit Distribution", "9:00 – 10:00 AM"], ["Morning Session", "10:00 AM – 12:00 PM"], ["Snacks", "11:00 AM"], ["Lunch", "12:00 – 1:30 PM"], ["Afternoon Session", "1:30 – 5:00 PM"], ["Snacks", "3:30 PM"], ["Project Street", "4:30 – 6:30 PM"], ["Dinner", "7:00 – 8:00 PM"], ["Night Session", "8:00 PM – 12:00 AM"], ["Snacks", "9:30 PM"]],
  day2to6: [["Morning Session", "9:30 AM – 12:00 PM"], ["Snacks", "11:00 AM"], ["Lunch", "12:00 – 1:30 PM"], ["Afternoon Session", "1:30 – 5:00 PM"], ["Snacks", "3:30 PM"], ["Project Street", "4:30 – 6:30 PM"], ["Dinner", "7:00 – 8:00 PM"], ["Night Session", "8:00 PM – 12:00 AM"], ["Snacks", "9:30 PM"]],
  day7: [["Morning Session", "9:30 AM – 12:00 PM"], ["Snacks", "11:00 AM"], ["Lunch", "12:00 – 1:30 PM"], ["Afternoon Session", "1:30 – 5:00 PM"], ["Snacks", "3:30 PM"], ["Gathering at Gallery", "By 6:00 PM"], ["Presentations at Gallery", "6:00 – 8:00 PM"], ["Dinner at Gallery", "8:00 – 9:00 PM"], ["Presentations Conclusion", "9:00 PM onwards"], ["Return to Hostels", "11:30 PM"]],
};

const CONTACTS = {
  emergency: [
    { role: "Ambulance", name: "Narayana Swamy", phone: "93928 01243", note: "Security Gate · 5 PM – 12 AM" },
    { role: "Building Supervisor", name: "Manikanta", phone: "90105 35807", note: "Technical Hub · 8 AM – 9 PM" },
    { role: "Security 24/7", name: "—", phone: "77299 97299", note: "Round the clock" },
    { role: "Head of Security", name: "D. Siva Prasad", phone: "95429 76665", note: "" },
    { role: "Campus In-Charge", name: "Chakravarthy", phone: "77318 86664", note: "" },
    { role: "CEO, Technical Hub", name: "Babji Neelam", phone: "98498 01605", note: "Higher escalation" },
  ],
  hostel: [
    { role: "Boys Hostel", name: "Mr. Vasanth (Flutter Trainer)", phone: "91775 22410" },
    { role: "Girls Hostel", name: "Ms. Srilekha (ServiceNow Trainer)", phone: "76610 99598" },
  ],
  female: [
    { role: "ServiceNow Trainer", name: "P. Srilekha", phone: "76610 99598" },
    { role: "Flutter Trainer", name: "Mounika", phone: "72889 14175" },
    { role: "VLSI Trainer", name: "Seeta Mahalakshmi", phone: "63020 97699" },
  ],
};

const SECTIONS = [
  { id: "kit", short: "Kit", label: "Welcome Kit" },
  { id: "halls", short: "Halls", label: "Hall Seating" },
  { id: "schedule", short: "Time", label: "Schedule" },
  { id: "dress", short: "Dress", label: "Dress Code" },
  { id: "rules", short: "Rules", label: "Guidelines" },
  { id: "ppt", short: "PPT", label: "PPT Guide" },
  { id: "contacts", short: "Help", label: "Contacts" },
];

const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  shirt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z"/></svg>,
  presentation: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="m7 11 3-3 2 2 4-5"/></svg>,
  arrowDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  women: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9"/></svg>,
  door: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="1"/><circle cx="14" cy="12" r=".8" fill="currentColor"/></svg>,
};

/* Chair seat — back + seat + legs */
const ChairIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 19v2"/>
    <path d="M18 19v2"/>
    <path d="M6 14V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/>
    <rect x="4" y="14" width="16" height="5" rx="1"/>
  </svg>
);

/* ====================================================================== */
export default function EventInfo({ user }) {
  const [activeSection, setActiveSection] = useState("kit");
  const [searchTeam, setSearchTeam] = useState("");
  const teamNumber = user?.teamNumber || user?.team_number;
  const myVenue = teamNumber ? getVenue(teamNumber) : null;
  const myHall = teamNumber ? getHall(teamNumber) : null;
  const myN = teamNumber && teamNumber.startsWith("PS-") ? parseInt(teamNumber.replace("PS-", ""), 10) : null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id.replace("ei-sec-", ""));
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`ei-sec-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(`ei-sec-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes ei-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ei-pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(253,28,0,.5); } 50% { box-shadow: 0 0 0 8px rgba(253,28,0,0); } }

        .ei3 { font-family: 'DM Sans', system-ui, sans-serif; color: #fff; max-width: 1100px; margin: 0 auto; padding-bottom: 80px; }
        .ei3 *, .ei3 *::before, .ei3 *::after { box-sizing: border-box; }

        .ei3-hero {
          position: relative;
          padding: 36px 30px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fd1c00 0%, #fa0068 50%, #1a0a18 100%);
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(253,28,0,.15);
          animation: ei-fade-up .5s ease both;
        }
        .ei3-hero::before {
          content: ""; position: absolute; top: -100px; right: -100px;
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(255,255,255,.10), transparent 60%);
          pointer-events: none;
        }
        .ei3-hero::after {
          content: ""; position: absolute; bottom: -60px; left: -60px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(0,0,0,.25), transparent 65%);
          pointer-events: none;
        }
        .ei3-hero-inner { position: relative; z-index: 1; }
        .ei3-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .18em;
          color: #fff; text-transform: uppercase;
          padding: 5px 11px;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 100px;
          background: rgba(0,0,0,.2);
          backdrop-filter: blur(6px);
        }
        .ei3-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px rgba(255,255,255,.6); }
        .ei3-h1 {
          font-family: 'Astro', 'DM Sans', sans-serif;
          font-size: clamp(28px, 4.5vw, 44px);
          line-height: 1.05; letter-spacing: 1px; font-weight: 800;
          margin: 14px 0 8px; text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,.25); color: #fff;
        }
        .ei3-sub { font-size: clamp(13.5px, 1.2vw, 15px); color: rgba(255,255,255,.85); max-width: 580px; line-height: 1.55; margin: 0; }

        .ei3-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-top: 22px; max-width: 580px; }
        .ei3-stat { padding: 11px 14px; border: 1px solid rgba(255,255,255,.2); background: rgba(0,0,0,.18); border-radius: 10px; backdrop-filter: blur(6px); }
        .ei3-stat-num { font-size: 20px; font-weight: 800; line-height: 1; color: #fff; }
        .ei3-stat-lab { font-size: 9.5px; color: rgba(255,255,255,.7); margin-top: 5px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; }
        @media (max-width: 600px) { .ei3-stats { grid-template-columns: repeat(2,1fr); } }

        .ei3-mine {
          margin-top: 22px; padding: 14px 16px; border-radius: 12px;
          background: rgba(0,0,0,.32); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.18);
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .ei3-mine-pill { padding: 6px 11px; background: #fff; color: #fd1c00; font-weight: 800; font-size: 12px; border-radius: 8px; letter-spacing: .04em; font-variant-numeric: tabular-nums; }
        .ei3-mine-text { font-size: 13.5px; color: #fff; flex: 1; min-width: 200px; line-height: 1.45; }
        .ei3-mine-text strong { font-weight: 700; }
        .ei3-mine-link { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; padding: 7px 12px; background: rgba(255,255,255,.95); border: none; border-radius: 8px; color: #fd1c00; cursor: pointer; transition: transform .15s, box-shadow .15s; }
        .ei3-mine-link:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.2); }
        .ei3-mine-link-icn { width: 12px; height: 12px; }

        .ei3-pillnav-wrap {
          position: sticky; top: 0; z-index: 30;
          background: linear-gradient(180deg, #050008 80%, transparent);
          padding: 14px 0; margin-bottom: 8px;
        }
        .ei3-pillnav {
          display: flex; gap: 4px; padding: 5px;
          background: rgba(13,10,20,.85);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 100px; width: fit-content; max-width: 100%;
          margin: 0 auto; overflow-x: auto; scrollbar-width: none;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 18px rgba(0,0,0,.3);
        }
        .ei3-pillnav::-webkit-scrollbar { display: none; }
        .ei3-pill {
          padding: 8px 16px; background: transparent; border: none;
          color: rgba(255,255,255,.45); font-family: inherit;
          font-size: 12.5px; font-weight: 600; border-radius: 100px;
          cursor: pointer; white-space: nowrap;
          transition: color .2s, background .2s;
          display: flex; align-items: center; gap: 7px;
        }
        .ei3-pill:hover { color: #fff; }
        .ei3-pill.active { background: linear-gradient(135deg, #fd1c00, #faa000); color: #fff; box-shadow: 0 4px 14px rgba(253,28,0,.35); }
        .ei3-pill-num { font-size: 9.5px; opacity: .65; font-variant-numeric: tabular-nums; font-weight: 700; }
        .ei3-pill.active .ei3-pill-num { opacity: .9; }

        .ei3-dots { position: fixed; right: 22px; top: 50%; transform: translateY(-50%); z-index: 25; display: flex; flex-direction: column; gap: 12px; }
        @media (max-width: 1180px) { .ei3-dots { display: none; } }
        .ei3-dot { position: relative; width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); background: transparent; cursor: pointer; transition: all .25s ease; padding: 0; }
        .ei3-dot:hover { border-color: #faa000; transform: scale(1.3); }
        .ei3-dot.active { border-color: #fd1c00; background: #fd1c00; box-shadow: 0 0 0 3px rgba(253,28,0,.2); }
        .ei3-dot-tip { position: absolute; right: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: rgba(13,10,20,.95); border: 1px solid rgba(255,255,255,.1); padding: 4px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap; color: #fff; opacity: 0; pointer-events: none; transition: opacity .15s; font-weight: 500; }
        .ei3-dot:hover .ei3-dot-tip { opacity: 1; }

        .ei3-section { padding: 32px 0 16px; scroll-margin-top: 80px; animation: ei-fade-up .5s ease both; }
        .ei3-sec-eyebrow { font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; color: #faa000; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .ei3-sec-eyebrow-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: rgba(238,167,39,.12); border: 1px solid rgba(238,167,39,.3); border-radius: 50%; font-weight: 800; font-size: 10px; color: #faa000; }
        .ei3-sec-h2 { font-size: clamp(20px, 2.8vw, 26px); font-weight: 700; letter-spacing: -.015em; margin: 0 0 5px; color: #fff; }
        .ei3-sec-desc { font-size: 13.5px; color: rgba(255,255,255,.55); margin: 0 0 22px; max-width: 600px; line-height: 1.55; }

        .ei3-card { background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; transition: border-color .25s; }
        .ei3-card:hover { border-color: rgba(255,255,255,.1); }
        .ei3-card-pad { padding: 22px; }

        .ei3-kit-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; }
        @media (max-width: 820px) { .ei3-kit-grid { grid-template-columns: 1fr; } }

        .ei3-search-wrap { position: relative; }
        .ei3-search-icn { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; color: rgba(255,255,255,.3); }
        .ei3-search-in { width: 100%; padding: 12px 14px 12px 42px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); color: #fff; border-radius: 10px; font-family: inherit; font-size: 14px; outline: none; transition: border-color .18s, background .18s; }
        .ei3-search-in:focus { border-color: #faa000; background: rgba(238,167,39,.04); }
        .ei3-search-in::placeholder { color: rgba(255,255,255,.25); }

        .ei3-result { margin-top: 18px; padding: 18px 20px; background: linear-gradient(135deg, rgba(253,28,0,.10), rgba(250,160,0,.05)); border: 1px solid rgba(253,28,0,.25); border-radius: 12px; animation: ei-fade-up .35s ease both; }
        .ei3-result-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: 14px; }
        .ei3-result-team { font-family: 'Astro', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #fd1c00; }
        .ei3-result-hall-tag { padding: 5px 11px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
        .ei3-result-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ei3-result-cell { display: flex; flex-direction: column; gap: 3px; }
        .ei3-result-cell-lab { font-size: 9.5px; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.4); font-weight: 600; }
        .ei3-result-cell-val { font-size: 16px; font-weight: 700; color: #fff; }
        .ei3-result-cell-sub { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 2px; font-variant-numeric: tabular-nums; }

        .ei3-not-found { margin-top: 14px; padding: 12px 16px; color: rgba(255,255,255,.5); font-size: 13px; border: 1px dashed rgba(255,255,255,.15); border-radius: 8px; }

        .ei3-mykit { padding: 20px; background: linear-gradient(135deg, rgba(238,167,39,.08), rgba(253,28,0,.04)); border: 1px solid rgba(238,167,39,.25); border-radius: 14px; display: flex; flex-direction: column; gap: 14px; }
        .ei3-mykit-head { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: #faa000; font-weight: 700; }
        .ei3-mykit-head-dot { width: 7px; height: 7px; border-radius: 50%; background: #faa000; box-shadow: 0 0 8px #faa000; animation: ei-pulse-red 2s ease-in-out infinite; }
        .ei3-mykit-team { font-family: 'Astro', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: 1.5px; color: #fff; line-height: 1; }
        .ei3-mykit-rows { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .ei3-mykit-rows { grid-template-columns: 1fr 1fr; } }
        .ei3-mykit-cell { padding: 10px 12px; background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; }
        .ei3-mykit-cell-lab { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); font-weight: 600; }
        .ei3-mykit-cell-val { font-size: 15px; font-weight: 700; margin-top: 4px; color: #fff; }
        .ei3-mykit-pickup { padding: 10px 14px; background: rgba(0,0,0,.35); border-left: 3px solid #faa000; border-radius: 6px; font-size: 12px; color: rgba(255,255,255,.75); line-height: 1.5; }
        .ei3-mykit-pickup strong { color: #faa000; font-weight: 700; }

        .ei3-pickup-info { display: flex; flex-direction: column; gap: 14px; padding: 22px; }
        .ei3-pickup-h { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); }
        .ei3-pickup-text { font-size: 14px; color: rgba(255,255,255,.85); line-height: 1.6; }
        .ei3-pickup-text strong { color: #faa000; }
        .ei3-pickup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .ei3-pickup-stat { padding: 12px 14px; background: rgba(255,255,255,.03); border-radius: 8px; border: 1px solid rgba(255,255,255,.06); }
        .ei3-pickup-stat-lab { font-size: 9.5px; color: rgba(255,255,255,.4); letter-spacing: .14em; text-transform: uppercase; font-weight: 600; }
        .ei3-pickup-stat-num { font-size: 22px; font-weight: 800; color: #fff; margin-top: 4px; }

        .ei3-halls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 920px) { .ei3-halls-grid { grid-template-columns: 1fr; } }

        .ei3-hall { background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; transition: border-color .25s, transform .25s; }
        .ei3-hall:hover { border-color: rgba(255,255,255,.12); transform: translateY(-2px); }
        .ei3-hall.mine { border-color: rgba(253,28,0,.45); box-shadow: 0 0 0 1px rgba(253,28,0,.2), 0 6px 20px rgba(253,28,0,.1); }
        .ei3-hall-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; background: linear-gradient(135deg, var(--hb), transparent); border-bottom: 1px solid var(--hbd); }
        .ei3-hall-name { font-size: 13.5px; font-weight: 700; letter-spacing: .03em; color: var(--ha); display: flex; align-items: center; gap: 8px; }
        .ei3-hall-name-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ha); box-shadow: 0 0 8px var(--ha); }
        .ei3-hall-suffix { font-size: 10px; color: rgba(255,255,255,.4); font-weight: 500; letter-spacing: .02em; }
        .ei3-hall-range { font-size: 10.5px; font-weight: 700; letter-spacing: .04em; padding: 4px 9px; border-radius: 100px; background: rgba(0,0,0,.35); color: rgba(255,255,255,.85); font-variant-numeric: tabular-nums; }
        .ei3-hall-body { padding: 14px; background: rgba(0,0,0,.18); position: relative; }

        .ei3-room { position: relative; padding: 14px 28px; border-radius: 10px; background: rgba(255,255,255,.015); border: 1px dashed rgba(255,255,255,.08); }
        .ei3-entrance { position: absolute; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 8px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); font-weight: 700; }
        .ei3-entrance.left { left: 4px; }
        .ei3-entrance.right { right: 4px; }
        .ei3-entrance-icn { width: 16px; height: 16px; background: rgba(255,255,255,.04); border: 1px dashed rgba(255,255,255,.15); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.45); }

        .ei3-chair-grid { display: grid; gap: 3px; }
        .ei3-chair {
          aspect-ratio: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 5px;
          color: rgba(255,255,255,.55);
          transition: all .2s;
          position: relative;
          padding: 1px;
        }
        .ei3-chair:hover { background: rgba(255,255,255,.07); border-color: var(--ha); color: #fff; transform: translateY(-1px); z-index: 2; }
        .ei3-chair-icn { width: 11px; height: 11px; opacity: .8; }
        .ei3-chair-num { font-size: 7px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -.02em; line-height: 1; }
        .ei3-chair.mine { background: linear-gradient(135deg, #fd1c00, #faa000); border-color: #fd1c00; color: #fff; box-shadow: 0 0 0 3px rgba(253,28,0,.25), 0 4px 12px rgba(253,28,0,.4); animation: ei-pulse-red 2s ease-in-out infinite; z-index: 3; }
        .ei3-chair.mine .ei3-chair-icn { opacity: 1; }
        .ei3-chair-empty { visibility: hidden; }

        .ei3-hall-foot { padding: 11px 16px; border-top: 1px solid rgba(255,255,255,.05); font-size: 11.5px; color: rgba(255,255,255,.6); display: flex; align-items: center; gap: 8px; }
        .ei3-hall-foot.mine { background: linear-gradient(90deg, rgba(253,28,0,.08), transparent); color: #fff; }
        .ei3-hall-foot strong { color: #faa000; font-weight: 700; }
        .ei3-hall-foot-icn { width: 13px; height: 13px; color: #faa000; }

        .ei3-schedule-tabs { display: flex; gap: 4px; padding: 4px; background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; width: fit-content; margin-bottom: 14px; }
        .ei3-stab { padding: 8px 16px; background: transparent; border: none; color: rgba(255,255,255,.5); font-family: inherit; font-size: 12.5px; font-weight: 600; border-radius: 7px; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .ei3-stab:hover { color: #fff; }
        .ei3-stab.active { background: linear-gradient(135deg, #fd1c00, #faa000); color: #fff; box-shadow: 0 2px 10px rgba(253,28,0,.25); }
        .ei3-timeline { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; overflow: hidden; }
        @media (max-width: 600px) { .ei3-timeline { grid-template-columns: 1fr; } }
        .ei3-time-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(13,10,20,.6); gap: 12px; transition: background .15s; }
        .ei3-time-row:hover { background: rgba(255,255,255,.02); }
        .ei3-time-lab { font-size: 13px; color: rgba(255,255,255,.85); }
        .ei3-time-val { font-size: 11.5px; color: #faa000; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .ei3-dress-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 8px; }
        @media (max-width: 1000px) { .ei3-dress-grid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width: 600px) { .ei3-dress-grid { grid-template-columns: repeat(2,1fr); } }
        .ei3-dress-card { padding: 14px 13px; background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; transition: all .2s; }
        .ei3-dress-card:hover { border-color: rgba(253,28,0,.2); transform: translateY(-2px); }
        .ei3-dress-day { font-size: 10.5px; letter-spacing: .18em; color: #fd1c00; font-weight: 800; }
        .ei3-dress-week { font-size: 10.5px; color: rgba(255,255,255,.4); margin-top: 3px; letter-spacing: .08em; }
        .ei3-dress-attire { margin-top: 11px; font-size: 12px; line-height: 1.4; font-weight: 500; color: rgba(255,255,255,.85); }

        .ei3-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 820px) { .ei3-rules-grid { grid-template-columns: 1fr; } }
        .ei3-rule-card { padding: 18px 20px; background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; }
        .ei3-rule-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,.05); }
        .ei3-rule-icn { width: 32px; height: 32px; padding: 7px; background: rgba(253,28,0,.08); border: 1px solid rgba(253,28,0,.2); border-radius: 8px; color: #fd1c00; flex-shrink: 0; }
        .ei3-rule-icn.green { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.2); color: #10b981; }
        .ei3-rule-title { font-size: 13.5px; font-weight: 600; color: #fff; }
        .ei3-rule-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .ei3-rule-li { display: flex; gap: 10px; font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,.6); }
        .ei3-rule-li strong { color: rgba(255,255,255,.95); font-weight: 600; }
        .ei3-bullet { width: 4px; height: 4px; border-radius: 50%; background: #faa000; margin-top: 7px; flex-shrink: 0; }
        .ei3-bullet.green { background: #10b981; }
        .ei3-bullet.red { background: #fd1c00; }

        .ei3-warn { margin-top: 14px; padding: 12px 16px; background: rgba(253,28,0,.06); border: 1px solid rgba(253,28,0,.25); border-left: 3px solid #fd1c00; border-radius: 8px; display: flex; gap: 10px; align-items: flex-start; }
        .ei3-warn-icn { width: 18px; height: 18px; color: #fd1c00; flex-shrink: 0; margin-top: 1px; }
        .ei3-warn-body { font-size: 12.5px; line-height: 1.5; color: rgba(255,255,255,.65); }
        .ei3-warn-body strong { color: #fff; }
        .ei3-warn.amber { background: rgba(238,167,39,.06); border-color: rgba(238,167,39,.3); border-left-color: #faa000; }
        .ei3-warn.amber .ei3-warn-icn { color: #faa000; }

        .ei3-ppt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 820px) { .ei3-ppt-grid { grid-template-columns: 1fr; } }
        .ei3-ppt-card { padding: 18px 20px; background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; }
        .ei3-ppt-num { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(238,167,39,.1); border: 1px solid rgba(238,167,39,.3); border-radius: 50%; font-weight: 800; font-size: 11px; color: #faa000; margin-right: 9px; }
        .ei3-ppt-h { font-size: 13.5px; font-weight: 600; margin: 0 0 12px; display: flex; align-items: center; color: #fff; }
        .ei3-color-row { display: flex; align-items: center; gap: 11px; padding: 6px 0; font-size: 12.5px; color: rgba(255,255,255,.85); }
        .ei3-color-swatch { width: 20px; height: 20px; border-radius: 5px; border: 1px solid rgba(255,255,255,.12); flex-shrink: 0; }
        .ei3-color-hex { color: rgba(255,255,255,.4); font-family: ui-monospace, monospace; font-size: 11px; }

        .ei3-slide-flow { display: grid; grid-template-columns: 1fr 2.2fr 1fr; gap: 10px; margin-top: 12px; }
        @media (max-width: 720px) { .ei3-slide-flow { grid-template-columns: 1fr; } }
        .ei3-slide { padding: 14px; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.02); border-radius: 10px; }
        .ei3-slide-num { font-size: 10px; letter-spacing: .15em; text-transform: uppercase; color: #faa000; font-weight: 700; margin-bottom: 7px; }
        .ei3-slide-name { font-size: 13px; font-weight: 600; margin-bottom: 7px; color: #fff; }
        .ei3-slide-li { font-size: 11.5px; color: rgba(255,255,255,.55); padding: 2px 0; line-height: 1.5; }

        .ei3-card-h { display: flex; align-items: center; gap: 11px; padding: 13px 18px; background: rgba(255,255,255,.02); border-bottom: 1px solid rgba(255,255,255,.06); font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #fff; }
        .ei3-card-h-icn { width: 15px; height: 15px; color: #faa000; }
        .ei3-contact-row { display: grid; grid-template-columns: 1fr auto; gap: 14px; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,.04); align-items: center; }
        .ei3-contact-row:last-child { border-bottom: none; }
        .ei3-contact-role { font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.4); margin-bottom: 3px; font-weight: 600; }
        .ei3-contact-name { font-size: 13.5px; font-weight: 500; color: rgba(255,255,255,.92); }
        .ei3-contact-note { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 3px; }
        .ei3-contact-phone { font-family: ui-monospace, monospace; font-size: 12.5px; color: #faa000; font-weight: 700; padding: 6px 11px; background: rgba(238,167,39,.08); border: 1px solid rgba(238,167,39,.2); border-radius: 6px; white-space: nowrap; text-decoration: none; transition: background .15s; }
        .ei3-contact-phone:hover { background: rgba(238,167,39,.16); }
        .ei3-contacts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        @media (max-width: 820px) { .ei3-contacts-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ei3">
        <div className="ei3-hero">
          <div className="ei3-hero-inner">
            <span className="ei3-eyebrow"><span className="ei3-eyebrow-dot" />Project Space — Season 8</span>
            <h1 className="ei3-h1">Everything you need.<br />In one scroll.</h1>
            <p className="ei3-sub">Welcome kit pickup, hall seating, daily schedule, dress code, guidelines, presentation rules and emergency contacts — all in one place.</p>
            <div className="ei3-stats">
              <div className="ei3-stat"><div className="ei3-stat-num">900+</div><div className="ei3-stat-lab">Trainees</div></div>
              <div className="ei3-stat"><div className="ei3-stat-num">160</div><div className="ei3-stat-lab">Teams</div></div>
              <div className="ei3-stat"><div className="ei3-stat-num">7</div><div className="ei3-stat-lab">Days</div></div>
              <div className="ei3-stat"><div className="ei3-stat-num">7</div><div className="ei3-stat-lab">Domains</div></div>
            </div>
            {teamNumber && myVenue && myHall && (
              <div className="ei3-mine">
                <span className="ei3-mine-pill">{teamNumber}</span>
                <span className="ei3-mine-text">Seated in <strong>{myHall.name}</strong> · Welcome kit at <strong>Floor {myVenue.floor}, Desk {myVenue.desk}</strong></span>
                <button className="ei3-mine-link" onClick={() => scrollTo("kit")}>See details<span className="ei3-mine-link-icn">{I.arrowDown}</span></button>
              </div>
            )}
          </div>
        </div>

        <div className="ei3-pillnav-wrap">
          <div className="ei3-pillnav">
            {SECTIONS.map((s, i) => (
              <button key={s.id} className={`ei3-pill ${activeSection === s.id ? "active" : ""}`} onClick={() => scrollTo(s.id)}>
                <span className="ei3-pill-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{s.short}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ei3-dots">
          {SECTIONS.map((s) => (
            <button key={s.id} className={`ei3-dot ${activeSection === s.id ? "active" : ""}`} onClick={() => scrollTo(s.id)} aria-label={s.label}>
              <span className="ei3-dot-tip">{s.label}</span>
            </button>
          ))}
        </div>

        <KitSection id="ei-sec-kit" num={1} search={searchTeam} setSearch={setSearchTeam} myTeam={teamNumber} myVenue={myVenue} myHall={myHall} />
        <HallsSection id="ei-sec-halls" num={2} myN={myN} />
        <ScheduleSection id="ei-sec-schedule" num={3} />
        <DressSection id="ei-sec-dress" num={4} />
        <RulesSection id="ei-sec-rules" num={5} />
        <PptSection id="ei-sec-ppt" num={6} />
        <ContactsSection id="ei-sec-contacts" num={7} />
      </div>
    </>
  );
}

function SectionHeader({ num, label, title, desc }) {
  return (
    <>
      <div className="ei3-sec-eyebrow"><span className="ei3-sec-eyebrow-num">{num}</span>{label}</div>
      <h2 className="ei3-sec-h2">{title}</h2>
      <p className="ei3-sec-desc">{desc}</p>
    </>
  );
}

function KitSection({ id, num, search, setSearch, myTeam, myVenue, myHall }) {
  const result = useMemo(() => {
    if (!search.trim()) return null;
    let q = search.trim().toUpperCase();
    if (!q.startsWith("PS-")) {
      const numStr = q.replace(/[^0-9]/g, "");
      if (!numStr) return { notFound: true };
      q = "PS-" + numStr.padStart(3, "0");
    }
    const n = parseInt(q.replace("PS-", ""), 10);
    if (isNaN(n) || n < 1 || n > 160) return { notFound: true };
    return { team: q, venue: getVenue(q), hall: getHall(q) };
  }, [search]);

  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Welcome Kit" title="Where to collect your kit" desc="Pickup is mandatory on Day 1 (Wed) between 9:00 – 10:00 AM at your assigned floor and desk." />
      <div className="ei3-kit-grid">
        <div className="ei3-card ei3-card-pad">
          <div style={{ marginBottom: 14, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>Find any team</div>
          <div className="ei3-search-wrap">
            <span className="ei3-search-icn">{I.search}</span>
            <input className="ei3-search-in" placeholder="e.g. PS-042 or just 42" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {result && !result.notFound && (
            <div className="ei3-result">
              <div className="ei3-result-top">
                <div className="ei3-result-team">{result.team}</div>
                <span className="ei3-result-hall-tag" style={{ background: result.hall.accentSoft, color: result.hall.accent, border: `1px solid ${result.hall.accentBorder}` }}>{result.hall.name}</span>
              </div>
              <div className="ei3-result-rows">
                <div className="ei3-result-cell"><div className="ei3-result-cell-lab">Floor</div><div className="ei3-result-cell-val">Floor {result.venue.floor}</div></div>
                <div className="ei3-result-cell"><div className="ei3-result-cell-lab">Desk</div><div className="ei3-result-cell-val">Desk {result.venue.desk}</div><div className="ei3-result-cell-sub">{result.venue.range}</div></div>
              </div>
            </div>
          )}
          {result && result.notFound && (<div className="ei3-not-found">No team found. Valid range is <strong style={{ color: "#fff" }}>PS-001 to PS-160</strong>.</div>)}
          {!result && (<p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>Type a team number (PS-001 to PS-160) to find their welcome kit pickup location.</p>)}
        </div>

        {myTeam && myVenue && myHall ? (
          <div className="ei3-mykit">
            <div className="ei3-mykit-head"><span className="ei3-mykit-head-dot" />Your Welcome Kit</div>
            <div className="ei3-mykit-team">{myTeam}</div>
            <div className="ei3-mykit-rows">
              <div className="ei3-mykit-cell"><div className="ei3-mykit-cell-lab">Floor</div><div className="ei3-mykit-cell-val">{myVenue.floor}</div></div>
              <div className="ei3-mykit-cell"><div className="ei3-mykit-cell-lab">Desk</div><div className="ei3-mykit-cell-val">{myVenue.desk}</div></div>
              <div className="ei3-mykit-cell"><div className="ei3-mykit-cell-lab">Hall</div><div className="ei3-mykit-cell-val" style={{ color: myHall.accent }}>{myHall.name}</div></div>
            </div>
            <div className="ei3-mykit-pickup"><strong>When:</strong> Day 1 (Wed) · 9:00 – 10:00 AM<br /><strong>Range at desk:</strong> {myVenue.range}</div>
          </div>
        ) : (
          <div className="ei3-card">
            <div className="ei3-pickup-info">
              <div className="ei3-pickup-h">Pickup Schedule</div>
              <div className="ei3-pickup-text">All 160 teams collect their welcome kit on <strong>Day 1 (Wednesday) between 9:00 – 10:00 AM</strong> from their assigned floor and desk.</div>
              <div className="ei3-pickup-grid">
                <div className="ei3-pickup-stat"><div className="ei3-pickup-stat-lab">Floors</div><div className="ei3-pickup-stat-num">5</div></div>
                <div className="ei3-pickup-stat"><div className="ei3-pickup-stat-lab">Desks per floor</div><div className="ei3-pickup-stat-num">4</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HallsSection({ id, num, myN }) {
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Hall Seating" title="Where teams sit during the event" desc="Each team has a fixed chair across 4 halls. Your team's chair pulses if you're a logged-in trainee." />
      <div className="ei3-halls-grid">
        {HALLS.map((hall) => <HallCard key={hall.id} hall={hall} myN={myN} />)}
      </div>
    </section>
  );
}

function HallCard({ hall, myN }) {
  const isMine = myN && myN >= hall.startTeam && myN <= hall.endTeam;
  // Team numbering: column-major (each column fills bottom-to-top per brochure)
  const cells = [];
  for (let row = 0; row < hall.rows; row++) {
    for (let col = 0; col < hall.cols; col++) {
      const teamN = hall.startTeam + col * hall.rows + (hall.rows - 1 - row);
      cells.push(teamN <= hall.endTeam ? teamN : null);
    }
  }
  return (
    <div className={`ei3-hall ${isMine ? "mine" : ""}`} style={{ "--ha": hall.accent, "--hb": hall.accentSoft, "--hbd": hall.accentBorder }}>
      <div className="ei3-hall-head">
        <div className="ei3-hall-name">
          <span className="ei3-hall-name-dot" />
          {hall.name}
          <span className="ei3-hall-suffix">· {hall.suffix}</span>
        </div>
        <div className="ei3-hall-range">{hall.description}</div>
      </div>
      <div className="ei3-hall-body">
        <div className="ei3-room">
          {hall.entranceLeft && (<div className="ei3-entrance left"><span className="ei3-entrance-icn">{I.door}</span><span>Entry</span></div>)}
          {hall.entranceRight && (<div className="ei3-entrance right"><span className="ei3-entrance-icn">{I.door}</span><span>Entry</span></div>)}
          <div className="ei3-chair-grid" style={{ gridTemplateColumns: `repeat(${hall.cols}, 1fr)` }}>
            {cells.map((teamN, i) => {
              if (!teamN) return <div key={i} className="ei3-chair ei3-chair-empty" />;
              const mine = myN === teamN;
              return (
                <div key={i} className={`ei3-chair ${mine ? "mine" : ""}`} title={mine ? `Your team — Team ${teamN}` : `Team ${teamN}`}>
                  <ChairIcon size={11} />
                  <span className="ei3-chair-num">{teamN}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={`ei3-hall-foot ${isMine ? "mine" : ""}`}>
        <span className="ei3-hall-foot-icn">{I.pin}</span>
        {isMine ? (<span>You sit in this hall — <strong>Team {myN}</strong></span>) : (<span>{hall.endTeam - hall.startTeam + 1} teams · {hall.rows} rows × {hall.cols} columns</span>)}
      </div>
    </div>
  );
}

function ScheduleSection({ id, num }) {
  const [tab, setTab] = useState("day1");
  const data = TIMINGS[tab];
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Schedule" title="Daily timings" desc="Strict adherence is mandatory. Late arrivals require approval from your project mentor." />
      <div className="ei3-schedule-tabs">
        <button className={`ei3-stab ${tab === "day1" ? "active" : ""}`} onClick={() => setTab("day1")}>Day 1 (Wed)</button>
        <button className={`ei3-stab ${tab === "day2to6" ? "active" : ""}`} onClick={() => setTab("day2to6")}>Day 2 – 6</button>
        <button className={`ei3-stab ${tab === "day7" ? "active" : ""}`} onClick={() => setTab("day7")}>Day 7 (Tue)</button>
      </div>
      <div className="ei3-timeline">
        {data.map(([label, time], i) => (
          <div key={i} className="ei3-time-row">
            <span className="ei3-time-lab">{label}</span>
            <span className="ei3-time-val">{time}</span>
          </div>
        ))}
      </div>
      {tab === "day7" && (
        <div className="ei3-warn amber" style={{ marginTop: 14 }}>
          <span className="ei3-warn-icn">{I.alert}</span>
          <div className="ei3-warn-body"><strong>Check-out (13th May 2026):</strong> Buses to Rajahmundry & Kakinada by 9:00 AM.</div>
        </div>
      )}
    </section>
  );
}

function DressSection({ id, num }) {
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Dress Code" title="What to wear, day-by-day" desc="Dress code with shoes & ID card mandatory from 9:30 AM until dinner. Grooming and clean-shaven appearance is required." />
      <div className="ei3-dress-grid">
        {DRESS_CODE.map((d, i) => (
          <div key={i} className="ei3-dress-card" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="ei3-dress-day">{d.day}</div>
            <div className="ei3-dress-week">{d.week}</div>
            <div className="ei3-dress-attire">{d.attire}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RulesSection({ id, num }) {
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Guidelines" title="Code of conduct" desc="Premises are under CCTV surveillance. Failure to comply may result in restricted access or termination." />
      <div className="ei3-rules-grid">
        <div className="ei3-rule-card">
          <div className="ei3-rule-head"><span className="ei3-rule-icn">{I.shield}</span><span className="ei3-rule-title">Conduct & Movement</span></div>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>On-site:</strong> No shouting on the floor or in the building.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>In transit:</strong> Quiet during commute to hostel/meals.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>At hostel:</strong> Especially during night hours.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Littering:</strong> Strictly prohibited. Use designated bins.</span></li>
          </ul>
        </div>
        <div className="ei3-rule-card">
          <div className="ei3-rule-head"><span className="ei3-rule-icn">{I.shirt}</span><span className="ei3-rule-title">Grooming & Attendance</span></div>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Hair:</strong> Neatly trimmed and well-groomed.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Shaving:</strong> Clean-shaven at all times.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Attire:</strong> ID card and shoes mandatory.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>100% attendance</strong> across all 7 days required.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Late permissions:</strong> Mentor approval required.</span></li>
          </ul>
        </div>
        <div className="ei3-rule-card">
          <div className="ei3-rule-head"><span className="ei3-rule-icn green">{I.check}</span><span className="ei3-rule-title">Internet — Allowed</span></div>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet green" /><span><strong>Project work:</strong> Use internet for project & research only.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet green" /><span><strong>Knowledge expansion:</strong> Resources to improve technical skills.</span></li>
          </ul>
        </div>
        <div className="ei3-rule-card">
          <div className="ei3-rule-head"><span className="ei3-rule-icn">{I.alert}</span><span className="ei3-rule-title">Internet — Prohibited</span></div>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet red" /><span><strong>Mobile phones</strong> limited to project work only.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet red" /><span><strong>No</strong> obscene, offensive or illegal content.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet red" /><span><strong>No</strong> copyrighted downloads.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet red" /><span><strong>No</strong> social media unless instructed.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet red" /><span><strong>No</strong> accessing others' sensitive info.</span></li>
          </ul>
        </div>
      </div>

      <div className="ei3-card" style={{ marginTop: 14 }}>
        <div className="ei3-card-h"><span className="ei3-card-h-icn">{I.women}</span>Specific Guidelines for Female Trainees</div>
        <div className="ei3-card-pad">
          <div className="ei3-rules-grid" style={{ gap: 12 }}>
            <ul className="ei3-rule-list">
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Night escort:</strong> Security personnel escort to hostel after night sessions.</span></li>
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Priority dispersal:</strong> Female trainees leave first.</span></li>
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Final attendance</strong> before dispersal.</span></li>
            </ul>
            <ul className="ei3-rule-list">
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Female staff presence</strong> until all girls leave.</span></li>
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Zero tolerance</strong> for harassment or misconduct.</span></li>
              <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Immediate reporting</strong> — confidentiality guaranteed.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ei3-warn">
        <span className="ei3-warn-icn">{I.alert}</span>
        <div className="ei3-warn-body"><strong>Consequences of violation:</strong> Personal phones and laptops will be confiscated. Trainee will be terminated from Project Space and will not receive completion certificates.</div>
      </div>
    </section>
  );
}

function PptSection({ id, num }) {
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Presentation" title="PPT guidelines" desc="AI tools encouraged. Final deck must follow the 5-slide rule and formatting standards below." />
      <div className="ei3-ppt-grid">
        <div className="ei3-ppt-card">
          <h3 className="ei3-ppt-h"><span className="ei3-ppt-num">1</span>Colour Palette</h3>
          <div className="ei3-color-row"><div className="ei3-color-swatch" style={{ background: "#FAF4DF" }} /><div><div style={{ fontWeight: 500 }}>Background</div><div className="ei3-color-hex">#FAF4DF</div></div></div>
          <div className="ei3-color-row"><div className="ei3-color-swatch" style={{ background: "#E3562B" }} /><div><div style={{ fontWeight: 500 }}>Primary · Highlights</div><div className="ei3-color-hex">#E3562B</div></div></div>
          <div className="ei3-color-row"><div className="ei3-color-swatch" style={{ background: "#1D3639" }} /><div><div style={{ fontWeight: 500 }}>Secondary · Titles</div><div className="ei3-color-hex">#1D3639</div></div></div>
          <div className="ei3-color-row"><div className="ei3-color-swatch" style={{ background: "#7F7F7F" }} /><div><div style={{ fontWeight: 500 }}>Neutral · Subtext</div><div className="ei3-color-hex">#7F7F7F</div></div></div>
        </div>
        <div className="ei3-ppt-card">
          <h3 className="ei3-ppt-h"><span className="ei3-ppt-num">2</span>Typography — Poppins</h3>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
          </ul>
        </div>
        <div className="ei3-ppt-card">
          <h3 className="ei3-ppt-h"><span className="ei3-ppt-num">3</span>Slide Layout</h3>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Title at top, content below.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Left text + right image when needed.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Clean spacing; simple icons.</span></li>
          </ul>
        </div>
        <div className="ei3-ppt-card">
          <h3 className="ei3-ppt-h"><span className="ei3-ppt-num">4</span>Content Rules</h3>
          <ul className="ei3-rule-list">
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Short, punchy sentences.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Bullets over paragraphs.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Animations: Fade or Appear only.</span></li>
            <li className="ei3-rule-li"><span className="ei3-bullet" /><span>Same font, colors, layout across all slides.</span></li>
          </ul>
        </div>
      </div>

      <div className="ei3-card" style={{ marginTop: 14 }}>
        <div className="ei3-card-h"><span className="ei3-card-h-icn">{I.presentation}</span>Slide Structure — Maximum 5 Slides</div>
        <div className="ei3-card-pad">
          <div className="ei3-slide-flow">
            <div className="ei3-slide">
              <div className="ei3-slide-num">Slide 1</div>
              <div className="ei3-slide-name">Cover</div>
              <div className="ei3-slide-li">• Project Title</div>
              <div className="ei3-slide-li">• Team Name</div>
              <div className="ei3-slide-li">• Team Members</div>
            </div>
            <div className="ei3-slide">
              <div className="ei3-slide-num">Slides 2 – 4</div>
              <div className="ei3-slide-name">Project Body</div>
              <div className="ei3-slide-li">• Problem Statement</div>
              <div className="ei3-slide-li">• Solution Overview</div>
              <div className="ei3-slide-li">• Features</div>
              <div className="ei3-slide-li">• Demo Screenshots / Workflow</div>
              <div className="ei3-slide-li">• Technology Stack</div>
            </div>
            <div className="ei3-slide">
              <div className="ei3-slide-num">Slide 5</div>
              <div className="ei3-slide-name">Closing</div>
              <div className="ei3-slide-li">• Team Introduction</div>
              <div className="ei3-slide-li">• Learnings</div>
              <div className="ei3-slide-li">• Thank You Note</div>
            </div>
          </div>
          <div className="ei3-warn amber" style={{ marginTop: 14 }}>
            <span className="ei3-warn-icn">{I.alert}</span>
            <div className="ei3-warn-body"><strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template from the login portal — approved colors, fonts, icons and ready-made layouts.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactsSection({ id, num }) {
  return (
    <section id={id} className="ei3-section">
      <SectionHeader num={num} label="Contacts" title="Help & emergency" desc="Save these numbers. Battery-operated campus vehicles are available for non-critical injuries to the on-campus Apollo medical centre." />
      <div className="ei3-card">
        <div className="ei3-card-h"><span className="ei3-card-h-icn">{I.alert}</span>Emergency & Security</div>
        {CONTACTS.emergency.map((c, i) => (
          <div key={i} className="ei3-contact-row">
            <div>
              <div className="ei3-contact-role">{c.role}</div>
              <div className="ei3-contact-name">{c.name}</div>
              {c.note && <div className="ei3-contact-note">{c.note}</div>}
            </div>
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei3-contact-phone">{c.phone}</a>
          </div>
        ))}
      </div>
      <div className="ei3-contacts-grid">
        <div className="ei3-card">
          <div className="ei3-card-h"><span className="ei3-card-h-icn">{I.shield}</span>Hostel Queries</div>
          {CONTACTS.hostel.map((c, i) => (
            <div key={i} className="ei3-contact-row">
              <div><div className="ei3-contact-role">{c.role}</div><div className="ei3-contact-name">{c.name}</div></div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei3-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>
        <div className="ei3-card">
          <div className="ei3-card-h"><span className="ei3-card-h-icn">{I.women}</span>Female Coordinators</div>
          {CONTACTS.female.map((c, i) => (
            <div key={i} className="ei3-contact-row">
              <div><div className="ei3-contact-role">{c.role}</div><div className="ei3-contact-name">{c.name}</div></div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei3-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>
      </div>
      <div className="ei3-warn" style={{ marginTop: 14 }}>
        <span className="ei3-warn-icn">{I.alert}</span>
        <div className="ei3-warn-body"><strong>First aid kit locations:</strong> Corridor lockers on the 2nd floor and 4th floor of Technical Hub.</div>
      </div>
    </section>
  );
}