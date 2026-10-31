import { OAuthIntent } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { ExchangeOAuthCodeDto } from "@/modules/auth/oauth/application/dto/exchange-oauth-code.dto";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import type {
  CompleteOAuthSignIn,
  CompleteOAuthSignInResult,
} from "@/modules/auth/oauth/application/services/complete-oauth-sign-in";
import { buildOAuthCallbackUrl } from "@/modules/auth/oauth/application/utils/oauth-callback-url";

export type ExchangeOAuthCodeOptions = {
  apiBaseUrl: string;
};

export type ExchangeOAuthCodeResult = CompleteOAuthSignInResult;

export type ExchangeOAuthCodeMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class ExchangeOAuthCodeUseCase {
  public constructor(
    private readonly providerCatalog: IOauthProviderCatalog,
    private readonly authorizationStateRepository: IOauthAuthorizationStateRepository,
    private readonly providerClient: IOauthProviderClient,
    private readonly completeOAuthSignIn: CompleteOAuthSignIn,
    private readonly options: ExchangeOAuthCodeOptions,
  ) {}

  public async execute(
    dto: ExchangeOAuthCodeDto,
    meta: ExchangeOAuthCodeMeta = {},
  ): Promise<ExchangeOAuthCodeResult> {
    const provider = this.providerCatalog.findByName(dto.provider);

    if (!provider?.tokenUrl || provider.clientSecret === undefined) {
      throw new OAuthProviderUnavailableError();
    }

    const consumed = await this.authorizationStateRepository.consumeForExchange({
      provider: dto.provider,
      clientState: dto.state,
      redirectUri: dto.redirectUri,
    });

    if (!consumed) {
      throw new OAuthStateInvalidError();
    }

    if (consumed.intent !== OAuthIntent.LOGIN) {
      throw new OAuthStateInvalidError("OAuth linking is not completed on the login exchange.");
    }

    const tokens = await this.providerClient.exchangeAuthorizationCode({
      definition: provider,
      code: dto.code,
      codeVerifier: dto.codeVerifier,
      redirectUri: buildOAuthCallbackUrl(this.options.apiBaseUrl, dto.provider),
    });

    const profile = await this.providerClient.fetchProfile(provider, tokens);

    return this.completeOAuthSignIn.execute(dto.provider, profile, meta);
  }
}
