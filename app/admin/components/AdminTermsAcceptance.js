"use client";
import { useState, useEffect, useMemo } from "react";

/* ============================================================
   ADMIN — TERMS ACCEPTANCE OVERVIEW
   Shows all 160 teams across Project Space:
     - Global stats (% accepted, pending, partial)
     - Tech-wise breakdown
     - Filter by tech / status
     - Per-team venue + per-member acceptance + timestamp
   Path: import into /app/admin/dashboard/page.js
   Render when active === "terms-acceptance"
   ============================================================ */

const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>,
};

const TECHNOLOGIES = [
  "Data Specialist",
  "AWS Development",
  "Full Stack",
  "Google Flutter",
  "ServiceNow",
  "VLSI",
];

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function AdminTermsAcceptance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (techFilter) params.set("technology", techFilter);
        const r = await fetch(`/api/terms/admin-status?${params.toString()}`, { cache: "no-store" });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed to load");
        setData(d);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [techFilter]);

  const filtered = useMemo(() => {
    if (!data?.teams) return [];
    let list = data.teams;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) =>
        t.team_number.toLowerCase().includes(q) ||
        (t.project_title || "").toLowerCase().includes(q) ||
        (t.mentor_name || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.team_status === statusFilter);
    }
    return list;
  }, [data, search, statusFilter]);

  const exportCsv = () => {
    if (!data?.teams) return;
    const rows = [["Team", "Project", "Technology", "Floor", "Desk", "Roll", "Name", "Is Leader", "Status", "Accepted At"]];
    data.teams.forEach((t) => {
      t.members.forEach((m) => {
        rows.push([
          t.team_number,
          (t.project_title || "").replace(/"/g, '""'),
          t.technology || "",
          t.venue?.floor || "",
          t.venue?.desk || "",
          m.roll_number,
          (m.short_name || "").replace(/"/g, '""'),
          m.is_leader ? "Yes" : "No",
          m.accepted ? "Accepted" : "Pending",
          m.accepted_at || "",
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terms_acceptance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style jsx>{`
        .ata { font-family: "DM Sans", system-ui, sans-serif; color: #ededed; }
        .ata-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
        .ata-h1 { font-size: 24px; font-weight: 700; letter-spacing: -.015em; margin: 0 0 6px; }
        .ata-sub { font-size: 13px; color: #9b9aa3; margin: 0; max-width: 540px; }
        .ata-export {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 14px;
          background: rgba(238,167,39,.08);
          border: 1px solid rgba(238,167,39,.3);
          color: #eea727;
          font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: .04em;
          border-radius: 8px; cursor: pointer;
          transition: background .15s;
        }
        .ata-export:hover { background: rgba(238,167,39,.14); }
        .ata-export-icn { width: 14px; height: 14px; }

        /* Stats */
        .ata-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        @media (max-width: 920px) { .ata-stats { grid-template-columns: repeat(2,1fr); } }
        .ata-stat {
          padding: 16px 18px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          position: relative; overflow: hidden;
        }
        .ata-stat::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--ata-accent, #eea727);
        }
        .ata-stat-num { font-size: 26px; font-weight: 700; line-height: 1; color: var(--ata-accent, #ededed); }
        .ata-stat-lab { font-size: 11px; color: #6b6a73; margin-top: 8px; letter-spacing: .12em; text-transform: uppercase; }
        .ata-stat-meta { font-size: 11px; color: #9b9aa3; margin-top: 4px; }

        /* Progress bar */
        .ata-progress {
          margin-bottom: 18px;
          padding: 16px 18px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
        }
        .ata-progress-head {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 10px;
        }
        .ata-progress-lab { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #9b9aa3; font-weight: 600; }
        .ata-progress-pct { font-size: 22px; font-weight: 700; color: #10b981; }
        .ata-progress-bar {
          height: 8px; background: rgba(255,255,255,.05);
          border-radius: 100px; overflow: hidden;
        }
        .ata-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 100px;
          transition: width .4s ease;
        }

        /* Tech-wise stats */
        .ata-tech-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin-bottom: 18px;
        }
        .ata-tech {
          padding: 10px 12px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 8px;
        }
        .ata-tech-name { font-size: 11px; font-weight: 600; color: #ededed; margin-bottom: 6px; letter-spacing: .04em; }
        .ata-tech-bar { height: 4px; background: rgba(255,255,255,.05); border-radius: 100px; overflow: hidden; margin-bottom: 6px; }
        .ata-tech-fill { height: 100%; background: #eea727; border-radius: 100px; }
        .ata-tech-pct { font-size: 11px; color: #9b9aa3; font-variant-numeric: tabular-nums; }

        /* Controls */
        .ata-controls { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .ata-search-wrap { position: relative; flex: 1; min-width: 220px; }
        .ata-search-icn { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #6b6a73; }
        .ata-search {
          width: 100%; padding: 10px 12px 10px 36px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.1);
          color: #ededed;
          border-radius: 8px;
          font-family: inherit; font-size: 13px;
          outline: none;
        }
        .ata-search:focus { border-color: #eea727; }
        .ata-select {
          padding: 10px 12px;
          background: #11091a;
          border: 1px solid rgba(255,255,255,.1);
          color: #ededed;
          border-radius: 8px;
          font-family: inherit; font-size: 13px;
          outline: none;
          min-width: 160px;
        }
        .ata-pills { display: flex; gap: 4px; padding: 4px; background: #11091a; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; }
        .ata-pill {
          padding: 7px 14px;
          background: transparent; border: none; color: #9b9aa3;
          font-family: inherit; font-size: 12px; font-weight: 500;
          border-radius: 6px; cursor: pointer;
          white-space: nowrap;
          transition: all .15s;
        }
        .ata-pill:hover { color: #ededed; }
        .ata-pill.active { background: #fd1c00; color: #fff; }

        /* Team list — same pattern as mentor view */
        .ata-list { display: flex; flex-direction: column; gap: 8px; }
        .ata-card { background: #11091a; border: 1px solid rgba(255,255,255,.08); border-radius: 10px; overflow: hidden; }
        .ata-row {
          display: grid;
          grid-template-columns: auto 1fr auto auto auto auto;
          gap: 14px; padding: 13px 16px;
          align-items: center;
          cursor: pointer;
        }
        .ata-row:hover { background: rgba(255,255,255,.02); }
        @media (max-width: 920px) {
          .ata-row { grid-template-columns: auto 1fr auto auto; gap: 10px; }
          .ata-mentor, .ata-venue { display: none; }
        }
        .ata-tnum {
          font-size: 13px; font-weight: 700;
          color: #eea727;
          padding: 4px 9px;
          background: rgba(238,167,39,.08);
          border: 1px solid rgba(238,167,39,.25);
          border-radius: 6px;
          font-variant-numeric: tabular-nums;
        }
        .ata-info { min-width: 0; }
        .ata-title { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ata-tech-tag { font-size: 11px; color: #6b6a73; margin-top: 2px; }
        .ata-mentor { font-size: 12px; color: #9b9aa3; white-space: nowrap; }
        .ata-venue {
          font-size: 12px; color: #9b9aa3;
          padding: 4px 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px;
          white-space: nowrap;
        }
        .ata-venue strong { color: #ededed; font-weight: 600; }
        .ata-status {
          font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          padding: 5px 10px; border-radius: 100px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .ata-st-accepted { background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3); color: #10b981; }
        .ata-st-partial { background: rgba(238,167,39,.08); border: 1px solid rgba(238,167,39,.3); color: #eea727; }
        .ata-st-pending { background: rgba(253,28,0,.08); border: 1px solid rgba(253,28,0,.3); color: #fd1c00; }
        .ata-chev { width: 16px; height: 16px; color: #6b6a73; transition: transform .2s; }
        .ata-chev.rot { transform: rotate(180deg); }

        .ata-body { border-top: 1px solid rgba(255,255,255,.06); padding: 12px 16px; background: rgba(0,0,0,.2); }
        .ata-mobile-meta { display: none; padding: 8px 16px; gap: 8px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,.06); background: rgba(0,0,0,.15); font-size: 11px; }
        @media (max-width: 920px) { .ata-mobile-meta { display: flex; } }

        .ata-mtbl { width: 100%; border-collapse: collapse; }
        .ata-mtbl th {
          font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase;
          color: #6b6a73; font-weight: 600; text-align: left;
          padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .ata-mtbl td { padding: 9px 10px; font-size: 12.5px; color: #d4d3d8; border-bottom: 1px solid rgba(255,255,255,.04); }
        .ata-mtbl tr:last-child td { border-bottom: none; }
        .ata-mroll { font-family: ui-monospace, monospace; font-size: 11.5px; color: #9b9aa3; }
        .ata-leader { display: inline-block; margin-left: 6px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; padding: 2px 6px; background: rgba(253,28,0,.1); border: 1px solid rgba(253,28,0,.3); border-radius: 100px; color: #fd1c00; vertical-align: middle; }
        .ata-mst { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; }
        .ata-mst-icn { width: 13px; height: 13px; }
        .ata-mst-acc { color: #10b981; }
        .ata-mst-pend { color: #eea727; }
        .ata-mts { font-size: 11px; color: #6b6a73; font-variant-numeric: tabular-nums; }

        .ata-loading, .ata-empty {
          text-align: center; padding: 40px;
          color: #6b6a73; font-size: 13px;
          background: #11091a; border: 1px dashed rgba(255,255,255,.1);
          border-radius: 10px;
        }
        .ata-err { padding: 12px 16px; background: rgba(253,28,0,.08); border: 1px solid rgba(253,28,0,.3); color: #fd1c00; font-size: 13px; border-radius: 8px; margin-bottom: 12px; }
      `}</style>

      <div className="ata">
        <div className="ata-head">
          <div>
            <h1 className="ata-h1">Terms Acceptance Overview</h1>
            <p className="ata-sub">Track guideline acknowledgement across all 160 teams. Includes venue allocation and per-member timestamps.</p>
          </div>
          {data && (
            <button className="ata-export" onClick={exportCsv}>
              <span className="ata-export-icn">{I.download}</span>
              Export CSV
            </button>
          )}
        </div>

        {error && <div className="ata-err">{error}</div>}

        {loading && !data ? (
          <div className="ata-loading">Loading data…</div>
        ) : data ? (
          <>
            {/* Top stats */}
            <div className="ata-stats">
              <div className="ata-stat" style={{ "--ata-accent": "#10b981" }}>
                <div className="ata-stat-num">{data.stats.accepted_members}</div>
                <div className="ata-stat-lab">Accepted</div>
                <div className="ata-stat-meta">of {data.stats.total_members} members</div>
              </div>
              <div className="ata-stat" style={{ "--ata-accent": "#eea727" }}>
                <div className="ata-stat-num">{data.stats.pending_members}</div>
                <div className="ata-stat-lab">Pending</div>
                <div className="ata-stat-meta">awaiting acknowledgement</div>
              </div>
              <div className="ata-stat" style={{ "--ata-accent": "#10b981" }}>
                <div className="ata-stat-num">{data.stats.teams_fully_accepted}</div>
                <div className="ata-stat-lab">Teams Complete</div>
                <div className="ata-stat-meta">all members accepted</div>
              </div>
              <div className="ata-stat" style={{ "--ata-accent": "#eea727" }}>
                <div className="ata-stat-num">{data.stats.teams_partial}</div>
                <div className="ata-stat-lab">Teams Partial</div>
                <div className="ata-stat-meta">some pending</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="ata-progress">
              <div className="ata-progress-head">
                <span className="ata-progress-lab">Overall Completion</span>
                <span className="ata-progress-pct">{data.stats.completion_pct}%</span>
              </div>
              <div className="ata-progress-bar">
                <div className="ata-progress-fill" style={{ width: `${data.stats.completion_pct}%` }} />
              </div>
            </div>

            {/* Tech-wise breakdown */}
            {data.tech_stats && data.tech_stats.length > 0 && (
              <div className="ata-tech-stats">
                {data.tech_stats.map((ts) => {
                  const pct = ts.total > 0 ? Math.round((ts.accepted / ts.total) * 100) : 0;
                  return (
                    <div key={ts.tech} className="ata-tech">
                      <div className="ata-tech-name">{ts.tech || "—"}</div>
                      <div className="ata-tech-bar">
                        <div className="ata-tech-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="ata-tech-pct">{ts.accepted}/{ts.total} · {pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Controls */}
            <div className="ata-controls">
              <div className="ata-search-wrap">
                <span className="ata-search-icn">{I.search}</span>
                <input
                  className="ata-search"
                  placeholder="Search team, project or mentor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="ata-select" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
                <option value="">All Technologies</option>
                {TECHNOLOGIES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="ata-pills">
                <button className={`ata-pill ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>All</button>
                <button className={`ata-pill ${statusFilter === "accepted" ? "active" : ""}`} onClick={() => setStatusFilter("accepted")}>Accepted</button>
                <button className={`ata-pill ${statusFilter === "partial" ? "active" : ""}`} onClick={() => setStatusFilter("partial")}>Partial</button>
                <button className={`ata-pill ${statusFilter === "pending" ? "active" : ""}`} onClick={() => setStatusFilter("pending")}>Pending</button>
              </div>
            </div>

            {/* Team list */}
            <div className="ata-list">
              {filtered.map((t) => {
                const isExp = expanded[t.team_number];
                const stClass = `ata-st-${t.team_status}`;
                const stLabel =
                  t.team_status === "accepted" ? "All Accepted" :
                  t.team_status === "partial" ? `${t.accepted_count}/${t.total_count}` :
                  "Pending";
                return (
                  <div key={t.team_number} className="ata-card">
                    <div className="ata-row" onClick={() => setExpanded((p) => ({ ...p, [t.team_number]: !p[t.team_number] }))}>
                      <span className="ata-tnum">{t.team_number}</span>
                      <div className="ata-info">
                        <div className="ata-title">{t.project_title || "Untitled"}</div>
                        <div className="ata-tech-tag">{t.technology || ""}</div>
                      </div>
                      <span className="ata-mentor">{t.mentor_name || "—"}</span>
                      {t.venue && (
                        <span className="ata-venue">
                          F<strong>{t.venue.floor}</strong> · D<strong>{t.venue.desk}</strong>
                        </span>
                      )}
                      <span className={`ata-status ${stClass}`}>{stLabel}</span>
                      <span className={`ata-chev ${isExp ? "rot" : ""}`}>{I.chevron}</span>
                    </div>

                    <div className="ata-mobile-meta">
                      <span className="ata-mentor">Mentor: {t.mentor_name || "—"}</span>
                      {t.venue && <span className="ata-venue">Floor <strong>{t.venue.floor}</strong> · Desk <strong>{t.venue.desk}</strong></span>}
                    </div>

                    {isExp && (
                      <div className="ata-body">
                        <table className="ata-mtbl">
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
                                <td className="ata-mroll">{m.roll_number}</td>
                                <td>
                                  {m.short_name || "—"}
                                  {m.is_leader && <span className="ata-leader">Leader</span>}
                                </td>
                                <td>
                                  {m.accepted ? (
                                    <span className="ata-mst ata-mst-acc">
                                      <span className="ata-mst-icn">{I.check}</span>Accepted
                                    </span>
                                  ) : (
                                    <span className="ata-mst ata-mst-pend">
                                      <span className="ata-mst-icn">{I.clock}</span>Pending
                                    </span>
                                  )}
                                </td>
                                <td className="ata-mts">{fmtDate(m.accepted_at) || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="ata-empty">No teams match your filters.</div>}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}