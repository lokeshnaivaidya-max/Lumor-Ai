import { readFileSync } from "node:fs"
import { GoogleGenAI } from "@google/genai"

// Installed SDK version
let sdkVersion = "unknown"
try {
  const pkg = JSON.parse(readFileSync(new URL("../node_modules/@google/genai/package.json", import.meta.url)))
  sdkVersion = pkg.version
} catch (e) {
  sdkVersion = "could not read: " + e.message
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"
const MODEL_FAST = process.env.GEMINI_MODEL_FAST || "gemini-2.5-flash-lite"
const apiKey = process.env.GEMINI_API_KEY

console.log("========== GEMINI DIAGNOSTIC ==========")
console.log("Installed @google/genai version:", sdkVersion)
console.log("GEMINI_API_KEY present:", !!apiKey, apiKey ? `(length ${apiKey.length}, prefix ${apiKey.slice(0, 6)}...)` : "")
console.log("Primary model (MODEL):", MODEL)
console.log("Fast model (MODEL_FAST):", MODEL_FAST)
console.log("SDK init code: new GoogleGenAI({ apiKey })")
console.log("Endpoint pattern: https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent")
console.log("=======================================\n")

if (!apiKey) {
  console.log("No GEMINI_API_KEY in process.env — cannot make a live call.")
  process.exit(0)
}

const client = new GoogleGenAI({ apiKey })

async function tryCall(label, model) {
  console.log(`\n----- Attempting generateContent with model "${model}" (${label}) -----`)
  try {
    const res = await client.models.generateContent({
      model,
      contents: "Reply with the single word: OK",
      config: { temperature: 0 },
    })
    console.log(`SUCCESS. Response text: ${JSON.stringify(res.text)}`)
  } catch (err) {
    console.log("FULL ERROR OBJECT:")
    console.dir(err, { depth: null })
    console.log("\nerr.name:", err?.name)
    console.log("err.message:", err?.message)
    console.log("err.status:", err?.status)
    console.log("err.code:", err?.code)
    if (err?.response) {
      console.log("err.response.status:", err.response?.status)
      try {
        const body = await err.response.text()
        console.log("err.response body:", body)
      } catch {}
    }
    // Try to extract embedded JSON error body from message
    const m = String(err?.message || "")
    const jsonMatch = m.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      console.log("\nParsed error body from message:")
      try {
        console.log(JSON.stringify(JSON.parse(jsonMatch[0]), null, 2))
      } catch {
        console.log(jsonMatch[0])
      }
    }
  }
}

await tryCall("primary", MODEL)
await tryCall("fast", MODEL_FAST)
console.log("\n========== END DIAGNOSTIC ==========")
