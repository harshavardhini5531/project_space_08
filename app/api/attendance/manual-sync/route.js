// app/api/attendance/manual-sync/route.js
// Admin-only: manually trigger student + mentor attendance syncs

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { type = 'both' } = body

    const projectRoot = process.cwd()
    const results = {}

    if (type === 'student' || type === 'both') {
      try {
        const start = Date.now()
        const { stdout, stderr } = await execAsync(
          `node ${path.join(projectRoot, 'scripts/attendance-sync.js')}`,
          { timeout: 60000, maxBuffer: 1024 * 1024 * 5 }
        )
        const output = stdout + stderr
        const insertedMatch = output.match(/inserted=(\d+)/)
        const apiMatch = output.match(/api=(\d+)/)
        const filteredMatch = output.match(/filtered=(\d+)/)
        results.student = {
          success: true,
          duration_ms: Date.now() - start,
          inserted: insertedMatch ? parseInt(insertedMatch[1]) : 0,
          api_total: apiMatch ? parseInt(apiMatch[1]) : 0,
          filtered: filteredMatch ? parseInt(filteredMatch[1]) : 0,
        }
      } catch (e) {
        results.student = { success: false, error: e.message }
      }
    }

    if (type === 'mentor' || type === 'both') {
      try {
        const start = Date.now()
        const { stdout, stderr } = await execAsync(
          `node ${path.join(projectRoot, 'scripts/mentor-attendance-sync.js')}`,
          { timeout: 60000, maxBuffer: 1024 * 1024 * 5 }
        )
        const output = stdout + stderr
        const insertedMatch = output.match(/Inserted:\s*(\d+)/)
        const skippedMatch = output.match(/Skipped:\s*(\d+)/)
        const mentorMatch = output.match(/Mentors:\s*(\d+)/)
        const studentMatch = output.match(/Students:\s*(\d+)/)
        results.mentor = {
          success: true,
          duration_ms: Date.now() - start,
          inserted: insertedMatch ? parseInt(insertedMatch[1]) : 0,
          skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
          mentor_count: mentorMatch ? parseInt(mentorMatch[1]) : 0,
          student_count: studentMatch ? parseInt(studentMatch[1]) : 0,
        }
      } catch (e) {
        results.mentor = { success: false, error: e.message }
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}