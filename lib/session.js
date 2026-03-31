// lib/session.js — Secure session management for Project Space
// Handles token expiry, auto-logout, and session validation

const SESSION_KEY = 'ps_user'
const SESSION_EXPIRY_KEY = 'ps_session_expiry'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Save user session with expiry
export function setSession(userData) {
  const expiry = Date.now() + SESSION_DURATION
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
    localStorage.setItem(SESSION_EXPIRY_KEY, expiry.toString())
  }
}

// Get session if valid, null if expired
export function getSession() {
  if (typeof window === 'undefined') return null
  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY)
    if (expiry && Date.now() > parseInt(expiry)) {
      clearSession()
      return null
    }
    const data = localStorage.getItem(SESSION_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    clearSession()
    return null
  }
}

// Clear session (logout)
export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_EXPIRY_KEY)
  }
}

// Refresh session expiry (call on user activity)
export function refreshSession() {
  if (typeof window === 'undefined') return
  const data = localStorage.getItem(SESSION_KEY)
  if (data) {
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString())
  }
}

// Check if session exists and is valid
export function isAuthenticated() {
  return getSession() !== null
}

// Get user role from session
export function getUserRole() {
  const session = getSession()
  return session?.role || null
}