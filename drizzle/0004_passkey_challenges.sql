CREATE TABLE "passkey_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(20) NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "passkey_challenges" ADD CONSTRAINT "passkey_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "passkey_challenges_challenge_unique_idx" ON "passkey_challenges" USING btree ("challenge");--> statement-breakpoint
CREATE INDEX "passkey_challenges_user_type_expires_idx" ON "passkey_challenges" USING btree ("user_id","type","expires_at");--> statement-breakpoint
CREATE INDEX "passkey_challenges_expires_at_idx" ON "passkey_challenges" USING btree ("expires_at");
