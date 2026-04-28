// app/showcase/[teamNumber]/page.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Dynamic metadata for LinkedIn / social media previews
export async function generateMetadata({ params }) {
  const { teamNumber } = await params

  // Normalize team number: accept "158", "PS-158", or "PS-022" — DB stores as "PS-XXX" zero-padded
  const normalizedTeamNumber = String(teamNumber).toUpperCase().startsWith('PS-')
    ? String(teamNumber).toUpperCase().replace(/^PS-(\d+)$/, (_, n) => 'PS-' + n.padStart(3, '0'))
    : 'PS-' + String(teamNumber).padStart(3, '0')

  const { data: team } = await supabase.from('teams').select('*').eq('team_number', normalizedTeamNumber).single()
  const { data: reg } = team ? await supabase.from('team_registrations').select('*').eq('serial_number', team.serial_number).single() : { data: null }
  
  const title = reg?.project_title || team?.project_title || 'Project Space'
  const description = (reg?.project_description || team?.description || `${team?.technology || 'Technology'} project by Team ${teamNumber} at Project Space, Aditya University`).substring(0, 200)
  const imageUrl = `https://projectspace.technicalhub.io/api/linkedin-card?team=${teamNumber}`
  const pageUrl = `https://projectspace.technicalhub.io/showcase/${teamNumber}`

  return {
    metadataBase: new URL('https://projectspace.technicalhub.io'),
    title: `${title} · ${teamNumber} · Project Space`,
    description,
    openGraph: {
      title: `${title} · ${teamNumber}`,
      description,
      url: pageUrl,
      siteName: 'Project Space',
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - Team ${teamNumber}`,
          type: 'image/png',
        }
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${teamNumber}`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    other: {
      'og:image': imageUrl,
      'og:image:url': imageUrl,
      'og:image:secure_url': imageUrl,
      'og:image:type': 'image/png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': `${title} - Team ${teamNumber}`,
      'article:author': 'Project Space',
      'article:section': 'Hackathon',
    }
  }
}

export default async function ShowcasePage({ params }) {
  const { teamNumber } = await params

  // Normalize team number: accept "158", "PS-158", or "PS-022" — DB stores as "PS-XXX" zero-padded
  const normalizedTeamNumber = String(teamNumber).toUpperCase().startsWith('PS-')
    ? String(teamNumber).toUpperCase().replace(/^PS-(\d+)$/, (_, n) => 'PS-' + n.padStart(3, '0'))
    : 'PS-' + String(teamNumber).padStart(3, '0')

  const { data: team } = await supabase.from('teams').select('*').eq('team_number', normalizedTeamNumber).single()
  if (!team) {
    return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050008',color:'#fff',fontFamily:'DM Sans, sans-serif'}}>Team not found</div>
  }

  const { data: reg } = await supabase.from('team_registrations').select('*').eq('serial_number', team.serial_number).single()
  const { data: members } = await supabase.from('team_members').select('roll_number, short_name, is_leader').eq('serial_number', team.serial_number).order('is_leader', { ascending: false }).order('roll_number', { ascending: true })
  
  const rollNumbers = (members || []).map(m => m.roll_number)
  const { data: students } = await supabase.from('students').select('roll_number, name, image_url').in('roll_number', rollNumbers)
  const studentMap = {}
  ;(students || []).forEach(s => { studentMap[s.roll_number] = s })

  let mentor = null
  if (team.mentor_assigned) {
    const { data } = await supabase.from('mentors').select('name, image_url, emp_id').eq('name', team.mentor_assigned).single()
    mentor = data
  }

  const title = reg?.project_title || team.project_title || 'Untitled Project'
  const description = reg?.project_description || team.description || ''
  const techStack = reg?.tech_stack || []
  const projectArea = reg?.project_area || []
  const memberCount = members?.length || 0

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #050008; color: #fff; font-family: 'DM Sans', sans-serif; }
        .sc-wrap { min-height: 100vh; background: linear-gradient(135deg, #050008 0%, #13101a 50%, #050008 100%); padding: 40px 20px; }
        .sc-container { max-width: 1100px; margin: 0 auto; }
        .sc-brand { display:flex; align-items:center; gap:12px; margin-bottom:40px; font-size:0.8rem; color:rgba(255,255,255,.6); letter-spacing:2px; text-transform:uppercase; font-weight:700; }
        .sc-brand-dot { width:8px; height:8px; border-radius:50%; background:#fd1c00; }
        .sc-card { background: linear-gradient(135deg, rgba(253,28,0,0.08) 0%, rgba(238,167,39,0.04) 100%); border: 1px solid rgba(255,255,255,.08); border-radius: 24px; padding: 48px; backdrop-filter: blur(10px); }
        .sc-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:24px; margin-bottom: 32px; }
        .sc-meta { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
        .sc-badge { padding:8px 18px; border-radius:10px; background:linear-gradient(135deg,rgba(253,28,0,.2),rgba(238,167,39,.15)); border:1px solid rgba(253,28,0,.4); font-weight:800; letter-spacing:2px; font-size:0.75rem; }
        .sc-tech { padding:8px 18px; border-radius:10px; background:white; color:#fd1c00; font-weight:800; letter-spacing:1.5px; font-size:0.72rem; text-transform:uppercase; }
        .sc-title { font-size:3rem; font-weight:900; letter-spacing:2px; margin:0 0 16px; color:#fff; line-height:1.1; text-transform:uppercase; font-family:'Astro','Arial Black',sans-serif; word-wrap:break-word; }
        .sc-subtitle { color:rgba(255,255,255,.55); font-size:0.95rem; margin-bottom: 8px; }
        .sc-mentor { display:flex; flex-direction:column; align-items:center; gap:10px; min-width: 130px; }
        .sc-mentor-photo { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,#1a1a1a,#2d2d2d); overflow:hidden; position:relative; box-shadow:0 0 14px rgba(238,167,39,.6),0 0 24px rgba(168,85,247,.4); border:2px solid rgba(238,167,39,.5); }
        .sc-mentor-photo img { width:100%; height:100%; object-fit:cover; }
        .sc-mentor-photo-fb { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:900; color:#EEA727; }
        .sc-mentor-label { font-size:0.55rem; color:rgba(255,255,255,.4); letter-spacing:2px; text-transform:uppercase; font-weight:700; }
        .sc-mentor-name { font-family:'Astro',sans-serif; font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; text-align:center; max-width:140px; }
        .sc-description { color:rgba(255,255,255,.75); font-size:1rem; line-height:1.7; margin:32px 0; padding:20px 24px; background:rgba(255,255,255,.03); border-left:3px solid #EEA727; border-radius:8px; }
        .sc-section { margin: 28px 0; }
        .sc-section-title { font-size:0.72rem; color:#EEA727; letter-spacing:2px; text-transform:uppercase; font-weight:800; margin-bottom:14px; }
        .sc-chips { display:flex; flex-wrap:wrap; gap:8px; }
        .sc-chip { padding:8px 16px; border-radius:100px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); font-size:0.82rem; color:rgba(255,255,255,.85); }
        .sc-members { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:14px; margin-top: 24px; }
        .sc-member { position:relative; aspect-ratio: 3/4; background:#10233d; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.08); }
        .sc-member img { width:100%; height:100%; object-fit:cover; }
        .sc-member-fb { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:3rem; color:rgba(255,255,255,.3); font-weight:900; }
        .sc-member-overlay { position:absolute; bottom:0; left:0; right:0; padding:16px 10px 10px; background:linear-gradient(to top,rgba(0,0,0,.95) 0%,rgba(0,0,0,0) 100%); }
        .sc-member-name { font-family:'Astro',sans-serif; font-size:0.68rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#fff; text-align:center; }
        .sc-member-roll { font-size:0.58rem; color:rgba(255,255,255,.7); text-align:right; font-weight:700; letter-spacing:1px; margin-top:4px; }
        .sc-leader-star { position:absolute; top:8px; left:8px; width:24px; height:24px; background:linear-gradient(135deg,#EEA727,#fd1c00); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(253,28,0,.5); }
        .sc-footer { margin-top:48px; padding-top:28px; border-top:1px solid rgba(255,255,255,.06); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; }
        .sc-footer-brand { font-size:0.85rem; font-weight:700; letter-spacing:2px; color:rgba(255,255,255,.5); }
        .sc-footer-event { font-size:0.72rem; color:rgba(255,255,255,.3); }
        .sc-cta { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:10px; background:linear-gradient(135deg,#fd1c00,#EEA727); color:#fff; font-weight:700; font-size:0.8rem; text-decoration:none; letter-spacing:.5px; }
        @media (max-width:600px){ .sc-title{font-size:2rem;} .sc-card{padding:24px;} .sc-wrap{padding:20px 12px;} .sc-header{flex-direction:column-reverse;} .sc-mentor{flex-direction:row; align-self:flex-start;} }
      `}</style>
      <div className="sc-wrap">
        <div className="sc-container">
          <div className="sc-brand">
            <div className="sc-brand-dot"/>
            Project Space · Aditya University · Technical Hub
          </div>

          <div className="sc-card">
            <div className="sc-header">
              <div style={{flex:1}}>
                <div className="sc-meta">
                  <span className="sc-badge">{teamNumber}</span>
                  <span className="sc-tech">{team.technology}</span>
                </div>
                <h1 className="sc-title">{title}</h1>
                <div className="sc-subtitle">{memberCount} Team Members · {team.batch || 'Drive Ready'}</div>
              </div>

              {mentor && (
                <div className="sc-mentor">
                  <div className="sc-mentor-photo">
                    {mentor.image_url ? <img src={mentor.image_url} alt={mentor.name}/> : <div className="sc-mentor-photo-fb">{(mentor.name||'?').charAt(0)}</div>}
                  </div>
                  <div className="sc-mentor-label">Mentored by</div>
                  <div className="sc-mentor-name">{mentor.name}</div>
                </div>
              )}
            </div>

            {description && (
              <div className="sc-description">{description}</div>
            )}

            {projectArea.length > 0 && (
              <div className="sc-section">
                <div className="sc-section-title">Project Area</div>
                <div className="sc-chips">
                  {projectArea.map((a,i) => <div key={i} className="sc-chip">{a}</div>)}
                </div>
              </div>
            )}

            {techStack.length > 0 && (
              <div className="sc-section">
                <div className="sc-section-title">Tech Stack</div>
                <div className="sc-chips">
                  {techStack.map((t,i) => <div key={i} className="sc-chip">{t}</div>)}
                </div>
              </div>
            )}

            {memberCount > 0 && (
              <div className="sc-section">
                <div className="sc-section-title">Team Members</div>
                <div className="sc-members">
                  {members.map((m,i) => {
                    const s = studentMap[m.roll_number] || {}
                    const name = (s.name || m.short_name || m.roll_number).split(' ').slice(0,2).join(' ')
                    return (
                      <div key={m.roll_number||i} className="sc-member">
                        {m.is_leader && (
                          <div className="sc-leader-star">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          </div>
                        )}
                        {s.image_url ? <img src={s.image_url} alt={name}/> : <div className="sc-member-fb">{name.charAt(0).toUpperCase()}</div>}
                        <div className="sc-member-overlay">
                          <div className="sc-member-name">{name}</div>
                          <div className="sc-member-roll">{m.roll_number}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="sc-footer">
              <div>
                <div className="sc-footer-brand">PROJECT SPACE</div>
                <div className="sc-footer-event">Aditya University · Technical Hub · May 6–12, 2026</div>
              </div>
              <a href="https://projectspace.technicalhub.io" className="sc-cta">Visit Project Space →</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}