import { NextRequest, NextResponse } from "next/server"
import { getUserId } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || "image/jpeg"
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({ url: dataUrl, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 })
  }
}
