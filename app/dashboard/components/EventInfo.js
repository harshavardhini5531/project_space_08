"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

/* ============================================================
   EVENT INFO — v4 · Editorial Dossier rebuild
   Path: app/dashboard/components/EventInfo.js

   Design language: Editorial dossier.
   - Single vertical spine; numbered chapters with thin rules.
   - Hero is a magazine-style masthead, not a hero card.
   - Real chair silhouettes on a floor-plan grid (not rect cells).
   - Opaque sticky chrome (no see-through scroll).
   - Color discipline: red (#fd1c00) reserved for YOU; amber for chrome;
     violet (#7B2FBE) for floor markers.
   ============================================================ */

/* -------------------- HALL DATA --------------------
   Layouts hard-coded from the official brochure.
   `seats` is a 2D matrix [rows][cols], top-to-bottom.
   `null` = aisle/empty. `entrances` = entrance positions.
   --------------------------------------------------- */
const HALLS = [
  {
    id: "h41",
    label: "4.1",
    name: "Hall 4.1",
    accent: "#3b82f6",
    teamRange: [1, 44],
    cols: 12, rows: 4,
    seats: [
      [4, 8, 12, 16, 20, 24, 28, 32, 36, null, 40, 44],
      [3, 7, 11, 15, 19, 23, 27, 31, 35, null, 39, 43],
      [2, 6, 10, 14, 18, 22, 26, 30, 34, null, 38, 42],
      [1, 5, 9, 13, 17, 21, 25, 29, 33, null, 37, 41],
    ],
    /* entrance positions: side = "left"|"right"|"top"|"bottom" relative to the floor plan */
    entrances: [
      { side: "left", at: "front" },     // left side wall, near front
      { side: "bottom", col: 9 },        // gap column (0-indexed col 9)
    ],
  },
  {
    id: "h42",
    label: "4.2",
    name: "Hall 4.2",
    accent: "#22d3ee",
    teamRange: [45, 80],
    cols: 10, rows: 4,
    seats: [
      [80, 76, 72, 68, 64, 60, 57, 53, 49, 45],
      [77, 73, 69, 65, 61, 58, 54, 50, 46, null],
      [78, 74, 70, 66, 62, 59, 55, 51, 47, null],
      [79, 75, 71, 67, 63, null, 56, 52, 48, null],
    ],
    entrances: [
      { side: "bottom", col: 5 },
    ],
  },
  {
    id: "h21",
    label: "2.1",
    name: "Hall 2.1",
    accent: "#a16207",
    teamRange: [81, 124],
    cols: 12, rows: 4,
    seats: [
      [84, 88, 92, 96, 100, 104, 108, 112, 116, null, 120, 124],
      [83, 87, 91, 95, 99, 103, 107, 111, 115, null, 119, 123],
      [82, 86, 90, 94, 98, 102, 106, 110, 114, null, 118, 122],
      [81, 85, 89, 93, 97, 101, 105, 109, 113, null, 117, 121],
    ],
    entrances: [
      { side: "left", at: "front" },
      { side: "bottom", col: 9 },
    ],
  },
  {
    id: "h22",
    label: "2.2",
    name: "Hall 2.2",
    accent: "#10b981",
    teamRange: [125, 160],
    cols: 10, rows: 4,
    seats: [
      [160, 156, 152, 148, 144, 140, 137, 133, 129, 125],
      [null, 157, 153, 149, 145, 141, 138, 134, 130, 126],
      [null, 158, 154, 150, 146, 142, 139, 135, 131, 127],
      [null, 159, 155, 151, 147, 143, null, 136, 132, 128],
    ],
    entrances: [
      { side: "bottom", col: 5 },
    ],
  },
];

/* -------------------- FLOOR / DESK MAP (welcome kit) -------------------- */
const FLOOR_DESK_MAP = {
  1: [{ desk: 1, range: "PS-001 – PS-008" }, { desk: 2, range: "PS-009 – PS-016" }, { desk: 3, range: "PS-017 – PS-024" }, { desk: 4, range: "PS-025 – PS-032" }],
  2: [{ desk: 1, range: "PS-033 – PS-040" }, { desk: 2, range: "PS-041 – PS-048" }, { desk: 3, range: "PS-049 – PS-056" }, { desk: 4, range: "PS-057 – PS-064" }],
  3: [{ desk: 1, range: "PS-065 – PS-072" }, { desk: 2, range: "PS-073 – PS-080" }, { desk: 3, range: "PS-081 – PS-088" }, { desk: 4, range: "PS-089 – PS-096" }],
  4: [{ desk: 1, range: "PS-097 – PS-104" }, { desk: 2, range: "PS-105 – PS-112" }, { desk: 3, range: "PS-113 – PS-120" }, { desk: 4, range: "PS-121 – PS-128" }],
  5: [{ desk: 1, range: "PS-129 – PS-136" }, { desk: 2, range: "PS-137 – PS-144" }, { desk: 3, range: "PS-145 – PS-152" }, { desk: 4, range: "PS-153 – PS-160" }],
};

function teamNumberToInt(teamNumber) {
  if (!teamNumber || !teamNumber.startsWith("PS-")) return null;
  const n = parseInt(teamNumber.replace("PS-", ""), 10);
  return isNaN(n) || n < 1 || n > 160 ? null : n;
}

function getVenue(teamNumber) {
  const n = teamNumberToInt(teamNumber);
  if (!n) return null;
  const floor = Math.ceil(n / 32);
  const idx = ((n - 1) % 32) + 1;
  const desk = Math.ceil(idx / 8);
  const start = (floor - 1) * 32 + (desk - 1) * 8 + 1;
  const end = start + 7;
  return { floor, desk, range: `PS-${String(start).padStart(3, "0")} – PS-${String(end).padStart(3, "0")}` };
}

function getHall(teamNumber) {
  const n = teamNumberToInt(teamNumber);
  if (!n) return null;
  return HALLS.find((h) => n >= h.teamRange[0] && n <= h.teamRange[1]);
}

/* -------------------- DRESS CODE -------------------- */
const DRESS_CODE = [
  { day: 1, week: "WED", attire: "Drive Ready / SkillUp T-Shirt" },
  { day: 2, week: "THU", attire: "Project Space T-Shirt" },
  { day: 3, week: "FRI", attire: "Civil Formal Wear" },
  { day: 4, week: "SAT", attire: "Project Space T-Shirt" },
  { day: 5, week: "SUN", attire: "White Code Dress" },
  { day: 6, week: "MON", attire: "Drive Ready / SkillUp T-Shirt" },
  { day: 7, week: "TUE", attire: "Project Space T-Shirt" },
];

/* -------------------- TIMINGS -------------------- */
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

/* -------------------- CONTACTS -------------------- */
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

