"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================
   EVENT INFO — Single-Scroll Page (v2)
   Path: app/dashboard/components/EventInfo.js
   Sections (in scroll order):
     1. Welcome kit lookup
     2. Hall layouts (from brochure)
     3. Floor & desk system
     4. Schedule
     5. Dress code
     6. Guidelines
     7. PPT guide
     8. Contacts
   ============================================================ */

/* ---------- HALL LAYOUTS (from brochure) ---------- */
// Each hall has rows x cols of team chairs.
// Numbers go column-by-column, bottom-to-top within each column.
const HALLS = [
  {
    id: "hall-4-1-blue",
    name: "Hall 4.1",
    color: "#3b82f6",
    bg: "rgba(59,130,246,.08)",
    border: "rgba(59,130,246,.25)",
    rows: 4,
    cols: 11,
    startTeam: 1,
    endTeam: 44,
    entranceSide: "left",
    description: "Teams 1 – 44",
  },
  {
    id: "hall-4-2-cyan",
    name: "Hall 4.2",
    color: "#22d3ee",
    bg: "rgba(34,211,238,.08)",
    border: "rgba(34,211,238,.25)",
    rows: 4,
    cols: 9,
    startTeam: 45,
    endTeam: 80,
    entranceSide: "right",
    description: "Teams 45 – 80",
  },
  {
    id: "hall-2-1-brown",
    name: "Hall 2.1",
    color: "#a16207",
    bg: "rgba(161,98,7,.1)",
    border: "rgba(161,98,7,.3)",
    rows: 4,
    cols: 11,
    startTeam: 81,
    endTeam: 124,
    entranceSide: "left",
    description: "Teams 81 – 124",
  },
  {
    id: "hall-4-1-green",
    name: "Hall 4.1 (Green)",
    color: "#10b981",
    bg: "rgba(16,185,129,.08)",
    border: "rgba(16,185,129,.25)",
    rows: 4,
    cols: 9,
    startTeam: 125,
    endTeam: 160,
    entranceSide: "right",
    description: "Teams 125 – 160",
  },
];

/* ---------- FLOOR / DESK MAPPING (Welcome Kit) ---------- */
const FLOOR_DESK_MAP = {
  1: [{ desk: 1, range: "PS-001 – PS-008" }, { desk: 2, range: "PS-009 – PS-016" }, { desk: 3, range: "PS-017 – PS-024" }, { desk: 4, range: "PS-025 – PS-032" }],
  2: [{ desk: 1, range: "PS-033 – PS-040" }, { desk: 2, range: "PS-041 – PS-048" }, { desk: 3, range: "PS-049 – PS-056" }, { desk: 4, range: "PS-057 – PS-064" }],
  3: [{ desk: 1, range: "PS-065 – PS-072" }, { desk: 2, range: "PS-073 – PS-080" }, { desk: 3, range: "PS-081 – PS-088" }, { desk: 4, range: "PS-089 – PS-096" }],
  4: [{ desk: 1, range: "PS-097 – PS-104" }, { desk: 2, range: "PS-105 – PS-112" }, { desk: 3, range: "PS-113 – PS-120" }, { desk: 4, range: "PS-121 – PS-128" }],
  5: [{ desk: 1, range: "PS-129 – PS-136" }, { desk: 2, range: "PS-137 – PS-144" }, { desk: 3, range: "PS-145 – PS-152" }, { desk: 4, range: "PS-153 – PS-160" }],
};

function getVenue(teamNumber) {
  if (!teamNumber || !teamNumber.startsWith("PS-")) return null;
  const n = parseInt(teamNumber.replace("PS-", ""), 10);
  if (isNaN(n) || n < 1 || n > 160) return null;
  const floor = Math.ceil(n / 32);
  const idx = ((n - 1) % 32) + 1;
  const desk = Math.ceil(idx / 8);
  const start = (floor - 1) * 32 + (desk - 1) * 8 + 1;
  const end = start + 7;
  return { floor, desk, range: `PS-${String(start).padStart(3, "0")} – PS-${String(end).padStart(3, "0")}` };
}

function getHall(teamNumber) {
  if (!teamNumber || !teamNumber.startsWith("PS-")) return null;
  const n = parseInt(teamNumber.replace("PS-", ""), 10);
  if (isNaN(n)) return null;
  return HALLS.find((h) => n >= h.startTeam && n <= h.endTeam);
}

/* ---------- DRESS CODE ---------- */
const DRESS_CODE = [
  { day: "DAY 1", week: "WED", attire: "Drive Ready / SkillUp T-Shirt (Black)" },
  { day: "DAY 2", week: "THU", attire: "Project Space T-Shirt" },
  { day: "DAY 3", week: "FRI", attire: "Civil Formal Wear" },
  { day: "DAY 4", week: "SAT", attire: "Project Space T-Shirt" },
  { day: "DAY 5", week: "SUN", attire: "White Code Dress" },
  { day: "DAY 6", week: "MON", attire: "Drive Ready / SkillUp T-Shirt (Black)" },
  { day: "DAY 7", week: "TUE", attire: "Project Space T-Shirt" },
];

/* ---------- TIMINGS ---------- */
const TIMINGS = {
  day1: [
    ["Hostel Check-in", "By 9:00 AM"],
    ["Welcome Kit Distribution", "9:00 – 10:00 AM"],
    ["Morning Session", "10:00 AM – 12:00 PM"],
    ["Snacks", "11:00 AM"],
    ["Lunch", "12:00 – 1:30 PM"],
    ["Afternoon Session", "1:30 – 5:00 PM"],
    ["Snacks", "3:30 PM"],
    ["Project Street", "4:30 – 6:30 PM"],
    ["Dinner", "7:00 – 8:00 PM"],
    ["Night Session", "8:00 PM – 12:00 AM"],
    ["Snacks", "9:30 PM"],
  ],
  day2to6: [
    ["Morning Session", "9:30 AM – 12:00 PM"],
    ["Snacks", "11:00 AM"],
    ["Lunch", "12:00 – 1:30 PM"],
    ["Afternoon Session", "1:30 – 5:00 PM"],
    ["Snacks", "3:30 PM"],
    ["Project Street", "4:30 – 6:30 PM"],
    ["Dinner", "7:00 – 8:00 PM"],
    ["Night Session", "8:00 PM – 12:00 AM"],
    ["Snacks", "9:30 PM"],
  ],
  day7: [
    ["Morning Session", "9:30 AM – 12:00 PM"],
    ["Snacks", "11:00 AM"],
    ["Lunch", "12:00 – 1:30 PM"],
    ["Afternoon Session", "1:30 – 5:00 PM"],
    ["Snacks", "3:30 PM"],
    ["Gathering at Gallery", "By 6:00 PM"],
    ["Presentations at Gallery", "6:00 – 8:00 PM"],
    ["Dinner at Gallery", "8:00 – 9:00 PM"],
    ["Presentations Conclusion", "9:00 PM onwards"],
    ["Return to Hostels", "11:30 PM"],
  ],
};

