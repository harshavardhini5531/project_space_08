import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/* ============================================================
   GET  /api/admin/mentor-request-stats?technology=X&mentor_id=Y
   Returns: { total, pending, resolved, avg_rating, mentors_in_scope, all_mentors }
   - all_mentors: full list of mentors grouped by tech (used by selector dropdown)
   - filters cards by technology + mentor_id selection
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const technology = searchParams.get("technology");
    const mentor_id = searchParams.get("mentor_id");

    // 1) base query for mentor_requests
    let q = supabase.from("mentor_requests").select("status, rating, mentor_id, technology");

    if (technology && technology !== "all") {
      q = q.eq("technology", technology);
    }
    if (mentor_id && mentor_id !== "all") {
      q = q.eq("mentor_id", mentor_id);
    }

    const { data: requests, error } = await q;
    if (error) {
      console.error("[admin-stats] requests fetch", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const list = requests || [];

    // 2) computed stats
    const total = list.length;
    const pending = list.filter((r) => ["Pending", "Accepted"].includes(r.status)).length;
    const resolved = list.filter((r) => ["Mentor Resolved", "Self Resolved"].includes(r.status)).length;

    const ratedRows = list.filter((r) => r.rating != null && r.rating > 0);
    const avg_rating = ratedRows.length
      ? ratedRows.reduce((s, r) => s + r.rating, 0) / ratedRows.length
      : 0;

    // 3) all mentors (for selector dropdown), grouped by technology
    const { data: mentors } = await supabase
      .from("mentors")
      .select("id, name, email, technology, image_url, is_active")
      .eq("is_active", true)
      .order("technology", { ascending: true })
      .order("name", { ascending: true });

    const all_mentors = mentors || [];

    // 4) mentors filtered to scope (matches current technology filter, for the dropdown)
    let mentors_in_scope = all_mentors;
    if (technology && technology !== "all") {
      mentors_in_scope = all_mentors.filter((m) => m.technology === technology);
    }

    return NextResponse.json({
      success: true,
      filters: { technology: technology || "all", mentor_id: mentor_id || "all" },
      stats: {
        total,
        pending,
        resolved,
        avg_rating: Number(avg_rating.toFixed(2)),
        rated_count: ratedRows.length,
      },
      all_mentors,
      mentors_in_scope,
    });
  } catch (e) {
    console.error("[admin-stats GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}