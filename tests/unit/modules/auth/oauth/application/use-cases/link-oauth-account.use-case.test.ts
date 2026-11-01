import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { OAuthIntent, OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import { LinkOAuthAccountUseCase } from "@/modules/auth/oauth/application/use-cases/link-oauth-account.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("LinkOAuthAccountUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const providerCatalog: IOauthProviderCatalog = {
    findByName: vi.fn(),
    list: vi.fn(),
  };

  const authorizationStateRepository: IOauthAuthorizationStateRepository = {
    save: vi.fn(),
    findActive: vi.fn(),
    consume: vi.fn(),
    consumeForExchange: vi.fn(),
  };

  const accountRepository: IOauthAccountRepository = {
    findByProviderUser: vi.fn(),
    findEmailOwner: vi.fn(),
    listForUser: vi.fn(),
    createAccount: vi.fn(),
    recordSuccessfulLogin: vi.fn(),
    linkToUser: vi.fn(),
    unlinkFromUser: vi.fn(),
  };

  const providerClient: IOauthProviderClient = {
    exchangeAuthorizationCode: vi.fn(),
    fetchProfile: vi.fn(),
  };

  const useCase = new LinkOAuthAccountUseCase(
    identityRepository,
    providerCatalog,
    authorizationStateRepository,
    providerClient,
    accountRepository,
    { apiBaseUrl: "http://localhost:3000" },
  );

  const input = {
    userId: "user-1",
    sessionId: "session-1",
    provider: OAuthProviderName.GOOGLE,
    code: "auth-code",
    redirectUri: "http://localhost:5173/settings/linked",
    state: "client-csrf",
    codeVerifier: "a".repeat(43),
  };

  const googleProvider = {
    name: OAuthProviderName.GOOGLE,
    clientId: "google-client",
    clientSecret: "google-secret",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    issuer: "https://accounts.google.com",
    scopes: ["openid", "email", "profile"],
  };

  const linkedAccount = {
    id: "ext-1",
    provider: "google",
    providerEmail: "ada@example.com",
    linkedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastUsedAt: new Date("2026-01-01T00:00:00.000Z"),
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
    vi.mocked(providerCatalog.findByName).mockReturnValue(googleProvider);
    vi.mocked(authorizationStateRepository.consumeForExchange).mockResolvedValue({
      provider: OAuthProviderName.GOOGLE,
      intent: OAuthIntent.LINK,
      redirectUri: input.redirectUri,
      clientState: input.state,
      userId: "user-1",
    });
    vi.mocked(providerClient.exchangeAuthorizationCode).mockResolvedValue({
      accessToken: "idp-access",
    });
    vi.mocked(providerClient.fetchProfile).mockResolvedValue({
      providerUserId: "google-sub-1",
      issuer: "https://accounts.google.com",
      email: "ada@example.com",
      emailVerified: true,
      displayName: "Ada Lovelace",
      avatarUrl: null,
    });
    vi.mocked(accountRepository.linkToUser).mockResolvedValue(linkedAccount);
  });

  it("links the provider subject to the authenticated user", async () => {
    await expect(useCase.execute(input)).resolves.toEqual(linkedAccount);

    expect(authorizationStateRepository.consumeForExchange).toHaveBeenCalledWith({
      provider: "google",
      clientState: "client-csrf",
      redirectUri: input.redirectUri,
      intent: OAuthIntent.LINK,
      userId: "user-1",
    });
    expect(providerClient.exchangeAuthorizationCode).toHaveBeenCalledWith({
      definition: googleProvider,
      code: "auth-code",
      codeVerifier: input.codeVerifier,
      redirectUri: "http://localhost:3000/api/v1/auth/oauth/google/callback",
    });
    expect(accountRepository.linkToUser).toHaveBeenCalledWith({
      userId: "user-1",
      provider: "google",
      providerUserId: "google-sub-1",
      issuer: "https://accounts.google.com",
      providerEmail: "ada@example.com",
      providerEmailVerified: true,
    });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenInvalidError);
    expect(authorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });

  it("throws when the PKCE verifier is missing", async () => {
    const { codeVerifier: _codeVerifier, ...withoutVerifier } = input;

    await expect(useCase.execute(withoutVerifier)).rejects.toBeInstanceOf(OAuthStateInvalidError);
    expect(authorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });

  it("throws when no pending link state matches", async () => {
    vi.mocked(authorizationStateRepository.consumeForExchange).mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(OAuthStateInvalidError);
    expect(providerClient.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("throws when the provider has no token credentials", async () => {
    const { clientSecret: _clientSecret, tokenUrl: _tokenUrl, ...authorizeOnly } = googleProvider;
    vi.mocked(providerCatalog.findByName).mockReturnValue(authorizeOnly);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
    expect(authorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });
});
