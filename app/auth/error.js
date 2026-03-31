'use client'

export default function Error({ error, reset }) {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050008', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#fff', padding: '20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'rgba(255,255,255,.8)' }}>Page Error</h2>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.35)', marginBottom: '24px', maxWidth: '280px' }}>Something went wrong loading this page.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { try { reset() } catch { window.location.reload() } }}
            style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg,#fd1c00,#faa000)', border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{ padding: '10px 24px', borderRadius: '8px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}