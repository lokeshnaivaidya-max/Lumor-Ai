import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const betterHandler = toNextJsHandler(auth.handler)

export const GET = betterHandler.GET

export async function POST(request: Request) {
  const url = new URL(request.url)

  // Backend validation — prevent sign-up without legal consent
  if (url.pathname === "/api/auth/sign-up/email") {
    const body = await request.clone().json().catch(() => ({}))
    if (!body.agreedToLegal || !body.acceptedTerms || !body.acceptedPrivacyPolicy) {
      return Response.json(
        { error: "You must accept the Terms & Conditions and Privacy Policy.", message: "You must accept the Terms & Conditions and Privacy Policy." },
        { status: 400 },
      )
    }
    // Strip custom fields before forwarding to better-auth
    const { agreedToLegal: _, acceptedTerms: __, acceptedPrivacyPolicy: ___, acceptedLegalVersion: ____, ...clean } = body
    const cleanRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(clean),
    })
    try {
      return await betterHandler.POST(cleanRequest)
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
