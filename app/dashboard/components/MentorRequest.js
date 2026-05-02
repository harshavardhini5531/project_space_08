"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ============================================================
   MENTOR REQUEST — Student / Leader page
   Path: app/dashboard/components/MentorRequest.js
   Theme matches dashboard:
     - rgba(13,10,20,.6) cards
     - #fd1c00 -> #fa0068 hero gradient
     - DM Sans + Astro fonts, line icons only
   ============================================================ */

const PRIORITY_OPTIONS = [
  { id: "Low",    label: "Low",    color: "#10b981", desc: "Can wait — nice to have help" },
  { id: "Medium", label: "Medium", color: "#faa000", desc: "Slowing us down — need help soon" },
  { id: "High",   label: "High",   color: "#fd1c00", desc: "Blocked — need help right away" },
];

/* ---------- ICONS ---------- */
const I = {
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starOutline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  lifebuoy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  pulse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  coins: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>,
};

/* ====================================================================== */
export default function MentorRequest({ user }) {
  const teamNumber = user?.teamNumber || user?.team_number;
  const technology = user?.technology;
  const isLeader = user?.isLeader || user?.is_leader || (user?.roll_number === user?.leader_roll);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(20);
  const [mentorCount, setMentorCount] = useState(0);

  // form state
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // modals
  const [selfResolveId, setSelfResolveId] = useState(null);
  const [rateRequest, setRateRequest] = useState(null);

  // toasts
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const hasActive = requests.some((r) => r.status === "Pending" || r.status === "Accepted");

  /* ---------- fetch ---------- */
  const fetchRequests = useCallback(async () => {
    if (!teamNumber) return;
    try {
      const res = await fetch(`/api/mentor-request?team_number=${encodeURIComponent(teamNumber)}`);
      const json = await res.json();
      if (json.success) setRequests(json.requests || []);
    } catch (e) {
      console.error("[MentorRequest] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [teamNumber]);

  const fetchCredits = useCallback(async () => {
    if (!teamNumber) return;
    try {
      const res = await fetch(`/api/team/credits?team_number=${encodeURIComponent(teamNumber)}`);
      if (res.ok) {
        const json = await res.json();
        if (typeof json.credits === "number") setCredits(json.credits);
      }
    } catch {}
  }, [teamNumber]);

  const fetchMentorCount = useCallback(async () => {
    if (!technology) return;
    try {
      const res = await fetch(`/api/mentors/count?technology=${encodeURIComponent(technology)}`);
      if (res.ok) {
        const json = await res.json();
        if (typeof json.count === "number") setMentorCount(json.count);
      }
    } catch {}
  }, [technology]);

  useEffect(() => {
    fetchRequests();
    fetchCredits();
    fetchMentorCount();
  }, [fetchRequests, fetchCredits, fetchMentorCount]);

  // poll every 5s when there's an active request
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => {
      fetchRequests();
      fetchCredits();
    }, 5000);
    return () => clearInterval(t);
  }, [hasActive, fetchRequests, fetchCredits]);

  /* ---------- toast ---------- */
  const showToast = (kind, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    setFormError("");
    if (description.trim().length < 10) {
      setFormError("Description must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_number: teamNumber,
          technology,
          priority,
          issue_description: description.trim(),
          requested_by_roll: user?.roll_number,
          requested_by_name: user?.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Failed to submit");
        setSubmitting(false);
        return;
      }
      showToast("success", `Request sent to ${json.notified_mentors} mentors`);
      setDescription("");
      setPriority("Medium");
      await fetchRequests();
    } catch (e) {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- self-resolve ---------- */
  const confirmSelfResolve = async () => {
    if (!selfResolveId) return;
    try {
      const res = await fetch("/api/mentor-request/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: selfResolveId,
          resolved_by: "self",
          actor_id: user?.roll_number,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error || "Failed to mark as self-resolved");
      } else {
        showToast("success", "Marked as self-resolved");
        await fetchRequests();
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setSelfResolveId(null);
    }
  };

  /* ---------- rate ---------- */
  const submitRating = async (rating) => {
    if (!rateRequest) return;
    try {
      const res = await fetch("/api/mentor-request/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: rateRequest.id,
          rating,
          rater_roll: user?.roll_number,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error || "Failed to submit rating");
      } else {
        showToast("success", "Thanks for the feedback");
        await fetchRequests();
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setRateRequest(null);
    }
  };

  /* ---------- stats ---------- */
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending" || r.status === "Accepted").length,
    mentorResolved: requests.filter((r) => r.status === "Mentor Resolved").length,
    selfResolved: requests.filter((r) => r.status === "Self Resolved").length,
  };

  return (
    <>
      <style jsx global>{`
        @keyframes mr-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes mr-pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(253,28,0,.5); } 50% { box-shadow: 0 0 0 8px rgba(253,28,0,0); } }
        @keyframes mr-pulse-amber { 0%, 100% { box-shadow: 0 0 0 0 rgba(250,160,0,.45); } 50% { box-shadow: 0 0 0 8px rgba(250,160,0,0); } }
        @keyframes mr-spin { to { transform: rotate(360deg); } }
        @keyframes mr-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .mr { font-family: 'DM Sans', system-ui, sans-serif; color: #fff; max-width: 1100px; margin: 0 auto; padding-bottom: 80px; }
        .mr *, .mr *::before, .mr *::after { box-sizing: border-box; }

        /* ---------- HERO ---------- */
        .mr-hero {
          position: relative;
          padding: 30px 28px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fd1c00 0%, #fa0068 50%, #1a0a18 100%);
          overflow: hidden;
          margin-bottom: 22px;
          box-shadow: 0 8px 32px rgba(253,28,0,.15);
          animation: mr-fade-up .5s ease both;
        }
        .mr-hero::before { content: ""; position: absolute; top: -100px; right: -100px; width: 380px; height: 380px; background: radial-gradient(circle, rgba(255,255,255,.10), transparent 60%); pointer-events: none; }
        .mr-hero::after { content: ""; position: absolute; bottom: -60px; left: -60px; width: 240px; height: 240px; background: radial-gradient(circle, rgba(0,0,0,.25), transparent 65%); pointer-events: none; }
        .mr-hero-inner { position: relative; z-index: 1; display: flex; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
        .mr-hero-info { flex: 1; min-width: 280px; }
        .mr-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .18em;
          color: #fff; text-transform: uppercase;
          padding: 5px 11px;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 100px;
          background: rgba(0,0,0,.2);
          backdrop-filter: blur(6px);
        }
        .mr-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px rgba(255,255,255,.6); }
        .mr-h1 {
          font-family: 'Astro', 'DM Sans', sans-serif;
          font-size: clamp(24px, 3.8vw, 36px);
          line-height: 1.05; letter-spacing: 1px;
          font-weight: 800; margin: 12px 0 8px;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,.25);
        }
        .mr-sub { font-size: 13.5px; color: rgba(255,255,255,.85); line-height: 1.55; max-width: 460px; margin: 0; }

        .mr-hero-side {
          display: flex; flex-direction: column; gap: 10px;
          min-width: 180px;
        }
        .mr-hero-card {
          padding: 14px 16px;
          background: rgba(0,0,0,.28);
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 12px;
          backdrop-filter: blur(8px);
          display: flex; align-items: center; gap: 12px;
        }
        .mr-hero-card-icn {
          width: 36px; height: 36px; padding: 8px;
          background: rgba(255,255,255,.12);
          border-radius: 8px;
          color: #fff;
          flex-shrink: 0;
        }
        .mr-hero-card-lab { font-size: 9.5px; letter-spacing: .14em; color: rgba(255,255,255,.7); text-transform: uppercase; font-weight: 600; }
        .mr-hero-card-val { font-size: 18px; font-weight: 700; color: #fff; line-height: 1.1; margin-top: 2px; }
        .mr-hero-card-sub { font-size: 11px; color: rgba(255,255,255,.65); margin-top: 2px; }

        /* ---------- FORM CARD ---------- */
        .mr-card {
          background: rgba(13,10,20,.6);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          overflow: hidden;
          animation: mr-fade-up .55s ease both;
        }
        .mr-form { padding: 22px 24px; }
        .mr-form-h {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 6px;
        }
        .mr-form-icn {
          width: 30px; height: 30px; padding: 7px;
          background: linear-gradient(135deg, rgba(253,28,0,.15), rgba(250,160,0,.06));
          border: 1px solid rgba(253,28,0,.25);
          border-radius: 8px;
          color: #fd1c00;
          flex-shrink: 0;
        }
        .mr-form-title { font-size: 15px; font-weight: 700; color: #fff; }
        .mr-form-sub { font-size: 12.5px; color: rgba(255,255,255,.5); margin: 0 0 18px; }

        .mr-label { font-size: 10.5px; letter-spacing: .14em; color: rgba(255,255,255,.55); text-transform: uppercase; font-weight: 700; margin-bottom: 9px; }

        .mr-priority-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 18px; }
        @media (max-width: 600px) { .mr-priority-row { grid-template-columns: 1fr; } }
        .mr-prio {
          padding: 12px 14px;
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all .18s;
          text-align: left;
          font-family: inherit;
          color: rgba(255,255,255,.7);
        }
        .mr-prio:hover { border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.04); }
        .mr-prio-top { display: flex; align-items: center; gap: 8px; }
        .mr-prio-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .mr-prio-name { font-size: 13px; font-weight: 700; color: #fff; }
        .mr-prio-desc { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 5px; line-height: 1.4; }
        .mr-prio.active {
          background: rgba(255,255,255,.05);
        }
        .mr-prio.active.low    { border-color: #10b981; box-shadow: 0 0 0 1px rgba(16,185,129,.4); }
        .mr-prio.active.medium { border-color: #faa000; box-shadow: 0 0 0 1px rgba(250,160,0,.4); }
        .mr-prio.active.high   { border-color: #fd1c00; box-shadow: 0 0 0 1px rgba(253,28,0,.4); }

        .mr-textarea {
          width: 100%;
          min-height: 110px;
          padding: 14px 16px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          color: #fff;
          font-family: inherit;
          font-size: 13.5px;
          line-height: 1.55;
          resize: vertical;
          outline: none;
          transition: border-color .18s, background .18s;
        }
        .mr-textarea:focus { border-color: #faa000; background: rgba(238,167,39,.04); }
        .mr-textarea::placeholder { color: rgba(255,255,255,.25); }

        .mr-form-foot {
          margin-top: 18px;
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .mr-foot-info {
          flex: 1; min-width: 240px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .mr-foot-line { font-size: 12px; color: rgba(255,255,255,.6); display: flex; align-items: center; gap: 7px; line-height: 1.4; }
        .mr-foot-line svg { width: 13px; height: 13px; color: #faa000; flex-shrink: 0; }
        .mr-foot-line strong { color: #fff; font-weight: 700; }

        .mr-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 22px;
          background: linear-gradient(135deg, #fd1c00, #faa000);
          color: #fff;
          font-family: inherit; font-size: 13px; font-weight: 700;
          border: none; border-radius: 10px;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s, opacity .15s;
          box-shadow: 0 4px 14px rgba(253,28,0,.3);
          letter-spacing: .02em;
        }
        .mr-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(253,28,0,.4); }
        .mr-btn:disabled { opacity: .55; cursor: not-allowed; }
        .mr-btn-icn { width: 14px; height: 14px; }
        .mr-btn-spin { animation: mr-spin .9s linear infinite; }

        .mr-form-error {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.3);
          border-left: 3px solid #fd1c00;
          border-radius: 8px;
          color: #fff;
          font-size: 12.5px;
          display: flex; align-items: flex-start; gap: 9px;
        }
        .mr-form-error svg { width: 16px; height: 16px; color: #fd1c00; flex-shrink: 0; margin-top: 1px; }

        /* read-only banner for non-leaders */
        .mr-readonly {
          padding: 14px 18px;
          background: rgba(238,167,39,.06);
          border: 1px solid rgba(238,167,39,.2);
          border-left: 3px solid #faa000;
          border-radius: 10px;
          font-size: 13px; color: rgba(255,255,255,.8);
          display: flex; align-items: flex-start; gap: 11px;
          margin-bottom: 22px;
        }
        .mr-readonly svg { width: 18px; height: 18px; color: #faa000; flex-shrink: 0; margin-top: 1px; }
        .mr-readonly strong { color: #faa000; font-weight: 700; }

        /* ---------- STATS ---------- */
        .mr-stats {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 10px; margin: 22px 0 18px;
        }
        @media (max-width: 700px) { .mr-stats { grid-template-columns: repeat(2,1fr); } }
        .mr-stat {
          padding: 14px 16px;
          background: rgba(13,10,20,.6);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          transition: border-color .2s;
        }
        .mr-stat:hover { border-color: rgba(255,255,255,.12); }
        .mr-stat-lab { font-size: 9.5px; letter-spacing: .15em; color: rgba(255,255,255,.45); text-transform: uppercase; font-weight: 700; }
        .mr-stat-num { font-size: 22px; font-weight: 800; color: #fff; margin-top: 5px; line-height: 1; font-variant-numeric: tabular-nums; }
        .mr-stat-num.amber { color: #faa000; }
        .mr-stat-num.green { color: #10b981; }

        /* ---------- TABLE ---------- */
        .mr-table-wrap { background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; }
        .mr-table-h {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: #fff;
          display: flex; align-items: center; gap: 9px;
        }
        .mr-table-h-icn { width: 15px; height: 15px; color: #faa000; }

        .mr-table { width: 100%; border-collapse: collapse; }
        .mr-table thead th {
          padding: 11px 14px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          text-align: left;
          color: rgba(255,255,255,.45);
          background: rgba(0,0,0,.18);
          border-bottom: 1px solid rgba(255,255,255,.06);
          white-space: nowrap;
        }
        .mr-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,.04);
          transition: background .15s;
        }
        .mr-table tbody tr:last-child { border-bottom: none; }
        .mr-table tbody tr:hover { background: rgba(255,255,255,.015); }
        .mr-table tbody tr.active {
          background: linear-gradient(90deg, rgba(253,28,0,.05), transparent 80%);
        }
        .mr-table td {
          padding: 13px 14px;
          font-size: 12.5px;
          color: rgba(255,255,255,.85);
          vertical-align: middle;
        }

        .mr-prio-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
        }
        .mr-prio-tag-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .mr-status-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
          white-space: nowrap;
        }
        .mr-status-tag-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .mr-status-tag.pending { background: rgba(250,160,0,.1); color: #faa000; border: 1px solid rgba(250,160,0,.3); }
        .mr-status-tag.pending .mr-status-tag-dot { background: #faa000; animation: mr-pulse-amber 2s ease-in-out infinite; }
        .mr-status-tag.accepted { background: rgba(59,130,246,.1); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }
        .mr-status-tag.accepted .mr-status-tag-dot { background: #60a5fa; animation: mr-pulse-amber 2s ease-in-out infinite; }
        .mr-status-tag.resolved { background: rgba(16,185,129,.1); color: #10b981; border: 1px solid rgba(16,185,129,.3); }
        .mr-status-tag.resolved .mr-status-tag-dot { background: #10b981; }
        .mr-status-tag.self { background: rgba(167,139,250,.1); color: #a78bfa; border: 1px solid rgba(167,139,250,.3); }
        .mr-status-tag.self .mr-status-tag-dot { background: #a78bfa; }

        .mr-mentors-stack {
          display: inline-flex; align-items: center;
        }
        .mr-mentor-chip {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #fd1c00, #faa000);
          border: 2px solid rgba(13,10,20,.95);
          margin-left: -8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: #fff;
          font-variant-numeric: tabular-nums;
        }
        .mr-mentor-chip:first-child { margin-left: 0; }
        .mr-mentor-chip.more { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); border-color: rgba(13,10,20,.95); }
        .mr-mentor-count { font-size: 11px; color: rgba(255,255,255,.5); margin-left: 8px; }

        .mr-action-btn {
          padding: 6px 12px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          color: rgba(255,255,255,.85);
          font-family: inherit; font-size: 11.5px; font-weight: 600;
          border-radius: 7px;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .mr-action-btn:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.2); color: #fff; }
        .mr-action-btn.rate {
          background: linear-gradient(135deg, rgba(250,160,0,.18), rgba(253,28,0,.08));
          border-color: rgba(250,160,0,.4);
          color: #faa000;
        }
        .mr-action-btn.rate:hover { background: linear-gradient(135deg, rgba(250,160,0,.28), rgba(253,28,0,.14)); color: #fff; }

        .mr-rating-stars { display: inline-flex; gap: 2px; color: #faa000; }
        .mr-rating-stars svg { width: 14px; height: 14px; }
        .mr-rating-stars .empty { color: rgba(255,255,255,.15); }

        .mr-empty {
          padding: 50px 24px;
          text-align: center;
          color: rgba(255,255,255,.45);
        }
        .mr-empty-icn {
          width: 44px; height: 44px;
          padding: 11px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          color: rgba(255,255,255,.4);
          margin: 0 auto 14px;
        }
        .mr-empty-h { font-size: 14px; font-weight: 600; color: rgba(255,255,255,.7); margin-bottom: 4px; }
        .mr-empty-p { font-size: 12.5px; color: rgba(255,255,255,.4); }

        .mr-loading { padding: 40px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }

        /* mobile: card layout */
        @media (max-width: 720px) {
          .mr-table { display: none; }
          .mr-cards { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
        }
        @media (min-width: 721px) {
          .mr-cards { display: none; }
        }
        .mr-rcard {
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .mr-rcard.active { border-color: rgba(253,28,0,.3); background: rgba(253,28,0,.04); }
        .mr-rcard-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .mr-rcard-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; gap: 10px; }
        .mr-rcard-lab { color: rgba(255,255,255,.5); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; }
        .mr-rcard-val { color: rgba(255,255,255,.9); text-align: right; }

        /* ---------- MODAL ---------- */
        .mr-modal-back {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: mr-fade-in .15s ease;
        }
        .mr-modal {
          width: 100%; max-width: 460px;
          background: linear-gradient(180deg, #11091a, #0a0610);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          overflow: hidden;
          animation: mr-fade-up .25s ease;
          box-shadow: 0 12px 48px rgba(0,0,0,.55);
        }
        .mr-modal-h {
          padding: 20px 24px 8px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .mr-modal-title { font-size: 17px; font-weight: 700; color: #fff; }
        .mr-modal-close {
          width: 30px; height: 30px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.6);
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 7px;
          transition: all .15s;
        }
        .mr-modal-close:hover { background: rgba(255,255,255,.08); color: #fff; }
        .mr-modal-body { padding: 8px 24px 20px; }
        .mr-modal-text { font-size: 13.5px; color: rgba(255,255,255,.7); line-height: 1.6; margin: 0 0 18px; }
        .mr-modal-foot {
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,.06);
          display: flex; gap: 10px; justify-content: flex-end;
        }
        .mr-btn-secondary {
          padding: 10px 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.85);
          font-family: inherit; font-size: 13px; font-weight: 600;
          border-radius: 9px;
          cursor: pointer;
          transition: all .15s;
        }
        .mr-btn-secondary:hover { background: rgba(255,255,255,.08); color: #fff; }

        /* ---------- RATING MODAL ---------- */
        .mr-rate-stars {
          display: flex; justify-content: center;
          gap: 8px; margin: 12px 0 18px;
        }
        .mr-rate-star {
          background: transparent; border: none;
          color: rgba(255,255,255,.15);
          cursor: pointer;
          padding: 6px;
          transition: transform .15s, color .15s;
        }
        .mr-rate-star:hover { transform: scale(1.15); }
        .mr-rate-star.lit { color: #faa000; }
        .mr-rate-star svg { width: 36px; height: 36px; }
        .mr-rate-mentor {
          padding: 12px 16px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          margin-bottom: 4px;
          font-size: 13px;
          color: rgba(255,255,255,.85);
          text-align: center;
        }
        .mr-rate-mentor strong { color: #faa000; font-weight: 700; }

        /* ---------- TOAST ---------- */
        .mr-toast {
          position: fixed; top: 24px; right: 24px;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          color: #fff;
          z-index: 10000;
          animation: mr-fade-up .25s ease;
          backdrop-filter: blur(8px);
          display: flex; align-items: center; gap: 9px;
          max-width: 360px;
        }
        .mr-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
        .mr-toast.success { background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.4); color: #10b981; }
        .mr-toast.error { background: rgba(253,28,0,.15); border: 1px solid rgba(253,28,0,.4); color: #ff5535; }
        @media (max-width: 480px) { .mr-toast { left: 16px; right: 16px; max-width: none; } }
      `}</style>

      <div className="mr">
        {/* HERO */}
        <div className="mr-hero">
          <div className="mr-hero-inner">
            <div className="mr-hero-info">
              <span className="mr-eyebrow"><span className="mr-eyebrow-dot" />Mentor Request</span>
              <h1 className="mr-h1">Stuck somewhere? Get help fast.</h1>
              <p className="mr-sub">
                Send a request to all <strong style={{ color: "#fff" }}>{technology || "your track"}</strong> mentors.
                The first one to claim it will be on their way to your team.
              </p>
            </div>
            <div className="mr-hero-side">
              <div className="mr-hero-card">
                <span className="mr-hero-card-icn">{I.coins}</span>
                <div>
                  <div className="mr-hero-card-lab">Credits</div>
                  <div className="mr-hero-card-val">{credits} / 20</div>
                  <div className="mr-hero-card-sub">−2 per mentor resolution</div>
                </div>
              </div>
              <div className="mr-hero-card">
                <span className="mr-hero-card-icn">{I.user}</span>
                <div>
                  <div className="mr-hero-card-lab">Mentors in track</div>
                  <div className="mr-hero-card-val">{mentorCount || "—"}</div>
                  <div className="mr-hero-card-sub">{technology || "Loading…"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM (leader) or read-only notice (member) */}
        {isLeader ? (
          <div className="mr-card">
            <div className="mr-form">
              <div className="mr-form-h">
                <span className="mr-form-icn">{I.lifebuoy}</span>
                <span className="mr-form-title">Request Mentor Help</span>
              </div>
              <p className="mr-form-sub">All mentors in your track will be notified instantly.</p>

              <div className="mr-label">Priority</div>
              <div className="mr-priority-row">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    className={`mr-prio ${priority === p.id ? "active " + p.id.toLowerCase() : ""}`}
                    onClick={() => setPriority(p.id)}
                    type="button"
                  >
                    <div className="mr-prio-top">
                      <span className="mr-prio-dot" style={{ background: p.color }} />
                      <span className="mr-prio-name">{p.label}</span>
                    </div>
                    <div className="mr-prio-desc">{p.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mr-label">Describe your issue</div>
              <textarea
                className="mr-textarea"
                placeholder="Explain what you're stuck on. What have you tried? Where exactly is the blocker?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
              />

              {formError && (
                <div className="mr-form-error">
                  {I.alert}
                  <span>{formError}</span>
                </div>
              )}

              <div className="mr-form-foot">
                <div className="mr-foot-info">
                  <div className="mr-foot-line">
                    {I.user}
                    <span>Will notify <strong>{mentorCount || "—"} mentors</strong> in {technology}</span>
                  </div>
                  <div className="mr-foot-line">
                    {I.coins}
                    <span><strong>2 credits</strong> deducted only on mentor resolution · No deduction if self-resolved</span>
                  </div>
                </div>
                <button className="mr-btn" onClick={handleSubmit} disabled={submitting || hasActive}>
                  {submitting ? (
                    <>
                      <span className="mr-btn-icn mr-btn-spin">{I.zap}</span>
                      <span>Sending…</span>
                    </>
                  ) : hasActive ? (
                    <>
                      <span className="mr-btn-icn">{I.alert}</span>
                      <span>Active request open</span>
                    </>
                  ) : (
                    <>
                      <span>Send Request</span>
                      <span className="mr-btn-icn">{I.send}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mr-readonly">
            {I.alert}
            <div>
              <strong>Members can view only.</strong> Only the team leader can submit mentor requests.
              You'll see live updates here as your team raises and resolves requests.
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="mr-stats">
          <div className="mr-stat"><div className="mr-stat-lab">Total</div><div className="mr-stat-num">{stats.total}</div></div>
          <div className="mr-stat"><div className="mr-stat-lab">Active</div><div className="mr-stat-num amber">{stats.pending}</div></div>
          <div className="mr-stat"><div className="mr-stat-lab">Mentor Solved</div><div className="mr-stat-num green">{stats.mentorResolved}</div></div>
          <div className="mr-stat"><div className="mr-stat-lab">Self Solved</div><div className="mr-stat-num">{stats.selfResolved}</div></div>
        </div>

        {/* TABLE */}
        <div className="mr-table-wrap">
          <div className="mr-table-h">
            <span className="mr-table-h-icn">{I.pulse}</span>
            Request History
          </div>

          {loading ? (
            <div className="mr-loading">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="mr-empty">
              <div className="mr-empty-icn">{I.lifebuoy}</div>
              <div className="mr-empty-h">No requests yet</div>
              <div className="mr-empty-p">When you submit one, it'll appear here with live status.</div>
            </div>
          ) : (
            <>
              <table className="mr-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Sent To</th>
                    <th>Accepted By</th>
                    <th>Resolution</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <RequestRow
                      key={r.id}
                      r={r}
                      isLeader={isLeader}
                      onSelfResolve={() => setSelfResolveId(r.id)}
                      onRate={() => setRateRequest(r)}
                    />
                  ))}
                </tbody>
              </table>
              {/* mobile cards */}
              <div className="mr-cards">
                {requests.map((r) => (
                  <RequestCard
                    key={r.id}
                    r={r}
                    isLeader={isLeader}
                    onSelfResolve={() => setSelfResolveId(r.id)}
                    onRate={() => setRateRequest(r)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SELF-RESOLVE MODAL */}
      {selfResolveId && (
        <div className="mr-modal-back" onClick={() => setSelfResolveId(null)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mr-modal-h">
              <span className="mr-modal-title">Mark as Self-Resolved?</span>
              <button className="mr-modal-close" onClick={() => setSelfResolveId(null)}>{I.x}</button>
            </div>
            <div className="mr-modal-body">
              <p className="mr-modal-text">
                You're saying your team figured this out. The request will be closed and mentors will be unable to claim it.
                <br /><br />
                <strong style={{ color: "#10b981" }}>No credits deducted.</strong>
              </p>
            </div>
            <div className="mr-modal-foot">
              <button className="mr-btn-secondary" onClick={() => setSelfResolveId(null)}>Cancel</button>
              <button className="mr-btn" onClick={confirmSelfResolve}>Yes, Self-Resolved</button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {rateRequest && (
        <RatingModal request={rateRequest} onClose={() => setRateRequest(null)} onSubmit={submitRating} />
      )}

      {/* TOAST */}
      {toast && (
        <div className={`mr-toast ${toast.kind}`}>
          {toast.kind === "success" ? I.check : I.alert}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

/* ====================================================================== */
function RequestRow({ r, isLeader, onSelfResolve, onRate }) {
  const isActive = r.status === "Pending" || r.status === "Accepted";
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  const statusClass = {
    "Pending": "pending",
    "Accepted": "accepted",
    "Mentor Resolved": "resolved",
    "Self Resolved": "self",
  }[r.status];

  const sentTo = r.sent_to || [];

  return (
    <tr className={isActive ? "active" : ""}>
      <td>
        <span className="mr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </td>
      <td>
        <MentorAvatars names={sentTo} />
      </td>
      <td>
        {r.mentor_name ? (
          <span style={{ color: "#fff", fontWeight: 600 }}>{r.mentor_name}</span>
        ) : (
          <span style={{ color: "rgba(255,255,255,.35)" }}>—</span>
        )}
      </td>
      <td>
        {r.resolved_at && r.accepted_at ? (
          <span style={{ color: "#10b981", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {formatDuration(r.accepted_at, r.resolved_at)}
          </span>
        ) : r.accepted_at ? (
          <LiveTimer since={r.accepted_at} />
        ) : (
          <span style={{ color: "rgba(255,255,255,.35)" }}>—</span>
        )}
      </td>
      <td>
        <span className={`mr-status-tag ${statusClass}`}>
          <span className="mr-status-tag-dot" />
          {r.status}
        </span>
      </td>
      <td>
        {r.status === "Mentor Resolved" && r.rating ? (
          <Stars rating={r.rating} />
        ) : (
          <span style={{ color: "rgba(255,255,255,.35)" }}>—</span>
        )}
      </td>
      <td style={{ textAlign: "right" }}>
        {isLeader && r.status === "Pending" && (
          <button className="mr-action-btn" onClick={onSelfResolve}>Self Resolved</button>
        )}
        {isLeader && r.status === "Mentor Resolved" && !r.rating && (
          <button className="mr-action-btn rate" onClick={onRate}>Rate</button>
        )}
      </td>
    </tr>
  );
}

function RequestCard({ r, isLeader, onSelfResolve, onRate }) {
  const isActive = r.status === "Pending" || r.status === "Accepted";
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  const statusClass = {
    "Pending": "pending",
    "Accepted": "accepted",
    "Mentor Resolved": "resolved",
    "Self Resolved": "self",
  }[r.status];

  return (
    <div className={`mr-rcard ${isActive ? "active" : ""}`}>
      <div className="mr-rcard-top">
        <span className="mr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
        <span className={`mr-status-tag ${statusClass}`}>
          <span className="mr-status-tag-dot" />
          {r.status}
        </span>
      </div>
      <div className="mr-rcard-row">
        <span className="mr-rcard-lab">Sent to</span>
        <span className="mr-rcard-val"><MentorAvatars names={r.sent_to || []} compact /></span>
      </div>
      {r.mentor_name && (
        <div className="mr-rcard-row">
          <span className="mr-rcard-lab">Accepted by</span>
          <span className="mr-rcard-val">{r.mentor_name}</span>
        </div>
      )}
      {r.resolved_at && r.accepted_at && (
        <div className="mr-rcard-row">
          <span className="mr-rcard-lab">Resolution</span>
          <span className="mr-rcard-val" style={{ color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
            {formatDuration(r.accepted_at, r.resolved_at)}
          </span>
        </div>
      )}
      {r.rating && (
        <div className="mr-rcard-row">
          <span className="mr-rcard-lab">Rating</span>
          <span className="mr-rcard-val"><Stars rating={r.rating} /></span>
        </div>
      )}
      {isLeader && (r.status === "Pending" || (r.status === "Mentor Resolved" && !r.rating)) && (
        <div style={{ marginTop: 10, textAlign: "right" }}>
          {r.status === "Pending" && (<button className="mr-action-btn" onClick={onSelfResolve}>Self Resolved</button>)}
          {r.status === "Mentor Resolved" && !r.rating && (<button className="mr-action-btn rate" onClick={onRate}>Rate Mentor</button>)}
        </div>
      )}
    </div>
  );
}

function MentorAvatars({ names, compact }) {
  if (!names || names.length === 0) return <span style={{ color: "rgba(255,255,255,.35)" }}>—</span>;
  const visible = names.slice(0, 3);
  const extra = names.length - visible.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span className="mr-mentors-stack">
        {visible.map((n, i) => (
          <span key={i} className="mr-mentor-chip" title={n}>{getInitials(n)}</span>
        ))}
        {extra > 0 && <span className="mr-mentor-chip more" title={names.slice(3).join(", ")}>+{extra}</span>}
      </span>
      {!compact && <span className="mr-mentor-count">{names.length} mentors</span>}
    </span>
  );
}

function Stars({ rating }) {
  return (
    <span className="mr-rating-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "" : "empty"}>{I.star}</span>
      ))}
    </span>
  );
}

function LiveTimer({ since }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ color: "#60a5fa", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
      {formatDuration(since, new Date().toISOString())} <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>active</span>
    </span>
  );
}

function RatingModal({ request, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await onSubmit(rating);
  };

  const display = hover || rating;

  return (
    <div className="mr-modal-back" onClick={onClose}>
      <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mr-modal-h">
          <span className="mr-modal-title">Rate your experience</span>
          <button className="mr-modal-close" onClick={onClose}>{I.x}</button>
        </div>
        <div className="mr-modal-body">
          <div className="mr-rate-mentor">
            Mentor <strong>{request.mentor_name}</strong> resolved your request.<br />
            How was the help?
          </div>
          <div className="mr-rate-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`mr-rate-star ${n <= display ? "lit" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                {I.star}
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.5)", margin: 0 }}>
            {display ? `${display} star${display > 1 ? "s" : ""}` : "Tap a star to rate"}
          </p>
        </div>
        <div className="mr-modal-foot">
          <button className="mr-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="mr-btn" onClick={handleSubmit} disabled={!rating || submitting}>
            {submitting ? "Submitting…" : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDuration(start, end) {
  const ms = new Date(end) - new Date(start);
  if (ms < 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}