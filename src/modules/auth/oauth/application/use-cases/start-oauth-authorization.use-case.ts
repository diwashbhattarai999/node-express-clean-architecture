import type { StartOAuthAuthorizationDto } from "@/modules/auth/oauth/application/dto/start-oauth-authorization.dto";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import {
  generateCodeVerifier,
  generateOAuthState,
  toS256CodeChallenge,
} from "@/modules/auth/oauth/application/utils/generate-pkce";
import { isAllowedOAuthRedirectUri } from "@/modules/auth/oauth/application/utils/is-allowed-oauth-redirect-uri";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ValidationError } from "@/shared/errors/validation-error";

export type StartOAuthAuthorizationOptions = {
  apiBaseUrl: string;
  frontendBaseUrl: string;
  allowedRedirectUris: readonly string[];
  stateTtlSeconds: number;
};

export type StartOAuthAuthorizationResult = {
  authorizationUrl: string;
  responseMode: StartOAuthAuthorizationDto["responseMode"];
  generatedCodeVerifier?: string;
};

const callbackUrl = (apiBaseUrl: string, provider: string): string =>
  `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/auth/oauth/${provider}/callback`;

const buildAuthorizationUrl = (
  definition: {
    clientId: string;
    authorizationUrl: string;
    scopes: string[];
    extraAuthorizationParams?: Record<string, string>;
  },
  params: {
    redirectUri: string;
    state: string;
    codeChallenge: string;
  },
): string => {
  const url = new URL(definition.authorizationUrl);
  url.searchParams.set("client_id", definition.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (definition.scopes.length > 0) {
    url.searchParams.set("scope", definition.scopes.join(" "));
  }

  for (const [key, value] of Object.entries(definition.extraAuthorizationParams ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
};

export class StartOAuthAuthorizationUseCase {
  public constructor(
    private readonly providerCatalog: IOauthProviderCatalog,
    private readonly authorizationStateRepository: IOauthAuthorizationStateRepository,
    private readonly options: StartOAuthAuthorizationOptions,
  ) {}

  public async execute(input: StartOAuthAuthorizationDto): Promise<StartOAuthAuthorizationResult> {
    const provider = this.providerCatalog.findByName(input.provider);

    if (!provider) {
      throw new OAuthProviderUnavailableError();
    }

    if (
      !isAllowedOAuthRedirectUri(
        input.redirectUri,
        this.options.allowedRedirectUris,
        this.options.frontendBaseUrl,
      )
    ) {
      throw new ValidationError([
        {
          type: "field",
          path: "redirectUri",
          location: "query",
          message: "Redirect URI is not allow-listed.",
          value: input.redirectUri,
        },
      ]);
    }

    const oauthState = generateOAuthState();
    let codeChallenge = input.codeChallenge;
    let generatedCodeVerifier: string | undefined;

    if (codeChallenge === undefined) {
      generatedCodeVerifier = generateCodeVerifier();
      codeChallenge = toS256CodeChallenge(generatedCodeVerifier);
    }

    const expiresAt = new Date(Date.now() + this.options.stateTtlSeconds * 1000);

    await this.authorizationStateRepository.save({
      stateHash: hashToken(oauthState),
      provider: input.provider,
      intent: input.intent,
      redirectUri: input.redirectUri,
      clientState: input.state,
      codeChallenge,
      codeChallengeMethod: "S256",
      expiresAt,
    });

    const authorizationUrl = buildAuthorizationUrl(provider, {
      redirectUri: callbackUrl(this.options.apiBaseUrl, input.provider),
      state: oauthState,
      codeChallenge,
    });

    return {
      authorizationUrl,
      responseMode: input.responseMode,
      ...(generatedCodeVerifier !== undefined ? { generatedCodeVerifier } : {}),
    };
  }
}
