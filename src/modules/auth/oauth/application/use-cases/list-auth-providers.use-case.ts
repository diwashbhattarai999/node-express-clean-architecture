import {
  OAUTH_PROVIDER_NAMES,
  OAuthProviderName,
} from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import {
  AUTH_PROVIDER_PUBLIC_LABELS,
  type AuthProviderPublic,
} from "@/modules/auth/oauth/application/types/auth-provider-public";

export type ListAuthProvidersResult = {
  providers: AuthProviderPublic[];
};

export class ListAuthProvidersUseCase {
  public constructor(private readonly providerCatalog: IOauthProviderCatalog) {}

  public execute(): ListAuthProvidersResult {
    const enabledOauth = new Set(this.providerCatalog.list().map((provider) => provider.name));

    const oauthProviders: AuthProviderPublic[] = OAUTH_PROVIDER_NAMES.map((id) => ({
      id,
      name: AUTH_PROVIDER_PUBLIC_LABELS[id],
      type: id === OAuthProviderName.OIDC ? "oidc" : "oauth",
      enabled: enabledOauth.has(id),
    }));

    return {
      providers: [
        { id: "password", name: "Password", type: "password", enabled: true },
        ...oauthProviders,
        { id: "magic_link", name: "Magic link", type: "magic_link", enabled: true },
      ],
    };
  }
}
