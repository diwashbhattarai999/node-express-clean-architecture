import { and, asc, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import {
  type SecurityAuditLogRecord,
  securityAuditLogs,
} from "@/infrastructure/database/drizzle/schema/auth/security-audit-logs.schema";
import type {
  TSecurityEventOutcome,
  TSecurityEventType,
} from "@/modules/auth/audit/application/constants/security-events";
import type {
  ExportAuditLogsQuery,
  IAuditLogRepository,
  ListAuditLogsQuery,
  ListAuditLogsResult,
  SecurityEvent,
} from "@/modules/auth/audit/application/ports/audit-log.repository";
import { sanitizeSecurityEventMetadata } from "@/modules/auth/audit/application/utils/sanitize-security-event-metadata";
import { getPaginationOffset } from "@/shared/http/pagination";

const EXPORT_LIMIT = 10_000;

export class PostgresAuditLogRepository implements IAuditLogRepository {
  public async list(query: ListAuditLogsQuery): Promise<ListAuditLogsResult> {
    const whereClause = buildWhere(query);
    const offset = getPaginationOffset(query.page, query.limit);

    const [totalResult] = await db
      .select({ value: count() })
      .from(securityAuditLogs)
      .where(whereClause);

    const rows = await db
      .select()
      .from(securityAuditLogs)
      .where(whereClause)
      .orderBy(desc(securityAuditLogs.createdAt), asc(securityAuditLogs.id))
      .limit(query.limit)
      .offset(offset);

    return {
      total: totalResult?.value ?? 0,
      items: rows.map(toSecurityEvent),
    };
  }

  public async findById(eventId: string): Promise<SecurityEvent | null> {
    const [row] = await db
      .select()
      .from(securityAuditLogs)
      .where(eq(securityAuditLogs.id, eventId))
      .limit(1);

    return row ? toSecurityEvent(row) : null;
  }

  public async listForExport(query: ExportAuditLogsQuery): Promise<SecurityEvent[]> {
    const rows = await db
      .select()
      .from(securityAuditLogs)
      .where(buildWhere(query))
      .orderBy(desc(securityAuditLogs.createdAt), asc(securityAuditLogs.id))
      .limit(EXPORT_LIMIT);

    return rows.map(toSecurityEvent);
  }
}

const buildWhere = (query: {
  userId?: string;
  eventType?: TSecurityEventType;
  outcome?: TSecurityEventOutcome;
  from?: Date;
  to?: Date;
}): SQL | undefined => {
  const conditions: SQL[] = [];

  if (query.userId) {
    conditions.push(eq(securityAuditLogs.userId, query.userId));
  }

  if (query.eventType) {
    conditions.push(eq(securityAuditLogs.eventType, query.eventType));
  }

  if (query.outcome) {
    conditions.push(eq(securityAuditLogs.outcome, query.outcome));
  }

  if (query.from) {
    conditions.push(gte(securityAuditLogs.createdAt, query.from));
  }

  if (query.to) {
    conditions.push(lte(securityAuditLogs.createdAt, query.to));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
};

const toSecurityEvent = (row: SecurityAuditLogRecord): SecurityEvent => {
  const metadata = sanitizeSecurityEventMetadata(row.metadata);
  const event: SecurityEvent = {
    id: row.id,
    eventType: row.eventType,
    outcome: row.outcome,
    ipAddress: row.ipAddress ? String(row.ipAddress) : null,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };

  if (metadata !== undefined) {
    event.metadata = metadata;
  }

  return event;
};
