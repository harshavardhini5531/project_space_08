import { MongoClient } from 'mongodb'

const MONGO_URI = 'mongodb+srv://light:Thub1234@cluster0.jtlxsvq.mongodb.net/video_portal?retryWrites=true&w=majority'

let client = null
let db = null

async function getDB() {
  if (db) return db
  client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db('video_portal')
  return db
}

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()
    if (!rollNumber) {
      return Response.json({ error: 'Roll number required' }, { status: 400 })
    }

    const database = await getDB()
    const student = await database.collection('students').findOne({ roll_no: rollNumber })

    if (!student) {
      return Response.json({ error: 'Video record not found', ratings: null })
    }

    // Extract scores from each AI + mentor
    const ratings = {
      gemini: {
        overall: student.ai_score || student.ai_full_report?.overall_score || null,
        level: student.ai_level || student.ai_full_report?.level || null,
        readiness: student.ai_readiness || student.ai_full_report?.interview_readiness || null,
        communication: student.ai_communication || student.ai_full_report?.communication?.score || null,
        confidence: student.ai_confidence || student.ai_full_report?.confidence?.score || null,
        eye_contact: student.ai_eye_contact || student.ai_full_report?.eye_contact?.score || null,
        content: student.ai_content || student.ai_full_report?.content?.score || null,
        analyzed: student.ai_analyzed || false,
      },
      chatgpt: {
        overall: student.openai_report?.overall_score || null,
        level: student.openai_report?.level || null,
        readiness: student.openai_report?.interview_readiness || null,
        communication: student.openai_report?.communication?.score || null,
        confidence: student.openai_report?.confidence?.score || null,
        eye_contact: student.openai_report?.eye_contact?.score || null,
        content: student.openai_report?.content?.score || null,
        analyzed: student.openai_generated || false,
      },
      claude: {
        overall: student.anthropic_report?.overall_score || null,
        level: student.anthropic_report?.level || null,
        readiness: student.anthropic_report?.interview_readiness || null,
        communication: student.anthropic_report?.communication?.score || null,
        confidence: student.anthropic_report?.confidence?.score || null,
        eye_contact: student.anthropic_report?.eye_contact?.score || null,
        content: student.anthropic_report?.content?.score || null,
        analyzed: student.anthropic_generated || false,
      },
      mentor: {
        overall: student.mentor_score || null,
        level: student.mentor_level || null,
        analyzed: student.mentor_analyzed || false,
        suggestions: student.mentor_suggestions || null,
        positives: student.mentor_positives || [],
        improvements: student.mentor_improvements || [],
        analyzedBy: student.mentor_analyzed_by || null,
      },
      videoSubmitted: student.video_submitted || false,
      videoUrl: student.video_url || null,
    }

    return Response.json({ ratings })

  } catch (err) {
    console.error('Video ratings error:', err)
    return Response.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}