// app/api/auth/linkedin/callback/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://projectspace.technicalhub.io'}/dashboard?li_error=${error}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`https://projectspace.technicalhub.io/dashboard?li_error=missing_code`)
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { teamNumber, postText } = stateData

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      })
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('LinkedIn token error:', tokenData)
      return NextResponse.redirect(`https://projectspace.technicalhub.io/dashboard?li_error=token_failed`)
    }

    // Get user info using the access token
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const userData = await userRes.json()

    if (!userData.sub) {
      return NextResponse.redirect(`https://projectspace.technicalhub.io/dashboard?li_error=user_failed`)
    }

    // Encode token + user + post data for client
    const responseData = Buffer.from(JSON.stringify({
      access_token: tokenData.access_token,
      user_urn: `urn:li:person:${userData.sub}`,
      name: userData.name,
      teamNumber,
      postText
    })).toString('base64url')

    // Redirect to a page that will auto-post
    return NextResponse.redirect(`https://projectspace.technicalhub.io/linkedin-posting?data=${responseData}`)

  } catch (err) {
    console.error('LinkedIn callback error:', err)
    return NextResponse.redirect(`https://projectspace.technicalhub.io/dashboard?li_error=callback_failed`)
  }
}