import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull(),

    passwordHash: varchar("password_hash", {
      length: 255,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique_idx").on(table.email),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
