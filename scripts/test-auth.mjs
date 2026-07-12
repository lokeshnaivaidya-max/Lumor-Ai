import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import pg from "pg"
const { Pool } = pg

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_CW0U3MPTnesw@ep-long-lake-atvfc2iq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require",
})

const testAuth = betterAuth({
  database: pool,
  secret: "test-secret-1234567890abcdef",
  baseURL: "http://localhost:3000",
  emailAndPassword: { enabled: true, autoSignIn: true },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.log(`\n📧 OTP for ${email} (${type}): ${otp}\n`)
      },
    }),
  ],
})

async function test() {
  try {
    // 1. Test DB connection
    console.log("1️⃣ Testing DB connection...")
    const r = await pool.query("SELECT 1 as ok")
    console.log("   ✅ DB connected:", r.rows[0].ok === 1)

    // 2. Test sign-up via API
    console.log("\n2️⃣ Testing sign-up...")
    const signUpRes = await testAuth.api.signUpEmail({
      body: { email: "test-user@lumora.ai", password: "TestPass1234!", name: "Test User" },
      headers: new Headers({ origin: "http://localhost:3000" }),
    })
    console.log("   ✅ Sign-up response:", JSON.stringify(signUpRes, null, 2))

    // 3. Test sign-in
    console.log("\n3️⃣ Testing sign-in...")
    const signInRes = await testAuth.api.signInEmail({
      body: { email: "test-user@lumora.ai", password: "TestPass1234!" },
      headers: new Headers({ origin: "http://localhost:3000" }),
    })
    console.log("   ✅ Sign-in response:", JSON.stringify(signInRes, null, 2))

    // 4. Test get session
    console.log("\n4️⃣ Testing session...")
    if (signInRes?.data?.session?.token) {
      const sess = await testAuth.api.getSession({
        headers: new Headers({
          origin: "http://localhost:3000",
          cookie: `better-auth-session=${signInRes.data.session.token}`,
        }),
      })
      console.log("   ✅ Session:", JSON.stringify(sess, null, 2))
    }

    console.log("\n🎉 All auth tests passed!")
  } catch (err) {
    console.error("\n❌ Error:", err)
    if (err.cause) console.error("   Cause:", err.cause)
    if (err.message?.includes("pool")) console.error("   DB connection issue - check DATABASE_URL")
  }
  await pool.end()
}

test()
