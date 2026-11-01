import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthUser, TUserStatus } from "@/modules/auth/shared/application/types/auth.types";

export type AdminUserStatusAction = "suspend" | "reactivate" | "disable" | "enable";

export type SetAdminUserStatusInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
  action: AdminUserStatusAction;
};

const STATUS_BY_ACTION: Record<
  AdminUserStatusAction,
  Extract<TUserStatus, "active" | "suspended" | "disabled">
> = {
  suspend: "suspended",
  reactivate: "active",
  disable: "disabled",
  enable: "active",
};

export class SetAdminUserStatusUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "setUserStatus"
    >,
    private readonly permissionRepository: IPermissionRepository,
    private readonly sessionRepository: Pick<ISessionRepository, "revokeAllSessionsForUser">,
  ) {}

  public async execute(input: SetAdminUserStatusInput): Promise<AuthUser> {
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
      PermissionKey.USERS_SUSPEND,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const user = await this.identityRepository.setUserStatus({
      userId: input.targetUserId,
      status: STATUS_BY_ACTION[input.action],
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    if (input.action === "suspend" || input.action === "disable") {
      await this.sessionRepository.revokeAllSessionsForUser(input.targetUserId);
    }

    return user;
  }
}
