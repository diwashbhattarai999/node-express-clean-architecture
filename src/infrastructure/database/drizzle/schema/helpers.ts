import { timestamp } from "drizzle-orm/pg-core";

export const createdAtColumn = () =>
  timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull();

export const updatedAtColumn = () =>
  timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  })
    .defaultNow()
    .notNull();

export const withTimestamps = () => ({
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
