// app/api/admin/mentor-vote-stats/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VOTE_START = '2026-05-07';
const VOTE_END = '2026-05-11';
const VOTE_DAYS = ['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-11'];

export async function GET() {
  try {
    // Posts (active ones)
    const { data: posts, error: postsErr } = await supabase
      .from('mentor_posts')
      .select('id, mentor_emp_id, mentor_name, mentor_image_url, post_image_url, linkedin_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (postsErr) {
      return NextResponse.json({ ok: false, error: postsErr.message }, { status: 500 });
    }

    // All votes
    const { data: votes, error: votesErr } = await supabase
      .from('mentor_post_votes')
      .select('post_id, mentor_emp_id, voter_roll, vote_date, created_at')
      .order('created_at', { ascending: false });

    if (votesErr) {
      return NextResponse.json({ ok: false, error: votesErr.message }, { status: 500 });
    }

    // Per-post totals
    const votesByPostId = {};
    const dailyByPostId = {};
    posts.forEach((p) => {
      votesByPostId[p.id] = 0;
      dailyByPostId[p.id] = Object.fromEntries(VOTE_DAYS.map((d) => [d, 0]));
    });

    votes.forEach((v) => {
      if (votesByPostId[v.post_id] !== undefined) {
        votesByPostId[v.post_id] += 1;
        if (dailyByPostId[v.post_id][v.vote_date] !== undefined) {
          dailyByPostId[v.post_id][v.vote_date] += 1;
        }
      }
    });

    // Build leaderboard
    const leaderboard = posts
      .map((p) => ({
        ...p,
        total_votes: votesByPostId[p.id] || 0,
        daily: dailyByPostId[p.id],
      }))
      .sort((a, b) => b.total_votes - a.total_votes);

    // Add rank
    let rank = 0;
    let lastVotes = -1;
    leaderboard.forEach((row, i) => {
      if (row.total_votes !== lastVotes) {
        rank = i + 1;
        lastVotes = row.total_votes;
      }
      row.rank = rank;
    });

    // Daily totals (across all posts)
    const dailyTotals = Object.fromEntries(VOTE_DAYS.map((d) => [d, 0]));
    votes.forEach((v) => {
      if (dailyTotals[v.vote_date] !== undefined) dailyTotals[v.vote_date] += 1;
    });

    // Unique voters
    const uniqueVoters = new Set(votes.map((v) => v.voter_roll)).size;

    // Total students for participation rate
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      ok: true,
      leaderboard,
      summary: {
        totalPosts: posts.length,
        totalVotes: votes.length,
        uniqueVoters,
        totalStudents: totalStudents || 0,
        participationRate:
          totalStudents > 0 ? Math.round((uniqueVoters / totalStudents) * 100) : 0,
        voteStart: VOTE_START,
        voteEnd: VOTE_END,
      },
      dailyTotals,
      voteDays: VOTE_DAYS,
      recentVotes: votes.slice(0, 50),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}