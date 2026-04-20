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

    const prompt = `You are writing a LinkedIn post for a student showcasing their hackathon project at "Project Space" hosted by Aditya University and Technical Hub.

PROJECT DETAILS:
- Title: ${projectTitle || 'Untitled'}
- Description: ${projectDescription || 'Not provided'}
- Technology/Batch: ${technology || 'Tech'}
- Domain/Project Area: ${projectArea || 'Not specified'}
- Tech Stack: ${(techStack || []).join(', ') || 'Not specified'}
${aiCapabilities ? `- AI Integration: ${aiCapabilities}${aiTools?.length ? ` using ${aiTools.join(', ')}` : ''}` : ''}
- Team Members (excluding the poster): ${(memberNames || []).join(', ') || 'Solo'}
- Mentor: ${mentorName || 'Not assigned'}
- Posted by student: ${studentName || 'Student'}

TASK: Write a compelling, unique LinkedIn post in the EXACT format below. Make it feel human, proud, promotional, and authentic — NOT generic. Use Unicode bold text (𝗹𝗶𝗸𝗲 𝘁𝗵𝗶𝘀) for all names and section headers. Use icons/emojis for visual appeal.

REQUIRED STRUCTURE:
1. 🚀 Hook title (1 line, promotional, mentions project's value proposition)
2. Opening 2-3 sentences that establish the problem/excitement
3. ✨ Introduce the project name (bold)
4. 💡 "𝗪𝗵𝗮𝘁 𝗶𝘀 [Project]?" section — 2 sentences explaining what it does
5. 📊 "𝗞𝗲𝘆 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝘀 & 𝗜𝗺𝗽𝗮𝗰𝘁" — 3-4 bullet points of actual features/impact
6. 💻 "𝗕𝘂𝗶𝗹𝘁 𝗪𝗶𝘁𝗵" — tech stack
7. 🎯 "𝗗𝗼𝗺𝗮𝗶𝗻" — project area
8. 🤖 "𝗪𝗵𝗮𝘁'𝘀 𝗡𝗲𝘅𝘁" — future plans with AI (ONLY if AI integration provided)
9. 🤝 "𝗧𝗲𝗮𝗺" — list member names with bold formatting (one per line with •)
10. 🎓 "𝗠𝗲𝗻𝘁𝗼𝗿𝘀𝗵𝗶𝗽" — "Guided by 𝗕𝗼𝗹𝗱𝗠𝗲𝗻𝘁𝗼𝗿𝗡𝗮𝗺𝗲"
11. ⚡ "𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆" — Technical Hub (bold)
12. 👨‍💼 "𝗟𝗲𝗮𝗱𝗲𝗿𝘀𝗵𝗶𝗽" — "𝗕𝗮𝗯𝗷𝗶 𝗡𝗲𝗲𝗹𝗮𝗺, CEO – Technical Hub"
13. 🏛️ Aditya University (bold)
14. Closing 1-2 sentences about the journey
15. Hashtags: include project name, #ProjectSpace, #TechnicalHub, #AdityaUniversity, #Hackathon, + 3-4 relevant domain tags

IMPORTANT RULES:
- Use 𝗨𝗻𝗶𝗰𝗼𝗱𝗲 𝗺𝗮𝘁𝗵𝗲𝗺𝗮𝘁𝗶𝗰𝗮𝗹 𝗯𝗼𝗹𝗱 for ALL names (team, mentor, CEO, entities) and ALL section headers
- Make the tone genuine and excited, not corporate
- Don't use the word "Excited" as the first word
- Make bullet points specific to THIS project, not generic
- Keep total length under 500 words
- Output ONLY the post, no preamble or explanation

Begin writing the LinkedIn post now:`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
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