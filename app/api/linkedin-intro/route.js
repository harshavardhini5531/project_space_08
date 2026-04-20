// app/api/linkedin-intro/route.js
// Generates 2-line unique excitement intro using Claude API

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectTitle, technology, projectArea, studentName } = body

    const fallbacks = [
      `Thrilled to share a glimpse of what our team has been building! This journey has taught me more than any classroom ever could.`,
      `Today marks a huge milestone for our team — taking an idea from a whiteboard to a working project has been nothing short of exhilarating.`,
      `Beyond proud of what we've built together. Every late night, every debugging session, every breakthrough made this worth it.`,
      `Hitting "Deploy" on our project felt like magic. This is what happens when curiosity meets collaboration!`,
      `What started as a scribble in a notebook is now reality. Incredibly grateful for this learning-packed journey.`,
      `From ideation to implementation — every step of building this taught me something new. Here's to the power of teamwork!`,
      `Sharing this project feels surreal. We poured our hearts into it, and I couldn't be more proud of what we created.`,
      `Building something from scratch with a team you believe in is unmatched. Excited to finally show what we've been working on!`
    ]

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `Write exactly 2 short sentences (max 35 words total) expressing a student's authentic excitement about sharing their hackathon project "${projectTitle}" in ${technology} for domain "${projectArea}". Be personal, genuine, and emotional — like the student is talking to their LinkedIn network. Don't use hashtags or emojis. Don't mention the project title again (it appears elsewhere). Don't say "excited" as the first word. Make it unique and heartfelt. Output ONLY the 2 sentences, no preamble.`
            }]
          })
        })
        const data = await res.json()
        const text = data?.content?.[0]?.text?.trim()
        if (text && text.length > 20 && text.length < 400) {
          return Response.json({ intro: text, source: 'ai' })
        }
      } catch (e) {
        console.error('Claude API failed:', e)
      }
    }

    const intro = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    return Response.json({ intro, source: 'fallback' })
  } catch (err) {
    return Response.json({ intro: `Sharing something our team has been passionately working on. Every challenge we faced made this journey richer!`, source: 'error' })
  }
}