import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_FROM: !!process.env.SMTP_FROM,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  })
}
