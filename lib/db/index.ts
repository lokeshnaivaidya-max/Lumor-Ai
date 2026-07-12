import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("[DB] DATABASE_URL is not set — auth will fail at runtime")
}

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
