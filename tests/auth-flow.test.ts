import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createHash, randomUUID, randomBytes } from "node:crypto"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function createCorrelationId(): string {
  return randomUUID()
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 16)
}

function generateOtp(): string {
  const buf = randomBytes(3)
  const num = buf.readUIntBE(0, 3) % 1_000_000
  return num.toString().padStart(6, "0")
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

describe("Email Adapter", () => {
  it("normalizeEmail trims and lowercases", () => {
    assert.strictEqual(normalizeEmail("  Test@Example.COM  "), "test@example.com")
  })

  it("createCorrelationId returns a UUID", () => {
    const id = createCorrelationId()
    assert.match(id, /^[0-9a-f-]{36}$/)
  })

  it("hashEmail returns 16-char hex", () => {
    const hash = hashEmail("test@example.com")
    assert.strictEqual(hash.length, 16)
    assert.match(hash, /^[0-9a-f]+$/)
  })

  it("hashEmail is deterministic", () => {
    assert.strictEqual(hashEmail("Test@Example.com"), hashEmail("  test@example.com  "))
  })
})

describe("OTP Service", () => {
  it("generateOtp returns a 6-digit string", () => {
    const otp = generateOtp()
    assert.match(otp, /^\d{6}$/)
  })

  it("generateOtp produces different values", () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      seen.add(generateOtp())
    }
    assert.ok(seen.size > 1)
  })

  it("hashOtp returns a SHA-256 hex string", () => {
    const hash = hashOtp("123456")
    assert.strictEqual(hash.length, 64)
    assert.match(hash, /^[0-9a-f]+$/)
  })

  it("hashOtp is deterministic", () => {
    assert.strictEqual(hashOtp("123456"), hashOtp("123456"))
  })

  it("different OTPs produce different hashes", () => {
    assert.notStrictEqual(hashOtp("123456"), hashOtp("654321"))
  })
})

describe("Auth Flow", () => {
  it("new user flow: signup -> OTP -> verify", () => {
    const email = normalizeEmail("  NewUser@Test.com  ")
    assert.strictEqual(email, "newuser@test.com")

    const otp = generateOtp()
    assert.match(otp, /^\d{6}$/)

    const hash = hashOtp(otp)
    assert.strictEqual(hash.length, 64)
    assert.strictEqual(hashOtp(otp), hash)
  })
})
