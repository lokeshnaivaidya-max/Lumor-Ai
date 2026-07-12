import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const sql = `
DO $$ BEGIN
  CREATE TYPE "theme" AS ENUM ('light','dark','system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "timezone" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "theme" "theme" NOT NULL DEFAULT 'system';

CREATE TABLE IF NOT EXISTS "notification" (
  "id" serial PRIMARY KEY,
  "userId" text NOT NULL,
  "type" text NOT NULL DEFAULT 'general',
  "title" text NOT NULL,
  "body" text,
  "symbol" text,
  "read" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "saved_analysis" (
  "id" serial PRIMARY KEY,
  "userId" text NOT NULL,
  "symbol" text NOT NULL,
  "name" text,
  "kind" text NOT NULL DEFAULT 'analysis',
  "summary" text,
  "confidence" integer,
  "direction" text NOT NULL DEFAULT 'neutral',
  "data" jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "chat_conversation" (
  "id" serial PRIMARY KEY,
  "userId" text NOT NULL,
  "title" text NOT NULL DEFAULT 'New chat',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "chat_message" (
  "id" serial PRIMARY KEY,
  "conversation_id" integer NOT NULL REFERENCES "chat_conversation" ("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "tokens" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "notification_user_idx" ON "notification" ("userId");
CREATE INDEX IF NOT EXISTS "saved_analysis_user_idx" ON "saved_analysis" ("userId");
CREATE INDEX IF NOT EXISTS "chat_conversation_user_idx" ON "chat_conversation" ("userId");
CREATE INDEX IF NOT EXISTS "chat_message_conv_idx" ON "chat_message" ("conversation_id");
`

async function main() {
  const client = await pool.connect()
  try {
    await client.query(sql)
    console.log("[migrate] app tables applied successfully")
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error("[migrate] failed:", e)
  process.exit(1)
})
