import { ExportAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/export-admin-audit-logs.use-case";
import { GetAdminAuditExportUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-export.use-case";
import { GetAdminAuditLogUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-log.use-case";
import { ListAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/list-admin-audit-logs.use-case";
import { ListOwnSecurityEventsUseCase } from "@/modules/auth/audit/application/use-cases/list-own-security-events.use-case";
import { PostgresAuditLogRepository } from "@/modules/auth/audit/infrastructure/repositories/postgres-audit-log.repository";
import { ExportAdminAuditLogsController } from "@/modules/auth/audit/presentation/http/controllers/export-admin-audit-logs.controller";
import { GetAdminAuditExportController } from "@/modules/auth/audit/presentation/http/controllers/get-admin-audit-export.controller";
import { GetAdminAuditLogController } from "@/modules/auth/audit/presentation/http/controllers/get-admin-audit-log.controller";
import { ListAdminAuditLogsController } from "@/modules/auth/audit/presentation/http/controllers/list-admin-audit-logs.controller";
import { ListOwnSecurityEventsController } from "@/modules/auth/audit/presentation/http/controllers/list-own-security-events.controller";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

export type CreateAuditModuleOptions = {
  identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">;
  permissionRepository: IPermissionRepository;
  jobQueue: IJobQueue;
  objectStorage: IObjectStorage;
};

export type AuditModule = {
  listOwnSecurityEventsController: ListOwnSecurityEventsController;
  listAdminAuditLogsController: ListAdminAuditLogsController;
  getAdminAuditLogController: GetAdminAuditLogController;
  exportAdminAuditLogsController: ExportAdminAuditLogsController;
  getAdminAuditExportController: GetAdminAuditExportController;
};

export function createAuditModule(options: CreateAuditModuleOptions): AuditModule {
  const auditLogRepository = new PostgresAuditLogRepository();
  const { permissionRepository } = options;

  return {
    listOwnSecurityEventsController: new ListOwnSecurityEventsController(
      new ListOwnSecurityEventsUseCase(options.identityRepository, auditLogRepository),
    ),
    listAdminAuditLogsController: new ListAdminAuditLogsController(
      new ListAdminAuditLogsUseCase(
        options.identityRepository,
        permissionRepository,
        auditLogRepository,
      ),
    ),
    getAdminAuditLogController: new GetAdminAuditLogController(
      new GetAdminAuditLogUseCase(
        options.identityRepository,
        permissionRepository,
        auditLogRepository,
      ),
    ),
    exportAdminAuditLogsController: new ExportAdminAuditLogsController(
      new ExportAdminAuditLogsUseCase(
        options.identityRepository,
        permissionRepository,
        options.jobQueue,
      ),
    ),
    getAdminAuditExportController: new GetAdminAuditExportController(
      new GetAdminAuditExportUseCase(
        options.identityRepository,
        permissionRepository,
        options.objectStorage,
      ),
    ),
  };
}
