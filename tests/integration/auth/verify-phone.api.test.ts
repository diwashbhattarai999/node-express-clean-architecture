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
  findAuthenticatedPrincipal: vi.fn(),
  findPasswordResetTarget: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  resetPasswordByTokenHash: vi.fn(),
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

vi.mock("@/modules/users/infrastructure/repositories/postgres-user.repository", () => ({
  PostgresUserRepository: vi.fn(function PostgresUserRepository() {
    return {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  }),
}));

const { createApp } = await import("@/app/create-app");

describe("Auth verify phone API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.sign.mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
    mockAuthAccountRepository.verifyPhoneByCodeHash.mockResolvedValue({
      outcome: "verified",
      sessionId: "session-1",
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        displayName: null,
        avatarUrl: null,
        email: null,
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
  });

  it("verifies phone and returns user plus auth tokens", async () => {
    const response = await request(app).post("/api/v1/auth/phone/verify").send({
      phone: "+9779812345678",
      code: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          status: "active",
        },
        accessToken: "access.jwt",
        tokenType: "Bearer",
        expiresIn: 600,
      },
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("returns 401 TOKEN_INVALID for bad codes", async () => {
    mockAuthAccountRepository.verifyPhoneByCodeHash.mockResolvedValue({
      outcome: "invalid",
    });

    const response = await request(app).post("/api/v1/auth/phone/verify").send({
      phone: "+9779812345678",
      code: "000000",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 429 when attempts are exhausted", async () => {
    mockAuthAccountRepository.verifyPhoneByCodeHash.mockResolvedValue({
      outcome: "too_many_attempts",
    });

    const response = await request(app).post("/api/v1/auth/phone/verify").send({
      phone: "+9779812345678",
      code: "123456",
    });

    expect(response.status).toBe(429);
    expect(response.body.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("returns 422 for invalid phone or code shape", async () => {
    const response = await request(app).post("/api/v1/auth/phone/verify").send({
      phone: "9812345678",
      code: "12",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
