import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";
import { mfaChallenges } from "./mfa-challenges.schema";
import { sessions } from "./sessions.schema";

export const stepUpChallenges = pgTable(
  "step_up_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),

    method: varchar("method", {
      length: 20,
    }).notNull(),

    mfaChallengeId: uuid("mfa_challenge_id").references(() => mfaChallenges.id, {
      onDelete: "set null",
    }),

    webauthnChallenge: text("webauthn_challenge"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: createdAtColumn(),
  },
  (table) => [
    index("step_up_challenges_user_session_expires_idx").on(
      table.userId,
      table.sessionId,
      table.expiresAt,
    ),
    index("step_up_challenges_expires_at_idx").on(table.expiresAt),
  ],
);

export type StepUpChallengeRecord = typeof stepUpChallenges.$inferSelect;
export type NewStepUpChallengeRecord = typeof stepUpChallenges.$inferInsert;
