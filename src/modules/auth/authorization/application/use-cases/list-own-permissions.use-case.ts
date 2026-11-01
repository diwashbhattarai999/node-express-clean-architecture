import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListOwnPermissionsInput = {
  userId: string;
  sessionId: string;
};

export type ListOwnPermissionsResult = {
  permissions: string[];
};

export class ListOwnPermissionsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: ListOwnPermissionsInput): Promise<ListOwnPermissionsResult> {
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

    const permissions = await this.permissionRepository.listKeysForUser(input.userId);

    return { permissions };
  }
}
