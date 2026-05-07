// app/dashboard/MentorVoteSection.js
// Embedded section — used inside app/dashboard/page.js when active === 'mentor-vote'
// Students see: their own vote count & history (X / 5 days). NO total vote counts.
'use client';
import { useEffect, useState } from 'react';

export default function MentorVoteSection({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [today, setToday] = useState('');
  const [votingOpen, setVotingOpen] = useState(false);
  const [voteStart, setVoteStart] = useState('');
  const [voteEnd, setVoteEnd] = useState('');
  const [voteDays, setVoteDays] = useState([]);
  const [userVotedToday, setUserVotedToday] = useState(null);
  const [userVoteHistory, setUserVoteHistory] = useState([]);
  const [userTotalVotes, setUserTotalVotes] = useState(0);
  const [maxVotes, setMaxVotes] = useState(5);
  const [flash, setFlash] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPosts = async () => {
    try {
      const roll = user?.rollNumber || user?.roll_number;
      const url = roll
        ? `/api/mentor-posts?roll=${encodeURIComponent(roll)}`
        : '/api/mentor-posts';
      const r = await fetch(url, { cache: 'no-store' });
      const d = await r.json();
      if (d.ok) {
        setPosts(d.posts || []);
        setToday(d.today);
        setVotingOpen(d.votingOpen);
        setVoteStart(d.voteStart);
        setVoteEnd(d.voteEnd);
        setVoteDays(d.voteDays || []);
        setUserVotedToday(d.userVotedToday);
        setUserVoteHistory(d.userVoteHistory || []);
        setUserTotalVotes(d.userTotalVotes || 0);
        setMaxVotes(d.maxVotes || 5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user?.rollNumber, user?.roll_number]);

  const handleVote = async (post) => {
    if (voting) return;
    if (userVotedToday) {
      setFlash({ type: 'warn', text: 'You have already voted today.' });
      setTimeout(() => setFlash(null), 4000);
      return;
    }
    if (!votingOpen) {
      setFlash({ type: 'warn', text: 'Voting is currently closed.' });
      setTimeout(() => setFlash(null), 4000);
      return;
    }
    if (!user) {
      setFlash({ type: 'warn', text: 'Please log in to vote.' });
      setTimeout(() => setFlash(null), 4000);
      return;
    }

    setVoting(post.id);
    try {
      const r = await fetch('/api/mentor-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          voter_roll: user.rollNumber || user.roll_number,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        window.open(post.linkedin_url, '_blank', 'noopener,noreferrer');
        setUserVotedToday({
          post_id: post.id,
          mentor_emp_id: post.mentor_emp_id,
          voted_at: new Date().toISOString(),
        });
        // Append to history
        setUserVoteHistory(h => [...h, {
          post_id: post.id,
          mentor_emp_id: post.mentor_emp_id,
          mentor_name: post.mentor_name,
          vote_date: today,
          created_at: new Date().toISOString(),
        }]);
        setUserTotalVotes(t => t + 1);
        setFlash({
          type: 'success',
          text: `Vote recorded for ${post.mentor_name}! LinkedIn opened — please like the post there too.`,
        });
      } else {
        setFlash({ type: 'error', text: d.error || 'Vote failed' });
      }
    } catch (e) {
      setFlash({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setVoting(null);
      setTimeout(() => setFlash(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="mvs-loading">
        <div className="mvs-spinner" />
        <style jsx>{`
          .mvs-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50vh;
          }
          .mvs-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(253, 28, 0, 0.15);
            border-top-color: #fd1c00;
            border-radius: 50%;
            animation: mvsspin 0.8s linear infinite;
          }
          @keyframes mvsspin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Build a set of dates the user has voted on (for the day-by-day strip)
  const votedDateSet = new Set(userVoteHistory.map(v => v.vote_date));

  return (
    <div className="mvs-wrap">
      <div className="mvs-header">
        <h2 className="mvs-title">Mentor LinkedIn Post Voting</h2>
        <p className="mvs-subtitle">
          Our mentors created amazing AI-generated posts — vote for your favorite!
        </p>
      </div>

      {/* PERSONAL VOTE COUNTER */}
      <div className="mvs-counter">
        <div className="mvs-counter-main">
          <div className="mvs-counter-label">YOUR VOTES</div>
          <div className="mvs-counter-value">
            <span className="mvs-counter-num">{userTotalVotes}</span>
            <span className="mvs-counter-of">/ {maxVotes}</span>
          </div>
          <div className="mvs-counter-sub">
            {userTotalVotes === 0 ? 'Cast your first vote!' :
             userTotalVotes === maxVotes ? 'You voted every day! 🎉' :
             userVotedToday ? `Done for today — ${maxVotes - userTotalVotes} more days to go` :
             `${maxVotes - userTotalVotes} ${maxVotes - userTotalVotes === 1 ? 'day' : 'days'} remaining`}
          </div>
        </div>
        <div className="mvs-counter-days">
          {voteDays.map((d) => {
            const voted = votedDateSet.has(d);
            const isToday = d === today;
            const isPast = d < today;
            const dayNum = parseInt(d.slice(-2), 10);
            return (
              <div key={d} className={`mvs-day-pip ${voted ? 'voted' : ''} ${isToday ? 'today' : ''} ${isPast && !voted ? 'missed' : ''}`}>
                <div className="mvs-day-pip-num">{dayNum}</div>
                <div className="mvs-day-pip-label">May</div>
                {voted && <div className="mvs-day-pip-check">✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mvs-info">
        <div className="mvs-info-row">
          <Icon name="calendar" />
          <span>
            Voting Window: <strong>May 7 – May 11, 2026</strong>
            {today && <span className="mvs-today"> · Today: {today}</span>}
          </span>
        </div>
        <div className="mvs-info-row">
          <Icon name="vote" />
          <span>
            <strong>1 vote per day</strong>. Clicking Vote opens the LinkedIn post — please like it there too!
          </span>
        </div>
      </div>

      {!votingOpen && (
        <div className="mvs-status closed">
          <Icon name="lock" />
          <div>
            <strong>Voting is currently closed.</strong>
            <div className="mvs-status-sub">Window is {voteStart} to {voteEnd} (IST).</div>
          </div>
        </div>
      )}
      {votingOpen && userVotedToday && (
        <div className="mvs-status voted">
          <Icon name="check" />
          <div>
            <strong>You've voted today!</strong>
            <div className="mvs-status-sub">Come back tomorrow. Voting open until May 11.</div>
          </div>
        </div>
      )}
      {votingOpen && !userVotedToday && (
        <div className="mvs-status active">
          <Icon name="bolt" />
          <div>
            <strong>Voting is OPEN.</strong>
            <div className="mvs-status-sub">You have 1 vote today — choose your favorite!</div>
          </div>
        </div>
      )}

      {/* VOTE HISTORY (collapsible) */}
      {userVoteHistory.length > 0 && (
        <div className="mvs-history">
          <button
            className="mvs-history-toggle"
            onClick={() => setShowHistory(s => !s)}
          >
            <Icon name="clock" />
            <span>Your voting history ({userVoteHistory.length})</span>
            <span className="mvs-history-arrow">{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="mvs-history-list">
              {userVoteHistory.map((v, i) => (
                <div key={i} className="mvs-history-item">
                  <div className="mvs-history-date">{v.vote_date}</div>
                  <div className="mvs-history-mentor">
                    Voted for <strong>{v.mentor_name}</strong> (ID: {v.mentor_emp_id})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {flash && (
        <div className={`mvs-flash ${flash.type}`}>
          <span>{flash.text}</span>
          <button className="mvs-flash-x" onClick={() => setFlash(null)}>×</button>
        </div>
      )}

      <div className="mvs-grid">
        {posts.map((p) => {
          const isVotedPost = userVotedToday?.post_id === p.id;
          const everVotedFor = userVoteHistory.some(v => v.post_id === p.id);
          const disabled = !votingOpen || !!userVotedToday || voting === p.id;
          return (
            <div key={p.id} className={`mvs-card ${isVotedPost ? 'voted' : ''} ${everVotedFor && !isVotedPost ? 'past-voted' : ''}`}>
              {everVotedFor && (
                <div className="mvs-past-badge">
                  <Icon name="check" /> You voted before
                </div>
              )}
              <div className="mvs-mentor">
                <img
                  src={p.mentor_image_url}
                  alt={p.mentor_name}
                  className="mvs-avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23222"/><text x="50" y="55" text-anchor="middle" fill="%23fd1c00" font-family="Arial" font-size="40" font-weight="bold">' +
                      (p.mentor_name?.[0] || 'M') + '</text></svg>';
                  }}
                />
                <div className="mvs-mentor-info">
                  <div className="mvs-mentor-name">{p.mentor_name}</div>
                  <div className="mvs-mentor-id">ID: {p.mentor_emp_id}</div>
                </div>
              </div>

              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mvs-img-wrap"
              >
                <img
                  src={p.post_image_url}
                  alt={`${p.mentor_name}'s post`}
                  className="mvs-img"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23111"/><text x="200" y="200" text-anchor="middle" fill="%23555" font-family="Arial" font-size="20">Image not available</text></svg>';
                  }}
                />
                <div className="mvs-img-overlay">
                  <Icon name="external" />
                  <span>View on LinkedIn</span>
                </div>
              </a>

              <button
                className={`mvs-vote-btn ${isVotedPost ? 'voted' : disabled ? 'disabled' : ''}`}
                onClick={() => handleVote(p)}
                disabled={disabled}
              >
                {voting === p.id ? (
                  <><span className="mvs-mini-spinner" /> Recording...</>
                ) : isVotedPost ? (
                  <><Icon name="heart-filled" /> Voted today!</>
                ) : userVotedToday ? (
                  <><Icon name="lock" /> Already voted today</>
                ) : !votingOpen ? (
                  <><Icon name="lock" /> Voting closed</>
                ) : (
                  <><Icon name="heart" /> Vote &amp; Open</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .mvs-wrap { font-family: 'DM Sans', sans-serif; color: #fff; }
        .mvs-header { margin-bottom: 16px; }
        .mvs-title {
          font-size: 24px; font-weight: 800; margin: 0 0 6px;
          background: linear-gradient(90deg, #fd1c00, #ff5349, #EEA727);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mvs-subtitle { margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.55); }

        /* COUNTER */
        .mvs-counter {
          background: linear-gradient(135deg, rgba(253, 28, 0, 0.08), rgba(238, 167, 39, 0.05));
          border: 1px solid rgba(253, 28, 0, 0.25);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .mvs-counter-main { flex: 1; min-width: 200px; }
        .mvs-counter-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5); margin-bottom: 4px;
        }
        .mvs-counter-value {
          display: flex; align-items: baseline; gap: 4px;
        }
        .mvs-counter-num {
          font-size: 36px; font-weight: 800;
          background: linear-gradient(135deg, #fd1c00, #EEA727);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mvs-counter-of {
          font-size: 18px; font-weight: 600; color: rgba(255, 255, 255, 0.4);
        }
        .mvs-counter-sub {
          font-size: 12px; color: rgba(255, 255, 255, 0.55); margin-top: 2px;
        }
        .mvs-counter-days {
          display: flex; gap: 6px;
        }
        .mvs-day-pip {
          width: 44px; height: 52px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          position: relative;
          transition: all 0.2s;
        }
        .mvs-day-pip.today {
          border-color: rgba(238, 167, 39, 0.5);
          box-shadow: 0 0 12px rgba(238, 167, 39, 0.2);
        }
        .mvs-day-pip.voted {
          background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05));
          border-color: rgba(74, 222, 128, 0.4);
        }
        .mvs-day-pip.missed {
          opacity: 0.4;
        }
        .mvs-day-pip-num {
          font-size: 16px; font-weight: 800; color: #fff;
        }
        .mvs-day-pip-label {
          font-size: 8px; color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .mvs-day-pip-check {
          position: absolute; top: -4px; right: -4px;
          width: 16px; height: 16px;
          background: #4ade80; border-radius: 50%;
          color: #000; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #050008;
        }

        /* HISTORY */
        .mvs-history {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .mvs-history-toggle {
          width: 100%;
          background: none; border: none;
          padding: 12px 16px;
          color: rgba(255, 255, 255, 0.7);
          font-family: inherit; font-size: 12px; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
        }
        .mvs-history-toggle:hover { color: #fff; }
        .mvs-history-arrow { margin-left: auto; font-size: 10px; }
        .mvs-history-list {
          padding: 0 16px 12px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mvs-history-item {
          padding: 8px 12px;
          background: rgba(74, 222, 128, 0.05);
          border: 1px solid rgba(74, 222, 128, 0.15);
          border-radius: 8px;
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 12px;
        }
        .mvs-history-date {
          font-weight: 700; color: #4ade80;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        .mvs-history-mentor { color: rgba(255, 255, 255, 0.75); }

        .mvs-info {
          display: flex; flex-direction: column; gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 16px;
        }
        .mvs-info-row {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: rgba(255, 255, 255, 0.75);
        }
        .mvs-info-row :global(svg) { color: #EEA727; flex-shrink: 0; }
        .mvs-today { color: rgba(255, 255, 255, 0.4); }
        .mvs-status {
          display: flex; align-items: center; gap: 12px;
          border-radius: 12px; padding: 14px 18px;
          margin-bottom: 16px; border: 1px solid;
        }
        .mvs-status.active {
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.3); color: #4ade80;
        }
        .mvs-status.voted {
          background: rgba(238, 167, 39, 0.08);
          border-color: rgba(238, 167, 39, 0.3); color: #EEA727;
        }
        .mvs-status.closed {
          background: rgba(253, 28, 0, 0.08);
          border-color: rgba(253, 28, 0, 0.3); color: #fd1c00;
        }
        .mvs-status :global(svg) { flex-shrink: 0; }
        .mvs-status-sub {
          font-size: 12px; opacity: 0.75; font-weight: 400; margin-top: 2px;
        }
        .mvs-flash {
          padding: 12px 16px; border-radius: 10px; margin-bottom: 16px;
          font-size: 13px; display: flex;
          justify-content: space-between; align-items: center; gap: 10px;
        }
        .mvs-flash.success {
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3); color: #4ade80;
        }
        .mvs-flash.warn {
          background: rgba(238, 167, 39, 0.1);
          border: 1px solid rgba(238, 167, 39, 0.3); color: #EEA727;
        }
        .mvs-flash.error {
          background: rgba(253, 28, 0, 0.1);
          border: 1px solid rgba(253, 28, 0, 0.3); color: #fd1c00;
        }
        .mvs-flash-x {
          background: none; border: none; color: inherit;
          font-size: 20px; cursor: pointer; opacity: 0.6; padding: 0 4px;
        }
        .mvs-flash-x:hover { opacity: 1; }
        .mvs-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        @media (max-width: 1100px) { .mvs-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 800px) { .mvs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .mvs-grid { grid-template-columns: 1fr; } }
        .mvs-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px; overflow: hidden;
          display: flex; flex-direction: column;
          transition: all 0.25s ease;
          position: relative;
        }
        .mvs-card:hover {
          border-color: rgba(253, 28, 0, 0.3);
          transform: translateY(-2px);
        }
        .mvs-card.voted {
          border-color: #EEA727;
          box-shadow: 0 0 20px rgba(238, 167, 39, 0.25);
        }
        .mvs-card.past-voted {
          border-color: rgba(74, 222, 128, 0.3);
        }
        .mvs-past-badge {
          position: absolute; top: 8px; right: 8px;
          background: rgba(74, 222, 128, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.4);
          color: #4ade80;
          font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 6px;
          display: flex; align-items: center; gap: 4px;
          z-index: 2;
          backdrop-filter: blur(4px);
        }
        .mvs-past-badge :global(svg) { width: 10px; height: 10px; }
        .mvs-mentor {
          display: flex; align-items: center; gap: 10px;
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .mvs-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          object-fit: cover; border: 2px solid rgba(253, 28, 0, 0.5);
        }
        .mvs-mentor-info { flex: 1; min-width: 0; }
        .mvs-mentor-name {
          font-size: 13px; font-weight: 700;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mvs-mentor-id {
          font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-top: 1px;
        }
        .mvs-img-wrap {
          position: relative; display: block;
          aspect-ratio: 1 / 1; overflow: hidden; background: #0a0a0a;
        }
        .mvs-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .mvs-img-wrap:hover .mvs-img { transform: scale(1.05); }
        .mvs-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 50%);
          display: flex; align-items: flex-end; justify-content: center;
          padding: 12px; gap: 6px;
          font-size: 12px; font-weight: 600;
          opacity: 0; transition: opacity 0.25s;
        }
        .mvs-img-wrap:hover .mvs-img-overlay { opacity: 1; }
        .mvs-vote-btn {
          margin: 12px; padding: 10px 14px;
          border-radius: 10px; border: none;
          background: linear-gradient(135deg, #fd1c00, #ff5349);
          color: white;
          font-family: inherit; font-weight: 700; font-size: 13px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: all 0.2s;
        }
        .mvs-vote-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(253, 28, 0, 0.4);
        }
        .mvs-vote-btn.disabled, .mvs-vote-btn:disabled {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.4); cursor: not-allowed;
        }
        .mvs-vote-btn.voted {
          background: linear-gradient(135deg, #EEA727, #ff5349);
          color: white;
        }
        .mvs-mini-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: mvsspin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes mvsspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Icon({ name }) {
  const props = {
    width: 18, height: 18, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'heart':
      return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'heart-filled':
      return <svg {...props} fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case 'check':
      return <svg {...props}><polyline points="20 6 9 17 4 12" /></svg>;
    case 'bolt':
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'vote':
      return <svg {...props}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case 'external':
      return <svg {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
    default:
      return null;
  }
}