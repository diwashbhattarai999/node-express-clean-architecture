import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { userStatusEnum } from "./enums";
import { withTimestamps } from "./helpers";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    status: userStatusEnum("status").default("pending_verification").notNull(),

    displayName: varchar("display_name", {
      length: 100,
    }),

    avatarUrl: varchar("avatar_url", {
      length: 2048,
    }),

    activatedAt: timestamp("activated_at", {
      withTimezone: true,
      mode: "date",
    }),

    suspendedAt: timestamp("suspended_at", {
      withTimezone: true,
      mode: "date",
    }),

    disabledAt: timestamp("disabled_at", {
      withTimezone: true,
      mode: "date",
    }),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
      mode: "date",
    }),

    deletionRequestedAt: timestamp("deletion_requested_at", {
      withTimezone: true,
      mode: "date",
    }),

    deletionScheduledFor: timestamp("deletion_scheduled_for", {
      withTimezone: true,
      mode: "date",
    }),

    deletionReason: varchar("deletion_reason", {
      length: 500,
    }),

    ...withTimestamps(),
  },
  (table) => [
    index("users_status_created_at_idx").on(table.status, table.createdAt),
    index("users_created_at_idx").on(table.createdAt),
    index("users_deletion_scheduled_for_idx")
      .on(table.deletionScheduledFor)
      .where(sql`${table.deletionScheduledFor} is not null and ${table.deletedAt} is null`),
  ],
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
