// app/api/linkedin-card/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const teamNumber = searchParams.get('team')
  if (!teamNumber) return new Response('Missing team', { status: 400 })

  try {
    const { data: team } = await supabase.from('teams').select('*').eq('team_number', teamNumber).single()
    if (!team) return new Response('Team not found', { status: 404 })

    const { data: reg } = await supabase.from('team_registrations').select('*').eq('serial_number', team.serial_number).single()
    const { data: members } = await supabase.from('team_members').select('roll_number, short_name, is_leader').eq('serial_number', team.serial_number)

    const title = (reg?.project_title || team.project_title || 'Project Space').toUpperCase()
    const tech = team.technology || 'Technology'
    const memberCount = members?.length || 0

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0c0614"/>
      <stop offset="100%" style="stop-color:#1a0820"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fd1c00"/>
      <stop offset="100%" style="stop-color:#EEA727"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="630" fill="url(#accent)"/>
  <text x="60" y="120" font-family="Arial Black, sans-serif" font-size="28" font-weight="900" fill="#fd1c00" letter-spacing="4">${teamNumber}</text>
  <text x="60" y="170" font-family="Arial Black, sans-serif" font-size="16" font-weight="700" fill="#EEA727" letter-spacing="3">${tech.toUpperCase()}</text>
  <text x="60" y="280" font-family="Arial Black, sans-serif" font-size="72" font-weight="900" fill="#fff" letter-spacing="2">${title.length > 28 ? title.substring(0, 28) + '...' : title}</text>
  <text x="60" y="340" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.6)">${memberCount} Team Members · Drive Ready</text>
  <text x="60" y="560" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="rgba(255,255,255,0.4)">PROJECT SPACE</text>
  <text x="60" y="590" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.3)">Aditya University · Technical Hub · May 6–12, 2026</text>
  <text x="1140" y="580" font-family="Arial Black, sans-serif" font-size="56" font-weight="900" fill="rgba(253,28,0,0.15)" text-anchor="end">PS</text>
</svg>`

    // Convert SVG to PNG using Node's built-in approach (return SVG directly - LinkedIn accepts it via browser conversion)
    // We'll use sharp if available, otherwise return SVG
    try {
      const sharp = (await import('sharp')).default
      const png = await sharp(Buffer.from(svg)).resize(1200, 630).png().toBuffer()
      return new Response(png, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' }
      })
    } catch {
      return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' }
      })
    }
  } catch (err) {
    console.error('Card gen error:', err)
    return new Response('Error generating card', { status: 500 })
  }
}