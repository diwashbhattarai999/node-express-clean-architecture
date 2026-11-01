import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleAssignedError } from "@/modules/auth/authorization/application/errors/role-assigned.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type DeleteRoleInput = {
  userId: string;
  sessionId: string;
  roleId: string;
};

export class DeleteRoleUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: DeleteRoleInput): Promise<void> {
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
      PermissionKey.ROLES_DELETE,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const result = await this.roleRepository.deleteById(input.roleId);

    switch (result) {
      case "not_found":
        throw new RoleNotFoundError();
      case "assigned":
        throw new RoleAssignedError();
      case "deleted":
        return;
    }
  }
}
