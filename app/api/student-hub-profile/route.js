// app/api/student-hub-profile/route.js
// Aggregates all Technical Hub APIs into a single unified profile response

export async function POST(request) {
  try {
    const { rollNumber } = await request.json();
    if (!rollNumber) {
      return Response.json({ error: "Roll number is required" }, { status: 400 });
    }

    const roll = rollNumber.trim().toUpperCase();
    const MAYA = "https://maya.technicalhub.io/node/api";
    const APPS = "https://apps.technicalhub.io/old/techpanel2/api";

    // Helper for GET requests
    const getJSON = async (url) => {
      try {
        const r = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; }
    };

    // Helper for POST requests
    const postJSON = async (url, body) => {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          next: { revalidate: 300 },
        });
        if (!r.ok) return null;
        return await r.json();
      } catch { return null; }
    };

    // ═══ FIRE ALL API CALLS IN PARALLEL ═══
    const [
      userByRoll,
      basicDetails,
      academicDetails,
      studentDetails,
      codingDetails,
      violations,
      atsReport,
      digitalBadges,
      trainingCerts,
      internshipCerts,
      certCounts,
      attendanceStats,
      hackerrank,
      leetcode,
      codechef,
      gfg,
      placementResults,
      aptLogicBadge,
    ] = await Promise.all([
      // GET APIs
      getJSON(`${MAYA}/get-user-by-rollno/${roll}`),
      getJSON(`${MAYA}/get-trainee-basic-details/${roll}`),
      getJSON(`${MAYA}/get-trainee-academic-details/${roll}`),
      getJSON(`${APPS}/student_details/?roll_number=${roll}`),
      getJSON(`${MAYA}/get-coding-details/${roll}`),
      getJSON(`${MAYA}/get-student-violations/${roll}`),
      getJSON(`${MAYA}/get-last-ats-report/${roll}`),
      getJSON(`${APPS}/digitalbadge_certificates/?roll_number=${roll}`),
      getJSON(`${APPS}/training_certificates/?roll_number=${roll}`),
      getJSON(`${APPS}/internship_certificate/?roll_number=${roll}`),
      getJSON(`${APPS}/certifications/students_certifications_counts.php/?roll_number=${roll}`),
      // POST APIs
      postJSON(`${MAYA}/get-total-student-attendance-stats-by-student-id`, { roll_no: roll }),
      postJSON(`${MAYA}/get-hackerrank-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-leetcode-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-codechef-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/get-geeksforgeeks-details-by-rollno`, { roll_no: roll }),
      postJSON(`${MAYA}/getPlacementByResults`, { roll_no: roll }),
      postJSON(`${MAYA}/get-aptlogic-badge-test-stats-by-roll-no`, { roll_no: roll }),
    ]);

    // Get student_id for APIs that need it
    const studentId = userByRoll?._id || null;

    // Fire student_id-dependent APIs if we have the ID
    let mandatoryTests = null;
    let practiceTests = null;
    let aptMandatory = null;
    let aptPractice = null;

    if (studentId) {
      [mandatoryTests, practiceTests, aptMandatory, aptPractice] = await Promise.all([
        postJSON(`${MAYA}/get-technology-wise-mandatory-tests-stats`, { student_id: studentId }),
        postJSON(`${MAYA}/get-technology-wise-practise-test-stats`, { student_id: studentId }),
        postJSON(`${MAYA}/get-apt-mandatory-totalstats-by-studentid`, { student_id: studentId }),
        postJSON(`${MAYA}/get-apt-practise-totalstats-by-studentid`, { student_id: studentId }),
      ]);
    }

    // ═══ BUILD UNIFIED RESPONSE ═══
    const academic = Array.isArray(academicDetails) ? academicDetails[0] : academicDetails;

    const profile = {
      // Basic Info
      basic: {
        name: userByRoll?.first_name || basicDetails?.first_name || "",
        roll_number: roll,
        mobile: userByRoll?.mobile || basicDetails?.mobile || "",
        email: userByRoll?.email || basicDetails?.email || "",
        student_id: studentId,
        image_url: `https://mobile.technicalhub.io:5010/uploads/students-images/${roll}.png`,
      },

      // Academic
      academic: academic ? {
        college: academic.college || "",
        branch: Array.isArray(academic.branch) ? academic.branch.join(", ") : (academic.branch || ""),
        passout_year: academic.passout_year || "",
        backlogs: academic.backlogs || 0,
        btech: academic.btech || 0,
        inter: academic.inter || 0,
        ssc: academic.ssc || 0,
        rank: academic.rank || null,
        is_eamcet: academic.is_eamcet === 1,
        is_management: academic.is_management === 1,
      } : null,

      // Student Details (from apps.technicalhub.io)
      studentDetails: studentDetails || null,

      // Coding Platforms
      coding: {
        leetcode: leetcode || null,
        hackerrank: hackerrank || null,
        codechef: codechef || null,
        gfg: gfg || null,
      },

      // Maya Coding (internal coding details)
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

      // Attendance
      attendance: Array.isArray(attendanceStats) ? attendanceStats : [],

      // Certifications
      certifications: {
        counts: certCounts || { Global_Certifications: 0, Training_Certificates: 0, Digitalbadge_Certificates: 0, Internship_Certificate: 0 },
        globalCerts: studentDetails?.["certification Details"] || [],
        digitalBadges: digitalBadges?.["Badge Details"] || [],
        trainingCerts: trainingCerts || [],
        internshipCerts: internshipCerts || [],
      },

      // Violations
      violations: violations?.violations || [],

      // ATS Report
      atsReport: atsReport?.message === "ATS record not found" ? null : atsReport,

      // Placement
      placement: placementResults,

      // Aptitude & Tests
      aptitude: {
        badgeTestStats: aptLogicBadge || null,
        mandatoryTests: mandatoryTests || null,
        practiceTests: practiceTests || null,
        aptMandatory: aptMandatory || null,
        aptPractice: aptPractice || null,
      },
    };

    return Response.json({ success: true, profile });

  } catch (error) {
    console.error("Student Hub Profile Error:", error);
    return Response.json({ error: "Failed to fetch profile data" }, { status: 500 });
  }
}