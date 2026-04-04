// app/dashboard/layout.js
// This layout wraps ALL pages under /dashboard/
// During registration phase, only /dashboard/register-team is accessible
// All other dashboard pages redirect to landing page

import PhaseGate from '@/components/PhaseGate'

export default function DashboardLayout({ children }) {
  return <PhaseGate>{children}</PhaseGate>
}