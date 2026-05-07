// app/admin/MentorVoteLeaderboard.js
// Drop-in component for admin dashboard. Import and use as a section/tab.
// Usage in admin/page.js:
//   import MentorVoteLeaderboard from './MentorVoteLeaderboard';
//   {active === 'mentor-vote' && <MentorVoteLeaderboard />}

'use client';
import { useEffect, useState } from 'react';

export default function MentorVoteLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = async () => {
    try {
      const r = await fetch('/api/admin/mentor-vote-stats', { cache: 'no-store' });
      const d = await r.json();
      if (d.ok) setData(d);
      else setErr(d.error || 'Failed to load');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const exportCSV = () => {
    if (!data?.leaderboard) return;
    const rows = [
      ['Rank', 'Mentor', 'Emp ID', 'Total Votes', ...data.voteDays],
      ...data.leaderboard.map((p) => [
        p.rank,
        p.mentor_name,
        p.mentor_emp_id,
        p.total_votes,
        ...data.voteDays.map((d) => p.daily?.[d] || 0),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentor-vote-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 24, color: 'rgba(255,255,255,0.6)' }}>Loading leaderboard...</div>;
  if (err) return <div style={{ padding: 24, color: '#fd1c00' }}>Error: {err}</div>;
  if (!data) return null;

  const { leaderboard, summary, dailyTotals, voteDays } = data;
  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);
  const maxDaily = Math.max(...Object.values(dailyTotals), 1);

  return (
    <div className="mvl-wrap">
      <div className="mvl-head">
        <div>
          <h2 className="mvl-title">Mentor Vote Leaderboard</h2>
          <div className="mvl-sub">
            Voting Window: {summary.voteStart} to {summary.voteEnd}
          </div>
        </div>
        <button className="mvl-export" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mvl-stats">
        <Stat label="Total Posts" value={summary.totalPosts} color="#EEA727" />
        <Stat label="Total Votes Cast" value={summary.totalVotes} color="#fd1c00" />
        <Stat label="Unique Voters" value={summary.uniqueVoters} color="#4ade80" />
        <Stat
          label="Participation Rate"
          value={`${summary.participationRate}%`}
          sub={`${summary.uniqueVoters} / ${summary.totalStudents} students`}
          color="#7B2FBE"
        />
      </div>

      {/* PODIUM (top 3) */}
      {summary.totalVotes > 0 && (
        <div className="mvl-podium">
          {top3.map((p, i) => (
            <div key={p.id} className={`mvl-podium-card pos-${i + 1}`}>
              <div className="mvl-medal">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <img
                src={p.mentor_image_url}
                alt={p.mentor_name}
                className="mvl-podium-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="mvl-podium-name">{p.mentor_name}</div>
              <div className="mvl-podium-id">ID: {p.mentor_emp_id}</div>
              <div className="mvl-podium-votes">{p.total_votes} votes</div>
            </div>
          ))}
        </div>
      )}

      {/* DAILY BREAKDOWN BAR CHART */}
      <div className="mvl-section">
        <div className="mvl-section-title">Daily Votes</div>
        <div className="mvl-daily">
          {voteDays.map((d) => {
            const v = dailyTotals[d] || 0;
            const pct = (v / maxDaily) * 100;
            const dayLabel = new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            return (
              <div key={d} className="mvl-day">
                <div className="mvl-day-bar-wrap">
                  <div className="mvl-day-bar" style={{ height: `${pct}%` }}>
                    <span className="mvl-day-val">{v}</span>
                  </div>
                </div>
                <div className="mvl-day-label">{dayLabel}</div>
                <div className="mvl-day-date">{d.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL TABLE */}
      <div className="mvl-section">
        <div className="mvl-section-title">Full Ranking</div>
        <div className="mvl-table-wrap">
          <table className="mvl-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Mentor</th>
                <th>Emp ID</th>
                <th>Total Votes</th>
                <th>Share</th>
                {voteDays.map((d) => (
                  <th key={d} title={d}>
                    {d.slice(5)}
                  </th>
                ))}
                <th>Post</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p) => {
                const share =
                  summary.totalVotes > 0
                    ? Math.round((p.total_votes / summary.totalVotes) * 100)
                    : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <span className={`mvl-rank rank-${p.rank}`}>#{p.rank}</span>
                    </td>
                    <td>
                      <div className="mvl-mentor-cell">
                        <img
                          src={p.mentor_image_url}
                          alt=""
                          className="mvl-mini-avatar"
                          onError={(e) => {
                            e.currentTarget.style.opacity = 0.3;
                          }}
                        />
                        <span>{p.mentor_name}</span>
                      </div>
                    </td>
                    <td className="mvl-mono">{p.mentor_emp_id}</td>
                    <td>
                      <strong>{p.total_votes}</strong>
                    </td>
                    <td>
                      <div className="mvl-share-bar">
                        <div className="mvl-share-fill" style={{ width: `${share}%` }} />
                        <span>{share}%</span>
                      </div>
                    </td>
                    {voteDays.map((d) => (
                      <td key={d} className="mvl-mono">
                        {p.daily?.[d] || 0}
                      </td>
                    ))}
                    <td>
                      <a
                        href={p.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mvl-link"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .mvl-wrap {
          padding: 20px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
        }
        .mvl-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .mvl-title {
          margin: 0 0 4px;
          font-size: 22px;
          font-weight: 800;
        }
        .mvl-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .mvl-export {
          background: linear-gradient(135deg, #fd1c00, #ff5349);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .mvl-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 700px) {
          .mvl-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .mvl-podium {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        @media (max-width: 700px) {
          .mvl-podium {
            grid-template-columns: 1fr;
          }
        }
        .mvl-podium-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px;
          text-align: center;
          position: relative;
        }
        .mvl-podium-card.pos-1 {
          border-color: #FFD700;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), transparent);
        }
        .mvl-podium-card.pos-2 {
          border-color: #C0C0C0;
        }
        .mvl-podium-card.pos-3 {
          border-color: #CD7F32;
        }
        .mvl-medal {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .mvl-podium-img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(253, 28, 0, 0.5);
          margin-bottom: 8px;
        }
        .mvl-podium-name {
          font-size: 14px;
          font-weight: 700;
        }
        .mvl-podium-id {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          margin: 2px 0 8px;
        }
        .mvl-podium-votes {
          font-size: 18px;
          font-weight: 800;
          color: #EEA727;
        }
        .mvl-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .mvl-section-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 12px;
        }
        .mvl-daily {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          height: 200px;
          align-items: end;
        }
        .mvl-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .mvl-day-bar-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          padding: 0 12px;
        }
        .mvl-day-bar {
          width: 100%;
          background: linear-gradient(to top, #fd1c00, #EEA727);
          border-radius: 6px 6px 0 0;
          min-height: 4px;
          position: relative;
          transition: height 0.4s ease;
        }
        .mvl-day-val {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 700;
        }
        .mvl-day-label {
          font-size: 11px;
          font-weight: 600;
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.7);
        }
        .mvl-day-date {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.35);
        }
        .mvl-table-wrap {
          overflow-x: auto;
        }
        .mvl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .mvl-table th {
          text-align: left;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .mvl-table td {
          padding: 10px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .mvl-mentor-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mvl-mini-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .mvl-mono {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          color: rgba(255, 255, 255, 0.7);
        }
        .mvl-rank {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
        }
        .mvl-rank.rank-1 {
          background: rgba(255, 215, 0, 0.15);
          color: #FFD700;
        }
        .mvl-rank.rank-2 {
          background: rgba(192, 192, 192, 0.15);
          color: #C0C0C0;
        }
        .mvl-rank.rank-3 {
          background: rgba(205, 127, 50, 0.15);
          color: #CD7F32;
        }
        .mvl-share-bar {
          position: relative;
          height: 18px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
        }
        .mvl-share-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #fd1c00, #EEA727);
          border-radius: 4px;
        }
        .mvl-share-bar span {
          position: relative;
          z-index: 1;
          padding: 0 6px;
          line-height: 18px;
          font-size: 11px;
          font-weight: 700;
        }
        .mvl-link {
          color: #EEA727;
          font-weight: 600;
          text-decoration: none;
        }
        .mvl-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}