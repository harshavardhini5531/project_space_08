import nodemailer from 'nodemailer'

// ━━━ Fallback 1: Gmail account 1 ━━━
const gmail1Transporter = process.env.GMAIL_USER ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
}) : null

// ━━━ Fallback 2: Gmail account 2 ━━━
const gmail2Transporter = process.env.GMAIL_USER2 ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER2,
    pass: process.env.GMAIL_PASS2
  }
}) : null

// Track daily-limit-disabled senders
const disabledSenders = new Map()

function isAvailable(key) {
  const disabledAt = disabledSenders.get(key)
  if (!disabledAt) return true
  if (Date.now() - disabledAt > 24 * 60 * 60 * 1000) {
    disabledSenders.delete(key)
    return true
  }
  return false
}

function markDisabled(key) {
  disabledSenders.set(key, Date.now())
}

// ━━━ Primary: Power Automate (sends via Outlook projectspace@technicalhub.io) ━━━
async function sendViaPowerAutomate({ to, name, otp }) {
  const url = process.env.POWER_AUTOMATE_URL
  if (!url) throw new Error('POWER_AUTOMATE_URL not configured')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, name, otp })
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Power Automate returned ${response.status}: ${errText.substring(0, 200)}`)
  }

  return { via: 'PowerAutomate', to }
}

export async function sendMail(mailOptions) {
  // Fallback sendMail for non-OTP emails — uses Gmail chain only
  const chain = []
  if (gmail1Transporter && isAvailable('gmail1')) {
    chain.push({ key: 'gmail1', transporter: gmail1Transporter, user: process.env.GMAIL_USER, name: 'Gmail#1' })
  }
  if (gmail2Transporter && isAvailable('gmail2')) {
    chain.push({ key: 'gmail2', transporter: gmail2Transporter, user: process.env.GMAIL_USER2, name: 'Gmail#2' })
  }

  if (chain.length === 0) {
    throw new Error('All email senders exhausted (daily limits hit).')
  }

  let lastError = null
  for (const sender of chain) {
    try {
      if (mailOptions.from) {
        mailOptions.from = mailOptions.from.replace(/<[^>]+>/, `<${sender.user}>`)
      }
      const result = await sender.transporter.sendMail(mailOptions)
      console.log(`✅ Sent via ${sender.name} (${sender.user}) to ${mailOptions.to}`)
      return result
    } catch (err) {
      lastError = err
      const msg = (err.message || '').toLowerCase()
      console.error(`❌ ${sender.name} failed:`, err.responseCode || err.code, (err.message || '').substring(0, 120))
      if (msg.includes('daily') || msg.includes('quota') || msg.includes('limit exceeded') || err.responseCode === 550) {
        markDisabled(sender.key)
        console.log(`🔄 ${sender.name} hit daily limit. Disabled for 24h.`)
      }
    }
  }

  throw lastError || new Error('All email senders failed')
}

export async function sendOTPEmail(toEmail, studentName, otpCode) {
  // Try Power Automate first (unlimited, via Outlook)
  if (process.env.POWER_AUTOMATE_URL) {
    try {
      await sendViaPowerAutomate({ to: toEmail, name: studentName, otp: otpCode })
      console.log(`✅ Sent via PowerAutomate (Outlook) to ${toEmail}`)
      return
    } catch (err) {
      console.error(`❌ PowerAutomate failed:`, err.message?.substring(0, 200))
      // Fall through to Gmail fallback
    }
  }

  // Fallback: Gmail chain
  await sendMail({
    from: `"Project Space" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Project Space Verification Code',
    html: `
      <div style="font-family:'DM Sans',sans-serif;background:#0a0a0a;padding:40px;border-radius:12px;max-width:480px;margin:auto">
        <h2 style="color:#ff3020;margin:0 0 4px;font-size:18px;letter-spacing:2px">PROJECT SPACE</h2>
        <p style="color:#666;margin:0 0 28px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Verification Code</p>
        <p style="color:#fff;font-size:15px;margin:0 0 6px">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#999;font-size:13px;margin:0 0 20px">Your one-time verification code is:</p>
        <div style="background:#1a1a1a;border:1px solid rgba(255,48,32,0.3);border-radius:10px;padding:28px;text-align:center;margin:0 0 20px">
          <span style="color:#ff3020;font-size:38px;font-weight:700;letter-spacing:14px">${otpCode}</span>
        </div>
        <p style="color:#555;font-size:11px;margin:0 0 6px">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="color:#333;font-size:10px;margin:0">If you did not request this, please ignore this email.</p>
      </div>
    `
  })
}