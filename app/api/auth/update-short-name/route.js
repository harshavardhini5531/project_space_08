import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const rollNumber = body.rollNumber?.trim().toUpperCase()
    const shortName = body.shortName?.trim()

    if (!rollNumber || !shortName) {
      return Response.json({ error: 'Roll number and short name are required' }, { status: 400 })
    }

    // Validation: max 15 chars, letters + spaces only
    if (shortName.length > 15) {
      return Response.json({ error: 'Short name must be 15 characters or less' }, { status: 400 })
    }
    if (!/^[A-Za-z ]+$/.test(shortName)) {
      return Response.json({ error: 'Short name can only contain letters and spaces' }, { status: 400 })
    }

    // Find member row
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('serial_number, is_leader')
      .eq('roll_number', rollNumber)
      .single()

    if (!memberRow) {
      return Response.json({ error: 'You are not part of any team' }, { status: 404 })
    }

    // Check uniqueness within team (excluding self)
    const { data: teamMates } = await supabase
      .from('team_members')
      .select('roll_number, short_name')
      .eq('serial_number', memberRow.serial_number)

    const duplicate = (teamMates || []).find(
      m => m.roll_number !== rollNumber &&
           m.short_name?.toLowerCase() === shortName.toLowerCase()
    )
    if (duplicate) {
      return Response.json({ error: 'This short name is already used by another member in your team' }, { status: 409 })
    }

    // 1. Update team_members
    const { error: tmErr } = await supabase
      .from('team_members')
      .update({ short_name: shortName })
      .eq('roll_number', rollNumber)
      .eq('serial_number', memberRow.serial_number)

    if (tmErr) {
      console.error('team_members update error:', tmErr)
      return Response.json({ error: 'Failed to update short name' }, { status: 500 })
    }

    // 2. Update team_registrations.members JSONB (if team is registered)
    const { data: regRow } = await supabase
      .from('team_registrations')
      .select('id, members')
      .eq('serial_number', memberRow.serial_number)
      .single()

    if (regRow && regRow.members) {
      try {
        const membersArr = typeof regRow.members === 'string' ? JSON.parse(regRow.members) : regRow.members
        const updated = membersArr.map(m =>
          m.roll_number === rollNumber ? { ...m, short_name: shortName } : m
        )
        await supabase
          .from('team_registrations')
          .update({ members: JSON.stringify(updated) })
          .eq('id', regRow.id)
      } catch (e) {
        console.error('Failed to update team_registrations members JSONB:', e)
      }
    }

    // 3. Update member_registrations (if row exists — only for non-leaders who signed up)
    if (!memberRow.is_leader) {
      await supabase
        .from('member_registrations')
        .update({ short_name: shortName })
        .eq('roll_number', rollNumber)
    }

    return Response.json({ success: true, shortName })

  } catch (err) {
    console.error('update-short-name error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}