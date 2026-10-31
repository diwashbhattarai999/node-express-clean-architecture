import type { TEnv } from "@/config/env-schema";
import { CompleteOAuthSignIn } from "@/modules/auth/oauth/application/services/complete-oauth-sign-in";
import { ExchangeOAuthCodeUseCase } from "@/modules/auth/oauth/application/use-cases/exchange-oauth-code.use-case";
import { HandleOAuthCallbackUseCase } from "@/modules/auth/oauth/application/use-cases/handle-oauth-callback.use-case";
import { StartOAuthAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { createOAuthProviderCatalog } from "@/modules/auth/oauth/infrastructure/create-oauth-provider-catalog";
import { OauthProviderClient } from "@/modules/auth/oauth/infrastructure/oauth-provider-client";
import { PostgresOAuthAccountRepository } from "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-account.repository";
import { PostgresOAuthAuthorizationStateRepository } from "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-authorization-state.repository";
import { ExchangeOAuthCodeController } from "@/modules/auth/oauth/presentation/http/controllers/exchange-oauth-code.controller";
import { HandleOAuthCallbackController } from "@/modules/auth/oauth/presentation/http/controllers/handle-oauth-callback.controller";
import { StartOAuthAuthorizationController } from "@/modules/auth/oauth/presentation/http/controllers/start-oauth-authorization.controller";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type {
  AuthCookieOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";
import type { IHttpClient } from "@/shared/http-client/http-client.port";

export type CreateOAuthModuleOptions = {
  env: TEnv;
  httpClient: IHttpClient;
  sessionRepository: ISessionRepository;
  accessTokenSigner: IAccessTokenSigner;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type OAuthModule = {
  startOAuthAuthorizationController: StartOAuthAuthorizationController;
  handleOAuthCallbackController: HandleOAuthCallbackController;
  exchangeOAuthCodeController: ExchangeOAuthCodeController;
};

export function createOAuthModule(options: CreateOAuthModuleOptions): OAuthModule {
  const providerCatalog = createOAuthProviderCatalog(options.env);
  const authorizationStateRepository = new PostgresOAuthAuthorizationStateRepository();
  const accountRepository = new PostgresOAuthAccountRepository();
  const providerClient = new OauthProviderClient(options.httpClient);
  const completeOAuthSignIn = new CompleteOAuthSignIn(
    accountRepository,
    options.sessionRepository,
    options.accessTokenSigner,
    { refreshTokenTtlSeconds: options.sessionOptions.refreshTokenTtlSeconds },
  );

  const startOAuthAuthorizationUseCase = new StartOAuthAuthorizationUseCase(
    providerCatalog,
    authorizationStateRepository,
    {
      apiBaseUrl: options.env.BASE_URL,
      frontendBaseUrl: options.env.FRONTEND_BASE_URL,
      allowedRedirectUris: options.env.OAUTH_REDIRECT_URIS,
      stateTtlSeconds: options.env.AUTH_OAUTH_STATE_TTL_SECONDS,
    },
  );

  const handleOAuthCallbackUseCase = new HandleOAuthCallbackUseCase(
    providerCatalog,
    authorizationStateRepository,
    providerClient,
    completeOAuthSignIn,
    { apiBaseUrl: options.env.BASE_URL },
  );

  const exchangeOAuthCodeUseCase = new ExchangeOAuthCodeUseCase(
    providerCatalog,
    authorizationStateRepository,
    providerClient,
    completeOAuthSignIn,
    { apiBaseUrl: options.env.BASE_URL },
  );

  return {
    startOAuthAuthorizationController: new StartOAuthAuthorizationController(
      startOAuthAuthorizationUseCase,
      {
        secureCookies: options.cookieOptions.secureCookies,
        stateTtlSeconds: options.env.AUTH_OAUTH_STATE_TTL_SECONDS,
      },
    ),
    handleOAuthCallbackController: new HandleOAuthCallbackController(handleOAuthCallbackUseCase, {
      refreshTokenTtlSeconds: options.cookieOptions.refreshTokenTtlSeconds,
      secureCookies: options.cookieOptions.secureCookies,
    }),
    exchangeOAuthCodeController: new ExchangeOAuthCodeController(exchangeOAuthCodeUseCase, {
      refreshTokenTtlSeconds: options.cookieOptions.refreshTokenTtlSeconds,
      secureCookies: options.cookieOptions.secureCookies,
    }),
  };
}