/* -------------------- SECTIONS -------------------- */
const SECTIONS = [
  { id: "spot",     n: "01", short: "My Spot",  long: "Your team & welcome kit" },
  { id: "halls",    n: "02", short: "Seating",  long: "Where you sit" },
  { id: "schedule", n: "03", short: "Schedule", long: "Daily timings" },
  { id: "dress",    n: "04", short: "Dress",    long: "Day-by-day attire" },
  { id: "rules",    n: "05", short: "Rules",    long: "Code of conduct" },
  { id: "ppt",      n: "06", short: "PPT",      long: "Presentation guide" },
  { id: "contacts", n: "07", short: "Contacts", long: "Help & emergency" },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function EventInfo({ user }) {
  const [activeSec, setActiveSec] = useState("spot");
  const [search, setSearch] = useState("");
  const [scheduleTab, setScheduleTab] = useState("day1");

  const teamNumber = user?.teamNumber || user?.team_number;
  const myN = teamNumberToInt(teamNumber);
  const myVenue = teamNumber ? getVenue(teamNumber) : null;
  const myHall = teamNumber ? getHall(teamNumber) : null;

  /* Scroll spy via IntersectionObserver */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
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
        /* ─────────── ROOT & TOKENS ─────────── */
        .ev {
          --base: #050008;
          --ink: #ffffff;
          --ink-2: rgba(255,255,255,.62);
          --ink-3: rgba(255,255,255,.38);
          --ink-4: rgba(255,255,255,.18);
          --rule: rgba(255,255,255,.07);
          --rule-2: rgba(255,255,255,.12);
          --you: #fd1c00;
          --amber: #EEA727;
          --violet: #7B2FBE;
          --surface: rgba(255,255,255,.025);
          --surface-2: rgba(255,255,255,.04);
          font-family: 'DM Sans', system-ui, sans-serif;
          color: var(--ink);
          letter-spacing: -0.005em;
          animation: evIn .55s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes evIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes evFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes evPulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        @keyframes evScan {
          0%   { transform: translateX(-100%); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        /* ─────────── MASTHEAD ─────────── */
        .ev-mast {
          position: relative;
          padding: 14px 0 28px;
          border-bottom: 1px solid var(--rule);
          margin-bottom: 0;
        }
        .ev-mast-meta {
          display: flex; align-items: center; gap: 14px;
          font-size: .56rem; letter-spacing: .22em;
          font-weight: 700; text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 22px;
        }
        .ev-mast-meta-pulse {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--you);
          box-shadow: 0 0 8px var(--you);
          animation: evPulse 2s ease-in-out infinite;
        }
        .ev-mast-meta-rule {
          flex: 1; height: 1px; background: var(--rule);
        }
        .ev-mast-eye {
          color: var(--amber);
        }
        .ev-mast-h1 {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: clamp(2.2rem, 6vw, 4rem);
          font-weight: 800;
          line-height: .9;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin: 0 0 8px;
          color: var(--ink);
        }
        .ev-mast-h1 .accent { color: var(--you); }
        .ev-mast-sub {
          font-size: .92rem;
          color: var(--ink-2);
          line-height: 1.5;
          max-width: 560px;
          margin: 0 0 26px;
        }
        .ev-mast-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .ev-mast-stat {
          padding: 14px 18px;
          border-right: 1px solid var(--rule);
          position: relative;
        }
        .ev-mast-stat:last-child { border-right: none; }
        .ev-mast-stat-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 1.5rem; font-weight: 800;
          color: var(--ink); line-height: 1;
          letter-spacing: 1px;
        }
        .ev-mast-stat-lab {
          font-size: .52rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
          margin-top: 8px;
        }
        @media (max-width: 600px) {
          .ev-mast-strip { grid-template-columns: repeat(2, 1fr); }
          .ev-mast-stat:nth-child(2) { border-right: none; }
          .ev-mast-stat:nth-child(1), .ev-mast-stat:nth-child(2) {
            border-bottom: 1px solid var(--rule);
          }
        }

        /* ─────────── STICKY NAV (OPAQUE) ─────────── */
        .ev-nav-wrap {
          position: sticky;
          top: 0;
          z-index: 25;
          margin: 0 -1rem;
          padding: 0 1rem;
          /* SOLID OPAQUE — no transparency, no blur. */
          background: var(--base);
          border-bottom: 1px solid var(--rule-2);
          box-shadow: 0 4px 12px rgba(0,0,0,.4);
        }
        .ev-nav {
          display: flex;
          align-items: center;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0;
        }
        .ev-nav::-webkit-scrollbar { display: none; }
        .ev-nav-pill {
          padding: 16px 18px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--ink-3);
          font-family: 'DM Sans', sans-serif;
          font-size: .76rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: color .18s, border-color .18s;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .ev-nav-pill:hover { color: var(--ink); }
        .ev-nav-pill.active {
          color: var(--ink);
          border-bottom-color: var(--you);
        }
        .ev-nav-pill-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: .58rem;
          color: var(--ink-3);
          letter-spacing: .1em;
          font-weight: 700;
        }
        .ev-nav-pill.active .ev-nav-pill-num { color: var(--amber); }

        /* ─────────── SECTION ARCHITECTURE ─────────── */
        .ev-chap {
          padding: 56px 0 8px;
          scroll-margin-top: 60px;
          animation: evFadeUp .5s ease both;
        }
        .ev-chap:first-of-type { padding-top: 38px; }
        .ev-chap-head {
          display: grid;
          grid-template-columns: 76px 1fr;
          gap: 20px;
          margin-bottom: 28px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--rule);
        }
        @media (max-width: 600px) {
          .ev-chap-head { grid-template-columns: 56px 1fr; gap: 14px; }
        }
        .ev-chap-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
          color: var(--amber);
          letter-spacing: 1px;
        }
        @media (max-width: 600px) { .ev-chap-num { font-size: 1.6rem; } }
        .ev-chap-title-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .ev-chap-eye {
          font-size: .54rem;
          letter-spacing: .22em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .ev-chap-h2 {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -.015em;
          color: var(--ink);
          margin: 0 0 4px;
        }
        @media (max-width: 600px) { .ev-chap-h2 { font-size: 1.15rem; } }
        .ev-chap-desc {
          font-size: .8rem;
          color: var(--ink-2);
          line-height: 1.55;
          max-width: 580px;
        }

        /* ─────────── COMMON LABEL/VALUE ─────────── */
        .ev-label {
          font-size: .5rem;
          letter-spacing: .2em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--ink-3);
          margin-bottom: 6px;
        }

        /* ─────────── MY SPOT ─────────── */
        .ev-spot {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }
        @media (max-width: 820px) { .ev-spot { grid-template-columns: 1fr; gap: 22px; } }

        .ev-myspot {
          position: relative;
          padding: 24px 24px 22px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          overflow: hidden;
        }
        .ev-myspot.has-team {
          border-color: rgba(253,28,0,.35);
        }
        .ev-myspot::before {
          /* corner brackets */
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, var(--you) 18px, transparent 18px) top left / 18px 1px no-repeat,
            linear-gradient(to bottom, var(--you) 18px, transparent 18px) top left / 1px 18px no-repeat,
            linear-gradient(to left, var(--you) 18px, transparent 18px) top right / 18px 1px no-repeat,
            linear-gradient(to bottom, var(--you) 18px, transparent 18px) top right / 1px 18px no-repeat,
            linear-gradient(to right, var(--you) 18px, transparent 18px) bottom left / 18px 1px no-repeat,
            linear-gradient(to top, var(--you) 18px, transparent 18px) bottom left / 1px 18px no-repeat,
            linear-gradient(to left, var(--you) 18px, transparent 18px) bottom right / 18px 1px no-repeat,
            linear-gradient(to top, var(--you) 18px, transparent 18px) bottom right / 1px 18px no-repeat;
          opacity: 0;
          transition: opacity .3s;
          pointer-events: none;
        }
        .ev-myspot.has-team::before { opacity: 1; }

        .ev-myspot-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: .52rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--you);
          margin-bottom: 14px;
        }
        .ev-myspot-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--you);
          animation: evPulse 1.6s ease-in-out infinite;
        }
        .ev-myspot-team {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 2.5px;
          color: var(--ink);
          line-height: 1;
          margin-bottom: 22px;
        }
        .ev-myspot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid var(--rule);
        }
        .ev-myspot-cell {
          padding: 14px 0 0;
          border-right: 1px solid var(--rule);
          padding-right: 12px;
        }
        .ev-myspot-cell:last-child { border-right: none; padding-right: 0; padding-left: 12px; }
        .ev-myspot-cell:nth-child(2) { padding-left: 12px; padding-right: 12px; }
        .ev-myspot-cell-val {
          font-size: .92rem;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }
        .ev-myspot-cell-sub {
          font-size: .62rem;
          color: var(--ink-3);
          margin-top: 4px;
          font-variant-numeric: tabular-nums;
        }

        .ev-empty {
          padding: 24px;
          background: var(--surface);
          border: 1px dashed var(--rule-2);
          color: var(--ink-2);
          font-size: .82rem;
          line-height: 1.55;
        }

        /* ─────────── SEARCH ─────────── */
        .ev-search-card {
          padding: 22px 24px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
        }
        .ev-search-card h3 {
          font-size: .56rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
          margin: 0 0 14px;
        }
        .ev-search-wrap { position: relative; }
        .ev-search-icn {
          position: absolute; left: 0; top: 50%;
          transform: translateY(-50%);
          width: 14px; height: 14px;
          color: var(--ink-3);
          pointer-events: none;
        }
        .ev-search-in {
          width: 100%;
          padding: 12px 0 12px 26px;
          border: none;
          border-bottom: 1px solid var(--rule-2);
          background: transparent;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          outline: none;
          transition: border-color .2s;
        }
        .ev-search-in:focus { border-bottom-color: var(--amber); }
        .ev-search-in::placeholder { color: var(--ink-3); }

        .ev-search-hint {
          margin-top: 16px;
          font-size: .72rem;
          color: var(--ink-3);
          line-height: 1.5;
        }
        .ev-search-hint strong { color: var(--ink-2); font-weight: 600; }

        .ev-search-result {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid var(--rule);
          animation: evFadeUp .35s ease both;
        }
        .ev-search-result-head {
          display: flex; align-items: baseline; gap: 12px;
          margin-bottom: 14px;
        }
        .ev-search-result-team {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--ink);
        }
        .ev-search-result-eye {
          font-size: .52rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--amber);
        }
        .ev-search-result-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        .ev-search-result-cell {
          padding: 10px 12px 10px 0;
          border-right: 1px solid var(--rule);
        }
        .ev-search-result-cell:last-child { border-right: none; }
        .ev-search-result-cell:nth-child(n+2) { padding-left: 12px; }
        .ev-not-found {
          margin-top: 14px;
          padding: 12px 14px;
          color: var(--ink-2);
          font-size: .76rem;
          background: var(--surface);
          border-left: 2px solid var(--you);
        }

        /* ─────────── FLOOR PLAN BAND ─────────── */
        .ev-floors-head {
          display: flex; align-items: baseline; justify-content: space-between;
          margin: 38px 0 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-floors-head-title {
          font-size: .58rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-2);
        }
        .ev-floors-head-meta {
          font-size: .58rem; letter-spacing: .15em;
          text-transform: uppercase; font-weight: 600;
          color: var(--ink-3);
          font-variant-numeric: tabular-nums;
        }
        .ev-floors {
          display: flex; flex-direction: column;
          border: 1px solid var(--rule-2);
          background: var(--surface);
        }
        .ev-floor {
          display: grid;
          grid-template-columns: 80px 1fr;
          border-bottom: 1px solid var(--rule);
          transition: background .2s;
        }
        .ev-floor:last-child { border-bottom: none; }
        .ev-floor.mine { background: rgba(253,28,0,.04); }
        .ev-floor-meta {
          padding: 18px 16px;
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }
        .ev-floor-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--violet);
          line-height: 1;
          letter-spacing: 1px;
        }
        .ev-floor.mine .ev-floor-num { color: var(--you); }
        .ev-floor-tag {
          font-size: .5rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
        }
        .ev-floor-desks {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 720px) {
          .ev-floor { grid-template-columns: 60px 1fr; }
          .ev-floor-meta { padding: 14px 10px; }
          .ev-floor-num { font-size: 1.2rem; }
          .ev-floor-desks { grid-template-columns: repeat(2, 1fr); }
        }
        .ev-desk {
          padding: 14px 16px;
          border-right: 1px solid var(--rule);
          position: relative;
          transition: background .15s;
        }
        .ev-desk:last-child { border-right: none; }
        @media (max-width: 720px) {
          .ev-desk { border-bottom: 1px solid var(--rule); }
          .ev-desk:nth-child(2n) { border-right: none; }
          .ev-desk:nth-last-child(-n+2) { border-bottom: none; }
        }
        .ev-desk-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: .65rem;
          letter-spacing: .15em;
          color: var(--ink-3);
          font-weight: 700;
          margin-bottom: 4px;
        }
        .ev-desk-range {
          font-size: .78rem;
          font-weight: 600;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
          letter-spacing: .02em;
        }
        .ev-desk.mine {
          background: rgba(253,28,0,.08);
        }
        .ev-desk.mine .ev-desk-num { color: var(--you); }
        .ev-desk-mine-tag {
          position: absolute;
          top: 10px; right: 12px;
          font-size: .5rem; letter-spacing: .15em;
          text-transform: uppercase; font-weight: 700;
          color: var(--you);
        }

        /* ─────────── HALLS / SEATING ─────────── */
        .ev-halls {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .ev-hall {
          background: var(--surface);
          border: 1px solid var(--rule-2);
        }
        .ev-hall.mine {
          border-color: rgba(253,28,0,.32);
        }
        .ev-hall-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px;
          padding: 18px 22px;
          border-bottom: 1px solid var(--rule);
          align-items: baseline;
        }
        .ev-hall-name {
          display: flex; align-items: baseline; gap: 14px;
        }
        .ev-hall-label {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: 1.5px;
        }
        .ev-hall-eye {
          font-size: .52rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
        }
        .ev-hall-range {
          font-size: .72rem;
          font-variant-numeric: tabular-nums;
          color: var(--ink-2);
          font-weight: 500;
        }
        .ev-hall-mine-flag {
          font-size: .5rem;
          letter-spacing: .2em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--you);
          padding: 4px 10px;
          border: 1px solid var(--you);
        }

        .ev-hall-floor {
          padding: 28px 22px;
          background:
            radial-gradient(ellipse at center, rgba(255,255,255,.025), transparent 70%),
            repeating-linear-gradient(
              0deg,
              transparent 0,
              transparent 19px,
              rgba(255,255,255,.025) 19px,
              rgba(255,255,255,.025) 20px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 19px,
              rgba(255,255,255,.025) 19px,
              rgba(255,255,255,.025) 20px
            );
          position: relative;
          overflow: hidden;
        }

        .ev-hall-foot {
          padding: 12px 22px;
          border-top: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          font-size: .58rem;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 600;
        }
        .ev-hall-legend {
          display: flex; align-items: center; gap: 16px;
        }
        .ev-hall-legend-item {
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ev-hall-legend-chair {
          width: 14px; height: 14px;
          display: inline-block;
          color: var(--ink-3);
        }
        .ev-hall-legend-chair.mine { color: var(--you); }

        /* ─────────── SCHEDULE ─────────── */
        .ev-tabs {
          display: flex;
          align-items: center;
          gap: 0;
          border-bottom: 1px solid var(--rule);
          margin-bottom: 0;
        }
        .ev-tab {
          padding: 14px 22px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--ink-3);
          font-family: 'DM Sans', sans-serif;
          font-size: .76rem;
          font-weight: 600;
          cursor: pointer;
          transition: color .15s, border-color .15s;
          margin-bottom: -1px;
          white-space: nowrap;
        }
        .ev-tab:hover { color: var(--ink); }
        .ev-tab.active { color: var(--ink); border-bottom-color: var(--you); }

        .ev-time-list {
          background: var(--surface);
        }
        .ev-time-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          padding: 14px 22px;
          border-bottom: 1px solid var(--rule);
          align-items: baseline;
          transition: background .15s;
        }
        .ev-time-row:last-child { border-bottom: none; }
        .ev-time-row:hover { background: var(--surface-2); }
        .ev-time-lab {
          font-size: .82rem; color: var(--ink); font-weight: 500;
        }
        .ev-time-val {
          font-size: .74rem;
          color: var(--amber);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          letter-spacing: .03em;
          white-space: nowrap;
        }

        /* ─────────── DRESS STRIP ─────────── */
        .ev-dress {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid var(--rule-2);
          background: var(--surface);
        }
        @media (max-width: 1100px) { .ev-dress { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 600px) { .ev-dress { grid-template-columns: repeat(2, 1fr); } }

        .ev-dress-cell {
          padding: 18px 16px 20px;
          border-right: 1px solid var(--rule);
          position: relative;
          transition: background .2s;
        }
        @media (max-width: 1100px) {
          .ev-dress-cell { border-bottom: 1px solid var(--rule); }
          .ev-dress-cell:nth-child(4n) { border-right: none; }
        }
        @media (max-width: 600px) {
          .ev-dress-cell:nth-child(4n) { border-right: 1px solid var(--rule); }
          .ev-dress-cell:nth-child(2n) { border-right: none; }
        }
        .ev-dress-cell:hover { background: var(--surface-2); }
        .ev-dress-cell:last-child { border-right: none; }

        .ev-dress-head {
          display: flex; align-items: baseline; gap: 8px;
          margin-bottom: 14px;
        }
        .ev-dress-day {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--you);
          letter-spacing: 1px;
        }
        .ev-dress-week {
          font-size: .55rem;
          letter-spacing: .2em;
          font-weight: 700;
          color: var(--ink-3);
        }
        .ev-dress-attire {
          font-size: .76rem;
          line-height: 1.45;
          color: var(--ink);
          font-weight: 500;
        }

        /* ─────────── RULES ─────────── */
        .ev-rules {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border: 1px solid var(--rule-2);
          background: var(--surface);
        }
        @media (max-width: 820px) { .ev-rules { grid-template-columns: 1fr; } }
        .ev-rule-block {
          padding: 22px 24px;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .ev-rule-block:nth-child(2n) { border-right: none; }
        .ev-rule-block:nth-last-child(-n+2) { border-bottom: none; }
        @media (max-width: 820px) {
          .ev-rule-block { border-right: none; }
          .ev-rule-block:nth-last-child(-n+2) { border-bottom: 1px solid var(--rule); }
          .ev-rule-block:last-child { border-bottom: none; }
        }
        .ev-rule-head {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-rule-head-icn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          color: var(--you);
          flex-shrink: 0;
        }
        .ev-rule-head-icn.green { color: #10b981; }
        .ev-rule-head-icn.amber { color: var(--amber); }
        .ev-rule-head-title {
          font-size: .82rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -.005em;
        }
        .ev-rule-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ev-rule-li {
          display: flex; gap: 12px;
          font-size: .76rem; line-height: 1.55;
          color: var(--ink-2);
        }
        .ev-rule-li strong { color: var(--ink); font-weight: 600; }
        .ev-bullet {
          width: 4px; height: 4px;
          background: var(--amber);
          margin-top: 8px;
          flex-shrink: 0;
        }
        .ev-bullet.green { background: #10b981; }
        .ev-bullet.red { background: var(--you); }

        .ev-female {
          margin-top: 24px;
          border: 1px solid var(--rule-2);
          background: var(--surface);
        }
        .ev-female-head {
          padding: 16px 24px;
          border-bottom: 1px solid var(--rule);
          display: flex; align-items: center; gap: 10px;
        }
        .ev-female-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 720px) { .ev-female-body { grid-template-columns: 1fr; } }
        .ev-female-col {
          padding: 22px 24px;
          border-right: 1px solid var(--rule);
        }
        .ev-female-col:last-child { border-right: none; }
        @media (max-width: 720px) {
          .ev-female-col { border-right: none; border-bottom: 1px solid var(--rule); }
          .ev-female-col:last-child { border-bottom: none; }
        }

        .ev-warn {
          margin-top: 20px;
          padding: 16px 22px;
          background: rgba(253,28,0,.06);
          border-left: 3px solid var(--you);
          display: flex; gap: 14px; align-items: flex-start;
        }
        .ev-warn.amber {
          background: rgba(238,167,39,.06);
          border-left-color: var(--amber);
        }
        .ev-warn-icn {
          width: 18px; height: 18px;
          color: var(--you);
          flex-shrink: 0;
          margin-top: 1px;
        }
        .ev-warn.amber .ev-warn-icn { color: var(--amber); }
        .ev-warn-body {
          font-size: .76rem; line-height: 1.55; color: var(--ink-2);
        }
        .ev-warn-body strong { color: var(--ink); font-weight: 600; }

        /* ─────────── PPT ─────────── */
        .ev-ppt-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border: 1px solid var(--rule-2);
          background: var(--surface);
        }
        @media (max-width: 820px) { .ev-ppt-grid { grid-template-columns: 1fr; } }
        .ev-ppt-cell {
          padding: 22px 24px;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .ev-ppt-cell:nth-child(2n) { border-right: none; }
        .ev-ppt-cell:nth-last-child(-n+2) { border-bottom: none; }
        @media (max-width: 820px) {
          .ev-ppt-cell { border-right: none; }
          .ev-ppt-cell:nth-last-child(-n+2) { border-bottom: 1px solid var(--rule); }
          .ev-ppt-cell:last-child { border-bottom: none; }
        }

        .ev-ppt-head {
          display: flex; align-items: baseline; gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-ppt-num {
          font-family: 'Astro', 'Orbitron', sans-serif;
          font-size: .9rem;
          font-weight: 800;
          color: var(--amber);
          letter-spacing: 1px;
        }
        .ev-ppt-title {
          font-size: .82rem;
          font-weight: 700;
          color: var(--ink);
        }

        .ev-color-row {
          display: grid;
          grid-template-columns: 26px 1fr auto;
          gap: 14px;
          padding: 8px 0;
          align-items: center;
          font-size: .78rem;
        }
        .ev-color-swatch {
          width: 26px; height: 26px;
          border: 1px solid var(--rule-2);
        }
        .ev-color-name { color: var(--ink); font-weight: 500; }
        .ev-color-hex {
          color: var(--ink-3);
          font-family: ui-monospace, monospace;
          font-size: .68rem;
          letter-spacing: .04em;
        }

        .ev-slide-flow {
          display: grid;
          grid-template-columns: 1fr 2.5fr 1fr;
          gap: 0;
          margin-top: 18px;
          border: 1px solid var(--rule-2);
        }
        @media (max-width: 720px) { .ev-slide-flow { grid-template-columns: 1fr; } }
        .ev-slide {
          padding: 18px 20px;
          border-right: 1px solid var(--rule);
          background: var(--surface);
        }
        .ev-slide:last-child { border-right: none; }
        @media (max-width: 720px) {
          .ev-slide { border-right: none; border-bottom: 1px solid var(--rule); }
          .ev-slide:last-child { border-bottom: none; }
        }
        .ev-slide-num {
          font-size: .52rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--amber);
          margin-bottom: 8px;
        }
        .ev-slide-name {
          font-size: .82rem; font-weight: 700;
          color: var(--ink);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-slide-li {
          font-size: .72rem;
          color: var(--ink-2);
          line-height: 1.55;
          padding: 3px 0;
        }
        .ev-slide-li::before {
          content: "—  ";
          color: var(--ink-3);
        }

        /* ─────────── CONTACTS ─────────── */
        .ev-contact-block {
          background: var(--surface);
          border: 1px solid var(--rule-2);
          margin-bottom: 18px;
        }
        .ev-contact-head {
          padding: 14px 22px;
          border-bottom: 1px solid var(--rule);
          display: flex; align-items: center; gap: 10px;
          font-size: .58rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-2);
        }
        .ev-contact-head-icn {
          width: 16px; height: 16px;
          color: var(--you);
        }
        .ev-contact-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          padding: 14px 22px;
          border-bottom: 1px solid var(--rule);
          align-items: center;
          transition: background .15s;
        }
        .ev-contact-row:last-child { border-bottom: none; }
        .ev-contact-row:hover { background: var(--surface-2); }
        .ev-contact-role {
          font-size: .5rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
          margin-bottom: 3px;
        }
        .ev-contact-name {
          font-size: .82rem; color: var(--ink);
          font-weight: 500;
        }
        .ev-contact-note {
          font-size: .68rem; color: var(--ink-3);
          margin-top: 2px;
        }
        .ev-contact-phone {
          font-family: ui-monospace, monospace;
          font-size: .8rem;
          color: var(--amber); font-weight: 700;
          padding: 8px 14px;
          border: 1px solid var(--rule-2);
          white-space: nowrap;
          text-decoration: none;
          letter-spacing: .03em;
          transition: border-color .2s, color .2s;
        }
        .ev-contact-phone:hover {
          border-color: var(--amber);
        }

        .ev-contacts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 820px) { .ev-contacts-grid { grid-template-columns: 1fr; gap: 0; } }

        /* small screens */
        @media (max-width: 600px) {
          .ev-mast { padding-top: 8px; padding-bottom: 22px; }
          .ev-myspot { padding: 20px; }
          .ev-myspot-team { font-size: 1.6rem; }
          .ev-search-card { padding: 18px 20px; }
          .ev-time-row, .ev-contact-row, .ev-rule-block, .ev-ppt-cell { padding-left: 16px; padding-right: 16px; }
          .ev-hall-head, .ev-hall-foot { padding-left: 16px; padding-right: 16px; }
          .ev-hall-floor { padding: 20px 12px; }
          .ev-myspot-grid { grid-template-columns: 1fr; }
          .ev-myspot-cell { border-right: none; border-bottom: 1px solid var(--rule); padding: 14px 0 !important; }
          .ev-myspot-cell:last-child { border-bottom: none; padding-bottom: 0 !important; }
        }
      `}</style>

      {/* ═════════════════════════════════════════════
          MASTHEAD (editorial header — not a hero card)
          ═════════════════════════════════════════════ */}
      <header className="ev-mast">
        <div className="ev-mast-meta">
          <span className="ev-mast-meta-pulse" />
          <span className="ev-mast-eye">Project Space · Season 8</span>
          <span className="ev-mast-meta-rule" />
          <span>May 6 – 12 · 2026</span>
        </div>
        <h1 className="ev-mast-h1">
          Event<br />
          Information<span className="accent">.</span>
        </h1>
        <p className="ev-mast-sub">
          Your team's seating, welcome kit pickup, daily schedule, dress code,
          guidelines, presentation rules and emergency contacts — read in order, or
          jump to a section.
        </p>
        <div className="ev-mast-strip">
          <div className="ev-mast-stat"><div className="ev-mast-stat-num">900<sup style={{ fontSize: ".6em", verticalAlign: "super" }}>+</sup></div><div className="ev-mast-stat-lab">Trainees</div></div>
          <div className="ev-mast-stat"><div className="ev-mast-stat-num">160</div><div className="ev-mast-stat-lab">Teams</div></div>
          <div className="ev-mast-stat"><div className="ev-mast-stat-num">7</div><div className="ev-mast-stat-lab">Days</div></div>
          <div className="ev-mast-stat"><div className="ev-mast-stat-num">7</div><div className="ev-mast-stat-lab">Domains</div></div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════
          STICKY OPAQUE NAV (no see-through scrolling)
          ═════════════════════════════════════════════ */}
      <nav className="ev-nav-wrap">
        <div className="ev-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`ev-nav-pill ${activeSec === s.id ? "active" : ""}`}
              onClick={() => scrollTo(s.id)}
            >
              <span className="ev-nav-pill-num">{s.n}</span>
              {s.short}
            </button>
          ))}
        </div>
      </nav>

      {/* ═════════════════════════════════════════════
          CHAPTER 01 — MY SPOT
          ═════════════════════════════════════════════ */}
      <section id="ev-spot" className="ev-chap">
        <ChapterHead n="01" eye="Chapter 01" h2="Your team & welcome kit" desc="Find your team's seating hall, welcome-kit pickup floor, and look up any other team. Pickup is on Day 1, 9:00 – 10:00 AM." />

        <div className="ev-spot">
          {teamNumber && myVenue && myHall ? (
            <div className="ev-myspot has-team">
              <div className="ev-myspot-tag">
                <span className="ev-myspot-tag-dot" />
                Your Team
              </div>
              <div className="ev-myspot-team">{teamNumber}</div>
              <div className="ev-myspot-grid">
                <div className="ev-myspot-cell">
                  <div className="ev-label">Hall</div>
                  <div className="ev-myspot-cell-val" style={{ color: myHall.accent }}>{myHall.name}</div>
                  <div className="ev-myspot-cell-sub">Seating</div>
                </div>
                <div className="ev-myspot-cell">
                  <div className="ev-label">Floor</div>
                  <div className="ev-myspot-cell-val">Floor {myVenue.floor}</div>
                  <div className="ev-myspot-cell-sub">Welcome kit</div>
                </div>
                <div className="ev-myspot-cell">
                  <div className="ev-label">Desk</div>
                  <div className="ev-myspot-cell-val">Desk {myVenue.desk}</div>
                  <div className="ev-myspot-cell-sub">{myVenue.range}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="ev-empty">
              <div className="ev-label" style={{ marginBottom: 10 }}>Welcome Kit · Day 1</div>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Pickup is Wednesday 9:00 – 10:00 AM. Find your team's spot using the search panel.
              </p>
            </div>
          )}

          <div className="ev-search-card">
            <h3>Look up any team</h3>
            <SearchAnyTeam search={search} setSearch={setSearch} />
          </div>
        </div>

        {/* Floor plan band */}
        <div className="ev-floors-head">
          <span className="ev-floors-head-title">All 5 floors · welcome kit</span>
          <span className="ev-floors-head-meta">160 teams · 4 desks per floor</span>
        </div>
        <div className="ev-floors">
          {Object.entries(FLOOR_DESK_MAP).map(([floor, desks]) => {
            const isMyFloor = myVenue?.floor === Number(floor);
            return (
              <div key={floor} className={`ev-floor ${isMyFloor ? "mine" : ""}`}>
                <div className="ev-floor-meta">
                  <div className="ev-floor-num">{floor}</div>
                  <div className="ev-floor-tag">Floor</div>
                </div>
                <div className="ev-floor-desks">
                  {desks.map((d) => {
                    const isMyDesk = isMyFloor && myVenue.desk === d.desk;
                    return (
                      <div key={d.desk} className={`ev-desk ${isMyDesk ? "mine" : ""}`}>
                        {isMyDesk && <span className="ev-desk-mine-tag">You</span>}
                        <div className="ev-desk-num">Desk {d.desk}</div>
                        <div className="ev-desk-range">{d.range}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CHAPTER 02 — SEATING / HALLS
          ═════════════════════════════════════════════ */}
      <section id="ev-halls" className="ev-chap">
        <ChapterHead n="02" eye="Chapter 02" h2="Where you sit" desc="Each team has a fixed seat across four halls. Layouts here mirror the official brochure — chair grid, entrances, row directions all match." />
        <div className="ev-halls">
          {HALLS.map((hall) => (
            <HallView key={hall.id} hall={hall} myN={myN} />
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CHAPTER 03 — SCHEDULE
          ═════════════════════════════════════════════ */}
      <section id="ev-schedule" className="ev-chap">
        <ChapterHead n="03" eye="Chapter 03" h2="Daily timings" desc="Strict adherence is mandatory. Late arrivals require approval from your project mentor." />
        <div className="ev-tabs">
          <button className={`ev-tab ${scheduleTab === "day1" ? "active" : ""}`} onClick={() => setScheduleTab("day1")}>Day 1 · Wed</button>
          <button className={`ev-tab ${scheduleTab === "day2to6" ? "active" : ""}`} onClick={() => setScheduleTab("day2to6")}>Day 2 – 6</button>
          <button className={`ev-tab ${scheduleTab === "day7" ? "active" : ""}`} onClick={() => setScheduleTab("day7")}>Day 7 · Tue</button>
        </div>
        <div className="ev-time-list">
          {TIMINGS[scheduleTab].map(([label, time], i) => (
            <div key={i} className="ev-time-row">
              <span className="ev-time-lab">{label}</span>
              <span className="ev-time-val">{time}</span>
            </div>
          ))}
        </div>
        {scheduleTab === "day7" && (
          <div className="ev-warn amber">
            <span className="ev-warn-icn"><Icon name="alert" /></span>
            <div className="ev-warn-body">
              <strong>Check-out (13 May 2026):</strong> Buses to Rajahmundry &amp; Kakinada by 9:00 AM.
            </div>
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════════
          CHAPTER 04 — DRESS CODE
          ═════════════════════════════════════════════ */}
      <section id="ev-dress" className="ev-chap">
        <ChapterHead n="04" eye="Chapter 04" h2="Day-by-day attire" desc="Dress code with shoes & ID card must be followed from 9:30 AM until dinner. Clean-shaven appearance is mandatory." />
        <div className="ev-dress">
          {DRESS_CODE.map((d) => (
            <div key={d.day} className="ev-dress-cell">
              <div className="ev-dress-head">
                <span className="ev-dress-day">D{d.day}</span>
                <span className="ev-dress-week">{d.week}</span>
              </div>
              <div className="ev-dress-attire">{d.attire}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CHAPTER 05 — RULES
          ═════════════════════════════════════════════ */}
      <section id="ev-rules" className="ev-chap">
        <ChapterHead n="05" eye="Chapter 05" h2="Code of conduct" desc="Premises are under CCTV surveillance. Failure to comply may result in restricted access or termination." />

        <div className="ev-rules">
          <div className="ev-rule-block">
            <div className="ev-rule-head">
              <span className="ev-rule-head-icn"><Icon name="shield" /></span>
              <span className="ev-rule-head-title">Conduct &amp; Movement</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>On-site:</strong> No shouting on the floor or in the building.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>In transit:</strong> Quiet during commute to hostel/meals.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>At hostel:</strong> Especially during night hours.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Littering:</strong> Strictly prohibited.</span></li>
            </ul>
          </div>
          <div className="ev-rule-block">
            <div className="ev-rule-head">
              <span className="ev-rule-head-icn amber"><Icon name="shirt" /></span>
              <span className="ev-rule-head-title">Grooming &amp; Attendance</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Hair:</strong> Neatly trimmed, well-groomed.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Shaving:</strong> Clean-shaven at all times.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>ID card and shoes</strong> mandatory with prescribed dress.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>100% attendance</strong> across all 7 days required.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Late permissions:</strong> Mentor approval required.</span></li>
            </ul>
          </div>
          <div className="ev-rule-block">
            <div className="ev-rule-head">
              <span className="ev-rule-head-icn green"><Icon name="check" /></span>
              <span className="ev-rule-head-title">Internet — Do's</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet green" /><span><strong>Project work:</strong> Use internet for project &amp; research only.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet green" /><span><strong>Knowledge expansion:</strong> Resources to improve technical skills.</span></li>
            </ul>
          </div>
          <div className="ev-rule-block">
            <div className="ev-rule-head">
              <span className="ev-rule-head-icn"><Icon name="alert" /></span>
              <span className="ev-rule-head-title">Internet — Don'ts</span>
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

        <div className="ev-female">
          <div className="ev-female-head">
            <span className="ev-rule-head-icn amber"><Icon name="women" /></span>
            <span className="ev-rule-head-title">Female Trainee Guidelines</span>
          </div>
          <div className="ev-female-body">
            <div className="ev-female-col">
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Night escort:</strong> Security personnel escort to hostel after night sessions.</span></li>
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Priority dispersal:</strong> Female trainees leave first.</span></li>
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Final attendance</strong> must be given before dispersal.</span></li>
              </ul>
            </div>
            <div className="ev-female-col">
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Female staff presence</strong> until all girls leave.</span></li>
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Zero tolerance</strong> for harassment or misconduct.</span></li>
                <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Immediate reporting:</strong> Confidentiality guaranteed.</span></li>
              </ul>
            </div>
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

      {/* ═════════════════════════════════════════════
          CHAPTER 06 — PPT
          ═════════════════════════════════════════════ */}
      <section id="ev-ppt" className="ev-chap">
        <ChapterHead n="06" eye="Chapter 06" h2="Presentation guide" desc="AI tools encouraged. Final deck must follow the 5-slide rule and formatting standards below." />

        <div className="ev-ppt-grid">
          <div className="ev-ppt-cell">
            <div className="ev-ppt-head">
              <span className="ev-ppt-num">01</span>
              <span className="ev-ppt-title">Colour Palette</span>
            </div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#FAF4DF" }} /><div className="ev-color-name">Background</div><div className="ev-color-hex">#FAF4DF</div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#E3562B" }} /><div className="ev-color-name">Primary · Highlights</div><div className="ev-color-hex">#E3562B</div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#1D3639" }} /><div className="ev-color-name">Secondary · Titles</div><div className="ev-color-hex">#1D3639</div></div>
            <div className="ev-color-row"><div className="ev-color-swatch" style={{ background: "#7F7F7F" }} /><div className="ev-color-name">Neutral · Subtext</div><div className="ev-color-hex">#7F7F7F</div></div>
          </div>
          <div className="ev-ppt-cell">
            <div className="ev-ppt-head">
              <span className="ev-ppt-num">02</span>
              <span className="ev-ppt-title">Typography — Poppins</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
            </ul>
          </div>
          <div className="ev-ppt-cell">
            <div className="ev-ppt-head">
              <span className="ev-ppt-num">03</span>
              <span className="ev-ppt-title">Slide Layout</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Title at top, content below.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Left text + right image when needed.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Clean spacing; simple icons.</span></li>
            </ul>
          </div>
          <div className="ev-ppt-cell">
            <div className="ev-ppt-head">
              <span className="ev-ppt-num">04</span>
              <span className="ev-ppt-title">Content Rules</span>
            </div>
            <ul className="ev-rule-list">
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Short, punchy sentences.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Bullets over paragraphs.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Animations: Fade or Appear only.</span></li>
              <li className="ev-rule-li"><span className="ev-bullet" /><span>Same font, colors, layout across slides.</span></li>
            </ul>
          </div>
        </div>

        <div className="ev-floors-head" style={{ marginTop: 32 }}>
          <span className="ev-floors-head-title">Slide structure · maximum 5 slides</span>
          <span className="ev-floors-head-meta">Cover · Body · Closing</span>
        </div>
        <div className="ev-slide-flow">
          <div className="ev-slide">
            <div className="ev-slide-num">Slide 01</div>
            <div className="ev-slide-name">Cover</div>
            <div className="ev-slide-li">Project Title</div>
            <div className="ev-slide-li">Team Name</div>
            <div className="ev-slide-li">Team Members</div>
          </div>
          <div className="ev-slide">
            <div className="ev-slide-num">Slides 02 – 04</div>
            <div className="ev-slide-name">Project Body</div>
            <div className="ev-slide-li">Problem Statement</div>
            <div className="ev-slide-li">Solution Overview</div>
            <div className="ev-slide-li">Features</div>
            <div className="ev-slide-li">Demo Screenshots / Workflow</div>
            <div className="ev-slide-li">Technology Stack</div>
          </div>
          <div className="ev-slide">
            <div className="ev-slide-num">Slide 05</div>
            <div className="ev-slide-name">Closing</div>
            <div className="ev-slide-li">Team Introduction</div>
            <div className="ev-slide-li">Learnings</div>
            <div className="ev-slide-li">Thank You Note</div>
          </div>
        </div>
        <div className="ev-warn amber">
          <span className="ev-warn-icn"><Icon name="alert" /></span>
          <div className="ev-warn-body">
            <strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template
            from the login portal — approved colors, fonts, icons and ready-made layouts.
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════
          CHAPTER 07 — CONTACTS
          ═════════════════════════════════════════════ */}
      <section id="ev-contacts" className="ev-chap">
        <ChapterHead n="07" eye="Chapter 07" h2="Help &amp; emergency" desc="Save these numbers. Battery-operated campus vehicles available for non-critical injuries to Apollo medical centre." />

        <div className="ev-contact-block">
          <div className="ev-contact-head">
            <span className="ev-contact-head-icn"><Icon name="alert" /></span>
            Emergency &amp; Security
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
          <div className="ev-contact-block" style={{ marginBottom: 0 }}>
            <div className="ev-contact-head">
              <span className="ev-contact-head-icn" style={{ color: "var(--amber)" }}><Icon name="shield" /></span>
              Hostel Queries
            </div>
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
          <div className="ev-contact-block" style={{ marginBottom: 0 }}>
            <div className="ev-contact-head">
              <span className="ev-contact-head-icn" style={{ color: "var(--violet)" }}><Icon name="women" /></span>
              Female Coordinators
            </div>
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

        <div className="ev-warn">
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
/*                       SUB-COMPONENTS                                    */
/* ====================================================================== */
function ChapterHead({ n, eye, h2, desc }) {
  return (
    <header className="ev-chap-head">
      <div className="ev-chap-num">{n}</div>
      <div className="ev-chap-title-wrap">
        <div className="ev-chap-eye">{eye}</div>
        <h2 className="ev-chap-h2" dangerouslySetInnerHTML={{ __html: h2 }} />
        <p className="ev-chap-desc">{desc}</p>
      </div>
    </header>
  );
}

/* HALL VIEW — renders SVG floor plan with chair silhouettes */
function HallView({ hall, myN }) {
  const isMine = myN && myN >= hall.teamRange[0] && myN <= hall.teamRange[1];

  // Compute SVG dimensions. Each cell ~52×56 with padding for entrances.
  const CELL_W = 50;
  const CELL_H = 54;
  const PAD = 32; // outer padding for walls & entrance arrows
  const innerW = hall.cols * CELL_W;
  const innerH = hall.rows * CELL_H;
  const svgW = innerW + PAD * 2;
  const svgH = innerH + PAD * 2 + 18; // extra at bottom for entrance arrows

  return (
    <div className={`ev-hall ${isMine ? "mine" : ""}`}>
      <div className="ev-hall-head">
        <div className="ev-hall-name">
          <div>
            <div className="ev-hall-eye">Hall</div>
            <div className="ev-hall-label" style={{ color: hall.accent }}>{hall.label}</div>
          </div>
          <div className="ev-hall-range">
            Teams {String(hall.teamRange[0]).padStart(3, "0")} – {String(hall.teamRange[1]).padStart(3, "0")}
          </div>
        </div>
        {isMine && <span className="ev-hall-mine-flag">Your hall</span>}
      </div>

      <div className="ev-hall-floor">
        <svg
          width="100%"
          height="auto"
          viewBox={`0 0 ${svgW} ${svgH}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", maxWidth: "100%" }}
          aria-label={`${hall.name} seating layout`}
        >
          {/* outer wall */}
          <rect
            x={PAD - 14}
            y={PAD - 14}
            width={innerW + 28}
            height={innerH + 28}
            fill="none"
            stroke="rgba(255,255,255,.14)"
            strokeWidth="1"
            rx="6"
          />
          {/* cardinal markers (front of room) */}
          <text
            x={PAD + innerW / 2}
            y={PAD - 18}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            letterSpacing="2"
            fill="rgba(255,255,255,.3)"
          >
            FRONT
          </text>

          {/* chairs */}
          {hall.seats.map((row, rIdx) =>
            row.map((teamN, cIdx) => {
              if (teamN === null) return null;
              const cx = PAD + cIdx * CELL_W + CELL_W / 2;
              const cy = PAD + rIdx * CELL_H + CELL_H / 2;
              const isYou = myN === teamN;
              return (
                <ChairSVG
                  key={`${rIdx}-${cIdx}`}
                  cx={cx}
                  cy={cy}
                  team={teamN}
                  isYou={isYou}
                  hallAccent={hall.accent}
                />
              );
            })
          )}

          {/* entrances */}
          {hall.entrances.map((ent, i) => {
            if (ent.side === "left") {
              return (
                <EntranceMarker
                  key={i}
                  x={PAD - 22}
                  y={PAD + innerH - 20}
                  rotate={0}
                  side="left"
                />
              );
            }
            if (ent.side === "bottom") {
              const x = PAD + ent.col * CELL_W + CELL_W / 2;
              const y = PAD + innerH + 4;
              return <EntranceMarker key={i} x={x} y={y} rotate={90} side="bottom" />;
            }
            return null;
          })}
        </svg>
      </div>

      <div className="ev-hall-foot">
        <div className="ev-hall-legend">
          <span className="ev-hall-legend-item">
            <ChairLegendIcon className="ev-hall-legend-chair" /> Chair
          </span>
          {isMine && (
            <span className="ev-hall-legend-item">
              <ChairLegendIcon className="ev-hall-legend-chair mine" mine /> Your seat
            </span>
          )}
        </div>
        <span>
          {hall.entrances.length} {hall.entrances.length === 1 ? "Entrance" : "Entrances"}
          {" · "}
          {hall.cols}×{hall.rows} layout
        </span>
      </div>
    </div>
  );
}

