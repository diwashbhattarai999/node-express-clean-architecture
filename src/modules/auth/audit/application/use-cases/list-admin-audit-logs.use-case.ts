import type {
  IAuditLogRepository,
  ListAuditLogsQuery,
  ListAuditLogsResult,
} from "@/modules/auth/audit/application/ports/audit-log.repository";
import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListAdminAuditLogsInput = {
  userId: string;
  sessionId: string;
  page: number;
  limit: number;
  targetUserId?: string;
} & Omit<ListAuditLogsQuery, "userId" | "page" | "limit">;

export class ListAdminAuditLogsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  public async execute(input: ListAdminAuditLogsInput): Promise<ListAuditLogsResult> {
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
      PermissionKey.AUDIT_LOGS_READ,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    return this.auditLogRepository.list({
      page: input.page,
      limit: input.limit,
      ...(input.targetUserId !== undefined ? { userId: input.targetUserId } : {}),
      ...(input.eventType !== undefined ? { eventType: input.eventType } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
      ...(input.from !== undefined ? { from: input.from } : {}),
      ...(input.to !== undefined ? { to: input.to } : {}),
    });
  }
}
