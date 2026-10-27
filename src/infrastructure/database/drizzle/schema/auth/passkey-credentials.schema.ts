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

export const passkeyCredentials = pgTable(
  "passkey_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    credentialId: text("credential_id").notNull(),

    publicKey: bytea("public_key").notNull(),

    counter: bigint("counter", { mode: "number" }).notNull().default(0),

    transports: text("transports").array(),

    aaguid: varchar("aaguid", {
      length: 36,
    }),

    backedUp: boolean("backed_up"),

    friendlyName: varchar("friendly_name", {
      length: 100,
    }),

    createdAt: createdAtColumn(),

    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    uniqueIndex("passkey_credentials_credential_id_unique_idx").on(table.credentialId),
    index("passkey_credentials_user_id_idx").on(table.userId),
  ],
);

export type PasskeyCredentialRecord = typeof passkeyCredentials.$inferSelect;
export type NewPasskeyCredentialRecord = typeof passkeyCredentials.$inferInsert;
