"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

/* ============================================================
   /mentor-panel/[requestId]?action=coming|busy&mentor_id=...&token=...
   Token-secured page mentor lands on from email click.
   Workflow:
     1. GET /api/mentor-action?... validates token, returns request + mentor + can_act
     2. Page shows team + project + issue + priority
     3. Auto-runs the action (or shows confirm button)
     4. Shows success/error and links back
   ============================================================ */

const I = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  hand: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 1 0-4 0v5"/><path d="M14 10V4a2 2 0 1 0-4 0v6"/><path d="M10 10.5V6a2 2 0 1 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
  pause: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  spin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

export default function MentorPanelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const requestId = params?.requestId;
  const action = searchParams.get("action");
  const mentor_id = searchParams.get("mentor_id");
  const token = searchParams.get("token");

  const [phase, setPhase] = useState("loading"); // loading, ready, doing, done, error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [resultMsg, setResultMsg] = useState(null);

  /* ---------- step 1: validate token + fetch request ---------- */
  useEffect(() => {
    if (!requestId || !mentor_id || !token || !action) {
      setPhase("error");
      setError("This link is missing required information.");
      return;
    }

    if (!["coming", "busy"].includes(action)) {
      setPhase("error");
      setError("Unknown action.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/mentor-action?request_id=${encodeURIComponent(requestId)}&mentor_id=${encodeURIComponent(mentor_id)}&token=${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          setPhase("error");
          setError(json.error || "Failed to load request");
          return;
        }
        setData(json);
        setPhase("ready");
      } catch (e) {
        setPhase("error");
        setError("Network error. Please try again.");
      }
    })();
  }, [requestId, mentor_id, token, action]);

  /* ---------- step 2: do the action ---------- */
  const doAction = async () => {
    setPhase("doing");
    try {
      const res = await fetch("/api/mentor-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          mentor_id,
          token,
          action,
          source: "email",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPhase("error");
        setError(json.error || "Action failed");
        return;
      }
      setResultMsg(json.message || "Done");
      setPhase("done");
    } catch {
      setPhase("error");
      setError("Network error. Please try again.");
    }
  };

  const fmtDt = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const prioColor = data?.request?.priority
    ? { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[data.request.priority]
    : "#888";

  return (
    <div className="mp">
      <style jsx global>{`
        body { background: #050008; margin: 0; font-family: 'DM Sans', system-ui, sans-serif; color: #fff; }
        .mp { max-width: 600px; margin: 0 auto; padding: 40px 20px 60px; min-height: 100vh; }
        @keyframes mp-spin { to { transform: rotate(360deg); } }
        @keyframes mp-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .mp-header {
          padding: 22px 26px; border-radius: 16px;
          background: linear-gradient(135deg, #fd1c00 0%, #fa0068 60%, #1a0a18 100%);
          margin-bottom: 22px; box-shadow: 0 8px 32px rgba(253,28,0,.18);
          animation: mp-fade .35s ease both;
        }
        .mp-eyebrow { font-size: 10.5px; letter-spacing: .18em; font-weight: 700; color: rgba(255,255,255,.85); text-transform: uppercase; }
        .mp-h1 { font-size: 22px; font-weight: 800; margin: 6px 0 0; letter-spacing: .5px; }
        .mp-card { background: rgba(13,10,20,.7); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: 22px 24px; animation: mp-fade .4s ease both; }
        .mp-row { display: grid; grid-template-columns: 130px 1fr; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 13px; }
        .mp-row:last-child { border-bottom: none; }
        .mp-row-lab { color: rgba(255,255,255,.45); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; padding-top: 2px; }
        .mp-row-val { color: rgba(255,255,255,.92); line-height: 1.55; word-break: break-word; }
        .mp-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px 11px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
        .mp-dot { width: 6px; height: 6px; border-radius: 50%; }
        .mp-foot { margin-top: 22px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .mp-btn {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 26px; border-radius: 10px; font-size: 13.5px; font-weight: 700;
          letter-spacing: .03em; cursor: pointer; border: none; color: #fff;
          font-family: inherit; transition: transform .15s, box-shadow .15s, opacity .15s;
        }
        .mp-btn:disabled { opacity: .55; cursor: not-allowed; }
        .mp-btn svg { width: 15px; height: 15px; }
        .mp-btn.coming { background: linear-gradient(135deg, #fd1c00, #faa000); box-shadow: 0 6px 18px rgba(253,28,0,.3); }
        .mp-btn.coming:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(253,28,0,.4); }
        .mp-btn.busy { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.18); }
        .mp-btn.busy:hover:not(:disabled) { background: rgba(255,255,255,.1); }
        .mp-result {
          padding: 24px; border-radius: 14px; text-align: center;
          animation: mp-fade .4s ease both;
        }
        .mp-result.success { background: rgba(16,185,129,.07); border: 1px solid rgba(16,185,129,.3); }
        .mp-result.error { background: rgba(253,28,0,.07); border: 1px solid rgba(253,28,0,.3); }
        .mp-result-icn { width: 56px; height: 56px; padding: 14px; border-radius: 50%; margin: 0 auto 14px; }
        .mp-result.success .mp-result-icn { background: rgba(16,185,129,.15); color: #10b981; }
        .mp-result.error .mp-result-icn { background: rgba(253,28,0,.15); color: #ff5535; }
        .mp-result-h { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
        .mp-result-p { font-size: 13.5px; color: rgba(255,255,255,.7); line-height: 1.6; max-width: 460px; margin: 0 auto; }
        .mp-spin { animation: mp-spin .9s linear infinite; }
        .mp-loading-card { padding: 60px 24px; text-align: center; color: rgba(255,255,255,.6); }
        .mp-loading-icn { width: 36px; height: 36px; margin: 0 auto 12px; }
        .mp-back-link {
          display: inline-block; margin-top: 18px;
          color: rgba(255,255,255,.5); font-size: 12.5px;
          text-decoration: none; padding: 8px 14px;
          border: 1px solid rgba(255,255,255,.1); border-radius: 8px;
        }
        .mp-back-link:hover { color: #fff; border-color: rgba(255,255,255,.25); }
      `}</style>

      <div className="mp-header">
        <div className="mp-eyebrow">Project Space · Mentor Panel</div>
        <div className="mp-h1">
          {action === "coming" ? "Confirm: I'm Coming" : "Mark Yourself Busy"}
        </div>
      </div>

      {phase === "loading" && (
        <div className="mp-card">
          <div className="mp-loading-card">
            <div className="mp-loading-icn mp-spin">{I.spin}</div>
            <div>Validating link…</div>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="mp-card">
          <div className="mp-result error">
            <div className="mp-result-icn">{I.alert}</div>
            <div className="mp-result-h">Something went wrong</div>
            <div className="mp-result-p">{error}</div>
            <a href="/mentor/dashboard" className="mp-back-link">← Open dashboard</a>
          </div>
        </div>
      )}

      {phase === "ready" && data && (
        <div className="mp-card">
          <div className="mp-row">
            <div className="mp-row-lab">Mentor</div>
            <div className="mp-row-val">{data.mentor.name}</div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Team</div>
            <div className="mp-row-val">
              <strong>{data.request.team_number}</strong>
              {data.request.project_title ? ` · ${data.request.project_title}` : ""}
            </div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Requested by</div>
            <div className="mp-row-val">{data.request.requested_by_name}</div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Priority</div>
            <div className="mp-row-val">
              <span className="mp-tag" style={{ background: `${prioColor}1a`, color: prioColor, border: `1px solid ${prioColor}55` }}>
                <span className="mp-dot" style={{ background: prioColor }} />
                {data.request.priority}
              </span>
            </div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Status</div>
            <div className="mp-row-val">
              {data.request.status}
              {data.request.mentor_name && data.request.status === "Accepted" ? ` · by ${data.request.mentor_name}` : ""}
            </div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Issue</div>
            <div className="mp-row-val">{data.request.issue_description}</div>
          </div>
          <div className="mp-row">
            <div className="mp-row-lab">Raised</div>
            <div className="mp-row-val">{fmtDt(data.request.created_at)}</div>
          </div>

          {!data.can_act && data.frozen_with && action === "coming" && (
            <div className="mp-result error" style={{ marginTop: 18 }}>
              <div className="mp-result-icn">{I.alert}</div>
              <div className="mp-result-h">You're already on another request</div>
              <div className="mp-result-p">
                You're currently helping <strong>{data.frozen_with}</strong>.
                Mark that one resolved before accepting another.
              </div>
            </div>
          )}

          {!data.can_act && !data.frozen_with && (
            <div className="mp-result error" style={{ marginTop: 18 }}>
              <div className="mp-result-icn">{I.alert}</div>
              <div className="mp-result-h">No action available</div>
              <div className="mp-result-p">
                This request is already <strong>{data.request.status}</strong>
                {data.request.mentor_name && data.request.status === "Accepted"
                  ? ` (claimed by ${data.request.mentor_name})`
                  : ""}.
              </div>
            </div>
          )}

          {data.can_act && (
            <div className="mp-foot">
              <button
                className={`mp-btn ${action === "coming" ? "coming" : "busy"}`}
                onClick={doAction}
                disabled={phase === "doing"}
              >
                {phase === "doing" ? (
                  <>
                    <span className="mp-spin">{I.spin}</span>
                    <span>Working…</span>
                  </>
                ) : action === "coming" ? (
                  <>
                    {I.hand}
                    <span>Confirm: I'm Coming</span>
                  </>
                ) : (
                  <>
                    {I.pause}
                    <span>Confirm: I'm Busy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="mp-card">
          <div className="mp-result success">
            <div className="mp-result-icn">{I.check}</div>
            <div className="mp-result-h">{action === "coming" ? "Confirmed" : "Marked Busy"}</div>
            <div className="mp-result-p">{resultMsg}</div>
            <a href="/mentor/dashboard" className="mp-back-link">→ Open mentor dashboard</a>
          </div>
        </div>
      )}
    </div>
  );
}