/* CHAIR SVG — proper chair silhouette: backrest + cushion + legs */
function ChairSVG({ cx, cy, team, isYou, hallAccent }) {
  const W = 36, H = 40;
  const x = cx - W / 2;
  const y = cy - H / 2;
  const fill = isYou ? "#fd1c00" : "rgba(255,255,255,.06)";
  const stroke = isYou ? "#fd1c00" : "rgba(255,255,255,.18)";
  const labelColor = isYou ? "#fff" : "rgba(255,255,255,.62)";

  return (
    <g>
      {/* glow halo for "you" */}
      {isYou && (
        <circle
          cx={cx}
          cy={cy}
          r={26}
          fill="rgba(253,28,0,.18)"
        >
          <animate
            attributeName="r"
            values="22;28;22"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values=".4;.15;.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      {/* backrest (top) */}
      <rect
        x={x + 4}
        y={y}
        width={W - 8}
        height={11}
        rx={2.5}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* seat cushion */}
      <rect
        x={x}
        y={y + 13}
        width={W}
        height={20}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* legs */}
      <line x1={x + 3} y1={y + 33} x2={x + 3} y2={y + 38} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <line x1={x + W - 3} y1={y + 33} x2={x + W - 3} y2={y + 38} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      {/* team number */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight={isYou ? "800" : "700"}
        fill={labelColor}
        fontFamily="'DM Sans', system-ui, sans-serif"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {String(team).padStart(2, "0")}
      </text>
    </g>
  );
}

/* Entrance marker — door arch + inward arrow */
function EntranceMarker({ x, y, rotate, side }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* arch (door opening) */}
      <rect
        x={-12}
        y={-6}
        width={24}
        height={12}
        rx={6}
        fill="none"
        stroke="#EEA727"
        strokeWidth="1.4"
        strokeDasharray="3 2"
      />
      {/* arrow pointing inward */}
      <path
        d={
          side === "left"
            ? "M -8 0 L 4 0 M 0 -3 L 4 0 L 0 3"
            : "M 0 -10 L 0 4 M -3 0 L 0 4 L 3 0"
        }
        stroke="#EEA727"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={0}
        y={side === "bottom" ? 14 : -10}
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        letterSpacing="1.5"
        fill="#EEA727"
      >
        ENTRANCE
      </text>
    </g>
  );
}

