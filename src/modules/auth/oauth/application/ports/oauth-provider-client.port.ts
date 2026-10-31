import type { OAuthProviderDefinition } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";

export type ExchangeOAuthCodeInput = {
  definition: OAuthProviderDefinition;
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

export type OAuthProviderTokens = {
  accessToken: string;
  idToken?: string;
};

export type OAuthProviderProfile = {
  providerUserId: string;
  issuer: string | null;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
};

export interface IOauthProviderClient {
  exchangeAuthorizationCode(input: ExchangeOAuthCodeInput): Promise<OAuthProviderTokens>;
  fetchProfile(
    definition: OAuthProviderDefinition,
    tokens: OAuthProviderTokens,
  ): Promise<OAuthProviderProfile>;
}
