import { pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: varchar("key", {
      length: 64,
    }).notNull(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    description: varchar("description", {
      length: 255,
    }),

    createdAt: createdAtColumn(),
  },
  (table) => [uniqueIndex("permissions_key_unique_idx").on(table.key)],
);

export type PermissionRecord = typeof permissions.$inferSelect;
export type NewPermissionRecord = typeof permissions.$inferInsert;
