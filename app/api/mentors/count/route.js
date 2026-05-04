import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const technology = searchParams.get("technology");
    if (!technology) return NextResponse.json({ error: "Missing technology" }, { status: 400 });

    const { count, error } = await supabase
      .from("mentors")
      .select("id", { count: "exact", head: true })
      .eq("technology", technology)
      .eq("is_active", true);

    if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
    return NextResponse.json({ success: true, count: count ?? 0 });
  } catch (e) {
    console.error("[mentors/count] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}