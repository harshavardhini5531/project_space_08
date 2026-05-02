"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================
   EVENT INFO — v3 (matches dashboard design system)
   Path: app/dashboard/components/EventInfo.js
   Sections:
     1. My Spot (combined: hall + floor + desk + welcome kit)
     2. Hall layouts (visual seating chart)
     3. Schedule
     4. Dress code
     5. Guidelines
     6. PPT guide
     7. Contacts
   ============================================================ */

/* ---------- HALL DATA (renamed to avoid duplicate "4.1") ---------- */
const HALLS = [
  { id: "h1", name: "Hall 4.1 A", color: "#3b82f6", soft: "rgba(59,130,246,.10)", border: "rgba(59,130,246,.28)", rows: 4, cols: 11, startTeam: 1, endTeam: 44, entranceSide: "both", desc: "Teams 1 – 44" },
  { id: "h2", name: "Hall 4.2", color: "#22d3ee", soft: "rgba(34,211,238,.10)", border: "rgba(34,211,238,.28)", rows: 4, cols: 9, startTeam: 45, endTeam: 80, entranceSide: "right", desc: "Teams 45 – 80" },
  { id: "h3", name: "Hall 2.1", color: "#a16207", soft: "rgba(161,98,7,.12)", border: "rgba(161,98,7,.32)", rows: 4, cols: 11, startTeam: 81, endTeam: 124, entranceSide: "both", desc: "Teams 81 – 124" },
  { id: "h4", name: "Hall 4.1 B", color: "#10b981", soft: "rgba(16,185,129,.10)", border: "rgba(16,185,129,.28)", rows: 4, cols: 9, startTeam: 125, endTeam: 160, entranceSide: "right", desc: "Teams 125 – 160" },
];

/* ---------- FLOOR / DESK ---------- */
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

const DRESS_CODE = [
  { day: "DAY 1", week: "WED", attire: "Drive Ready / SkillUp T-Shirt" },
  { day: "DAY 2", week: "THU", attire: "Project Space T-Shirt" },
  { day: "DAY 3", week: "FRI", attire: "Civil Formal Wear" },
  { day: "DAY 4", week: "SAT", attire: "Project Space T-Shirt" },
  { day: "DAY 5", week: "SUN", attire: "White Code Dress" },
  { day: "DAY 6", week: "MON", attire: "Drive Ready / SkillUp T-Shirt" },
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
  { id: "spot", short: "My Spot" },
  { id: "halls", short: "Seating" },
  { id: "schedule", short: "Schedule" },
  { id: "dress", short: "Dress" },
  { id: "rules", short: "Rules" },
  { id: "ppt", short: "PPT" },
  { id: "contacts", short: "Help" },
];

