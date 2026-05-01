"use client";
import { useState, useEffect } from "react";

/* ============================================================
   EVENT INFO — Trainee Dashboard Section
   Shows the logged-in trainee:
     - Their team's floor & desk (venue)
     - Welcome kit pickup location
     - T&C acceptance status + timestamp
   Path: import into /app/dashboard/page.js as a section
   Render when active === "event-info"
   ============================================================ */

const I = {
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/></svg>,
  gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8H7.5z"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C14.5 3 12 8 12 8h4.5z"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  external: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>,
};

function getVenue(teamNumber) {
  if (!teamNumber || !teamNumber.startsWith("PS-")) return null;
  const n = parseInt(teamNumber.replace("PS-", ""), 10);
  if (isNaN(n) || n < 1 || n > 160) return null;
  const floor = Math.ceil(n / 32);
  const idxInFloor = ((n - 1) % 32) + 1;
  const desk = Math.ceil(idxInFloor / 8);
  const startTeam = ((floor - 1) * 32 + (desk - 1) * 8) + 1;
  const endTeam = startTeam + 7;
  return {
    floor,
    desk,
    range: `PS-${String(startTeam).padStart(3, "0")} to PS-${String(endTeam).padStart(3, "0")}`,
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function EventInfo({ user }) {
  const teamNumber = user?.teamNumber || user?.team_number;
  const roll = user?.rollNumber || user?.roll_number;
  const venue = getVenue(teamNumber);
  const [acceptedAt, setAcceptedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roll) { setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch(`/api/terms/status?roll=${roll}`, { cache: "no-store" });
        const d = await r.json();
        setAcceptedAt(d.accepted_at);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [roll]);

  return (
    <>
      <style jsx>{`
        .ei-root { font-family: "DM Sans", system-ui, sans-serif; color: #ededed; }
        .ei-head { margin-bottom: 22px; }
        .ei-h1 { font-size: 24px; font-weight: 700; letter-spacing: -.015em; margin: 0 0 6px; }
        .ei-sub { font-size: 13px; color: #9b9aa3; margin: 0; }

        .ei-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 820px) { .ei-grid { grid-template-columns: 1fr; } }

        .ei-card {
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          overflow: hidden;
        }
        .ei-card-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          background: rgba(255,255,255,.02);
          border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ei-card-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
          color: #ededed;
        }
        .ei-card-icn { width: 16px; height: 16px; color: #eea727; }

        .ei-venue-body { padding: 24px 22px; }
        .ei-venue-team {
          font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
          color: #eea727; font-weight: 600; margin-bottom: 6px;
        }
        .ei-venue-num {
          font-size: 36px; font-weight: 700; letter-spacing: -.02em;
          line-height: 1; margin-bottom: 18px;
        }
        .ei-venue-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ei-venue-item {
          padding: 14px 16px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.02);
          border-radius: 10px;
        }
        .ei-venue-lab { font-size: 10.5px; letter-spacing: .15em; text-transform: uppercase; color: #6b6a73; margin-bottom: 6px; }
        .ei-venue-val { font-size: 18px; font-weight: 700; }
        .ei-venue-range { font-size: 11px; color: #9b9aa3; margin-top: 4px; font-weight: 500; }

        .ei-status-body { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .ei-status-pill {
          display: inline-flex; align-items: center; gap: 8px; align-self: flex-start;
          padding: 6px 12px; border-radius: 100px;
          font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
        }
        .ei-status-accepted {
          background: rgba(16,185,129,.08);
          border: 1px solid rgba(16,185,129,.3);
          color: #10b981;
        }
        .ei-status-pending {
          background: rgba(238,167,39,.08);
          border: 1px solid rgba(238,167,39,.3);
          color: #eea727;
        }
        .ei-status-icn { width: 12px; height: 12px; }
        .ei-status-row { display: flex; flex-direction: column; gap: 3px; }
        .ei-status-row-lab { font-size: 11px; color: #6b6a73; letter-spacing: .1em; text-transform: uppercase; }
        .ei-status-row-val { font-size: 14px; color: #ededed; font-weight: 500; }

        .ei-link {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 14px;
          background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.3);
          border-radius: 8px;
          color: #fd1c00;
          font-size: 12px; font-weight: 600; letter-spacing: .04em;
          text-decoration: none;
          align-self: flex-start;
          transition: background .15s;
        }
        .ei-link:hover { background: rgba(253,28,0,.14); }
        .ei-link-icn { width: 13px; height: 13px; }

        .ei-empty {
          padding: 22px;
          color: #9b9aa3; font-size: 13px; line-height: 1.5;
        }

        .ei-banner {
          margin-bottom: 18px;
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(238,167,39,.08), rgba(253,28,0,.04));
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 10px;
          display: flex; gap: 12px; align-items: center;
        }
        .ei-banner-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: #eea727; box-shadow: 0 0 8px #eea727;
          animation: ei-pulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes ei-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
        .ei-banner-text { font-size: 13px; color: #d4d3d8; line-height: 1.4; }
        .ei-banner-text strong { color: #ededed; }
      `}</style>

      <div className="ei-root">
        <div className="ei-head">
          <h1 className="ei-h1">Event Info</h1>
          <p className="ei-sub">Your team venue, welcome kit pickup, and acknowledgement status.</p>
        </div>

        <div className="ei-banner">
          <div className="ei-banner-pulse" />
          <div className="ei-banner-text">
            <strong>Welcome Kit pickup:</strong> Day 1 (Wednesday) · 9:00 – 10:00 AM at your assigned floor & desk.
          </div>
        </div>

        <div className="ei-grid">
          {/* VENUE CARD */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-title">
                <span className="ei-card-icn">{I.map}</span>
                Your Venue
              </div>
            </div>
            {venue ? (
              <div className="ei-venue-body">
                <div className="ei-venue-team">Team</div>
                <div className="ei-venue-num">{teamNumber}</div>
                <div className="ei-venue-grid">
                  <div className="ei-venue-item">
                    <div className="ei-venue-lab">Floor</div>
                    <div className="ei-venue-val">Floor {venue.floor}</div>
                  </div>
                  <div className="ei-venue-item">
                    <div className="ei-venue-lab">Desk</div>
                    <div className="ei-venue-val">Desk {venue.desk}</div>
                    <div className="ei-venue-range">{venue.range}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ei-empty">No team assigned yet.</div>
            )}
          </div>

          {/* WELCOME KIT + T&C STATUS */}
          <div className="ei-card">
            <div className="ei-card-head">
              <div className="ei-card-title">
                <span className="ei-card-icn">{I.gift}</span>
                Welcome Kit & Acknowledgement
              </div>
            </div>
            <div className="ei-status-body">
              {venue ? (
                <div className="ei-status-row">
                  <div className="ei-status-row-lab">Pickup Location</div>
                  <div className="ei-status-row-val">Floor {venue.floor} · Desk {venue.desk}</div>
                </div>
              ) : null}

              <div className="ei-status-row">
                <div className="ei-status-row-lab">Pickup Time</div>
                <div className="ei-status-row-val">Day 1 · 9:00 – 10:00 AM</div>
              </div>

              <div>
                <div className="ei-status-row-lab" style={{ marginBottom: 6 }}>Guidelines Acknowledged</div>
                {loading ? (
                  <span className="ei-status-pill ei-status-pending">Checking...</span>
                ) : acceptedAt ? (
                  <>
                    <span className="ei-status-pill ei-status-accepted">
                      <span className="ei-status-icn">{I.check}</span>
                      Accepted
                    </span>
                    <div className="ei-status-row-lab" style={{ marginTop: 8, fontSize: 11 }}>
                      Accepted on {fmtDate(acceptedAt)}
                    </div>
                  </>
                ) : (
                  <span className="ei-status-pill ei-status-pending">Pending</span>
                )}
              </div>

              <a href="/event-info" className="ei-link">
                View full guidelines & schedule
                <span className="ei-link-icn">{I.external}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}