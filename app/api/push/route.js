// app/api/push/route.js
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_EMAIL = process.env.GMAIL_USER || 'thubprojectspace@gmail.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC, VAPID_PRIVATE)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'subscribe') {
      const { subscription, userEmail, userType } = body
      if (!subscription || !userEmail) return Response.json({ error: 'Missing data' }, { status: 400 })
      const subJson = JSON.stringify(subscription)
      // Delete any existing subscription with same endpoint (same device re-subscribing)
      await supabase.from('push_subscriptions').delete().eq('subscription', subJson)
      // Insert new subscription (allows multiple devices per user)
      const { error } = await supabase.from('push_subscriptions').insert({ user_email: userEmail, user_type: userType || 'student', subscription: subJson, updated_at: new Date().toISOString() })
      if (error) throw error
      return Response.json({ success: true })
    }

    if (action === 'send') {
      const { recipientEmail, recipientType, title, body: msgBody, url, type, teamNumber, stageNumber } = body
      let query = supabase.from('push_subscriptions').select('subscription, user_email')
      if (recipientType === 'admin') query = query.eq('user_type', 'admin')
      else if (recipientEmail) query = query.eq('user_email', recipientEmail)
      else return Response.json({ error: 'No recipient' }, { status: 400 })

      const { data: subs } = await query
      if (!subs?.length) return Response.json({ success: true, sent: 0 })

      const payload = JSON.stringify({ title: title || 'Project Space', body: msgBody || 'New notification', url: url || '/', type, teamNumber, stageNumber, tag: `ps-${Date.now()}`, actions: [{ action: 'view', title: 'View' }] })
      let sent = 0
      for (const sub of subs) {
        try { await webpush.sendNotification(JSON.parse(sub.subscription), payload); sent++ }
        catch (err) { if (err.statusCode === 410 || err.statusCode === 404) await supabase.from('push_subscriptions').delete().eq('user_email', sub.user_email) }
      }
      return Response.json({ success: true, sent })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Push error:', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}