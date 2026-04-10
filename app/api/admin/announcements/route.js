import { supabase } from '@/lib/supabase'

// GET - fetch all announcements
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ announcements: data || [] })
  } catch (err) {
    return Response.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST - create or delete announcement
export async function POST(request) {
  try {
    const token = request.headers.get('x-admin-token')
    if (!token || !token.startsWith('admin_')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, id, title, message, image_url, link_url, link_text, target } = await request.json()

    if (action === 'create') {
      if (!title || !message) return Response.json({ error: 'Title and message required' }, { status: 400 })

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title,
          message,
          image_url: image_url || null,
          link_url: link_url || null,
          link_text: link_text || null,
          target: target || 'all',
          posted_by: 'Admin',
          is_active: true
        })
        .select()
        .single()

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, announcement: data })

    } else if (action === 'delete') {
      if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true })

    } else if (action === 'toggle') {
      if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

      const { data: existing } = await supabase
        .from('announcements')
        .select('is_active')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !existing?.is_active })
        .eq('id', id)

      if (error) return Response.json({ error: error.message }, { status: 500 })
      return Response.json({ success: true, is_active: !existing?.is_active })

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Announcement error:', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}