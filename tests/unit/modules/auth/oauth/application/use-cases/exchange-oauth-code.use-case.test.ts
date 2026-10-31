import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthIntent, OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import { CompleteOAuthSignIn } from "@/modules/auth/oauth/application/services/complete-oauth-sign-in";
import { ExchangeOAuthCodeUseCase } from "@/modules/auth/oauth/application/use-cases/exchange-oauth-code.use-case";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { ErrorCode } from "@/shared/errors/error-code";

describe("ExchangeOAuthCodeUseCase", () => {
  const providerCatalog: IOauthProviderCatalog = {
    findByName: vi.fn(),
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
    createAccount: vi.fn(),
    recordSuccessfulLogin: vi.fn(),
  };

  const providerClient: IOauthProviderClient = {
    exchangeAuthorizationCode: vi.fn(),
    fetchProfile: vi.fn(),
  };

  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    revokeOtherSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
    revokeSessionForUser: vi.fn(),
  };

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  const useCase = new ExchangeOAuthCodeUseCase(
    providerCatalog,
    authorizationStateRepository,
    providerClient,
    new CompleteOAuthSignIn(accountRepository, sessionRepository, accessTokenSigner, {
      refreshTokenTtlSeconds: 2_592_000,
    }),
    { apiBaseUrl: "http://localhost:3000" },
  );

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

  const activeUser = {
    id: "user-1",
    status: "active" as const,
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const dto = {
    provider: OAuthProviderName.GOOGLE,
    code: "auth-code",
    codeVerifier: "a".repeat(43),
    redirectUri: "myapp://oauth",
    state: "client-csrf",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerCatalog.findByName).mockReturnValue(googleProvider);
    vi.mocked(authorizationStateRepository.consumeForExchange).mockResolvedValue({
      provider: OAuthProviderName.GOOGLE,
      intent: OAuthIntent.LOGIN,
      redirectUri: dto.redirectUri,
      clientState: dto.state,
      userId: null,
    });
    vi.mocked(providerClient.exchangeAuthorizationCode).mockResolvedValue({
      accessToken: "idp-access",
    });
    vi.mocked(providerClient.fetchProfile).mockResolvedValue({
      providerUserId: "google-sub-1",
      issuer: "https://accounts.google.com",
      email: "ada@example.com",
      emailVerified: true,
      displayName: "Ada",
      avatarUrl: null,
    });
    vi.mocked(accountRepository.findByProviderUser).mockResolvedValue(null);
    vi.mocked(accountRepository.findEmailOwner).mockResolvedValue(null);
    vi.mocked(accountRepository.createAccount).mockResolvedValue(activeUser);
    vi.mocked(sessionRepository.createSession).mockResolvedValue(undefined);
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("exchanges a native code and issues session tokens", async () => {
    const result = await useCase.execute(dto);

    expect(authorizationStateRepository.consumeForExchange).toHaveBeenCalledWith({
      provider: "google",
      clientState: "client-csrf",
      redirectUri: "myapp://oauth",
    });
    expect(providerClient.exchangeAuthorizationCode).toHaveBeenCalledWith({
      definition: googleProvider,
      code: "auth-code",
      codeVerifier: dto.codeVerifier,
      redirectUri: "http://localhost:3000/api/v1/auth/oauth/google/callback",
    });
    expect(accountRepository.createAccount).toHaveBeenCalled();
    expect(result).toMatchObject({
      user: activeUser,
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
      refreshToken: expect.any(String),
    });
  });

  it("rejects an unknown or mismatched pending state", async () => {
    vi.mocked(authorizationStateRepository.consumeForExchange).mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(OAuthStateInvalidError);
    expect(providerClient.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects intent=link on the login exchange", async () => {
    vi.mocked(authorizationStateRepository.consumeForExchange).mockResolvedValue({
      provider: OAuthProviderName.GOOGLE,
      intent: OAuthIntent.LINK,
      redirectUri: dto.redirectUri,
      clientState: dto.state,
      userId: "user-1",
    });

    await expect(useCase.execute(dto)).rejects.toMatchObject({
      code: ErrorCode.OAUTH_STATE_INVALID,
    });
  });

  it("throws when the provider has no token credentials", async () => {
    const { clientSecret: _clientSecret, tokenUrl: _tokenUrl, ...authorizeOnly } = googleProvider;
    vi.mocked(providerCatalog.findByName).mockReturnValue(authorizeOnly);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
    expect(authorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });
});
