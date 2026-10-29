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

describe("Auth reset password API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPasswordHasher.hash.mockResolvedValue("hashed-password");
    mockAuthAccountRepository.resetPasswordByTokenHash.mockResolvedValue({
      outcome: "reset",
    });
  });

  it("resets the password and clears auth cookies", async () => {
    const response = await request(app).post("/api/v1/auth/password/reset").send({
      token: "reset-token",
      password: "NewSecret123!",
      confirmPassword: "NewSecret123!",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Password has been reset.",
      data: null,
    });
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith("NewSecret123!");
    expect(mockAuthAccountRepository.resetPasswordByTokenHash).toHaveBeenCalledOnce();
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/refresh_token=;/),
        expect.stringMatching(/csrf_token=;/),
      ]),
    );
  });

  it("returns 401 TOKEN_INVALID for unknown tokens", async () => {
    mockAuthAccountRepository.resetPasswordByTokenHash.mockResolvedValue({
      outcome: "invalid",
    });

    const response = await request(app).post("/api/v1/auth/password/reset").send({
      token: "bad-token",
      password: "NewSecret123!",
      confirmPassword: "NewSecret123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 401 TOKEN_EXPIRED for expired tokens", async () => {
    mockAuthAccountRepository.resetPasswordByTokenHash.mockResolvedValue({
      outcome: "expired",
    });

    const response = await request(app).post("/api/v1/auth/password/reset").send({
      token: "expired-token",
      password: "NewSecret123!",
      confirmPassword: "NewSecret123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 422 when passwords do not match", async () => {
    const response = await request(app).post("/api/v1/auth/password/reset").send({
      token: "reset-token",
      password: "NewSecret123!",
      confirmPassword: "DifferentSecret123!",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockAuthAccountRepository.resetPasswordByTokenHash).not.toHaveBeenCalled();
  });
});
