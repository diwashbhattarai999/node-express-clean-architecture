CREATE TABLE "step_up_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"method" varchar(20) NOT NULL,
	"mfa_challenge_id" uuid,
	"webauthn_challenge" text,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_up_challenges" ADD CONSTRAINT "step_up_challenges_mfa_challenge_id_mfa_challenges_id_fk" FOREIGN KEY ("mfa_challenge_id") REFERENCES "public"."mfa_challenges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "step_up_challenges_user_session_expires_idx" ON "step_up_challenges" USING btree ("user_id","session_id","expires_at");--> statement-breakpoint
CREATE INDEX "step_up_challenges_expires_at_idx" ON "step_up_challenges" USING btree ("expires_at");