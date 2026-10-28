import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

export type GetMeResult = {
  user: AuthUser;
  roles: string[];
  /** Permission keys; empty until RBAC permission tables/APIs land. */
  permissions: string[];
};

export type GetMeInput = {
  userId: string;
  sessionId: string;
};

export class GetMeUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: GetMeInput): Promise<GetMeResult> {
    const result = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (result.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        return {
          user: result.user,
          roles: result.roles,
          permissions: [],
        };
    }
  }
}
