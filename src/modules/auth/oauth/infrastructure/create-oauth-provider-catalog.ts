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
      tokenUrl: "https://oauth2.googleapis.com/token",
      userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      issuer: "https://accounts.google.com",
      scopes: ["openid", "email", "profile"],
      ...(env.OAUTH_GOOGLE_CLIENT_SECRET !== undefined
        ? { clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET }
        : {}),
    });
  }

  if (env.OAUTH_GITHUB_CLIENT_ID) {
    providers.set(OAuthProviderName.GITHUB, {
      name: OAuthProviderName.GITHUB,
      clientId: env.OAUTH_GITHUB_CLIENT_ID,
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userinfoUrl: "https://api.github.com/user",
      emailsUrl: "https://api.github.com/user/emails",
      issuer: "https://github.com",
      scopes: ["read:user", "user:email"],
      ...(env.OAUTH_GITHUB_CLIENT_SECRET !== undefined
        ? { clientSecret: env.OAUTH_GITHUB_CLIENT_SECRET }
        : {}),
    });
  }

  if (env.OAUTH_APPLE_CLIENT_ID) {
    providers.set(OAuthProviderName.APPLE, {
      name: OAuthProviderName.APPLE,
      clientId: env.OAUTH_APPLE_CLIENT_ID,
      authorizationUrl: "https://appleid.apple.com/auth/authorize",
      tokenUrl: "https://appleid.apple.com/auth/token",
      issuer: "https://appleid.apple.com",
      scopes: ["name", "email"],
      extraAuthorizationParams: { response_mode: "query" },
      ...(env.OAUTH_APPLE_CLIENT_SECRET !== undefined
        ? { clientSecret: env.OAUTH_APPLE_CLIENT_SECRET }
        : {}),
    });
  }

  if (env.OAUTH_MICROSOFT_CLIENT_ID) {
    providers.set(OAuthProviderName.MICROSOFT, {
      name: OAuthProviderName.MICROSOFT,
      clientId: env.OAUTH_MICROSOFT_CLIENT_ID,
      authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userinfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      issuer: "https://login.microsoftonline.com/common/v2.0",
      scopes: ["openid", "email", "profile"],
      ...(env.OAUTH_MICROSOFT_CLIENT_SECRET !== undefined
        ? { clientSecret: env.OAUTH_MICROSOFT_CLIENT_SECRET }
        : {}),
    });
  }

  if (env.OAUTH_OIDC_CLIENT_ID && env.OAUTH_OIDC_AUTHORIZATION_URL) {
    providers.set(OAuthProviderName.OIDC, {
      name: OAuthProviderName.OIDC,
      clientId: env.OAUTH_OIDC_CLIENT_ID,
      authorizationUrl: env.OAUTH_OIDC_AUTHORIZATION_URL,
      scopes: env.OAUTH_OIDC_SCOPES,
      ...(env.OAUTH_OIDC_CLIENT_SECRET !== undefined
        ? { clientSecret: env.OAUTH_OIDC_CLIENT_SECRET }
        : {}),
      ...(env.OAUTH_OIDC_TOKEN_URL !== undefined ? { tokenUrl: env.OAUTH_OIDC_TOKEN_URL } : {}),
      ...(env.OAUTH_OIDC_USERINFO_URL !== undefined
        ? { userinfoUrl: env.OAUTH_OIDC_USERINFO_URL }
        : {}),
      ...(env.OAUTH_OIDC_ISSUER !== undefined ? { issuer: env.OAUTH_OIDC_ISSUER } : {}),
    });
  }

  return {
    findByName: (name) => providers.get(name) ?? null,
  };
};
