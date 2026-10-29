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

describe("Auth logout-all API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "session-1",
      jti: "jti-1",
    });
    mockAuthAccountRepository.revokeAllSessionsForUser.mockResolvedValue(2);
  });

  it("revokes all sessions for the bearer user and clears cookies", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", "Bearer access.jwt")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { revokedCount: 2 },
    });
    expect(mockAuthAccountRepository.revokeAllSessionsForUser).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/refresh_token=;/),
        expect.stringMatching(/csrf_token=;/),
      ]),
    );
  });

  it("requires CSRF when a refresh cookie is present", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", "Bearer access.jwt")
      .set("Cookie", ["refresh_token=cookie-refresh-token"])
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FORBIDDEN");
    expect(mockAuthAccountRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("accepts cookie clients when CSRF matches", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout-all")
      .set("Authorization", "Bearer access.jwt")
      .set("Cookie", ["refresh_token=cookie-refresh-token", "csrf_token=csrf-value"])
      .set("X-CSRF-Token", "csrf-value")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.revokedCount).toBe(2);
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).post("/api/v1/auth/logout-all").send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
