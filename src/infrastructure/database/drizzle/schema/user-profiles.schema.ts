import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { withTimestamps } from "./helpers";
import { users } from "./users.schema";

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  firstName: varchar("first_name", {
    length: 100,
  }),

  lastName: varchar("last_name", {
    length: 100,
  }),

  locale: varchar("locale", {
    length: 35,
  }),

  timezone: varchar("timezone", {
    length: 64,
  }),

  bio: text("bio"),

  ...withTimestamps(),
});

export type UserProfileRecord = typeof userProfiles.$inferSelect;
export type NewUserProfileRecord = typeof userProfiles.$inferInsert;
