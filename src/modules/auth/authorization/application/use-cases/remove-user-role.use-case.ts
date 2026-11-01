import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import { UserRoleNotFoundError } from "@/modules/auth/authorization/application/errors/user-role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type RemoveUserRoleInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
  roleId: string;
};

export class RemoveUserRoleUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "existsById"
    >,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: RemoveUserRoleInput): Promise<void> {
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
      PermissionKey.ROLES_ASSIGN,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const exists = await this.identityRepository.existsById(input.targetUserId);

    if (!exists) {
      throw new UserNotFoundError();
    }

    const result = await this.roleRepository.removeFromUser(input.targetUserId, input.roleId);

    switch (result) {
      case "role_not_found":
        throw new RoleNotFoundError();
      case "assignment_not_found":
        throw new UserRoleNotFoundError();
      case "removed":
        return;
    }
  }
}
