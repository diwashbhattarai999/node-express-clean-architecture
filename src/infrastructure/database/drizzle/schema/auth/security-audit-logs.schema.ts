import { index, inet, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { securityEventOutcomeEnum, securityEventTypeEnum } from "../enums";
import { createdAtColumn } from "../helpers";
import { users } from "../users.schema";

export const securityAuditLogs = pgTable(
  "security_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    eventType: securityEventTypeEnum("event_type").notNull(),

    outcome: securityEventOutcomeEnum("outcome").notNull(),

    ipAddress: inet("ip_address"),

    userAgent: text("user_agent"),

    sessionId: uuid("session_id"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: createdAtColumn(),
  },
  (table) => [
    index("security_audit_logs_user_created_at_idx").on(table.userId, table.createdAt),
    index("security_audit_logs_event_type_created_at_idx").on(table.eventType, table.createdAt),
    index("security_audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export type SecurityAuditLogRecord = typeof securityAuditLogs.$inferSelect;
export type NewSecurityAuditLogRecord = typeof securityAuditLogs.$inferInsert;
