import type {
  TAuditLogExportFormat,
  TSecurityEventOutcome,
  TSecurityEventType,
} from "@/modules/auth/audit/application/constants/security-events";

export type SecurityEvent = {
  id: string;
  eventType: TSecurityEventType;
  outcome: TSecurityEventOutcome;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  metadata?: Record<string, unknown>;
};

export type ListAuditLogsQuery = {
  page: number;
  limit: number;
  userId?: string;
  eventType?: TSecurityEventType;
  outcome?: TSecurityEventOutcome;
  from?: Date;
  to?: Date;
};

export type ListAuditLogsResult = {
  items: SecurityEvent[];
  total: number;
};

export type ExportAuditLogsQuery = {
  from: Date;
  to: Date;
  userId?: string;
  eventType?: TSecurityEventType;
  outcome?: TSecurityEventOutcome;
};

export type { TAuditLogExportFormat };

export interface IAuditLogRepository {
  list(query: ListAuditLogsQuery): Promise<ListAuditLogsResult>;

  findById(eventId: string): Promise<SecurityEvent | null>;

  listForExport(query: ExportAuditLogsQuery): Promise<SecurityEvent[]>;
}
