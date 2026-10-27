import { pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { withTimestamps } from "../helpers";
import { users } from "../users.schema";

export const passwordCredentials = pgTable(
  "password_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    passwordChangedAt: timestamp("password_changed_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    ...withTimestamps(),
  },
  (table) => [uniqueIndex("password_credentials_user_id_unique_idx").on(table.userId)],
);

export type PasswordCredentialRecord = typeof passwordCredentials.$inferSelect;
export type NewPasswordCredentialRecord = typeof passwordCredentials.$inferInsert;
