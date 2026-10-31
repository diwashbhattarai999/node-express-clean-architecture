import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type {
  IOauthAccountRepository,
  OAuthAccount,
} from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type ListOwnOAuthAccountsInput = {
  userId: string;
  sessionId: string;
};

export type ListOwnOAuthAccountsResult = {
  accounts: OAuthAccount[];
};

export class ListOwnOAuthAccountsUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly accountRepository: IOauthAccountRepository,
  ) {}

  public async execute(input: ListOwnOAuthAccountsInput): Promise<ListOwnOAuthAccountsResult> {
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

    const accounts = await this.accountRepository.listForUser(input.userId);

    return { accounts };
  }
}
