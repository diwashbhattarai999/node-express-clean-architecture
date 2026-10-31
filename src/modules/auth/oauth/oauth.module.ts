import type { TEnv } from "@/config/env-schema";
import { StartOAuthAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { createOAuthProviderCatalog } from "@/modules/auth/oauth/infrastructure/create-oauth-provider-catalog";
import { PostgresOAuthAuthorizationStateRepository } from "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-authorization-state.repository";
import { StartOAuthAuthorizationController } from "@/modules/auth/oauth/presentation/http/controllers/start-oauth-authorization.controller";

export type CreateOAuthModuleOptions = {
  env: TEnv;
  secureCookies: boolean;
};

export type OAuthModule = {
  startOAuthAuthorizationController: StartOAuthAuthorizationController;
};

export function createOAuthModule(options: CreateOAuthModuleOptions): OAuthModule {
  const startOAuthAuthorizationUseCase = new StartOAuthAuthorizationUseCase(
    createOAuthProviderCatalog(options.env),
    new PostgresOAuthAuthorizationStateRepository(),
    {
      apiBaseUrl: options.env.BASE_URL,
      frontendBaseUrl: options.env.FRONTEND_BASE_URL,
      allowedRedirectUris: options.env.OAUTH_REDIRECT_URIS,
      stateTtlSeconds: options.env.AUTH_OAUTH_STATE_TTL_SECONDS,
    },
  );

  return {
    startOAuthAuthorizationController: new StartOAuthAuthorizationController(
      startOAuthAuthorizationUseCase,
      {
        secureCookies: options.secureCookies,
        stateTtlSeconds: options.env.AUTH_OAUTH_STATE_TTL_SECONDS,
      },
    ),
  };
}
