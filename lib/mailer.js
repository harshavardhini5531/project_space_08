import nodemailer from 'nodemailer'

// ━━━ Primary: Outlook / Office 365 ━━━
const outlookTransporter = process.env.OUTLOOK_USER ? nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
}) : null

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

// Track daily-limit-disabled senders (resets after 24h)
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

// Build the sender chain based on availability
function getSenderChain() {
  const chain = []
  if (outlookTransporter && isAvailable('outlook')) {
    chain.push({ key: 'outlook', transporter: outlookTransporter, user: process.env.OUTLOOK_USER, name: 'Outlook' })
  }
  if (gmail1Transporter && isAvailable('gmail1')) {
    chain.push({ key: 'gmail1', transporter: gmail1Transporter, user: process.env.GMAIL_USER, name: 'Gmail#1' })
  }
  if (gmail2Transporter && isAvailable('gmail2')) {
    chain.push({ key: 'gmail2', transporter: gmail2Transporter, user: process.env.GMAIL_USER2, name: 'Gmail#2' })
  }
  return chain
}

export async function sendMail(mailOptions) {
  const chain = getSenderChain()

  if (chain.length === 0) {
    throw new Error('All email senders exhausted (daily limits hit). Try again tomorrow.')
  }

  let lastError = null

  for (const sender of chain) {
    try {
      // Update from header to match current sender
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

      // Detect daily-limit errors → disable this sender for 24h
      if (msg.includes('daily') || msg.includes('quota') || msg.includes('limit exceeded') || err.responseCode === 550) {
        markDisabled(sender.key)
        console.log(`🔄 ${sender.name} hit daily limit. Disabled for 24h.`)
      }
      // Continue to next sender in chain
    }
  }

  // All senders failed
  throw lastError || new Error('All email senders failed')
}

export async function sendOTPEmail(toEmail, studentName, otpCode) {
  await sendMail({
    from: `"Project Space" <${process.env.OUTLOOK_USER || process.env.GMAIL_USER}>`,
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