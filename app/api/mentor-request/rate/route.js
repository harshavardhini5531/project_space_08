import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-request/rate
   Body: { request_id, rating, rater_roll }
   - Only the team leader can rate
   - Only Mentor Resolved requests can be rated
   - Once rated, locked forever (no edits)
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, rating, rater_roll } = await req.json();

    if (!request_id || !rater_roll) {
      return NextResponse.json(
        { error: "Missing request_id or rater_roll" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Invalid rating (must be an integer 1-5)" },
        { status: 400 }
      );
    }

    // ---- fetch request
    const { data: request, error: rErr } = await supabase
      .from("mentor_requests")
      .select("id, status, rating, team_id, team_number, mentor_id, mentor_name")
      .eq("id", request_id)
      .single();

    if (rErr || !request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ---- only Mentor Resolved can be rated
    if (request.status !== "Mentor Resolved") {
      return NextResponse.json(
        {
          error:
            request.status === "Pending"
              ? "Mark this request resolved before rating."
              : request.status === "Accepted"
              ? "Mark this request resolved before rating."
              : `Cannot rate a ${request.status} request.`,
        },
        { status: 400 }
      );
    }

    // ---- LOCK CHECK: already rated -> reject
    if (request.rating !== null && request.rating !== undefined) {
      return NextResponse.json(
        {
          error: `This request was already rated ${request.rating}/5. Ratings are final and cannot be changed.`,
          alreadyRated: true,
          existingRating: request.rating,
        },
        { status: 409 }
      );
    }

    // ---- verify rater is the team leader
    const { data: team } = await supabase
      .from("teams")
      .select("leader_roll")
      .eq("id", request.team_id)
      .single();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.leader_roll !== rater_roll) {
      return NextResponse.json(
        { error: "Only the team leader can rate this request" },
        { status: 403 }
      );
    }

    // ---- save rating
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

    // ---- audit log
    await supabase.from("mentor_request_logs").insert({
      request_id,
      action: "rated",
      actor_type: "leader",
      actor_id: rater_roll,
      details: {
        rating,
        mentor_id: request.mentor_id,
        mentor_name: request.mentor_name,
        team_number: request.team_number,
      },
    });

    return NextResponse.json({
      success: true,
      request: updated,
      message: `Thanks for rating ${request.mentor_name || "the mentor"} ${rating}/5. This rating is now locked.`,
    });
  } catch (e) {
    console.error("[rate POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}