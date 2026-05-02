import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ============================================================
   POST  /api/mentor-request/claim
   Body: { request_id, mentor_id }
   Atomically claims a Pending request. First-come-wins.
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, mentor_id } = await req.json();

    if (!request_id || !mentor_id) {
      return NextResponse.json({ error: "Missing request_id or mentor_id" }, { status: 400 });
    }

    // ---- get mentor
    const { data: mentor, error: mErr } = await supabase
      .from("mentors")
      .select("id, name, email, technology")
      .eq("id", mentor_id)
      .single();

    if (mErr || !mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // ---- atomic update: only succeeds if status is still 'Pending'
    const { data, error } = await supabase
      .from("mentor_requests")
      .update({
        status: "Accepted",
        mentor_id: mentor.id,
        mentor_name: mentor.name,
        mentor_email: mentor.email,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .eq("status", "Pending")
      .select()
      .maybeSingle();

    if (error) {
      console.error("[claim] error", error);
      return NextResponse.json({ error: "Failed to claim" }, { status: 500 });
    }

    if (!data) {
      // Row didn't update — someone else got it first, or it was self-resolved
      const { data: current } = await supabase
        .from("mentor_requests")
        .select("status, mentor_name")
        .eq("id", request_id)
        .single();

      return NextResponse.json(
        {
          error: "already_claimed",
          message: current?.mentor_name
            ? `Already claimed by ${current.mentor_name}`
            : `This request is no longer available (${current?.status || "unknown"})`,
          current_status: current?.status,
          claimed_by: current?.mentor_name,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, request: data });
  } catch (e) {
    console.error("[claim POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}