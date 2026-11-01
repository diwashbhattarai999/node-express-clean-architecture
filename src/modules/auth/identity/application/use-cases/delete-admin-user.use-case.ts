import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type DeleteAdminUserInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
};

export class DeleteAdminUserUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "hardDeleteById"
    >,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: DeleteAdminUserInput): Promise<void> {
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
      PermissionKey.USERS_DELETE,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const result = await this.identityRepository.hardDeleteById(input.targetUserId);

    if (result === "not_found") {
      throw new UserNotFoundError();
    }
  }
}
