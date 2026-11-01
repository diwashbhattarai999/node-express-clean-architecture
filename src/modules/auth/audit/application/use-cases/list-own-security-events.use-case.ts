import type {
  IAuditLogRepository,
  ListAuditLogsQuery,
  ListAuditLogsResult,
} from "@/modules/auth/audit/application/ports/audit-log.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListOwnSecurityEventsInput = {
  userId: string;
  sessionId: string;
} & Omit<ListAuditLogsQuery, "userId">;

export class ListOwnSecurityEventsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  public async execute(input: ListOwnSecurityEventsInput): Promise<ListAuditLogsResult> {
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

    return this.auditLogRepository.list({
      page: input.page,
      limit: input.limit,
      userId: input.userId,
      ...(input.eventType !== undefined ? { eventType: input.eventType } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
      ...(input.from !== undefined ? { from: input.from } : {}),
      ...(input.to !== undefined ? { to: input.to } : {}),
    });
  }
}
