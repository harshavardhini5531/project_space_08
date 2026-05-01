"use client";
import { useState, useMemo, useEffect } from "react";

/* =========================================================================
   PROJECT SPACE — EVENT INFO PAGE
   Path: app/event-info/page.js
   Purpose: One-stop info hub for trainees & mentors
            (Welcome Kit lookup, Floor Plan, Schedule, Guidelines, PPT rules)
   Design system: #050008 bg, #fd1c00 red, #EEA727 orange, DM Sans, line icons
   ========================================================================= */

/* ---------- WELCOME KIT MAPPING (Floor → Desk → [Teams]) ---------- */
const FLOOR_DESK_MAP = {
  1: {
    1: { range: "PS-001 to PS-008", teams: range(1, 8) },
    2: { range: "PS-009 to PS-016", teams: range(9, 16) },
    3: { range: "PS-017 to PS-024", teams: range(17, 24) },
    4: { range: "PS-025 to PS-032", teams: range(25, 32) },
  },
  2: {
    1: { range: "PS-033 to PS-040", teams: range(33, 40) },
    2: { range: "PS-041 to PS-048", teams: range(41, 48) },
    3: { range: "PS-049 to PS-056", teams: range(49, 56) },
    4: { range: "PS-057 to PS-064", teams: range(57, 64) },
  },
  3: {
    1: { range: "PS-065 to PS-072", teams: range(65, 72) },
    2: { range: "PS-073 to PS-080", teams: range(73, 80) },
    3: { range: "PS-081 to PS-088", teams: range(81, 88) },
    4: { range: "PS-089 to PS-096", teams: range(89, 96) },
  },
  4: {
    1: { range: "PS-097 to PS-104", teams: range(97, 104) },
    2: { range: "PS-105 to PS-112", teams: range(105, 112) },
    3: { range: "PS-113 to PS-120", teams: range(113, 120) },
    4: { range: "PS-121 to PS-128", teams: range(121, 128) },
  },
  5: {
    1: { range: "PS-129 to PS-136", teams: range(129, 136) },
    2: { range: "PS-137 to PS-144", teams: range(137, 144) },
    3: { range: "PS-145 to PS-152", teams: range(145, 152) },
    4: { range: "PS-153 to PS-160", teams: range(153, 160) },
  },
};

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(`PS-${String(i).padStart(3, "0")}`);
  return out;
}

/* ---------- DRESS CODE ---------- */
const DRESS_CODE = [
  { day: "DAY 1", week: "WEDNESDAY", attire: "Drive Ready T-Shirt / SkillUp T-Shirt (Black)" },
  { day: "DAY 2", week: "THURSDAY", attire: "Project Space T-Shirt" },
  { day: "DAY 3", week: "FRIDAY", attire: "Civil Formal Wear" },
  { day: "DAY 4", week: "SATURDAY", attire: "Project Space T-Shirt" },
  { day: "DAY 5", week: "SUNDAY", attire: "White Code Dress" },
  { day: "DAY 6", week: "MONDAY", attire: "Drive Ready T-Shirt / SkillUp T-Shirt (Black)" },
  { day: "DAY 7", week: "TUESDAY", attire: "Project Space T-Shirt" },
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
    { role: "Ambulance Driver", name: "Narayana Swamy", phone: "93928 01243", note: "Security Gate · 5 PM – 12 AM" },
    { role: "Building Supervisor", name: "Manikanta", phone: "90105 35807", note: "Technical Hub · 8 AM – 9 PM" },
    { role: "Security (24/7)", name: "—", phone: "77299 97299", note: "Round the clock" },
    { role: "Head of Security", name: "D. Siva Prasad", phone: "95429 76665", note: "" },
    { role: "Campus In-Charge", name: "Chakravarthy", phone: "77318 86664", note: "" },
    { role: "CEO, Technical Hub", name: "Babji Neelam", phone: "98498 01605", note: "Higher level escalation" },
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

/* ---------- ICONS (line, stroke="currentColor", fill="none") ---------- */
const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8H7.5z"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C14.5 3 12 8 12 8h4.5z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  shirt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4 4 7l3 3 1-1v11h8V9l1 1 3-3-4-3-2 2a3 3 0 0 1-4 0L8 4z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z"/></svg>,
  bus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/></svg>,
  presentation: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="m7 11 3-3 2 2 4-5"/></svg>,
  rules: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3z"/><path d="M14 4v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  women: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M9 10 6 19h3l1 4h4l1-4h3l-3-9"/></svg>,
  food: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M2 16h20"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>,
  device: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>,
};

