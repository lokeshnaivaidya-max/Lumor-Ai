import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("[DB] DATABASE_URL is not set — auth will fail at runtime")
}

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })

// ─────────────────────────────────────────────────────────────────────────────
// Schema management.
//
// ALL database schema (Better Auth tables, profile columns, the `theme` enum,
// and the application tables) is created exclusively by Drizzle migrations
// (see ./drizzle/*.sql, applied via `drizzle-kit migrate`). Migrations run at
// deploy time (see the `db:migrate` script and `vercel-build`), so no
// per-request schema bootstrap runs in the app code. This keeps DDL (which
// acquires table locks) off the request path and prevents the sign-up page from
// hanging on schema initialization.
// ─────────────────────────────────────────────────────────────────────────────

