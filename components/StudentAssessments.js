"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const LSRW_COLORS = {
  Listening: { bar: "#EEA727", glow: "rgba(238,167,39,0.35)" },
  Speaking:  { bar: "#fd1c00", glow: "rgba(253,28,0,0.35)"  },
  Reading:   { bar: "#10b981", glow: "rgba(16,185,129,0.35)"},
  Writing:   { bar: "#7B2FBE", glow: "rgba(123,47,190,0.35)"},
};

const LEVEL_CONFIG = {
  "Level-0":  { label: "Level 0",  color: "#EEA727", bg: "rgba(238,167,39,0.12)",  icon: "◈" },
  "Advanced": { label: "Advanced", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "◆" },
};

const LANG_COLORS = {
  c:      "#A8B9CC",
  cpp:    "#659AD2",
  java:   "#F89820",
  python: "#3572A5",
  sql:    "#e38c00",
};

function getLangColor(lang) {
  return LANG_COLORS[lang.toLowerCase()] || "#BDE8F5";
}

// ── Sub-component: LSRW Bar ───────────────────────────────────────────────────

function LsrwBar({ label, value }) {
  const [width, setWidth] = useState(0);
  const cfg = LSRW_COLORS[label];

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", color: "#ccc", fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: cfg.bar, fontFamily: "DM Sans, sans-serif" }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div style={{
        height: "8px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: `linear-gradient(90deg, ${cfg.bar}, ${cfg.bar}cc)`,
          borderRadius: "6px",
          boxShadow: `0 0 8px ${cfg.glow}`,
          transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
}

// ── Sub-component: Coding Problem Bar ────────────────────────────────────────

function ProblemBar({ lang, count, max }) {
  const [width, setWidth] = useState(0);
  const color = getLangColor(lang);
  const pct = max > 0 ? (count / max) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", alignItems: "center" }}>
        <span style={{
          fontSize: "12px",
          fontFamily: "DM Sans, sans-serif",
          fontWeight: 600,
          color: color,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {lang.toUpperCase()}
        </span>
        <span style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#fff",
          fontFamily: "DM Sans, sans-serif",
          background: "rgba(255,255,255,0.08)",
          padding: "1px 8px",
          borderRadius: "4px",
        }}>
          {count}
        </span>
      </div>
      <div style={{
        height: "6px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "4px",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: color,
          borderRadius: "4px",
          boxShadow: `0 0 6px ${color}66`,
          transition: "width 0.85s cubic-bezier(0.22,1,0.36,1)",
        }} />
      </div>
    </div>
  );
}

// ── Sub-component: Section Label ─────────────────────────────────────────────

