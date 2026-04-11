// app/api/admin/report-card/route.js
// Generates a compact one-page PDF report card for a student
// Fetches data from Technical Hub APIs + Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const { rollNumber } = await request.json();
    if (!rollNumber) return Response.json({ error: "Roll number required" }, { status: 400 });

    const roll = rollNumber.trim().toUpperCase();
    const MAYA = "https://maya.technicalhub.io/node/api";
    const APPS = "https://apps.technicalhub.io/old/techpanel2/api";

    const getJSON = async (url) => { try { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) return null; return await r.json(); } catch { return null; } };
    const postJSON = async (url, body) => { try { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }); if (!r.ok) return null; return await r.json(); } catch { return null; } };

    // Fetch all data in parallel
    const [userByRoll, academicDetails, codingDetails, violations, studentDetailApps, certCounts, attendanceStats, courses, hackerrank, leetcode, codechef, gfg, placement, aptMandatoryData, supabaseProfile] = await Promise.all([
      getJSON(`${MAYA}/get-user-by-rollno/${roll}`),
      getJSON(`${MAYA}/get-trainee-academic-details/${roll}`),
      getJSON(`${MAYA}/get-coding-details/${roll}`),
      getJSON(`${MAYA}/get-student-violations/${roll}`),
      getJSON(`${APPS}/student_details/?roll_number=${roll}`),
      getJSON(`${APPS}/certifications/students_certifications_counts.php/?roll_number=${roll}`),
      postJSON(`${MAYA}/get-total-student-attendance-stats-by-student-id`, { roll_no: roll }),
      postJSON(`${MAYA}/get-courses-by-roll-no`, { roll_no: roll }),
      postJSON(`${MAYA}/get-hackerrank-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-leetcode-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-codechef-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-geeksforgeeks-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/getPlacementByResults`, { roll_no: roll }),
      null, // will fetch after getting student_id
      supabase.from("student_profiles").select("*").eq("roll_number", roll).single().then(r => r.data),
    ]);

    if (!userByRoll && !supabaseProfile) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Phase 2: student_id dependent
    const studentId = userByRoll?._id || null;
    let aptMandatory = null;
    if (studentId) {
      aptMandatory = await postJSON(`${MAYA}/get-apt-mandatory-totalstats-by-studentid`, { student_id: studentId });
    }

    const academic = Array.isArray(academicDetails) ? academicDetails[0] : academicDetails;
    const sp = supabaseProfile || {};
    const att = Array.isArray(attendanceStats) ? attendanceStats : [];
    const totalPresent = att.reduce((s, a) => s + (a.present || 0), 0);
    const totalSessions = att.reduce((s, a) => s + (a.total_sessions || 0), 0);
    const overallAtt = totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(1) : "0";
    const vio = violations?.violations || [];
    const globalCerts = studentDetailApps?.["certification Details"] || [];
    const cc = certCounts || {};
    const coursesList = Array.isArray(courses) ? courses : [];

    // Build the report data object
    const report = {
      name: userByRoll?.first_name || sp.name || "",
      roll_number: roll,
      email: userByRoll?.email || "",
      mobile: userByRoll?.mobile || sp.mobile || "",
      gender: userByRoll?.gender || sp.gender || "",
      dob: userByRoll?.dob || "",
      college: academic?.college || sp.college || "",
      branch: Array.isArray(academic?.branch) ? academic.branch.join(", ") : (academic?.branch || sp.branch || ""),
      passout_year: academic?.passout_year || "",
      technology: sp.technology || "",
      pool: sp.pool || "",
      entrance_type: sp.entrance_type || "",
      rank: academic?.rank || sp.rank || "",
      seat_type: sp.seat_type || "",
      scholar_type: sp.scholar_type || "",
      town: userByRoll?.town || sp.town || "",
      github: userByRoll?.github_profile || sp.github || "",

      // Academic
      btech: academic?.btech || sp.btech_cgpa || "",
      btech_pct: sp.btech_pct || "",
      inter: academic?.inter || sp.inter_diploma_pct || "",
      ssc: academic?.ssc || sp.tenth_pct || "",
      backlogs: academic?.backlogs ?? sp.backlogs ?? 0,

      // Attendance
      overallAttendance: overallAtt,
      totalPresent, totalSessions,
      attendance: att.map(a => ({
        tech: a.technology_name,
        course: a.course_name,
        present: a.present,
        absent: a.absent,
        total: a.total_sessions,
        pct: parseFloat(a.percentage || 0).toFixed(1)
      })),

      // Coding
      leetcode: leetcode ? { total: leetcode.lc_total_progarms, easy: leetcode.lc_easy, medium: leetcode.lc_medium, hard: leetcode.lc_hard, rank: leetcode.lc_rank, streak: leetcode.lc_streak, weekly: leetcode.lc_weekly_solved } : null,
      hackerrank: hackerrank ? { stars: hackerrank.hr_total_stars, badges: hackerrank.hr_badges, certs: hackerrank.hr_certification_count, c: hackerrank.hr_c, cpp: hackerrank.hr_cpp, java: hackerrank.hr_java, python: hackerrank.hr_python, sql: hackerrank.hr_sql, ps: hackerrank.hr_problem_solving } : null,
      codechef: codechef ? { total: codechef.total_problems, rating: codechef.rating, stars: codechef.star_rating, contests: codechef.contests, streak: codechef.streak } : null,
      gfg: gfg ? { total: gfg.gfg_total_problems, score: gfg.gfg_score, streak: gfg.gfg_streak } : null,
      mayaCoding: codingDetails ? { globalRank: codingDetails.globalRank, batchRank: codingDetails.batchRank, score: codingDetails.problemDetails?.score, easy: codingDetails.problemDetails?.easy, medium: codingDetails.problemDetails?.medium, hard: codingDetails.problemDetails?.hard, totalTime: codingDetails.totalTime, languages: codingDetails.languageCounts } : null,

      // Certs
      certCounts: { global: cc.Global_Certifications || 0, training: cc.Training_Certificates || 0, badges: cc.Digitalbadge_Certificates || 0, internship: cc.Internship_Certificate || 0 },
      globalCerts: globalCerts.map(c => c.certifications_name),

      // Aptitude
      aptMandatory: aptMandatory ? { attempts: aptMandatory.noof_attempts, total: aptMandatory.total_attempts, pct: aptMandatory.total_percentage?.toFixed(1), easy: aptMandatory.easy_tests, medium: aptMandatory.medium_tests, hard: aptMandatory.hard_tests, aptitude: aptMandatory.aptitude_tests, reasoning: aptMandatory.reasoning_tests, verbal: aptMandatory.verbal_tests } : null,

      // Others
      violations: vio.length,
      placement: placement?.message?.includes("No eligible") ? "Not yet placed" : (sp.placement || "Not yet placed"),
      courses: coursesList.map(c => c.technology_name),
      badge_test_pct: sp.badge_test_pct || "0",
      badge_test_status: sp.badge_test_status || "",

      // Payments
      payments: [sp.payment_term1, sp.payment_term2, sp.payment_term3, sp.payment_term4, sp.payment_term5],

      // Semesters
      semesters: [sp.sem1, sp.sem2, sp.sem3, sp.sem4, sp.sem5].filter(Boolean),

      image_url: `https://mobile.technicalhub.io:5010/uploads/students-images/${roll}.png`,
    };

    return Response.json({ success: true, report });
  } catch (error) {
    console.error("Report card error:", error);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }
}