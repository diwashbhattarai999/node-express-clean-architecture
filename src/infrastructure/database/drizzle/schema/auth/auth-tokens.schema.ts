import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  inet,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { authTokenTypeEnum } from "../enums";
import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";
import { loginIdentities } from "./login-identities.schema";

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    identityId: uuid("identity_id").references(() => loginIdentities.id, {
      onDelete: "set null",
    }),

    type: authTokenTypeEnum("type").notNull(),

    tokenHash: text("token_hash").notNull(),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    consumedAt: timestamp("consumed_at", {
      withTimezone: true,
      mode: "date",
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
    }),

    attemptCount: integer("attempt_count").default(0).notNull(),

    createdAt: createdAtColumn(),

    requestedIp: inet("requested_ip"),

    requestedUserAgent: text("requested_user_agent"),

    replacedByTokenId: uuid("replaced_by_token_id").references((): AnyPgColumn => authTokens.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_unique_idx").on(table.tokenHash),
    index("auth_tokens_user_type_expires_idx").on(table.userId, table.type, table.expiresAt),
    index("auth_tokens_user_type_active_idx")
      .on(table.userId, table.type)
      .where(sql`${table.consumedAt} is null and ${table.revokedAt} is null`),
    index("auth_tokens_expires_at_idx").on(table.expiresAt),
  ],
);

export type AuthTokenRecord = typeof authTokens.$inferSelect;
export type NewAuthTokenRecord = typeof authTokens.$inferInsert;
