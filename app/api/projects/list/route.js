import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    // Fetch all registered teams with project data
    const { data: teams, error } = await supabase
      .from('teams')
      .select('serial_number, team_number, technology, leader_roll, mentor_assigned, project_title, batch, registered')
      .eq('registered', true)
      .not('team_number', 'is', null)
      .order('team_number', { ascending: true })

    if (error) {
      console.error('projects/list error:', error)
      return Response.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Map to clean format
    const projects = (teams || []).map(t => ({
      serialNumber: t.serial_number,
      teamNumber: t.team_number,
      technology: t.technology,
      projectTitle: t.project_title || 'Untitled Project',
      leaderRoll: t.leader_roll,
      mentor: t.mentor_assigned,
      batch: t.batch
    }))

    return Response.json({ success: true, projects })

  } catch (err) {
    console.error('projects/list error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}