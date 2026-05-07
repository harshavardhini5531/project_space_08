// app/api/mentor-vote/route.js
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

export async function POST(req) {
  try {
    const body = await req.json();
    const { post_id, voter_roll } = body || {};

    if (!post_id || !voter_roll) {
      return NextResponse.json(
        { ok: false, error: 'post_id and voter_roll are required' },
        { status: 400 }
      );
    }

    const today = getISTDate();
    if (today < VOTE_START || today > VOTE_END) {
      return NextResponse.json(
        { ok: false, error: `Voting is closed. Window: ${VOTE_START} to ${VOTE_END}` },
        { status: 403 }
      );
    }

    // 1. Voter must be a STUDENT (exists in students table) and NOT a mentor
    const { data: studentRow } = await supabase
      .from('students')
      .select('roll_number')
      .eq('roll_number', voter_roll)
      .maybeSingle();

    if (!studentRow) {
      return NextResponse.json(
        { ok: false, error: 'Only registered students can vote' },
        { status: 403 }
      );
    }

    // Block if voter_roll happens to also be a mentor emp_id (defensive)
    const { data: mentorRow } = await supabase
      .from('mentors')
      .select('emp_id')
      .eq('emp_id', voter_roll)
      .maybeSingle();

    if (mentorRow) {
      return NextResponse.json(
        { ok: false, error: 'Mentors are not allowed to vote' },
        { status: 403 }
      );
    }

    // 2. Already voted today?
    const { data: existing } = await supabase
      .from('mentor_post_votes')
      .select('id, post_id, mentor_emp_id')
      .eq('voter_roll', voter_roll)
      .eq('vote_date', today)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: 'You have already voted today. Come back tomorrow!',
          alreadyVoted: { post_id: existing.post_id, mentor_emp_id: existing.mentor_emp_id },
        },
        { status: 409 }
      );
    }

    // 3. Verify post exists & active, get linkedin_url + emp_id to return
    const { data: post } = await supabase
      .from('mentor_posts')
      .select('id, mentor_emp_id, linkedin_url, is_active')
      .eq('id', post_id)
      .maybeSingle();

    if (!post || !post.is_active) {
      return NextResponse.json(
        { ok: false, error: 'Post not found or inactive' },
        { status: 404 }
      );
    }

    // 4. Insert vote (UNIQUE constraint at DB level is final safety net)
    const { error: insertErr } = await supabase.from('mentor_post_votes').insert({
      post_id: post.id,
      mentor_emp_id: post.mentor_emp_id,
      voter_roll,
      vote_date: today,
    });

    if (insertErr) {
      // Race condition: someone else's request just inserted
      if (insertErr.code === '23505') {
        return NextResponse.json(
          { ok: false, error: 'You have already voted today. Come back tomorrow!' },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Vote recorded',
      linkedin_url: post.linkedin_url,
      mentor_emp_id: post.mentor_emp_id,
      vote_date: today,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}