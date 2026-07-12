import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = betterHandler.GET

export async function POST(request: Request) {
  const url = new URL(request.url)
  console.log(`[AUTH] POST ${url.pathname}${url.search}`)
  const body = await request.clone().json().catch(() => ({}))
  console.log(`[AUTH] body keys: ${Object.keys(body).join(", ")}`)
  try {
    return await betterHandler.POST(request)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    const stack = e instanceof Error ? e.stack : ""
    console.error("[AUTH API ERROR]", msg)
    console.error("[AUTH API STACK]", stack)
    if (e && typeof e === "object") {
      try { console.error("[AUTH API DETAIL]", JSON.stringify(e, Object.getOwnPropertyNames(e))) } catch {}
    }
    return Response.json({ error: msg, message: msg }, { status: 500 })
  }
}
