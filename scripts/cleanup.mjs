import pg from "pg"
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const email = `test${Date.now()}@lumora.ai`

// Create user
const signUpRes = await pool.query(
  `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
   VALUES ($1, $2, $3, $4, NOW(), NOW())
   ON CONFLICT (email) DO NOTHING
   RETURNING id`,
  [`test-${Date.now()}`, "Cleanup Test", email, false]
)
console.log("User created:", signUpRes.rows[0]?.id || "skipped (duplicate)")

// Check existing test users
const { rows } = await pool.query(`SELECT COUNT(*)::int as c FROM "user"`)
console.log("Total users in DB:", rows[0].c)

// Clean up test users
await pool.query(`DELETE FROM "user" WHERE email LIKE $1`, ["test-%@lumora.ai"])
await pool.query(`DELETE FROM "user" WHERE email LIKE $1`, ["direct-test-%"])
await pool.query(`DELETE FROM "user" WHERE email LIKE $1`, ["authtest@%"])

const { rows: r2 } = await pool.query(`SELECT COUNT(*)::int as c FROM "user"`)
console.log("After cleanup:", r2[0].c)

await pool.end()
