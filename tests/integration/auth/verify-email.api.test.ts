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
  findAuthenticatedPrincipal: vi.fn(),
  findPasswordResetTarget: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  resetPasswordByTokenHash: vi.fn(),
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

vi.mock("@/modules/auth/infrastructure/repositories/postgres-auth-account.repository", () => ({
  PostgresAuthAccountRepository: vi.fn(function PostgresAuthAccountRepository() {
    return mockAuthAccountRepository;
  }),
}));

vi.mock("@/modules/auth/infrastructure/security/argon2-password-hasher", () => ({
  Argon2PasswordHasher: vi.fn(function Argon2PasswordHasher() {
    return mockPasswordHasher;
  }),
}));

vi.mock("@/modules/auth/infrastructure/security/jose-access-token.signer", () => ({
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

describe("Auth verify email API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.sign.mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
    mockAuthAccountRepository.verifyEmailByTokenHash.mockResolvedValue({
      outcome: "verified",
      sessionId: "session-1",
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
  });

  it("verifies email and returns user plus auth tokens", async () => {
    const response = await request(app).post("/api/v1/auth/email/verify").send({
      token: "verification-token",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          status: "active",
          email: "ada@example.com",
        },
        accessToken: "access.jwt",
        tokenType: "Bearer",
        expiresIn: 600,
      },
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("returns 401 TOKEN_INVALID for unknown tokens", async () => {
    mockAuthAccountRepository.verifyEmailByTokenHash.mockResolvedValue({
      outcome: "invalid",
    });

    const response = await request(app).post("/api/v1/auth/email/verify").send({
      token: "nope",
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: "TOKEN_INVALID",
    });
  });

  it("returns 401 TOKEN_EXPIRED for expired tokens", async () => {
    mockAuthAccountRepository.verifyEmailByTokenHash.mockResolvedValue({
      outcome: "expired",
    });

    const response = await request(app).post("/api/v1/auth/email/verify").send({
      token: "expired-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 422 when token is missing", async () => {
    const response = await request(app).post("/api/v1/auth/email/verify").send({});

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
