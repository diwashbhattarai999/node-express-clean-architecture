import { randomUUID } from "node:crypto";

import type {
  TAuditLogExportFormat,
  TSecurityEventOutcome,
  TSecurityEventType,
} from "@/modules/auth/audit/application/constants/security-events";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { JobName } from "@/shared/jobs/job-names";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type ExportAdminAuditLogsInput = {
  userId: string;
  sessionId: string;
  from: Date;
  to: Date;
  format: TAuditLogExportFormat;
  targetUserId?: string;
  eventType?: TSecurityEventType;
  outcome?: TSecurityEventOutcome;
};

export type ExportAdminAuditLogsResult = {
  exportId: string;
  status: "pending";
};

export class ExportAdminAuditLogsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly jobQueue: IJobQueue,
  ) {}

  public async execute(input: ExportAdminAuditLogsInput): Promise<ExportAdminAuditLogsResult> {
    const principal = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (principal.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        break;
    }

    const allowed = await this.permissionRepository.hasKeyForUser(
      input.userId,
      PermissionKey.AUDIT_LOGS_EXPORT,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const exportId = randomUUID();

    await this.jobQueue.enqueue(JobName.EXPORT_AUDIT_LOGS, {
      exportId,
      requestedBy: input.userId,
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      format: input.format,
      ...(input.targetUserId !== undefined ? { userId: input.targetUserId } : {}),
      ...(input.eventType !== undefined ? { eventType: input.eventType } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
    });

    return { exportId, status: "pending" };
  }
}
