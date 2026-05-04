import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-request/rate
   Body: { request_id, rating, rater_roll }
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, rating, rater_roll } = await req.json();

    if (!request_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating (must be 1-5)" }, { status: 400 });
    }

    const { data: request, error: rErr } = await supabase
      .from("mentor_requests")
      .select("status, rating, team_id")
      .eq("id", request_id)
      .single();

    if (rErr || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.status !== "Mentor Resolved") {
      return NextResponse.json(
        { error: "Only mentor-resolved requests can be rated" },
        { status: 400 }
      );
    }

    if (request.rating !== null && request.rating !== undefined) {
      return NextResponse.json(
        { error: "This request has already been rated" },
        { status: 409 }
      );
    }

    // ---- verify rater is from this team (leader)
    if (rater_roll) {
      const { data: team } = await supabase
        .from("teams")
        .select("leader_roll")
        .eq("id", request.team_id)
        .single();
      if (team && team.leader_roll !== rater_roll) {
        return NextResponse.json(
          { error: "Only the team leader can rate" },
          { status: 403 }
        );
      }
    }

    const { data: updated, error: uErr } = await supabase
      .from("mentor_requests")
      .update({
        rating,
        rated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .select()
      .single();

    if (uErr) {
      console.error("[rate] update error", uErr);
      return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (e) {
    console.error("[rate POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}