"use client";
import { useState, useMemo, useCallback } from "react";

/* ============================================================
   EVENT INFO — v5 · Personal Pass
   Path: app/dashboard/components/EventInfo.js

   Design: Premium minimal "Apple Wallet" card + accordions.
   - Single hero card showing my Hall · Floor · Desk · Seat.
   - Everything else collapses into accordions; only one open at a time.
   - Search-any-team is a small utility, last accordion.
   - DM Sans throughout (no Astro masthead).
   - Color discipline: red ONLY for "you" + active states.
   ============================================================ */

const HALLS = [
  {
    id: "h41", label: "4.1", name: "Hall 4.1", accent: "#3b82f6",
    teamRange: [1, 44], cols: 12, rows: 4,
    seats: [
      [4, 8, 12, 16, 20, 24, 28, 32, 36, null, 40, 44],
      [3, 7, 11, 15, 19, 23, 27, 31, 35, null, 39, 43],
      [2, 6, 10, 14, 18, 22, 26, 30, 34, null, 38, 42],
      [1, 5, 9, 13, 17, 21, 25, 29, 33, null, 37, 41],
    ],
    entrances: [{ side: "left" }, { side: "bottom", col: 9 }],
  },
  {
    id: "h42", label: "4.2", name: "Hall 4.2", accent: "#22d3ee",
    teamRange: [45, 80], cols: 10, rows: 4,
    seats: [
      [80, 76, 72, 68, 64, 60, 57, 53, 49, 45],
      [77, 73, 69, 65, 61, 58, 54, 50, 46, null],
      [78, 74, 70, 66, 62, 59, 55, 51, 47, null],
      [79, 75, 71, 67, 63, null, 56, 52, 48, null],
    ],
    entrances: [{ side: "bottom", col: 5 }],
  },
  {
    id: "h21", label: "2.1", name: "Hall 2.1", accent: "#a16207",
    teamRange: [81, 124], cols: 12, rows: 4,
    seats: [
      [84, 88, 92, 96, 100, 104, 108, 112, 116, null, 120, 124],
      [83, 87, 91, 95, 99, 103, 107, 111, 115, null, 119, 123],
      [82, 86, 90, 94, 98, 102, 106, 110, 114, null, 118, 122],
      [81, 85, 89, 93, 97, 101, 105, 109, 113, null, 117, 121],
    ],
    entrances: [{ side: "left" }, { side: "bottom", col: 9 }],
  },
  {
    id: "h22", label: "2.2", name: "Hall 2.2", accent: "#10b981",
    teamRange: [125, 160], cols: 10, rows: 4,
    seats: [
      [160, 156, 152, 148, 144, 140, 137, 133, 129, 125],
      [null, 157, 153, 149, 145, 141, 138, 134, 130, 126],
      [null, 158, 154, 150, 146, 142, 139, 135, 131, 127],
      [null, 159, 155, 151, 147, 143, null, 136, 132, 128],
    ],
    entrances: [{ side: "bottom", col: 5 }],
  },
];

function teamNumberToInt(t) {
  if (!t || !t.startsWith("PS-")) return null;
  const n = parseInt(t.replace("PS-", ""), 10);
  return isNaN(n) || n < 1 || n > 160 ? null : n;
}
function getVenue(t) {
  const n = teamNumberToInt(t);
  if (!n) return null;
  const floor = Math.ceil(n / 32);
  const idx = ((n - 1) % 32) + 1;
  const desk = Math.ceil(idx / 8);
  const start = (floor - 1) * 32 + (desk - 1) * 8 + 1;
  return { floor, desk, range: `PS-${String(start).padStart(3, "0")} – PS-${String(start + 7).padStart(3, "0")}` };
}
function getHall(t) {
  const n = teamNumberToInt(t);
  if (!n) return null;
  return HALLS.find((h) => n >= h.teamRange[0] && n <= h.teamRange[1]);
}

const DRESS_CODE = [
  { day: 1, week: "Wed", attire: "Drive Ready / SkillUp T-Shirt" },
  { day: 2, week: "Thu", attire: "Project Space T-Shirt" },
  { day: 3, week: "Fri", attire: "Civil Formal Wear" },
  { day: 4, week: "Sat", attire: "Project Space T-Shirt" },
  { day: 5, week: "Sun", attire: "White Code Dress" },
  { day: 6, week: "Mon", attire: "Drive Ready / SkillUp T-Shirt" },
  { day: 7, week: "Tue", attire: "Project Space T-Shirt" },
];

