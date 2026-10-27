import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

export const mfaRecoveryCodes = pgTable(
  "mfa_recovery_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    codeHash: text("code_hash").notNull(),

    usedAt: timestamp("used_at", {
      withTimezone: true,
      mode: "date",
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("mfa_recovery_codes_code_hash_unique_idx").on(table.codeHash),
    index("mfa_recovery_codes_user_id_idx").on(table.userId),
    index("mfa_recovery_codes_user_used_at_idx").on(table.userId, table.usedAt),
  ],
);

export type MfaRecoveryCodeRecord = typeof mfaRecoveryCodes.$inferSelect;
export type NewMfaRecoveryCodeRecord = typeof mfaRecoveryCodes.$inferInsert;
