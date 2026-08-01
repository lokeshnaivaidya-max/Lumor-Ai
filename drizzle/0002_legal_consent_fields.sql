ALTER TABLE "user" ADD COLUMN "accepted_terms" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN "accepted_privacy_policy" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN "accepted_legal_version" text DEFAULT '1.0' NOT NULL;
ALTER TABLE "user" ADD COLUMN "accepted_at" timestamp;
