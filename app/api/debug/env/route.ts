import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const smtpKeys = Object.keys(process.env).filter((key) => key.startsWith("SMTP"))

  return NextResponse.json({
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_FROM: !!process.env.SMTP_FROM,
    smtpKeysInProcessEnv: smtpKeys,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  })
}
