CREATE TABLE "oauth_authorization_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_hash" text NOT NULL,
	"provider" varchar(100) NOT NULL,
	"intent" varchar(20) NOT NULL,
	"redirect_uri" varchar(2048) NOT NULL,
	"client_state" text NOT NULL,
	"code_challenge" text,
	"code_challenge_method" varchar(16),
	"user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_authorization_states" ADD CONSTRAINT "oauth_authorization_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_authorization_states_state_hash_unique_idx" ON "oauth_authorization_states" USING btree ("state_hash");--> statement-breakpoint
CREATE INDEX "oauth_authorization_states_expires_at_idx" ON "oauth_authorization_states" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_authorization_states_provider_expires_idx" ON "oauth_authorization_states" USING btree ("provider","expires_at");