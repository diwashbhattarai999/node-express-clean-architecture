import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

export const passkeyChallenges = pgTable(
  "passkey_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    type: varchar("type", {
      length: 20,
    }).notNull(),

    challenge: text("challenge").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    consumedAt: timestamp("consumed_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("passkey_challenges_challenge_unique_idx").on(table.challenge),
    index("passkey_challenges_user_type_expires_idx").on(table.userId, table.type, table.expiresAt),
    index("passkey_challenges_expires_at_idx").on(table.expiresAt),
  ],
);

export type PasskeyChallengeRecord = typeof passkeyChallenges.$inferSelect;
export type NewPasskeyChallengeRecord = typeof passkeyChallenges.$inferInsert;
