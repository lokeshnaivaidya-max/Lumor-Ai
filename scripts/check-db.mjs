import { Pool } from "pg"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  console.log("Connected! Tables:", r.rows.map(x => x.table_name).join(", "))
} catch (e) {
  console.error("Error:", e.message)
}
await pool.end()
