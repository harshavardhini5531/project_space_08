import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const technology = searchParams.get("technology")?.trim();
    const filterStatus = searchParams.get("status")?.trim(); // "accepted" | "pending" | undefined

    // 1. Fetch teams (with mentor_assigned name only — no email column on teams)
    let teamsQuery = supabase
      .from("teams")
      .select("team_number, project_title, technology, leader_roll, mentor_assigned");

    if (technology) teamsQuery = teamsQuery.eq("technology", technology);

    const { data: teams, error: teamsErr } = await teamsQuery;
    if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });

    const teamNums = (teams || []).map((t) => t.team_number);

    // 2. Members
    const { data: members, error: memErr } = await supabase
      .from("team_members")
      .select("roll_number, team_number, short_name, is_leader")
      .in("team_number", teamNums);
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

    // 3. Acceptances
    const { data: accs, error: accErr } = await supabase
      .from("terms_acceptances")
      .select("roll_number, accepted_at");
    if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 });

    const accMap = Object.fromEntries((accs || []).map((a) => [a.roll_number, a.accepted_at]));

    // 4. Mentor email lookup (one query, build name -> email map)
    const mentorNames = [...new Set((teams || []).map((t) => t.mentor_assigned).filter(Boolean))];
    let mentorMap = {};
    if (mentorNames.length > 0) {
      const { data: mentors, error: mErr } = await supabase
        .from("mentors")
        .select("name, email")
        .in("name", mentorNames);
      if (!mErr && mentors) {
        mentorMap = Object.fromEntries(mentors.map((m) => [m.name, m.email]));
      }
    }

    // 5. Group by team
    const byTeam = {};
    (teams || []).forEach((t) => {
      byTeam[t.team_number] = {
        team_number: t.team_number,
        project_title: t.project_title,
        technology: t.technology,
        leader_roll: t.leader_roll,
        mentor_name: t.mentor_assigned,
        mentor_email: mentorMap[t.mentor_assigned] || null,
        venue: getVenue(t.team_number),
        members: [],
      };
    });

    (members || []).forEach((m) => {
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
      t.team_status =
        t.accepted_count === 0
          ? "pending"
          : t.accepted_count === t.total_count
          ? "accepted"
          : "partial";
    });

    let teamArr = Object.values(byTeam);

    if (filterStatus === "accepted") {
      teamArr = teamArr.filter((t) => t.team_status === "accepted");
    } else if (filterStatus === "pending") {
      teamArr = teamArr.filter((t) => t.team_status !== "accepted");
    }

    teamArr.sort((a, b) => a.team_number.localeCompare(b.team_number));

    // Tech-wise stats
    const techStats = {};
    Object.values(byTeam).forEach((t) => {
      if (!techStats[t.technology]) {
        techStats[t.technology] = { tech: t.technology, total: 0, accepted: 0 };
      }
      techStats[t.technology].total += t.total_count;
      techStats[t.technology].accepted += t.accepted_count;
    });

    const totalMembers = (members || []).length;
    const totalAccepted = Object.values(byTeam).reduce(
      (s, t) => s + t.accepted_count,
      0
    );

    return NextResponse.json({
      teams: teamArr,
      stats: {
        total_teams: Object.keys(byTeam).length,
        teams_fully_accepted: Object.values(byTeam).filter((t) => t.team_status === "accepted").length,
        teams_partial: Object.values(byTeam).filter((t) => t.team_status === "partial").length,
        teams_pending: Object.values(byTeam).filter((t) => t.team_status === "pending").length,
        total_members: totalMembers,
        accepted_members: totalAccepted,
        pending_members: totalMembers - totalAccepted,
        completion_pct: totalMembers > 0 ? Math.round((totalAccepted / totalMembers) * 100) : 0,
      },
      tech_stats: Object.values(techStats),
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