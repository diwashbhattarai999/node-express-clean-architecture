import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { normalizeRoleKey } from "@/modules/auth/authorization/application/constants/role-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleAlreadyExistsError } from "@/modules/auth/authorization/application/errors/role-already-exists.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type {
  IRoleRepository,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type CreateRoleInput = {
  userId: string;
  sessionId: string;
  key: string;
  name: string;
  description: string | null;
};

export class CreateRoleUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: CreateRoleInput): Promise<Role> {
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
      PermissionKey.ROLES_CREATE,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const key = normalizeRoleKey(input.key);
    const existing = await this.roleRepository.findByKey(key);

    if (existing) {
      throw new RoleAlreadyExistsError();
    }

    const description = input.description?.trim() || null;

    return this.roleRepository.create({
      key,
      name: input.name.trim(),
      description,
    });
  }
}
