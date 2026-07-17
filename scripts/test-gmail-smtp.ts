import nodemailer from "nodemailer"

const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

if (!user || !pass) {
  console.error("SMTP_USER and SMTP_PASS must be set in environment")
  process.exit(1)
}

const config = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
}

console.log("Config:", JSON.stringify({ host: config.host, port: config.port, secure: config.secure, user: config.auth.user }))
console.log("pass length:", pass.length)

const t = nodemailer.createTransport(config)

try {
  console.log("\n--- transporter.verify() ---")
  const v = await t.verify()
  console.log("verify() success:", v)
} catch (err) {
  console.log("verify() failure")
  console.log("Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
}

try {
  console.log("\n--- transporter.sendMail() ---")
  const info = await t.sendMail({
    from: `"Test" <${user}>`,
    to: user,
    subject: "Gmail SMTP standalone test",
    text: "If you receive this, Gmail SMTP with App Password works.",
  })
  console.log("sendMail() success:", JSON.stringify({ messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }))
} catch (err) {
  console.log("sendMail() failure")
  console.log("Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
}

t.close()
