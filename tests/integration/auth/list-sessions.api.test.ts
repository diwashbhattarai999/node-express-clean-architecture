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
  listIdentitiesForUser: vi.fn(),
  addEmailIdentity: vi.fn(),
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

vi.mock("@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository", () => ({
  PostgresCredentialsRepository: vi.fn(function PostgresCredentialsRepository() {
    return mockAuthAccountRepository;
  }),
}));

vi.mock("@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository", () => ({
  PostgresVerificationRepository: vi.fn(function PostgresVerificationRepository() {
    return mockAuthAccountRepository;
  }),
}));

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

describe("Auth list sessions API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "session-1",
      jti: "jti-1",
    });
    mockAuthAccountRepository.listSessionsForUser.mockResolvedValue({
      total: 1,
      items: [
        {
          id: "session-1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
          expiresAt: new Date("2026-02-01T00:00:00.000Z"),
          ipAddress: "127.0.0.1",
          userAgent: "vitest",
          deviceName: null,
          isCurrent: true,
        },
      ],
    });
  });

  it("returns paginated sessions for the bearer user", async () => {
    const response = await request(app)
      .get("/api/v1/auth/sessions")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          id: "session-1",
          isCurrent: true,
          ipAddress: "127.0.0.1",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      meta: {
        totalRecords: 1,
        currentPage: 1,
        perPage: 10,
      },
    });
    expect(mockAuthAccountRepository.listSessionsForUser).toHaveBeenCalledWith({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      currentSessionId: "session-1",
      includeRevoked: false,
      page: 1,
      limit: 10,
    });
  });

  it("passes includeRevoked=true when requested", async () => {
    const response = await request(app)
      .get("/api/v1/auth/sessions")
      .query({ includeRevoked: "true", page: 2, limit: 5 })
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(mockAuthAccountRepository.listSessionsForUser).toHaveBeenCalledWith({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      currentSessionId: "session-1",
      includeRevoked: true,
      page: 2,
      limit: 5,
    });
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).get("/api/v1/auth/sessions");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
