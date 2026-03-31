import { supabase } from "@/lib/supabase"

export async function POST(request) {
  try {
    var body = await request.json()
    var { rollNumber } = body

    if (!rollNumber) {
      return Response.json({ error: "Roll number required" }, { status: 400 })
    }

    var roll = rollNumber.toUpperCase().trim()

    // ── 1. Try 'teams' table first (app-registered teams) ──
    var memberRes = await supabase
      .from("team_members")
      .select("team_id, is_leader")
      .eq("member_roll_number", roll)
      .eq("is_leader", true)
      .maybeSingle()

    if (!memberRes.error && memberRes.data) {
      var teamId = memberRes.data.team_id
      var teamRes = await supabase.from("teams").select("*").eq("id", teamId).single()

      if (!teamRes.error && teamRes.data) {
        var team = teamRes.data
        var membersRes = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamId)
          .order("is_leader", { ascending: false })

        return Response.json({
          found: true,
          source: "teams",
          team: {
            id: team.id,
            teamNumber: team.team_number,
            projectTitle: team.project_title || "",
            projectDescription: team.project_description || "",
            technologies: team.technologies || [],
            projectScope: team.project_scope || [],
            aiCapabilities: team.ai_capabilities || "",
            aiTools: team.ai_tools || [],
          },
          members: (membersRes.data || []).map(function (m) {
            return {
              member_name: m.member_name || "",
              member_roll_number: m.member_roll_number || "",
              member_email: m.member_email || "",
              member_phone: m.member_phone || "",
              member_branch: m.member_branch || "",
              member_year: m.member_year || "",
              member_college: m.member_college || "",
              is_leader: m.is_leader || false,
            }
          }),
        })
      }
    }

    // ── 2. Fall back to 'registered_teams' (manually added) ──
    // First fetch a sample row so we can log actual column names
    var sampleRes = await supabase
      .from("registered_teams")
      .select("*")
      .limit(1)

    if (sampleRes.error) {
      console.error("registered_teams fetch error:", sampleRes.error)
      return Response.json({ found: false, debug: "table_error: " + sampleRes.error.message })
    }

    if (!sampleRes.data || sampleRes.data.length === 0) {
      console.log("registered_teams is empty")
      return Response.json({ found: false, debug: "table_empty" })
    }

    // Log actual column names from first row
    var actualColumns = Object.keys(sampleRes.data[0])
    console.log("registered_teams actual columns:", actualColumns)
    console.log("registered_teams sample row:", JSON.stringify(sampleRes.data[0]))

    // Now fetch ALL rows and find the leader match in JS
    // (avoids any column-name quoting issues with .eq())
    var allRowsRes = await supabase
      .from("registered_teams")
      .select("*")

    if (allRowsRes.error || !allRowsRes.data) {
      return Response.json({ found: false, debug: "fetch_all_error" })
    }

    // Find the row where any column that looks like a leader column matches the roll
    var rt = null
    var leaderCol = null

    // Try to find which column holds the leader roll
    var possibleLeaderCols = actualColumns.filter(function (col) {
      var lower = col.toLowerCase()
      return lower.includes("leader") || lower === "team leader" || lower === "leader_roll"
    })

    console.log("Possible leader columns:", possibleLeaderCols)

    for (var i = 0; i < allRowsRes.data.length; i++) {
      var row = allRowsRes.data[i]
      for (var j = 0; j < possibleLeaderCols.length; j++) {
        var colVal = row[possibleLeaderCols[j]]
        if (colVal && colVal.toString().toUpperCase().trim() === roll) {
          rt = row
          leaderCol = possibleLeaderCols[j]
          break
        }
      }
      if (rt) break
    }

    console.log("Found row:", rt ? "YES (leaderCol=" + leaderCol + ")" : "NO")

    if (!rt) {
      return Response.json({ found: false, debug: "no_match_for_" + roll + "_cols_checked_" + possibleLeaderCols.join(",") })
    }

    // Identify member columns
    var memberCols = actualColumns.filter(function (col) {
      var lower = col.toLowerCase()
      return lower.includes("member")
    }).sort()

    console.log("Member columns:", memberCols)

    // Build member list: leader first, then member cols
    var rawRolls = [{ roll: rt[leaderCol], isLeader: true }]
    memberCols.forEach(function (col) {
      var val = rt[col]
      if (val && val.toString().trim() !== "" && val !== "NULL" && val !== "NIL" && val !== "-") {
        rawRolls.push({ roll: val.toString().toUpperCase().trim(), isLeader: false })
      }
    })

    // Identify project title and description columns
    var titleCol = actualColumns.find(function (c) { return c.toLowerCase().includes("project title") || c.toLowerCase() === "project title" }) || ""
    var descCol  = actualColumns.find(function (c) { return c.toLowerCase().includes("description") || c.toLowerCase().includes("desc") }) || ""
    var techCol  = actualColumns.find(function (c) { return c.toLowerCase() === "technology" || c.toLowerCase().includes("tech") }) || ""

    console.log("titleCol:", titleCol, "descCol:", descCol, "techCol:", techCol)

    // Fetch student details
    var allRolls = rawRolls.map(function (r) { return r.roll.toUpperCase().trim() })
    var studentsRes = await supabase
      .from("students")
      .select("roll_number, name, email, phone, branch, college")
      .in("roll_number", allRolls)

    var studentsMap = {}
    if (studentsRes.data) {
      studentsRes.data.forEach(function (s) {
        studentsMap[s.roll_number.toUpperCase().trim()] = s
      })
    }

    var members = rawRolls.map(function (r) {
      var rollUp = r.roll.toUpperCase().trim()
      var s = studentsMap[rollUp] || {}
      return {
        member_name: s.name || "",
        member_roll_number: rollUp,
        member_email: s.email || "",
        member_phone: s.phone || "",
        member_branch: s.branch || "",
        member_year: "",
        member_college: s.college || "",
        is_leader: r.isLeader,
      }
    })

    return Response.json({
      found: true,
      source: "registered_teams",
      team: {
        id: rt["Sl.No"] || null,
        teamNumber: "",
        projectTitle:      titleCol ? (rt[titleCol] || "") : "",
        projectDescription: descCol ? (rt[descCol]  || "") : "",
        technologies: [],
        projectScope: techCol && rt[techCol] ? [rt[techCol]] : [],
        aiCapabilities: "",
        aiTools: [],
      },
      members: members,
    })

  } catch (err) {
    console.error("get-team-data error:", err)
    return Response.json({ error: "Server error: " + err.message }, { status: 500 })
  }
}