"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ============================================================
   MENTOR — Help Requests page  (v3)
   Path: app/mentor/dashboard/components/MentorHelpRequests.js
   v3 changes:
   - Uses NEW /api/mentor-action endpoint (replaces /claim)
   - 3 stat cards: Total (Notified|Accepted) · Solved · Pending
   - 6 visual states: Pending / Accept-by-me / Accept-by-other /
                      Busy-by-me / Resolved / Frozen-elsewhere
   - "I'm Coming" + "I'm Busy" buttons inline in table
   - Polling every 10s
   ============================================================ */

const I = {
  inbox: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 1 0-4 0v5"/><path d="M14 10V4a2 2 0 1 0-4 0v6"/><path d="M10 10.5V6a2 2 0 1 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

/* ====================================================================== */
export default function MentorHelpRequests({ mentor }) {
  const [allRequests, setAllRequests] = useState([]);
  const [stats, setStats] = useState({ notified: 0, accepted: 0, solved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const technology = mentor?.technology;
  const mentorId = mentor?.id;

  const showToast = useCallback((kind, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /* ---------- fetch ---------- */
  const fetchAll = useCallback(async () => {
    if (!technology || !mentorId) return;
    try {
      const [reqRes, statRes] = await Promise.all([
        fetch(`/api/mentor-request?technology=${encodeURIComponent(technology)}&limit=200`),
        fetch(`/api/mentor-request/mentor-stats?mentor_id=${mentorId}`),
      ]);
      const [reqJson, statJson] = await Promise.all([reqRes.json(), statRes.json()]);
      if (reqJson.success) setAllRequests(reqJson.requests || []);
      if (statJson.success) setStats({
        notified: statJson.notified, accepted: statJson.accepted,
        solved: statJson.solved, pending: statJson.pending,
      });
    } catch (e) {
      console.error("[MentorHelpRequests] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [technology, mentorId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const t = setInterval(fetchAll, 10000);
    return () => clearInterval(t);
  }, [fetchAll]);

  /* ---------- act (coming or busy) ---------- */
  const handleAction = async (requestId, action) => {
    setActingId(requestId + ":" + action);
    try {
      const res = await fetch("/api/mentor-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          mentor_id: mentorId,
          action,
          source: "dashboard",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.alreadyTaken ? "info" : "error", json.error || "Action failed");
      } else {
        showToast("success", json.message || (action === "coming" ? "Accepted" : "Marked busy"));
      }
      await fetchAll();
    } catch {
      showToast("error", "Network error");
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes mhr-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes mhr-pulse-amber { 0%, 100% { box-shadow: 0 0 0 0 rgba(250,160,0,.45); } 50% { box-shadow: 0 0 0 6px rgba(250,160,0,0); } }
        @keyframes mhr-pulse-blue { 0%, 100% { box-shadow: 0 0 0 0 rgba(96,165,250,.45); } 50% { box-shadow: 0 0 0 6px rgba(96,165,250,0); } }
        @keyframes mhr-spin { to { transform: rotate(360deg); } }

        .mhr { font-family: 'DM Sans', system-ui, sans-serif; color: #fff; max-width: 1200px; margin: 0 auto; padding-bottom: 80px; }
        .mhr *, .mhr *::before, .mhr *::after { box-sizing: border-box; }

        /* HERO */
        .mhr-hero { position: relative; padding: 26px 28px; border-radius: 16px; background: linear-gradient(135deg, #fd1c00 0%, #fa0068 50%, #1a0a18 100%); overflow: hidden; margin-bottom: 18px; box-shadow: 0 8px 32px rgba(253,28,0,.15); }
        .mhr-hero::before { content: ""; position: absolute; top: -100px; right: -100px; width: 380px; height: 380px; background: radial-gradient(circle, rgba(255,255,255,.10), transparent 60%); }
        .mhr-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .18em; color: #fff; text-transform: uppercase; padding: 5px 11px; border: 1px solid rgba(255,255,255,.3); border-radius: 100px; background: rgba(0,0,0,.2); position: relative; }
        .mhr-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
        .mhr-h1 { font-size: clamp(22px, 3vw, 30px); font-weight: 800; margin: 12px 0 6px; letter-spacing: 1px; text-transform: uppercase; position: relative; }
        .mhr-sub { font-size: 13px; color: rgba(255,255,255,.85); margin: 0; max-width: 560px; position: relative; }

        /* STAT CARDS */
        .mhr-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 18px; }
        @media (max-width: 700px) { .mhr-stats { grid-template-columns: 1fr; } }
        .mhr-stat { padding: 16px 18px; background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 12px; display: flex; align-items: center; gap: 14px; }
        .mhr-stat-icn { width: 40px; height: 40px; padding: 9px; background: rgba(238,167,39,.1); border: 1px solid rgba(238,167,39,.25); border-radius: 9px; color: #faa000; flex-shrink: 0; }
        .mhr-stat-lab { font-size: 9.5px; letter-spacing: .14em; color: rgba(255,255,255,.5); text-transform: uppercase; font-weight: 700; }
        .mhr-stat-val { font-size: 22px; font-weight: 800; color: #fff; line-height: 1.1; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .mhr-stat-val .mhr-sep { color: rgba(255,255,255,.3); font-weight: 400; margin: 0 5px; }
        .mhr-stat-val .mhr-num2 { color: #faa000; }
        .mhr-stat-sub { font-size: 10.5px; color: rgba(255,255,255,.45); margin-top: 2px; letter-spacing: .04em; }

        /* TABLE */
        .mhr-tw { background: rgba(13,10,20,.6); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; overflow: hidden; }
        .mhr-th-bar { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,.06); font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #fff; display: flex; align-items: center; gap: 9px; }
        .mhr-th-bar svg { width: 15px; height: 15px; color: #faa000; }
        .mhr-tscroll { overflow-x: auto; }
        .mhr-tbl { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .mhr-tbl thead th { padding: 11px 14px; font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; text-align: left; color: rgba(255,255,255,.45); background: rgba(0,0,0,.18); border-bottom: 1px solid rgba(255,255,255,.06); white-space: nowrap; }
        .mhr-tbl tbody tr { border-bottom: 1px solid rgba(255,255,255,.04); transition: background .15s; }
        .mhr-tbl tbody tr:hover { background: rgba(255,255,255,.015); }
        .mhr-tbl tbody tr.dim { opacity: .55; }
        .mhr-tbl tbody tr.mine { background: linear-gradient(90deg, rgba(16,185,129,.05), transparent 80%); }
        .mhr-tbl td { padding: 13px 14px; font-size: 12.5px; color: rgba(255,255,255,.85); vertical-align: middle; }
        .mhr-tbl td.iss { max-width: 280px; }
        .mhr-tbl td.iss > div { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(255,255,255,.7); }

        .mhr-prio { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 100px; font-size: 10.5px; font-weight: 700; }
        .mhr-prio-dot { width: 6px; height: 6px; border-radius: 50%; }
        .mhr-team { font-weight: 800; color: #fff; letter-spacing: .8px; font-size: 13px; }

        /* ACTION cell variants */
        .mhr-act-row { display: inline-flex; gap: 6px; align-items: center; }
        .mhr-act-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; transition: transform .12s, box-shadow .12s; white-space: nowrap; }
        .mhr-act-btn:disabled { opacity: .55; cursor: not-allowed; }
        .mhr-act-btn svg { width: 11px; height: 11px; }
        .mhr-act-btn.coming { background: linear-gradient(135deg, #fd1c00, #faa000); color: #fff; box-shadow: 0 3px 8px rgba(253,28,0,.25); }
        .mhr-act-btn.coming:hover:not(:disabled) { transform: translateY(-1px); }
        .mhr-act-btn.busy { background: rgba(255,255,255,.05); color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.12); }
        .mhr-act-btn.busy:hover:not(:disabled) { background: rgba(255,255,255,.1); }
        .mhr-act-btn.spin svg { animation: mhr-spin .9s linear infinite; }

        .mhr-state-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; white-space: nowrap; }
        .mhr-state-tag.mine-accepted { background: rgba(96,165,250,.12); color: #60a5fa; border: 1px solid rgba(96,165,250,.3); }
        .mhr-state-tag.taken { background: rgba(255,255,255,.04); color: rgba(255,255,255,.5); border: 1px solid rgba(255,255,255,.08); }
        .mhr-state-tag.busied { background: rgba(167,139,250,.08); color: #a78bfa; border: 1px solid rgba(167,139,250,.25); }
        .mhr-state-tag.resolved { background: rgba(16,185,129,.1); color: #10b981; border: 1px solid rgba(16,185,129,.3); }
        .mhr-state-tag.frozen { background: rgba(250,160,0,.08); color: #faa000; border: 1px solid rgba(250,160,0,.25); }

        .mhr-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 100px; font-size: 10px; font-weight: 700; }
        .mhr-status-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
        .mhr-status-pill.Pending { background: rgba(250,160,0,.1); color: #faa000; border: 1px solid rgba(250,160,0,.3); }
        .mhr-status-pill.Pending .dot { background: #faa000; animation: mhr-pulse-amber 2s ease-in-out infinite; }
        .mhr-status-pill.Accepted { background: rgba(96,165,250,.1); color: #60a5fa; border: 1px solid rgba(96,165,250,.3); }
        .mhr-status-pill.Accepted .dot { background: #60a5fa; animation: mhr-pulse-blue 2s ease-in-out infinite; }
        .mhr-status-pill[class*="Resolved"] { background: rgba(16,185,129,.1); color: #10b981; border: 1px solid rgba(16,185,129,.3); }
        .mhr-status-pill[class*="Resolved"] .dot { background: #10b981; }

        .mhr-empty { padding: 60px 24px; text-align: center; }
        .mhr-empty-icn { width: 48px; height: 48px; padding: 12px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; color: rgba(255,255,255,.4); margin: 0 auto 14px; }
        .mhr-empty-h { font-size: 14px; font-weight: 600; color: rgba(255,255,255,.75); margin-bottom: 4px; }
        .mhr-empty-p { font-size: 12px; color: rgba(255,255,255,.45); }
        .mhr-loading { padding: 40px; text-align: center; color: rgba(255,255,255,.5); font-size: 13px; }

        /* mobile cards */
        @media (max-width: 720px) {
          .mhr-tscroll { display: none; }
          .mhr-cards { display: flex; flex-direction: column; gap: 8px; padding: 10px; }
        }
        @media (min-width: 721px) { .mhr-cards { display: none; } }
        .mhr-card { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; padding: 12px 14px; }
        .mhr-card.dim { opacity: .55; }
        .mhr-card.mine { border-color: rgba(16,185,129,.3); background: rgba(16,185,129,.04); }
        .mhr-card-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; align-items: center; }
        .mhr-card-row { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; font-size: 12px; }
        .mhr-card-lab { color: rgba(255,255,255,.5); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; }
        .mhr-card-val { color: rgba(255,255,255,.9); }
        .mhr-card-actions { margin-top: 10px; }

        /* TOAST */
        .mhr-toast { position: fixed; top: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 10000; animation: mhr-fade-up .2s ease; backdrop-filter: blur(8px); display: flex; align-items: center; gap: 9px; max-width: 380px; }
        .mhr-toast svg { width: 16px; height: 16px; flex-shrink: 0; }
        .mhr-toast.success { background: rgba(16,185,129,.15); border: 1px solid rgba(16,185,129,.4); color: #10b981; }
        .mhr-toast.error { background: rgba(253,28,0,.15); border: 1px solid rgba(253,28,0,.4); color: #ff5535; }
        .mhr-toast.info { background: rgba(96,165,250,.15); border: 1px solid rgba(96,165,250,.4); color: #60a5fa; }
        @media (max-width: 480px) { .mhr-toast { left: 16px; right: 16px; max-width: none; } }
      `}</style>

      <div className="mhr">
        <div className="mhr-hero">
          <span className="mhr-eyebrow"><span className="mhr-eyebrow-dot" />Mentor Help Requests</span>
          <h1 className="mhr-h1">Teams need your expertise</h1>
          <p className="mhr-sub">
            Live requests from <strong>{technology || "your track"}</strong> teams.
            Click "I'm Coming" to claim — you're frozen on it until the team marks resolved.
          </p>
        </div>

        {/* STATS */}
        <div className="mhr-stats">
          <div className="mhr-stat">
            <span className="mhr-stat-icn">{I.bell}</span>
            <div>
              <div className="mhr-stat-lab">Total Requests</div>
              <div className="mhr-stat-val">
                {stats.notified}
                <span className="mhr-sep">/</span>
                <span className="mhr-num2">{stats.accepted}</span>
              </div>
              <div className="mhr-stat-sub">Notified · Accepted</div>
            </div>
          </div>
          <div className="mhr-stat">
            <span className="mhr-stat-icn" style={{ background: "rgba(16,185,129,.1)", borderColor: "rgba(16,185,129,.25)", color: "#10b981" }}>{I.trophy}</span>
            <div>
              <div className="mhr-stat-lab">Tickets Solved</div>
              <div className="mhr-stat-val">{stats.solved}</div>
              <div className="mhr-stat-sub">Mentor resolved</div>
            </div>
          </div>
          <div className="mhr-stat">
            <span className="mhr-stat-icn" style={{ background: "rgba(96,165,250,.1)", borderColor: "rgba(96,165,250,.25)", color: "#60a5fa" }}>{I.clock}</span>
            <div>
              <div className="mhr-stat-lab">Tickets Pending</div>
              <div className="mhr-stat-val">{stats.pending}</div>
              <div className="mhr-stat-sub">Awaiting action</div>
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="mhr-tw">
          <div className="mhr-th-bar">
            {I.list}
            All {technology} Requests
          </div>

          {loading ? (
            <div className="mhr-loading">Loading…</div>
          ) : allRequests.length === 0 ? (
            <div className="mhr-empty">
              <div className="mhr-empty-icn">{I.inbox}</div>
              <div className="mhr-empty-h">No requests yet</div>
              <div className="mhr-empty-p">When a {technology} team raises a request, it shows up here.</div>
            </div>
          ) : (
            <>
              <div className="mhr-tscroll">
                <table className="mhr-tbl">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Project</th>
                      <th>Time</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.map((r) => (
                      <RequestRow
                        key={r.id}
                        r={r}
                        mentorId={mentorId}
                        actingId={actingId}
                        onAct={(a) => handleAction(r.id, a)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mhr-cards">
                {allRequests.map((r) => (
                  <RequestCard
                    key={r.id}
                    r={r}
                    mentorId={mentorId}
                    actingId={actingId}
                    onAct={(a) => handleAction(r.id, a)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className={`mhr-toast ${toast.kind}`}>
          {toast.kind === "success" ? I.check : I.alert}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}

/* ====================================================================== */
function getRowState(r, mentorId) {
  // returns: 'pending-actionable' | 'pending-busied' | 'pending-frozen' |
  //          'accepted-mine' | 'accepted-other' | 'resolved' | 'self-resolved'
  if (r.status === "Mentor Resolved") return r.mentor_id === mentorId ? "resolved-mine" : "resolved";
  if (r.status === "Self Resolved") return "self-resolved";
  if (r.status === "Accepted") return r.mentor_id === mentorId ? "accepted-mine" : "accepted-other";
  if (r.status === "Pending") {
    const busy = Array.isArray(r.busy_mentors) ? r.busy_mentors : [];
    if (busy.includes(mentorId)) return "pending-busied";
    return "pending-actionable";
  }
  return "other";
}

function RequestRow({ r, mentorId, actingId, onAct }) {
  const state = getRowState(r, mentorId);
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  const isMine = r.mentor_id === mentorId;
  const isDim = ["pending-busied", "accepted-other", "resolved"].includes(state);

  return (
    <tr className={`${isDim ? "dim" : ""} ${isMine ? "mine" : ""}`}>
      <td><span className="mhr-team">{r.team_number}</span></td>
      <td>{r.project_title || <span style={{ color: "rgba(255,255,255,.35)" }}>—</span>}</td>
      <td><span style={{ color: "rgba(255,255,255,.55)" }}>{timeAgo(r.created_at)}</span></td>
      <td>
        <span className="mhr-prio" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </td>
      <td>
        <span className={`mhr-status-pill ${r.status.replace(/\s/g, "")}`}>
          <span className="dot" />{r.status}
        </span>
      </td>
      <td className="iss"><div title={r.issue_description}>{r.issue_description}</div></td>
      <td><ActionCell r={r} state={state} actingId={actingId} onAct={onAct} /></td>
    </tr>
  );
}

function RequestCard({ r, mentorId, actingId, onAct }) {
  const state = getRowState(r, mentorId);
  const prioColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[r.priority];
  const isMine = r.mentor_id === mentorId;
  const isDim = ["pending-busied", "accepted-other", "resolved"].includes(state);

  return (
    <div className={`mhr-card ${isDim ? "dim" : ""} ${isMine ? "mine" : ""}`}>
      <div className="mhr-card-top">
        <span className="mhr-team">{r.team_number}</span>
        <span className="mhr-prio" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
          <span className="mhr-prio-dot" style={{ background: prioColor }} />
          {r.priority}
        </span>
      </div>
      {r.project_title && (
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.7)", marginBottom: 6 }}>{r.project_title}</div>
      )}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", margin: "6px 0 8px", lineHeight: 1.5 }}>
        {r.issue_description.length > 140 ? r.issue_description.slice(0, 140) + "…" : r.issue_description}
      </div>
      <div className="mhr-card-row">
        <span className="mhr-card-lab">Status</span>
        <span className={`mhr-status-pill ${r.status.replace(/\s/g, "")}`}>
          <span className="dot" />{r.status}
        </span>
      </div>
      <div className="mhr-card-row">
        <span className="mhr-card-lab">Time</span>
        <span className="mhr-card-val">{timeAgo(r.created_at)}</span>
      </div>
      <div className="mhr-card-actions">
        <ActionCell r={r} state={state} actingId={actingId} onAct={onAct} />
      </div>
    </div>
  );
}

function ActionCell({ r, state, actingId, onAct }) {
  const comingId = r.id + ":coming";
  const busyId = r.id + ":busy";
  const isComingLoading = actingId === comingId;
  const isBusyLoading = actingId === busyId;

  if (state === "pending-actionable") {
    return (
      <div className="mhr-act-row">
        <button
          className={`mhr-act-btn coming ${isComingLoading ? "spin" : ""}`}
          onClick={() => onAct("coming")}
          disabled={isComingLoading || isBusyLoading}
        >
          {I.hand}<span>I'm Coming</span>
        </button>
        <button
          className={`mhr-act-btn busy ${isBusyLoading ? "spin" : ""}`}
          onClick={() => onAct("busy")}
          disabled={isComingLoading || isBusyLoading}
        >
          {I.pause}<span>I'm Busy</span>
        </button>
      </div>
    );
  }

  if (state === "pending-busied") {
    return <span className="mhr-state-tag busied">{I.pause}You marked busy</span>;
  }

  if (state === "accepted-mine") {
    return <span className="mhr-state-tag mine-accepted">{I.check}You're handling this</span>;
  }

  if (state === "accepted-other") {
    return <span className="mhr-state-tag taken">Accepted by {r.mentor_name || "another mentor"}</span>;
  }

  if (state === "resolved-mine") {
    return (
      <span className="mhr-state-tag resolved">
        {I.check}Solved by you{r.rating ? ` · ${r.rating}★` : ""}
      </span>
    );
  }

  if (state === "resolved") {
    return <span className="mhr-state-tag resolved">Resolved by {r.mentor_name || "—"}</span>;
  }

  if (state === "self-resolved") {
    return <span className="mhr-state-tag taken">Self resolved</span>;
  }

  return <span style={{ color: "rgba(255,255,255,.3)" }}>—</span>;
}

function timeAgo(iso) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}