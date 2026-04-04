// lib/phase.js
// Controls what features are accessible based on current event phase
// Set NEXT_PUBLIC_PHASE in .env.local: 'registration' | 'event' | 'post'

export const PHASE = process.env.NEXT_PUBLIC_PHASE || 'registration'

// What's allowed in each phase
const PHASE_CONFIG = {
  registration: {
    // Pages accessible during registration
    allowedPaths: [
      '/',                          // Landing page
      '/auth/register',             // Create account
      '/auth/login',                // Login
      '/auth/leader-login',         // Leader login
      '/auth/member-login',         // Member login
      '/dashboard/register-team',   // Register team (shows "already registered" if done)
    ],
    // After successful registration, redirect here
    postRegisterRedirect: '/',
    // If user tries to access blocked page, redirect here
    blockedRedirect: '/',
    // Show features
    showDashboard: false,
    showProfile: false,
    showMentorRequest: false,
    showFood: false,
    showProjectStatus: false,
  },
  event: {
    allowedPaths: null, // All paths allowed
    postRegisterRedirect: '/dashboard',
    blockedRedirect: '/dashboard',
    showDashboard: true,
    showProfile: true,
    showMentorRequest: true,
    showFood: true,
    showProjectStatus: true,
  },
  post: {
    allowedPaths: null, // All paths allowed but read-only
    postRegisterRedirect: '/dashboard',
    blockedRedirect: '/dashboard',
    showDashboard: true,
    showProfile: true,
    showMentorRequest: false,
    showFood: false,
    showProjectStatus: true,
  },
}

export function getPhaseConfig() {
  return PHASE_CONFIG[PHASE] || PHASE_CONFIG.registration
}

export function isPathAllowed(pathname) {
  const config = getPhaseConfig()
  // If allowedPaths is null, all paths are allowed
  if (!config.allowedPaths) return true
  // Check if the current path starts with any allowed path
  return config.allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function getPostRegisterRedirect() {
  return getPhaseConfig().postRegisterRedirect
}

export function getBlockedRedirect() {
  return getPhaseConfig().blockedRedirect
}

export function isFeatureEnabled(feature) {
  const config = getPhaseConfig()
  switch(feature) {
    case 'dashboard': return config.showDashboard
    case 'profile': return config.showProfile
    case 'mentorRequest': return config.showMentorRequest
    case 'food': return config.showFood
    case 'projectStatus': return config.showProjectStatus
    default: return false
  }
}