import {
  bigint,
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const passkeys = pgTable(
  "passkeys",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    credentialId: text("credential_id").notNull(),

    publicKey: bytea("public_key").notNull(),

    signCount: bigint("sign_count", { mode: "number" }).notNull().default(0),

    transports: text("transports").array(),

    aaguid: varchar("aaguid", {
      length: 36,
    }),

    backedUp: boolean("backed_up"),

    name: varchar("name", {
      length: 100,
    }),

    createdAt: createdAtColumn(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "date",
    }),

    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    uniqueIndex("passkeys_credential_id_unique_idx").on(table.credentialId),
    index("passkeys_user_revoked_idx").on(table.userId, table.revokedAt),
  ],
);

export type PasskeyRecord = typeof passkeys.$inferSelect;
export type NewPasskeyRecord = typeof passkeys.$inferInsert;
