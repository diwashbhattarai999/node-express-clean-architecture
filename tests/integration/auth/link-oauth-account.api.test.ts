import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOAuthAuthorizationStateRepository = {
  save: vi.fn(),
  findActive: vi.fn(),
  consume: vi.fn(),
  consumeForExchange: vi.fn(),
};

const mockOAuthAccountRepository = {
  findByProviderUser: vi.fn(),
  findEmailOwner: vi.fn(),
  listForUser: vi.fn(),
  createAccount: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
  linkToUser: vi.fn(),
  unlinkFromUser: vi.fn(),
};

const mockSessionRepository = {
  createSession: vi.fn(),
  rotateRefreshSession: vi.fn(),
  revokeSessionByRefreshTokenHash: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeAllSessionsForUser: vi.fn(),
  revokeOtherSessionsForUser: vi.fn(),
  listSessionsForUser: vi.fn(),
  findSessionForUser: vi.fn(),
  updateSessionLabelForUser: vi.fn(),
  revokeSessionForUser: vi.fn(),
};

const mockHttpClient = {
  request: vi.fn(),
};

const mockAccessTokenSigner = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockPasswordHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const mockEmailSender = {
  send: vi.fn(),
};

const mockIdentityRepository = {
  findIdentityByNormalized: vi.fn(),
  register: vi.fn(),
  findAuthenticatedPrincipal: vi.fn(),
  findOwnProfile: vi.fn(),
  updateOwnProfile: vi.fn(),
  listIdentitiesForUser: vi.fn(),
  addEmailIdentity: vi.fn(),
  addPhoneIdentity: vi.fn(),
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
  removePhoneIdentity: vi.fn(),
  scheduleAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
  upsertUsername: vi.fn(),
  listUsers: vi.fn(),
  findAdminDetails: vi.fn(),
  setUserStatus: vi.fn(),
  hardDeleteById: vi.fn(),
  hasVerifiedFactor: vi.fn(),
  insertChallenge: vi.fn(),
  findAuthUserById: vi.fn(),
};


vi.mock("@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository", () => ({
  PostgresIdentityRepository: vi.fn(function PostgresIdentityRepository() {
    return mockIdentityRepository;
  }),
}));

vi.mock(
  "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository",
  () => ({
    PostgresCredentialsRepository: vi.fn(function PostgresCredentialsRepository() {
      return mockIdentityRepository;
    }),
  }),
);

vi.mock(
  "@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository",
  () => ({
    PostgresVerificationRepository: vi.fn(function PostgresVerificationRepository() {
      return mockIdentityRepository;
    }),
  }),
);

vi.mock("@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository", () => ({
  PostgresSessionRepository: vi.fn(function PostgresSessionRepository() {
    return mockSessionRepository;
  }),
}));

vi.mock("@/modules/auth/mfa/infrastructure/repositories/postgres-mfa.repository", () => ({
  PostgresMfaRepository: vi.fn(function PostgresMfaRepository() {
    return mockIdentityRepository;
  }),
}));


vi.mock(
  "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-authorization-state.repository",
  () => ({
    PostgresOAuthAuthorizationStateRepository: vi.fn(
      function PostgresOAuthAuthorizationStateRepository() {
        return mockOAuthAuthorizationStateRepository;
      },
    ),
  }),
);

vi.mock(
  "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-account.repository",
  () => ({
    PostgresOAuthAccountRepository: vi.fn(function PostgresOAuthAccountRepository() {
      return mockOAuthAccountRepository;
    }),
  }),
);

vi.mock("@/infrastructure/http-client", () => ({
  createHttpClient: vi.fn(() => mockHttpClient),
}));

vi.mock("@/modules/auth/shared/infrastructure/security/argon2-password-hasher", () => ({
  Argon2PasswordHasher: vi.fn(function Argon2PasswordHasher() {
    return mockPasswordHasher;
  }),
}));

vi.mock("@/modules/auth/shared/infrastructure/security/jose-access-token.signer", () => ({
  JoseAccessTokenSigner: vi.fn(function JoseAccessTokenSigner() {
    return mockAccessTokenSigner;
  }),
}));

vi.mock("@/infrastructure/email", () => ({
  createEmailSender: vi.fn(() => mockEmailSender),
}));

const { createApp } = await import("@/app/create-app");

describe("Auth link OAuth account API", () => {
  const app = createApp();
  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const codeVerifier = "a".repeat(43);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId,
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockIdentityRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
      user: {
        id: userId,
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: "ada",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
    mockOAuthAuthorizationStateRepository.consumeForExchange.mockResolvedValue({
      provider: "google",
      intent: "link",
      redirectUri: "http://localhost:5173/settings/linked",
      clientState: "client-csrf",
      userId,
    });
    mockHttpClient.request
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: { access_token: "idp-access" },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {
          sub: "google-sub-1",
          email: "ada@example.com",
          email_verified: true,
          name: "Ada Lovelace",
        },
      });
    mockOAuthAccountRepository.linkToUser.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440020",
      provider: "google",
      providerEmail: "ada@example.com",
      linkedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("links the provider and returns the OAuth account", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/oauth-accounts/google/link")
      .set("Authorization", "Bearer access.jwt")
      .send({
        code: "auth-code",
        codeVerifier,
        redirectUri: "http://localhost:5173/settings/linked",
        state: "client-csrf",
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "OAuth account linked.",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440020",
        provider: "google",
        providerEmail: "ada@example.com",
        linkedAt: "2026-01-01T00:00:00.000Z",
        lastUsedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(mockOAuthAuthorizationStateRepository.consumeForExchange).toHaveBeenCalledWith({
      provider: "google",
      clientState: "client-csrf",
      redirectUri: "http://localhost:5173/settings/linked",
      intent: "link",
      userId,
    });
    expect(mockOAuthAccountRepository.linkToUser).toHaveBeenCalledWith({
      userId,
      provider: "google",
      providerUserId: "google-sub-1",
      issuer: "https://accounts.google.com",
      providerEmail: "ada@example.com",
      providerEmailVerified: true,
    });
  });

  it("accepts the PKCE verifier from the link cookie", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/oauth-accounts/google/link")
      .set("Authorization", "Bearer access.jwt")
      .set("Cookie", `oauth_code_verifier=${codeVerifier}`)
      .send({
        code: "auth-code",
        redirectUri: "http://localhost:5173/settings/linked",
        state: "client-csrf",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.provider).toBe("google");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).post("/api/v1/users/me/oauth-accounts/google/link").send({
      code: "auth-code",
      codeVerifier,
      redirectUri: "http://localhost:5173/settings/linked",
      state: "client-csrf",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
    expect(mockOAuthAuthorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });

  it("returns 400 when no pending link state matches", async () => {
    mockOAuthAuthorizationStateRepository.consumeForExchange.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/users/me/oauth-accounts/google/link")
      .set("Authorization", "Bearer access.jwt")
      .send({
        code: "auth-code",
        codeVerifier,
        redirectUri: "http://localhost:5173/settings/linked",
        state: "client-csrf",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("OAUTH_STATE_INVALID");
    expect(mockHttpClient.request).not.toHaveBeenCalled();
  });
});
