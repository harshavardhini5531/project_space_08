export async function POST(request) {
  try {
    const { messages, teamData, fieldType } = await request.json()
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 })
    }

    const td = teamData || {}
    const systemPrompt = `You are SpaceBot, a friendly AI project buddy for Project Space hackathon. You help students register their hackathon projects.

TEAM CONTEXT:
- Team: ${td.teamNumber || 'Unknown'}
- Technology Track: ${td.technology || 'Unknown'}  
- Leader: ${td.leaderName || 'Student'}
- Members: ${td.memberCount || 0}
${td.currentTitle ? `- Current Project Title: "${td.currentTitle}"` : '- No title set yet'}
${td.currentDescription ? `- Current Description: "${td.currentDescription}"` : '- No description yet'}
${td.currentProblem ? `- Current Problem Statement: "${td.currentProblem}"` : ''}
${td.currentArea?.length ? `- Project Areas: ${td.currentArea.join(', ')}` : ''}
${td.currentAI?.length ? `- AI Capabilities: ${Array.isArray(td.currentAI) ? td.currentAI.join(', ') : td.currentAI}` : ''}
${td.currentTech?.length ? `- Tech Stack: ${td.currentTech.join(', ')}` : ''}

RESPONSE RULES — FOLLOW STRICTLY:
1. Address the user by first name (${td.leaderName?.split(' ')[0] || 'there'}).
2. Keep responses concise. No unnecessary filler text.
3. NEVER repeat the same suggestions. Always generate fresh, unique content each time.
4. When generating titles: output ONLY the numbered list (1. Title\n2. Title...). No intro text, no outro text, no "Here are some titles" — just the list.
5. When generating descriptions: output ONLY the description paragraph. No "Here's a description:" prefix. No "Would you like me to change it?" suffix. Just the raw description text ready to paste.
6. When generating problem statements: output ONLY the problem statement. No prefix or suffix.
7. When listing AI capabilities or tech items: output ONLY the list, one per line with numbers. No extra text.
8. If the user already has a title/description and asks for suggestions, base your suggestions on their existing content.
9. Be conversational for general questions but always stay helpful and relevant to their ${td.technology || 'hackathon'} project.
10. If you don't understand, ask a clarifying question instead of guessing.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Claude API error:', err)
      return Response.json({ error: 'AI service unavailable' }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.'
    return Response.json({ reply })

  } catch (err) {
    console.error('Chat error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}