// app/api/linkedin-intro/route.js
// Generates unique title, intro, and event highlights using Claude API

export async function POST(request) {
  try {
    const body = await request.json()
    const { projectTitle, technology, projectArea, studentName, isMentor } = body

    const fallbackIntros = [
      `Gearing up for an incredible week ahead — where ideas transform into real projects, and teamwork meets innovation. Can't wait to dive in!`,
      `The countdown has begun! About to kick off something truly special with my team, and I couldn't be more excited for what lies ahead.`,
      `Getting ready for a week of intense learning, building, and late-night coding sessions. This is the moment we've been preparing for!`,
      `Days away from diving into one of the most thrilling experiences of my college journey. The energy is already unreal.`,
      `On the brink of something extraordinary — a whole week dedicated to solving real problems with technology, creativity, and teamwork. Ready!`,
      `Excitement is building as we prepare to bring our idea to life! This is going to be a journey of learning, breakthroughs, and growth.`,
      `About to embark on a thrilling week where innovation meets execution. So glad to be doing this with a team I truly believe in.`,
      `Feeling lucky and pumped to be part of something this ambitious. The stage is set, the team is ready, and the adventure is about to begin!`
    ]

    const fallbackTitles = [
      `🚀 One Week Away From Building Something That Matters`,
      `✨ The Countdown Begins — Ready to Build, Break, and Innovate`,
      `💡 Where Ideas Meet Execution — My Project Space Journey Begins`,
      `🔥 Gearing Up for a Week That Will Define My Student Journey`,
      `🌟 Seven Days of Innovation, Caffeine, and Breakthroughs`,
      `⚡ Ready to Turn Ideas into Impact at Project Space`
    ]

    const fallbackHighlights = [
      `${toBoldHelper('Project Space')} is set to bring together 900+ students across 160 teams, exploring 7 cutting-edge technology stacks with an AI-first theme. For 7 days straight, teams will be working 24/7 on real-world projects — fueled by dedicated mentor support, hands-on learning, and the vibrant energy of Project Street. Excited to be part of something this big and can't wait for the journey to begin!`,
      `What makes ${toBoldHelper('Project Space')} truly special? 900+ passionate students forming 160 teams, tackling challenges across 7 powerful technology tracks under an AI-driven theme. Around the clock for an entire week, we'll be building, iterating, and learning — with industry-grade mentorship at every step and the pulse of Project Street keeping us inspired. Honored to be in the mix!`,
      `Imagine 900+ students, 160 teams, 7 technology domains, all converging for a full week of non-stop building. That's ${toBoldHelper('Project Space')} — powered by an AI-first vision, supported by incredible mentors, and energized by the community at Project Street. Privileged to be part of this massive learning experience!`,
      `${toBoldHelper('Project Space')} is more than a hackathon — it's 900+ students, 160 teams, and 7 cutting-edge tech tracks coming alive for 7 days straight. With AI at the heart of every project, mentors guiding us through every challenge, and Project Street buzzing with innovation, this is where students become builders. Can't wait!`
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
            max_tokens: 800,
            messages: [{
              role: 'user',
             content: isMentor
                ? `You are writing content for a MENTOR's LinkedIn post about an UPCOMING event called "Project Space" (May 6-12, 2026) at Aditya University, powered by Technical Hub. The mentor is proudly introducing one of the teams they have guided for the past year. Write from a proud, experienced mentor perspective. Do NOT use the word "hackathon" anywhere.
PROJECT CONTEXT:
- Project Title: ${projectTitle || 'Their Project'}
- Technology Track: ${technology || 'Tech'}
- Domain: ${projectArea || 'General'}
Generate THREE things in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{
  "title": "A catchy 1-line post title from mentor perspective (max 10 words, can use 1 emoji, NO bold formatting)",
  "intro": "2 short sentences (max 35 words) from a MENTOR perspective — proud of guiding students, watching them grow into builders. Forward-looking. No hashtags or emojis.",
  "highlights": "A single paragraph (60-80 words) about Project Space from mentor perspective: 900+ students, 160 teams, 7 technology tracks, AI-first theme, 24/7 work, 7 days, proud to be a mentor, Project Street energy. Express pride in this initiative."
}
Make all 3 unique. Do NOT repeat words across fields. Output ONLY the JSON.`
                : `You are writing content for a student's LinkedIn post about an UPCOMING event called "Project Space" (May 6-12, 2026) at Aditya University, powered by Technical Hub.
PROJECT CONTEXT:
- Project Title: ${projectTitle || 'Their Project'}
- Technology Track: ${technology || 'Tech'}
- Domain: ${projectArea || 'General'}
Generate THREE things in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{
  "title": "A catchy 1-line post title (max 10 words, can use 1 emoji, NO bold formatting)",
  "intro": "2 short sentences (max 35 words total) expressing excitement for the UPCOMING event. Forward-looking tone. No hashtags or emojis.",
  "highlights": "A single paragraph (60-80 words) about Project Space event highlights: mentions 900+ students, 160 teams, 7 technology tracks, AI-first theme, 24/7 work, 7 days, mentor support, Project Street energy. Make it fresh and different from generic descriptions. Express excitement to be part of it."
}
Make all 3 unique and personal to this project. Do NOT repeat words across the three fields. Output ONLY the JSON.`
            }]
          })
        })
        const data = await res.json()
        const text = data?.content?.[0]?.text?.trim()
        if (text) {
          try {
            const cleaned = text.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            if (parsed.intro && parsed.title && parsed.highlights) {
              return Response.json({
                title: parsed.title,
                intro: parsed.intro,
                highlights: parsed.highlights,
                source: 'ai'
              })
            }
          } catch (parseErr) {
            console.error('JSON parse failed:', parseErr, text)
          }
        }
      } catch (e) {
        console.error('Claude API failed:', e)
      }
    }

    // Fallback
    const title = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)]
    const intro = fallbackIntros[Math.floor(Math.random() * fallbackIntros.length)]
    const highlights = fallbackHighlights[Math.floor(Math.random() * fallbackHighlights.length)]
    return Response.json({ title, intro, highlights, source: 'fallback' })
  } catch (err) {
    return Response.json({
      title: '🚀 Ready for Project Space',
      intro: 'Getting ready for an amazing week ahead!',
      highlights: 'Project Space brings 900+ students together for 7 days of AI-powered innovation.',
      source: 'error'
    })
  }
}

function toBoldHelper(text) {
  const boldMap = {
    'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
    'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇'
  }
  return text.split('').map(c => boldMap[c] || c).join('')
}