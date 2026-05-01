"use client";
import { useState, useEffect, useMemo } from "react";

/* ============================================================
   MENTOR — TEAM VENUES & T&C STATUS
   Shows each team under this mentor:
     - Floor & desk
     - Welcome kit pickup location
     - Per-member acceptance status + timestamp
     - Team-level acceptance summary
   Path: import into /app/mentor/dashboard/page.js
   Render when active === "team-venues"
   ============================================================ */

const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
};

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function MentorTeamVenues({ user }) {
  const mentorEmail = user?.email || user?.mentorEmail;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | accepted | pending
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!mentorEmail) { setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch(`/api/terms/team-status?mentor_email=${encodeURIComponent(mentorEmail)}`, { cache: "no-store" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [mentorEmail]);

  const filtered = useMemo(() => {
    if (!data?.teams) return [];
    let list = data.teams;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) =>
        t.team_number.toLowerCase().includes(q) ||
        (t.project_title || "").toLowerCase().includes(q)
      );
    }
    if (filter === "accepted") {
      list = list.filter((t) => t.accepted_count === t.total_count && t.total_count > 0);
    } else if (filter === "pending") {
      list = list.filter((t) => t.accepted_count < t.total_count);
    }
    return list;
  }, [data, search, filter]);

  return (
    <>
      <style jsx>{`
        .mtv { font-family: "DM Sans", system-ui, sans-serif; color: #ededed; }
        .mtv-head { margin-bottom: 22px; }
        .mtv-h1 { font-size: 24px; font-weight: 700; letter-spacing: -.015em; margin: 0 0 6px; }
        .mtv-sub { font-size: 13px; color: #9b9aa3; margin: 0; }

        .mtv-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 720px) { .mtv-stats { grid-template-columns: repeat(2,1fr); } }
        .mtv-stat {
          padding: 14px 16px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
        }
        .mtv-stat-num { font-size: 22px; font-weight: 700; line-height: 1; }
        .mtv-stat-lab { font-size: 11px; color: #6b6a73; margin-top: 6px; letter-spacing: .12em; text-transform: uppercase; }
        .mtv-stat-accent { color: #10b981; }
        .mtv-stat-warn { color: #eea727; }

        .mtv-controls {
          display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .mtv-search-wrap { position: relative; flex: 1; min-width: 240px; }
        .mtv-search-icn { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #6b6a73; }
        .mtv-search {
          width: 100%; padding: 10px 12px 10px 36px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.1);
          color: #ededed;
          border-radius: 8px;
          font-family: inherit; font-size: 13px;
          outline: none;
        }
        .mtv-search:focus { border-color: #eea727; }

        .mtv-filters { display: flex; gap: 4px; padding: 4px; background: #11091a; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; }
        .mtv-filter-btn {
          padding: 7px 14px;
          background: transparent; border: none; color: #9b9aa3;
          font-family: inherit; font-size: 12px; font-weight: 500;
          border-radius: 6px; cursor: pointer;
          white-space: nowrap;
          transition: all .15s;
        }
        .mtv-filter-btn:hover { color: #ededed; }
        .mtv-filter-btn.active { background: #fd1c00; color: #fff; }

        .mtv-list { display: flex; flex-direction: column; gap: 10px; }
        .mtv-team-card {
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          overflow: hidden;
        }
        .mtv-team-row {
          display: grid;
          grid-template-columns: auto 1fr auto auto auto;
          gap: 16px; padding: 14px 18px;
          align-items: center;
          cursor: pointer;
          transition: background .15s;
        }
        .mtv-team-row:hover { background: rgba(255,255,255,.02); }
        @media (max-width: 720px) {
          .mtv-team-row { grid-template-columns: auto 1fr auto; gap: 10px; }
          .mtv-team-venue, .mtv-team-status { display: none; }
        }
        .mtv-team-num {
          font-size: 13px; font-weight: 700; letter-spacing: .04em;
          color: #eea727;
          padding: 5px 10px;
          background: rgba(238,167,39,.08);
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 6px;
          font-variant-numeric: tabular-nums;
        }
        .mtv-team-info { min-width: 0; }
        .mtv-team-title { font-size: 14px; font-weight: 600; color: #ededed; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mtv-team-tech { font-size: 11px; color: #6b6a73; margin-top: 2px; letter-spacing: .04em; }
        .mtv-team-venue {
          font-size: 12px; color: #9b9aa3;
          padding: 4px 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px;
          white-space: nowrap;
        }
        .mtv-team-venue strong { color: #ededed; font-weight: 600; }
        .mtv-team-status {
          font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          padding: 5px 10px; border-radius: 100px;
          white-space: nowrap;
        }
        .mtv-status-full { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3); color: #10b981; }
        .mtv-status-partial { background: rgba(238,167,39,.08); border: 1px solid rgba(238,167,39,.3); color: #eea727; }
        .mtv-status-none { background: rgba(253,28,0,.08); border: 1px solid rgba(253,28,0,.3); color: #fd1c00; }
        .mtv-chev { width: 16px; height: 16px; color: #6b6a73; transition: transform .2s; }
        .mtv-chev.rot { transform: rotate(180deg); }

        .mtv-team-body { border-top: 1px solid rgba(255,255,255,.06); padding: 14px 18px; background: rgba(0,0,0,.2); }
        .mtv-mobile-meta { display: none; padding: 10px 18px; gap: 10px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,.06); background: rgba(0,0,0,.15); }
        @media (max-width: 720px) { .mtv-mobile-meta { display: flex; } }

        .mtv-members { width: 100%; border-collapse: collapse; }
        .mtv-members th {
          font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase;
          color: #6b6a73; font-weight: 600; text-align: left;
          padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .mtv-members td {
          padding: 10px; font-size: 13px; color: #d4d3d8;
          border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .mtv-members tr:last-child td { border-bottom: none; }
        .mtv-roll { font-family: ui-monospace, monospace; font-size: 12px; color: #9b9aa3; }
        .mtv-name { font-weight: 500; }
        .mtv-leader-tag {
          display: inline-block; margin-left: 6px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .1em;
          padding: 2px 6px; background: rgba(253,28,0,.1);
          border: 1px solid rgba(253,28,0,.3);
          border-radius: 100px; color: #fd1c00;
          vertical-align: middle;
        }
        .mtv-mem-status {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; letter-spacing: .04em;
        }
        .mtv-mem-icn { width: 13px; height: 13px; }
        .mtv-acc { color: #10b981; }
        .mtv-pend { color: #eea727; }
        .mtv-ts { font-size: 11px; color: #6b6a73; font-variant-numeric: tabular-nums; }

        .mtv-loading, .mtv-empty {
          text-align: center; padding: 40px;
          color: #6b6a73; font-size: 13px;
          background: #11091a; border: 1px dashed rgba(255,255,255,.1);
          border-radius: 10px;
        }
        .mtv-err {
          padding: 12px 16px; background: rgba(253,28,0,.08);
          border: 1px solid rgba(253,28,0,.3);
          color: #fd1c00; font-size: 13px;
          border-radius: 8px;
        }
      `}</style>

      <div className="mtv">
        <div className="mtv-head">
          <h1 className="mtv-h1">Team Venues & Acknowledgements</h1>
          <p className="mtv-sub">Floor & desk allocation for your teams, plus T&C acceptance status for every member.</p>
        </div>

        {error && <div className="mtv-err">{error}</div>}

        {loading ? (
          <div className="mtv-loading">Loading your teams…</div>
        ) : !data || data.teams.length === 0 ? (
          <div className="mtv-empty">No teams assigned to you.</div>
        ) : (
          <>
            <div className="mtv-stats">
              <div className="mtv-stat">
                <div className="mtv-stat-num">{data.stats.total_teams}</div>
                <div className="mtv-stat-lab">Teams</div>
              </div>
              <div className="mtv-stat">
                <div className="mtv-stat-num">{data.stats.total_members}</div>
                <div className="mtv-stat-lab">Members</div>
              </div>
              <div className="mtv-stat">
                <div className="mtv-stat-num mtv-stat-accent">{data.stats.accepted}</div>
                <div className="mtv-stat-lab">Accepted</div>
              </div>
              <div className="mtv-stat">
                <div className="mtv-stat-num mtv-stat-warn">{data.stats.pending}</div>
                <div className="mtv-stat-lab">Pending</div>
              </div>
            </div>

            <div className="mtv-controls">
              <div className="mtv-search-wrap">
                <span className="mtv-search-icn">{I.search}</span>
                <input
                  className="mtv-search"
                  placeholder="Search by team number or project title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="mtv-filters">
                <button className={`mtv-filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
                <button className={`mtv-filter-btn ${filter === "accepted" ? "active" : ""}`} onClick={() => setFilter("accepted")}>Fully Accepted</button>
                <button className={`mtv-filter-btn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>Has Pending</button>
              </div>
            </div>

            <div className="mtv-list">
              {filtered.map((t) => {
                const isExpanded = expanded[t.team_number];
                const status =
                  t.total_count === 0
                    ? "none"
                    : t.accepted_count === t.total_count
                    ? "full"
                    : t.accepted_count === 0
                    ? "none"
                    : "partial";
                const statusLabel =
                  status === "full" ? "All Accepted" :
                  status === "partial" ? `${t.accepted_count}/${t.total_count}` :
                  "Pending";
                return (
                  <div key={t.team_number} className="mtv-team-card">
                    <div
                      className="mtv-team-row"
                      onClick={() => setExpanded((p) => ({ ...p, [t.team_number]: !p[t.team_number] }))}
                    >
                      <span className="mtv-team-num">{t.team_number}</span>
                      <div className="mtv-team-info">
                        <div className="mtv-team-title">{t.project_title || "Untitled"}</div>
                        <div className="mtv-team-tech">{t.technology || ""}</div>
                      </div>
                      {t.venue && (
                        <span className="mtv-team-venue">
                          Floor <strong>{t.venue.floor}</strong> · Desk <strong>{t.venue.desk}</strong>
                        </span>
                      )}
                      <span className={`mtv-team-status mtv-status-${status}`}>{statusLabel}</span>
                      <span className={`mtv-chev ${isExpanded ? "rot" : ""}`}>{I.chevron}</span>
                    </div>

                    {/* Mobile-only meta strip (since venue/status hide on small screens) */}
                    <div className="mtv-mobile-meta">
                      {t.venue && (
                        <span className="mtv-team-venue">
                          Floor <strong>{t.venue.floor}</strong> · Desk <strong>{t.venue.desk}</strong>
                        </span>
                      )}
                      <span className={`mtv-team-status mtv-status-${status}`}>{statusLabel}</span>
                    </div>

                    {isExpanded && (
                      <div className="mtv-team-body">
                        <table className="mtv-members">
                          <thead>
                            <tr>
                              <th>Roll</th>
                              <th>Name</th>
                              <th>Status</th>
                              <th>Accepted At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {t.members.map((m) => (
                              <tr key={m.roll_number}>
                                <td className="mtv-roll">{m.roll_number}</td>
                                <td className="mtv-name">
                                  {m.short_name || "—"}
                                  {m.is_leader && <span className="mtv-leader-tag">Leader</span>}
                                </td>
                                <td>
                                  {m.accepted ? (
                                    <span className="mtv-mem-status mtv-acc">
                                      <span className="mtv-mem-icn">{I.check}</span>
                                      Accepted
                                    </span>
                                  ) : (
                                    <span className="mtv-mem-status mtv-pend">
                                      <span className="mtv-mem-icn">{I.pending}</span>
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="mtv-ts">{fmtDate(m.accepted_at) || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="mtv-empty">No teams match your filter.</div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}