function SectionLabel({ text, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
      <div style={{ width: "3px", height: "18px", background: color, borderRadius: "2px", flexShrink: 0 }} />
      <span style={{
        fontSize: "13px",
        fontWeight: 700,
        color: color,
        fontFamily: "DM Sans, sans-serif",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        {text}
      </span>
    </div>
  );
}

// ── Sub-component: Empty State ────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 12px",
      gap: "8px",
      opacity: 0.5,
    }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ fontSize: "12px", color: "#888", fontFamily: "DM Sans, sans-serif", textAlign: "center" }}>
        {message}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StudentAssessments({ rollNumber }) {
  const [hoot, setHoot]     = useState(null);
  const [coding, setCoding] = useState(null);
  const [problems, setProblems] = useState(null);
  const [loadingHoot, setLoadingHoot]     = useState(true);
  const [loadingCoding, setLoadingCoding] = useState(true);
  const [loadingProblems, setLoadingProblems] = useState(true);

  // Fetch HOOT data from Supabase
  useEffect(() => {
    if (!rollNumber) return;
    (async () => {
      setLoadingHoot(true);
      const { data, error } = await supabase
        .from("hoot_assessments")
        .select("listening, speaking, reading, writing, total")
        .eq("roll_number", rollNumber)
        .single();
      if (!error && data) setHoot(data);
      setLoadingHoot(false);
    })();
  }, [rollNumber]);

  // Fetch Coding Level from Supabase
  useEffect(() => {
    if (!rollNumber) return;
    (async () => {
      setLoadingCoding(true);
      const { data, error } = await supabase
        .from("coding_levels")
        .select("level")
        .eq("roll_number", rollNumber)
        .single();
      if (!error && data) setCoding(data);
      setLoadingCoding(false);
    })();
  }, [rollNumber]);

  // Fetch Problems Count from Maya API
  useEffect(() => {
    if (!rollNumber) return;
    (async () => {
      setLoadingProblems(true);
      try {
        const res = await fetch("https://maya.technicalhub.io/node/api/get-student-problems-count", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roll_no: rollNumber }),
        });
        if (res.ok) {
          const json = await res.json();
          // Normalize: remove roll_no / non-count keys, keep language keys
          const SKIP = ["roll_no", "roll_number", "student_id", "id", "total_problems", "total"];
          const langs = {};
          for (const [key, val] of Object.entries(json)) {
            if (!SKIP.includes(key.toLowerCase()) && typeof val === "number") {
              langs[key] = val;
            }
          }
          setProblems(langs);
        }
      } catch (_) {}
      setLoadingProblems(false);
    })();
  }, [rollNumber]);

  const lsrwEntries = hoot
    ? [
        { label: "Listening", value: hoot.listening },
        { label: "Speaking",  value: hoot.speaking  },
        { label: "Reading",   value: hoot.reading   },
        { label: "Writing",   value: hoot.writing   },
      ]
    : [];

  const problemEntries = problems ? Object.entries(problems) : [];
  const maxProblems    = problemEntries.length ? Math.max(...problemEntries.map(([, v]) => v), 1) : 1;
  const totalProblems  = problemEntries.reduce((s, [, v]) => s + v, 0);

  const levelCfg = coding?.level ? (LEVEL_CONFIG[coding.level] || LEVEL_CONFIG["Level-0"]) : null;

  // ── Card wrapper style ─────────────────────────────────────────────────────
  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "22px 24px",
    flex: 1,
    minWidth: 0,
  };

  const spinnerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px",
  };

  return (
    <div style={{ marginTop: "28px" }}>
      {/* Section header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "16px",
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          letterSpacing: "0.02em",
        }}>
          Assessments
        </h3>
        <p style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "13px",
          color: "rgba(255,255,255,0.4)",
          margin: "4px 0 0",
        }}>
          Your performance across communication and coding evaluations
        </p>
      </div>

      {/* Three cards row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
      }}>

        {/* ── Card 1: Self Intro Video ──────────────────────────────────────── */}
        <div style={card}>
          <SectionLabel text="Self Intro Video" color="#BDE8F5" />
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "8px 0",
          }}>
            {/* Video placeholder */}
            <div style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "rgba(189,232,245,0.05)",
              border: "1.5px dashed rgba(189,232,245,0.25)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(189,232,245,0.5)" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span style={{
                fontSize: "12px",
                color: "rgba(189,232,245,0.45)",
                fontFamily: "DM Sans, sans-serif",
                textAlign: "center",
                lineHeight: 1.4,
                padding: "0 12px",
              }}>
                Self introduction video<br />will appear here
              </span>
            </div>

            {/* Status badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(189,232,245,0.08)",
              border: "1px solid rgba(189,232,245,0.18)",
              borderRadius: "20px",
              padding: "5px 14px",
            }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#EEA727",
                boxShadow: "0 0 6px #EEA727",
              }} />
              <span style={{
                fontSize: "11px",
                color: "rgba(189,232,245,0.7)",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                PENDING UPLOAD
              </span>
            </div>
          </div>
        </div>

        {/* ── Card 2: HOOT Assessment ───────────────────────────────────────── */}
        <div style={card}>
          <SectionLabel text="HOOT — Communication" color="#EEA727" />

          {loadingHoot ? (
            <div style={spinnerStyle}><Spinner /></div>
          ) : !hoot ? (
            <EmptyState message="No HOOT assessment data found for your roll number" />
          ) : (
            <>
              {lsrwEntries.map(({ label, value }) => (
                <LsrwBar key={label} label={label} value={value} />
              ))}

              {/* Overall score */}
              <div style={{
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", color: "#888", fontFamily: "DM Sans, sans-serif" }}>
                  Overall Score
                </span>
                <div style={{
                  background: "rgba(238,167,39,0.12)",
                  border: "1px solid rgba(238,167,39,0.3)",
                  borderRadius: "8px",
                  padding: "4px 12px",
                }}>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#EEA727",
                    fontFamily: "DM Sans, sans-serif",
                  }}>
                    {hoot.total.toFixed(1)}
                    <span style={{ fontSize: "11px", fontWeight: 500, marginLeft: "2px" }}>/ 100</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Card 3: Coding Assessment ─────────────────────────────────────── */}
        <div style={card}>
          <SectionLabel text="Coding Assessment" color="#10b981" />

          {/* Level badge */}
          {loadingCoding ? (
            <div style={spinnerStyle}><Spinner /></div>
          ) : !levelCfg ? (
            <EmptyState message="No coding level found for your roll number" />
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px",
              padding: "10px 14px",
              background: levelCfg.bg,
              border: `1px solid ${levelCfg.color}44`,
              borderRadius: "10px",
            }}>
              <span style={{ fontSize: "18px" }}>{levelCfg.icon}</span>
              <div>
                <div style={{ fontSize: "10px", color: "#888", fontFamily: "DM Sans, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Current Level
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: levelCfg.color, fontFamily: "DM Sans, sans-serif" }}>
                  {levelCfg.label}
                </div>
              </div>
              {/* Problems total if available */}
              {!loadingProblems && totalProblems > 0 && (
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "#888", fontFamily: "DM Sans, sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Total Solved
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", fontFamily: "DM Sans, sans-serif" }}>
                    {totalProblems}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Problems by language */}
          {loadingProblems ? (
            <div style={spinnerStyle}><Spinner /></div>
          ) : problemEntries.length === 0 ? (
            <EmptyState message="No problems solved yet on HootHub" />
          ) : (
            <>
              <div style={{
                fontSize: "11px",
                color: "#666",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}>
                Problems Solved by Language
              </div>
              {problemEntries
                .sort(([, a], [, b]) => b - a)
                .map(([lang, count]) => (
                  <ProblemBar key={lang} lang={lang} count={count} max={maxProblems} />
                ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{
      width: "22px",
      height: "22px",
      border: "2px solid rgba(255,255,255,0.1)",
      borderTop: "2px solid rgba(255,255,255,0.5)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}