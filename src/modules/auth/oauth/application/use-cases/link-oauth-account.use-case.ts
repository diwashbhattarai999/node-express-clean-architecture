import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { OAuthIntent } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { LinkOAuthAccountDto } from "@/modules/auth/oauth/application/dto/link-oauth-account.dto";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type {
  IOauthAccountRepository,
  OAuthAccount,
} from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import { buildOAuthCallbackUrl } from "@/modules/auth/oauth/application/utils/oauth-callback-url";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type LinkOAuthAccountOptions = {
  apiBaseUrl: string;
};

const normalizeEmail = (value: string | null): string | null => {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 && normalized.includes("@") ? normalized : null;
};

export class LinkOAuthAccountUseCase {
  public constructor(
    private readonly identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal">,
    private readonly providerCatalog: IOauthProviderCatalog,
    private readonly authorizationStateRepository: IOauthAuthorizationStateRepository,
    private readonly providerClient: IOauthProviderClient,
    private readonly accountRepository: IOauthAccountRepository,
    private readonly options: LinkOAuthAccountOptions,
  ) {}

  public async execute(input: LinkOAuthAccountDto): Promise<OAuthAccount> {
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

    if (input.codeVerifier === undefined) {
      throw new OAuthStateInvalidError(
        "A PKCE code verifier is required to complete OAuth linking.",
      );
    }

    const provider = this.providerCatalog.findByName(input.provider);

    if (!provider?.tokenUrl || provider.clientSecret === undefined) {
      throw new OAuthProviderUnavailableError();
    }

    const consumed = await this.authorizationStateRepository.consumeForExchange({
      provider: input.provider,
      clientState: input.state,
      redirectUri: input.redirectUri,
      intent: OAuthIntent.LINK,
      userId: input.userId,
    });

    if (!consumed || consumed.intent !== OAuthIntent.LINK || consumed.userId !== input.userId) {
      throw new OAuthStateInvalidError();
    }

    const tokens = await this.providerClient.exchangeAuthorizationCode({
      definition: provider,
      code: input.code,
      codeVerifier: input.codeVerifier,
      redirectUri: buildOAuthCallbackUrl(this.options.apiBaseUrl, input.provider),
    });

    const profile = await this.providerClient.fetchProfile(provider, tokens);
    const email = normalizeEmail(profile.email);

    return this.accountRepository.linkToUser({
      userId: input.userId,
      provider: input.provider,
      providerUserId: profile.providerUserId,
      providerEmailVerified: profile.emailVerified,
      ...(profile.issuer !== null ? { issuer: profile.issuer } : {}),
      ...(email !== null ? { providerEmail: email } : {}),
    });
  }
}
