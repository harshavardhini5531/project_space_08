// app/api/linkedin-card/route.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Fetch image from URL and convert to base64 data URI
async function fetchImageAsDataUri(url) {
  try {
    // For technicalhub.io URLs that have SSL issues, use node's http/https with rejectUnauthorized: false
    const https = await import('https')
    const http = await import('http')
    
    return new Promise((resolve) => {
      try {
        const urlObj = new URL(url)
        const client = urlObj.protocol === 'https:' ? https : http
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          rejectUnauthorized: false,
          timeout: 5000
        }
        const req = client.request(options, (res) => {
          if (res.statusCode !== 200) {
            resolve(null)
            return
          }
          const chunks = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            const contentType = res.headers['content-type'] || 'image/jpeg'
            resolve(`data:${contentType};base64,${buffer.toString('base64')}`)
          })
        })
        req.on('error', () => resolve(null))
        req.on('timeout', () => { req.destroy(); resolve(null) })
        req.end()
      } catch {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const teamNumber = searchParams.get('team')
  if (!teamNumber) return new Response('Missing team', { status: 400 })

  try {
    // Fetch team data
    const { data: team } = await supabase.from('teams').select('*').eq('team_number', teamNumber).single()
    if (!team) return new Response('Team not found', { status: 404 })

    const { data: reg } = await supabase.from('team_registrations').select('*').eq('serial_number', team.serial_number).single()
    const { data: members } = await supabase.from('team_members').select('roll_number, short_name, is_leader').eq('serial_number', team.serial_number).order('is_leader', { ascending: false })

    // Fetch student images
    const rollNumbers = (members || []).map(m => m.roll_number)
    const { data: students } = await supabase.from('students').select('roll_number, name, image_url').in('roll_number', rollNumbers)
    const studentMap = {}
    ;(students || []).forEach(s => { studentMap[s.roll_number] = s })

    // Mentor data
    let mentorUrl = null
    let mentorName = team.mentor_assigned || 'Mentor'
    if (team.mentor_assigned) {
      const { data: mentor } = await supabase.from('mentors').select('name, image_url').eq('name', team.mentor_assigned).single()
      if (mentor?.image_url) {
        mentorUrl = await fetchImageAsDataUri(mentor.image_url)
      }
    }

    const title = (reg?.project_title || team.project_title || 'Project Space').toUpperCase()
    const tech = team.technology || 'Technology'
    const memberList = (members || []).slice(0, 6)

    // Fetch member images (up to 6)
    const memberImages = await Promise.all(memberList.map(async (m) => {
      const student = studentMap[m.roll_number] || {}
      const imgDataUri = student.image_url ? await fetchImageAsDataUri(student.image_url) : null
      const name = (student.name || m.short_name || m.roll_number).split(' ').slice(0, 2).join(' ').toUpperCase()
      return {
        roll: m.roll_number,
        name,
        image: imgDataUri,
        isLeader: m.is_leader
      }
    }))

    const isSkillup = team.batch === 'SkillUp Coder' || team.batch === 'Skillup Coder'
    const photoBg = isSkillup ? '#3d2310' : '#10233d'

    // Calculate member photo layout
    const canvasWidth = 1200
    const canvasHeight = 630
    const numMembers = memberImages.length
    const photoWidth = numMembers > 0 ? Math.min(180, (canvasWidth - 100) / numMembers - 8) : 180
    const photoHeight = photoWidth * 1.35
    const photosStartX = (canvasWidth - (photoWidth * numMembers + 8 * (numMembers - 1))) / 2
    const photosY = 230

    // Build photo strip SVG
    const photoStripSvg = memberImages.map((m, i) => {
      const x = photosStartX + i * (photoWidth + 8)
      const imgTag = m.image
        ? `<image x="${x}" y="${photosY}" width="${photoWidth}" height="${photoHeight}" href="${m.image}" preserveAspectRatio="xMidYMid slice"/>`
        : `<rect x="${x}" y="${photosY}" width="${photoWidth}" height="${photoHeight}" fill="${photoBg}"/><text x="${x + photoWidth / 2}" y="${photosY + photoHeight / 2 + 20}" font-family="Arial Black, sans-serif" font-size="56" font-weight="900" fill="rgba(255,255,255,0.3)" text-anchor="middle">${m.name.charAt(0)}</text>`

      const gradientOverlay = `<rect x="${x}" y="${photosY + photoHeight - 60}" width="${photoWidth}" height="60" fill="url(#photoOverlay)"/>`

      const leaderStar = m.isLeader
        ? `<circle cx="${x + 18}" cy="${photosY + 18}" r="12" fill="#EEA727"/><text x="${x + 18}" y="${photosY + 23}" font-size="14" text-anchor="middle" fill="white">★</text>`
        : ''

      const nameTag = `<text x="${x + photoWidth / 2}" y="${photosY + photoHeight - 18}" font-family="Arial Black, sans-serif" font-size="13" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1.2">${m.name}</text>`
      const rollTag = `<text x="${x + photoWidth - 6}" y="${photosY + photoHeight - 6}" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.8)" text-anchor="end">${m.roll}</text>`

      return imgTag + gradientOverlay + leaderStar + nameTag + rollTag
    }).join('')

    // Mentor badge SVG
    const mentorSvg = mentorUrl
      ? `<g transform="translate(${canvasWidth - 200}, 50)">
          <circle cx="40" cy="40" r="35" fill="none" stroke="url(#mentorGlow)" stroke-width="2"/>
          <clipPath id="mentorClip"><circle cx="40" cy="40" r="32"/></clipPath>
          <image x="8" y="8" width="64" height="64" href="${mentorUrl}" clip-path="url(#mentorClip)" preserveAspectRatio="xMidYMid slice"/>
          <text x="40" y="105" font-family="Arial Black, sans-serif" font-size="11" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${mentorName.split(' ').slice(0, 3).join(' ').toUpperCase()}</text>
         </g>`
      : `<g transform="translate(${canvasWidth - 200}, 50)">
          <circle cx="40" cy="40" r="35" fill="rgba(238,167,39,0.1)" stroke="#EEA727" stroke-width="2"/>
          <text x="40" y="48" font-family="Arial Black, sans-serif" font-size="24" font-weight="900" fill="#EEA727" text-anchor="middle">${mentorName.charAt(0)}</text>
          <text x="40" y="105" font-family="Arial Black, sans-serif" font-size="11" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${mentorName.split(' ').slice(0, 3).join(' ').toUpperCase()}</text>
         </g>`

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0c0614"/>
      <stop offset="50%" style="stop-color:#1a0820"/>
      <stop offset="100%" style="stop-color:#0c0614"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fd1c00"/>
      <stop offset="100%" style="stop-color:#EEA727"/>
    </linearGradient>
    <linearGradient id="mentorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fd1c00"/>
      <stop offset="100%" style="stop-color:#EEA727"/>
    </linearGradient>
    <linearGradient id="photoOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.85)"/>
    </linearGradient>
    <linearGradient id="techPill" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#fd1c00"/>
      <stop offset="100%" style="stop-color:#EEA727"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="${canvasHeight}" fill="url(#accent)"/>

  <!-- Team badge -->
  <rect x="60" y="50" width="130" height="38" rx="8" fill="rgba(253,28,0,0.2)" stroke="rgba(253,28,0,0.5)" stroke-width="1"/>
  <text x="125" y="76" font-family="Arial Black, sans-serif" font-size="18" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="3">${teamNumber}</text>

  <!-- Tech pill -->
  <rect x="205" y="50" width="${Math.max(140, tech.length * 12)}" height="38" rx="8" fill="white"/>
  <text x="${205 + Math.max(140, tech.length * 12) / 2}" y="76" font-family="Arial Black, sans-serif" font-size="13" font-weight="900" fill="#fd1c00" text-anchor="middle" letter-spacing="1.5">${tech.toUpperCase()}</text>

  <!-- Mentor -->
  ${mentorSvg}

  <!-- Project Title -->
  <text x="60" y="160" font-family="Arial Black, sans-serif" font-size="56" font-weight="900" fill="#fff" letter-spacing="3">${title.length > 32 ? title.substring(0, 32) + '...' : title}</text>

  <!-- Subtitle -->
  <text x="60" y="200" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.6)">${memberList.length} Team Members · ${team.batch || 'Drive Ready'}</text>

  <!-- Members photo strip -->
  ${photoStripSvg}

  <!-- Footer -->
  <text x="60" y="${canvasHeight - 40}" font-family="Arial Black, sans-serif" font-size="16" font-weight="900" fill="rgba(255,255,255,0.5)" letter-spacing="2">PROJECT SPACE</text>
  <text x="60" y="${canvasHeight - 20}" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.3)">Aditya University · Technical Hub · May 6–12, 2026</text>
  <text x="${canvasWidth - 30}" y="${canvasHeight - 20}" font-family="Arial Black, sans-serif" font-size="40" font-weight="900" fill="rgba(253,28,0,0.15)" text-anchor="end">PS</text>
</svg>`

    // Convert SVG to PNG
    try {
      const sharp = (await import('sharp')).default
      const png = await sharp(Buffer.from(svg))
        .resize(canvasWidth, canvasHeight)
        .png({ quality: 95 })
        .toBuffer()
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } catch (err) {
      console.error('Sharp conversion error:', err)
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
  } catch (err) {
    console.error('Card gen error:', err)
    return new Response('Error generating card: ' + err.message, { status: 500 })
  }
}