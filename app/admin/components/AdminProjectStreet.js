"use client";
import { useState, useEffect } from "react";

export default function AdminProjectStreet() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/project-street')
      .then(r => r.json())
      .then(d => { if (d.teams) setTeams(d.teams); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);

  const DATES = {
    1: { date: '2026-05-06', label: 'Day 1', sub: 'Wed, May 6' },
    2: { date: '2026-05-07', label: 'Day 2', sub: 'Thu, May 7' },
    3: { date: '2026-05-08', label: 'Day 3', sub: 'Fri, May 8' },
    4: { date: '2026-05-09', label: 'Day 4', sub: 'Sat, May 9' },
    5: { date: '2026-05-10', label: 'Day 5', sub: 'Sun, May 10' },
    6: { date: '2026-05-11', label: 'Day 6', sub: 'Mon, May 11' },
  };

  const TECH_COLORS = {
    'AWS Development': '#ff9900',
    'Google Flutter': '#42a5f5',
    'Full Stack': '#4ade80',
    'Data Specialist': '#a78bfa',
    'ServiceNow': '#22c55e',
    'VLSI': '#ef4444',
    'SkillUp Coder': '#f59e0b'
  };

  const technologies = ['all', ...Array.from(new Set(teams.map(t => t.technology).filter(Boolean)))];

  const filtered = teams.filter(t => {
    if (activeDay !== 'all' && t.project_street_day !== parseInt(activeDay)) return false;
    if (techFilter !== 'all' && t.technology !== techFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.team_number || '').toLowerCase().includes(q) &&
          !(t.project_title || '').toLowerCase().includes(q) &&
          !(t.mentor_assigned || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const dayCounts = {};
  for (let i = 1; i <= 6; i++) dayCounts[i] = teams.filter(t => t.project_street_day === i).length;

  const isPast = (psDate) => {
    if (!psDate) return false;
    const d = new Date(psDate + 'T00:00:00');
    return d < today;
  };
  const isTodayDate = (psDate) => {
    if (!psDate) return false;
    const d = new Date(psDate + 'T00:00:00');
    return d.getTime() === today.getTime();
  };

  return (
    <div className="aps-wrap">
      <style>{`
        .aps-wrap { animation: apsIn .5s ease both; }
        @keyframes apsIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .aps-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
        .aps-title { font-size: 1.1rem; font-weight: 700; color: #fff; }
        .aps-sub { font-size: .68rem; color: rgba(255,255,255,.35); margin-top: 2px; }
        .aps-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .aps-stat { padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); font-size: .68rem; color: rgba(255,255,255,.7); font-weight: 600; }
        .aps-stat strong { color: #fd1c00; font-weight: 800; margin-right: 4px; }
        .aps-stat.past strong { color: #4ade80; }
        .aps-stat.today strong { color: #fd1c00; }

        .aps-day-tabs { display: flex; gap: 6px; padding: 6px; border-radius: 14px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); margin-bottom: 14px; overflow-x: auto; }
        .aps-day-tabs::-webkit-scrollbar { display: none; }
        .aps-day-tab { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 9px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.02); color: rgba(255,255,255,.5); font-size: .7rem; font-weight: 600; font-family: 'DM Sans',sans-serif; cursor: pointer; transition: all .25s; white-space: nowrap; flex-shrink: 0; min-width: 96px; }
        .aps-day-tab:hover { color: #fff; border-color: rgba(255,255,255,.15); }
        .aps-day-tab.active { background: linear-gradient(135deg,rgba(253,28,0,.15),rgba(238,167,39,.08)); color: #fff; border-color: rgba(253,28,0,.3); }
        .aps-day-tab.past { color: #4ade80; }
        .aps-day-tab.today { color: #fd1c00; animation: apsTodayPulse 2s ease-in-out infinite; }
        @keyframes apsTodayPulse { 0%,100% { box-shadow: 0 0 0 transparent; } 50% { box-shadow: 0 0 14px rgba(253,28,0,.3); } }
        .aps-day-tab-count { font-size: .55rem; color: rgba(255,255,255,.3); font-weight: 500; letter-spacing: .5px; text-transform: uppercase; }
        .aps-day-tab.active .aps-day-tab-count { color: rgba(255,255,255,.5); }

        .aps-filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .aps-search { flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); }
        .aps-search:focus-within { border-color: rgba(253,28,0,.3); }
        .aps-search input { flex: 1; background: none; border: none; outline: none; color: #fff; font-family: 'DM Sans',sans-serif; font-size: .78rem; }
        .aps-search input::placeholder { color: rgba(255,255,255,.3); }
        .aps-tech-select { padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08); color: #fff; font-family: 'DM Sans',sans-serif; font-size: .76rem; outline: none; cursor: pointer; min-width: 160px; }

        .aps-day-section { margin-bottom: 24px; }
        .aps-day-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px 12px 0 0; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-bottom: none; }
        .aps-day-header.past { background: linear-gradient(135deg,rgba(74,222,128,.08),rgba(34,197,94,.04)); border-color: rgba(74,222,128,.25); }
        .aps-day-header.today { background: linear-gradient(135deg,rgba(253,28,0,.1),rgba(238,167,39,.05)); border-color: rgba(253,28,0,.3); }
        .aps-day-header-num { font-family: 'Orbitron','DM Sans',sans-serif; font-size: 1.2rem; font-weight: 800; color: #fff; }
        .aps-day-header.past .aps-day-header-num { color: #4ade80; }
        .aps-day-header.today .aps-day-header-num { color: #fd1c00; }
        .aps-day-header-date { font-size: .76rem; color: rgba(255,255,255,.6); font-weight: 600; }
        .aps-day-header-count { margin-left: auto; padding: 4px 12px; border-radius: 100px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); font-size: .68rem; color: #fff; font-weight: 700; }
        .aps-day-status { padding: 4px 12px; border-radius: 100px; font-size: .58rem; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
        .aps-day-status.past { background: rgba(74,222,128,.15); color: #4ade80; border: 1px solid rgba(74,222,128,.3); }
        .aps-day-status.today { background: rgba(253,28,0,.15); color: #fd1c00; border: 1px solid rgba(253,28,0,.3); animation: apsTodayPulse 2s ease-in-out infinite; }
        .aps-day-status.upcoming { background: rgba(238,167,39,.1); color: #EEA727; border: 1px solid rgba(238,167,39,.2); }

        .aps-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 8px; padding: 10px; border-radius: 0 0 12px 12px; background: rgba(0,0,0,.15); border: 1px solid rgba(255,255,255,.06); border-top: none; }
        .aps-team-card { padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); transition: all .2s; position: relative; overflow: hidden; }
        .aps-team-card:hover { background: rgba(255,255,255,.05); transform: translateY(-1px); }
        .aps-team-card.past::before { content: '✓'; position: absolute; top: 8px; right: 10px; font-size: 1.1rem; color: #4ade80; font-weight: 800; line-height: 1; }
        .aps-team-card.past { border-color: rgba(74,222,128,.2); background: rgba(74,222,128,.04); }
        .aps-team-card.today { border-color: rgba(253,28,0,.3); background: rgba(253,28,0,.05); }
        .aps-team-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .aps-team-num { font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 800; color: #fff; letter-spacing: .3px; }
        .aps-team-tech { font-size: .55rem; padding: 3px 8px; border-radius: 5px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; white-space: nowrap; }
        .aps-team-title { font-size: .76rem; color: rgba(255,255,255,.85); font-weight: 600; line-height: 1.3; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .aps-team-mentor { display: flex; align-items: center; gap: 6px; font-size: .66rem; color: rgba(255,255,255,.45); margin-top: 6px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.05); }
        .aps-team-mentor svg { color: rgba(238,167,39,.7); flex-shrink: 0; }
        .aps-team-mentor span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .aps-team-done-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 100px; background: rgba(74,222,128,.15); color: #4ade80; font-size: .54rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; margin-top: 4px; }

        .aps-empty { padding: 60px 20px; text-align: center; color: rgba(255,255,255,.3); font-size: .82rem; }

        @media (max-width: 768px) {
          .aps-day-tabs { padding: 4px; gap: 4px; }
          .aps-day-tab { min-width: 80px; padding: 8px 10px; font-size: .65rem; }
          .aps-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="aps-head">
        <div>
          <div className="aps-title">Project Street Schedule</div>
          <div className="aps-sub">160 teams across 6 days · May 6 – May 11, 2026 · 4:30 – 6:30 PM daily</div>
        </div>
        <div className="aps-stats">
          {Object.entries(DATES).map(([d, info]) => {
            const isP = new Date(info.date + 'T00:00:00') < today;
            const isT = new Date(info.date + 'T00:00:00').getTime() === today.getTime();
            return (
              <div key={d} className={`aps-stat ${isT ? 'today' : isP ? 'past' : ''}`}>
                <strong>{dayCounts[d] || 0}</strong>Day {d}{isP ? ' ✓' : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="aps-day-tabs">
        <div className={`aps-day-tab ${activeDay === 'all' ? 'active' : ''}`} onClick={() => setActiveDay('all')}>
          <span>All Days</span>
          <span className="aps-day-tab-count">{teams.length} teams</span>
        </div>
        {Object.entries(DATES).map(([d, info]) => {
          const isP = new Date(info.date + 'T00:00:00') < today;
          const isT = new Date(info.date + 'T00:00:00').getTime() === today.getTime();
          return (
            <div key={d} className={`aps-day-tab ${activeDay === d ? 'active' : ''} ${isT ? 'today' : isP ? 'past' : ''}`} onClick={() => setActiveDay(d)}>
              <span>{info.label}{isP ? ' ✓' : ''}</span>
              <span className="aps-day-tab-count">{dayCounts[d] || 0} · {info.sub.split(',')[1]?.trim() || info.sub}</span>
            </div>
          );
        })}
      </div>

      <div className="aps-filters">
        <div className="aps-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input placeholder="Search team, project, or mentor..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="aps-tech-select" value={techFilter} onChange={e => setTechFilter(e.target.value)}>
          {technologies.map(t => <option key={t} value={t} style={{background:'#13101a'}}>{t === 'all' ? 'All Technologies' : t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="aps-empty">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="aps-empty">No teams match your filters</div>
      ) : activeDay === 'all' ? (
        Object.entries(DATES).map(([d, info]) => {
          const dayTeams = filtered.filter(t => t.project_street_day === parseInt(d));
          if (dayTeams.length === 0) return null;
          const isP = new Date(info.date + 'T00:00:00') < today;
          const isT = new Date(info.date + 'T00:00:00').getTime() === today.getTime();
          return (
            <div key={d} className="aps-day-section">
              <div className={`aps-day-header ${isT ? 'today' : isP ? 'past' : ''}`}>
                <div>
                  <div className="aps-day-header-num">{info.label}</div>
                  <div className="aps-day-header-date">{info.sub}</div>
                </div>
                <div className={`aps-day-status ${isT ? 'today' : isP ? 'past' : 'upcoming'}`}>
                  {isT ? 'Live Today' : isP ? 'Done ✓' : 'Upcoming'}
                </div>
                <div className="aps-day-header-count">{dayTeams.length} teams</div>
              </div>
              <div className="aps-grid">
                {dayTeams.map(t => {
                  const past = isPast(t.project_street_date);
                  const todayMatch = isTodayDate(t.project_street_date);
                  const tc = TECH_COLORS[t.technology] || '#fd1c00';
                  return (
                    <div key={t.team_number} className={`aps-team-card ${past ? 'past' : todayMatch ? 'today' : ''}`}>
                      <div className="aps-team-row1">
                        <span className="aps-team-num">{t.team_number}</span>
                        <span className="aps-team-tech" style={{background:`${tc}18`,color:tc,border:`1px solid ${tc}30`}}>{t.technology}</span>
                      </div>
                      <div className="aps-team-title">{t.project_title || '—'}</div>
                      {past && <div className="aps-team-done-tag">✓ Project Street Done</div>}
                      <div className="aps-team-mentor">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span>{t.mentor_assigned || 'No mentor'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="aps-grid">
          {filtered.map(t => {
            const past = isPast(t.project_street_date);
            const todayMatch = isTodayDate(t.project_street_date);
            const tc = TECH_COLORS[t.technology] || '#fd1c00';
            return (
              <div key={t.team_number} className={`aps-team-card ${past ? 'past' : todayMatch ? 'today' : ''}`}>
                <div className="aps-team-row1">
                  <span className="aps-team-num">{t.team_number}</span>
                  <span className="aps-team-tech" style={{background:`${tc}18`,color:tc,border:`1px solid ${tc}30`}}>{t.technology}</span>
                </div>
                <div className="aps-team-title">{t.project_title || '—'}</div>
                {past && <div className="aps-team-done-tag">✓ Project Street Done</div>}
                <div className="aps-team-mentor">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>{t.mentor_assigned || 'No mentor'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}