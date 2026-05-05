import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-request/resolve
   Body: { request_id, leader_roll }
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, leader_roll } = await req.json();

    if (!request_id || !leader_roll) {
      return NextResponse.json(
        { error: "Missing request_id or leader_roll" },
        { status: 400 }
      );
    }

    const { data: request, error: rErr } = await supabase
      .from("mentor_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (rErr || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (["Mentor Resolved", "Self Resolved"].includes(request.status)) {
      return NextResponse.json(
        { error: `Request is already ${request.status}` },
        { status: 409 }
      );
    }

    const { data: team } = await supabase
      .from("teams")
      .select("leader_roll, project_title")
      .eq("team_number", request.team_number)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.leader_roll !== leader_roll) {
      return NextResponse.json(
        { error: "Only the team leader can resolve this request" },
        { status: 403 }
      );
    }

    const wasAccepted = request.status === "Accepted";
    const newStatus = wasAccepted ? "Mentor Resolved" : "Self Resolved";
    const resolvedBy = wasAccepted ? "leader-mentor-helped" : "leader-self";

    const { data: updated, error: uErr } = await supabase
      .from("mentor_requests")
      .update({
        status: newStatus,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .select()
      .single();

    if (uErr) {
      console.error("[resolve] update error", uErr);
      return NextResponse.json({ error: "Failed to resolve request" }, { status: 500 });
    }

    await supabase.from("mentor_request_logs").insert({
      request_id,
      action: "resolved",
      actor_type: "leader",
      actor_id: leader_roll,
      actor_name: request.requested_by_name || leader_roll,
      details: {
        previous_status: request.status,
        new_status: newStatus,
        mentor_unfrozen: wasAccepted,
        mentor_id: request.mentor_id,
        mentor_name: request.mentor_name,
      },
    });

    return NextResponse.json({
      success: true,
      request: updated,
      message: wasAccepted
        ? `Marked as resolved. ${request.mentor_name || "Mentor"} is now free for new requests. You can rate them now.`
        : "Marked as self-resolved (no mentor had accepted).",
      can_rate: wasAccepted,
    });
  } catch (e) {
    console.error("[resolve POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}