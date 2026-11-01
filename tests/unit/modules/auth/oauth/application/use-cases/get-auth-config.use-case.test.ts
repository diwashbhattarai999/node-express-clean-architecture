import { describe, expect, it, vi } from "vitest";

import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { GetAuthConfigUseCase } from "@/modules/auth/oauth/application/use-cases/get-auth-config.use-case";
import { ListAuthProvidersUseCase } from "@/modules/auth/oauth/application/use-cases/list-auth-providers.use-case";
import { AUTH_PASSWORD_POLICY } from "@/modules/auth/shared/application/constants/password-policy";

describe("GetAuthConfigUseCase", () => {
  it("returns password policy, feature flags, and the public provider catalog", () => {
    const providerCatalog: IOauthProviderCatalog = {
      findByName: vi.fn(),
      list: vi.fn().mockReturnValue([
        {
          name: OAuthProviderName.GOOGLE,
          clientId: "google-client",
          authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          scopes: ["openid", "email", "profile"],
        },
      ]),
    };

    const useCase = new GetAuthConfigUseCase(new ListAuthProvidersUseCase(providerCatalog));
    const result = useCase.execute();

    expect(result.passwordPolicy).toEqual(AUTH_PASSWORD_POLICY);
    expect(result.features).toEqual({
      registration: true,
      oauth: true,
      magicLink: true,
      mfa: true,
      passkeys: false,
      phoneAuth: true,
    });
    expect(result.providers.find((provider) => provider.id === "google")?.enabled).toBe(true);
  });
});
