import { index, inet, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { securityEventOutcomeEnum } from "../enums";
import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    identifierHash: text("identifier_hash").notNull(),

    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    outcome: securityEventOutcomeEnum("outcome").notNull(),

    reason: varchar("reason", {
      length: 100,
    }),

    ipAddress: inet("ip_address"),

    createdAt: createdAtColumn(),
  },
  (table) => [
    index("login_attempts_identifier_created_at_idx").on(table.identifierHash, table.createdAt),
    index("login_attempts_ip_created_at_idx").on(table.ipAddress, table.createdAt),
  ],
);

export type LoginAttemptRecord = typeof loginAttempts.$inferSelect;
export type NewLoginAttemptRecord = typeof loginAttempts.$inferInsert;
