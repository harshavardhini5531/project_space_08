import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

const transporter2 = process.env.GMAIL_USER2 ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER2,
    pass: process.env.GMAIL_PASS2
  }
}) : null

// Track which sender hit limit (in-memory, resets on restart)
let primaryDisabled = false
let primaryDisabledAt = null

function isPrimaryAvailable() {
  if (!primaryDisabled) return true
  // Re-enable primary after 24 hours (Gmail limits reset daily)
  if (primaryDisabledAt && Date.now() - primaryDisabledAt > 24 * 60 * 60 * 1000) {
    primaryDisabled = false
    primaryDisabledAt = null
    return true
  }
  return false
}

export async function sendMail(mailOptions) {
  const usePrimary = isPrimaryAvailable()
  const firstTransporter = usePrimary ? transporter : (transporter2 || transporter)
  const firstSender = usePrimary ? process.env.GMAIL_USER : (process.env.GMAIL_USER2 || process.env.GMAIL_USER)
  const secondTransporter = usePrimary ? transporter2 : transporter
  const secondSender = usePrimary ? process.env.GMAIL_USER2 : process.env.GMAIL_USER

  // Set from header to match the actual sender
  if (mailOptions.from && firstSender) {
    mailOptions.from = mailOptions.from.replace(/<[^>]+>/, `<${firstSender}>`)
  }

  try {
    const result = await firstTransporter.sendMail(mailOptions)
    console.log(`✅ Sent via ${firstSender} to ${mailOptions.to}`)
    return result
  } catch (err) {
    console.error(`❌ ${firstSender} failed:`, err.responseCode || err.code, err.message?.substring(0, 100))

    // If daily limit hit, mark primary as disabled
    if (err.responseCode === 550 && (err.message || '').includes('Daily user sending limit exceeded')) {
      if (firstSender === process.env.GMAIL_USER) {
        primaryDisabled = true
        primaryDisabledAt = Date.now()
        console.log(`🔄 Primary sender ${firstSender} hit daily limit. Switching to backup.`)
      }
    }

    // Try second sender
    if (secondTransporter && secondSender) {
      try {
        if (mailOptions.from) {
          mailOptions.from = mailOptions.from.replace(/<[^>]+>/, `<${secondSender}>`)
        }
        const result = await secondTransporter.sendMail(mailOptions)
        console.log(`✅ Sent via ${secondSender} (fallback) to ${mailOptions.to}`)
        return result
      } catch (err2) {
        console.error(`❌ Fallback ${secondSender} also failed:`, err2.responseCode || err2.code, err2.message?.substring(0, 100))
        throw err2
      }
    }

    throw err
  }
}

export async function sendOTPEmail(toEmail, studentName, otpCode) {
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