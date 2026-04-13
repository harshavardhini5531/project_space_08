// app/api/milestones/notifications/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET — fetch notifications
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // mentor, admin, student
    const email = searchParams.get('email') // recipient email or roll number
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit')) || 20

    if (!type) {
      return Response.json({ error: 'Type required (mentor/admin/student)' }, { status: 400 })
    }

    let query = supabase
      .from('milestone_notifications')
      .select('*')
      .eq('recipient_type', type)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (email && type !== 'admin') {
      query = query.eq('recipient_email', email)
    }

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query
    if (error) throw error

    // Get unread count
    let countQuery = supabase
      .from('milestone_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_type', type)
      .eq('read', false)

    if (email && type !== 'admin') {
      countQuery = countQuery.eq('recipient_email', email)
    }

    const { count: unreadCount } = await countQuery

    return Response.json({
      notifications: data || [],
      unread_count: unreadCount || 0,
    })

  } catch (err) {
    console.error('Notifications GET error:', err)
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST — mark notifications as read
export async function POST(request) {
  try {
    const { action, notificationId, type, email } = await request.json()

    if (action === 'mark-read' && notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('milestone_notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      return Response.json({ success: true })
    }

    if (action === 'mark-all-read' && type) {
      // Mark all notifications as read for this user
      let query = supabase
        .from('milestone_notifications')
        .update({ read: true })
        .eq('recipient_type', type)
        .eq('read', false)

      if (email && type !== 'admin') {
        query = query.eq('recipient_email', email)
      }

      const { error } = await query
      if (error) throw error
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('Notifications POST error:', err)
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}