/* ---------- CONTACTS ---------- */
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

/* ---------- SECTIONS for nav ---------- */
const SECTIONS = [
  { id: "kit", label: "Welcome Kit", short: "Kit" },
  { id: "halls", label: "Hall Layout", short: "Halls" },
  { id: "floor", label: "Floor Plan", short: "Floor" },
  { id: "schedule", label: "Schedule", short: "Time" },
  { id: "dress", label: "Dress Code", short: "Dress" },
  { id: "rules", label: "Guidelines", short: "Rules" },
  { id: "ppt", label: "PPT Guide", short: "PPT" },
  { id: "contacts", label: "Contacts", short: "Help" },
];

/* ---------- ICONS ---------- */
const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8H7.5z"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C14.5 3 12 8 12 8h4.5z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  shirt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z"/></svg>,
  presentation: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="m7 11 3-3 2 2 4-5"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>,
  arrowDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  women: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9"/></svg>,
};

/* ====================================================================== */
/*                              MAIN                                       */
/* ====================================================================== */
export default function EventInfo({ user }) {
  const [activeSection, setActiveSection] = useState("kit");
  const [searchTeam, setSearchTeam] = useState("");
  const sectionRefs = useRef({});

  const teamNumber = user?.teamNumber || user?.team_number;
  const myVenue = teamNumber ? getVenue(teamNumber) : null;
  const myHall = teamNumber ? getHall(teamNumber) : null;

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveSection(visible[0].target.id.replace("ei-sec-", ""));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`ei-sec-${s.id}`);
      if (el) {
        sectionRefs.current[s.id] = el;
        observer.observe(el);
      }
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
        :root {
          --ei-bg: #050008;
          --ei-card: #11091a;
          --ei-card-2: #0c0613;
          --ei-line: rgba(255,255,255,.08);
          --ei-line-2: rgba(255,255,255,.14);
          --ei-text: #ededed;
          --ei-dim: #9b9aa3;
          --ei-mute: #6b6a73;
          --ei-red: #fd1c00;
          --ei-orange: #eea727;
          --ei-green: #10b981;
          --ei-purple: #7B2FBE;
          --ei-blue: #4ea8ff;
        }
        .ei2 * { box-sizing: border-box; }
        .ei2 {
          font-family: "DM Sans", system-ui, sans-serif;
          color: var(--ei-text);
          scroll-behavior: smooth;
        }
        @keyframes ei-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ei-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ei-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes ei-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @keyframes ei-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* HERO */
        .ei2-hero {
          position: relative;
          padding: 48px 8px 32px;
          border-bottom: 1px solid var(--ei-line);
          overflow: hidden;
          background:
            radial-gradient(ellipse 700px 280px at 20% 10%, rgba(238,167,39,.10), transparent 60%),
            radial-gradient(ellipse 600px 240px at 80% 90%, rgba(253,28,0,.10), transparent 60%);
        }
        .ei2-hero::before {
          content: "";
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 700px 360px at 50% 0%, #000 20%, transparent 70%);
          pointer-events: none;
        }
        .ei2-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; letter-spacing: .18em;
          color: var(--ei-orange); text-transform: uppercase;
          padding: 6px 12px;
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 100px;
          background: rgba(238,167,39,.06);
        }
        .ei2-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--ei-orange); box-shadow: 0 0 8px var(--ei-orange);
        }
        .ei2-h1 {
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.05; letter-spacing: -.025em;
          font-weight: 700; margin: 16px 0 10px;
        }
        .ei2-h1 .red { color: var(--ei-red); }
        .ei2-sub {
          font-size: clamp(14px, 1.2vw, 16px);
          color: var(--ei-dim); max-width: 600px; line-height: 1.55;
          margin: 0;
        }
        .ei2-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-top: 24px; max-width: 640px;
        }
        .ei2-stat {
          padding: 12px 14px;
          border: 1px solid var(--ei-line);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ei2-stat-num { font-size: 22px; font-weight: 700; line-height: 1; }
        .ei2-stat-lab { font-size: 10.5px; color: var(--ei-mute); margin-top: 6px; letter-spacing: .14em; text-transform: uppercase; }
        @media (max-width: 720px) {
          .ei2-hero { padding: 36px 4px 28px; }
          .ei2-stats { grid-template-columns: repeat(2,1fr); }
        }

        /* My team highlight (only if user is a trainee with team) */
        .ei2-mine {
          margin-top: 24px;
          padding: 16px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(253,28,0,.10), rgba(238,167,39,.06));
          border: 1px solid rgba(253,28,0,.25);
          display: flex; align-items: center; gap: 16px;
          flex-wrap: wrap;
          animation: ei-fade-up .5s ease both .2s;
        }
        .ei2-mine-pulse {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--ei-red); box-shadow: 0 0 10px var(--ei-red);
          animation: ei-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .ei2-mine-text { font-size: 14px; color: var(--ei-text); flex: 1; min-width: 200px; }
        .ei2-mine-text strong { color: var(--ei-orange); }
        .ei2-mine-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; letter-spacing: .04em;
          padding: 7px 12px;
          background: rgba(253,28,0,.12);
          border: 1px solid rgba(253,28,0,.3);
          border-radius: 8px;
          color: var(--ei-red);
          cursor: pointer;
          transition: background .15s;
        }
        .ei2-mine-link:hover { background: rgba(253,28,0,.2); }

        /* Scroll cue */
        .ei2-scroll-cue {
          margin-top: 28px;
          display: flex; align-items: center; justify-content: center;
          gap: 8px;
          font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
          color: var(--ei-mute); font-weight: 600;
        }
        .ei2-scroll-icn {
          width: 14px; height: 14px;
          animation: ei-bounce 2s ease-in-out infinite;
          color: var(--ei-orange);
        }

        /* TOP PILL NAV */
        .ei2-pillnav-wrap {
          position: sticky; top: 0; z-index: 30;
          background: linear-gradient(180deg, var(--ei-bg) 70%, transparent);
          padding: 16px 0 12px;
          backdrop-filter: blur(8px);
          margin: 0 -8px;
        }
        .ei2-pillnav {
          display: flex; gap: 4px;
          padding: 4px;
          background: rgba(17,9,26,.85);
          border: 1px solid var(--ei-line);
          border-radius: 100px;
          overflow-x: auto;
          scrollbar-width: none;
          width: fit-content;
          max-width: 100%;
          margin: 0 auto;
          backdrop-filter: blur(12px);
        }
        .ei2-pillnav::-webkit-scrollbar { display: none; }
        .ei2-pill {
          padding: 8px 14px;
          background: transparent;
          border: none;
          color: var(--ei-dim);
          font-family: inherit; font-size: 12.5px; font-weight: 500;
          border-radius: 100px;
          cursor: pointer;
          white-space: nowrap;
          transition: all .15s;
          display: flex; align-items: center; gap: 6px;
        }
        .ei2-pill:hover { color: var(--ei-text); }
        .ei2-pill.active {
          background: var(--ei-red);
          color: white;
          box-shadow: 0 4px 14px rgba(253,28,0,.3);
        }
        .ei2-pill-num {
          font-size: 10px;
          opacity: .6;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
        }

        /* SIDE DOTS */
        .ei2-dots {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 25;
          display: flex; flex-direction: column; gap: 14px;
        }
        @media (max-width: 1100px) {
          .ei2-dots { display: none; }
        }
        .ei2-dot {
          position: relative;
          width: 12px; height: 12px;
          border-radius: 50%;
          border: 2px solid var(--ei-line-2);
          background: transparent;
          cursor: pointer;
          transition: all .25s ease;
        }
        .ei2-dot:hover { border-color: var(--ei-orange); transform: scale(1.2); }
        .ei2-dot.active {
          border-color: var(--ei-red);
          background: var(--ei-red);
          box-shadow: 0 0 0 4px rgba(253,28,0,.15);
        }
        .ei2-dot-tip {
          position: absolute;
          right: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--ei-card);
          border: 1px solid var(--ei-line-2);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          color: var(--ei-text);
          opacity: 0;
          pointer-events: none;
          transition: opacity .15s;
          font-weight: 500;
        }
        .ei2-dot:hover .ei2-dot-tip { opacity: 1; }

        /* MAIN BODY */
        .ei2-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 8px 80px;
        }
        .ei2-section {
          padding: 60px 0 40px;
          scroll-margin-top: 70px;
          animation: ei-fade-up .6s ease both;
        }
        .ei2-section:first-of-type { padding-top: 32px; }
        .ei2-sec-eyebrow {
          font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
          color: var(--ei-orange); font-weight: 600;
          margin-bottom: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .ei2-sec-eyebrow-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 50%;
          font-weight: 700; font-size: 11px;
        }
        .ei2-sec-h2 {
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 700;
          letter-spacing: -.018em;
          margin: 0 0 6px;
        }
        .ei2-sec-desc {
          font-size: 14px; color: var(--ei-dim);
          margin: 0 0 24px; max-width: 620px;
          line-height: 1.5;
        }

        /* CARDS */
        .ei2-card {
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
          overflow: hidden;
        }
        .ei2-card-pad { padding: 22px; }

        /* WELCOME KIT SEARCH */
        .ei2-search-wrap { position: relative; max-width: 480px; }
        .ei2-search-icn {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          width: 18px; height: 18px; color: var(--ei-mute);
        }
        .ei2-search-in {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border: 1px solid var(--ei-line-2);
          background: rgba(255,255,255,.02);
          color: var(--ei-text);
          border-radius: 10px;
          font-family: inherit; font-size: 15px;
          outline: none;
          transition: border-color .18s, background .18s;
        }
        .ei2-search-in:focus { border-color: var(--ei-orange); background: rgba(238,167,39,.04); }
        .ei2-search-in::placeholder { color: var(--ei-mute); }

        .ei2-result {
          margin-top: 20px;
          padding: 24px 26px;
          background: linear-gradient(135deg, rgba(238,167,39,.10), rgba(253,28,0,.06));
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 14px;
          display: grid; grid-template-columns: auto 1fr auto;
          gap: 28px; align-items: center;
          animation: ei-fade-up .35s ease both;
        }
        @media (max-width: 700px) { .ei2-result { grid-template-columns: 1fr; gap: 16px; padding: 20px; } }
        .ei2-result-team-label { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--ei-orange); font-weight: 600; }
        .ei2-result-team-num { font-size: clamp(32px, 5vw, 48px); font-weight: 700; letter-spacing: -.02em; line-height: 1; margin-top: 4px; }
        .ei2-result-info { display: flex; gap: 24px; flex-wrap: wrap; }
        .ei2-result-block-lab { font-size: 10.5px; letter-spacing: .15em; text-transform: uppercase; color: var(--ei-mute); }
        .ei2-result-block-val { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .ei2-result-block-sub { font-size: 11px; color: var(--ei-dim); margin-top: 3px; }
        .ei2-result-hall {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px; font-weight: 600; letter-spacing: .04em;
        }

        .ei2-not-found {
          margin-top: 16px;
          padding: 14px 18px;
          color: var(--ei-dim); font-size: 14px;
          border: 1px dashed var(--ei-line-2);
          border-radius: 8px;
        }

        /* HALLS GRID */
        .ei2-halls-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 820px) { .ei2-halls-grid { grid-template-columns: 1fr; } }

        .ei2-hall {
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .25s, transform .25s;
        }
        .ei2-hall:hover { border-color: var(--ei-line-2); transform: translateY(-2px); }
        .ei2-hall.mine {
          border-color: rgba(253,28,0,.4);
          box-shadow: 0 0 0 3px rgba(253,28,0,.08);
        }
        .ei2-hall-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--ei-line);
        }
        .ei2-hall-name { font-size: 14px; font-weight: 700; letter-spacing: .02em; }
        .ei2-hall-range {
          font-size: 11px; font-weight: 600; letter-spacing: .04em;
          padding: 4px 10px; border-radius: 100px;
          font-variant-numeric: tabular-nums;
        }
        .ei2-hall-body {
          padding: 16px;
          background: var(--ei-card-2);
        }
        .ei2-hall-grid {
          display: grid;
          gap: 4px;
        }
        .ei2-team-cell {
          aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 6px;
          font-size: 9.5px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--ei-dim);
          transition: all .2s;
          position: relative;
        }
        .ei2-team-cell:hover {
          border-color: var(--ei-orange);
          color: var(--ei-text);
          transform: scale(1.05);
          z-index: 2;
        }
        .ei2-team-cell.mine {
          background: linear-gradient(135deg, var(--ei-red), #ff5535);
          border-color: var(--ei-red);
          color: white;
          font-weight: 700;
          box-shadow: 0 0 0 3px rgba(253,28,0,.25), 0 4px 12px rgba(253,28,0,.4);
          animation: ei-pulse 2s ease-in-out infinite;
        }
        .ei2-hall-entrance {
          margin-top: 12px;
          padding: 8px;
          font-size: 10px; letter-spacing: .15em; text-transform: uppercase;
          color: var(--ei-mute); font-weight: 600;
          border-top: 1px dashed rgba(255,255,255,.08);
          padding-top: 12px;
          display: flex; align-items: center; gap: 6px;
        }
        .ei2-hall-entrance-icn {
          width: 10px; height: 10px;
          background: var(--ei-orange);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--ei-orange);
        }

        /* FLOOR PLAN */
        .ei2-floors {
          display: flex; flex-direction: column; gap: 12px;
        }
        .ei2-floor {
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
          overflow: hidden;
        }
        .ei2-floor.mine { border-color: rgba(253,28,0,.4); box-shadow: 0 0 0 3px rgba(253,28,0,.08); }
        .ei2-floor-head {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid var(--ei-line);
        }
        .ei2-floor-num {
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 10px;
          font-weight: 700; font-size: 17px;
          color: var(--ei-orange);
        }
        .ei2-floor-name { font-size: 15px; font-weight: 600; }
        .ei2-floor-sub { font-size: 11px; color: var(--ei-mute); margin-top: 2px; letter-spacing: .04em; }
        .ei2-floor-desks {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--ei-line);
        }
        @media (max-width: 720px) { .ei2-floor-desks { grid-template-columns: repeat(2,1fr); } }
        .ei2-desk {
          padding: 14px 16px;
          background: var(--ei-card);
          display: flex; flex-direction: column; gap: 5px;
          transition: background .2s;
          position: relative;
        }
        .ei2-desk.mine {
          background: linear-gradient(135deg, rgba(253,28,0,.14), rgba(238,167,39,.06));
        }
        .ei2-desk.mine::before {
          content: "YOU";
          position: absolute;
          top: 8px; right: 8px;
          font-size: 9px; font-weight: 700; letter-spacing: .12em;
          padding: 2px 6px;
          background: var(--ei-red); color: white;
          border-radius: 100px;
        }
        .ei2-desk-lab { font-size: 10.5px; letter-spacing: .15em; text-transform: uppercase; color: var(--ei-mute); }
        .ei2-desk-range { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }

        /* SCHEDULE */
        .ei2-schedule-tabs {
          display: flex; gap: 4px; padding: 4px;
          background: var(--ei-card-2);
          border: 1px solid var(--ei-line);
          border-radius: 10px;
          width: fit-content;
          margin-bottom: 18px;
        }
        .ei2-stab {
          padding: 8px 16px;
          background: transparent; border: none;
          color: var(--ei-dim);
          font-family: inherit; font-size: 13px; font-weight: 500;
          border-radius: 7px; cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .ei2-stab.active { background: var(--ei-red); color: white; }

        .ei2-timeline {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--ei-line);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
          overflow: hidden;
        }
        @media (max-width: 600px) { .ei2-timeline { grid-template-columns: 1fr; } }
        .ei2-time-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px;
          background: var(--ei-card);
          gap: 16px;
          transition: background .15s;
        }
        .ei2-time-row:hover { background: rgba(255,255,255,.02); }
        .ei2-time-lab { font-size: 13.5px; }
        .ei2-time-val { font-size: 12px; color: var(--ei-orange); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

        /* DRESS CODE */
        .ei2-dress-grid {
          display: grid; grid-template-columns: repeat(7,1fr);
          gap: 10px;
        }
        @media (max-width: 1000px) { .ei2-dress-grid { grid-template-columns: repeat(4,1fr); } }
        @media (max-width: 600px) { .ei2-dress-grid { grid-template-columns: repeat(2,1fr); } }
        .ei2-dress-card {
          padding: 16px 14px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 10px;
          transition: all .2s;
        }
        .ei2-dress-card:hover { border-color: var(--ei-line-2); transform: translateY(-2px); }
        .ei2-dress-day { font-size: 11px; letter-spacing: .18em; color: var(--ei-red); font-weight: 700; }
        .ei2-dress-week { font-size: 11px; color: var(--ei-mute); margin-top: 3px; letter-spacing: .08em; }
        .ei2-dress-attire { margin-top: 12px; font-size: 12.5px; line-height: 1.4; font-weight: 500; }

        /* RULES */
        .ei2-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 820px) { .ei2-rules-grid { grid-template-columns: 1fr; } }
        .ei2-rule-card {
          padding: 20px 22px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
        }
        .ei2-rule-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 12px; padding-bottom: 12px;
          border-bottom: 1px solid var(--ei-line);
        }
        .ei2-rule-icn {
          width: 34px; height: 34px; padding: 8px;
          background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.2);
          border-radius: 8px;
          color: var(--ei-red);
          flex-shrink: 0;
        }
        .ei2-rule-title { font-size: 14.5px; font-weight: 600; }
        .ei2-rule-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 9px; }
        .ei2-rule-li { display: flex; gap: 10px; font-size: 13px; line-height: 1.55; color: var(--ei-dim); }
        .ei2-rule-li strong { color: var(--ei-text); font-weight: 600; }
        .ei2-bullet { width: 4px; height: 4px; border-radius: 50%; background: var(--ei-orange); margin-top: 8px; flex-shrink: 0; }
        .ei2-bullet.green { background: var(--ei-green); }
        .ei2-bullet.red { background: var(--ei-red); }

        .ei2-warn {
          margin-top: 18px;
          padding: 14px 18px;
          background: rgba(253,28,0,.06);
          border: 1px solid rgba(253,28,0,.25);
          border-left: 3px solid var(--ei-red);
          border-radius: 8px;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .ei2-warn-icn { width: 20px; height: 20px; color: var(--ei-red); flex-shrink: 0; }
        .ei2-warn-body { font-size: 13px; line-height: 1.55; color: var(--ei-dim); }
        .ei2-warn-body strong { color: var(--ei-text); }

        /* PPT */
        .ei2-ppt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 820px) { .ei2-ppt-grid { grid-template-columns: 1fr; } }
        .ei2-ppt-card {
          padding: 20px 22px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
        }
        .ei2-ppt-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 50%;
          font-weight: 700; font-size: 12px;
          color: var(--ei-orange);
          margin-right: 10px;
        }
        .ei2-ppt-h {
          font-size: 14.5px; font-weight: 600;
          margin: 0 0 14px;
          display: flex; align-items: center;
        }
        .ei2-color-row { display: flex; align-items: center; gap: 12px; padding: 7px 0; font-size: 13px; }
        .ei2-color-swatch { width: 22px; height: 22px; border-radius: 5px; border: 1px solid var(--ei-line-2); flex-shrink: 0; }
        .ei2-color-hex { color: var(--ei-mute); font-family: ui-monospace, monospace; font-size: 11.5px; }

        .ei2-slide-flow {
          display: grid; grid-template-columns: 1fr 2.5fr 1fr; gap: 10px; margin-top: 14px;
        }
        @media (max-width: 720px) { .ei2-slide-flow { grid-template-columns: 1fr; } }
        .ei2-slide {
          padding: 16px;
          border: 1px solid var(--ei-line);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ei2-slide-num {
          font-size: 10.5px; letter-spacing: .15em; text-transform: uppercase;
          color: var(--ei-orange); font-weight: 600; margin-bottom: 8px;
        }
        .ei2-slide-name { font-size: 13.5px; font-weight: 600; margin-bottom: 8px; }
        .ei2-slide-li { font-size: 12px; color: var(--ei-dim); padding: 2px 0; line-height: 1.5; }

        /* CONTACTS */
        .ei2-contact-row {
          display: grid; grid-template-columns: 1fr auto;
          gap: 16px; padding: 13px 18px;
          border-bottom: 1px solid var(--ei-line);
          align-items: center;
        }
        .ei2-contact-row:last-child { border-bottom: none; }
        .ei2-contact-role { font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ei-mute); margin-bottom: 4px; }
        .ei2-contact-name { font-size: 14px; font-weight: 500; }
        .ei2-contact-note { font-size: 11.5px; color: var(--ei-dim); margin-top: 3px; }
        .ei2-contact-phone {
          font-family: ui-monospace, monospace;
          font-size: 13px;
          color: var(--ei-orange);
          font-weight: 600;
          padding: 6px 12px;
          background: rgba(238,167,39,.06);
          border: 1px solid rgba(238,167,39,.2);
          border-radius: 6px;
          white-space: nowrap;
          text-decoration: none;
        }
        .ei2-card-h {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid var(--ei-line);
          font-size: 12.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
        }
        .ei2-card-h-icn { width: 16px; height: 16px; color: var(--ei-orange); }
        .ei2-contacts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
        @media (max-width: 820px) { .ei2-contacts-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="ei2">
        {/* HERO */}
        <header className="ei2-hero">
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 8px", position: "relative", zIndex: 1 }}>
            <span className="ei2-eyebrow">
              <span className="ei2-eyebrow-dot" />
              Project Space — Season 8
            </span>
            <h1 className="ei2-h1">
              Everything you need.<br />
              <span className="red">In one scroll.</span>
            </h1>
            <p className="ei2-sub">
              Welcome kit pickup, hall layouts, daily schedule, dress code, guidelines,
              presentation rules and emergency contacts — for every trainee and mentor at
              Project Space 8.
            </p>
            <div className="ei2-stats">
              <div className="ei2-stat"><div className="ei2-stat-num">900+</div><div className="ei2-stat-lab">Trainees</div></div>
              <div className="ei2-stat"><div className="ei2-stat-num">160</div><div className="ei2-stat-lab">Teams</div></div>
              <div className="ei2-stat"><div className="ei2-stat-num">7</div><div className="ei2-stat-lab">Days</div></div>
              <div className="ei2-stat"><div className="ei2-stat-num">7</div><div className="ei2-stat-lab">Domains</div></div>
            </div>

            {teamNumber && myVenue && myHall && (
              <div className="ei2-mine">
                <span className="ei2-mine-pulse" />
                <span className="ei2-mine-text">
                  Your team <strong>{teamNumber}</strong> is in <strong>{myHall.name}</strong> —
                  Welcome kit pickup at <strong>Floor {myVenue.floor}, Desk {myVenue.desk}</strong>
                </span>
                <button className="ei2-mine-link" onClick={() => scrollTo("kit")}>
                  Jump to details
                  <span style={{ width: 12, height: 12 }}>{I.arrowDown}</span>
                </button>
              </div>
            )}

            <div className="ei2-scroll-cue">
              <span>Scroll to explore</span>
              <span className="ei2-scroll-icn">{I.arrowDown}</span>
            </div>
          </div>
        </header>

        {/* TOP PILL NAV */}
        <div className="ei2-pillnav-wrap">
          <div className="ei2-pillnav">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                className={`ei2-pill ${activeSection === s.id ? "active" : ""}`}
                onClick={() => scrollTo(s.id)}
              >
                <span className="ei2-pill-num">{String(i + 1).padStart(2, "0")}</span>
                <span>{s.short}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SIDE DOTS */}
        <div className="ei2-dots">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`ei2-dot ${activeSection === s.id ? "active" : ""}`}
              onClick={() => scrollTo(s.id)}
              aria-label={s.label}
            >
              <span className="ei2-dot-tip">{s.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN BODY — single scroll */}
        <main className="ei2-body">
          <KitSection
            id="ei-sec-kit"
            num={1}
            search={searchTeam}
            setSearch={setSearchTeam}
            myTeam={teamNumber}
          />
          <HallsSection id="ei-sec-halls" num={2} myTeam={teamNumber} />
          <FloorSection id="ei-sec-floor" num={3} myTeam={teamNumber} />
          <ScheduleSection id="ei-sec-schedule" num={4} />
          <DressSection id="ei-sec-dress" num={5} />
          <RulesSection id="ei-sec-rules" num={6} />
          <PptSection id="ei-sec-ppt" num={7} />
          <ContactsSection id="ei-sec-contacts" num={8} />
        </main>
      </div>
    </>
  );
}

