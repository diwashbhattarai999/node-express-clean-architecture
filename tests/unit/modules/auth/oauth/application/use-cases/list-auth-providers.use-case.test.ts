import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import { ListAuthProvidersUseCase } from "@/modules/auth/oauth/application/use-cases/list-auth-providers.use-case";

describe("ListAuthProvidersUseCase", () => {
  const providerCatalog: IOauthProviderCatalog = {
    findByName: vi.fn(),
    list: vi.fn(),
  };

  const useCase = new ListAuthProvidersUseCase(providerCatalog);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerCatalog.list).mockReturnValue([
      {
        name: OAuthProviderName.GOOGLE,
        clientId: "google-client",
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        scopes: ["openid", "email", "profile"],
      },
    ]);
  });

  it("enables password, magic link, and configured OAuth providers", () => {
    expect(useCase.execute()).toEqual({
      providers: [
        { id: "password", name: "Password", type: "password", enabled: true },
        { id: "google", name: "Google", type: "oauth", enabled: true },
        { id: "github", name: "GitHub", type: "oauth", enabled: false },
        { id: "apple", name: "Apple", type: "oauth", enabled: false },
        { id: "microsoft", name: "Microsoft", type: "oauth", enabled: false },
        { id: "oidc", name: "OIDC", type: "oidc", enabled: false },
        { id: "magic_link", name: "Magic link", type: "magic_link", enabled: true },
      ],
    });
  });

  it("disables every OAuth provider when the catalog is empty", () => {
    vi.mocked(providerCatalog.list).mockReturnValue([]);

    const { providers } = useCase.execute();

    expect(providers.find((provider) => provider.id === "password")?.enabled).toBe(true);
    expect(providers.filter((provider) => provider.type === "oauth" || provider.type === "oidc")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "google", enabled: false }),
        expect.objectContaining({ id: "oidc", enabled: false }),
      ]),
    );
    expect(providers.find((provider) => provider.id === "magic_link")?.enabled).toBe(true);
  });
});
