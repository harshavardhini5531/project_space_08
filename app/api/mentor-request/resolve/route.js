import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-request/resolve
   Body: { request_id, resolved_by: 'mentor' | 'self', actor_id? }
   - 'mentor':  deducts 2 credits from team. actor_id = mentor.id.
   - 'self':    no credit deduction. actor_id = student roll.
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, resolved_by, actor_id } = await req.json();

    if (!request_id || !["mentor", "self"].includes(resolved_by)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

    let updates = {
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    let creditChange = 0;

    if (resolved_by === "mentor") {
      // Must be currently Accepted by this mentor
      if (request.status !== "Accepted") {
        return NextResponse.json(
          { error: "Only an accepted request can be marked resolved by a mentor" },
          { status: 400 }
        );
      }
      if (request.mentor_id !== actor_id) {
        return NextResponse.json(
          { error: "Only the assigned mentor can resolve this request" },
          { status: 403 }
        );
      }
      updates.status = "Mentor Resolved";
      updates.resolved_by = "mentor";
      updates.credits_deducted = 2;
      creditChange = -2;
    } else {
      // self
      if (request.status === "Accepted") {
        return NextResponse.json(
          { error: "A mentor has already accepted. Please wait or contact them." },
          { status: 409 }
        );
      }
      updates.status = "Self Resolved";
      updates.resolved_by = "self";
      updates.credits_deducted = 0;
    }

    // ---- update request
    const { data: updated, error: uErr } = await supabase
      .from("mentor_requests")
      .update(updates)
      .eq("id", request_id)
      .select()
      .single();

    if (uErr) {
      console.error("[resolve] update error", uErr);
      return NextResponse.json({ error: "Failed to resolve" }, { status: 500 });
    }

    // ---- deduct credits if mentor-resolved
    if (creditChange !== 0) {
      const { data: team } = await supabase
        .from("teams")
        .select("credits")
        .eq("team_number", request.team_number)
        .single();

      const newCredits = Math.max(0, (team?.credits ?? 20) + creditChange);

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