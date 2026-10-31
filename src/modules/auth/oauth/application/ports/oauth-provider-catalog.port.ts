import type { TOauthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";

export type OAuthProviderDefinition = {
  name: TOauthProviderName;
  clientId: string;
  authorizationUrl: string;
  scopes: string[];
  extraAuthorizationParams?: Record<string, string>;
};

export interface IOauthProviderCatalog {
  findByName(name: TOauthProviderName): OAuthProviderDefinition | null;
}
