CREATE TABLE "passkey_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" "bytea" NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" text[],
	"aaguid" varchar(36),
	"backed_up" boolean,
	"friendly_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletion_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletion_scheduled_for" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletion_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "passkey_credentials_credential_id_unique_idx" ON "passkey_credentials" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "passkey_credentials_user_id_idx" ON "passkey_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_deletion_scheduled_for_idx" ON "users" USING btree ("deletion_scheduled_for") WHERE "users"."deletion_scheduled_for" is not null and "users"."deleted_at" is null;