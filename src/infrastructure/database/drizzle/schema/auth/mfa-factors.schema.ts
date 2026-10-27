import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { mfaFactorTypeEnum } from "../enums";
import { withTimestamps } from "../helpers";
import { users } from "../users.schema";

export const mfaFactors = pgTable(
  "mfa_factors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: mfaFactorTypeEnum("type").notNull(),

    label: varchar("label", {
      length: 100,
    }),

    secretEncrypted: text("secret_encrypted"),

    destination: varchar("destination", {
      length: 255,
    }),

    isVerified: boolean("is_verified").default(false).notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "date",
    }),

    disabledAt: timestamp("disabled_at", {
      withTimezone: true,
      mode: "date",
    }),

    ...withTimestamps(),
  },
  (table) => [index("mfa_factors_user_id_idx").on(table.userId)],
);

export type MfaFactorRecord = typeof mfaFactors.$inferSelect;
export type NewMfaFactorRecord = typeof mfaFactors.$inferInsert;
