import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthAccountNotFoundError } from "@/modules/auth/oauth/application/errors/oauth-account-not-found.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type UnlinkOAuthAccountInput = {
  userId: string;
  sessionId: string;
  provider: TOauthProviderName;
};

export class UnlinkOAuthAccountUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly accountRepository: IOauthAccountRepository,
  ) {}

  public async execute(input: UnlinkOAuthAccountInput): Promise<void> {
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

    const result = await this.accountRepository.unlinkFromUser(input.userId, input.provider);

    switch (result.outcome) {
      case "not_found":
        throw new OAuthAccountNotFoundError();
      case "last_auth_method":
        throw new LastAuthMethodError();
      case "removed":
        return;
    }
  }
}
