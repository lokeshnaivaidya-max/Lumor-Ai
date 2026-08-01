// Tests the full auth flow through the HTTP API (same endpoints the browser uses)
const BASE = "http://localhost:3000"
const email = `e2e-${Date.now()}@lumora.ai`
const password = "StrongPass123!"
const name = "E2E Test User"

let passed = 0, failed = 0
function check(step, ok, msg) {
  if (ok) { passed++; console.log(`  ✅ ${step}${msg ? " — " + msg : ""}`) }
  else { failed++; console.log(`  ❌ ${step}${msg ? " — " + msg : ""}`) }
}

// Helper — fetch with retry
async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

async function main() {
  // 0. Health check — retry until server is up
  console.log("⏳ Waiting for server...")
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(BASE, { signal: AbortSignal.timeout(2000) })
      break
    } catch {
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  console.log("   Server ready\n")

  // 1. Sign up
  console.log("📝 1. Sign Up")
  const r1 = await api("POST", "/api/auth/sign-up/email", { email, password, name })
  check("Create account", r1.ok, `status ${r1.status}, user: ${r1.data?.user?.id || "missing"}`)

  // 2. Send OTP
  console.log("\n📧 2. Send OTP")
  const r2 = await api("POST", "/api/auth/email-otp/send-verification", { email, type: "sign-in" })
  check("OTP sent", r2.ok, `status ${r2.status}`)

  // 3. Sign in
  console.log("\n🔑 3. Sign In")
  const r3 = await api("POST", "/api/auth/sign-in/email", { email, password })
  check("Sign in", r3.ok, `status ${r3.status}, token: ${r3.data?.token?.slice(0, 12) || "none"}...`)

  // 4. Session check
  console.log("\n🍪 4. Session Check")
  const r4 = await api("GET", "/api/auth/session")
  check("Session endpoint", r4.ok, `status ${r4.status}`)

  // 5. Forgot password
  console.log("\n🔄 5. Forgot Password (send OTP)")
  const r5 = await api("POST", "/api/auth/email-otp/send-verification", { email, type: "forget-password" })
  check("Forgot password OTP sent", r5.ok, `status ${r5.status}`)

  // 6. Sign out
  console.log("\n🚪 6. Sign Out")
  const r6 = await api("POST", "/api/auth/sign-out", {})
  check("Sign out", r6.ok || r6.status === 200, `status ${r6.status}`)

  // 7. Sign in again (session persistence test)
  console.log("\n🔄 7. Sign In Again")
  const r7 = await api("POST", "/api/auth/sign-in/email", { email, password })
  check("Re-sign in", r7.ok, `status ${r7.status}`)

  console.log(`\n${"=".repeat(40)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().catch(e => { console.error("FATAL:", e); process.exit(1) })
