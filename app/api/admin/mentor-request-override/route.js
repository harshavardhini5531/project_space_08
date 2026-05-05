import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "harshavardhini@technicalhub.io")
  .split(",")
  .map((e) => e.trim().toLowerCase());

/* ============================================================
   POST  /api/admin/mentor-request-override
   Body: { request_id, admin_email, reason }
   ============================================================ */
export async function POST(req) {
  try {
    const { request_id, admin_email, reason } = await req.json();

    if (!request_id || !admin_email || !reason) {
      return NextResponse.json(
        { error: "Missing request_id, admin_email, or reason" },
        { status: 400 }
      );
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Reason must be at least 10 characters (for audit)" },
        { status: 400 }
      );
    }

    const cleanEmail = admin_email.toLowerCase().trim();

    if (!ADMIN_EMAILS.includes(cleanEmail)) {
      return NextResponse.json(
        { error: "Not authorized as admin" },
        { status: 403 }
      );
    }

    const { data: request } = await supabase
      .from("mentor_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (["Mentor Resolved", "Self Resolved"].includes(request.status)) {
      return NextResponse.json(
        { error: `Request is already ${request.status}. No override needed.` },
        { status: 409 }
      );
    }

    const wasAccepted = request.status === "Accepted";
    const newStatus = wasAccepted ? "Mentor Resolved" : "Self Resolved";

    const { data: updated, error: uErr } = await supabase
      .from("mentor_requests")
      .update({
        status: newStatus,
        resolved_by: "admin-override",
        resolved_at: new Date().toISOString(),
        admin_override: true,
        admin_override_by: cleanEmail,
        admin_override_at: new Date().toISOString(),
        admin_override_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .select()
      .single();

    if (uErr) {
      console.error("[admin-override] update error", uErr);
      return NextResponse.json({ error: "Failed to override" }, { status: 500 });
    }

    await supabase.from("mentor_request_logs").insert({
      request_id,
      action: "admin_override",
      actor_type: "admin",
      actor_id: cleanEmail,
      actor_name: "Admin",
      details: {
        previous_status: request.status,
        new_status: newStatus,
        mentor_unfrozen: wasAccepted,
        mentor_id: request.mentor_id,
        mentor_name: request.mentor_name,
        team_number: request.team_number,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      request: updated,
      message: wasAccepted
        ? `Request force-resolved. ${request.mentor_name || "Mentor"} unfrozen.`
        : "Request force-resolved (no mentor was assigned).",
    });
  } catch (e) {
    console.error("[admin-override POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}