import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const PRIORITIES = ["Low", "Medium", "High"];
const CREDITS_PER_REQUEST = 2;

/* ============================================================
   POST  /api/mentor-request
   Body: { team_number, technology, priority, issue_description,
           requested_by_roll, requested_by_name }
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

    // ---- get team
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, credits, leader_roll, project_title")
      .eq("team_number", team_number)
      .single();

    if (teamErr || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // ---- only the team leader can submit
    if (requested_by_roll !== team.leader_roll) {
      return NextResponse.json(
        { error: "Only the team leader can submit mentor requests" },
        { status: 403 }
      );
    }

    // ---- block if open request exists
    const { data: openReq } = await supabase
      .from("mentor_requests")
      .select("id, status, mentor_name")
      .eq("team_number", team_number)
      .in("status", ["Pending", "Accepted"])
      .limit(1)
      .maybeSingle();

    if (openReq) {
      const msg =
        openReq.status === "Accepted"
          ? `Mentor ${openReq.mentor_name || "(assigned)"} is currently working on your request. Mark it resolved before raising another.`
          : "You already have a pending request. Wait for a mentor to accept or resolve it.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    // ---- check credits
    const credits = team.credits || 0;
    if (credits < CREDITS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${CREDITS_PER_REQUEST} credits to raise a request. Current: ${credits}.` },
        { status: 402 }
      );
    }

    // ---- get all mentors of this technology
    const { data: allMentors, error: mErr } = await supabase
      .from("mentors")
      .select("id, name, email, image_url")
      .eq("technology", technology)
      .eq("is_active", true);

    if (mErr || !allMentors || allMentors.length === 0) {
      return NextResponse.json(
        { error: "No active mentors found for this technology" },
        { status: 404 }
      );
    }

    // ---- find frozen mentors (currently accepted on another open request)
    const mentorIds = allMentors.map((m) => m.id);
    const { data: frozen } = await supabase
      .from("mentor_requests")
      .select("mentor_id")
      .eq("status", "Accepted")
      .in("mentor_id", mentorIds);

    const frozenIds = new Set((frozen || []).map((r) => r.mentor_id));
    const activeMentors = allMentors.filter((m) => !frozenIds.has(m.id));

    if (activeMentors.length === 0) {
      return NextResponse.json(
        { error: "All mentors in your technology are busy with other teams. Please try again shortly." },
        { status: 409 }
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
        credits_deducted: CREDITS_PER_REQUEST,
      })
      .select()
      .single();

    if (insErr) {
      console.error("[mentor-request] insert failed", insErr);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    // ---- deduct credits
    await supabase
      .from("teams")
      .update({ credits: credits - CREDITS_PER_REQUEST })
      .eq("team_number", team_number);

    // ---- record recipients (active mentors only)
    const recipients = activeMentors.map((m) => ({
      request_id: request.id,
      mentor_id: m.id,
      mentor_name: m.name,
      mentor_email: m.email,
    }));
    const { error: recErr } = await supabase
      .from("mentor_request_recipients")
      .insert(recipients);
    if (recErr) {
      console.error("[mentor-request] recipients insert failed", recErr);
    }

    // ---- audit log
    await supabase.from("mentor_request_logs").insert({
      request_id: request.id,
      action: "created",
      actor_type: "leader",
      actor_id: requested_by_roll,
      actor_name: requested_by_name || requested_by_roll,
      details: {
        priority,
        technology,
        active_mentors_notified: activeMentors.length,
        busy_mentors_skipped: allMentors.length - activeMentors.length,
        credits_deducted: CREDITS_PER_REQUEST,
        credits_after: credits - CREDITS_PER_REQUEST,
      },
    });

    // ---- send emails (fire & forget)
    sendMentorEmails(activeMentors, request, team, requested_by_name).catch((e) =>
      console.error("[mentor-request] email send failed", e)
    );

    return NextResponse.json({
      success: true,
      request,
      notified_mentors: activeMentors.length,
      mentor_names: activeMentors.map((m) => m.name),
      busy_mentors_skipped: allMentors.length - activeMentors.length,
      credits_remaining: credits - CREDITS_PER_REQUEST,
    });
  } catch (e) {
    console.error("[mentor-request POST] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ============================================================
   GET  /api/mentor-request?team_number=PS-013
   GET  /api/mentor-request?technology=...&status=Pending
   GET  /api/mentor-request?mentor_id=uuid
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

    // ---- attach recipient lists + project title
    const ids = data.map((r) => r.id);
    const teamNums = [...new Set(data.map((r) => r.team_number))];

    let recipientsByRequest = {};
    let titlesByTeam = {};

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

    if (teamNums.length > 0) {
      const { data: teams } = await supabase
        .from("teams")
        .select("team_number, project_title")
        .in("team_number", teamNums);
      if (teams) {
        titlesByTeam = teams.reduce((acc, t) => {
          acc[t.team_number] = t.project_title;
          return acc;
        }, {});
      }
    }

    const enriched = data.map((r) => ({
      ...r,
      sent_to: recipientsByRequest[r.id] || [],
      project_title: titlesByTeam[r.team_number] || null,
    }));

    return NextResponse.json({ success: true, requests: enriched });
  } catch (e) {
    console.error("[mentor-request GET] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------- Gmail account fallback ---------- */
