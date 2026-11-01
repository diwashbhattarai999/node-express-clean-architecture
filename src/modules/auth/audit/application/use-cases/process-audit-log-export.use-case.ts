import { auditLogExportStorageKey } from "@/modules/auth/audit/application/constants/audit-export";
import type {
  IAuditLogRepository,
  SecurityEvent,
} from "@/modules/auth/audit/application/ports/audit-log.repository";
import { sanitizeSecurityEventMetadata } from "@/modules/auth/audit/application/utils/sanitize-security-event-metadata";
import type { ExportAuditLogsPayload } from "@/shared/jobs/job-payloads";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

type ExportRow = {
  id: string;
  eventType: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export class ProcessAuditLogExportUseCase {
  public constructor(
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly objectStorage: IObjectStorage,
  ) {}

  public async execute(payload: ExportAuditLogsPayload): Promise<{ key: string; count: number }> {
    const events = await this.auditLogRepository.listForExport({
      from: new Date(payload.from),
      to: new Date(payload.to),
      ...(payload.userId !== undefined ? { userId: payload.userId } : {}),
      ...(payload.eventType !== undefined ? { eventType: payload.eventType } : {}),
      ...(payload.outcome !== undefined ? { outcome: payload.outcome } : {}),
    });

    const rows = events.map(toExportRow);
    const key = auditLogExportStorageKey(payload.exportId, payload.format);
    const body = payload.format === "csv" ? toCsv(rows) : `${JSON.stringify(rows, null, 2)}\n`;

    await this.objectStorage.putObject({
      key,
      body,
      contentType: payload.format === "csv" ? "text/csv" : "application/json",
    });

    return { key, count: rows.length };
  }
}

const toExportRow = (event: SecurityEvent): ExportRow => {
  const metadata = sanitizeSecurityEventMetadata(event.metadata);
  const row: ExportRow = {
    id: event.id,
    eventType: event.eventType,
    outcome: event.outcome,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: event.createdAt.toISOString(),
  };

  if (metadata !== undefined) {
    row.metadata = metadata;
  }

  return row;
};

const CSV_COLUMNS = [
  "id",
  "eventType",
  "outcome",
  "ipAddress",
  "userAgent",
  "createdAt",
  "metadata",
] as const;

const toCsv = (events: ExportRow[]): string => {
  const header = CSV_COLUMNS.join(",");
  const rows = events.map((event) =>
    [
      event.id,
      event.eventType,
      event.outcome,
      event.ipAddress ?? "",
      event.userAgent ?? "",
      event.createdAt,
      event.metadata ? JSON.stringify(event.metadata) : "",
    ]
      .map(escapeCsv)
      .join(","),
  );

  return `${[header, ...rows].join("\n")}\n`;
};

const escapeCsv = (value: string): string => {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
};
