import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

export const oauthAuthorizationStates = pgTable(
  "oauth_authorization_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    stateHash: text("state_hash").notNull(),

    provider: varchar("provider", {
      length: 100,
    }).notNull(),

    intent: varchar("intent", {
      length: 20,
    }).notNull(),

    redirectUri: varchar("redirect_uri", {
      length: 2048,
    }).notNull(),

    clientState: text("client_state").notNull(),

    codeChallenge: text("code_challenge"),

    codeChallengeMethod: varchar("code_challenge_method", {
      length: 16,
    }),

    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    consumedAt: timestamp("consumed_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("oauth_authorization_states_state_hash_unique_idx").on(table.stateHash),
    index("oauth_authorization_states_expires_at_idx").on(table.expiresAt),
    index("oauth_authorization_states_provider_expires_idx").on(table.provider, table.expiresAt),
  ],
);

export type OAuthAuthorizationStateRecord = typeof oauthAuthorizationStates.$inferSelect;
export type NewOAuthAuthorizationStateRecord = typeof oauthAuthorizationStates.$inferInsert;
