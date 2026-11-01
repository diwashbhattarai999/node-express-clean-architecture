import type {
  IRoleRepository,
  Role,
} from "@/modules/auth/authorization/application/ports/role.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListOwnRolesInput = {
  userId: string;
  sessionId: string;
};

export type ListOwnRolesResult = {
  roles: Role[];
};

export class ListOwnRolesUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly roleRepository: IRoleRepository,
  ) {}

  public async execute(input: ListOwnRolesInput): Promise<ListOwnRolesResult> {
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

    const roles = await this.roleRepository.listForUser(input.userId);

    return { roles };
  }
}
