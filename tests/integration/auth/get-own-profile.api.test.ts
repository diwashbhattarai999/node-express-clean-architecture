import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuthAccountRepository = {
  findIdentityByNormalized: vi.fn(),
  register: vi.fn(),
  verifyEmailByTokenHash: vi.fn(),
  findUnverifiedEmailIdentity: vi.fn(),
  replaceEmailVerificationToken: vi.fn(),
  verifyPhoneByCodeHash: vi.fn(),
  findUnverifiedPhoneIdentity: vi.fn(),
  replacePhoneVerificationToken: vi.fn(),
  findPasswordLoginCandidate: vi.fn(),
  createSession: vi.fn(),
  rotateRefreshSession: vi.fn(),
  revokeSessionByRefreshTokenHash: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeAllSessionsForUser: vi.fn(),
  revokeOtherSessionsForUser: vi.fn(),
  findAuthenticatedPrincipal: vi.fn(),
  findOwnProfile: vi.fn(),
  updateOwnProfile: vi.fn(),
  upsertUsername: vi.fn(),
  findPasswordResetTarget: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  validatePasswordResetTokenHash: vi.fn(),
  resetPasswordByTokenHash: vi.fn(),
  findPasswordHashForUser: vi.fn(),
  changePasswordForUser: vi.fn(),
  listSessionsForUser: vi.fn(),
  findSessionForUser: vi.fn(),
  revokeSessionForUser: vi.fn(),
};

const mockPasswordHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const mockAccessTokenSigner = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockEmailSender = {
  send: vi.fn(),
};

vi.mock("@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository", () => ({
  PostgresIdentityRepository: vi.fn(function PostgresIdentityRepository() {
    return mockAuthAccountRepository;
  }),
}));

vi.mock(
  "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository",
  () => ({
    PostgresCredentialsRepository: vi.fn(function PostgresCredentialsRepository() {
      return mockAuthAccountRepository;
    }),
  }),
);

vi.mock(
  "@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository",
  () => ({
    PostgresVerificationRepository: vi.fn(function PostgresVerificationRepository() {
      return mockAuthAccountRepository;
    }),
  }),
);

vi.mock("@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository", () => ({
  PostgresSessionRepository: vi.fn(function PostgresSessionRepository() {
    return mockAuthAccountRepository;
  }),
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

describe("Auth get own profile API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockAuthAccountRepository.findOwnProfile.mockResolvedValue({
      outcome: "ok",
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: "ada",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      profile: {
        firstName: "Ada",
        lastName: "Lovelace",
        locale: "en-US",
        timezone: "UTC",
        bio: null,
      },
    });
  });

  it("returns user and profile for the authenticated user", async () => {
    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Profile loaded.",
      data: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "ada@example.com",
          username: "ada",
        },
        profile: {
          firstName: "Ada",
          lastName: "Lovelace",
          locale: "en-US",
          timezone: "UTC",
          bio: null,
        },
      },
    });
    expect(mockAuthAccountRepository.findOwnProfile).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440002",
    );
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).get("/api/v1/users/me");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 401 TOKEN_REVOKED when the session was revoked", async () => {
    mockAuthAccountRepository.findOwnProfile.mockResolvedValue({
      outcome: "revoked_session",
    });

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_REVOKED");
  });
});
