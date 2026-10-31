import { IdentityNotFoundError } from "@/modules/auth/identity/application/errors/identity-not-found.error";
import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type RemoveEmailInput = {
  userId: string;
  sessionId: string;
  identityId: string;
};

export class RemoveEmailUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: RemoveEmailInput): Promise<void> {
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

    const result = await this.identityRepository.removeEmailIdentity({
      userId: input.userId,
      identityId: input.identityId,
    });

    switch (result.outcome) {
      case "not_found":
        throw new IdentityNotFoundError();
      case "last_auth_method":
        throw new LastAuthMethodError();
      case "removed":
        return;
    }
  }
}
