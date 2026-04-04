// components/PhaseGate.js
'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isPathAllowed, getBlockedRedirect } from '@/lib/phase'

export default function PhaseGate({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isPathAllowed(pathname)) {
      router.replace(getBlockedRedirect())
    }
  }, [pathname])

  if (!isPathAllowed(pathname)) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050008',
        color: 'rgba(255,255,255,.4)',
        fontFamily: 'sans-serif',
        fontSize: '14px'
      }}>
        Redirecting...
      </div>
    )
  }

  return children
}