/* ====================================================================== */
/*                              MAIN PAGE                                  */
/* ====================================================================== */
export default function EventInfoPage() {
  const [active, setActive] = useState("welcome-kit");
  const [searchTeam, setSearchTeam] = useState("");

  const navItems = [
    { id: "welcome-kit", label: "Welcome Kit", icon: I.gift },
    { id: "floor-plan", label: "Floor Plan", icon: I.map },
    { id: "schedule", label: "Schedule", icon: I.clock },
    { id: "dress-code", label: "Dress Code", icon: I.shirt },
    { id: "guidelines", label: "Guidelines", icon: I.rules },
    { id: "ppt-guide", label: "PPT Guide", icon: I.presentation },
    { id: "contacts", label: "Contacts", icon: I.phone },
  ];

  return (
    <>
      <style jsx global>{`
        :root {
          --ei-bg: #050008;
          --ei-bg-2: #0c0612;
          --ei-card: #11091a;
          --ei-line: rgba(255, 255, 255, 0.08);
          --ei-line-strong: rgba(255, 255, 255, 0.16);
          --ei-text: #ededed;
          --ei-text-dim: #9b9aa3;
          --ei-text-mute: #6b6a73;
          --ei-red: #fd1c00;
          --ei-orange: #eea727;
          --ei-green: #10b981;
          --ei-purple: #7b2fbe;
          --ei-blue: #4ea8ff;
        }
        .ei-wrap * { box-sizing: border-box; }
        .ei-wrap { font-family: "DM Sans", system-ui, sans-serif; color: var(--ei-text); background: var(--ei-bg); min-height: 100vh; }

        /* === HEADER / HERO === */
        .ei-hero {
          position: relative;
          padding: 56px 32px 40px;
          border-bottom: 1px solid var(--ei-line);
          overflow: hidden;
          background:
            radial-gradient(ellipse 800px 320px at 20% 0%, rgba(238,167,39,.10), transparent 60%),
            radial-gradient(ellipse 600px 260px at 90% 100%, rgba(253,28,0,.10), transparent 60%),
            var(--ei-bg);
        }
        .ei-hero::before {
          content: "";
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 700px 400px at 50% 0%, #000 20%, transparent 70%);
          pointer-events: none;
        }
        .ei-hero-inner { position: relative; max-width: 1280px; margin: 0 auto; }
        .ei-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
          color: var(--ei-orange);
          padding: 6px 12px;
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 100px;
          background: rgba(238,167,39,.06);
        }
        .ei-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ei-orange); box-shadow: 0 0 8px var(--ei-orange); }
        .ei-h1 {
          font-size: clamp(36px, 5.5vw, 64px);
          line-height: 1.02; letter-spacing: -0.025em;
          font-weight: 700; margin: 18px 0 12px;
        }
        .ei-h1 .accent { color: var(--ei-red); }
        .ei-sub {
          font-size: clamp(15px, 1.3vw, 17px);
          color: var(--ei-text-dim); max-width: 640px; line-height: 1.5;
        }
        .ei-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 12px; margin-top: 32px; max-width: 720px;
        }
        .ei-stat {
          padding: 14px 16px;
          border: 1px solid var(--ei-line);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ei-stat-num { font-size: 24px; font-weight: 700; color: var(--ei-text); line-height: 1; }
        .ei-stat-lab { font-size: 11px; color: var(--ei-text-mute); margin-top: 6px; letter-spacing: .12em; text-transform: uppercase; }

        /* === LAYOUT === */
        .ei-shell {
          max-width: 1280px; margin: 0 auto;
          display: grid; grid-template-columns: 240px 1fr;
          gap: 32px; padding: 32px;
        }
        @media (max-width: 920px) {
          .ei-hero { padding: 40px 20px 32px; }
          .ei-shell { grid-template-columns: 1fr; padding: 20px; gap: 20px; }
          .ei-stats { grid-template-columns: repeat(2, 1fr); }
        }

        /* === SIDE NAV === */
        .ei-nav {
          position: sticky; top: 20px; align-self: start;
          display: flex; flex-direction: column; gap: 4px;
        }
        @media (max-width: 920px) {
          .ei-nav {
            position: static; flex-direction: row;
            overflow-x: auto; padding-bottom: 8px;
            scrollbar-width: none;
          }
          .ei-nav::-webkit-scrollbar { display: none; }
        }
        .ei-nav-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--ei-text-dim);
          border-radius: 8px;
          font-family: inherit; font-size: 14px; font-weight: 500;
          cursor: pointer; text-align: left;
          transition: all .18s ease;
          white-space: nowrap;
        }
        .ei-nav-btn:hover { color: var(--ei-text); background: rgba(255,255,255,.03); }
        .ei-nav-btn.active {
          color: var(--ei-text);
          background: rgba(253,28,0,.08);
          border-color: rgba(253,28,0,.3);
        }
        .ei-nav-btn.active .ei-nav-icn { color: var(--ei-red); }
        .ei-nav-icn { width: 18px; height: 18px; flex-shrink: 0; color: var(--ei-text-mute); transition: color .18s; }
        .ei-nav-btn:hover .ei-nav-icn { color: var(--ei-text); }

        /* === SECTIONS === */
        .ei-section { animation: ei-fade .25s ease; }
        @keyframes ei-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ei-section-head {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 20px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .ei-section-title {
          font-size: clamp(22px, 2.4vw, 30px);
          font-weight: 700; letter-spacing: -0.015em;
          margin: 0 0 6px;
        }
        .ei-section-desc { font-size: 14px; color: var(--ei-text-dim); margin: 0; max-width: 560px; line-height: 1.5; }

        /* === CARDS === */
        .ei-card {
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
          overflow: hidden;
        }
        .ei-card-pad { padding: 20px 22px; }

        /* === WELCOME KIT SEARCH === */
        .ei-search-wrap { position: relative; max-width: 480px; }
        .ei-search-icn { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--ei-text-mute); }
        .ei-search-in {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1px solid var(--ei-line-strong);
          background: rgba(255,255,255,.02);
          color: var(--ei-text);
          border-radius: 10px;
          font-family: inherit; font-size: 15px;
          outline: none;
          transition: border-color .18s, background .18s;
        }
        .ei-search-in:focus { border-color: var(--ei-orange); background: rgba(238,167,39,.04); }
        .ei-search-in::placeholder { color: var(--ei-text-mute); }

        .ei-result {
          margin-top: 24px;
          padding: 28px;
          background: linear-gradient(135deg, rgba(238,167,39,.08), rgba(253,28,0,.06));
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 14px;
          display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: center;
        }
        @media (max-width: 600px) { .ei-result { grid-template-columns: 1fr; gap: 18px; padding: 22px; } }
        .ei-result-team {
          font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
          color: var(--ei-orange); font-weight: 600; margin-bottom: 8px;
        }
        .ei-result-num {
          font-size: clamp(36px, 5vw, 56px); font-weight: 700;
          line-height: 1; letter-spacing: -0.02em; color: var(--ei-text);
        }
        .ei-result-info { display: flex; flex-direction: column; gap: 14px; }
        .ei-result-row { display: flex; align-items: center; gap: 14px; }
        .ei-result-icn { width: 36px; height: 36px; flex-shrink: 0; padding: 9px; border-radius: 8px; background: rgba(255,255,255,.05); color: var(--ei-orange); }
        .ei-result-row-lab { font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: var(--ei-text-mute); }
        .ei-result-row-val { font-size: 18px; font-weight: 600; margin-top: 2px; }

        .ei-not-found {
          margin-top: 16px;
          padding: 14px 18px;
          color: var(--ei-text-dim);
          font-size: 14px;
          border: 1px dashed var(--ei-line-strong);
          border-radius: 8px;
        }

        /* === FLOOR PLAN === */
        .ei-floors { display: grid; gap: 16px; }
        .ei-floor-card {
          border: 1px solid var(--ei-line);
          background: var(--ei-card);
          border-radius: 12px;
          overflow: hidden;
        }
        .ei-floor-head {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 20px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid var(--ei-line);
        }
        .ei-floor-badge {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 10px;
          font-weight: 700; font-size: 18px;
          color: var(--ei-orange);
        }
        .ei-floor-title { font-size: 16px; font-weight: 600; }
        .ei-floor-sub { font-size: 12px; color: var(--ei-text-mute); margin-top: 2px; }
        .ei-desks {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1px; background: var(--ei-line);
        }
        @media (max-width: 720px) { .ei-desks { grid-template-columns: repeat(2, 1fr); } }
        .ei-desk {
          padding: 16px 18px;
          background: var(--ei-card);
          display: flex; flex-direction: column; gap: 6px;
        }
        .ei-desk-lab { font-size: 11px; letter-spacing: .15em; text-transform: uppercase; color: var(--ei-text-mute); }
        .ei-desk-range { font-size: 15px; font-weight: 600; color: var(--ei-text); }
        .ei-desk-count { font-size: 11px; color: var(--ei-text-dim); }

        /* === SCHEDULE === */
        .ei-tabs {
          display: flex; gap: 4px; padding: 4px;
          background: var(--ei-bg-2);
          border: 1px solid var(--ei-line);
          border-radius: 10px;
          width: fit-content;
        }
        .ei-tab {
          padding: 8px 16px;
          border: none; background: transparent;
          color: var(--ei-text-dim);
          font-family: inherit; font-size: 13px; font-weight: 500;
          border-radius: 7px; cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .ei-tab.active { background: var(--ei-red); color: white; }
        .ei-tab:not(.active):hover { color: var(--ei-text); }

        .ei-timeline {
          margin-top: 20px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
          background: var(--ei-line);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
          overflow: hidden;
        }
        @media (max-width: 600px) { .ei-timeline { grid-template-columns: 1fr; } }
        .ei-time-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          background: var(--ei-card);
          gap: 16px;
        }
        .ei-time-lab { font-size: 14px; color: var(--ei-text); }
        .ei-time-val { font-size: 12px; color: var(--ei-orange); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

        /* === DRESS CODE TABLE === */
        .ei-dress { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
        @media (max-width: 1100px) { .ei-dress { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .ei-dress { grid-template-columns: 1fr 1fr; } }
        .ei-dress-card {
          padding: 18px 16px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 10px;
          position: relative;
          transition: border-color .2s, transform .2s;
        }
        .ei-dress-card:hover { border-color: var(--ei-line-strong); transform: translateY(-2px); }
        .ei-dress-day {
          font-size: 11px; letter-spacing: .2em; color: var(--ei-red);
          font-weight: 700; text-transform: uppercase;
        }
        .ei-dress-week { font-size: 11px; color: var(--ei-text-mute); margin-top: 4px; letter-spacing: .1em; }
        .ei-dress-attire { margin-top: 14px; font-size: 13px; color: var(--ei-text); line-height: 1.4; font-weight: 500; }

        /* === GUIDELINES === */
        .ei-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 820px) { .ei-rules-grid { grid-template-columns: 1fr; } }
        .ei-rule-card {
          padding: 22px 24px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
        }
        .ei-rule-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px; padding-bottom: 14px;
          border-bottom: 1px solid var(--ei-line);
        }
        .ei-rule-icn {
          width: 36px; height: 36px; padding: 8px;
          background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.2);
          border-radius: 8px;
          color: var(--ei-red);
          flex-shrink: 0;
        }
        .ei-rule-title { font-size: 15px; font-weight: 600; }
        .ei-rule-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .ei-rule-li { display: flex; gap: 10px; font-size: 13px; line-height: 1.55; color: var(--ei-text-dim); }
        .ei-rule-li strong { color: var(--ei-text); font-weight: 600; }
        .ei-rule-bullet { width: 4px; height: 4px; border-radius: 50%; background: var(--ei-orange); margin-top: 8px; flex-shrink: 0; }

        .ei-do-dont { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
        @media (max-width: 600px) { .ei-do-dont { grid-template-columns: 1fr; } }
        .ei-do, .ei-dont {
          padding: 18px 20px;
          border-radius: 10px;
          border: 1px solid var(--ei-line);
        }
        .ei-do { background: rgba(16,185,129,.04); border-color: rgba(16,185,129,.2); }
        .ei-dont { background: rgba(253,28,0,.04); border-color: rgba(253,28,0,.2); }
        .ei-do-head, .ei-dont-head {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
          margin-bottom: 12px;
        }
        .ei-do-head { color: var(--ei-green); }
        .ei-dont-head { color: var(--ei-red); }
        .ei-do-icn, .ei-dont-icn { width: 18px; height: 18px; }

        .ei-warn {
          margin-top: 24px;
          padding: 16px 20px;
          background: rgba(253,28,0,.06);
          border: 1px solid rgba(253,28,0,.25);
          border-left: 3px solid var(--ei-red);
          border-radius: 8px;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .ei-warn-icn { width: 22px; height: 22px; color: var(--ei-red); flex-shrink: 0; margin-top: 1px; }
        .ei-warn-body { font-size: 13px; line-height: 1.55; color: var(--ei-text-dim); }
        .ei-warn-body strong { color: var(--ei-text); }

        /* === PPT GUIDE === */
        .ei-ppt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 820px) { .ei-ppt-grid { grid-template-columns: 1fr; } }
        .ei-ppt-card {
          padding: 22px 24px;
          background: var(--ei-card);
          border: 1px solid var(--ei-line);
          border-radius: 12px;
        }
        .ei-ppt-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.3);
          border-radius: 50%;
          font-weight: 700; font-size: 13px;
          color: var(--ei-orange);
          margin-right: 10px;
        }
        .ei-ppt-h { font-size: 15px; font-weight: 600; margin: 0 0 14px; display: flex; align-items: center; }
        .ei-color-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; font-size: 13px; }
        .ei-color-swatch { width: 22px; height: 22px; border-radius: 5px; border: 1px solid var(--ei-line-strong); flex-shrink: 0; }
        .ei-color-hex { color: var(--ei-text-mute); font-family: ui-monospace, monospace; font-size: 12px; }

        .ei-slide-flow {
          display: grid; grid-template-columns: 1fr 3fr 1fr; gap: 12px; margin-top: 16px;
        }
        @media (max-width: 720px) { .ei-slide-flow { grid-template-columns: 1fr; } }
        .ei-slide {
          padding: 18px;
          border: 1px solid var(--ei-line);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ei-slide-num {
          font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
          color: var(--ei-orange); font-weight: 600; margin-bottom: 10px;
        }
        .ei-slide-name { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
        .ei-slide-li { font-size: 12px; color: var(--ei-text-dim); padding: 3px 0; line-height: 1.5; }

        /* === CONTACTS === */
        .ei-contacts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 820px) { .ei-contacts-grid { grid-template-columns: 1fr; } }
        .ei-contact-row {
          display: grid; grid-template-columns: 1fr auto;
          gap: 16px; padding: 14px 18px;
          border-bottom: 1px solid var(--ei-line);
          align-items: center;
        }
        .ei-contact-row:last-child { border-bottom: none; }
        .ei-contact-role { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ei-text-mute); margin-bottom: 4px; }
        .ei-contact-name { font-size: 14px; font-weight: 500; color: var(--ei-text); }
        .ei-contact-note { font-size: 12px; color: var(--ei-text-dim); margin-top: 3px; }
        .ei-contact-phone {
          font-family: ui-monospace, monospace;
          font-size: 13px;
          color: var(--ei-orange);
          font-weight: 600;
          padding: 6px 10px;
          background: rgba(238,167,39,.06);
          border: 1px solid rgba(238,167,39,.2);
          border-radius: 6px;
          white-space: nowrap;
          text-decoration: none;
        }
        .ei-card-h {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid var(--ei-line);
          font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ei-text);
        }
        .ei-card-h-icn { width: 18px; height: 18px; color: var(--ei-orange); }

        /* utility */
        .ei-divider { height: 1px; background: var(--ei-line); margin: 28px 0; }
      `}</style>

      <div className="ei-wrap">
        {/* ============== HERO ============== */}
        <header className="ei-hero">
          <div className="ei-hero-inner">
            <span className="ei-eyebrow">
              <span className="ei-eyebrow-dot" />
              Project Space — Season 8
            </span>
            <h1 className="ei-h1">
              Everything you need.<br />
              <span className="accent">In one place.</span>
            </h1>
            <p className="ei-sub">
              Welcome kit pickup, floor & desk allocation, daily schedule, dress code,
              guidelines, presentation rules and emergency contacts — for every trainee
              and mentor at Project Space 8.
            </p>
            <div className="ei-stats">
              <div className="ei-stat"><div className="ei-stat-num">900+</div><div className="ei-stat-lab">Trainees</div></div>
              <div className="ei-stat"><div className="ei-stat-num">160</div><div className="ei-stat-lab">Teams</div></div>
              <div className="ei-stat"><div className="ei-stat-num">7</div><div className="ei-stat-lab">Days</div></div>
              <div className="ei-stat"><div className="ei-stat-num">7</div><div className="ei-stat-lab">Domains</div></div>
            </div>
          </div>
        </header>

        {/* ============== SHELL ============== */}
        <div className="ei-shell">
          {/* SIDE NAV */}
          <nav className="ei-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`ei-nav-btn ${active === item.id ? "active" : ""}`}
                onClick={() => setActive(item.id)}
              >
                <span className="ei-nav-icn">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* CONTENT */}
          <main>
            {active === "welcome-kit" && <WelcomeKitSection searchTeam={searchTeam} setSearchTeam={setSearchTeam} />}
            {active === "floor-plan" && <FloorPlanSection />}
            {active === "schedule" && <ScheduleSection />}
            {active === "dress-code" && <DressCodeSection />}
            {active === "guidelines" && <GuidelinesSection />}
            {active === "ppt-guide" && <PPTGuideSection />}
            {active === "contacts" && <ContactsSection />}
          </main>
        </div>
      </div>
    </>
  );
}

