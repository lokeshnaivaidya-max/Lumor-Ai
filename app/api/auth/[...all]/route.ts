import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = betterHandler.GET

export async function POST(request: Request) {
  try {
    return await betterHandler.POST(request)
  } catch (e) {
    console.error("[AUTH API ERROR]", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    )
  }
}
