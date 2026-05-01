import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorEmail = searchParams.get("mentor_email")?.trim().toLowerCase();
    const mentorName = searchParams.get("mentor_name")?.trim();
    const technology = searchParams.get("technology")?.trim();

    if (!mentorEmail && !mentorName && !technology) {
      return NextResponse.json(
        { error: "mentor_email, mentor_name or technology required" },
        { status: 400 }
      );
    }

    // Resolve mentor_email -> mentor_name (since teams.mentor_assigned holds the NAME)
    let resolvedMentorName = mentorName || null;
    if (mentorEmail && !resolvedMentorName) {
      const { data: mentor, error: mErr } = await supabase
        .from("mentors")
        .select("name")
        .ilike("email", mentorEmail)
        .maybeSingle();
      if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
      resolvedMentorName = mentor?.name || null;
      if (!resolvedMentorName) {
        return NextResponse.json({ teams: [], stats: { total_teams: 0, total_members: 0, accepted: 0, pending: 0 } });
      }
    }

    // Find teams under this mentor (by name) or by technology
    let teamsQuery = supabase
      .from("teams")
      .select("team_number, project_title, technology, leader_roll, mentor_assigned");

    if (resolvedMentorName) teamsQuery = teamsQuery.eq("mentor_assigned", resolvedMentorName);
    if (technology) teamsQuery = teamsQuery.eq("technology", technology);

    const { data: teams, error: teamsErr } = await teamsQuery;
    if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

    if (!teams || teams.length === 0) {
      return NextResponse.json({ teams: [], stats: { total_teams: 0, total_members: 0, accepted: 0, pending: 0 } });
    }

    const teamNumbers = teams.map((t) => t.team_number);

    const { data: members, error: memErr } = await supabase
      .from("team_members")
      .select("roll_number, team_number, short_name, is_leader")
      .in("team_number", teamNumbers);
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

    const rolls = members.map((m) => m.roll_number);
    const { data: accs, error: accErr } = await supabase
      .from("terms_acceptances")
      .select("roll_number, accepted_at")
      .in("roll_number", rolls);
    if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 });

    const accMap = Object.fromEntries((accs || []).map((a) => [a.roll_number, a.accepted_at]));

    const byTeam = {};
    teams.forEach((t) => {
      byTeam[t.team_number] = {
        team_number: t.team_number,
        project_title: t.project_title,
        technology: t.technology,
        leader_roll: t.leader_roll,
        mentor_name: t.mentor_assigned,
        venue: getVenue(t.team_number),
        members: [],
      };
    });

    members.forEach((m) => {
      const t = byTeam[m.team_number];
      if (!t) return;
      t.members.push({
        roll_number: m.roll_number,
        short_name: m.short_name,
        is_leader: m.is_leader,
        accepted: !!accMap[m.roll_number],
        accepted_at: accMap[m.roll_number] || null,
      });
    });

    Object.values(byTeam).forEach((t) => {
      t.members.sort((a, b) => {
        if (a.is_leader && !b.is_leader) return -1;
        if (!a.is_leader && b.is_leader) return 1;
        return a.roll_number.localeCompare(b.roll_number);
      });
      t.accepted_count = t.members.filter((m) => m.accepted).length;
      t.total_count = t.members.length;
    });

    const allMembers = members.length;
    const acceptedMembers = (accs || []).length;

    return NextResponse.json({
      teams: Object.values(byTeam).sort((a, b) =>
        a.team_number.localeCompare(b.team_number)
      ),
      stats: {
        total_teams: teams.length,
        total_members: allMembers,
        accepted: acceptedMembers,
        pending: allMembers - acceptedMembers,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

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