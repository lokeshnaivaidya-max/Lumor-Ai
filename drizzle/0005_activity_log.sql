-- Add activity_log table for user-facing event tracking (searches, compare /
-- trade-planner usage, watchlist removals, notification-pref changes, etc.).
CREATE TABLE IF NOT EXISTS "activity_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "ticker" text,
  "href" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "activity_log_user_id_created_at_idx"
  ON "activity_log" ("user_id", "created_at" DESC);

-- New users default to Light theme.
ALTER TABLE "user" ALTER COLUMN "theme" SET DEFAULT 'light';
