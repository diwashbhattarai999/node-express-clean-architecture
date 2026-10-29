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
  findPasswordResetTarget: vi.fn(),
  replacePasswordResetToken: vi.fn(),
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

describe("Auth refresh API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.sign.mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
    mockAuthAccountRepository.rotateRefreshSession.mockResolvedValue({
      outcome: "rotated",
      sessionId: "session-2",
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  });

  it("refreshes from body refreshToken and sets rotated cookies", async () => {
    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: "raw-refresh-token",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        accessToken: "access.jwt",
        tokenType: "Bearer",
        expiresIn: 600,
      },
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).not.toBe("raw-refresh-token");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("refresh_token="),
        expect.stringContaining("csrf_token="),
      ]),
    );
  });

  it("refreshes from cookie when CSRF header matches", async () => {
    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", ["refresh_token=cookie-refresh-token", "csrf_token=csrf-value"])
      .set("X-CSRF-Token", "csrf-value")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe("access.jwt");
    expect(mockAuthAccountRepository.rotateRefreshSession).toHaveBeenCalledOnce();
  });

  it("returns 403 when cookie refresh is missing CSRF", async () => {
    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", ["refresh_token=cookie-refresh-token"])
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
    expect(mockAuthAccountRepository.rotateRefreshSession).not.toHaveBeenCalled();
  });

  it("returns 401 TOKEN_INVALID when no refresh token is provided", async () => {
    const response = await request(app).post("/api/v1/auth/refresh").send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 401 TOKEN_REUSED when reuse is detected", async () => {
    mockAuthAccountRepository.rotateRefreshSession.mockResolvedValue({
      outcome: "reused",
    });

    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: "old-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_REUSED");
  });

  it("returns 401 TOKEN_EXPIRED for expired sessions", async () => {
    mockAuthAccountRepository.rotateRefreshSession.mockResolvedValue({
      outcome: "expired",
    });

    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: "expired-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 401 TOKEN_REVOKED for revoked sessions", async () => {
    mockAuthAccountRepository.rotateRefreshSession.mockResolvedValue({
      outcome: "revoked",
    });

    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: "revoked-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_REVOKED");
  });
});
