import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthIntent, OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthAccountBlockedError } from "@/modules/auth/oauth/application/errors/oauth-account-blocked.error";
import { OAuthProviderUnavailableError } from "@/modules/auth/oauth/application/errors/oauth-provider-unavailable.error";
import { OAuthStateInvalidError } from "@/modules/auth/oauth/application/errors/oauth-state-invalid.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import type { IOauthAuthorizationStateRepository } from "@/modules/auth/oauth/application/ports/oauth-authorization-state.repository";
import type { IOauthProviderCatalog } from "@/modules/auth/oauth/application/ports/oauth-provider-catalog.port";
import type { IOauthProviderClient } from "@/modules/auth/oauth/application/ports/oauth-provider-client.port";
import { CompleteOAuthSignIn } from "@/modules/auth/oauth/application/services/complete-oauth-sign-in";
import { HandleOAuthCallbackUseCase } from "@/modules/auth/oauth/application/use-cases/handle-oauth-callback.use-case";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { ErrorCode } from "@/shared/errors/error-code";

describe("HandleOAuthCallbackUseCase", () => {
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

  const useCase = new HandleOAuthCallbackUseCase(
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

  const consumedState = {
    provider: OAuthProviderName.GOOGLE,
    intent: OAuthIntent.LOGIN,
    redirectUri: "http://localhost:5173/auth/callback",
    clientState: "client-csrf",
    userId: null,
  };

  const profile = {
    providerUserId: "google-sub-1",
    issuer: "https://accounts.google.com",
    email: "ada@example.com",
    emailVerified: true,
    displayName: "Ada Lovelace",
    avatarUrl: "https://example.com/ada.png",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(providerCatalog.findByName).mockReturnValue(googleProvider);
    vi.mocked(authorizationStateRepository.findActive).mockResolvedValue(consumedState);
    vi.mocked(authorizationStateRepository.consume).mockResolvedValue(consumedState);
    vi.mocked(providerClient.exchangeAuthorizationCode).mockResolvedValue({
      accessToken: "idp-access",
    });
    vi.mocked(providerClient.fetchProfile).mockResolvedValue(profile);
    vi.mocked(accountRepository.findByProviderUser).mockResolvedValue(null);
    vi.mocked(accountRepository.findEmailOwner).mockResolvedValue(null);
    vi.mocked(accountRepository.createAccount).mockResolvedValue(activeUser);
    vi.mocked(accountRepository.recordSuccessfulLogin).mockResolvedValue(activeUser);
    vi.mocked(sessionRepository.createSession).mockResolvedValue(undefined);
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("creates an account and session for a new external identity", async () => {
    const result = await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      code: "auth-code",
      state: "idp-state",
      codeVerifier: "verifier",
    });

    expect(providerClient.exchangeAuthorizationCode).toHaveBeenCalledWith({
      definition: googleProvider,
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "http://localhost:3000/api/v1/auth/oauth/google/callback",
    });
    expect(accountRepository.createAccount).toHaveBeenCalledWith({
      id: expect.any(String),
      displayName: "Ada Lovelace",
      avatarUrl: "https://example.com/ada.png",
      email: {
        identifier: "ada@example.com",
        normalizedIdentifier: "ada@example.com",
        verifiedAt: expect.any(Date),
      },
      externalIdentity: {
        provider: "google",
        providerUserId: "google-sub-1",
        issuer: "https://accounts.google.com",
        providerEmail: "ada@example.com",
        providerEmailVerified: true,
      },
    });
    expect(sessionRepository.createSession).toHaveBeenCalled();
    expect(result).toMatchObject({
      outcome: "session",
      user: activeUser,
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
      redirectUri: "http://localhost:5173/auth/callback",
      clientState: "client-csrf",
      refreshToken: expect.any(String),
    });
  });

  it("logs in an existing external identity", async () => {
    vi.mocked(accountRepository.findByProviderUser).mockResolvedValue({
      externalIdentityId: "ext-1",
      user: activeUser,
    });

    const result = await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      code: "auth-code",
      state: "idp-state",
      codeVerifier: "verifier",
    });

    expect(accountRepository.recordSuccessfulLogin).toHaveBeenCalledWith("ext-1");
    expect(accountRepository.createAccount).not.toHaveBeenCalled();
    expect(result).toMatchObject({ outcome: "session", user: activeUser });
  });

  it("does not attach a login email when that email already belongs to another account", async () => {
    vi.mocked(accountRepository.findEmailOwner).mockResolvedValue({ userId: "other-user" });

    await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      code: "auth-code",
      state: "idp-state",
      codeVerifier: "verifier",
    });

    expect(accountRepository.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        externalIdentity: expect.objectContaining({
          providerEmail: "ada@example.com",
        }),
      }),
    );
    expect(accountRepository.createAccount).toHaveBeenCalledWith(
      expect.not.objectContaining({
        email: expect.anything(),
      }),
    );
  });

  it("hands the authorization code back to the app when PKCE is client-held", async () => {
    const result = await useCase.execute({
      provider: OAuthProviderName.GOOGLE,
      code: "auth-code",
      state: "idp-state",
    });

    expect(result).toEqual({
      outcome: "handoff",
      code: "auth-code",
      redirectUri: "http://localhost:5173/auth/callback",
      clientState: "client-csrf",
    });
    expect(authorizationStateRepository.findActive).toHaveBeenCalled();
    expect(authorizationStateRepository.consume).not.toHaveBeenCalled();
    expect(providerClient.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects a missing, consumed, or expired state", async () => {
    vi.mocked(authorizationStateRepository.consume).mockResolvedValue(null);

    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        code: "auth-code",
        state: "idp-state",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(OAuthStateInvalidError);
    expect(providerClient.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects intent=link on the login callback", async () => {
    vi.mocked(authorizationStateRepository.consume).mockResolvedValue({
      ...consumedState,
      intent: OAuthIntent.LINK,
    });

    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        code: "auth-code",
        state: "idp-state",
        codeVerifier: "verifier",
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.OAUTH_STATE_INVALID,
    });
  });

  it("consumes state and rejects when the IdP returns an error", async () => {
    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        state: "idp-state",
        error: "access_denied",
        errorDescription: "The user denied access.",
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.OAUTH_STATE_INVALID,
      message: "The user denied access.",
    });
    expect(authorizationStateRepository.consume).toHaveBeenCalled();
    expect(providerClient.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("rejects a suspended existing account", async () => {
    vi.mocked(accountRepository.findByProviderUser).mockResolvedValue({
      externalIdentityId: "ext-1",
      user: { ...activeUser, status: "suspended" },
    });

    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        code: "auth-code",
        state: "idp-state",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(OAuthAccountBlockedError);
    expect(accountRepository.recordSuccessfulLogin).not.toHaveBeenCalled();
  });

  it("throws when the provider has no token credentials", async () => {
    const { clientSecret: _clientSecret, tokenUrl: _tokenUrl, ...authorizeOnly } = googleProvider;
    vi.mocked(providerCatalog.findByName).mockReturnValue(authorizeOnly);

    await expect(
      useCase.execute({
        provider: OAuthProviderName.GOOGLE,
        code: "auth-code",
        state: "idp-state",
        codeVerifier: "verifier",
      }),
    ).rejects.toBeInstanceOf(OAuthProviderUnavailableError);
  });
});
