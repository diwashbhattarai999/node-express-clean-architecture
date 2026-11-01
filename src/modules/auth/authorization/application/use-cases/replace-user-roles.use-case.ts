import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type {
  IRoleRepository,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { ValidationError } from "@/shared/errors/validation-error";

export type ReplaceUserRolesUseCaseInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
  roleIds: string[];
};

export class ReplaceUserRolesUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "existsById"
    >,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: ReplaceUserRolesUseCaseInput): Promise<Role[]> {
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

    const roleIds = [...new Set(input.roleIds)];
    const result = await this.roleRepository.replaceForUser({
      userId: input.targetUserId,
      roleIds,
      assignedBy: input.userId,
    });

    switch (result.outcome) {
      case "roles_not_found":
        throw new ValidationError([
          {
            type: "field",
            path: "roleIds",
            location: "body",
            message: "One or more role ids were not found.",
            value: result.missingIds,
          },
        ]);
      case "replaced":
        return result.roles;
    }
  }
}
