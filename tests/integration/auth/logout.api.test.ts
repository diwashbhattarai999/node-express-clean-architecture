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

describe("Auth logout API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthAccountRepository.revokeSessionByRefreshTokenHash.mockResolvedValue(true);
    mockAuthAccountRepository.revokeSessionById.mockResolvedValue(true);
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "session-1",
      jti: "jti-1",
    });
  });

  it("logs out with body refreshToken and clears cookies", async () => {
    const response = await request(app).post("/api/v1/auth/logout").send({
      refreshToken: "raw-refresh-token",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Signed out.",
      data: null,
    });
    expect(mockAuthAccountRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/refresh_token=;/),
        expect.stringMatching(/csrf_token=;/),
      ]),
    );
  });

  it("logs out from cookie when CSRF header matches", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", ["refresh_token=cookie-refresh-token", "csrf_token=csrf-value"])
      .set("X-CSRF-Token", "csrf-value")
      .send({});

    expect(response.status).toBe(200);
    expect(mockAuthAccountRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
  });

  it("returns 403 when cookie logout is missing CSRF", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", ["refresh_token=cookie-refresh-token"])
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
    expect(mockAuthAccountRepository.revokeSessionByRefreshTokenHash).not.toHaveBeenCalled();
  });

  it("logs out with bearer access token only", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer access.jwt")
      .send({});

    expect(response.status).toBe(200);
    expect(mockAccessTokenSigner.verify).toHaveBeenCalledWith("access.jwt");
    expect(mockAuthAccountRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(mockAuthAccountRepository.revokeSessionByRefreshTokenHash).not.toHaveBeenCalled();
  });

  it("returns TOKEN_INVALID for bearer-only logout with a bad access token", async () => {
    const { TokenInvalidError } = await import(
      "@/modules/auth/application/errors/token-invalid.error"
    );
    mockAccessTokenSigner.verify.mockRejectedValue(new TokenInvalidError());

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", "Bearer bad.jwt")
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });


  it("returns 401 when no refresh or bearer credentials are provided", async () => {
    const response = await request(app).post("/api/v1/auth/logout").send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("UNAUTHORIZED");
  });
});
