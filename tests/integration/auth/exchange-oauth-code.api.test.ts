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
  createAccount: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
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
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
  scheduleAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
  upsertUsername: vi.fn(),
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

describe("Auth OAuth exchange API", () => {
  const app = createApp();
  const codeVerifier = "a".repeat(43);

  const user = {
    id: "user-1",
    status: "active" as const,
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOAuthAuthorizationStateRepository.consumeForExchange.mockResolvedValue({
      provider: "google",
      intent: "login",
      redirectUri: "myapp://oauth",
      clientState: "client-csrf",
      userId: null,
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
    mockOAuthAccountRepository.findByProviderUser.mockResolvedValue(null);
    mockOAuthAccountRepository.findEmailOwner.mockResolvedValue(null);
    mockOAuthAccountRepository.createAccount.mockResolvedValue(user);
    mockSessionRepository.createSession.mockResolvedValue(undefined);
    mockAccessTokenSigner.sign.mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("returns session tokens for a valid native exchange", async () => {
    const response = await request(app).post("/api/v1/auth/oauth/google/exchange").send({
      code: "auth-code",
      codeVerifier,
      redirectUri: "myapp://oauth",
      state: "client-csrf",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      user: { id: "user-1", email: "ada@example.com" },
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refresh_token=")]),
    );
    expect(mockOAuthAuthorizationStateRepository.consumeForExchange).toHaveBeenCalledWith({
      provider: "google",
      clientState: "client-csrf",
      redirectUri: "myapp://oauth",
    });
  });

  it("returns 400 OAUTH_STATE_INVALID when no pending authorize matches", async () => {
    mockOAuthAuthorizationStateRepository.consumeForExchange.mockResolvedValue(null);

    const response = await request(app).post("/api/v1/auth/oauth/google/exchange").send({
      code: "auth-code",
      codeVerifier,
      redirectUri: "myapp://oauth",
      state: "client-csrf",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("OAUTH_STATE_INVALID");
    expect(mockHttpClient.request).not.toHaveBeenCalled();
  });

  it("returns 422 when the code verifier is not a PKCE verifier", async () => {
    const response = await request(app).post("/api/v1/auth/oauth/google/exchange").send({
      code: "auth-code",
      codeVerifier: "short",
      redirectUri: "myapp://oauth",
      state: "client-csrf",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockOAuthAuthorizationStateRepository.consumeForExchange).not.toHaveBeenCalled();
  });
});
