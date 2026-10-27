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

import { withTimestamps } from "../helpers";
import { users } from "../users.schema";

export const externalIdentities = pgTable(
  "external_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: varchar("provider", {
      length: 100,
    }).notNull(),

    providerUserId: varchar("provider_user_id", {
      length: 255,
    }).notNull(),

    issuer: varchar("issuer", {
      length: 512,
    }),

    providerEmail: varchar("provider_email", {
      length: 255,
    }),

    providerEmailVerified: boolean("provider_email_verified").default(false).notNull(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "date",
    }),

    ...withTimestamps(),
  },
  (table) => [
    uniqueIndex("external_identities_provider_user_unique_idx").on(
      table.provider,
      table.providerUserId,
    ),
    uniqueIndex("external_identities_issuer_user_unique_idx")
      .on(table.issuer, table.providerUserId)
      .where(sql`${table.issuer} is not null`),
    index("external_identities_user_provider_idx").on(table.userId, table.provider),
  ],
);

export type ExternalIdentityRecord = typeof externalIdentities.$inferSelect;
export type NewExternalIdentityRecord = typeof externalIdentities.$inferInsert;
