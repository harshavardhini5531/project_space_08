// app/api/mentor-posts/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(utc + istOffset);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, '0');
  const d = String(ist.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const VOTE_START = '2026-05-07';
const VOTE_END = '2026-05-11';
const VOTE_DAYS = ['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11'];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const voterRoll = searchParams.get('roll') || null;

    const { data: posts, error: postsErr } = await supabase
      .from('mentor_posts')
      .select('id, mentor_emp_id, mentor_name, mentor_image_url, post_image_url, linkedin_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (postsErr) {
      return NextResponse.json({ ok: false, error: postsErr.message }, { status: 500 });
    }

    const today = getISTDate();
    const votingOpen = today >= VOTE_START && today <= VOTE_END;

    let userVotedToday = null;
    let userVoteHistory = []; // array of { post_id, mentor_emp_id, mentor_name, vote_date }
    let userTotalVotes = 0;

    if (voterRoll) {
      // Get ALL of user's votes across the 5 days
      const { data: allUserVotes } = await supabase
        .from('mentor_post_votes')
        .select('post_id, mentor_emp_id, vote_date, created_at')
        .eq('voter_roll', voterRoll)
        .gte('vote_date', VOTE_START)
        .lte('vote_date', VOTE_END)
        .order('vote_date', { ascending: true });

      if (allUserVotes && allUserVotes.length > 0) {
        const postById = {};
        posts.forEach(p => { postById[p.id] = p; });

        userVoteHistory = allUserVotes.map(v => ({
          post_id: v.post_id,
          mentor_emp_id: v.mentor_emp_id,
          mentor_name: postById[v.post_id]?.mentor_name || `Mentor ${v.mentor_emp_id}`,
          vote_date: v.vote_date,
          created_at: v.created_at,
        }));
        userTotalVotes = allUserVotes.length;

        const todayVote = allUserVotes.find(v => v.vote_date === today);
        if (todayVote) {
          userVotedToday = {
            post_id: todayVote.post_id,
            mentor_emp_id: todayVote.mentor_emp_id,
            voted_at: todayVote.created_at,
          };
        }
      }
    }

    return NextResponse.json({
      ok: true,
      posts,
      today,
      votingOpen,
      voteStart: VOTE_START,
      voteEnd: VOTE_END,
      voteDays: VOTE_DAYS,
      userVotedToday,
      userVoteHistory,
      userTotalVotes,
      maxVotes: VOTE_DAYS.length,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}