import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";
import { mfaFactors } from "./mfa-factors.schema";
import { sessions } from "./sessions.schema";

export const mfaChallenges = pgTable(
  "mfa_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    factorId: uuid("factor_id").references(() => mfaFactors.id, {
      onDelete: "set null",
    }),

    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),

    challengeHash: text("challenge_hash"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),

    attemptCount: integer("attempt_count").default(0).notNull(),

    createdAt: createdAtColumn(),
  },
  (table) => [
    index("mfa_challenges_user_expires_idx").on(table.userId, table.expiresAt),
    index("mfa_challenges_factor_expires_idx").on(table.factorId, table.expiresAt),
  ],
);

export type MfaChallengeRecord = typeof mfaChallenges.$inferSelect;
export type NewMfaChallengeRecord = typeof mfaChallenges.$inferInsert;
