// lib/rate-limit.js — Simple in-memory rate limiter for API routes
// Prevents OTP spam, brute-force login attempts

const rateLimitMap = new Map()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Check rate limit for a given key
 * @param {string} key - Unique identifier (IP, roll number, etc.)
 * @param {number} maxAttempts - Max requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const data = rateLimitMap.get(key)

  if (!data || now > data.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 }
  }

  if (data.count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: data.resetAt - now }
  }

  data.count++
  return { allowed: true, remaining: maxAttempts - data.count, retryAfterMs: 0 }
}

/**
 * Rate limit middleware helper for API routes
 * Returns a Response if rate limited, null if allowed
 */
export function rateLimitResponse(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const { allowed, retryAfterMs } = checkRateLimit(key, maxAttempts, windowMs)
  if (!allowed) {
    const retryMinutes = Math.ceil(retryAfterMs / 60000)
    return Response.json(
      { error: `Too many attempts. Please try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': Math.ceil(retryAfterMs / 1000).toString() } }
    )
  }
  return null
}