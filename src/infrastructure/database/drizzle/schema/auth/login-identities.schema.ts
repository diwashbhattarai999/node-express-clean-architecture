import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { loginIdentityTypeEnum } from "../enums";
import { withTimestamps } from "../helpers";
import { users } from "../users.schema";

export const loginIdentities = pgTable(
  "login_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: loginIdentityTypeEnum("type").notNull(),

    identifier: varchar("identifier", {
      length: 255,
    }).notNull(),

    normalizedIdentifier: varchar("normalized_identifier", {
      length: 255,
    }).notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),

    isPrimary: boolean("is_primary").default(false).notNull(),

    ...withTimestamps(),
  },
  (table) => [
    uniqueIndex("login_identities_type_normalized_unique_idx").on(
      table.type,
      table.normalizedIdentifier,
    ),
    uniqueIndex("login_identities_user_type_primary_unique_idx")
      .on(table.userId, table.type)
      .where(sql`${table.isPrimary} = true`),
    index("login_identities_user_type_idx").on(table.userId, table.type),
  ],
);

export type LoginIdentityRecord = typeof loginIdentities.$inferSelect;
export type NewLoginIdentityRecord = typeof loginIdentities.$inferInsert;
