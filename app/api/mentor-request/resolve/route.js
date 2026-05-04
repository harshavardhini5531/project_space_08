import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-request/resolve
   Body: { request_id, leader_roll }
   Only the team leader can mark a request as resolved.
   - If status was 'Accepted' (a mentor claimed it) -> Mentor Resolved + deduct 2 credits
   - If status was 'Pending' (no mentor claimed)    -> Self Resolved + no credit deduction
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, leader_roll } = await req.json();

    if (!request_id || !leader_roll) {
      return NextResponse.json({ error: "Missing request_id or leader_roll" }, { status: 400 });
    }

    // ---- fetch request
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

    // ---- verify the requester is the team leader
    const { data: team } = await supabase
      .from("teams")
      .select("leader_roll, credits")
      .eq("team_number", request.team_number)
      .single();

    if (!team || team.leader_roll !== leader_roll) {
      return NextResponse.json(
        { error: "Only the team leader can resolve this request" },
        { status: 403 }
      );
    }

    let newStatus, resolvedBy, creditsDeducted = 0;
    if (request.status === "Accepted") {
      newStatus = "Mentor Resolved";
      resolvedBy = "leader-mentor-helped";
      creditsDeducted = 2;
    } else {
      // Pending — no mentor took it
      newStatus = "Self Resolved";
      resolvedBy = "leader-self";
      creditsDeducted = 0;
    }

    // ---- update request
    const { data: updated, error: uErr } = await supabase
      .from("mentor_requests")
      .update({
        status: newStatus,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        credits_deducted: creditsDeducted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .select()
      .single();

    if (uErr) {
      console.error("[resolve] update error", uErr);
      return NextResponse.json({ error: "Failed to resolve" }, { status: 500 });
    }

    // ---- deduct credits if mentor helped
    if (creditsDeducted > 0) {
      const newCredits = Math.max(0, (team.credits ?? 20) - creditsDeducted);
      await supabase
        .from("teams")
        .update({ credits: newCredits })
        .eq("team_number", request.team_number);
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (e) {
    console.error("[resolve POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}