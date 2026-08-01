CREATE TABLE "user_agreement" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agreed_to_terms" boolean DEFAULT false NOT NULL,
	"agreed_to_privacy" boolean DEFAULT false NOT NULL,
	"agreed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "user_agreement" ADD CONSTRAINT "user_agreement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
