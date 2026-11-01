import type { TAuditLogExportFormat } from "@/modules/auth/audit/application/constants/security-events";

export const auditLogExportStorageKey = (exportId: string, format: TAuditLogExportFormat): string =>
  `audit-exports/${exportId}.${format}`;