/* ====================================================================== */
/*                                MAIN                                     */
/* ====================================================================== */
export default function EventInfo({ user }) {
  const [activeSec, setActiveSec] = useState("spot");
  const [search, setSearch] = useState("");

  const teamNumber = user?.teamNumber || user?.team_number;
  const myVenue = teamNumber ? getVenue(teamNumber) : null;
  const myHall = teamNumber ? getHall(teamNumber) : null;

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSec(visible[0].target.id.replace("ev-", ""));
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`ev-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(`ev-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="ev">
      <style jsx>{`
        .ev { display: flex; flex-direction: column; gap: 0; animation: evIn .5s ease both; }
        @keyframes evIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes evFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes evPulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes evBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        @keyframes evShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* ============ HERO (matches mp-hero gradient) ============ */
        .ev-hero {
          padding: 32px 28px;
          border-radius: 20px;
          background: linear-gradient(135deg, #fd1c00 0%, #ff4e50 50%, #EEA727 100%);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(253,28,0,.12), 0 2px 8px rgba(238,167,39,.1);
        }
        .ev-hero::before {
          content: ""; position: absolute; top: -100px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,.10), transparent 60%);
          pointer-events: none;
        }
        .ev-hero::after {
          content: ""; position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 600px 320px at 50% 0%, #000 30%, transparent 80%);
          pointer-events: none;
        }
        .ev-hero-inner { position: relative; z-index: 1; }
        .ev-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: .58rem; font-weight: 700; letter-spacing: .18em;
          color: rgba(255,255,255,.95); text-transform: uppercase;
          padding: 6px 12px;
          background: rgba(255,255,255,.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 100px;
        }
        .ev-hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff;
          animation: evPulse 1.5s ease-in-out infinite;
        }
        .ev-hero-title {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 14px 0 8px;
          text-shadow: 0 2px 16px rgba(0,0,0,.2);
        }
        .ev-hero-sub {
          font-size: .82rem;
          color: rgba(255,255,255,.85);
          line-height: 1.5;
          max-width: 560px;
          font-weight: 500;
        }
        .ev-hero-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-top: 22px; max-width: 600px;
        }
        .ev-hero-stat {
          padding: 12px 14px;
          background: rgba(255,255,255,.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 10px;
        }
        .ev-hero-stat-num { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1; }
        .ev-hero-stat-lab { font-size: .5rem; color: rgba(255,255,255,.75); margin-top: 5px; letter-spacing: .15em; text-transform: uppercase; font-weight: 700; }

        /* ============ STICKY PILL NAV ============ */
        .ev-nav-wrap {
          position: sticky;
          top: 0;
          z-index: 25;
          padding: 14px 0;
          margin: 16px 0 0;
          background: rgba(5, 0, 8, .85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,.05);
        }
        .ev-nav {
          display: flex;
          gap: 4px;
          padding: 5px;
          background: rgba(12,8,18,.85);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 100px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: fit-content;
          max-width: 100%;
          margin: 0 auto;
        }
        .ev-nav::-webkit-scrollbar { display: none; }
        .ev-nav-pill {
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,.55);
          font-family: 'DM Sans', sans-serif;
          font-size: .76rem;
          font-weight: 600;
          border-radius: 100px;
          cursor: pointer;
          white-space: nowrap;
          transition: all .2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .ev-nav-pill:hover {
          color: #fff;
          background: rgba(255,255,255,.04);
        }
        .ev-nav-pill.active {
          background: linear-gradient(135deg, #fd1c00, #ff4e50);
          color: #fff;
          box-shadow: 0 4px 14px rgba(253,28,0,.35);
        }
        .ev-nav-pill-num {
          font-size: .58rem;
          opacity: .65;
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          padding: 2px 5px;
          background: rgba(255,255,255,.08);
          border-radius: 100px;
        }
        .ev-nav-pill.active .ev-nav-pill-num { background: rgba(255,255,255,.2); opacity: 1; }

        /* ============ SIDE DOTS (desktop only) ============ */
        .ev-dots {
          position: fixed; right: 24px; top: 50%;
          transform: translateY(-50%); z-index: 22;
          display: flex; flex-direction: column; gap: 14px;
        }
        @media (max-width: 1100px) { .ev-dots { display: none; } }
        .ev-dot {
          position: relative;
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,.2);
          background: transparent;
          cursor: pointer;
          transition: all .25s ease;
          padding: 0;
        }
        .ev-dot:hover { border-color: #EEA727; transform: scale(1.3); }
        .ev-dot.active {
          border-color: #fd1c00;
          background: #fd1c00;
          box-shadow: 0 0 0 4px rgba(253,28,0,.18);
        }
        .ev-dot-tip {
          position: absolute;
          right: calc(100% + 14px); top: 50%;
          transform: translateY(-50%);
          padding: 4px 12px;
          background: rgba(12,8,18,.95);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 6px;
          font-size: .68rem;
          font-weight: 600;
          white-space: nowrap;
          color: #fff;
          opacity: 0;
          pointer-events: none;
          transition: opacity .18s;
        }
        .ev-dot:hover .ev-dot-tip { opacity: 1; }

        /* ============ SECTION ============ */
        .ev-section {
          padding: 36px 0 24px;
          scroll-margin-top: 80px;
          animation: evFadeUp .6s ease both;
        }
        .ev-section:first-of-type { padding-top: 28px; }
        .ev-sec-head { margin-bottom: 18px; }
        .ev-sec-eyebrow {
          font-size: .55rem; letter-spacing: .2em; text-transform: uppercase;
          color: #EEA727; font-weight: 700;
          margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .ev-sec-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 50%;
          font-weight: 700; font-size: .6rem;
        }
        .ev-sec-h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -.01em;
          margin: 0 0 4px;
        }
        .ev-sec-desc {
          font-size: .76rem;
          color: rgba(255,255,255,.45);
          margin: 0; line-height: 1.5;
          max-width: 560px;
        }

        /* ============ CARD (matches mp-card style) ============ */
        .ev-card {
          padding: 22px;
          border-radius: 16px;
          background: rgba(12,8,18,.5);
          border: 1px solid rgba(255,255,255,.06);
          transition: border-color .3s;
        }
        .ev-card:hover { border-color: rgba(255,255,255,.1); }
        .ev-card-title {
          font-size: .8rem;
          font-weight: 700;
          color: rgba(255,255,255,.85);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ev-card-title svg { color: #EEA727; flex-shrink: 0; }
        .ev-card-title-count {
          margin-left: auto;
          font-size: .55rem;
          color: rgba(255,255,255,.25);
          font-weight: 500;
        }

        /* ============ MY SPOT (combined card) ============ */
        .ev-spot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 820px) { .ev-spot-grid { grid-template-columns: 1fr; } }

        .ev-spot-mine {
          padding: 24px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(253,28,0,.10), rgba(238,167,39,.04));
          border: 1px solid rgba(253,28,0,.25);
          position: relative;
          overflow: hidden;
        }
        .ev-spot-mine::before {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.04), transparent);
          animation: evShimmer 6s linear infinite;
        }
        .ev-spot-mine-head {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .ev-spot-mine-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #fd1c00; box-shadow: 0 0 8px #fd1c00;
          animation: evPulse 2s ease-in-out infinite;
        }
        .ev-spot-mine-lab {
          font-size: .55rem; font-weight: 700;
          letter-spacing: .15em; text-transform: uppercase;
          color: #fd1c00;
        }
        .ev-spot-team {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -.02em;
          line-height: 1;
          margin-bottom: 18px;
          font-family: 'Astro', 'Orbitron', sans-serif;
          letter-spacing: 2px;
          position: relative; z-index: 1;
        }
        .ev-spot-mine-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          position: relative; z-index: 1;
        }
        .ev-spot-block {
          padding: 12px 14px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
        }
        .ev-spot-block-lab {
          font-size: .5rem; letter-spacing: .15em; text-transform: uppercase;
          color: rgba(255,255,255,.4); font-weight: 700;
          margin-bottom: 6px;
        }
        .ev-spot-block-val {
          font-size: .82rem; font-weight: 700; color: #fff;
        }
        .ev-spot-block-sub {
          font-size: .6rem; color: rgba(255,255,255,.4); margin-top: 3px;
        }

        /* Search card */
        .ev-search-wrap { position: relative; max-width: 480px; }
        .ev-search-icn {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: rgba(255,255,255,.3);
        }
        .ev-search-in {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
          color: #fff;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          outline: none;
          transition: border-color .2s, background .2s;
        }
        .ev-search-in:focus { border-color: rgba(238,167,39,.4); background: rgba(238,167,39,.04); }
        .ev-search-in::placeholder { color: rgba(255,255,255,.3); }

        .ev-search-result {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(238,167,39,.2);
          border-radius: 12px;
          animation: evFadeUp .35s ease both;
        }
        .ev-search-result-team {
          font-size: .55rem; letter-spacing: .15em; text-transform: uppercase;
          color: #EEA727; font-weight: 700; margin-bottom: 4px;
        }
        .ev-search-result-team-num {
          font-size: 1.2rem; font-weight: 800; color: #fff;
          font-family: 'Astro', 'Orbitron', sans-serif;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
        }
        .ev-search-result-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 600px) { .ev-search-result-grid { grid-template-columns: 1fr 1fr; } }

        .ev-not-found {
          margin-top: 14px;
          padding: 12px 16px;
          color: rgba(255,255,255,.5); font-size: .78rem;
          border: 1px dashed rgba(255,255,255,.1);
          border-radius: 8px;
        }
        .ev-search-hint {
          margin-top: 14px; font-size: .72rem; color: rgba(255,255,255,.3);
        }
        .ev-search-hint strong { color: rgba(255,255,255,.6); font-weight: 600; }

        /* ============ HALLS — chair grid ============ */
        .ev-halls {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) { .ev-halls { grid-template-columns: 1fr; } }

        .ev-hall {
          background: rgba(12,8,18,.5);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .25s, transform .25s;
        }
        .ev-hall:hover { border-color: rgba(255,255,255,.12); transform: translateY(-2px); }
        .ev-hall.mine {
          border-color: rgba(253,28,0,.4);
          box-shadow: 0 0 0 3px rgba(253,28,0,.1), 0 8px 32px rgba(253,28,0,.15);
        }
        .ev-hall-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ev-hall-name {
          font-size: .85rem; font-weight: 700;
          font-family: 'Astro', 'Orbitron', sans-serif;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .ev-hall-range {
          font-size: .58rem; font-weight: 600;
          padding: 4px 10px; border-radius: 100px;
          font-variant-numeric: tabular-nums;
          letter-spacing: .04em;
        }
        .ev-hall-body {
          padding: 18px 16px;
          background: linear-gradient(180deg, rgba(255,255,255,.01), rgba(0,0,0,.15));
        }

        .ev-hall-grid {
          display: grid;
          gap: 5px;
        }
        .ev-chair {
          aspect-ratio: 1;
          position: relative;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px 6px 8px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8.5px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: rgba(255,255,255,.55);
          transition: all .2s;
          cursor: pointer;
        }
        /* chair backrest accent */
        .ev-chair::before {
          content: "";
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 28%;
          background: linear-gradient(180deg, rgba(255,255,255,.06), transparent);
          border-radius: 4px 4px 0 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        /* chair seat indent */
        .ev-chair::after {
          content: "";
          position: absolute;
          bottom: 4px; left: 50%;
          transform: translateX(-50%);
          width: 70%;
          height: 1px;
          background: rgba(255,255,255,.06);
          border-radius: 1px;
        }
        .ev-chair:hover {
          background: rgba(238,167,39,.12);
          border-color: #EEA727;
          color: #fff;
          transform: translateY(-2px) scale(1.06);
          z-index: 2;
          box-shadow: 0 6px 16px rgba(238,167,39,.2);
        }
        .ev-chair.mine {
          background: linear-gradient(180deg, #ff4e50, #fd1c00);
          border-color: #fd1c00;
          color: #fff;
          font-weight: 800;
          box-shadow: 0 0 0 3px rgba(253,28,0,.25), 0 6px 16px rgba(253,28,0,.45);
          animation: evPulse 2s ease-in-out infinite;
          z-index: 3;
        }
        .ev-chair.mine::before {
          background: linear-gradient(180deg, rgba(255,255,255,.18), transparent);
        }
        .ev-hall-entrance {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px dashed rgba(255,255,255,.08);
          display: flex; align-items: center; justify-content: space-between;
          font-size: .55rem;
          letter-spacing: .15em; text-transform: uppercase;
          color: rgba(255,255,255,.35);
          font-weight: 700;
        }
        .ev-hall-entrance-tag {
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ev-hall-entrance-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .ev-hall-legend {
          display: flex; gap: 12px; flex-wrap: wrap;
          padding: 12px 18px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid rgba(255,255,255,.06);
          font-size: .58rem; color: rgba(255,255,255,.4);
        }
        .ev-hall-legend-item { display: inline-flex; align-items: center; gap: 6px; }
        .ev-hall-legend-chair {
          width: 14px; height: 14px;
          border-radius: 4px 4px 5px 5px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          position: relative;
        }
        .ev-hall-legend-chair.taken { background: linear-gradient(180deg, #ff4e50, #fd1c00); border-color: #fd1c00; }

        /* ============ FLOOR / DESK ============ */
        .ev-floors {
          display: flex; flex-direction: column; gap: 12px;
        }
        .ev-floor {
          background: rgba(12,8,18,.5);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .2s;
        }
        .ev-floor.mine {
          border-color: rgba(253,28,0,.35);
          box-shadow: 0 0 0 3px rgba(253,28,0,.08);
        }
        .ev-floor-head {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ev-floor-num {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(238,167,39,.15), rgba(238,167,39,.05));
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 10px;
          font-weight: 800; font-size: 1rem;
          color: #EEA727;
          font-family: 'Astro', 'Orbitron', sans-serif;
        }
        .ev-floor-name { font-size: .85rem; font-weight: 700; color: #fff; }
        .ev-floor-sub { font-size: .58rem; color: rgba(255,255,255,.3); margin-top: 2px; letter-spacing: .04em; }
        .ev-floor-desks {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: rgba(255,255,255,.06);
        }
        @media (max-width: 720px) { .ev-floor-desks { grid-template-columns: repeat(2, 1fr); } }
        .ev-desk {
          padding: 14px 16px;
          background: rgba(12,8,18,.6);
          display: flex; flex-direction: column; gap: 5px;
          position: relative;
          transition: background .2s;
        }
        .ev-desk:hover { background: rgba(12,8,18,.4); }
        .ev-desk.mine {
          background: linear-gradient(135deg, rgba(253,28,0,.14), rgba(238,167,39,.06));
        }
        .ev-desk.mine::after {
          content: "YOU";
          position: absolute; top: 8px; right: 8px;
          font-size: .5rem; font-weight: 700; letter-spacing: .12em;
          padding: 2px 7px;
          background: #fd1c00; color: #fff;
          border-radius: 100px;
        }
        .ev-desk-lab {
          font-size: .5rem; letter-spacing: .15em; text-transform: uppercase;
          color: rgba(255,255,255,.35); font-weight: 700;
        }
        .ev-desk-range {
          font-size: .76rem; font-weight: 700; color: #fff;
          font-variant-numeric: tabular-nums;
        }

        /* ============ SCHEDULE ============ */
        .ev-tabs {
          display: flex; gap: 4px; padding: 4px;
          background: rgba(12,8,18,.5);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          width: fit-content;
          margin-bottom: 16px;
        }
        .ev-tab {
          padding: 8px 16px;
          background: transparent; border: none;
          color: rgba(255,255,255,.5);
          font-family: 'DM Sans', sans-serif;
          font-size: .74rem; font-weight: 600;
          border-radius: 7px; cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .ev-tab:hover { color: #fff; }
        .ev-tab.active {
          background: linear-gradient(135deg, #fd1c00, #ff4e50);
          color: #fff;
          box-shadow: 0 4px 12px rgba(253,28,0,.3);
        }
        .ev-timeline {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          overflow: hidden;
        }
        @media (max-width: 600px) { .ev-timeline { grid-template-columns: 1fr; } }
        .ev-time-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px;
          background: rgba(12,8,18,.6);
          gap: 16px;
          transition: background .15s;
        }
        .ev-time-row:hover { background: rgba(12,8,18,.4); }
        .ev-time-lab { font-size: .78rem; color: #fff; font-weight: 500; }
        .ev-time-val {
          font-size: .68rem; color: #EEA727; font-weight: 700;
          font-variant-numeric: tabular-nums; white-space: nowrap;
        }

        /* ============ DRESS ============ */
        .ev-dress-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }
        @media (max-width: 1100px) { .ev-dress-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 600px) { .ev-dress-grid { grid-template-columns: repeat(2, 1fr); } }
        .ev-dress-card {
          padding: 16px 14px;
          background: rgba(12,8,18,.5);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          transition: all .2s;
          animation: evFadeUp .4s ease both;
        }
        .ev-dress-card:hover {
          border-color: rgba(238,167,39,.25);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,.2);
        }
        .ev-dress-day {
          font-size: .55rem; letter-spacing: .18em;
          color: #fd1c00; font-weight: 800;
        }
        .ev-dress-week {
          font-size: .55rem; color: rgba(255,255,255,.3);
          margin-top: 3px; letter-spacing: .1em; font-weight: 600;
        }
        .ev-dress-attire {
          margin-top: 14px; font-size: .72rem;
          line-height: 1.4; font-weight: 500; color: rgba(255,255,255,.85);
        }

        /* ============ RULES ============ */
        .ev-rules-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 820px) { .ev-rules-grid { grid-template-columns: 1fr; } }
        .ev-rule-icn {
          width: 32px; height: 32px;
          background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.18);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #fd1c00; flex-shrink: 0;
        }
        .ev-rule-icn.green { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.18); color: #10b981; }
        .ev-rule-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 9px;
        }
        .ev-rule-li {
          display: flex; gap: 10px;
          font-size: .76rem; line-height: 1.55;
          color: rgba(255,255,255,.65);
        }
        .ev-rule-li strong { color: #fff; font-weight: 600; }
        .ev-bullet {
          width: 4px; height: 4px; border-radius: 50%;
          background: #EEA727; margin-top: 8px; flex-shrink: 0;
        }
        .ev-bullet.green { background: #10b981; }
        .ev-bullet.red { background: #fd1c00; }

        .ev-warn {
          margin-top: 16px;
          padding: 14px 18px;
          background: rgba(253,28,0,.06);
          border: 1px solid rgba(253,28,0,.2);
          border-left: 3px solid #fd1c00;
          border-radius: 8px;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .ev-warn.amber {
          background: rgba(238,167,39,.06);
          border-color: rgba(238,167,39,.25);
          border-left-color: #EEA727;
        }
        .ev-warn-icn {
          width: 18px; height: 18px;
          color: #fd1c00; flex-shrink: 0;
        }
        .ev-warn.amber .ev-warn-icn { color: #EEA727; }
        .ev-warn-body { font-size: .74rem; line-height: 1.55; color: rgba(255,255,255,.55); }
        .ev-warn-body strong { color: #fff; }

        /* ============ PPT ============ */
        .ev-ppt-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 820px) { .ev-ppt-grid { grid-template-columns: 1fr; } }
        .ev-ppt-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 50%;
          font-weight: 700; font-size: .62rem;
          color: #EEA727;
          margin-right: 8px;
        }
        .ev-color-row {
          display: flex; align-items: center; gap: 12px;
          padding: 7px 0; font-size: .76rem;
        }
        .ev-color-swatch {
          width: 22px; height: 22px;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,.12);
          flex-shrink: 0;
        }
        .ev-color-name { color: rgba(255,255,255,.85); font-weight: 500; }
        .ev-color-hex {
          color: rgba(255,255,255,.35);
          font-family: ui-monospace, monospace;
          font-size: .68rem;
        }
        .ev-slide-flow {
          display: grid; grid-template-columns: 1fr 2.5fr 1fr;
          gap: 10px; margin-top: 12px;
        }
        @media (max-width: 720px) { .ev-slide-flow { grid-template-columns: 1fr; } }
        .ev-slide {
          padding: 16px;
          border: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ev-slide-num {
          font-size: .55rem; letter-spacing: .15em; text-transform: uppercase;
          color: #EEA727; font-weight: 700; margin-bottom: 8px;
        }
        .ev-slide-name {
          font-size: .82rem; font-weight: 700;
          color: #fff; margin-bottom: 8px;
        }
        .ev-slide-li {
          font-size: .68rem; color: rgba(255,255,255,.55);
          padding: 2px 0; line-height: 1.5;
        }

        /* ============ CONTACTS ============ */
        .ev-contacts-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 14px; margin-top: 14px;
        }
        @media (max-width: 820px) { .ev-contacts-grid { grid-template-columns: 1fr; } }
        .ev-contact-row {
          display: grid; grid-template-columns: 1fr auto;
          gap: 16px; padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.05);
          align-items: center;
        }
        .ev-contact-row:last-child { border-bottom: none; }
        .ev-contact-role {
          font-size: .5rem; letter-spacing: .15em; text-transform: uppercase;
          color: rgba(255,255,255,.3); font-weight: 700;
          margin-bottom: 4px;
        }
        .ev-contact-name { font-size: .78rem; color: #fff; font-weight: 500; }
        .ev-contact-note { font-size: .65rem; color: rgba(255,255,255,.4); margin-top: 3px; }
        .ev-contact-phone {
          font-family: ui-monospace, monospace;
          font-size: .76rem;
          color: #EEA727; font-weight: 700;
          padding: 7px 12px;
          background: rgba(238,167,39,.08);
          border: 1px solid rgba(238,167,39,.18);
          border-radius: 7px;
          white-space: nowrap;
          text-decoration: none;
          transition: all .2s;
        }
        .ev-contact-phone:hover {
          background: rgba(238,167,39,.14);
          transform: scale(1.03);
        }

        /* Mobile tweaks */
        @media (max-width: 600px) {
          .ev-hero { padding: 22px 18px; border-radius: 16px; }
          .ev-hero-stats { grid-template-columns: repeat(2, 1fr); }
          .ev-spot-mine-grid { grid-template-columns: 1fr; }
          .ev-card { padding: 16px; border-radius: 14px; }
          .ev-section { padding: 28px 0 18px; }
          .ev-sec-h2 { font-size: 1.05rem; }
          .ev-nav-pill { padding: 7px 12px; font-size: .72rem; }
          .ev-nav-pill-num { display: none; }
          .ev-chair { font-size: 7.5px; }
        }
      `}</style>

      {/* HERO */}
      <div className="ev-hero">
        <div className="ev-hero-inner">
          <span className="ev-hero-eyebrow">
            <span className="ev-hero-eyebrow-dot" />
            Project Space — Season 8
          </span>
          <div className="ev-hero-title">Event Information</div>
          <p className="ev-hero-sub">
            Welcome kit pickup, hall layouts, daily schedule, dress code, guidelines,
            presentation rules and emergency contacts — everything you need in one scroll.
          </p>
          <div className="ev-hero-stats">
            <div className="ev-hero-stat"><div className="ev-hero-stat-num">900+</div><div className="ev-hero-stat-lab">Trainees</div></div>
            <div className="ev-hero-stat"><div className="ev-hero-stat-num">160</div><div className="ev-hero-stat-lab">Teams</div></div>
            <div className="ev-hero-stat"><div className="ev-hero-stat-num">7</div><div className="ev-hero-stat-lab">Days</div></div>
            <div className="ev-hero-stat"><div className="ev-hero-stat-num">7</div><div className="ev-hero-stat-lab">Domains</div></div>
          </div>
        </div>
      </div>

      {/* STICKY PILL NAV */}
      <div className="ev-nav-wrap">
        <div className="ev-nav">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={`ev-nav-pill ${activeSec === s.id ? "active" : ""}`}
              onClick={() => scrollTo(s.id)}
            >
              <span className="ev-nav-pill-num">{String(i + 1).padStart(2, "0")}</span>
              {s.short}
            </button>
          ))}
        </div>
      </div>

      {/* SIDE DOTS */}
      <div className="ev-dots">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`ev-dot ${activeSec === s.id ? "active" : ""}`}
            onClick={() => scrollTo(s.id)}
            aria-label={s.short}
          >
            <span className="ev-dot-tip">{s.short}</span>
          </button>
        ))}
      </div>

      {/* ═══ SECTION 1 — MY SPOT (combined kit + floor) ═══ */}
      <section id="ev-spot" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">1</span> My Spot</div>
          <h2 className="ev-sec-h2">Your venue & welcome kit</h2>
          <p className="ev-sec-desc">Find your team's seating hall and welcome kit pickup spot. Pickup is on Day 1, 9:00 – 10:00 AM.</p>
        </div>

        <div className="ev-spot-grid">
          {/* Left: Personalized "My Spot" card or generic info */}
          {teamNumber && myVenue && myHall ? (
            <div className="ev-spot-mine">
              <div className="ev-spot-mine-head">
                <span className="ev-spot-mine-pulse" />
                <span className="ev-spot-mine-lab">Your Team</span>
              </div>
              <div className="ev-spot-team">{teamNumber}</div>
              <div className="ev-spot-mine-grid">
                <div className="ev-spot-block">
                  <div className="ev-spot-block-lab">Hall</div>
                  <div className="ev-spot-block-val" style={{ color: myHall.color }}>{myHall.name}</div>
                </div>
                <div className="ev-spot-block">
                  <div className="ev-spot-block-lab">Floor</div>
                  <div className="ev-spot-block-val">Floor {myVenue.floor}</div>
                </div>
                <div className="ev-spot-block">
                  <div className="ev-spot-block-lab">Desk</div>
                  <div className="ev-spot-block-val">Desk {myVenue.desk}</div>
                  <div className="ev-spot-block-sub">{myVenue.range}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ev-card">
              <div className="ev-card-title">
                <Icon name="info" />
                Welcome Kit Pickup
              </div>
              <p style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)", lineHeight: 1.6, margin: 0 }}>
                Day 1 (Wednesday), 9:00 – 10:00 AM. Find your team's pickup spot using the search →
              </p>
            </div>
          )}

          {/* Right: Search any team */}
          <div className="ev-card">
            <div className="ev-card-title">
              <Icon name="search" />
              Look up any team
            </div>
            <SearchAnyTeam search={search} setSearch={setSearch} />
          </div>
        </div>

        {/* Full floor plan below */}
        <div style={{ marginTop: 16 }}>
          <div className="ev-card-title" style={{ marginBottom: 12, paddingLeft: 4 }}>
            <Icon name="building" />
            All 5 floors — welcome kit distribution
            <span className="ev-card-title-count">160 teams · 5 floors · 4 desks each</span>
          </div>
          <div className="ev-floors">
            {Object.entries(FLOOR_DESK_MAP).map(([floor, desks]) => {
              const isMyFloor = myVenue?.floor === Number(floor);
              return (
                <div key={floor} className={`ev-floor ${isMyFloor ? "mine" : ""}`}>
                  <div className="ev-floor-head">
                    <div className="ev-floor-num">{floor}</div>
                    <div>
                      <div className="ev-floor-name">Floor {floor}</div>
                      <div className="ev-floor-sub">32 teams · 4 desks · 8 teams per desk</div>
                    </div>
                  </div>
                  <div className="ev-floor-desks">
                    {desks.map((d) => {
                      const isMyDesk = isMyFloor && myVenue.desk === d.desk;
                      return (
                        <div key={d.desk} className={`ev-desk ${isMyDesk ? "mine" : ""}`}>
                          <div className="ev-desk-lab">Desk {d.desk}</div>
                          <div className="ev-desk-range">{d.range}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2 — HALLS (visual seating) ═══ */}
      <section id="ev-halls" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">2</span> Seating</div>
          <h2 className="ev-sec-h2">Where you sit during the event</h2>
          <p className="ev-sec-desc">Each team has a fixed chair across 4 halls. Your chair pulses red if you're a logged-in trainee.</p>
        </div>
        <div className="ev-halls">
          {HALLS.map((hall) => {
            const myN = teamNumber && teamNumber.startsWith("PS-") ? parseInt(teamNumber.replace("PS-", ""), 10) : null;
            const isMine = myN && myN >= hall.startTeam && myN <= hall.endTeam;
            return (
              <div key={hall.id} className={`ev-hall ${isMine ? "mine" : ""}`}>
                <div className="ev-hall-head" style={{ background: hall.soft, borderBottomColor: hall.border }}>
                  <div className="ev-hall-name" style={{ color: hall.color }}>{hall.name}</div>
                  <span className="ev-hall-range" style={{ background: hall.soft, color: hall.color, border: `1px solid ${hall.border}` }}>
                    {hall.desc}
                  </span>
                </div>
                <div className="ev-hall-legend">
                  <span className="ev-hall-legend-item"><span className="ev-hall-legend-chair" /> Chair</span>
                  {isMine && (<span className="ev-hall-legend-item"><span className="ev-hall-legend-chair taken" /> Your seat</span>)}
                </div>
                <div className="ev-hall-body">
                  <HallGrid hall={hall} myN={teamNumber && teamNumber.startsWith("PS-") ? parseInt(teamNumber.replace("PS-", ""), 10) : null} />
                  <div className="ev-hall-entrance">
                    <span className="ev-hall-entrance-tag">
                      <span className="ev-hall-entrance-dot" style={{ background: hall.color, boxShadow: `0 0 6px ${hall.color}` }} />
                      Entrance — {hall.entranceSide}
                    </span>
                    <span style={{ color: "rgba(255,255,255,.25)" }}>{hall.rows} × {hall.cols} layout</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ SECTION 3 — SCHEDULE ═══ */}
      <section id="ev-schedule" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">3</span> Schedule</div>
          <h2 className="ev-sec-h2">Daily timings</h2>
          <p className="ev-sec-desc">Strict adherence is mandatory. Late arrivals require approval from your project mentor.</p>
        </div>
        <ScheduleBlock />
      </section>

      {/* ═══ SECTION 4 — DRESS ═══ */}
      <section id="ev-dress" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">4</span> Dress Code</div>
          <h2 className="ev-sec-h2">What to wear, day by day</h2>
          <p className="ev-sec-desc">Dress code with shoes & ID card must be followed from 9:30 AM until dinner. Clean-shaven appearance is mandatory.</p>
        </div>
        <div className="ev-dress-grid">
          {DRESS_CODE.map((d, i) => (
            <div key={i} className="ev-dress-card" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="ev-dress-day">{d.day}</div>
              <div className="ev-dress-week">{d.week}</div>
              <div className="ev-dress-attire">{d.attire}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 5 — RULES ═══ */}
      <section id="ev-rules" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">5</span> Guidelines</div>
          <h2 className="ev-sec-h2">Code of conduct</h2>
          <p className="ev-sec-desc">Premises are under CCTV surveillance. Failure to comply may result in restricted access or termination.</p>
        </div>

        <div className="ev-rules-grid">
          <div className="ev-card">
            <div className="ev-card-title">
              <span className="ev-rule-icn"><Icon name="shield" /></span>
              Conduct & Movement
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>On-site:</strong> No shouting on the floor or in the building.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>In transit:</strong> Quiet during commute to hostel/meals.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>At hostel:</strong> Especially during night hours.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Littering:</strong> Strictly prohibited.</span></li>
            </ul>
          </div>
          <div className="ev-card">
            <div className="ev-card-title">
              <span className="ev-rule-icn"><Icon name="shirt" /></span>
              Grooming & Attendance
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Hair:</strong> Neatly trimmed, well-groomed.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Shaving:</strong> Clean-shaven at all times.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>ID card and shoes</strong> mandatory with prescribed dress.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>100% attendance</strong> across all 7 days required.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Late permissions:</strong> Mentor approval required.</span></li>
            </ul>
          </div>
          <div className="ev-card">
            <div className="ev-card-title">
              <span className="ev-rule-icn green"><Icon name="check" /></span>
              Internet — Do's
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet green" /><span><strong>Project work:</strong> Use internet for project & research only.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet green" /><span><strong>Knowledge expansion:</strong> Resources to improve technical skills.</span></li>
            </ul>
          </div>
          <div className="ev-card">
            <div className="ev-card-title">
              <span className="ev-rule-icn"><Icon name="alert" /></span>
              Internet — Don'ts
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet red" /><span><strong>Mobile phones</strong> limited to project work only.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet red" /><span><strong>No</strong> obscene, offensive or illegal content.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet red" /><span><strong>No</strong> copyrighted downloads.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet red" /><span><strong>No</strong> social media unless instructed.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet red" /><span><strong>No</strong> accessing others' sensitive info.</span></li>
            </ul>
          </div>
        </div>

        <div className="ev-card" style={{ marginTop: 14 }}>
          <div className="ev-card-title">
            <span className="ev-rule-icn"><Icon name="women" /></span>
            Female Trainee Guidelines
          </div>
          <div className="ev-rules-grid" style={{ gap: 14 }}>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Night escort:</strong> Security personnel escort to hostel after night sessions.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Priority dispersal:</strong> Female trainees leave first.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Final attendance</strong> must be given before dispersal.</span></li>
            </ul>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Female staff presence</strong> until all girls leave.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Zero tolerance</strong> for harassment or misconduct.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Immediate reporting:</strong> Confidentiality guaranteed.</span></li>
            </ul>
          </div>
        </div>

        <div className="ev-warn">
          <span className="ev-warn-icn"><Icon name="alert" /></span>
          <div className="ev-warn-body">
            <strong>Consequences of violation:</strong> Personal phones and laptops will be confiscated.
            Trainee will be terminated from Project Space and will not receive completion certificates.
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6 — PPT ═══ */}
      <section id="ev-ppt" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">6</span> Presentation</div>
          <h2 className="ev-sec-h2">PPT guidelines</h2>
          <p className="ev-sec-desc">AI tools encouraged. Final deck must follow 5-slide rule and formatting standards below.</p>
        </div>

        <div className="ev-ppt-grid">
          <div className="ev-card">
            <div className="ev-card-title"><span className="ev-ppt-num">1</span>Colour Palette</div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#FAF4DF" }} /><div><div className="ev-color-name">Background</div><div className="ev-color-hex">#FAF4DF</div></div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#E3562B" }} /><div><div className="ev-color-name">Primary · Highlights</div><div className="ev-color-hex">#E3562B</div></div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#1D3639" }} /><div><div className="ev-color-name">Secondary · Titles</div><div className="ev-color-hex">#1D3639</div></div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#7F7F7F" }} /><div><div className="ev-color-name">Neutral · Subtext</div><div className="ev-color-hex">#7F7F7F</div></div></div>
          </div>
          <div className="ev-card">
            <div className="ev-card-title"><span className="ev-ppt-num">2</span>Typography — Poppins</div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
            </ul>
          </div>
          <div className="ev-card">
            <div className="ev-card-title"><span className="ev-ppt-num">3</span>Slide Layout</div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Title at top, content below.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Left text + right image when needed.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Clean spacing; simple icons.</span></li>
            </ul>
          </div>
          <div className="ev-card">
            <div className="ev-card-title"><span className="ev-ppt-num">4</span>Content Rules</div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Short, punchy sentences.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Bullets over paragraphs.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Animations: Fade or Appear only.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Same font, colors, layout across slides.</span></li>
            </ul>
          </div>
        </div>

        <div className="ev-card" style={{ marginTop: 14 }}>
          <div className="ev-card-title">
            <Icon name="presentation" />
            Slide Structure — Maximum 5 Slides
          </div>
          <div className="ev-slide-flow">
            <div className="ev-slide">
              <div className="ev-slide-num">Slide 1</div>
              <div className="ev-slide-name">Cover</div>
              <div className="ev-slide-li">• Project Title</div>
              <div className="ev-slide-li">• Team Name</div>
              <div className="ev-slide-li">• Team Members</div>
            </div>
            <div className="ev-slide">
              <div className="ev-slide-num">Slides 2 – 4</div>
              <div className="ev-slide-name">Project Body</div>
              <div className="ev-slide-li">• Problem Statement</div>
              <div className="ev-slide-li">• Solution Overview</div>
              <div className="ev-slide-li">• Features</div>
              <div className="ev-slide-li">• Demo Screenshots / Workflow</div>
              <div className="ev-slide-li">• Technology Stack</div>
            </div>
            <div className="ev-slide">
              <div className="ev-slide-num">Slide 5</div>
              <div className="ev-slide-name">Closing</div>
              <div className="ev-slide-li">• Team Introduction</div>
              <div className="ev-slide-li">• Learnings</div>
              <div className="ev-slide-li">• Thank You Note</div>
            </div>
          </div>
          <div className="ev-warn amber" style={{ marginTop: 16 }}>
            <span className="ev-warn-icn"><Icon name="alert" /></span>
            <div className="ev-warn-body">
              <strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template
              from the login portal — approved colors, fonts, icons and ready-made layouts.
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7 — CONTACTS ═══ */}
      <section id="ev-contacts" className="ev-section">
        <div className="ev-sec-head">
          <div className="ev-sec-eyebrow"><span className="ev-sec-num">7</span> Contacts</div>
          <h2 className="ev-sec-h2">Help & emergency</h2>
          <p className="ev-sec-desc">Save these numbers. Battery-operated campus vehicles available for non-critical injuries to Apollo medical centre.</p>
        </div>

        <div className="ev-card">
          <div className="ev-card-title">
            <Icon name="alert" />
            Emergency & Security
          </div>
          {CONTACTS.emergency.map((c, i) => (
            <div key={i} className="ev-contact-row">
              <div>
                <div className="ev-contact-role">{c.role}</div>
                <div className="ev-contact-name">{c.name}</div>
                {c.note && <div className="ev-contact-note">{c.note}</div>}
              </div>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ev-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>

        <div className="ev-contacts-grid">
          <div className="ev-card">
            <div className="ev-card-title"><Icon name="shield" />Hostel Queries</div>
            {CONTACTS.hostel.map((c, i) => (
              <div key={i} className="ev-contact-row">
                <div>
                  <div className="ev-contact-role">{c.role}</div>
                  <div className="ev-contact-name">{c.name}</div>
                </div>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ev-contact-phone">{c.phone}</a>
              </div>
            ))}
          </div>
          <div className="ev-card">
            <div className="ev-card-title"><Icon name="women" />Female Coordinators</div>
            {CONTACTS.female.map((c, i) => (
              <div key={i} className="ev-contact-row">
                <div>
                  <div className="ev-contact-role">{c.role}</div>
                  <div className="ev-contact-name">{c.name}</div>
                </div>
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="ev-contact-phone">{c.phone}</a>
              </div>
            ))}
          </div>
        </div>

        <div className="ev-warn" style={{ marginTop: 16 }}>
          <span className="ev-warn-icn"><Icon name="alert" /></span>
          <div className="ev-warn-body">
            <strong>First aid kit locations:</strong> Corridor lockers on the 2nd floor and 4th floor of Technical Hub.
          </div>
        </div>
      </section>
    </div>
  );
}

/* ====================================================================== */
/*                            HELPER COMPONENTS                            */
/* ====================================================================== */
function HallGrid({ hall, myN }) {
  const cells = [];
  for (let row = 0; row < hall.rows; row++) {
    for (let col = 0; col < hall.cols; col++) {
      // Numbering: column-by-column, bottom-to-top within each column
      const teamN = hall.startTeam + col * hall.rows + (hall.rows - 1 - row);
      cells.push(teamN <= hall.endTeam ? teamN : null);
    }
  }
  return (
    <div className="ev-hall-grid" style={{ gridTemplateColumns: `repeat(${hall.cols}, 1fr)` }}>
      {cells.map((teamN, i) => {
        if (teamN === null) return <div key={i} style={{ visibility: "hidden" }} />;
        const isMine = myN === teamN;
        return (
          <div key={i} className={`ev-chair ${isMine ? "mine" : ""}`} title={`Team ${teamN}`}>
            {teamN}
          </div>
        );
      })}
    </div>
  );
}

function SearchAnyTeam({ search, setSearch }) {
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
    <>
      <div className="ev-search-wrap">
        <span className="ev-search-icn"><Icon name="search" /></span>
        <input
          className="ev-search-in"
          placeholder="Enter team — e.g. PS-042 or just 42"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {result && !result.notFound && (
        <div className="ev-search-result">
          <div className="ev-search-result-team">Team</div>
          <div className="ev-search-result-team-num">{result.team}</div>
          <div className="ev-search-result-grid">
            <div className="ev-spot-block">
              <div className="ev-spot-block-lab">Hall</div>
              <div className="ev-spot-block-val" style={{ color: result.hall.color }}>{result.hall.name}</div>
            </div>
            <div className="ev-spot-block">
              <div className="ev-spot-block-lab">Floor</div>
              <div className="ev-spot-block-val">Floor {result.venue.floor}</div>
            </div>
            <div className="ev-spot-block">
              <div className="ev-spot-block-lab">Desk</div>
              <div className="ev-spot-block-val">Desk {result.venue.desk}</div>
            </div>
          </div>
        </div>
      )}
      {result && result.notFound && (
        <div className="ev-not-found">
          No team found. Valid range is <strong>PS-001 to PS-160</strong>.
        </div>
      )}
      {!result && (
        <p className="ev-search-hint">
          All <strong>160 teams</strong> mapped across <strong>5 floors</strong> and <strong>4 halls</strong>. Welcome kit pickup on <strong>Day 1, 9:00 – 10:00 AM</strong>.
        </p>
      )}
    </>
  );
}

function ScheduleBlock() {
  const [tab, setTab] = useState("day1");
  const data = TIMINGS[tab];
  return (
    <>
      <div className="ev-tabs">
        <button className={`ev-tab ${tab === "day1" ? "active" : ""}`} onClick={() => setTab("day1")}>Day 1 (Wed)</button>
        <button className={`ev-tab ${tab === "day2to6" ? "active" : ""}`} onClick={() => setTab("day2to6")}>Day 2 – 6</button>
        <button className={`ev-tab ${tab === "day7" ? "active" : ""}`} onClick={() => setTab("day7")}>Day 7 (Tue)</button>
      </div>
      <div className="ev-timeline">
        {data.map(([label, time], i) => (
          <div key={i} className="ev-time-row">
            <span className="ev-time-lab">{label}</span>
            <span className="ev-time-val">{time}</span>
          </div>
        ))}
      </div>
      {tab === "day7" && (
        <div className="ev-warn" style={{ marginTop: 14 }}>
          <span className="ev-warn-icn"><Icon name="alert" /></span>
          <div className="ev-warn-body">
            <strong>Check-out (13th May 2026):</strong> Buses to Rajahmundry & Kakinada by 9:00 AM.
          </div>
        </div>
      )}
    </>
  );
}

/* SVG icon component (line-only icons, stroke="currentColor") */
function Icon({ name }) {
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search": return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "info": return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    case "building": return <svg {...props}><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>;
    case "shield": return <svg {...props}><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z"/></svg>;
    case "shirt": return <svg {...props}><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z"/></svg>;
    case "check": return <svg {...props} strokeWidth="2"><path d="m5 12 4 4L19 7"/></svg>;
    case "alert": return <svg {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
    case "women": return <svg {...props}><circle cx="12" cy="6" r="3"/><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9"/></svg>;
    case "presentation": return <svg {...props}><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="m7 11 3-3 2 2 4-5"/></svg>;
    default: return null;
  }
}