function makeTransporter(useBackup = false) {
  const user = useBackup
    ? (process.env.GMAIL_USER2 || process.env.GMAIL_USER)
    : process.env.GMAIL_USER;
  const pass = useBackup
    ? (process.env.GMAIL_PASS2 || process.env.GMAIL_PASS)
    : process.env.GMAIL_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

/* ---------- email helper ---------- */
async function sendMentorEmails(mentors, request, team, leaderName) {
  const primary = makeTransporter(false);
  if (!primary) {
    console.warn("[mentor-request] GMAIL_USER/GMAIL_PASS missing — skipping emails");
    return;
  }
  const backup = makeTransporter(true);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://projectspace.technicalhub.io";
  const priorityColor = { Low: "#10b981", Medium: "#faa000", High: "#fd1c00" }[request.priority];

  for (const m of mentors) {
    const token = makeToken(request.id, m.id);
    const comingUrl = `${baseUrl}/mentor-panel/${request.id}?action=coming&mentor_id=${m.id}&token=${token}`;
    const busyUrl = `${baseUrl}/mentor-panel/${request.id}?action=busy&mentor_id=${m.id}&token=${token}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0610;color:#fff;border-radius:12px;overflow:hidden;border:1px solid #2a1a30">
        <div style="background:linear-gradient(135deg,#fd1c00,#fa0068);padding:20px 24px;color:#fff">
          <div style="font-size:11px;letter-spacing:.18em;opacity:.85">PROJECT SPACE · MENTOR REQUEST</div>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700">A team needs your help</h1>
        </div>
        <div style="padding:24px">
          <p style="margin:0 0 16px;color:#cfcfd6">Hi <b>${escapeHtml(m.name)}</b>,</p>
          <p style="margin:0 0 18px;color:#cfcfd6">Team <b>${team.team_number || ""}</b> (${escapeHtml(team.project_title || "Untitled")}) raised by <b>${escapeHtml(leaderName || "")}</b> needs help on the <b>${escapeHtml(request.technology)}</b> track.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#150b1d;border-radius:8px">
            <tr><td style="padding:10px 14px;color:#888">Priority</td><td style="padding:10px 14px"><span style="background:${priorityColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">${request.priority}</span></td></tr>
            <tr><td style="padding:10px 14px;color:#888;border-top:1px solid #2a1a30">Team</td><td style="padding:10px 14px;color:#fff;border-top:1px solid #2a1a30">${team.team_number}</td></tr>
            <tr><td style="padding:10px 14px;color:#888;border-top:1px solid #2a1a30">Project</td><td style="padding:10px 14px;color:#fff;border-top:1px solid #2a1a30">${escapeHtml(team.project_title || "—")}</td></tr>
            <tr><td style="padding:10px 14px;color:#888;border-top:1px solid #2a1a30;vertical-align:top">Issue</td><td style="padding:10px 14px;color:#fff;border-top:1px solid #2a1a30;line-height:1.5">${escapeHtml(request.issue_description)}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0">
            <a href="${comingUrl}" style="display:inline-block;background:linear-gradient(135deg,#fd1c00,#faa000);color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:700;margin-right:10px">I'm Coming →</a>
            <a href="${busyUrl}" style="display:inline-block;background:transparent;color:#fff;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid rgba(255,255,255,.3)">I'm Busy</a>
          </div>
          <p style="margin:18px 0 0;font-size:12px;color:#666;text-align:center">First mentor to click "I'm Coming" wins. The other mentors will see it as accepted.</p>
        </div>
      </div>
    `;

    const mailOpts = {
      to: m.email,
      subject: `[${request.priority}] Mentor Request from ${team.team_number || request.team_number}`,
      html,
    };

    try {
      await primary.sendMail({
        from: `"Project Space" <${process.env.GMAIL_USER}>`,
        ...mailOpts,
      });
    } catch (e) {
      console.warn(`[mentor-request] primary failed for ${m.email}, trying backup`, e.message);
      if (backup) {
        try {
          await backup.sendMail({
            from: `"Project Space" <${process.env.GMAIL_USER2}>`,
            ...mailOpts,
          });
        } catch (e2) {
          console.error(`[mentor-request] backup also failed for ${m.email}`, e2.message);
        }
      }
    }
  }
}

/* ---------- token helpers ---------- */
function makeToken(requestId, mentorId) {
  const secret = process.env.MENTOR_PANEL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret-change-me";
  return crypto
    .createHmac("sha256", secret)
    .update(`${requestId}:${mentorId}`)
    .digest("hex")
    .slice(0, 32);
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}