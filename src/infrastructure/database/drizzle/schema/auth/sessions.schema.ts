import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  inet,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { sessionRevocationReasonEnum } from "../enums";
import { users } from "../users.schema";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    familyId: uuid("family_id").notNull(),

    refreshTokenHash: text("refresh_token_hash").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
    }),

    replacedBySessionId: uuid("replaced_by_session_id").references((): AnyPgColumn => sessions.id, {
      onDelete: "set null",
    }),

    ipAddress: inet("ip_address"),

    userAgent: text("user_agent"),

    deviceName: varchar("device_name", {
      length: 255,
    }),

    revocationReason: sessionRevocationReasonEnum("revocation_reason"),
  },
  (table) => [
    uniqueIndex("sessions_refresh_token_hash_unique_idx").on(table.refreshTokenHash),
    index("sessions_user_revoked_expires_idx").on(table.userId, table.revokedAt, table.expiresAt),
    index("sessions_user_id_active_idx").on(table.userId).where(sql`${table.revokedAt} is null`),
    index("sessions_family_id_idx").on(table.familyId),
    index("sessions_expires_at_idx").on(table.expiresAt),
    index("sessions_replaced_by_session_id_idx").on(table.replacedBySessionId),
  ],
);

export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;