const TIMINGS = {
  day1: [
    ["Hostel Check-in", "By 9:00 AM"],
    ["Welcome Kit", "9:00 – 10:00 AM"],
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

export default function EventInfo({ user }) {
  const [openId, setOpenId] = useState(null);
  const [scheduleTab, setScheduleTab] = useState("day1");
  const [search, setSearch] = useState("");

  const teamNumber = user?.teamNumber || user?.team_number;
  const myN = teamNumberToInt(teamNumber);
  const myVenue = getVenue(teamNumber);
  const myHall = getHall(teamNumber);

  const toggle = useCallback((id) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  return (
    <div className="ev">
      <style jsx>{`
        .ev {
          --base: #050008;
          --ink: #ffffff;
          --ink-2: rgba(255,255,255,.62);
          --ink-3: rgba(255,255,255,.42);
          --ink-4: rgba(255,255,255,.22);
          --rule: rgba(255,255,255,.06);
          --rule-2: rgba(255,255,255,.10);
          --rule-3: rgba(255,255,255,.16);
          --you: #fd1c00;
          --you-soft: rgba(253,28,0,.10);
          --amber: #EEA727;
          --surface: rgba(255,255,255,.025);
          --surface-2: rgba(255,255,255,.045);
          font-family: 'DM Sans', system-ui, sans-serif;
          color: var(--ink);
          letter-spacing: -0.005em;
          animation: evIn .5s cubic-bezier(.2,.7,.2,1) both;
          padding-bottom: 24px;
        }
        @keyframes evIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes evCardIn {
          0% { opacity: 0; transform: translateY(20px) scale(.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes evShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes evPulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        @keyframes evDrop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

        /* TITLE */
        .ev-head {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 16px; padding: 8px 0 24px;
          border-bottom: 1px solid var(--rule); margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .ev-head-title { display: flex; align-items: baseline; gap: 12px; }
        .ev-head-title h1 {
          font-size: 1.25rem; font-weight: 700; letter-spacing: -.015em;
          color: var(--ink); margin: 0;
        }
        .ev-head-title-tag {
          font-size: .54rem; letter-spacing: .22em;
          text-transform: uppercase; font-weight: 700;
          color: var(--amber);
          padding: 3px 8px;
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 100px;
        }
        .ev-head-meta { font-size: .68rem; color: var(--ink-3); letter-spacing: .04em; font-variant-numeric: tabular-nums; }
        .ev-head-meta strong { color: var(--ink-2); font-weight: 600; }

        /* BOARDING PASS */
        .ev-pass {
          position: relative;
          background:
            radial-gradient(ellipse 600px 200px at 30% 0%, rgba(253,28,0,.08), transparent 70%),
            linear-gradient(160deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.015) 100%);
          border: 1px solid var(--rule-2);
          border-radius: 16px;
          overflow: hidden;
          animation: evCardIn .65s cubic-bezier(.2,.7,.2,1) both;
        }
        .ev-pass::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(253,28,0,.6), transparent);
          background-size: 200% 100%;
          animation: evShimmer 4s ease-in-out infinite;
          z-index: 1;
        }
        .ev-pass-grid {
          display: grid;
          grid-template-columns: minmax(200px, 1.1fr) 1.4fr;
          gap: 0; position: relative;
        }
        @media (max-width: 720px) { .ev-pass-grid { grid-template-columns: 1fr; } }

        .ev-pass-id {
          padding: 32px 32px 28px;
          border-right: 1px dashed var(--rule-3);
          position: relative;
        }
        @media (max-width: 720px) {
          .ev-pass-id { border-right: none; border-bottom: 1px dashed var(--rule-3); padding: 24px 22px; }
        }
        /* perforated dots */
        .ev-pass-id::after {
          content: "";
          position: absolute; right: -7px; top: 50%;
          transform: translateY(-50%);
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--base);
          box-shadow: 0 0 0 1px var(--rule-3) inset;
        }
        @media (max-width: 720px) { .ev-pass-id::after { display: none; } }

        .ev-pass-eye {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: .54rem;
          letter-spacing: .22em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--you);
          margin-bottom: 18px;
        }
        .ev-pass-eye-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--you);
          box-shadow: 0 0 8px var(--you);
          animation: evPulse 2s ease-in-out infinite;
        }
        .ev-pass-team {
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -.02em;
          line-height: 1;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }
        .ev-pass-name {
          margin-top: 10px;
          font-size: .82rem;
          color: var(--ink-2);
          line-height: 1.4;
          font-weight: 500;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ev-pass-meta {
          display: flex; gap: 14px;
          margin-top: 24px; padding-top: 18px;
          border-top: 1px solid var(--rule);
        }
        .ev-pass-meta-item { flex: 1; }
        .ev-pass-meta-lab {
          font-size: .5rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3); margin-bottom: 5px;
        }
        .ev-pass-meta-val {
          font-size: .76rem; color: var(--ink); font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .ev-pass-meta-val.amber { color: var(--amber); }

        .ev-pass-stub { display: flex; flex-direction: column; }
        .ev-pass-row {
          display: grid;
          grid-template-columns: 90px 1fr auto;
          gap: 18px; align-items: center;
          padding: 16px 32px;
          border-bottom: 1px solid var(--rule);
          transition: background .18s;
        }
        .ev-pass-row:last-child { border-bottom: none; }
        .ev-pass-row:hover { background: var(--surface); }
        @media (max-width: 720px) { .ev-pass-row { padding: 14px 22px; grid-template-columns: 80px 1fr auto; gap: 12px; } }

        .ev-pass-row-lab {
          font-size: .54rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
        }
        .ev-pass-row-val {
          font-size: .92rem; font-weight: 700;
          color: var(--ink); letter-spacing: -.005em;
        }
        .ev-pass-row-val.hall { color: var(--hall-accent, var(--ink)); }
        .ev-pass-row-sub {
          font-size: .65rem; color: var(--ink-3);
          font-variant-numeric: tabular-nums; letter-spacing: .02em;
        }
        .ev-pass-seat {
          padding: 18px 32px 22px;
          background: linear-gradient(135deg, rgba(253,28,0,.06), transparent 60%);
        }
        @media (max-width: 720px) { .ev-pass-seat { padding: 16px 22px 18px; } }
        .ev-pass-seat-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.6rem; font-weight: 800;
          color: var(--you);
          font-variant-numeric: tabular-nums;
          letter-spacing: -.02em; line-height: 1;
        }
        .ev-pass.empty { padding: 36px 32px; background: var(--surface); }

        /* ACCORDION */
        .ev-acc-list { margin-top: 16px; border-top: 1px solid var(--rule); }
        .ev-acc {
          border-bottom: 1px solid var(--rule);
          transition: background .25s ease;
        }
        .ev-acc.open { background: var(--surface); }
        .ev-acc-trig {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          padding: 18px 4px;
          background: transparent; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink); text-align: left;
          transition: padding .25s ease;
        }
        .ev-acc.open .ev-acc-trig { padding: 18px 16px; }
        .ev-acc-lead {
          display: flex; align-items: center; gap: 14px;
          flex: 1; min-width: 0;
        }
        .ev-acc-num {
          font-size: .58rem; font-weight: 700;
          color: var(--ink-3); letter-spacing: .12em;
          font-variant-numeric: tabular-nums;
          width: 22px; flex-shrink: 0;
        }
        .ev-acc.open .ev-acc-num { color: var(--amber); }
        .ev-acc-icn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-2);
          border: 1px solid var(--rule-2);
          border-radius: 8px;
          color: var(--ink-2);
          flex-shrink: 0;
          transition: all .2s;
        }
        .ev-acc.open .ev-acc-icn {
          background: var(--you-soft);
          border-color: rgba(253,28,0,.28);
          color: var(--you);
        }
        .ev-acc-text { min-width: 0; }
        .ev-acc-title {
          font-size: .92rem; font-weight: 600;
          letter-spacing: -.01em; color: var(--ink);
          margin-bottom: 2px;
        }
        .ev-acc-sub {
          font-size: .68rem; color: var(--ink-3);
          font-weight: 500; line-height: 1.3;
        }
        .ev-acc-chev {
          color: var(--ink-3);
          transition: transform .25s cubic-bezier(.2,.7,.2,1), color .2s;
          flex-shrink: 0;
        }
        .ev-acc.open .ev-acc-chev { transform: rotate(180deg); color: var(--you); }
        .ev-acc-body { padding: 0 16px 22px; animation: evDrop .3s ease both; }

        /* HALL CARD */
        .ev-hall-card {
          margin-top: 6px;
          border: 1px solid var(--rule-2);
          border-radius: 12px;
          overflow: hidden;
          background: var(--surface);
        }
        .ev-hall-card-head {
          display: flex; align-items: baseline; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--rule);
          gap: 12px;
        }
        .ev-hall-card-name { display: flex; align-items: baseline; gap: 10px; }
        .ev-hall-card-eye {
          font-size: .55rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3);
        }
        .ev-hall-card-label {
          font-size: 1.05rem; font-weight: 700;
          letter-spacing: -.01em;
        }
        .ev-hall-card-range {
          font-size: .68rem; color: var(--ink-3);
          font-variant-numeric: tabular-nums;
        }
        .ev-hall-card-floor {
          padding: 22px 16px 26px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,.02), transparent 70%);
          overflow-x: auto;
        }
        .ev-hall-stage {
          display: flex; align-items: stretch;
          gap: 8px; justify-content: center;
          width: fit-content;
          margin: 0 auto;
          min-width: 100%;
        }
        .ev-hall-grid {
          display: grid;
          gap: 6px;
          padding: 6px;
        }
        @media (max-width: 600px) {
          .ev-hall-grid { gap: 4px; padding: 4px; }
          .ev-hall-card-floor { padding: 16px 8px 20px; }
        }

        /* CHAIR — pure CSS, scales reliably */
        .ev-chair {
          width: 36px; height: 38px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9.5px;
          font-weight: 700;
          color: var(--ink-3);
          font-variant-numeric: tabular-nums;
          background: rgba(255,255,255,.04);
          border: 1px solid var(--rule-2);
          border-radius: 4px 4px 6px 6px;
          transition: all .2s;
          padding-top: 3px;
        }
        @media (max-width: 600px) {
          .ev-chair { width: 26px; height: 28px; font-size: 7.5px; }
        }
        .ev-chair::before {
          content: "";
          position: absolute;
          top: -3px; left: 5px; right: 5px;
          height: 4px;
          background: rgba(255,255,255,.04);
          border: 1px solid var(--rule-2);
          border-bottom: none;
          border-radius: 2px 2px 0 0;
        }
        .ev-chair::after {
          content: "";
          position: absolute;
          bottom: -3px; left: 4px; right: 4px;
          height: 3px;
          background:
            linear-gradient(to right, var(--rule-3) 1px, transparent 1px) left / 1px 100% no-repeat,
            linear-gradient(to right, var(--rule-3) 1px, transparent 1px) right / 1px 100% no-repeat;
        }
        .ev-chair.you {
          background: var(--you);
          border-color: var(--you);
          color: #fff;
          font-weight: 800;
          box-shadow:
            0 0 0 3px rgba(253,28,0,.18),
            0 4px 12px rgba(253,28,0,.4);
          animation: evPulse 2s ease-in-out infinite;
          z-index: 2;
        }
        .ev-chair.you::before {
          background: var(--you);
          border-color: var(--you);
        }
        .ev-chair.empty {
          background: transparent;
          border-color: transparent;
          visibility: hidden;
          pointer-events: none;
        }
        .ev-chair.empty::before, .ev-chair.empty::after { display: none; }

        .ev-aisle-label {
          font-size: 7.5px; font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--amber);
          padding: 3px 8px;
          background: rgba(238,167,39,.08);
          border: 1px dashed rgba(238,167,39,.4);
          border-radius: 100px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        @media (max-width: 600px) { .ev-aisle-label { font-size: 6px; padding: 2px 6px; } }

        .ev-aisle-vert {
          display: flex; align-items: center; justify-content: center;
          padding-right: 4px;
        }
        .ev-aisle-vert .ev-aisle-label {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
        .ev-aisle-bottom {
          margin-top: 12px;
          display: flex; justify-content: center;
        }

        .ev-hall-card-foot {
          padding: 10px 18px;
          border-top: 1px solid var(--rule);
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          font-size: .58rem; letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--ink-3); font-weight: 600;
        }
        .ev-legend-chair {
          display: inline-block;
          width: 12px; height: 13px;
          background: rgba(255,255,255,.04);
          border: 1px solid var(--rule-2);
          border-radius: 2px 2px 3px 3px;
          margin-right: 6px;
          vertical-align: -2px;
        }
        .ev-legend-chair.you { background: var(--you); border-color: var(--you); }

        /* SCHEDULE */
        .ev-tabs {
          display: flex; gap: 4px; padding: 4px;
          background: var(--surface-2);
          border: 1px solid var(--rule);
          border-radius: 10px;
          margin-bottom: 14px;
          width: fit-content;
        }
        .ev-tab {
          padding: 7px 14px;
          background: transparent; border: none;
          color: var(--ink-3);
          font-family: 'DM Sans', sans-serif;
          font-size: .72rem; font-weight: 600;
          border-radius: 7px; cursor: pointer;
          white-space: nowrap;
          transition: all .15s;
        }
        .ev-tab:hover { color: var(--ink); }
        .ev-tab.active {
          background: var(--you);
          color: #fff;
          box-shadow: 0 2px 8px rgba(253,28,0,.3);
        }
        .ev-time-list {
          border: 1px solid var(--rule-2);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(0,0,0,.15);
        }
        .ev-time-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          padding: 12px 18px;
          border-bottom: 1px solid var(--rule);
          align-items: baseline;
          transition: background .15s;
        }
        .ev-time-row:last-child { border-bottom: none; }
        .ev-time-row:hover { background: var(--surface); }
        .ev-time-lab { font-size: .8rem; color: var(--ink); font-weight: 500; }
        .ev-time-val {
          font-size: .72rem; color: var(--amber); font-weight: 700;
          font-variant-numeric: tabular-nums; letter-spacing: .03em; white-space: nowrap;
        }

        /* DRESS */
        .ev-dress {
          display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
        }
        @media (max-width: 900px) { .ev-dress { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 600px) { .ev-dress { grid-template-columns: repeat(2, 1fr); } }
        .ev-dress-cell {
          padding: 14px 12px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
          transition: all .2s;
        }
        .ev-dress-cell:hover {
          background: var(--surface-2);
          transform: translateY(-1px);
        }
        .ev-dress-d { font-size: .62rem; font-weight: 700; color: var(--you); letter-spacing: .08em; }
        .ev-dress-w {
          font-size: .55rem; color: var(--ink-3);
          letter-spacing: .15em; font-weight: 600;
          margin-bottom: 10px; text-transform: uppercase;
        }
        .ev-dress-attire { font-size: .72rem; color: var(--ink); line-height: 1.4; font-weight: 500; }

        /* RULES */
        .ev-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 720px) { .ev-rules { grid-template-columns: 1fr; } }
        .ev-rule-block {
          padding: 16px 18px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
        }
        .ev-rule-head {
          display: flex; align-items: center; gap: 9px;
          padding-bottom: 10px; margin-bottom: 12px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-rule-icn-w {
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          flex-shrink: 0;
          background: var(--you-soft);
          color: var(--you);
        }
        .ev-rule-icn-w.green { background: rgba(16,185,129,.1); color: #10b981; }
        .ev-rule-icn-w.amber { background: rgba(238,167,39,.1); color: var(--amber); }
        .ev-rule-title { font-size: .8rem; font-weight: 700; color: var(--ink); }
        .ev-rule-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .ev-rule-li { display: flex; gap: 10px; font-size: .74rem; line-height: 1.55; color: var(--ink-2); }
        .ev-rule-li strong { color: var(--ink); font-weight: 600; }
        .ev-rule-bullet {
          width: 4px; height: 4px;
          background: var(--amber);
          margin-top: 8px; flex-shrink: 0;
          border-radius: 50%;
        }
        .ev-rule-bullet.green { background: #10b981; }
        .ev-rule-bullet.red { background: var(--you); }
        .ev-rule-female-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 600px) { .ev-rule-female-grid { grid-template-columns: 1fr; gap: 8px; } }

        .ev-warn {
          margin-top: 14px;
          padding: 12px 16px;
          background: var(--you-soft);
          border-left: 3px solid var(--you);
          border-radius: 0 8px 8px 0;
          display: flex; gap: 12px; align-items: flex-start;
          font-size: .74rem; line-height: 1.5; color: var(--ink-2);
        }
        .ev-warn strong { color: var(--ink); font-weight: 600; }
        .ev-warn.amber {
          background: rgba(238,167,39,.06);
          border-left-color: var(--amber);
        }
        .ev-warn-icn { color: var(--you); flex-shrink: 0; margin-top: 2px; }
        .ev-warn.amber .ev-warn-icn { color: var(--amber); }

        /* PPT */
        .ev-ppt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 720px) { .ev-ppt-grid { grid-template-columns: 1fr; } }
        .ev-ppt-block {
          padding: 16px 18px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
        }
        .ev-ppt-block-head {
          font-size: .78rem; font-weight: 700;
          margin-bottom: 12px; padding-bottom: 8px;
          border-bottom: 1px solid var(--rule);
          color: var(--ink);
        }
        .ev-ppt-block-num {
          color: var(--amber); margin-right: 8px;
          font-weight: 800; font-variant-numeric: tabular-nums;
        }
        .ev-color-row {
          display: grid;
          grid-template-columns: 24px 1fr auto;
          gap: 12px; align-items: center;
          padding: 5px 0; font-size: .72rem;
        }
        .ev-color-sw {
          width: 24px; height: 24px;
          border-radius: 5px;
          border: 1px solid var(--rule-2);
        }
        .ev-color-name { color: var(--ink); font-weight: 500; }
        .ev-color-hex { color: var(--ink-3); font-family: ui-monospace, monospace; font-size: .64rem; }
        .ev-slide-flow {
          display: grid; grid-template-columns: 1fr 2fr 1fr;
          gap: 8px; margin-top: 12px;
        }
        @media (max-width: 720px) { .ev-slide-flow { grid-template-columns: 1fr; } }
        .ev-slide {
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
        }
        .ev-slide-num {
          font-size: .52rem; letter-spacing: .2em;
          text-transform: uppercase; color: var(--amber);
          font-weight: 700; margin-bottom: 6px;
        }
        .ev-slide-name {
          font-size: .8rem; font-weight: 700; color: var(--ink);
          margin-bottom: 10px; padding-bottom: 6px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-slide-li {
          font-size: .7rem; color: var(--ink-2);
          line-height: 1.5; padding: 2px 0;
          padding-left: 12px; position: relative;
        }
        .ev-slide-li::before {
          content: "—"; position: absolute; left: 0;
          color: var(--ink-3);
        }

        /* CONTACTS */
        .ev-contact-block {
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .ev-contact-head {
          padding: 12px 16px;
          border-bottom: 1px solid var(--rule);
          display: flex; align-items: center; gap: 10px;
          font-size: .56rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-2);
        }
        .ev-contact-head-icn { width: 14px; height: 14px; color: var(--you); }
        .ev-contact-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 14px; padding: 12px 16px;
          border-bottom: 1px solid var(--rule);
          align-items: center;
          transition: background .15s;
        }
        .ev-contact-row:last-child { border-bottom: none; }
        .ev-contact-row:hover { background: var(--surface); }
        .ev-contact-role {
          font-size: .5rem; letter-spacing: .18em;
          text-transform: uppercase; font-weight: 700;
          color: var(--ink-3); margin-bottom: 2px;
        }
        .ev-contact-name { font-size: .8rem; color: var(--ink); font-weight: 500; }
        .ev-contact-note { font-size: .65rem; color: var(--ink-3); margin-top: 2px; }
        .ev-contact-phone {
          font-family: ui-monospace, monospace;
          font-size: .76rem; color: var(--amber); font-weight: 700;
          padding: 7px 12px;
          background: rgba(238,167,39,.06);
          border: 1px solid rgba(238,167,39,.18);
          border-radius: 6px;
          white-space: nowrap;
          text-decoration: none;
          letter-spacing: .03em;
          transition: all .18s;
        }
        .ev-contact-phone:hover {
          background: rgba(238,167,39,.14);
          transform: scale(1.03);
        }

        /* SEARCH */
        .ev-search-wrap { position: relative; margin-bottom: 12px; }
        .ev-search-icn {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 14px; height: 14px;
          color: var(--ink-3); pointer-events: none;
        }
        .ev-search-in {
          width: 100%;
          padding: 12px 14px 12px 38px;
          background: var(--surface);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-size: .85rem; outline: none;
          transition: all .2s;
        }
        .ev-search-in:focus {
          border-color: rgba(238,167,39,.4);
          background: var(--surface-2);
        }
        .ev-search-in::placeholder { color: var(--ink-3); }
        .ev-search-result {
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid rgba(238,167,39,.18);
          border-radius: 10px;
          animation: evDrop .25s ease both;
        }
        .ev-search-result-head {
          display: flex; align-items: baseline; gap: 12px;
          margin-bottom: 12px; padding-bottom: 10px;
          border-bottom: 1px solid var(--rule);
        }
        .ev-search-result-team {
          font-size: 1rem; font-weight: 800;
          color: var(--ink); letter-spacing: -.01em;
          font-variant-numeric: tabular-nums;
        }
        .ev-search-result-tag {
          font-size: .52rem; letter-spacing: .2em;
          text-transform: uppercase; font-weight: 700;
          color: var(--amber);
          padding: 3px 8px;
          background: rgba(238,167,39,.08);
          border-radius: 100px;
        }
        .ev-search-result-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
        }
        @media (max-width: 500px) {
          .ev-search-result-grid { grid-template-columns: 1fr; gap: 8px; }
        }
        .ev-search-result-cell-lab {
          font-size: .5rem; letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--ink-3); font-weight: 700;
          margin-bottom: 4px;
        }
        .ev-search-result-cell-val {
          font-size: .82rem; font-weight: 700; color: var(--ink);
        }
        .ev-search-not-found {
          padding: 12px 14px;
          font-size: .76rem;
          color: var(--ink-2);
          background: var(--surface);
          border-left: 2px solid var(--you);
          border-radius: 0 6px 6px 0;
        }
        .ev-search-not-found strong { color: var(--ink); font-weight: 600; }

        @media (max-width: 600px) {
          .ev-pass-id { padding: 22px 20px; }
          .ev-pass-row { padding: 14px 20px; }
          .ev-pass-seat { padding: 16px 20px 18px; }
          .ev-pass-team { font-size: 1.6rem; }
          .ev-pass-meta { gap: 10px; }
          .ev-acc-trig { padding: 14px 4px; }
          .ev-acc.open .ev-acc-trig { padding: 14px 12px; }
          .ev-acc-body { padding: 0 12px 18px; }
          .ev-head-meta { font-size: .62rem; }
        }
      `}</style>

      <header className="ev-head">
        <div className="ev-head-title">
          <h1>Event Info</h1>
          <span className="ev-head-title-tag">Season 8</span>
        </div>
        <div className="ev-head-meta">
          <strong>May 6 – 12, 2026</strong> · 7 days · Aditya University
        </div>
      </header>

      {teamNumber && myVenue && myHall ? (
        <div className="ev-pass">
          <div className="ev-pass-grid">
            <div className="ev-pass-id">
              <div className="ev-pass-eye">
                <span className="ev-pass-eye-dot" />
                Your Pass
              </div>
              <div className="ev-pass-team">{teamNumber}</div>
              {user?.project_title && (
                <div className="ev-pass-name">{user.project_title}</div>
              )}
              <div className="ev-pass-meta">
                <div className="ev-pass-meta-item">
                  <div className="ev-pass-meta-lab">Welcome Kit</div>
                  <div className="ev-pass-meta-val amber">Day 1 · 9 – 10 AM</div>
                </div>
                <div className="ev-pass-meta-item">
                  <div className="ev-pass-meta-lab">Status</div>
                  <div className="ev-pass-meta-val">Confirmed</div>
                </div>
              </div>
            </div>

            <div className="ev-pass-stub">
              <div className="ev-pass-row">
                <div className="ev-pass-row-lab">Hall</div>
                <div className="ev-pass-row-val hall" style={{ "--hall-accent": myHall.accent }}>
                  {myHall.name}
                </div>
                <div className="ev-pass-row-sub">Seating</div>
              </div>
              <div className="ev-pass-row">
                <div className="ev-pass-row-lab">Floor</div>
                <div className="ev-pass-row-val">Floor {myVenue.floor}</div>
                <div className="ev-pass-row-sub">Welcome kit</div>
              </div>
              <div className="ev-pass-row">
                <div className="ev-pass-row-lab">Desk</div>
                <div className="ev-pass-row-val">Desk {myVenue.desk}</div>
                <div className="ev-pass-row-sub">{myVenue.range}</div>
              </div>
              <div className="ev-pass-row ev-pass-seat">
                <div className="ev-pass-row-lab">Seat</div>
                <div className="ev-pass-seat-num">#{String(myN).padStart(3, "0")}</div>
                <div className="ev-pass-row-sub">Fixed</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ev-pass empty">
          <div className="ev-pass-eye"><span className="ev-pass-eye-dot" /> Pass Pending</div>
          <p style={{ margin: "10px 0 0", fontSize: ".82rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
            Your team's seating and floor info will appear here once registration is complete.
          </p>
        </div>
      )}

      <div className="ev-acc-list">
        {myHall && (
          <Accordion
            id="hall"
            num="01"
            icon={<Icon name="seat" />}
            title="View hall layout"
            sub={`See your seat in ${myHall.name}`}
            open={openId === "hall"}
            onToggle={toggle}
          >
            <HallView hall={myHall} myN={myN} />
          </Accordion>
        )}

        <Accordion
          id="schedule"
          num={myHall ? "02" : "01"}
          icon={<Icon name="clock" />}
          title="Daily schedule"
          sub="Timings for all 7 days"
          open={openId === "schedule"}
          onToggle={toggle}
        >
          <div className="ev-tabs">
            <button className={`ev-tab ${scheduleTab === "day1" ? "active" : ""}`} onClick={() => setScheduleTab("day1")}>Day 1</button>
            <button className={`ev-tab ${scheduleTab === "day2to6" ? "active" : ""}`} onClick={() => setScheduleTab("day2to6")}>Day 2 – 6</button>
            <button className={`ev-tab ${scheduleTab === "day7" ? "active" : ""}`} onClick={() => setScheduleTab("day7")}>Day 7</button>
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
            <div className="ev-warn amber" style={{ marginTop: 12 }}>
              <span className="ev-warn-icn"><Icon name="alert" /></span>
              <div><strong>Check-out (13 May 2026):</strong> Buses to Rajahmundry & Kakinada by 9:00 AM.</div>
            </div>
          )}
        </Accordion>

        <Accordion
          id="dress"
          num={myHall ? "03" : "02"}
          icon={<Icon name="shirt" />}
          title="Dress code"
          sub="Day-by-day attire"
          open={openId === "dress"}
          onToggle={toggle}
        >
          <div className="ev-dress">
            {DRESS_CODE.map((d) => (
              <div key={d.day} className="ev-dress-cell">
                <div className="ev-dress-d">DAY {d.day}</div>
                <div className="ev-dress-w">{d.week}</div>
                <div className="ev-dress-attire">{d.attire}</div>
              </div>
            ))}
          </div>
          <div className="ev-warn amber" style={{ marginTop: 12 }}>
            <span className="ev-warn-icn"><Icon name="alert" /></span>
            <div>Dress code with shoes & ID card mandatory from 9:30 AM until dinner. Clean-shaven appearance required.</div>
          </div>
        </Accordion>

        <Accordion
          id="rules"
          num={myHall ? "04" : "03"}
          icon={<Icon name="shield" />}
          title="Code of conduct"
          sub="Guidelines & expectations"
          open={openId === "rules"}
          onToggle={toggle}
        >
          <div className="ev-rules">
            <div className="ev-rule-block">
              <div className="ev-rule-head">
                <span className="ev-rule-icn-w"><Icon name="shield" /></span>
                <span className="ev-rule-title">Conduct & Movement</span>
              </div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>On-site:</strong> No shouting on the floor or in the building.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>In transit:</strong> Quiet during commute to hostel/meals.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>At hostel:</strong> Especially during night hours.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Littering:</strong> Strictly prohibited.</span></li>
              </ul>
            </div>
            <div className="ev-rule-block">
              <div className="ev-rule-head">
                <span className="ev-rule-icn-w amber"><Icon name="shirt" /></span>
                <span className="ev-rule-title">Grooming & Attendance</span>
              </div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Hair:</strong> Neatly trimmed, well-groomed.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Shaving:</strong> Clean-shaven at all times.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>ID card and shoes</strong> mandatory with prescribed dress.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>100% attendance</strong> across all 7 days required.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Late permissions:</strong> Mentor approval required.</span></li>
              </ul>
            </div>
            <div className="ev-rule-block">
              <div className="ev-rule-head">
                <span className="ev-rule-icn-w green"><Icon name="check" /></span>
                <span className="ev-rule-title">Internet — Do's</span>
              </div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet green" /><span><strong>Project work:</strong> Use internet for project & research only.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet green" /><span><strong>Knowledge expansion:</strong> Resources to improve technical skills.</span></li>
              </ul>
            </div>
            <div className="ev-rule-block">
              <div className="ev-rule-head">
                <span className="ev-rule-icn-w"><Icon name="alert" /></span>
                <span className="ev-rule-title">Internet — Don'ts</span>
              </div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet red" /><span><strong>Mobile phones</strong> limited to project work only.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet red" /><span><strong>No</strong> obscene, offensive or illegal content.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet red" /><span><strong>No</strong> copyrighted downloads.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet red" /><span><strong>No</strong> social media unless instructed.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet red" /><span><strong>No</strong> accessing others' sensitive info.</span></li>
              </ul>
            </div>
          </div>

          <div className="ev-rule-block" style={{ marginTop: 12 }}>
            <div className="ev-rule-head">
              <span className="ev-rule-icn-w amber"><Icon name="women" /></span>
              <span className="ev-rule-title">Female Trainee Guidelines</span>
            </div>
            <div className="ev-rule-female-grid">
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Night escort:</strong> Security personnel escort to hostel after night sessions.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Priority dispersal:</strong> Female trainees leave first.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Final attendance</strong> must be given before dispersal.</span></li>
              </ul>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Female staff presence</strong> until all girls leave.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Zero tolerance</strong> for harassment or misconduct.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Immediate reporting:</strong> Confidentiality guaranteed.</span></li>
              </ul>
            </div>
          </div>

          <div className="ev-warn">
            <span className="ev-warn-icn"><Icon name="alert" /></span>
            <div><strong>Consequences:</strong> Personal phones and laptops will be confiscated. Trainee will be terminated from Project Space and will not receive completion certificates.</div>
          </div>
        </Accordion>

        <Accordion
          id="ppt"
          num={myHall ? "05" : "04"}
          icon={<Icon name="presentation" />}
          title="Presentation guide"
          sub="5 slides max · approved palette"
          open={openId === "ppt"}
          onToggle={toggle}
        >
          <div className="ev-ppt-grid">
            <div className="ev-ppt-block">
              <div className="ev-ppt-block-head"><span className="ev-ppt-block-num">01</span>Colour Palette</div>
              <div className="ev-color-row"><div className="ev-color-sw" style={{ background: "#FAF4DF" }} /><div className="ev-color-name">Background</div><div className="ev-color-hex">#FAF4DF</div></div>
              <div className="ev-color-row"><div className="ev-color-sw" style={{ background: "#E3562B" }} /><div className="ev-color-name">Primary</div><div className="ev-color-hex">#E3562B</div></div>
              <div className="ev-color-row"><div className="ev-color-sw" style={{ background: "#1D3639" }} /><div className="ev-color-name">Secondary</div><div className="ev-color-hex">#1D3639</div></div>
              <div className="ev-color-row"><div className="ev-color-sw" style={{ background: "#7F7F7F" }} /><div className="ev-color-name">Neutral</div><div className="ev-color-hex">#7F7F7F</div></div>
            </div>
            <div className="ev-ppt-block">
              <div className="ev-ppt-block-head"><span className="ev-ppt-block-num">02</span>Typography — Poppins</div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
              </ul>
            </div>
            <div className="ev-ppt-block">
              <div className="ev-ppt-block-head"><span className="ev-ppt-block-num">03</span>Slide Layout</div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Title at top, content below.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Left text + right image when needed.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Clean spacing; simple icons.</span></li>
              </ul>
            </div>
            <div className="ev-ppt-block">
              <div className="ev-ppt-block-head"><span className="ev-ppt-block-num">04</span>Content Rules</div>
              <ul className="ev-rule-list">
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Short, punchy sentences.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Bullets over paragraphs.</span></li>
                <li className="ev-rule-li"><span className="ev-rule-bullet" /><span>Animations: Fade or Appear only.</span></li>
              </ul>
            </div>
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
              <div className="ev-slide-li">Features & Demo</div>
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
            <div><strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template from the login portal.</div>
          </div>
        </Accordion>

        <Accordion
          id="contacts"
          num={myHall ? "06" : "05"}
          icon={<Icon name="phone" />}
          title="Help & emergency"
          sub="Save these numbers"
          open={openId === "contacts"}
          onToggle={toggle}
        >
          <div className="ev-contact-block">
            <div className="ev-contact-head">
              <span className="ev-contact-head-icn"><Icon name="alert" /></span>
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
          <div className="ev-contact-block">
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
          <div className="ev-contact-block">
            <div className="ev-contact-head">
              <span className="ev-contact-head-icn" style={{ color: "#a855f7" }}><Icon name="women" /></span>
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
          <div className="ev-warn">
            <span className="ev-warn-icn"><Icon name="alert" /></span>
            <div><strong>First aid kit:</strong> Corridor lockers on the 2nd and 4th floor of Technical Hub.</div>
          </div>
        </Accordion>

        <Accordion
          id="search"
          num={myHall ? "07" : "06"}
          icon={<Icon name="search" />}
          title="Look up any team"
          sub="Find another team's location"
          open={openId === "search"}
          onToggle={toggle}
        >
          <SearchAnyTeam search={search} setSearch={setSearch} />
        </Accordion>
      </div>
    </div>
  );
}

function Accordion({ id, num, icon, title, sub, open, onToggle, children }) {
  return (
    <div className={`ev-acc ${open ? "open" : ""}`}>
      <button className="ev-acc-trig" onClick={() => onToggle(id)} aria-expanded={open}>
        <div className="ev-acc-lead">
          <span className="ev-acc-num">{num}</span>
          <span className="ev-acc-icn">{icon}</span>
          <div className="ev-acc-text">
            <div className="ev-acc-title">{title}</div>
            <div className="ev-acc-sub">{sub}</div>
          </div>
        </div>
        <span className="ev-acc-chev">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && <div className="ev-acc-body">{children}</div>}
    </div>
  );
}

function HallView({ hall, myN }) {
  const bottomEntrance = hall.entrances.find((e) => e.side === "bottom");
  const leftEntrance = hall.entrances.find((e) => e.side === "left");

  return (
    <div className="ev-hall-card">
      <div className="ev-hall-card-head">
        <div className="ev-hall-card-name">
          <span className="ev-hall-card-eye">Hall</span>
          <span className="ev-hall-card-label" style={{ color: hall.accent }}>{hall.label}</span>
        </div>
        <div className="ev-hall-card-range">
          Teams {String(hall.teamRange[0]).padStart(3, "0")} – {String(hall.teamRange[1]).padStart(3, "0")}
        </div>
      </div>

      <div className="ev-hall-card-floor">
        <div className="ev-hall-stage">
          {leftEntrance && (
            <div className="ev-aisle-vert">
              <span className="ev-aisle-label">Entrance</span>
            </div>
          )}
          <div className="ev-hall-grid" style={{ gridTemplateColumns: `repeat(${hall.cols}, auto)` }}>
            {hall.seats.map((row, rIdx) =>
              row.map((teamN, cIdx) => {
                if (teamN === null) {
                  return <div key={`${rIdx}-${cIdx}`} className="ev-chair empty" aria-hidden="true" />;
                }
                const isYou = myN === teamN;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`ev-chair ${isYou ? "you" : ""}`}
                    title={`Team ${String(teamN).padStart(3, "0")}`}
                  >
                    {String(teamN).padStart(2, "0")}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {bottomEntrance && (
          <div className="ev-aisle-bottom">
            <span className="ev-aisle-label">↓ Entrance ↓</span>
          </div>
        )}
      </div>

      <div className="ev-hall-card-foot">
        <span><span className="ev-legend-chair" /> Other teams</span>
        {myN && myN >= hall.teamRange[0] && myN <= hall.teamRange[1] && (
          <span><span className="ev-legend-chair you" /> Your seat</span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {hall.entrances.length} {hall.entrances.length === 1 ? "Entrance" : "Entrances"} · {hall.rows} rows
        </span>
      </div>
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
          autoFocus
        />
      </div>
      {result && !result.notFound && (
        <div className="ev-search-result">
          <div className="ev-search-result-head">
            <span className="ev-search-result-team">{result.team}</span>
            <span className="ev-search-result-tag">Located</span>
          </div>
          <div className="ev-search-result-grid">
            <div>
              <div className="ev-search-result-cell-lab">Hall</div>
              <div className="ev-search-result-cell-val" style={{ color: result.hall.accent }}>{result.hall.name}</div>
            </div>
            <div>
              <div className="ev-search-result-cell-lab">Floor</div>
              <div className="ev-search-result-cell-val">Floor {result.venue.floor}</div>
            </div>
            <div>
              <div className="ev-search-result-cell-lab">Desk</div>
              <div className="ev-search-result-cell-val">Desk {result.venue.desk}</div>
            </div>
          </div>
        </div>
      )}
      {result && result.notFound && (
        <div className="ev-search-not-found">
          No team found. Valid range is <strong>PS-001 to PS-160</strong>.
        </div>
      )}
    </>
  );
}

function Icon({ name }) {
  const props = {
    width: 14, height: 14, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "search":       return <svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "shield":       return <svg {...props}><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z" /></svg>;
    case "shirt":        return <svg {...props}><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z" /></svg>;
    case "check":        return <svg {...props} strokeWidth="2"><path d="m5 12 4 4L19 7" /></svg>;
    case "alert":        return <svg {...props}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
    case "women":        return <svg {...props}><circle cx="12" cy="6" r="3" /><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9" /></svg>;
    case "clock":        return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "phone":        return <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case "presentation": return <svg {...props}><path d="M3 3h18v12H3z" /><path d="M12 15v4" /><path d="M8 21h8" /><path d="m7 10 3-3 2 2 4-5" /></svg>;
    case "seat":         return <svg {...props}><path d="M5 18h14" /><path d="M6 18v-7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v7" /><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M5 18v3" /><path d="M19 18v3" /></svg>;
    default: return null;
  }
}