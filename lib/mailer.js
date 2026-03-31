import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

export async function sendOTPEmail(toEmail, studentName, otpCode) {
  await transporter.sendMail({
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