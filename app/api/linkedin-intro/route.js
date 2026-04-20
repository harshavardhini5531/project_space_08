// app/api/linkedin-intro/route.js
// Generates full AI-powered LinkedIn post using Claude API

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectTitle, projectDescription, technology, projectArea, techStack, aiCapabilities, aiTools, memberNames, mentorName, studentName } = body

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'API key missing' }, { status: 500 })
    }

    const prompt = `You are writing a COMPACT LinkedIn post for a student showcasing their hackathon project.

PROJECT DETAILS:
- Title: ${projectTitle || 'Untitled'}
- Description: ${projectDescription || 'Not provided'}
- Technology: ${technology || 'Tech'}
- Domain: ${projectArea || 'Not specified'}
- Tech Stack: ${(techStack || []).join(', ') || 'Not specified'}
${aiCapabilities ? `- AI Integration: ${aiCapabilities}${aiTools?.length ? ` using ${aiTools.join(', ')}` : ''}` : ''}
- Team Members: ${(memberNames || []).join(', ') || 'Solo'}
- Mentor: ${mentorName || 'Not assigned'}

STRICT CONSTRAINTS:
- TOTAL LENGTH: Maximum 400 characters including emojis and hashtags
- NO empty lines between sections (use single line breaks only)
- Concise and punchy, not verbose
- Output MUST fit in LinkedIn's share URL

REQUIRED STRUCTURE (all single lines, no blank lines):
Line 1: 🚀 One-line catchy hook mentioning project title (bold via Unicode)
Line 2: 💡 One sentence about what it does (max 15 words)
Line 3: 💻 Tech: [stack] · 🎯 [domain]
Line 4: 🤝 Team: [bold names joined by ·]
Line 5: 🎓 Mentor: [bold mentor name]
Line 6: ⚡ 𝗧𝗲𝗰𝗵𝗻𝗶𝗰𝗮𝗹 𝗛𝘂𝗯 · 𝗕𝗮𝗯𝗷𝗶 𝗡𝗲𝗲𝗹𝗮𝗺 · 𝗔𝗱𝗶𝘁𝘆𝗮 𝗨𝗻𝗶𝘃𝗲𝗿𝘀𝗶𝘁𝘆
Line 7: #ProjectSpace #AdityaUniversity #TechnicalHub + 2 domain hashtags

IMPORTANT:
- Use Unicode mathematical bold (𝗔𝗕𝗖 format) for ALL names and project title
- NO double line breaks anywhere
- Count characters — MUST be under 400 total
- Output ONLY the post, no explanations

Write the compact LinkedIn post now:`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await res.json()
    const text = data?.content?.[0]?.text?.trim()

    if (!text) {
      return Response.json({ error: 'No response from AI', debug: data }, { status: 500 })
    }

    return Response.json({ post: text, source: 'ai' })
  } catch (err) {
    console.error('Claude API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}