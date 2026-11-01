import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type {
  IPermissionRepository,
  Permission,
} from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { ValidationError } from "@/shared/errors/validation-error";

export type AssignRolePermissionsInput = {
  userId: string;
  sessionId: string;
  roleId: string;
  permissionIds: string[];
};

export class AssignRolePermissionsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: AssignRolePermissionsInput): Promise<Permission[]> {
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

    const permissionIds = [...new Set(input.permissionIds)];
    const result = await this.permissionRepository.replaceForRole({
      roleId: input.roleId,
      permissionIds,
      assignedBy: input.userId,
    });

    switch (result.outcome) {
      case "role_not_found":
        throw new RoleNotFoundError();
      case "permissions_not_found":
        throw new ValidationError([
          {
            type: "field",
            path: "permissionIds",
            location: "body",
            message: "One or more permission ids were not found.",
            value: result.missingIds,
          },
        ]);
      case "replaced":
        return result.permissions;
    }
  }
}
