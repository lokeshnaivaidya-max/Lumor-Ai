-- Idempotent schema completion migration.
-- Covers every object that existed ONLY in the old per-request ensureAuthSchema()
-- DDL (theme enum + profile columns) plus the application tables that were never
-- captured in migrations 0000-0002 (chat_conversation, chat_message,
-- notification, saved_analysis). All statements are guarded so this is safe to
-- run whether or not the objects already exist in the target database.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme') THEN
    CREATE TYPE "theme" AS ENUM ('light', 'dark', 'system');
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "chat_conversation" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "title" text DEFAULT 'New chat' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "chat_message" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "tokens" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notification" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "type" text DEFAULT 'general' NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "symbol" text,
  "read" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "saved_analysis" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "symbol" text NOT NULL,
  "name" text,
  "kind" text DEFAULT 'analysis' NOT NULL,
  "summary" text,
  "confidence" integer,
  "direction" text DEFAULT 'neutral' NOT NULL,
  "data" jsonb,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "timezone" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "theme" "theme" DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_message_conversation_id_chat_conversation_id_fk'
  ) THEN
    ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversation_id_chat_conversation_id_fk"
      FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversation"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_agreement_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "user_agreement" ADD CONSTRAINT "user_agreement_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
