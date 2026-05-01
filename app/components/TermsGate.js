"use client";
import { useState, useEffect } from "react";

/* ============================================================
   TERMS GATE — Wraps the dashboard content
   Blocks all access until student clicks "I Accept"
   Path: /app/components/TermsGate.js
   ============================================================ */
export default function TermsGate({ user, children }) {
  const [checking, setChecking] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roll = user?.rollNumber || user?.roll_number;

  useEffect(() => {
    if (!roll) return;
    (async () => {
      try {
        const r = await fetch(`/api/terms/status?roll=${roll}`, { cache: "no-store" });
        const d = await r.json();
        setAccepted(!!d.accepted);
      } catch (e) {
        setAccepted(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [roll]);

  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!agreed || !scrolledToBottom) return;
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch("/api/terms/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll_number: roll }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to accept");
      setAccepted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#050008",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 99999, color: "#9b9aa3", fontFamily: "DM Sans, sans-serif",
      }}>
        <div style={{
          width: 28, height: 28, border: "2px solid rgba(253,28,0,.2)",
          borderTopColor: "#fd1c00", borderRadius: "50%",
          animation: "tg-spin .8s linear infinite",
        }} />
        <style jsx>{`@keyframes tg-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (accepted) return <>{children}</>;

  return (
    <>
      <style jsx global>{`
        body { overflow: hidden !important; }
        .tg-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(5,0,8,.92);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          font-family: "DM Sans", system-ui, sans-serif;
          animation: tg-fade .25s ease;
        }
        @keyframes tg-fade { from { opacity: 0; } to { opacity: 1; } }
        .tg-modal {
          width: 100%; max-width: 720px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          overflow: hidden;
          display: flex; flex-direction: column;
          max-height: 90vh;
          box-shadow: 0 30px 80px rgba(0,0,0,.6);
        }
        .tg-head {
          padding: 24px 28px 20px;
          background: linear-gradient(135deg, rgba(238,167,39,.08), rgba(253,28,0,.06));
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .tg-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 600; letter-spacing: .15em;
          color: #eea727; text-transform: uppercase;
          padding: 5px 10px; border: 1px solid rgba(238,167,39,.3);
          border-radius: 100px; background: rgba(238,167,39,.06);
        }
        .tg-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #eea727; box-shadow: 0 0 6px #eea727; }
        .tg-h1 { font-size: 22px; font-weight: 700; margin: 14px 0 6px; color: #ededed; letter-spacing: -.01em; }
        .tg-sub { font-size: 13px; color: #9b9aa3; margin: 0; line-height: 1.5; }
        .tg-body {
          flex: 1; overflow-y: auto;
          padding: 22px 28px;
          color: #d4d3d8; font-size: 13.5px; line-height: 1.65;
        }
        .tg-body::-webkit-scrollbar { width: 6px; }
        .tg-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }
        .tg-section { margin-bottom: 22px; }
        .tg-h2 {
          font-size: 13px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #fd1c00;
          margin: 0 0 10px;
        }
        .tg-body ul { padding-left: 18px; margin: 8px 0; }
        .tg-body li { margin-bottom: 6px; }
        .tg-body strong { color: #ededed; }
        .tg-foot {
          padding: 18px 28px 22px;
          border-top: 1px solid rgba(255,255,255,.08);
          background: rgba(0,0,0,.2);
        }
        .tg-check {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; margin-bottom: 14px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px;
          background: rgba(255,255,255,.02);
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .tg-check:hover { border-color: rgba(238,167,39,.4); }
        .tg-check input { margin-top: 2px; accent-color: #fd1c00; flex-shrink: 0; }
        .tg-check-lab { font-size: 13px; color: #d4d3d8; line-height: 1.5; }
        .tg-check-lab strong { color: #ededed; }
        .tg-btn {
          width: 100%;
          padding: 13px 18px;
          background: #fd1c00;
          border: none; color: #fff;
          font-family: inherit; font-size: 14px; font-weight: 600;
          letter-spacing: .04em;
          border-radius: 8px;
          cursor: pointer;
          transition: background .15s, opacity .15s;
        }
        .tg-btn:hover:not(:disabled) { background: #e51a00; }
        .tg-btn:disabled { opacity: .35; cursor: not-allowed; }
        .tg-hint {
          font-size: 11.5px; color: #6b6a73; text-align: center;
          margin-top: 10px; letter-spacing: .02em;
        }
        .tg-err {
          margin-top: 10px; padding: 10px 12px;
          background: rgba(253,28,0,.08); border: 1px solid rgba(253,28,0,.3);
          border-radius: 6px; font-size: 12px; color: #fd1c00;
        }
        .tg-scroll-cue {
          font-size: 11px; color: #eea727;
          margin-bottom: 10px; letter-spacing: .08em; text-transform: uppercase;
          font-weight: 600; display: ${scrolledToBottom ? "none" : "block"};
        }
      `}</style>
      <div className="tg-overlay">
        <div className="tg-modal">
          <div className="tg-head">
            <span className="tg-eyebrow">
              <span className="tg-eyebrow-dot" />
              Mandatory Acknowledgement
            </span>
            <h2 className="tg-h1">Project Space Trainee Guidelines</h2>
            <p className="tg-sub">
              Please read the guidelines below carefully. You must scroll to the bottom and accept
              before continuing to your dashboard.
            </p>
          </div>

          <div className="tg-body" onScroll={handleScroll}>
            <div className="tg-section">
              <h3 className="tg-h2">Grooming & Dress Code</h3>
              <ul>
                <li><strong>Hair:</strong> Must be neatly trimmed and well-groomed.</li>
                <li><strong>Shaving:</strong> Trainees must be clean-shaven at all times.</li>
                <li><strong>Attire:</strong> Prescribed dress code (with shoes & ID card) must be followed from 9:30 AM until dinner.</li>
                <li>Day-wise dress code is published on the Event Info page.</li>
              </ul>
            </div>

            <div className="tg-section">
              <h3 className="tg-h2">Attendance & Punctuality</h3>
              <ul>
                <li><strong>100% attendance</strong> across all 7 days is mandatory.</li>
                <li>Project Space schedule must be followed without exception.</li>
                <li>Late arrivals require immediate approval from your Project Mentor.</li>
              </ul>
            </div>

            <div className="tg-section">
              <h3 className="tg-h2">Code of Conduct</h3>
              <ul>
                <li><strong>On-Site:</strong> No shouting on the Project Space floor or Technical Hub building.</li>
                <li><strong>In Transit:</strong> Maintain quiet while commuting to hostel or meals.</li>
                <li><strong>At the Hostel:</strong> Especially during night hours.</li>
                <li><strong>Movement:</strong> No unnecessary roaming or crowding in common areas.</li>
                <li><strong>Littering:</strong> Strictly prohibited. Use designated bins for all waste.</li>
              </ul>
            </div>

            <div className="tg-section">
              <h3 className="tg-h2">Internet & Device Usage Policy</h3>
              <ul>
                <li><strong>Project work only:</strong> Use internet exclusively for project & research.</li>
                <li>No obscene, offensive, or illegal content — uploading or downloading.</li>
                <li>No copyrighted material (movies, music, software, etc.).</li>
                <li>No social media access unless directed by mentors.</li>
                <li>Do not access others' sensitive information.</li>
              </ul>
            </div>

            <div className="tg-section">
              <h3 className="tg-h2">Female Trainee Guidelines</h3>
              <ul>
                <li>Night escort by campus security after night sessions.</li>
                <li>Priority dispersal — female trainees leave first in every session.</li>
                <li>Final attendance must be given before dispersal.</li>
                <li>Zero tolerance for harassment, inappropriate comments, teasing or misconduct.</li>
                <li>Report any incident to female coordinators — confidentiality guaranteed.</li>
              </ul>
            </div>

            <div className="tg-section">
              <h3 className="tg-h2">Consequences of Violation</h3>
              <ul>
                <li><strong>Confiscation:</strong> Personal mobile phones and laptops will be seized.</li>
                <li><strong>Termination:</strong> Trainee will be removed from Project Space and will not receive any project-related completion certificates.</li>
                <li>Premises are under <strong>CCTV surveillance</strong> at all times.</li>
              </ul>
            </div>

            <div className="tg-section" style={{ paddingBottom: 8 }}>
              <h3 className="tg-h2">Acknowledgement</h3>
              <p>
                By accepting these guidelines, I confirm that I have read, understood, and agree to
                abide by all rules of Project Space Season 8. I understand that violations may result
                in disciplinary action up to and including termination from the program.
              </p>
            </div>
          </div>

          <div className="tg-foot">
            {!scrolledToBottom && (
              <div className="tg-scroll-cue">↓ Please scroll down to read all guidelines</div>
            )}
            <label className="tg-check" style={{ opacity: scrolledToBottom ? 1 : .5, pointerEvents: scrolledToBottom ? "auto" : "none" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={!scrolledToBottom}
              />
              <span className="tg-check-lab">
                I have read and agree to the <strong>Project Space Trainee Guidelines</strong>.
                I understand that this acknowledgement is recorded with my roll number and timestamp.
              </span>
            </label>
            <button
              className="tg-btn"
              disabled={!agreed || !scrolledToBottom || submitting}
              onClick={handleAccept}
            >
              {submitting ? "Recording..." : "I Accept — Continue to Dashboard"}
            </button>
            {error && <div className="tg-err">{error}</div>}
            <div className="tg-hint">Roll: {roll || "—"}</div>
          </div>
        </div>
      </div>
    </>
  );
}