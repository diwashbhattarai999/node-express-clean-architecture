import type { TEnv } from "@/config/env-schema";
import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type {
  IOauthProviderCatalog,
  OAuthProviderDefinition,
} from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";

export const createOAuthProviderCatalog = (env: TEnv): IOauthProviderCatalog => {
  const providers = new Map<OAuthProviderDefinition["name"], OAuthProviderDefinition>();

  if (env.OAUTH_GOOGLE_CLIENT_ID) {
    providers.set(OAuthProviderName.GOOGLE, {
      name: OAuthProviderName.GOOGLE,
      clientId: env.OAUTH_GOOGLE_CLIENT_ID,
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scopes: ["openid", "email", "profile"],
    });
  }

  if (env.OAUTH_GITHUB_CLIENT_ID) {
    providers.set(OAuthProviderName.GITHUB, {
      name: OAuthProviderName.GITHUB,
      clientId: env.OAUTH_GITHUB_CLIENT_ID,
      authorizationUrl: "https://github.com/login/oauth/authorize",
      scopes: ["read:user", "user:email"],
    });
  }

  if (env.OAUTH_APPLE_CLIENT_ID) {
    providers.set(OAuthProviderName.APPLE, {
      name: OAuthProviderName.APPLE,
      clientId: env.OAUTH_APPLE_CLIENT_ID,
      authorizationUrl: "https://appleid.apple.com/auth/authorize",
      scopes: ["name", "email"],
      extraAuthorizationParams: { response_mode: "query" },
    });
  }

  if (env.OAUTH_MICROSOFT_CLIENT_ID) {
    providers.set(OAuthProviderName.MICROSOFT, {
      name: OAuthProviderName.MICROSOFT,
      clientId: env.OAUTH_MICROSOFT_CLIENT_ID,
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      scopes: ["openid", "email", "profile"],
    });
  }

  if (env.OAUTH_OIDC_CLIENT_ID && env.OAUTH_OIDC_AUTHORIZATION_URL) {
    providers.set(OAuthProviderName.OIDC, {
      name: OAuthProviderName.OIDC,
      clientId: env.OAUTH_OIDC_CLIENT_ID,
      authorizationUrl: env.OAUTH_OIDC_AUTHORIZATION_URL,
      scopes: env.OAUTH_OIDC_SCOPES,
    });
  }

  return {
    findByName: (name) => providers.get(name) ?? null,
  };
};
