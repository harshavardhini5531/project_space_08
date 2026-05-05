import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

/* ============================================================
   POST  /api/mentor-action
   Body:
     { request_id, mentor_id, action: 'coming'|'busy',
       token? (required when called from email panel),
       source: 'dashboard'|'email' }
   - 'coming' -> sets request status='Accepted', mentor_id, mentor_name, accepted_at
                 (only allowed if status='Pending' AND mentor not frozen)
   - 'busy'   -> appends mentor_id to busy_mentors[] on the request
                 (greyed out for that mentor only — others can still accept)
   ============================================================ */
export async function POST(req) {
  try {
    const body = await req.json();
    const { request_id, mentor_id, action, token, source = "dashboard" } = body;

    if (!request_id || !mentor_id || !action) {
      return NextResponse.json(
        { error: "Missing request_id, mentor_id, or action" },
        { status: 400 }
      );
    }

    if (!["coming", "busy"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ---- if from email, verify token
    if (source === "email") {
      const expected = makeToken(request_id, mentor_id);
      if (!token || token !== expected) {
        return NextResponse.json(
          { error: "Invalid or expired link" },
          { status: 401 }
        );
      }
    }

    // ---- fetch mentor
    const { data: mentor } = await supabase
      .from("mentors")
      .select("id, name, email, technology, is_active, image_url")
      .eq("id", mentor_id)
      .single();

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    if (!mentor.is_active) {
      return NextResponse.json({ error: "Mentor account is inactive" }, { status: 403 });
    }

    // ---- fetch request
    const { data: request } = await supabase
      .from("mentor_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ---- verify mentor's technology matches
    if (mentor.technology !== request.technology) {
      return NextResponse.json(
        { error: "You are not in this technology track" },
        { status: 403 }
      );
    }

    // ============================================================
    //   ACTION: COMING
    // ============================================================
    if (action === "coming") {
      // already resolved
      if (["Mentor Resolved", "Self Resolved"].includes(request.status)) {
        return NextResponse.json(
          { error: `This request is already ${request.status}.`, alreadyResolved: true },
          { status: 409 }
        );
      }

      // someone else already accepted
      if (request.status === "Accepted") {
        if (request.mentor_id === mentor_id) {
          return NextResponse.json({
            success: true,
            alreadyAccepted: true,
            message: "You already accepted this request.",
            request,
          });
        }
        return NextResponse.json(
          {
            error: `${request.mentor_name || "Another mentor"} already accepted this request.`,
            takenBy: request.mentor_name,
            alreadyTaken: true,
          },
          { status: 409 }
        );
      }

      // check if THIS mentor is currently frozen on another request
      const { data: frozen } = await supabase
        .from("mentor_requests")
        .select("id, team_number")
        .eq("mentor_id", mentor_id)
        .eq("status", "Accepted")
        .neq("id", request_id)
        .limit(1)
        .maybeSingle();

      if (frozen) {
        return NextResponse.json(
          {
            error: `You're currently helping ${frozen.team_number}. Finish that first before accepting another.`,
            frozenWith: frozen.team_number,
          },
          { status: 409 }
        );
      }

      // claim it (race-safe: update only if still Pending)
      const { data: updated, error: uErr } = await supabase
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
        .single();

      if (uErr || !updated) {
        // someone beat them to it in the race window
        const { data: fresh } = await supabase
          .from("mentor_requests")
          .select("mentor_name, status")
          .eq("id", request_id)
          .single();
        return NextResponse.json(
          {
            error: `${fresh?.mentor_name || "Another mentor"} just accepted this request.`,
            takenBy: fresh?.mentor_name,
            alreadyTaken: true,
          },
          { status: 409 }
        );
      }

      // audit log
      await supabase.from("mentor_request_logs").insert({
        request_id,
        action: "accepted",
        actor_type: "mentor",
        actor_id: mentor.id,
        actor_name: mentor.name,
        details: { source, team_number: request.team_number },
      });

      return NextResponse.json({
        success: true,
        accepted: true,
        message: `You accepted ${request.team_number}'s request. You're now frozen until the team leader marks it resolved.`,
        request: updated,
      });
    }

    // ============================================================
    //   ACTION: BUSY
    // ============================================================
    if (action === "busy") {
      if (request.status !== "Pending") {
        return NextResponse.json(
          {
            error: `This request is already ${request.status}. No action needed.`,
            alreadyResolved: true,
          },
          { status: 409 }
        );
      }

      // append mentor to busy_mentors[] (idempotent)
      const busyArr = Array.isArray(request.busy_mentors)
        ? request.busy_mentors
        : [];

      if (busyArr.includes(mentor_id)) {
        return NextResponse.json({
          success: true,
          alreadyBusy: true,
          message: "You already marked yourself busy on this request.",
        });
      }

      const newBusy = [...busyArr, mentor_id];

      const { error: uErr } = await supabase
        .from("mentor_requests")
        .update({
          busy_mentors: newBusy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request_id);

      if (uErr) {
        console.error("[mentor-action busy] update error", uErr);
        return NextResponse.json({ error: "Failed to mark busy" }, { status: 500 });
      }

      await supabase.from("mentor_request_logs").insert({
        request_id,
        action: "busy_marked",
        actor_type: "mentor",
        actor_id: mentor.id,
        actor_name: mentor.name,
        details: { source, team_number: request.team_number },
      });

      return NextResponse.json({
        success: true,
        busy: true,
        message: "Marked as busy. Other mentors can still accept this request.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[mentor-action POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ============================================================
   GET  /api/mentor-action?request_id=...&mentor_id=...&token=...
   Used by the email panel page to fetch request details
   before the mentor confirms the action.
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const request_id = searchParams.get("request_id");
    const mentor_id = searchParams.get("mentor_id");
    const token = searchParams.get("token");

    if (!request_id || !mentor_id || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const expected = makeToken(request_id, mentor_id);
    if (token !== expected) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
    }

    const [{ data: request }, { data: mentor }] = await Promise.all([
      supabase.from("mentor_requests").select("*").eq("id", request_id).single(),
      supabase.from("mentors").select("id, name, email, technology, image_url").eq("id", mentor_id).single(),
    ]);

    if (!request || !mentor) {
      return NextResponse.json({ error: "Request or mentor not found" }, { status: 404 });
    }

    // attach project_title
    const { data: team } = await supabase
      .from("teams")
      .select("project_title")
      .eq("team_number", request.team_number)
      .single();

    // determine if THIS mentor is frozen elsewhere
    const { data: frozen } = await supabase
      .from("mentor_requests")
      .select("team_number")
      .eq("mentor_id", mentor_id)
      .eq("status", "Accepted")
      .neq("id", request_id)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      request: { ...request, project_title: team?.project_title || null },
      mentor,
      can_act: request.status === "Pending" && !frozen,
      frozen_with: frozen?.team_number || null,
    });
  } catch (e) {
    console.error("[mentor-action GET] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------- token helper (must match /api/mentor-request) ---------- */
function makeToken(requestId, mentorId) {
  const secret = process.env.MENTOR_PANEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-change-me";
  return crypto
    .createHmac("sha256", secret)
    .update(`${requestId}:${mentorId}`)
    .digest("hex")
    .slice(0, 32);
}