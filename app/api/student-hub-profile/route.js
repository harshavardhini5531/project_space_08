// app/api/student-hub-profile/route.js
// Aggregates ALL Technical Hub APIs into a single unified profile response
// Falls back to Supabase student_profiles for fields not in APIs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  // Bypass SSL cert issue for maya.technicalhub.io
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const { rollNumber } = await request.json();
    if (!rollNumber) {
      return Response.json({ error: "Roll number required" }, { status: 400 });
    }

    const roll = rollNumber.trim().toUpperCase();
    const MAYA = "https://maya.technicalhub.io/node/api";
    const APPS = "https://apps.technicalhub.io/old/techpanel2/api";

    const getJSON = async (url) => {
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; }
    };

    const postJSON = async (url, body) => {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; }
    };

    // ═══ PHASE 1: All non-dependent API calls + Supabase ═══
    const [
      userByRoll,
      academicDetails,
      codingDetails,
      violations,
      atsReport,
      studentDetailApps,
      digitalBadges,
      trainingCerts,
      internshipCerts,
      certCounts,
      attendanceStats,
      courses,
      hackerrank,
      leetcode,
      codechef,
      gfg,
      placement,
      aptLogicBadge,
      supabaseProfile,
    ] = await Promise.all([
      getJSON(`${MAYA}/get-user-by-rollno/${roll}`),
      getJSON(`${MAYA}/get-trainee-academic-details/${roll}`),
      getJSON(`${MAYA}/get-coding-details/${roll}`),
      getJSON(`${MAYA}/get-student-violations/${roll}`),
      getJSON(`${MAYA}/get-last-ats-report/${roll}`),
      getJSON(`${APPS}/student_details/?roll_number=${roll}`),
      getJSON(`${APPS}/digitalbadge_certificates/?roll_number=${roll}`),
      getJSON(`${APPS}/training_certificates/?roll_number=${roll}`),
      getJSON(`${APPS}/internship_certificate/?roll_number=${roll}`),
      getJSON(`${APPS}/certifications/students_certifications_counts.php/?roll_number=${roll}`),
      postJSON(`${MAYA}/get-total-student-attendance-stats-by-student-id`, { roll_no: roll }),
      postJSON(`${MAYA}/get-courses-by-roll-no`, { roll_no: roll }),
      postJSON(`${MAYA}/get-hackerrank-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-leetcode-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-codechef-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-geeksforgeeks-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/getPlacementByResults`, { roll_no: roll }),
      postJSON(`${MAYA}/get-aptlogic-badge-test-stats-by-roll-no`, { roll_no: roll }),
      supabase.from("student_profiles").select("*").eq("roll_number", roll).single().then(r => r.data),
    ]);

    // ═══ PHASE 2: student_id-dependent APIs ═══
    const studentId = userByRoll?._id || null;
    let mandatoryTests = null, practiceTests = null, aptMandatory = null, aptPractice = null;

    if (studentId) {
      [mandatoryTests, practiceTests, aptMandatory, aptPractice] = await Promise.all([
        postJSON(`${MAYA}/get-technology-wise-mandatory-tests-stats`, { student_id: studentId }),
        postJSON(`${MAYA}/get-technology-wise-practise-test-stats`, { student_id: studentId }),
        postJSON(`${MAYA}/get-apt-mandatory-totalstats-by-studentid`, { student_id: studentId }),
        postJSON(`${MAYA}/get-apt-practise-totalstats-by-studentid`, { student_id: studentId }),
      ]);
    }

    // ═══ NORMALIZE DATA ═══
    const academic = Array.isArray(academicDetails) ? academicDetails[0] : academicDetails;
    const sp = supabaseProfile || {};

    const profile = {
      // ── BASIC INFO (API + Supabase fallback) ──
      name: userByRoll?.first_name || sp.name || "",
      roll_number: roll,
      student_id: studentId,
      mobile: userByRoll?.mobile || sp.mobile || "",
      email: userByRoll?.email || "",
      gender: userByRoll?.gender || sp.gender || "",
      dob: userByRoll?.dob || "",
      college: academic?.college || sp.college || "",
      branch: Array.isArray(academic?.branch) ? academic.branch.join(", ") : (academic?.branch || sp.branch || ""),
      passout_year: academic?.passout_year || "",
      image_url: sp.image_url || `https://mobile.technicalhub.io:5010/uploads/students-images/${roll}.png`,
      github_profile: userByRoll?.github_profile || sp.github || "",
      github_username: userByRoll?.github_username || "",
      student_type: userByRoll?.student_type || "",
      bus_stage: userByRoll?.bus_stage || "",
      bus_status: userByRoll?.bus_status || 0,
      town: userByRoll?.town || sp.town || "",
      driveready_status: userByRoll?.driveready_status || 0,
      is_hosteler: userByRoll?.is_hosteler || 0,
      hold_status: userByRoll?.hold_status || 0,
      block_status: userByRoll?.block_status || 0,
      drop_status: userByRoll?.drop_status || 0,

      // ── FROM SUPABASE ONLY (not in APIs) ──
      technology: sp.technology || "",
      pool: sp.pool || "",
      entrance_type: sp.entrance_type || "",
      seat_type: sp.seat_type || "",
      scholar_type: sp.scholar_type || "",
      parent_mobile: sp.parent_mobile || "",
      bus_route: sp.bus_route || "",
      thub_attendance: sp.thub_attendance || 0,
      assessments: sp.assessments || 0,
      attitude: sp.attitude || 0,
      activities: sp.activities || "",
      achievements: sp.achievements || "",
      communication: sp.communication || 0,
      badge_test_pct: sp.badge_test_pct || "0",
      badge_test_status: sp.badge_test_status || "",
      placement_status: sp.placement || "",

      // Semesters (Supabase only)
      sem1: sp.sem1 || "", sem2: sp.sem2 || "", sem3: sp.sem3 || "",
      sem4: sp.sem4 || "", sem5: sp.sem5 || "",
      total_sems: sp.total_sems || 0,
      courses_thub: sp.courses_thub || 0,

      // Payments (Supabase only)
      payment_term1: sp.payment_term1 || "",
      payment_term2: sp.payment_term2 || "",
      payment_term3: sp.payment_term3 || "",
      payment_term4: sp.payment_term4 || "",
      payment_term5: sp.payment_term5 || "",

      // ── ACADEMIC (API primary, Supabase fallback) ──
      btech: academic?.btech || sp.btech_cgpa || 0,
      btech_pct: sp.btech_pct || 0,
      inter: academic?.inter || sp.inter_diploma_pct || 0,
      ssc: academic?.ssc || sp.tenth_pct || 0,
      rank: academic?.rank || sp.rank || null,
      backlogs: academic?.backlogs ?? sp.backlogs ?? 0,
      is_eamcet: academic?.is_eamcet === 1,
      is_management: academic?.is_management === 1,

      // ── CODING PLATFORMS (API) ──
      leetcode: leetcode || null,
      hackerrank: hackerrank || null,
      codechef: codechef || null,
      gfg: gfg || null,

      // ── MAYA CODING (API) ──
      mayaCoding: codingDetails ? {
        globalRank: codingDetails.globalRank,
        batchRank: codingDetails.batchRank,
        globalPosition: codingDetails.globalPosition,
        batchPosition: codingDetails.batchPosition,
        problems: codingDetails.problemDetails || null,
        languages: codingDetails.languageCounts || null,
        monthlyCounts: codingDetails.monthlyCounts || [],
        totalTime: codingDetails.totalTime || "",
      } : null,

      // Also from get-user-by-rollno
      problems_count: userByRoll?.problems_count || null,

      // ── ATTENDANCE (API) ──
      attendance: Array.isArray(attendanceStats) ? attendanceStats : [],

      // ── COURSES (API) ──
      courses: Array.isArray(courses) ? courses : [],

      // ── CERTIFICATIONS ──
      certCounts: certCounts || { Global_Certifications: 0, Training_Certificates: 0, Digitalbadge_Certificates: 0, Internship_Certificate: 0 },
      globalCerts: studentDetailApps?.["certification Details"] || [],
      digitalBadges: digitalBadges?.["Badge Details"] || [],
      trainingCerts: trainingCerts?.["Training certificates"] || (Array.isArray(trainingCerts) ? trainingCerts : []),
      internshipCerts: Array.isArray(internshipCerts) ? internshipCerts : [],
      // Supabase cert list
      certifications_list: sp.certifications || [],
      cert_count: sp.cert_count || 0,

      // ── VIOLATIONS (API) ──
      violations: violations?.violations || [],

      // ── ATS REPORT (API) ──
      atsReport: (atsReport?.message === "ATS record not found") ? null : atsReport,

      // ── PLACEMENT (API) ──
      placement: (placement?.message?.includes("No eligible")) ? null : placement,

      // ── APTITUDE & TESTS (API) ──
      aptLogicBadge: Array.isArray(aptLogicBadge) ? aptLogicBadge : [],
      mandatoryTests: Array.isArray(mandatoryTests) ? mandatoryTests : [],
      practiceTests: Array.isArray(practiceTests) ? practiceTests : [],
      aptMandatory: aptMandatory || null,
      aptPractice: aptPractice || null,
    };

    return Response.json({ success: true, profile });
  } catch (error) {
    console.error("Student Hub Profile Error:", error);
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  } finally {
    // Restore SSL verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }
}