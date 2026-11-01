import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { OAuthIntent, OAuthProviderName, OAuthResponseMode } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import { StartOAuthAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { StartOAuthLinkAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-link-authorization.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("StartOAuthLinkAuthorizationUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const providerCatalog: IOauthProviderCatalog = {
    findByName: vi.fn(),
  };

  const authorizationStateRepository: IOauthAuthorizationStateRepository = {
    save: vi.fn(),
    findActive: vi.fn(),
    consume: vi.fn(),
    consumeForExchange: vi.fn(),
  };

  const startOAuthAuthorizationUseCase = new StartOAuthAuthorizationUseCase(
    providerCatalog,
    authorizationStateRepository,
    {
      apiBaseUrl: "http://localhost:3000",
      frontendBaseUrl: "http://localhost:5173",
      allowedRedirectUris: ["myapp://oauth"],
      stateTtlSeconds: 600,
    },
  );

  const useCase = new StartOAuthLinkAuthorizationUseCase(
    identityRepository,
    startOAuthAuthorizationUseCase,
  );

  const input = {
    userId: "user-1",
    sessionId: "session-1",
    provider: OAuthProviderName.GOOGLE,
    redirectUri: "http://localhost:5173/settings/linked",
    state: "client-csrf",
    responseMode: OAuthResponseMode.JSON,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
      user: {
        id: "user-1",
        status: "active",
        displayName: "Ada",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    vi.mocked(providerCatalog.findByName).mockReturnValue({
      name: OAuthProviderName.GOOGLE,
      clientId: "google-client",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scopes: ["openid", "email", "profile"],
    });
    vi.mocked(authorizationStateRepository.save).mockResolvedValue();
  });

  it("starts authorize with intent=link and the authenticated userId", async () => {
    const result = await useCase.execute(input);

    expect(result.authorizationUrl).toContain("accounts.google.com");
    expect(authorizationStateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        intent: OAuthIntent.LINK,
        redirectUri: input.redirectUri,
        clientState: input.state,
        userId: "user-1",
      }),
    );
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenInvalidError);
    expect(authorizationStateRepository.save).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenExpiredError);
    expect(authorizationStateRepository.save).not.toHaveBeenCalled();
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenRevokedError);
    expect(authorizationStateRepository.save).not.toHaveBeenCalled();
  });
});
