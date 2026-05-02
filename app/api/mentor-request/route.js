import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRIORITIES = ["Low", "Medium", "High"];

/* ============================================================
   POST  /api/mentor-request
   Body: { team_number, technology, priority, issue_description,
           requested_by_roll, requested_by_name }
   Creates request -> notifies all mentors in technology track.
   ============================================================ */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      team_number,
      technology,
      priority,
      issue_description,
      requested_by_roll,
      requested_by_name,
    } = body;

    // ---- validate
    if (!team_number || !technology || !priority || !issue_description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    if (issue_description.trim().length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 }
      );
    }

    // ---- get team_id
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, credits, leader_roll")
      .eq("team_number", team_number)
      .single();

    if (teamErr || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // ---- only the team leader can submit (members are read-only)
    if (requested_by_roll !== team.leader_roll) {
      return NextResponse.json(
        { error: "Only the team leader can submit mentor requests" },
        { status: 403 }
      );
    }

    // ---- check if there's already a Pending or Accepted request for this team
    const { data: openReq } = await supabase
      .from("mentor_requests")
      .select("id, status")
      .eq("team_number", team_number)
      .in("status", ["Pending", "Accepted"])
      .limit(1)
      .maybeSingle();

    if (openReq) {
      return NextResponse.json(
        { error: `You already have an active request (${openReq.status}). Resolve it first.` },
        { status: 409 }
      );
    }

    // ---- get all mentors in this technology
    const { data: mentors, error: mentorErr } = await supabase
      .from("mentors")
      .select("id, name, email")
      .eq("technology", technology)
      .eq("is_active", true);

    if (mentorErr || !mentors || mentors.length === 0) {
      return NextResponse.json(
        { error: "No active mentors found for this technology" },
        { status: 404 }
      );
    }

    // ---- insert request
    const { data: request, error: insErr } = await supabase
      .from("mentor_requests")
      .insert({
        team_number,
        team_id: team.id,
        technology,
        priority,
        issue_description: issue_description.trim(),
        requested_by_roll,
        requested_by_name,
        status: "Pending",
      })
      .select()
      .single();

    if (insErr) {
      console.error("[mentor-request] insert failed", insErr);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    // ---- record recipients
    const recipients = mentors.map((m) => ({
      request_id: request.id,
      mentor_id: m.id,
      mentor_name: m.name,
      mentor_email: m.email,
    }));

    await supabase.from("mentor_request_recipients").insert(recipients);

    // ---- send emails (fire & forget — don't block response)
    sendMentorEmails(mentors, request, team_number).catch((e) =>
      console.error("[mentor-request] email send failed", e)
    );

    return NextResponse.json({
      success: true,
      request,
      notified_mentors: mentors.length,
      mentor_names: mentors.map((m) => m.name),
    });
  } catch (e) {
    console.error("[mentor-request POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ============================================================
   GET  /api/mentor-request?team_number=PS-013
   GET  /api/mentor-request?technology=Data%20Specialist&status=Pending
   GET  /api/mentor-request?mentor_id=uuid&status=Accepted
   GET  /api/mentor-request   (admin — all)
   ============================================================ */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const team_number = searchParams.get("team_number");
    const technology = searchParams.get("technology");
    const status = searchParams.get("status");
    const mentor_id = searchParams.get("mentor_id");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    let q = supabase
      .from("mentor_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (team_number) q = q.eq("team_number", team_number);
    if (technology) q = q.eq("technology", technology);
    if (status) q = q.eq("status", status);
    if (mentor_id) q = q.eq("mentor_id", mentor_id);

    const { data, error } = await q;
    if (error) {
      console.error("[mentor-request GET] error", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    // ---- attach recipient lists
    const ids = data.map((r) => r.id);
    let recipientsByRequest = {};
    if (ids.length > 0) {
      const { data: recipients } = await supabase
        .from("mentor_request_recipients")
        .select("request_id, mentor_name")
        .in("request_id", ids);

      if (recipients) {
        recipientsByRequest = recipients.reduce((acc, r) => {
          (acc[r.request_id] ||= []).push(r.mentor_name);
          return acc;
        }, {});
      }
    }

    const enriched = data.map((r) => ({
      ...r,
      sent_to: recipientsByRequest[r.id] || [],
    }));

    return NextResponse.json({ success: true, requests: enriched });
  } catch (e) {
    console.error("[mentor-request GET] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------- email helper ---------- */
async function sendMentorEmails(mentors, request, team_number) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("[mentor-request] GMAIL_USER/GMAIL_PASS missing — skipping emails");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://projectspace.technicalhub.io";
  const priorityColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[request.priority];

  for (const m of mentors) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0610;color:#fff;border-radius:12px;overflow:hidden;border:1px solid #2a1a30">
        <div style="background:linear-gradient(135deg,#fd1c00,#fa0068);padding:20px 24px;color:#fff">
          <div style="font-size:11px;letter-spacing:.18em;opacity:.85">PROJECT SPACE · MENTOR REQUEST</div>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">A team needs your help</h1>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;color:#cfcfd6">Hi <b>${m.name}</b>,</p>
          <p style="margin:0 0 18px;color:#cfcfd6">Team <b>${team_number}</b> has just submitted a request for the <b>${request.technology}</b> track.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#150b1d;border-radius:8px">
            <tr><td style="padding:10px 14px;color:#888">Priority</td><td style="padding:10px 14px"><span style="background:${priorityColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">${request.priority}</span></td></tr>
            <tr><td style="padding:10px 14px;color:#888;border-top:1px solid #2a1a30">Team</td><td style="padding:10px 14px;color:#fff;border-top:1px solid #2a1a30">${team_number}</td></tr>
            <tr><td style="padding:10px 14px;color:#888;border-top:1px solid #2a1a30;vertical-align:top">Issue</td><td style="padding:10px 14px;color:#fff;border-top:1px solid #2a1a30;line-height:1.5">${escapeHtml(request.issue_description)}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0">
            <a href="${baseUrl}/mentor/dashboard?tab=help-requests&claim=${request.id}" style="display:inline-block;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700">I'm Coming →</a>
          </div>
          <p style="margin:18px 0 0;font-size:12px;color:#666;text-align:center">First mentor to claim wins. Multiple mentors received this email.</p>
        </div>
      </div>
    `;

    transporter
      .sendMail({
        from: `"Project Space" <${process.env.GMAIL_USER}>`,
        to: m.email,
        subject: `[${request.priority}] Mentor Request from ${team_number}`,
        html,
      })
      .catch((e) => console.error(`[mentor-request] email to ${m.email} failed`, e));
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}