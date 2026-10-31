import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthIntent, OAuthProviderName, OAuthResponseMode } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import { StartOAuthAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { ValidationError } from "@/shared/errors/validation-error";

describe("StartOAuthAuthorizationUseCase", () => {
  const providerCatalog: IOauthProviderCatalog = {
    findByName: vi.fn(),
  };

  const authorizationStateRepository: IOauthAuthorizationStateRepository = {
    save: vi.fn(),
    findActive: vi.fn(),
    consume: vi.fn(),
    consumeForExchange: vi.fn(),
  };

  const useCase = new StartOAuthAuthorizationUseCase(providerCatalog, authorizationStateRepository, {
    apiBaseUrl: "http://localhost:3000",
    frontendBaseUrl: "http://localhost:5173",
    allowedRedirectUris: ["myapp://oauth"],
    stateTtlSeconds: 600,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerCatalog.findByName).mockReturnValue({
      name: OAuthProviderName.GOOGLE,
      clientId: "google-client",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scopes: ["openid", "email", "profile"],
    });
    vi.mocked(authorizationStateRepository.save).mockResolvedValue();
  });

  it("builds an IdP URL and persists hashed state", async () => {
    const result = await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      redirectUri: "http://localhost:5173/auth/callback",
      state: "client-csrf",
      intent: OAuthIntent.LOGIN,
      responseMode: OAuthResponseMode.REDIRECT,
    });

    const authorizationUrl = new URL(result.authorizationUrl);

    expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(authorizationUrl.searchParams.get("client_id")).toBe("google-client");
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/v1/auth/oauth/google/callback",
    );
    expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorizationUrl.searchParams.get("state")).toHaveLength(43);
    expect(result.generatedCodeVerifier).toEqual(expect.any(String));
    expect(authorizationStateRepository.save).toHaveBeenCalledWith({
      stateHash: expect.any(String),
      provider: "google",
      intent: "login",
      redirectUri: "http://localhost:5173/auth/callback",
      clientState: "client-csrf",
      codeChallenge: authorizationUrl.searchParams.get("code_challenge"),
      codeChallengeMethod: "S256",
      expiresAt: expect.any(Date),
    });
  });

  it("reuses a client PKCE challenge and does not generate a verifier", async () => {
    const codeChallenge = "a".repeat(43);

    const result = await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      redirectUri: "http://localhost:5173/auth/callback",
      state: "client-csrf",
      intent: OAuthIntent.LOGIN,
      responseMode: OAuthResponseMode.JSON,
      codeChallenge,
      codeChallengeMethod: "S256",
    });

    expect(result.generatedCodeVerifier).toBeUndefined();
    expect(new URL(result.authorizationUrl).searchParams.get("code_challenge")).toBe(codeChallenge);
  });

  it("allows an exact extra redirect URI", async () => {
    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        redirectUri: "myapp://oauth",
        state: "client-csrf",
        intent: OAuthIntent.LOGIN,
        responseMode: OAuthResponseMode.JSON,
      }),
    ).resolves.toMatchObject({ responseMode: "json" });
  });

  it("rejects a redirect URI that is not allow-listed", async () => {
    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        redirectUri: "https://evil.example/callback",
        state: "client-csrf",
        intent: OAuthIntent.LOGIN,
        responseMode: OAuthResponseMode.REDIRECT,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(authorizationStateRepository.save).not.toHaveBeenCalled();
  });

  it("throws when the provider is not configured", async () => {
    vi.mocked(providerCatalog.findByName).mockReturnValue(null);

    await expect(
      useCase.execute({
        provider: OAuthProviderName.GITHUB,
        redirectUri: "http://localhost:5173/auth/callback",
        state: "client-csrf",
        intent: OAuthIntent.LOGIN,
        responseMode: OAuthResponseMode.REDIRECT,
      }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});
