// app/linkedin-posting/page.js
'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function LinkedInPostingInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('Preparing your post...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const data = searchParams.get('data')
    if (!data) { setError('Missing data'); return }

    try {
      const decoded = JSON.parse(atob(data.replace(/-/g, '+').replace(/_/g, '/')))
      const { access_token, user_urn, name, teamNumber, postText } = decoded

      ;(async () => {
        setStatus(`Welcome ${name}! Generating team card...`)

        let imageBase64 = null
        try {
          const cardRes = await fetch(`/api/linkedin-card?team=${teamNumber}`)
          if (cardRes.ok) {
            const blob = await cardRes.blob()
            imageBase64 = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.readAsDataURL(blob)
            })
          }
        } catch (e) { console.error('Card gen failed:', e) }

        setStatus('Posting to LinkedIn...')

        const postRes = await fetch('/api/auth/linkedin/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: access_token,
            userUrn: user_urn,
            text: postText,
            imageBase64
          })
        })

        const postData = await postRes.json()
        if (!postRes.ok) { setError(postData.error || 'Failed'); return }

        setStatus('✅ Posted to LinkedIn successfully!')
        setTimeout(() => { router.push('/dashboard') }, 3000)
      })()
    } catch (e) {
      console.error(e)
      setError('Invalid data')
    }
  }, [searchParams, router])

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'#fff',fontFamily:'DM Sans, sans-serif'}}>
      <div style={{textAlign:'center',maxWidth:480,padding:40}}>
        <div style={{width:60,height:60,borderRadius:16,background:'linear-gradient(135deg,#0077b5,#00a0dc)',margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </div>
        {error ? (
          <>
            <h2 style={{color:'#ff6040',marginBottom:12}}>Something went wrong</h2>
            <p style={{color:'rgba(255,255,255,.6)',marginBottom:24}}>{error}</p>
            <button onClick={()=>router.push('/dashboard')} style={{padding:'12px 28px',borderRadius:10,background:'rgba(253,28,0,.1)',border:'1px solid rgba(253,28,0,.25)',color:'#fd1c00',fontFamily:'inherit',fontWeight:600,cursor:'pointer'}}>Return to Dashboard</button>
          </>
        ) : (
          <>
            <div style={{width:40,height:40,border:'3px solid rgba(255,255,255,.1)',borderTopColor:'#0077b5',borderRadius:'50%',margin:'0 auto 20px',animation:'spin 1s linear infinite'}}/>
            <h2 style={{marginBottom:12}}>Posting to LinkedIn</h2>
            <p style={{color:'rgba(255,255,255,.6)'}}>{status}</p>
          </>
        )}
      </div>
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function LinkedInPostingPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'#fff'}}>
        <div>Loading...</div>
      </div>
    }>
      <LinkedInPostingInner />
    </Suspense>
  )
}