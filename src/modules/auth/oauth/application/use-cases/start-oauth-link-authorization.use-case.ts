import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import {
  OAuthIntent,
  type TOauthProviderName,
  type TOauthResponseMode,
} from "@/modules/auth/oauth/application/constants/oauth-providers";
import type {
  StartOAuthAuthorizationResult,
  StartOAuthAuthorizationUseCase,
} from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type StartOAuthLinkAuthorizationInput = {
  userId: string;
  sessionId: string;
  provider: TOauthProviderName;
  redirectUri: string;
  state: string;
  responseMode: TOauthResponseMode;
  codeChallenge?: string;
  codeChallengeMethod?: "S256";
};

export class StartOAuthLinkAuthorizationUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly startOAuthAuthorizationUseCase: StartOAuthAuthorizationUseCase,
  ) {}

  public async execute(
    input: StartOAuthLinkAuthorizationInput,
  ): Promise<StartOAuthAuthorizationResult> {
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

    return this.startOAuthAuthorizationUseCase.execute({
      provider: input.provider,
      redirectUri: input.redirectUri,
      state: input.state,
      intent: OAuthIntent.LINK,
      responseMode: input.responseMode,
      userId: input.userId,
      ...(input.codeChallenge !== undefined ? { codeChallenge: input.codeChallenge } : {}),
      ...(input.codeChallengeMethod !== undefined
        ? { codeChallengeMethod: input.codeChallengeMethod }
        : {}),
    });
  }
}
