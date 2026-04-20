'use client'
import { globalStyles, colors, fonts } from '@/lib/theme'

export default function PrivacyPolicy() {
  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        body { background: #050008; color: #fff; font-family: 'DM Sans', sans-serif; }
        .pp-wrap { max-width: 900px; margin: 0 auto; padding: 60px 40px; line-height: 1.7; }
        .pp-title { font-family: 'Astro', sans-serif; font-size: 2.5rem; margin-bottom: 8px; color: #fd1c00; letter-spacing: 2px; }
        .pp-subtitle { color: rgba(255,255,255,.5); font-size: 0.9rem; margin-bottom: 40px; }
        .pp-section { margin-bottom: 32px; }
        .pp-section h2 { font-size: 1.2rem; color: #EEA727; margin-bottom: 12px; font-weight: 700; }
        .pp-section p { color: rgba(255,255,255,.75); font-size: 0.9rem; margin-bottom: 10px; }
        .pp-section ul { padding-left: 24px; color: rgba(255,255,255,.7); font-size: 0.9rem; }
        .pp-section ul li { margin-bottom: 6px; }
        .pp-contact { margin-top: 40px; padding: 20px; border: 1px solid rgba(253,28,0,.2); border-radius: 12px; background: rgba(253,28,0,.04); }
        @media (max-width: 600px) { .pp-wrap { padding: 30px 20px; } .pp-title { font-size: 1.8rem; } }
      `}</style>
      <div className="pp-wrap">
        <h1 className="pp-title">Privacy Policy</h1>
        <div className="pp-subtitle">Last updated: April 20, 2026 · Project Space · Aditya University</div>

        <div className="pp-section">
          <h2>1. Introduction</h2>
          <p>Project Space ("we", "our", "us") is a hackathon event management platform operated by Technical Hub at Aditya University. This Privacy Policy explains how we collect, use, and protect your information when you use our platform at projectspace.technicalhub.io.</p>
        </div>

        <div className="pp-section">
          <h2>2. Information We Collect</h2>
          <p>We collect the following information:</p>
          <ul>
            <li>Roll number, name, email, and college affiliation provided during registration</li>
            <li>Team information including project details and tech stack</li>
            <li>Communication preferences and notification settings</li>
            <li>LinkedIn profile data if you choose to connect your LinkedIn account for posting</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Manage your participation in Project Space hackathon events</li>
            <li>Enable team registration, mentor coordination, and milestone tracking</li>
            <li>Send event-related notifications and updates</li>
            <li>Enable LinkedIn post sharing if you authorize it</li>
            <li>Improve our platform and event experience</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>4. LinkedIn Integration</h2>
          <p>When you authorize our app to post on LinkedIn on your behalf, we only use this permission to publish content you have explicitly approved. We do not access your LinkedIn connections, messages, or private data. You can revoke this access at any time from your LinkedIn account settings.</p>
        </div>

        <div className="pp-section">
          <h2>5. Data Security</h2>
          <p>We implement industry-standard security measures to protect your information, including encrypted storage, secure authentication, and access controls. Your data is stored on secure servers managed by Aditya University.</p>
        </div>

        <div className="pp-section">
          <h2>6. Data Sharing</h2>
          <p>We do not sell or share your personal information with third parties, except:</p>
          <ul>
            <li>With your assigned mentors and event organizers for coordination</li>
            <li>With LinkedIn when you use the sharing feature</li>
            <li>When required by law or university policy</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request corrections to your information</li>
            <li>Delete your account and associated data</li>
            <li>Revoke LinkedIn access at any time</li>
            <li>Contact us with privacy concerns</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any significant changes will be notified to users through the platform.</p>
        </div>

        <div className="pp-contact">
          <h2 style={{color:'#fd1c00',marginBottom:8}}>Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your data, please contact:</p>
          <p style={{marginTop:8}}>
            <strong>Email:</strong> thubprojectspace@gmail.com<br/>
            <strong>Organization:</strong> Technical Hub, Aditya University<br/>
            <strong>Location:</strong> Surampalem, Andhra Pradesh, India
          </p>
        </div>
      </div>
    </>
  )
}