/* small chair icon for legend */
function ChairLegendIcon({ className, mine }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <rect x="3" y="1" width="8" height="3.5" rx="1" stroke="currentColor" strokeWidth="1" fill={mine ? "currentColor" : "none"} />
      <rect x="2" y="5.5" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill={mine ? "currentColor" : "none"} />
      <line x1="3" y1="11.5" x2="3" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="11" y1="11.5" x2="11" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
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
          <div className="ev-search-result-head">
            <span className="ev-search-result-team">{result.team}</span>
            <span className="ev-search-result-eye">Located</span>
          </div>
          <div className="ev-search-result-grid">
            <div className="ev-search-result-cell">
              <div className="ev-label">Hall</div>
              <div className="ev-myspot-cell-val" style={{ color: result.hall.accent }}>{result.hall.name}</div>
            </div>
            <div className="ev-search-result-cell">
              <div className="ev-label">Floor</div>
              <div className="ev-myspot-cell-val">Floor {result.venue.floor}</div>
            </div>
            <div className="ev-search-result-cell">
              <div className="ev-label">Desk</div>
              <div className="ev-myspot-cell-val">Desk {result.venue.desk}</div>
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
        <div className="ev-search-hint">
          All <strong>160 teams</strong> mapped across <strong>5 floors</strong> &amp; <strong>4 halls</strong>.
          Welcome kit pickup on <strong>Day 1, 9:00 – 10:00 AM</strong>.
        </div>
      )}
    </>
  );
}

/* SVG icon (line-only, stroke="currentColor") */
function Icon({ name }) {
  const props = {
    width: 14, height: 14, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "search":   return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "shield":   return <svg {...props}><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z" /></svg>;
    case "shirt":    return <svg {...props}><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z" /></svg>;
    case "check":    return <svg {...props} strokeWidth="2"><path d="m5 12 4 4L19 7" /></svg>;
    case "alert":    return <svg {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
    case "women":    return <svg {...props}><circle cx="12" cy="6" r="3" /><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9" /></svg>;
    default: return null;
  }
}