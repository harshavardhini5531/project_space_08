"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ============================================================
   MENTOR — Help Requests page
   Path: app/mentor/dashboard/components/MentorHelpRequests.js
   Three sub-tabs: Incoming · My Active · History
   ============================================================ */

const I = {
  inbox: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  lifebuoy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 1 0-4 0v5"/><path d="M14 10V4a2 2 0 1 0-4 0v6"/><path d="M10 10.5V6a2 2 0 1 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
  pulse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
};

const TABS = [
  { id: "incoming", label: "Incoming", icon: I.inbox },
  { id: "active",   label: "My Active", icon: I.zap },
  { id: "history",  label: "History", icon: I.history },
];

/* ====================================================================== */
export default function MentorHelpRequests({ mentor, initialClaim }) {
  const [tab, setTab] = useState("incoming");
  const [requests, setRequests] = useState({ incoming: [], active: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [resolveId, setResolveId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const hasInitialClaim = useRef(false);

  const technology = mentor?.technology;
  const mentorId = mentor?.id;
  const mentorName = mentor?.name;

  /* ---------- toast ---------- */
  const showToast = useCallback((kind, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /* ---------- fetch ---------- */
  const fetchAll = useCallback(async () => {
    if (!technology || !mentorId) return;
    try {
      // Incoming = Pending in this technology
      const [pendingRes, activeRes, historyRes] = await Promise.all([
        fetch(`/api/mentor-request?technology=${encodeURIComponent(technology)}&status=Pending`),
        fetch(`/api/mentor-request?mentor_id=${mentorId}&status=Accepted`),
        fetch(`/api/mentor-request?mentor_id=${mentorId}&status=Mentor%20Resolved`),
      ]);

      const [pending, active, history] = await Promise.all([
        pendingRes.json(),
        activeRes.json(),
        historyRes.json(),
      ]);

      setRequests({
        incoming: pending.requests || [],
        active: active.requests || [],
        history: history.requests || [],
      });
    } catch (e) {
      console.error("[MentorHelpRequests] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [technology, mentorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // poll every 5s for incoming when on that tab, every 10s on active
  useEffect(() => {
    if (tab === "history") return;
    const interval = tab === "incoming" ? 5000 : 10000;
    const t = setInterval(fetchAll, interval);
    return () => clearInterval(t);
  }, [tab, fetchAll]);

  /* ---------- handle initial claim from email link ---------- */
  useEffect(() => {
    if (!initialClaim || hasInitialClaim.current) return;
    if (!mentorId) return;
    hasInitialClaim.current = true;
    handleClaim(initialClaim, /* silent */ true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClaim, mentorId]);

  /* ---------- claim ---------- */
  const handleClaim = async (requestId, silent = false) => {
    try {
      const res = await fetch("/api/mentor-request/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, mentor_id: mentorId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "already_claimed") {
          showToast("info", json.message || "Already claimed by another mentor");
        } else {
          showToast("error", json.error || "Failed to claim");
        }
        await fetchAll();
        return;
      }
      if (!silent) showToast("success", "Claimed. Go help the team.");
      setTab("active");
      await fetchAll();
    } catch {
      showToast("error", "Network error");
    }
  };

  /* ---------- resolve ---------- */
  const confirmResolve = async () => {
    if (!resolveId) return;
    try {
      const res = await fetch("/api/mentor-request/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: resolveId,
          resolved_by: "mentor",
          actor_id: mentorId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error || "Failed to resolve");
      } else {
        showToast("success", "Marked as resolved. 2 credits deducted from team.");
        await fetchAll();
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setResolveId(null);
    }
  };

  /* ---------- history stats ---------- */
  const historyStats = (() => {
    const list = requests.history;
    const total = list.length;
    const rated = list.filter((r) => r.rating);
    const avg = rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length) : 0;
    const resolutionTimes = list
      .filter((r) => r.accepted_at && r.resolved_at)
      .map((r) => (new Date(r.resolved_at) - new Date(r.accepted_at)) / 1000);
    const avgResolutionSec = resolutionTimes.length
      ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
      : 0;
    return { total, avg, ratedCount: rated.length, avgResolutionSec };
  })();

  return (
    <>
      <style jsx global>{`
        @keyframes mhr-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes mhr-pulse-amber { 0%, 100% { box-shadow: 0 0 0 0 rgba(250,160,0,.45); } 50% { box-shadow: 0 0 0 8px rgba(250,160,0,0); } }
        @keyframes mhr-pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(253,28,0,.45); } 50% { box-shadow: 0 0 0 8px rgba(253,28,0,0); } }
        @keyframes mhr-spin { to { transform: rotate(360deg); } }
        @keyframes mhr-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .mhr { font-family: 'DM Sans', system-ui, sans-serif; color: #fff; max-width: 1100px; margin: 0 auto; padding-bottom: 80px; }
        .mhr *, .mhr *::before, .mhr *::after { box-sizing: border-box; }

        /* HERO */
        .mhr-hero {
          position: relative;
          padding: 28px 28px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fd1c00 0%, #fa0068 50%, #1a0a18 100%);
          overflow: hidden;
          margin-bottom: 22px;
          box-shadow: 0 8px 32px rgba(253,28,0,.15);
          animation: mhr-fade-up .5s ease both;
        }
        .mhr-hero::before { content: ""; position: absolute; top: -100px; right: -100px; width: 380px; height: 380px; background: radial-gradient(circle, rgba(255,255,255,.10), transparent 60%); pointer-events: none; }
        .mhr-hero::after { content: ""; position: absolute; bottom: -60px; left: -60px; width: 240px; height: 240px; background: radial-gradient(circle, rgba(0,0,0,.25), transparent 65%); pointer-events: none; }
        .mhr-hero-inner { position: relative; z-index: 1; }
        .mhr-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .18em;
          color: #fff; text-transform: uppercase;
          padding: 5px 11px;
          border: 1px solid rgba(255,255,255,.3);
          border-radius: 100px;
          background: rgba(0,0,0,.2);
          backdrop-filter: blur(6px);
        }
        .mhr-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px rgba(255,255,255,.6); }
        .mhr-h1 {
          font-family: 'Astro', 'DM Sans', sans-serif;
          font-size: clamp(24px, 3.6vw, 32px);
          line-height: 1.05; letter-spacing: 1px;
          font-weight: 800; margin: 12px 0 8px;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,.25);
        }
        .mhr-sub { font-size: 13.5px; color: rgba(255,255,255,.85); line-height: 1.55; max-width: 520px; margin: 0; }

        /* TABS */
        .mhr-tabs {
          display: flex; gap: 4px; padding: 5px;
          background: rgba(13,10,20,.85);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 100px;
          width: fit-content;
          margin-bottom: 18px;
          backdrop-filter: blur(12px);
        }
        .mhr-tab {
          padding: 9px 18px;
          background: transparent; border: none;
          color: rgba(255,255,255,.5);
          font-family: inherit; font-size: 12.5px; font-weight: 600;
          border-radius: 100px;
          cursor: pointer;
          transition: all .15s;
          display: flex; align-items: center; gap: 8px;
          white-space: nowrap;
        }
        .mhr-tab:hover { color: #fff; }
        .mhr-tab.active { background: linear-gradient(135deg, #fd1c00, #faa000); color: #fff; box-shadow: 0 4px 14px rgba(253,28,0,.3); }
        .mhr-tab-icn { width: 14px; height: 14px; }
        .mhr-tab-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px;
          padding: 0 6px;
          background: rgba(255,255,255,.15);
          border-radius: 100px;
          font-size: 10px; font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .mhr-tab.active .mhr-tab-badge { background: rgba(255,255,255,.3); }
        .mhr-tab-badge.pulsing { background: #fd1c00; animation: mhr-pulse-red 2s ease-in-out infinite; }
        .mhr-tab.active .mhr-tab-badge.pulsing { background: rgba(255,255,255,.4); animation: none; }

        /* CARDS GRID */
        .mhr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 820px) { .mhr-grid { grid-template-columns: 1fr; } }

        .mhr-rcard {
          background: rgba(13,10,20,.6);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          padding: 18px 20px;
          transition: border-color .2s, transform .2s;
          animation: mhr-fade-up .35s ease both;
          display: flex; flex-direction: column; gap: 14px;
        }
        .mhr-rcard:hover { border-color: rgba(255,255,255,.12); transform: translateY(-2px); }
        .mhr-rcard.high { border-color: rgba(253,28,0,.3); box-shadow: 0 0 0 1px rgba(253,28,0,.15); }
        .mhr-rcard.medium { border-color: rgba(250,160,0,.25); }

        .mhr-rcard-top {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; flex-wrap: wrap;
        }
        .mhr-team-num {
          font-family: 'Astro', sans-serif;
          font-size: 17px; font-weight: 800; letter-spacing: 1px;
          color: #fff;
        }
        .mhr-team-meta { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 3px; }
        .mhr-team-meta strong { color: rgba(255,255,255,.85); font-weight: 600; }

        .mhr-prio-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 11px;
          border-radius: 100px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
          flex-shrink: 0;
        }
        .mhr-prio-tag-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .mhr-rcard-issue {
          padding: 12px 14px;
          background: rgba(0,0,0,.25);
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          font-size: 13px;
          color: rgba(255,255,255,.85);
          line-height: 1.55;
          max-height: 140px;
          overflow-y: auto;
        }
        .mhr-rcard-issue::-webkit-scrollbar { width: 4px; }
        .mhr-rcard-issue::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

        .mhr-rcard-meta {
          display: flex; gap: 18px; flex-wrap: wrap;
          font-size: 11.5px; color: rgba(255,255,255,.55);
        }
        .mhr-rcard-meta-item { display: flex; align-items: center; gap: 6px; }
        .mhr-rcard-meta-item svg { width: 13px; height: 13px; color: #faa000; flex-shrink: 0; }
        .mhr-rcard-meta-item strong { color: #fff; font-weight: 600; }

        .mhr-rcard-foot {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,.06);
          flex-wrap: wrap;
        }

        .mhr-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #fd1c00, #faa000);
          color: #fff;
          font-family: inherit; font-size: 12.5px; font-weight: 700;
          border: none; border-radius: 9px;
          cursor: pointer;
          transition: transform .15s, box-shadow .15s, opacity .15s;
          box-shadow: 0 4px 14px rgba(253,28,0,.3);
          letter-spacing: .02em;
        }
        .mhr-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(253,28,0,.4); }
        .mhr-btn:disabled { opacity: .55; cursor: not-allowed; }
        .mhr-btn-green {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 14px rgba(16,185,129,.3);
        }
        .mhr-btn-green:hover:not(:disabled) { box-shadow: 0 6px 18px rgba(16,185,129,.4); }
        .mhr-btn-icn { width: 13px; height: 13px; }

        .mhr-empty {
          padding: 60px 24px;
          text-align: center;
          background: rgba(13,10,20,.4);
          border: 1px dashed rgba(255,255,255,.08);
          border-radius: 14px;
        }
        .mhr-empty-icn {
          width: 56px; height: 56px;
          padding: 14px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          color: rgba(255,255,255,.4);
          margin: 0 auto 16px;
        }
        .mhr-empty-h { font-size: 15px; font-weight: 600; color: rgba(255,255,255,.8); margin-bottom: 5px; }
        .mhr-empty-p { font-size: 12.5px; color: rgba(255,255,255,.45); max-width: 360px; margin: 0 auto; line-height: 1.5; }

        .mhr-loading { padding: 40px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }

        /* HISTORY STATS */
        .mhr-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 10px; margin-bottom: 14px;
        }
        @media (max-width: 600px) { .mhr-stats { grid-template-columns: 1fr; } }
        .mhr-stat {
          padding: 16px 18px;
          background: rgba(13,10,20,.6);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          display: flex; align-items: center; gap: 14px;
        }
        .mhr-stat-icn {
          width: 38px; height: 38px; padding: 9px;
          background: rgba(238,167,39,.1);
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 9px;
          color: #faa000;
          flex-shrink: 0;
        }
        .mhr-stat-lab { font-size: 9.5px; letter-spacing: .14em; color: rgba(255,255,255,.5); text-transform: uppercase; font-weight: 700; }
        .mhr-stat-val { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.1; margin-top: 3px; font-variant-numeric: tabular-nums; }
        .mhr-stat-sub { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; }

        /* HISTORY TABLE */
        .mhr-table-wrap { background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; }
        .mhr-table { width: 100%; border-collapse: collapse; }
        .mhr-table thead th {
          padding: 11px 14px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          text-align: left;
          color: rgba(255,255,255,.45);
          background: rgba(0,0,0,.18);
          border-bottom: 1px solid rgba(255,255,255,.06);
          white-space: nowrap;
        }
        .mhr-table tbody tr { border-bottom: 1px solid rgba(255,255,255,.04); transition: background .15s; }
        .mhr-table tbody tr:last-child { border-bottom: none; }
        .mhr-table tbody tr:hover { background: rgba(255,255,255,.015); }
        .mhr-table td {
          padding: 13px 14px;
          font-size: 12.5px;
          color: rgba(255,255,255,.85);
          vertical-align: middle;
        }

        .mhr-rating-stars { display: inline-flex; gap: 2px; color: #faa000; }
        .mhr-rating-stars svg { width: 13px; height: 13px; }
        .mhr-rating-stars .empty { color: rgba(255,255,255,.15); }

        @media (max-width: 720px) {
          .mhr-table { display: none; }
          .mhr-history-cards { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
        }
        @media (min-width: 721px) {
          .mhr-history-cards { display: none; }
        }
        .mhr-hcard {
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .mhr-hcard-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
        .mhr-hcard-lab { color: rgba(255,255,255,.5); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; }
        .mhr-hcard-val { color: rgba(255,255,255,.9); }

        /* MODAL */
        .mhr-modal-back {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: mhr-fade-in .15s ease;
        }
        .mhr-modal {
          width: 100%; max-width: 460px;
          background: linear-gradient(180deg, #11091a, #0a0610);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 16px;
          overflow: hidden;
          animation: mhr-fade-up .25s ease;
          box-shadow: 0 12px 48px rgba(0,0,0,.55);
        }
        .mhr-modal-h { padding: 20px 24px 8px; display: flex; align-items: center; justify-content: space-between; }
        .mhr-modal-title { font-size: 17px; font-weight: 700; color: #fff; }
        .mhr-modal-close {
          width: 30px; height: 30px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          color: rgba(255,255,255,.6);
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 7px;
        }
        .mhr-modal-body { padding: 8px 24px 20px; }
        .mhr-modal-text { font-size: 13.5px; color: rgba(255,255,255,.7); line-height: 1.6; margin: 0; }
        .mhr-modal-foot { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,.06); display: flex; gap: 10px; justify-content: flex-end; }
        .mhr-btn-secondary {
          padding: 10px 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.1);
          color: rgba(255,255,255,.85);
          font-family: inherit; font-size: 13px; font-weight: 600;
          border-radius: 9px;
          cursor: pointer;
        }

        /* TOAST */
        .mhr-toast {
          position: fixed; top: 24px; right: 24px;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          color: #fff;
          z-index: 10000;
          animation: mhr-fade-up .25s ease;
          backdrop-filter: blur(8px);
          display: flex; align-items: center; gap: 9px;
          max-width: 360px;
        }
        .mhr-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
        .mhr-toast.success { background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.4); color: #10b981; }
        .mhr-toast.error { background: rgba(253,28,0,.15); border: 1px solid rgba(253,28,0,.4); color: #ff5535; }
        .mhr-toast.info { background: rgba(59,130,246,.15); border: 1px solid rgba(59,130,246,.4); color: #60a5fa; }
        @media (max-width: 480px) { .mhr-toast { left: 16px; right: 16px; max-width: none; } }
      `}</style>

      <div className="mhr">
        {/* HERO */}
        <div className="mhr-hero">
          <div className="mhr-hero-inner">
            <span className="mhr-eyebrow"><span className="mhr-eyebrow-dot" />Mentor Help Requests</span>
            <h1 className="mhr-h1">Teams need your expertise</h1>
            <p className="mhr-sub">
              See incoming requests in <strong style={{ color: "#fff" }}>{technology || "your track"}</strong>,
              claim what you can help with, and resolve when done. First mentor to claim wins.
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="mhr-tabs">
          {TABS.map((t) => {
            const count = requests[t.id]?.length || 0;
            const showPulse = t.id === "incoming" && count > 0;
            return (
              <button
                key={t.id}
                className={`mhr-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span className="mhr-tab-icn">{t.icon}</span>
                <span>{t.label}</span>
                {count > 0 && (
                  <span className={`mhr-tab-badge ${showPulse ? "pulsing" : ""}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="mhr-loading">Loading…</div>
        ) : tab === "incoming" ? (
          <IncomingTab list={requests.incoming} onClaim={handleClaim} technology={technology} />
        ) : tab === "active" ? (
          <ActiveTab list={requests.active} onResolve={(id) => setResolveId(id)} mentorName={mentorName} />
        ) : (
          <HistoryTab list={requests.history} stats={historyStats} />
        )}
      </div>

      {/* RESOLVE MODAL */}
      {resolveId && (
        <div className="mhr-modal-back" onClick={() => setResolveId(null)}>
          <div className="mhr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mhr-modal-h">
              <span className="mhr-modal-title">Mark as Resolved?</span>
              <button className="mhr-modal-close" onClick={() => setResolveId(null)}>{I.x}</button>
            </div>
            <div className="mhr-modal-body">
              <p className="mhr-modal-text">
                Confirm you've helped this team and the issue is resolved. <strong style={{ color: "#fff" }}>2 credits will be deducted from the team</strong>, and they'll be asked to rate your help.
              </p>
            </div>
            <div className="mhr-modal-foot">
              <button className="mhr-btn-secondary" onClick={() => setResolveId(null)}>Cancel</button>
              <button className="mhr-btn mhr-btn-green" onClick={confirmResolve}>
                <span>Yes, Resolved</span>
                <span className="mhr-btn-icn">{I.check}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`mhr-toast ${toast.kind}`}>
          {toast.kind === "success" ? I.check : toast.kind === "info" ? I.alert : I.alert}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

/* ====================================================================== */
function IncomingTab({ list, onClaim, technology }) {
  // sort: High > Medium > Low, then by oldest first (so urgent oldest float to top)
  const sorted = [...list].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return new Date(a.created_at) - new Date(b.created_at);
  });

  if (sorted.length === 0) {
    return (
      <div className="mhr-empty">
        <div className="mhr-empty-icn">{I.inbox}</div>
        <div className="mhr-empty-h">No incoming requests</div>
        <div className="mhr-empty-p">When a {technology} team raises a request, it'll show up here. We poll every 5 seconds.</div>
      </div>
    );
  }

  return (
    <div className="mhr-grid">
      {sorted.map((r) => (
        <IncomingCard key={r.id} r={r} onClaim={() => onClaim(r.id)} />
      ))}
    </div>
  );
}

function IncomingCard({ r, onClaim }) {
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  return (
    <div className={`mhr-rcard ${r.priority.toLowerCase()}`}>
      <div className="mhr-rcard-top">
        <div>
          <div className="mhr-team-num">{r.team_number}</div>
          <div className="mhr-team-meta">Requested by <strong>{r.requested_by_name}</strong></div>
        </div>
        <span className="mhr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </div>
      <div className="mhr-rcard-issue">{r.issue_description}</div>
      <div className="mhr-rcard-meta">
        <span className="mhr-rcard-meta-item">{I.clock}<span>Waiting <strong>{timeAgo(r.created_at)}</strong></span></span>
      </div>
      <div className="mhr-rcard-foot">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>First to claim wins</span>
        <button className="mhr-btn" onClick={onClaim}>
          <span className="mhr-btn-icn">{I.hand}</span>
          <span>I'm Coming</span>
        </button>
      </div>
    </div>
  );
}

function ActiveTab({ list, onResolve, mentorName }) {
  if (list.length === 0) {
    return (
      <div className="mhr-empty">
        <div className="mhr-empty-icn">{I.zap}</div>
        <div className="mhr-empty-h">No active requests</div>
        <div className="mhr-empty-p">Requests you've claimed will appear here. Mark them as resolved once you've helped the team.</div>
      </div>
    );
  }
  return (
    <div className="mhr-grid">
      {list.map((r) => (
        <ActiveCard key={r.id} r={r} onResolve={() => onResolve(r.id)} mentorName={mentorName} />
      ))}
    </div>
  );
}

function ActiveCard({ r, onResolve, mentorName }) {
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  return (
    <div className={`mhr-rcard ${r.priority.toLowerCase()}`}>
      <div className="mhr-rcard-top">
        <div>
          <div className="mhr-team-num">{r.team_number}</div>
          <div className="mhr-team-meta">Requested by <strong>{r.requested_by_name}</strong></div>
        </div>
        <span className="mhr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </div>
      <div className="mhr-rcard-issue">{r.issue_description}</div>
      <div className="mhr-rcard-meta">
        <span className="mhr-rcard-meta-item">{I.clock}<span>Claimed <strong><LiveAgo since={r.accepted_at} /></strong></span></span>
        <span className="mhr-rcard-meta-item">{I.user}<span>By <strong>{mentorName}</strong></span></span>
      </div>
      <div className="mhr-rcard-foot">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>2 credits deducted on resolve</span>
        <button className="mhr-btn mhr-btn-green" onClick={onResolve}>
          <span className="mhr-btn-icn">{I.check}</span>
          <span>Mark as Resolved</span>
        </button>
      </div>
    </div>
  );
}

function HistoryTab({ list, stats }) {
  return (
    <>
      <div className="mhr-stats">
        <div className="mhr-stat">
          <span className="mhr-stat-icn">{I.trophy}</span>
          <div>
            <div className="mhr-stat-lab">Total Resolved</div>
            <div className="mhr-stat-val">{stats.total}</div>
          </div>
        </div>
        <div className="mhr-stat">
          <span className="mhr-stat-icn">{I.star}</span>
          <div>
            <div className="mhr-stat-lab">Avg Rating</div>
            <div className="mhr-stat-val">{stats.avg ? stats.avg.toFixed(1) : "—"}</div>
            <div className="mhr-stat-sub">{stats.ratedCount} rated</div>
          </div>
        </div>
        <div className="mhr-stat">
          <span className="mhr-stat-icn">{I.clock}</span>
          <div>
            <div className="mhr-stat-lab">Avg Resolution</div>
            <div className="mhr-stat-val">{stats.avgResolutionSec ? formatSeconds(stats.avgResolutionSec) : "—"}</div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mhr-empty">
          <div className="mhr-empty-icn">{I.history}</div>
          <div className="mhr-empty-h">No history yet</div>
          <div className="mhr-empty-p">Your resolved requests and the ratings you've received will show up here.</div>
        </div>
      ) : (
        <div className="mhr-table-wrap">
          <table className="mhr-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Priority</th>
                <th>Issue</th>
                <th>Resolution Time</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <HistoryRow key={r.id} r={r} />
              ))}
            </tbody>
          </table>
          <div className="mhr-history-cards">
            {list.map((r) => (
              <HistoryCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function HistoryRow({ r }) {
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  return (
    <tr>
      <td><strong style={{ color: "#fff", fontWeight: 700 }}>{r.team_number}</strong></td>
      <td>
        <span className="mhr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </td>
      <td style={{ maxWidth: 320 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,.7)" }}>
          {r.issue_description}
        </div>
      </td>
      <td>
        {r.accepted_at && r.resolved_at ? (
          <span style={{ color: "#10b981", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {formatDuration(r.accepted_at, r.resolved_at)}
          </span>
        ) : "—"}
      </td>
      <td>{r.rating ? <Stars rating={r.rating} /> : <span style={{ color: "rgba(255,255,255,.35)" }}>Not rated</span>}</td>
    </tr>
  );
}

function HistoryCard({ r }) {
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  return (
    <div className="mhr-hcard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ color: "#fff", fontFamily: "Astro, sans-serif", letterSpacing: "1px" }}>{r.team_number}</strong>
        <span className="mhr-prio-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-tag-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 10, lineHeight: 1.5 }}>
        {r.issue_description.length > 100 ? r.issue_description.slice(0, 100) + "…" : r.issue_description}
      </div>
      <div className="mhr-hcard-row">
        <span className="mhr-hcard-lab">Resolution Time</span>
        <span className="mhr-hcard-val" style={{ color: "#10b981" }}>
          {r.accepted_at && r.resolved_at ? formatDuration(r.accepted_at, r.resolved_at) : "—"}
        </span>
      </div>
      <div className="mhr-hcard-row">
        <span className="mhr-hcard-lab">Rating</span>
        <span className="mhr-hcard-val">{r.rating ? <Stars rating={r.rating} /> : "Not rated"}</span>
      </div>
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="mhr-rating-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "" : "empty"}>{I.star}</span>
      ))}
    </span>
  );
}

function LiveAgo({ since }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{timeAgo(since)}</span>;
}

/* ---------- helpers ---------- */
function timeAgo(iso) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
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

function formatSeconds(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}