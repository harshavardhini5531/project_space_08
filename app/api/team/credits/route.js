import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const team_number = searchParams.get("team_number");
    if (!team_number) return NextResponse.json({ error: "Missing team_number" }, { status: 400 });

    const { data, error } = await supabase
      .from("teams")
      .select("credits")
      .eq("team_number", team_number)
      .single();

    if (error || !data) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    return NextResponse.json({ success: true, credits: data.credits ?? 20 });
  } catch (e) {
    console.error("[team/credits] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}