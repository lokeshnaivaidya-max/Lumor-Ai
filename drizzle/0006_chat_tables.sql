-- Add chat_conversation and chat_message tables used by the AI Chat feature.
CREATE TABLE IF NOT EXISTS "chat_conversation" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "title" text DEFAULT 'New chat' NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_message" (
  "id" serial PRIMARY KEY NOT NULL,
  "conversation_id" integer NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "tokens" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "chat_conversation" ADD CONSTRAINT "chat_conversation_user_id_user_id_fk"
    FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_conversation_id_chat_conversation_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "chat_conversation" ("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "chat_conversation_user_id_idx"
  ON "chat_conversation" ("userId");
CREATE INDEX IF NOT EXISTS "chat_message_conversation_id_idx"
  ON "chat_message" ("conversation_id");
CREATE INDEX IF NOT EXISTS "chat_message_conversation_id_created_at_idx"
  ON "chat_message" ("conversation_id", "createdAt");
