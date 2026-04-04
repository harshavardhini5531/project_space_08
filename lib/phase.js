// lib/phase.js
// Controls feature visibility based on deployment phase
// 
// USAGE:
//   - Your .env.local (development): Don't set NEXT_PUBLIC_PHASE → defaults to 'active' (see everything)
//   - Cloud Run / VPS: Set NEXT_PUBLIC_PHASE=registration → students see limited version
//   - When ready: Change to NEXT_PUBLIC_PHASE=active → everyone sees everything
//

const PHASE = process.env.NEXT_PUBLIC_PHASE || 'active'

export const phase = {
  current: PHASE,
  
  // Can students see the Login button?
  showLogin: PHASE === 'active',
  
  // Can team members create accounts?
  allowMemberAccounts: PHASE === 'active',
  
  // Should registration email include login link?
  showLoginInEmail: PHASE === 'active',
  
  // Can students access dashboard/profile?
  showDashboard: PHASE === 'active',
  
  // Is registration open for leaders?
  allowRegistration: true, // always true for now
}

export default phase