import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   GET  /api/mentor-request/mentor-stats?mentor_id=UUID
   Returns: { notified, accepted, solved, pending }
   - notified: count of requests where this mentor was in recipients list (all time)
   - accepted: count where mentor_id = me (Accepted + Mentor Resolved)
   - solved:   count where mentor_id = me AND status = Mentor Resolved
   - pending:  count where (mentor_id = me AND status = Accepted)
               PLUS (in recipients AND status = Pending AND not yet busy-marked by me)
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mentor_id = searchParams.get("mentor_id");

    if (!mentor_id) {
      return NextResponse.json({ error: "mentor_id required" }, { status: 400 });
    }

    // 1) notified count (any recipients row for this mentor)
    const { count: notified } = await supabase
      .from("mentor_request_recipients")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", mentor_id);

    // 2) accepted count (mentor_id = me, any status that has been Accepted)
    const { count: acceptedTotal } = await supabase
      .from("mentor_requests")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", mentor_id)
      .in("status", ["Accepted", "Mentor Resolved"]);

    // 3) solved count
    const { count: solved } = await supabase
      .from("mentor_requests")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", mentor_id)
      .eq("status", "Mentor Resolved");

    // 4) pending: (currently accepted by me) + (Pending and I'm a recipient and haven't marked busy)
    const { count: currentlyAccepted } = await supabase
      .from("mentor_requests")
      .select("*", { count: "exact", head: true })
      .eq("mentor_id", mentor_id)
      .eq("status", "Accepted");

    // For pending-incoming: get all Pending request IDs where I'm a recipient
    const { data: myRecipients } = await supabase
      .from("mentor_request_recipients")
      .select("request_id")
      .eq("mentor_id", mentor_id);

    const recipientIds = (myRecipients || []).map((r) => r.request_id);

    let pendingIncoming = 0;
    if (recipientIds.length > 0) {
      const { data: pendingReqs } = await supabase
        .from("mentor_requests")
        .select("id, busy_mentors")
        .eq("status", "Pending")
        .in("id", recipientIds);

      pendingIncoming = (pendingReqs || []).filter((r) => {
        const busy = Array.isArray(r.busy_mentors) ? r.busy_mentors : [];
        return !busy.includes(mentor_id);
      }).length;
    }

    return NextResponse.json({
      success: true,
      notified: notified || 0,
      accepted: acceptedTotal || 0,
      solved: solved || 0,
      pending: (currentlyAccepted || 0) + pendingIncoming,
    });
  } catch (e) {
    console.error("[mentor-stats GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}