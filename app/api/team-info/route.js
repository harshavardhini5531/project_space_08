// app/api/team-info/route.js
// PUBLIC API — given a roll number, returns full team + project details.
// Reuses the same response shape as /api/projects/details for consistency.
//
// USAGE:
//   GET /api/team-info?roll=23P31A4933
//   GET /api/team-info?rollNumber=23P31A4933

import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let roll = searchParams.get('roll') || searchParams.get('rollNumber');

    if (!roll) {
      return Response.json(
        { error: 'roll parameter required (e.g. ?roll=23P31A4933)' },
        { status: 400 }
      );
    }
    roll = roll.trim().toUpperCase();

    // 1. Find team — first check leader_roll
    let { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('leader_roll', roll)
      .maybeSingle();

    // 2. If not leader, check team_members
    if (!team) {
      const { data: member } = await supabase
        .from('team_members')
        .select('serial_number, team_number')
        .eq('roll_number', roll)
        .maybeSingle();

      if (!member) {
        return Response.json(
          { error: `No team found for roll number ${roll}` },
          { status: 404 }
        );
      }

      const { data: t } = await supabase
        .from('teams')
        .select('*')
        .eq('serial_number', member.serial_number)
        .maybeSingle();
      team = t;
    }

    if (!team) {
      return Response.json({ error: 'Team data not found' }, { status: 404 });
    }

    // 3. Mentor details
    let mentorData = null;
    if (team.mentor_assigned) {
      const { data: mentor } = await supabase
        .from('mentors')
        .select('name, email, image_url, technology, emp_id, batch')
        .eq('name', team.mentor_assigned)
        .single();
      if (mentor) mentorData = mentor;
    }

    // 4. Registration
    const { data: registration } = await supabase
      .from('team_registrations')
      .select('*')
      .eq('serial_number', team.serial_number)
      .single();

    // 5. Members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('roll_number, is_leader, short_name')
      .eq('serial_number', team.serial_number);

    // 6. Student details
    const rollNumbers = (teamMembers || []).map((m) => m.roll_number);
    let studentsMap = {};
    if (rollNumbers.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('roll_number, name, email, phone, branch, college, image_url, gender')
        .in('roll_number', rollNumbers);
      if (students) students.forEach((s) => { studentsMap[s.roll_number] = s; });
    }

    const members = (teamMembers || [])
      .map((m) => ({
        rollNumber: m.roll_number,
        shortName: m.short_name,
        isLeader: m.is_leader,
        name: studentsMap[m.roll_number]?.name || m.roll_number,
        email: studentsMap[m.roll_number]?.email || '',
        phone: studentsMap[m.roll_number]?.phone || '',
        branch: studentsMap[m.roll_number]?.branch || '',
        college: studentsMap[m.roll_number]?.college || '',
        imageUrl: studentsMap[m.roll_number]?.image_url || '',
        gender: studentsMap[m.roll_number]?.gender || '',
      }))
      .sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return 0;
      });

    const parseJsonField = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      try { return JSON.parse(v); } catch { return []; }
    };

    return Response.json({
      success: true,
      query_roll: roll,
      project: {
        serialNumber: team.serial_number,
        teamNumber: team.team_number,
        technology: team.technology,
        batch: team.batch,
        registered: team.registered,
        mentor: team.mentor_assigned,
        mentorDetails: mentorData,
        leaderRoll: team.leader_roll,
        projectTitle: registration?.project_title || team.project_title || '',
        projectDescription: registration?.project_description || team.project_description || '',
        problemStatement: registration?.problem_statement || team.problem_statement || '',
        projectArea: parseJsonField(registration?.project_area),
        techStack: parseJsonField(registration?.tech_stack),
        aiUsage: registration?.ai_usage || team.ai_usage || 'No',
        aiCapabilities: registration?.ai_capabilities || '',
        aiTools: parseJsonField(registration?.ai_tools),
        registeredAt: registration?.registered_at,
        members,
      },
    });
  } catch (err) {
    console.error('[team-info] error:', err);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}