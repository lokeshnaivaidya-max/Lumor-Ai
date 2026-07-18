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
// Better Auth schema bootstrap.
//
// Better Auth's raw `pg.Pool` adapter does NOT auto-create the tables it needs.
// Without these tables every auth query ("user", "session", "account",
// "verification") fails with "relation does not exist", which breaks sign-up,
// sign-in and forgot-password all at once. We create them idempotently so the
// auth system works even if `drizzle-kit migrate` was never run against the
// connected database. The DDL mirrors drizzle/0000_milky_white_queen.sql.
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL,
  CONSTRAINT "session_token_unique" UNIQUE("token")
);
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean DEFAULT false NOT NULL,
  "image" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
ALTER TABLE "account" ADD CONSTRAINT IF NOT EXISTS "account_userId_user_id_fk"
  FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT IF NOT EXISTS "session_userId_user_id_fk"
  FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
`

let schemaReady: Promise<void> | null = null

export function ensureAuthSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        await pool.query(AUTH_SCHEMA_SQL)
      } catch (err) {
        // Reset so a later request can retry instead of permanently caching the failure.
        schemaReady = null
        throw err
      }
    })()
  }
  return schemaReady
}
