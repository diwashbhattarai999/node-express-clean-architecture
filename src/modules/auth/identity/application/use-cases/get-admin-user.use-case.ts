import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type {
  IRoleRepository,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type {
  AdminUserDetails,
  IIdentityRepository,
} from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type GetAdminUserInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
};

export type GetAdminUserResult = AdminUserDetails & {
  roles: Role[];
};

export class GetAdminUserUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "findAdminDetails"
    >,
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: GetAdminUserInput): Promise<GetAdminUserResult> {
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
      PermissionKey.USERS_READ,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const details = await this.identityRepository.findAdminDetails(input.targetUserId);

    if (!details) {
      throw new UserNotFoundError();
    }

    const roles = await this.roleRepository.listForUser(input.targetUserId);

    return { ...details, roles };
  }
}
