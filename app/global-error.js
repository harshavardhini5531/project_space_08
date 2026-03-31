'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, background: '#050008', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'rgba(255,255,255,.8)' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,.4)', marginBottom: '24px' }}>Please try again</p>
          <button
            onClick={() => { try { reset() } catch { window.location.href = '/' } }}
            style={{ padding: '12px 32px', borderRadius: '10px', background: 'linear-gradient(135deg,#fd1c00,#faa000)', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Try Again
          </button>
          <br />
          <button
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '12px', padding: '10px 24px', borderRadius: '8px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Go to Home
          </button>
        </div>
      </body>
    </html>
  )
}