/* ====================================================================== */
/*                            WELCOME KIT                                  */
/* ====================================================================== */
function WelcomeKitSection({ searchTeam, setSearchTeam }) {
  const result = useMemo(() => {
    if (!searchTeam.trim()) return null;
    let q = searchTeam.trim().toUpperCase();
    if (!q.startsWith("PS-")) {
      const num = q.replace(/[^0-9]/g, "");
      if (!num) return { notFound: true };
      q = "PS-" + num.padStart(3, "0");
    }
    const n = parseInt(q.replace("PS-", ""), 10);
    if (isNaN(n) || n < 1 || n > 160) return { notFound: true };

    for (const [floor, desks] of Object.entries(FLOOR_DESK_MAP)) {
      for (const [desk, info] of Object.entries(desks)) {
        if (info.teams.includes(q)) {
          return { team: q, floor, desk, range: info.range };
        }
      }
    }
    return { notFound: true };
  }, [searchTeam]);

  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Welcome Kit Pickup</h2>
          <p className="ei-section-desc">
            Enter your team number to find the exact floor and desk where your welcome kit will be distributed on Day 1 (9:00 – 10:00 AM).
          </p>
        </div>
      </div>

      <div className="ei-card ei-card-pad">
        <div className="ei-search-wrap">
          <span className="ei-search-icn">{I.search}</span>
          <input
            className="ei-search-in"
            placeholder="Enter team number — e.g. PS-042 or just 42"
            value={searchTeam}
            onChange={(e) => setSearchTeam(e.target.value)}
          />
        </div>

        {result && !result.notFound && (
          <div className="ei-result">
            <div>
              <div className="ei-result-team">Team</div>
              <div className="ei-result-num">{result.team}</div>
            </div>
            <div className="ei-result-info">
              <div className="ei-result-row">
                <span className="ei-result-icn">{I.map}</span>
                <div>
                  <div className="ei-result-row-lab">Floor</div>
                  <div className="ei-result-row-val">Floor {result.floor}</div>
                </div>
              </div>
              <div className="ei-result-row">
                <span className="ei-result-icn">{I.gift}</span>
                <div>
                  <div className="ei-result-row-lab">Desk</div>
                  <div className="ei-result-row-val">Desk {result.desk} <span style={{color:"var(--ei-text-mute)",fontSize:13,fontWeight:400}}>· {result.range}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && result.notFound && (
          <div className="ei-not-found">
            No matching team found. Valid range is <strong style={{color:"var(--ei-text)"}}>PS-001 to PS-160</strong>.
          </div>
        )}

        {!result && (
          <p style={{ marginTop: 18, fontSize: 13, color: "var(--ei-text-mute)" }}>
            All 160 teams are mapped across 5 floors and 4 desks per floor. Pickup is mandatory on <strong style={{color:"var(--ei-text)"}}>Day 1 between 9:00 – 10:00 AM</strong>.
          </p>
        )}
      </div>
    </section>
  );
}

