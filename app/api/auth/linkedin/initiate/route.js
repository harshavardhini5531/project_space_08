// app/api/auth/linkedin/initiate/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const teamNumber = searchParams.get('team')
  const postText = searchParams.get('text') || ''

  if (!teamNumber) {
    return NextResponse.json({ error: 'Missing team number' }, { status: 400 })
  }

  // Store team info and post text in state (encoded) so we can retrieve after callback
  const state = Buffer.from(JSON.stringify({ teamNumber, postText, ts: Date.now() })).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: 'openid profile email w_member_social',
    state
  })

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  return NextResponse.redirect(authUrl)
}