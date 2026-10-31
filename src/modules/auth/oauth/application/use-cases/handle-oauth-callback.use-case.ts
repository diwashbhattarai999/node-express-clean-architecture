import { OAuthIntent } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { HandleOAuthCallbackDto } from "@/modules/auth/oauth/application/dto/handle-oauth-callback.dto";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import type { CompleteOAuthSignIn } from "@/modules/auth/oauth/application/services/complete-oauth-sign-in";
import { buildOAuthCallbackUrl } from "@/modules/auth/oauth/application/utils/oauth-callback-url";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type HandleOAuthCallbackOptions = {
  apiBaseUrl: string;
};

export type HandleOAuthCallbackSessionResult = {
  outcome: "session";
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
  redirectUri: string;
  clientState: string;
};

export type HandleOAuthCallbackHandoffResult = {
  outcome: "handoff";
  code: string;
  redirectUri: string;
  clientState: string;
};

export type HandleOAuthCallbackResult =
  | HandleOAuthCallbackSessionResult
  | HandleOAuthCallbackHandoffResult;

export type HandleOAuthCallbackMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class HandleOAuthCallbackUseCase {
  public constructor(
    private readonly providerCatalog: IOauthProviderCatalog,
    private readonly authorizationStateRepository: IOauthAuthorizationStateRepository,
    private readonly providerClient: IOauthProviderClient,
    private readonly completeOAuthSignIn: CompleteOAuthSignIn,
    private readonly options: HandleOAuthCallbackOptions,
  ) {}

  public async execute(
    dto: HandleOAuthCallbackDto,
    meta: HandleOAuthCallbackMeta = {},
  ): Promise<HandleOAuthCallbackResult> {
    const provider = this.providerCatalog.findByName(dto.provider);

    if (!provider?.tokenUrl || provider.clientSecret === undefined) {
      throw new OAuthProviderUnavailableError();
    }

    if (dto.error !== undefined) {
      if (dto.state !== undefined) {
        await this.authorizationStateRepository.consume({
          stateHash: hashToken(dto.state),
          provider: dto.provider,
        });
      }

      throw new OAuthStateInvalidError(
        dto.errorDescription ?? "The OAuth provider rejected the authorization request.",
      );
    }

    if (dto.code === undefined || dto.state === undefined) {
      throw new OAuthStateInvalidError();
    }

    const stateLookup = {
      stateHash: hashToken(dto.state),
      provider: dto.provider,
    };

    if (dto.codeVerifier === undefined) {
      const pending = await this.authorizationStateRepository.findActive(stateLookup);

      if (!pending) {
        throw new OAuthStateInvalidError();
      }

      if (pending.intent !== OAuthIntent.LOGIN) {
        throw new OAuthStateInvalidError("OAuth linking is not completed on the login callback.");
      }

      return {
        outcome: "handoff",
        code: dto.code,
        redirectUri: pending.redirectUri,
        clientState: pending.clientState,
      };
    }

    const consumed = await this.authorizationStateRepository.consume(stateLookup);

    if (!consumed) {
      throw new OAuthStateInvalidError();
    }

    if (consumed.intent !== OAuthIntent.LOGIN) {
      throw new OAuthStateInvalidError("OAuth linking is not completed on the login callback.");
    }

    const tokens = await this.providerClient.exchangeAuthorizationCode({
      definition: provider,
      code: dto.code,
      codeVerifier: dto.codeVerifier,
      redirectUri: buildOAuthCallbackUrl(this.options.apiBaseUrl, dto.provider),
    });

    const profile = await this.providerClient.fetchProfile(provider, tokens);
    const signedIn = await this.completeOAuthSignIn.execute(dto.provider, profile, meta);

    return {
      outcome: "session",
      ...signedIn,
      redirectUri: consumed.redirectUri,
      clientState: consumed.clientState,
    };
  }
}