/* ====================================================================== */
/*                            FLOOR PLAN                                   */
/* ====================================================================== */
function FloorPlanSection() {
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Floor Plan</h2>
          <p className="ei-section-desc">
            All 160 teams are distributed across 5 floors of the Technical Hub building, with 4 desks per floor and 8 teams per desk.
          </p>
        </div>
      </div>

      <div className="ei-floors">
        {Object.entries(FLOOR_DESK_MAP).map(([floor, desks]) => (
          <div key={floor} className="ei-floor-card">
            <div className="ei-floor-head">
              <div className="ei-floor-badge">{floor}</div>
              <div>
                <div className="ei-floor-title">Floor {floor}</div>
                <div className="ei-floor-sub">
                  {Object.values(desks).reduce((s, d) => s + d.teams.length, 0)} teams · 4 desks
                </div>
              </div>
            </div>
            <div className="ei-desks">
              {Object.entries(desks).map(([desk, info]) => (
                <div key={desk} className="ei-desk">
                  <div className="ei-desk-lab">Desk {desk}</div>
                  <div className="ei-desk-range">{info.range}</div>
                  <div className="ei-desk-count">{info.teams.length} teams</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ====================================================================== */
/*                              SCHEDULE                                   */
/* ====================================================================== */
function ScheduleSection() {
  const [tab, setTab] = useState("day1");
  const data = TIMINGS[tab];
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Daily Schedule</h2>
          <p className="ei-section-desc">
            Strict adherence to timings is mandatory. Late arrivals require approval from your project mentor.
          </p>
        </div>
      </div>

      <div className="ei-tabs">
        <button className={`ei-tab ${tab === "day1" ? "active" : ""}`} onClick={() => setTab("day1")}>Day 1 (Wed)</button>
        <button className={`ei-tab ${tab === "day2to6" ? "active" : ""}`} onClick={() => setTab("day2to6")}>Day 2 – 6</button>
        <button className={`ei-tab ${tab === "day7" ? "active" : ""}`} onClick={() => setTab("day7")}>Day 7 (Tue)</button>
      </div>

      <div className="ei-timeline">
        {data.map(([label, time], i) => (
          <div key={i} className="ei-time-row">
            <span className="ei-time-lab">{label}</span>
            <span className="ei-time-val">{time}</span>
          </div>
        ))}
      </div>

      {tab === "day7" && (
        <div className="ei-warn" style={{ marginTop: 20 }}>
          <span className="ei-warn-icn">{I.alert}</span>
          <div className="ei-warn-body">
            <strong>Check-out (13th May 2026):</strong> Buses will be available from Campus to Rajahmundry and Kakinada routes by 9:00 AM.
          </div>
        </div>
      )}
    </section>
  );
}

/* ====================================================================== */
/*                              DRESS CODE                                 */
/* ====================================================================== */
function DressCodeSection() {
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Dress Code</h2>
          <p className="ei-section-desc">
            Maintaining a professional appearance is mandatory for entry into Project Space. Dress code (with shoes & ID card) must be followed from 9:30 AM until dinner.
          </p>
        </div>
      </div>

      <div className="ei-dress">
        {DRESS_CODE.map((d, i) => (
          <div key={i} className="ei-dress-card">
            <div className="ei-dress-day">{d.day}</div>
            <div className="ei-dress-week">{d.week}</div>
            <div className="ei-dress-attire">{d.attire}</div>
          </div>
        ))}
      </div>

      <div className="ei-rules-grid" style={{ marginTop: 28 }}>
        <div className="ei-rule-card">
          <div className="ei-rule-head">
            <span className="ei-rule-icn">{I.shirt}</span>
            <span className="ei-rule-title">Grooming Standards</span>
          </div>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Hair:</strong> Must be neatly trimmed and well-groomed.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Shaving:</strong> Trainees must be clean-shaven at all times.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Attire:</strong> ID card and shoes are mandatory with the prescribed dress code.</span></li>
          </ul>
        </div>
        <div className="ei-rule-card">
          <div className="ei-rule-head">
            <span className="ei-rule-icn">{I.clock}</span>
            <span className="ei-rule-title">Attendance</span>
          </div>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>100% attendance</strong> across all 7 days is required.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Punctuality:</strong> Project Space schedule must be followed without exception.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Late permissions</strong> require immediate approval from your project mentor.</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== */
/*                              GUIDELINES                                 */
/* ====================================================================== */
function GuidelinesSection() {
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Guidelines & Conduct</h2>
          <p className="ei-section-desc">
            Professional behaviour is expected at all times. The premises are under CCTV surveillance — failure to comply may result in restricted access or termination.
          </p>
        </div>
      </div>

      {/* Code of Conduct */}
      <div className="ei-rules-grid">
        <div className="ei-rule-card">
          <div className="ei-rule-head">
            <span className="ei-rule-icn">{I.shield}</span>
            <span className="ei-rule-title">Code of Conduct</span>
          </div>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>On-site:</strong> No shouting on the Project Space floor or Technical Hub building.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>In transit:</strong> Maintain quiet while commuting to hostel or meals.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>At the hostel:</strong> Especially during night hours.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Movement:</strong> No unnecessary roaming or crowding in common areas.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Littering:</strong> Strictly prohibited. Use designated bins for all waste.</span></li>
          </ul>
        </div>

        <div className="ei-rule-card">
          <div className="ei-rule-head">
            <span className="ei-rule-icn">{I.bus}</span>
            <span className="ei-rule-title">Transport</span>
          </div>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>In-campus:</strong> Buses available between Technical Hub and Hostel for lunch.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Check-out:</strong> Buses to Rajahmundry & Kakinada by 9:00 AM on 13th May 2026.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Precautions:</strong> Carry your own water bottle and umbrella for campus walks.</span></li>
          </ul>
        </div>
      </div>

      {/* Internet & Device Policy */}
      <div className="ei-card" style={{ marginTop: 20 }}>
        <div className="ei-card-h">
          <span className="ei-card-h-icn">{I.device}</span>
          Internet & Device Usage Policy
        </div>
        <div className="ei-card-pad">
          <div className="ei-do-dont">
            <div className="ei-do">
              <div className="ei-do-head"><span className="ei-do-icn">{I.check}</span>The Do's</div>
              <ul className="ei-rule-list">
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-green)"}} /><span><strong>Project work:</strong> Use internet exclusively for project & research work.</span></li>
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-green)"}} /><span><strong>Knowledge expansion:</strong> Seek resources to improve technical & subject expertise.</span></li>
              </ul>
            </div>
            <div className="ei-dont">
              <div className="ei-dont-head"><span className="ei-dont-icn">{I.x}</span>The Don'ts</div>
              <ul className="ei-rule-list">
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-red)"}} /><span><strong>Device usage:</strong> Mobile phones limited to project work only.</span></li>
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-red)"}} /><span><strong>Inappropriate content:</strong> No obscene, offensive or illegal material.</span></li>
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-red)"}} /><span><strong>Copyright:</strong> No movies, music, software or copyrighted downloads.</span></li>
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-red)"}} /><span><strong>Privacy:</strong> Do not access others' sensitive information.</span></li>
                <li className="ei-rule-li"><span className="ei-rule-bullet" style={{background:"var(--ei-red)"}} /><span><strong>Social media:</strong> Prohibited unless directed by mentors.</span></li>
              </ul>
            </div>
          </div>

          <div className="ei-warn">
            <span className="ei-warn-icn">{I.alert}</span>
            <div className="ei-warn-body">
              <strong>Consequences of Violation:</strong> Personal mobile phones and laptops will be confiscated.
              Trainee will be terminated from Project Space and will not receive any project completion certificates.
            </div>
          </div>
        </div>
      </div>

      {/* Female Trainee Guidelines */}
      <div className="ei-card" style={{ marginTop: 20 }}>
        <div className="ei-card-h">
          <span className="ei-card-h-icn">{I.women}</span>
          Specific Guidelines for Female Trainees
        </div>
        <div className="ei-card-pad">
          <div className="ei-rules-grid" style={{ gap: 14 }}>
            <ul className="ei-rule-list">
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Night escort:</strong> Female trainees will be escorted by campus security personnel to hostel after night session.</span></li>
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Priority dispersal:</strong> All female trainees leave first in every session.</span></li>
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Final attendance:</strong> Must be given before dispersal.</span></li>
            </ul>
            <ul className="ei-rule-list">
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Female staff presence:</strong> Maintained until all girls safely leave.</span></li>
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Zero tolerance:</strong> For harassment, inappropriate comments, teasing or misconduct.</span></li>
              <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Immediate reporting:</strong> Inform female coordinators for disciplinary action — confidentiality guaranteed.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== */
/*                            PPT GUIDE                                    */
/* ====================================================================== */
function PPTGuideSection() {
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Presentation Guidelines</h2>
          <p className="ei-section-desc">
            AI tools are encouraged for faster, smarter presentation creation. Final deck must follow the maximum 5-slide rule and all formatting standards below.
          </p>
        </div>
      </div>

      <div className="ei-ppt-grid">
        {/* Colors */}
        <div className="ei-ppt-card">
          <h3 className="ei-ppt-h"><span className="ei-ppt-num">1</span>Colour Palette</h3>
          <div className="ei-color-row"><div className="ei-color-swatch" style={{background:"#FAF4DF"}} /><div><div style={{fontWeight:500}}>Background</div><div className="ei-color-hex">#FAF4DF</div></div></div>
          <div className="ei-color-row"><div className="ei-color-swatch" style={{background:"#E3562B"}} /><div><div style={{fontWeight:500}}>Primary · Highlights</div><div className="ei-color-hex">#E3562B</div></div></div>
          <div className="ei-color-row"><div className="ei-color-swatch" style={{background:"#1D3639"}} /><div><div style={{fontWeight:500}}>Secondary · Titles</div><div className="ei-color-hex">#1D3639</div></div></div>
          <div className="ei-color-row"><div className="ei-color-swatch" style={{background:"#7F7F7F"}} /><div><div style={{fontWeight:500}}>Neutral · Subtext</div><div className="ei-color-hex">#7F7F7F</div></div></div>
        </div>

        {/* Font */}
        <div className="ei-ppt-card">
          <h3 className="ei-ppt-h"><span className="ei-ppt-num">2</span>Typography — Poppins</h3>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Title:</strong> 36–44 pt (Bold)</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Subtitle:</strong> 24–30 pt (SemiBold)</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Body:</strong> 18–22 pt (Regular)</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span><strong>Small text:</strong> 14–16 pt (Light)</span></li>
          </ul>
        </div>

        {/* Layout */}
        <div className="ei-ppt-card">
          <h3 className="ei-ppt-h"><span className="ei-ppt-num">3</span>Slide Layout</h3>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Title at top, content below.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Use left text + right image when needed.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Clean spacing between elements; simple icons.</span></li>
          </ul>
        </div>

        {/* Content */}
        <div className="ei-ppt-card">
          <h3 className="ei-ppt-h"><span className="ei-ppt-num">4</span>Content Rules</h3>
          <ul className="ei-rule-list">
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Maximum 5–6 lines per slide.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Keep sentences short and punchy.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Bullet points over paragraphs.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Animations: Fade or Appear only.</span></li>
            <li className="ei-rule-li"><span className="ei-rule-bullet" /><span>Same font, colours and layout across all slides.</span></li>
          </ul>
        </div>
      </div>

      {/* 5-Slide Structure */}
      <div className="ei-card" style={{ marginTop: 20 }}>
        <div className="ei-card-h">
          <span className="ei-card-h-icn">{I.presentation}</span>
          Slide Structure — Maximum 5 Slides
        </div>
        <div className="ei-card-pad">
          <div className="ei-slide-flow">
            <div className="ei-slide">
              <div className="ei-slide-num">Slide 1</div>
              <div className="ei-slide-name">Cover</div>
              <div className="ei-slide-li">• Project Title</div>
              <div className="ei-slide-li">• Team Name</div>
              <div className="ei-slide-li">• Team Members</div>
            </div>
            <div className="ei-slide">
              <div className="ei-slide-num">Slides 2 – 4</div>
              <div className="ei-slide-name">Project Body</div>
              <div className="ei-slide-li">• Problem Statement</div>
              <div className="ei-slide-li">• Solution Overview</div>
              <div className="ei-slide-li">• Features</div>
              <div className="ei-slide-li">• Demo Screenshots / Workflow</div>
              <div className="ei-slide-li">• Technology Stack</div>
            </div>
            <div className="ei-slide">
              <div className="ei-slide-num">Slide 5</div>
              <div className="ei-slide-name">Closing</div>
              <div className="ei-slide-li">• Team Introduction</div>
              <div className="ei-slide-li">• Learnings</div>
              <div className="ei-slide-li">• Thank You Note</div>
            </div>
          </div>

          <div className="ei-warn" style={{ marginTop: 20, background:"rgba(238,167,39,.06)", borderColor:"rgba(238,167,39,.3)", borderLeftColor:"var(--ei-orange)" }}>
            <span className="ei-warn-icn" style={{color:"var(--ei-orange)"}}>{I.alert}</span>
            <div className="ei-warn-body">
              <strong>Template available:</strong> Teams unable to use AI tools can use the official Project Space template
              from the login portal — approved colours, fonts, icons and ready-made layouts. Customise with your project
              details while staying compliant with the 5-slide rule.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ====================================================================== */
/*                              CONTACTS                                   */
/* ====================================================================== */
function ContactsSection() {
  return (
    <section className="ei-section">
      <div className="ei-section-head">
        <div>
          <h2 className="ei-section-title">Emergency Contacts</h2>
          <p className="ei-section-desc">
            Save these numbers. Battery-operated campus vehicles are available for transporting students with non-critical injuries to the on-campus Apollo medical centre.
          </p>
        </div>
      </div>

      <div className="ei-card" style={{ marginBottom: 16 }}>
        <div className="ei-card-h">
          <span className="ei-card-h-icn">{I.alert}</span>
          Emergency & Security
        </div>
        {CONTACTS.emergency.map((c, i) => (
          <div key={i} className="ei-contact-row">
            <div>
              <div className="ei-contact-role">{c.role}</div>
              <div className="ei-contact-name">{c.name}</div>
              {c.note && <div className="ei-contact-note">{c.note}</div>}
            </div>
            <a href={`tel:${c.phone.replace(/\s/g,"")}`} className="ei-contact-phone">{c.phone}</a>
          </div>
        ))}
      </div>

      <div className="ei-contacts-grid">
        <div className="ei-card">
          <div className="ei-card-h">
            <span className="ei-card-h-icn">{I.shield}</span>
            Hostel Queries
          </div>
          {CONTACTS.hostel.map((c, i) => (
            <div key={i} className="ei-contact-row">
              <div>
                <div className="ei-contact-role">{c.role}</div>
                <div className="ei-contact-name">{c.name}</div>
              </div>
              <a href={`tel:${c.phone.replace(/\s/g,"")}`} className="ei-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>

        <div className="ei-card">
          <div className="ei-card-h">
            <span className="ei-card-h-icn">{I.women}</span>
            Female Coordinators
          </div>
          {CONTACTS.female.map((c, i) => (
            <div key={i} className="ei-contact-row">
              <div>
                <div className="ei-contact-role">{c.role}</div>
                <div className="ei-contact-name">{c.name}</div>
              </div>
              <a href={`tel:${c.phone.replace(/\s/g,"")}`} className="ei-contact-phone">{c.phone}</a>
            </div>
          ))}
        </div>
      </div>

      <div className="ei-warn" style={{ marginTop: 20 }}>
        <span className="ei-warn-icn">{I.alert}</span>
        <div className="ei-warn-body">
          <strong>First aid kit locations:</strong> Available at corridor lockers on the 2nd floor and 4th floor of the Technical Hub building.
        </div>
      </div>
    </section>
  );
}