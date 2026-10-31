import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthLoginIdentity } from "@/modules/auth/shared/application/types/auth.types";

export type ListOwnIdentitiesInput = {
  userId: string;
  sessionId: string;
};

export type ListOwnIdentitiesResult = {
  identities: AuthLoginIdentity[];
};

export class ListOwnIdentitiesUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: ListOwnIdentitiesInput): Promise<ListOwnIdentitiesResult> {
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

    const identities = await this.identityRepository.listIdentitiesForUser(input.userId);

    return { identities };
  }
}
