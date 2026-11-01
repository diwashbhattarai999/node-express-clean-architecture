import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type {
  IRoleRepository,
  Role,
  UpdateRoleData,
} from "@/modules/auth/authorization/application/ports/role.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { ValidationError } from "@/shared/errors/validation-error";

export type UpdateRoleInput = {
  userId: string;
  sessionId: string;
  roleId: string;
  name?: string;
  description?: string | null;
};

export class UpdateRoleUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: UpdateRoleInput): Promise<Role> {
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
      PermissionKey.ROLES_UPDATE,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const patch = toUpdateRoleData(input);

    if (patch.name === undefined && patch.description === undefined) {
      throw new ValidationError([
        {
          type: "field",
          path: "name",
          location: "body",
          message: "At least one of name or description is required.",
          value: undefined,
        },
      ]);
    }

    const role = await this.roleRepository.update(input.roleId, patch);

    if (!role) {
      throw new RoleNotFoundError();
    }

    return role;
  }
}

const toUpdateRoleData = (input: UpdateRoleInput): UpdateRoleData => {
  const patch: UpdateRoleData = {};

  if (input.name !== undefined) {
    patch.name = input.name.trim();
  }

  if (input.description !== undefined) {
    const trimmed = input.description?.trim() ?? null;
    patch.description = trimmed === "" ? null : trimmed;
  }

  return patch;
};
