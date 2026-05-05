import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   GET  /api/mentor-request/availability?technology=X&team_number=Y
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const technology = searchParams.get("technology");
    const team_number = searchParams.get("team_number");

    if (!technology) {
      return NextResponse.json({ error: "technology is required" }, { status: 400 });
    }

    // --- 1. fetch all active mentors of this technology
    const { data: mentors, error: mErr } = await supabase
      .from("mentors")
      .select("id, name, email, image_url, technology")
      .eq("technology", technology)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (mErr) {
      console.error("[availability] mentors fetch failed", mErr);
      return NextResponse.json({ error: "Failed to fetch mentors" }, { status: 500 });
    }

    // --- 2. find which mentors of THIS technology are frozen
    const mentorIds = (mentors || []).map((m) => m.id);
    let frozenRequests = [];
    if (mentorIds.length > 0) {
      const { data } = await supabase
        .from("mentor_requests")
        .select("mentor_id, team_number")
        .eq("status", "Accepted")
        .in("mentor_id", mentorIds);
      frozenRequests = data || [];
    }

    const frozenMap = {};
    frozenRequests.forEach((r) => {
      if (r.mentor_id) frozenMap[r.mentor_id] = r.team_number;
    });

    // --- 3. enrich mentor list with status
    const enrichedMentors = (mentors || []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      image_url: m.image_url || null,
      status: frozenMap[m.id] ? "busy" : "active",
      busy_with_team: frozenMap[m.id] || null,
    }));

    const activeCount = enrichedMentors.filter((m) => m.status === "active").length;
    const busyCount = enrichedMentors.filter((m) => m.status === "busy").length;

    // --- 4. team status (only if team_number provided)
    let team_status = null;
    let can_submit = true;
    let reason = null;

    if (team_number) {
      const { data: team } = await supabase
        .from("teams")
        .select("credits, leader_roll, project_title")
        .eq("team_number", team_number)
        .single();

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const { data: openReq } = await supabase
        .from("mentor_requests")
        .select("id, status, priority, created_at, mentor_name")
        .eq("team_number", team_number)
        .in("status", ["Pending", "Accepted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      team_status = {
        has_open_request: !!openReq,
        open_request: openReq || null,
        credits: team.credits || 0,
      };

      if (openReq) {
        can_submit = false;
        reason =
          openReq.status === "Accepted"
            ? `Mentor ${openReq.mentor_name || ""} has accepted your request. Mark it resolved before raising another.`
            : "You already have a pending request. Wait for a mentor to accept or resolve it.";
      } else if ((team.credits || 0) < 2) {
        can_submit = false;
        reason = `You need at least 2 credits to send a request. Current credits: ${team.credits || 0}.`;
      } else if (activeCount === 0) {
        can_submit = false;
        reason = "All mentors in your technology are currently busy with other teams. Please try again shortly.";
      }
    }

    return NextResponse.json({
      success: true,
      technology,
      mentors: enrichedMentors,
      counts: {
        total: enrichedMentors.length,
        active: activeCount,
        busy: busyCount,
      },
      team_status,
      can_submit,
      reason,
    });
  } catch (e) {
    console.error("[availability GET] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}