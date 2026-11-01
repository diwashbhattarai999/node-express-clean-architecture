import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import { RolePermissionNotFoundError } from "@/modules/auth/authorization/application/errors/role-permission-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type RemoveRolePermissionInput = {
  userId: string;
  sessionId: string;
  roleId: string;
  permissionId: string;
};

export class RemoveRolePermissionUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: RemoveRolePermissionInput): Promise<void> {
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
      PermissionKey.PERMISSIONS_ASSIGN,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const result = await this.permissionRepository.removeFromRole(input.roleId, input.permissionId);

    switch (result) {
      case "role_not_found":
        throw new RoleNotFoundError();
      case "assignment_not_found":
        throw new RolePermissionNotFoundError();
      case "removed":
        return;
    }
  }
}