/* ====================================================================== */
/*                              SECTIONS                                   */
/* ====================================================================== */
function SectionHeader({ num, label, title, desc }) {
  return (
    <>
      <div className="ei2-sec-eyebrow">
        <span className="ei2-sec-eyebrow-num">{num}</span>
        {label}
      </div>
      <h2 className="ei2-sec-h2">{title}</h2>
      <p className="ei2-sec-desc">{desc}</p>
    </>
  );
}

function KitSection({ id, num, search, setSearch, myTeam }) {
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
    const venue = getVenue(q);
    const hall = getHall(q);
    return { team: q, venue, hall };
  }, [search]);

  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Welcome Kit"
        title="Find your pickup spot"
        desc="Type your team number to find the exact floor and desk where your welcome kit will be distributed on Day 1 (9:00 – 10:00 AM)."
      />
      <div className="ei2-card ei2-card-pad">
        <div className="ei2-search-wrap">
          <span className="ei2-search-icn">{I.search}</span>
          <input
            className="ei2-search-in"
            placeholder={myTeam ? `Try ${myTeam} or any team number` : "Enter team number — e.g. PS-042 or just 42"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {result && !result.notFound && (
          <div className="ei2-result">
            <div>
              <div className="ei2-result-team-label">Team</div>
              <div className="ei2-result-team-num">{result.team}</div>
            </div>
            <div className="ei2-result-info">
              <div>
                <div className="ei2-result-block-lab">Floor</div>
                <div className="ei2-result-block-val">Floor {result.venue.floor}</div>
              </div>
              <div>
                <div className="ei2-result-block-lab">Desk</div>
                <div className="ei2-result-block-val">Desk {result.venue.desk}</div>
                <div className="ei2-result-block-sub">{result.venue.range}</div>
              </div>
              <div>
                <div className="ei2-result-block-lab">Seating Hall</div>
                <div className="ei2-result-block-val">{result.hall.name}</div>
              </div>
            </div>
            <span
              className="ei2-result-hall"
              style={{
                background: result.hall.bg,
                border: `1px solid ${result.hall.border}`,
                color: result.hall.color,
              }}
            >
              {result.hall.description}
            </span>
          </div>
        )}

        {result && result.notFound && (
          <div className="ei2-not-found">
            No team found. Valid range is <strong style={{ color: "var(--ei-text)" }}>PS-001 to PS-160</strong>.
          </div>
        )}

        {!result && (
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--ei-mute)" }}>
            All 160 teams mapped across 5 floors and 4 halls. Pickup is mandatory on{" "}
            <strong style={{ color: "var(--ei-text)" }}>Day 1, 9:00 – 10:00 AM</strong>.
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- HALLS — visual grid like brochure ---------- */
function HallsSection({ id, num, myTeam }) {
  const myN = myTeam && myTeam.startsWith("PS-") ? parseInt(myTeam.replace("PS-", ""), 10) : null;

  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Hall Layout"
        title="Where teams sit during the event"
        desc="Each team has a fixed chair across 4 halls. Your team's seat is highlighted if you're a trainee."
      />
      <div className="ei2-halls-grid">
        {HALLS.map((hall) => {
          const isMine = myN && myN >= hall.startTeam && myN <= hall.endTeam;
          return (
            <div key={hall.id} className={`ei2-hall ${isMine ? "mine" : ""}`}>
              <div
                className="ei2-hall-head"
                style={{ background: hall.bg, borderBottomColor: hall.border }}
              >
                <div className="ei2-hall-name" style={{ color: hall.color }}>
                  {hall.name}
                </div>
                <span
                  className="ei2-hall-range"
                  style={{ background: hall.bg, border: `1px solid ${hall.border}`, color: hall.color }}
                >
                  {hall.description}
                </span>
              </div>
              <div className="ei2-hall-body">
                <HallGrid hall={hall} myN={myN} />
                <div className="ei2-hall-entrance">
                  <span className="ei2-hall-entrance-icn" style={{ background: hall.color, boxShadow: `0 0 6px ${hall.color}` }} />
                  Entrance — {hall.entranceSide}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HallGrid({ hall, myN }) {
  // Generate cells in a rows x cols layout
  // Numbering: column-by-column, bottom-to-top (matching brochure visual)
  const cells = [];
  for (let row = 0; row < hall.rows; row++) {
    const rowCells = [];
    for (let col = 0; col < hall.cols; col++) {
      // For each column, teams go from bottom row to top row
      // So team number = startTeam + col*rows + (rows - 1 - row)
      const teamN = hall.startTeam + col * hall.rows + (hall.rows - 1 - row);
      if (teamN <= hall.endTeam) {
        rowCells.push({ teamN, row, col });
      } else {
        rowCells.push(null);
      }
    }
    cells.push(rowCells);
  }

  return (
    <div
      className="ei2-hall-grid"
      style={{ gridTemplateColumns: `repeat(${hall.cols}, 1fr)` }}
    >
      {cells.flat().map((cell, i) => {
        if (!cell) return <div key={i} style={{ visibility: "hidden" }} />;
        const isMine = myN === cell.teamN;
        return (
          <div
            key={i}
            className={`ei2-team-cell ${isMine ? "mine" : ""}`}
            title={`Team ${cell.teamN}`}
          >
            {cell.teamN}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- FLOOR PLAN ---------- */
function FloorSection({ id, num, myTeam }) {
  const myVenue = myTeam ? getVenue(myTeam) : null;
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Floor Plan"
        title="Welcome kit distribution map"
        desc="160 teams across 5 floors, 4 desks per floor, 8 teams per desk. Find your floor and desk for Day 1 pickup."
      />
      <div className="ei2-floors">
        {Object.entries(FLOOR_DESK_MAP).map(([floor, desks]) => {
          const floorN = Number(floor);
          const isMyFloor = myVenue?.floor === floorN;
          return (
            <div key={floor} className={`ei2-floor ${isMyFloor ? "mine" : ""}`}>
              <div className="ei2-floor-head">
                <div className="ei2-floor-num">{floor}</div>
                <div>
                  <div className="ei2-floor-name">Floor {floor}</div>
                  <div className="ei2-floor-sub">32 teams · 4 desks · 8 teams per desk</div>
                </div>
              </div>
              <div className="ei2-floor-desks">
                {desks.map((d) => {
                  const isMyDesk = isMyFloor && myVenue.desk === d.desk;
                  return (
                    <div key={d.desk} className={`ei2-desk ${isMyDesk ? "mine" : ""}`}>
                      <div className="ei2-desk-lab">Desk {d.desk}</div>
                      <div className="ei2-desk-range">{d.range}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- SCHEDULE ---------- */
function ScheduleSection({ id, num }) {
  const [tab, setTab] = useState("day1");
  const data = TIMINGS[tab];
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Schedule"
        title="Daily timings"
        desc="Strict adherence is mandatory. Late arrivals require approval from your project mentor."
      />
      <div className="ei2-schedule-tabs">
        <button className={`ei2-stab ${tab === "day1" ? "active" : ""}`} onClick={() => setTab("day1")}>Day 1 (Wed)</button>
        <button className={`ei2-stab ${tab === "day2to6" ? "active" : ""}`} onClick={() => setTab("day2to6")}>Day 2 – 6</button>
        <button className={`ei2-stab ${tab === "day7" ? "active" : ""}`} onClick={() => setTab("day7")}>Day 7 (Tue)</button>
      </div>
      <div className="ei2-timeline">
        {data.map(([label, time], i) => (
          <div key={i} className="ei2-time-row">
            <span className="ei2-time-lab">{label}</span>
            <span className="ei2-time-val">{time}</span>
          </div>
        ))}
      </div>
      {tab === "day7" && (
        <div className="ei2-warn" style={{ marginTop: 18 }}>
          <span className="ei2-warn-icn">{I.alert}</span>
          <div className="ei2-warn-body">
            <strong>Check-out (13th May 2026):</strong> Buses to Rajahmundry & Kakinada by 9:00 AM.
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- DRESS ---------- */
function DressSection({ id, num }) {
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Dress Code"
        title="What to wear, day-by-day"
        desc="Dress code with shoes & ID card must be followed from 9:30 AM until dinner. Grooming and clean-shaven appearance is mandatory."
      />
      <div className="ei2-dress-grid">
        {DRESS_CODE.map((d, i) => (
          <div key={i} className="ei2-dress-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="ei2-dress-day">{d.day}</div>
            <div className="ei2-dress-week">{d.week}</div>
            <div className="ei2-dress-attire">{d.attire}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- RULES ---------- */
function RulesSection({ id, num }) {
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Guidelines"
        title="Code of conduct"
        desc="Premises are under CCTV surveillance. Failure to comply may result in restricted access or termination."
      />
      <div className="ei2-rules-grid">
        <div className="ei2-rule-card">
          <div className="ei2-rule-head">
            <span className="ei2-rule-icn">{I.shield}</span>
            <span className="ei2-rule-title">Conduct & Movement</span>
          </div>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>On-site:</strong> No shouting on the floor or in the building.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>In transit:</strong> Quiet during commute to hostel/meals.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>At hostel:</strong> Especially during night hours.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Littering:</strong> Strictly prohibited. Use designated bins.</span></li>
          </ul>
        </div>
        <div className="ei2-rule-card">
          <div className="ei2-rule-head">
            <span className="ei2-rule-icn">{I.shirt}</span>
            <span className="ei2-rule-title">Grooming & Attendance</span>
          </div>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Hair:</strong> Neatly trimmed and well-groomed.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Shaving:</strong> Clean-shaven at all times.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Attire:</strong> ID card and shoes mandatory with prescribed dress.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>100% attendance</strong> across all 7 days required.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Late permissions:</strong> Mentor approval required.</span></li>
          </ul>
        </div>
        <div className="ei2-rule-card">
          <div className="ei2-rule-head">
            <span className="ei2-rule-icn" style={{ background: "rgba(16,185,129,.08)", borderColor: "rgba(16,185,129,.2)", color: "var(--ei-green)" }}>{I.check}</span>
            <span className="ei2-rule-title">Internet Do's</span>
          </div>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet green" /><span><strong>Project work:</strong> Use internet for project & research only.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet green" /><span><strong>Knowledge expansion:</strong> Resources to improve technical skills.</span></li>
          </ul>
        </div>
        <div className="ei2-rule-card">
          <div className="ei2-rule-head">
            <span className="ei2-rule-icn">{I.alert}</span>
            <span className="ei2-rule-title">Internet Don'ts</span>
          </div>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet red" /><span><strong>Mobile phones</strong> limited to project work only.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet red" /><span><strong>No</strong> obscene, offensive or illegal content.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet red" /><span><strong>No</strong> copyrighted downloads (movies, music, software).</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet red" /><span><strong>No</strong> social media unless instructed.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet red" /><span><strong>No</strong> accessing others' sensitive information.</span></li>
          </ul>
        </div>
      </div>

      <div className="ei2-card" style={{ marginTop: 16 }}>
        <div className="ei2-card-h">
          <span className="ei2-card-h-icn">{I.women}</span>
          Specific Guidelines for Female Trainees
        </div>
        <div className="ei2-card-pad">
          <div className="ei2-rules-grid" style={{ gap: 14 }}>
            <ul className="ei2-rule-list">
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Night escort:</strong> Security personnel escort to hostel after night sessions.</span></li>
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Priority dispersal:</strong> Female trainees leave first in every session.</span></li>
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Final attendance</strong> must be given before dispersal.</span></li>
            </ul>
            <ul className="ei2-rule-list">
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Female staff presence:</strong> Maintained until all girls leave.</span></li>
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Zero tolerance</strong> for harassment or misconduct.</span></li>
              <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Immediate reporting:</strong> Confidentiality guaranteed.</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="ei2-warn">
        <span className="ei2-warn-icn">{I.alert}</span>
        <div className="ei2-warn-body">
          <strong>Consequences of violation:</strong> Personal phones and laptops will be confiscated.
          Trainee will be terminated from Project Space and will not receive completion certificates.
        </div>
      </div>
    </section>
  );
}

/* ---------- PPT ---------- */
function PptSection({ id, num }) {
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Presentation"
        title="PPT guidelines"
        desc="AI tools encouraged. Final deck must follow 5-slide rule and formatting standards below."
      />
      <div className="ei2-ppt-grid">
        <div className="ei2-ppt-card">
          <h3 className="ei2-ppt-h"><span className="ei2-ppt-num">1</span>Colour Palette</h3>
          <div className="ei2-color-row"><div className="ei2-color-swatch" style={{ background: "#FAF4DF" }} /><div><div style={{ fontWeight: 500 }}>Background</div><div className="ei2-color-hex">#FAF4DF</div></div></div>
          <div className="ei2-color-row"><div className="ei2-color-swatch" style={{ background: "#E3562B" }} /><div><div style={{ fontWeight: 500 }}>Primary · Highlights</div><div className="ei2-color-hex">#E3562B</div></div></div>
          <div className="ei2-color-row"><div className="ei2-color-swatch" style={{ background: "#1D3639" }} /><div><div style={{ fontWeight: 500 }}>Secondary · Titles</div><div className="ei2-color-hex">#1D3639</div></div></div>
          <div className="ei2-color-row"><div className="ei2-color-swatch" style={{ background: "#7F7F7F" }} /><div><div style={{ fontWeight: 500 }}>Neutral · Subtext</div><div className="ei2-color-hex">#7F7F7F</div></div></div>
        </div>
        <div className="ei2-ppt-card">
          <h3 className="ei2-ppt-h"><span className="ei2-ppt-num">2</span>Typography — Poppins</h3>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
          </ul>
        </div>
        <div className="ei2-ppt-card">
          <h3 className="ei2-ppt-h"><span className="ei2-ppt-num">3</span>Slide Layout</h3>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Title at top, content below.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Left text + right image when needed.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Clean spacing; simple icons.</span></li>
          </ul>
        </div>
        <div className="ei2-ppt-card">
          <h3 className="ei2-ppt-h"><span className="ei2-ppt-num">4</span>Content Rules</h3>
          <ul className="ei2-rule-list">
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Short, punchy sentences.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Bullets over paragraphs.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Animations: Fade or Appear only.</span></li>
            <li className="ei2-rule-li"><span className="ei2-bullet" /><span>Same font, colors, layout across all slides.</span></li>
          </ul>
        </div>
      </div>

      <div className="ei2-card" style={{ marginTop: 16 }}>
        <div className="ei2-card-h">
          <span className="ei2-card-h-icn">{I.presentation}</span>
          Slide Structure — Maximum 5 Slides
        </div>
        <div className="ei2-card-pad">
          <div className="ei2-slide-flow">
            <div className="ei2-slide">
              <div className="ei2-slide-num">Slide 1</div>
              <div className="ei2-slide-name">Cover</div>
              <div className="ei2-slide-li">• Project Title</div>
              <div className="ei2-slide-li">• Team Name</div>
              <div className="ei2-slide-li">• Team Members</div>
            </div>
            <div className="ei2-slide">
              <div className="ei2-slide-num">Slides 2 – 4</div>
              <div className="ei2-slide-name">Project Body</div>
              <div className="ei2-slide-li">• Problem Statement</div>
              <div className="ei2-slide-li">• Solution Overview</div>
              <div className="ei2-slide-li">• Features</div>
              <div className="ei2-slide-li">• Demo Screenshots / Workflow</div>
              <div className="ei2-slide-li">• Technology Stack</div>
            </div>
            <div className="ei2-slide">
              <div className="ei2-slide-num">Slide 5</div>
              <div className="ei2-slide-name">Closing</div>
              <div className="ei2-slide-li">• Team Introduction</div>
              <div className="ei2-slide-li">• Learnings</div>
              <div className="ei2-slide-li">• Thank You Note</div>
            </div>
          </div>
          <div className="ei2-warn" style={{ marginTop: 18, background: "rgba(238,167,39,.06)", borderColor: "rgba(238,167,39,.3)", borderLeftColor: "var(--ei-orange)" }}>
            <span className="ei2-warn-icn" style={{ color: "var(--ei-orange)" }}>{I.alert}</span>
            <div className="ei2-warn-body">
              <strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template
              from the login portal — approved colors, fonts, icons and ready-made layouts.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CONTACTS ---------- */
function ContactsSection({ id, num }) {
  return (
    <section id={id} className="ei2-section">
      <SectionHeader
        num={num}
        label="Contacts"
        title="Help & emergency"
        desc="Save these numbers. Battery-operated campus vehicles are available for non-critical injuries to the on-campus Apollo medical centre."
      />

      <div className="ei2-card">
        <div className="ei2-card-h">
          <span className="ei2-card-h-icn">{I.alert}</span>
          Emergency & Security
        </div>
        {CONTACTS.emergency.map((c, i) => (
          <div key={i} className="ei2-contact-row">
            <div>
              <div className="ei2-contact-role">{c.role}</div>
              <div className="ei2-contact-name">{c.name}</div>
              {c.note && <div className="ei2-contact-note">{c.note}</div>}
            </div>
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei2-contact-phone">{c.phone}</a>
          </div>
        ))}
      </div>

      <div className="ei2-contacts-grid">
        <div className="ei2-card">
          <div className="ei2-card-h">
            <span className="ei2-card-h-icn">{I.shield}</span>
            Hostel Queries
          </div>
          {CONTACTS.hostel.map((c, i) => (
            <div key={i} className="ei2-contact-row">
              <div>
                <div className="ei2-contact-role">{c.role}</div>
                <div className="ei2-contact-name">{c.name}</div>
              </div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei2-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>
        <div className="ei2-card">
          <div className="ei2-card-h">
            <span className="ei2-card-h-icn">{I.women}</span>
            Female Coordinators
          </div>
          {CONTACTS.female.map((c, i) => (
            <div key={i} className="ei2-contact-row">
              <div>
                <div className="ei2-contact-role">{c.role}</div>
                <div className="ei2-contact-name">{c.name}</div>
              </div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ei2-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>
      </div>

      <div className="ei2-warn" style={{ marginTop: 16 }}>
        <span className="ei2-warn-icn">{I.alert}</span>
        <div className="ei2-warn-body">
          <strong>First aid kit locations:</strong> Corridor lockers on the 2nd floor and 4th floor of Technical Hub.
        </div>
      </div>
    </section>
  );
}