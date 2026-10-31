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
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
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

describe("Auth forgot password API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailSender.send.mockResolvedValue({ id: "mail-1" });
    mockAuthAccountRepository.replacePasswordResetToken.mockResolvedValue(undefined);
    mockAuthAccountRepository.findPasswordResetTarget.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      identityId: "identity-1",
      email: "ada@example.com",
    });
  });

  it("returns a generic success and sends a reset email when eligible", async () => {
    const response = await request(app).post("/api/v1/auth/password/forgot").send({
      email: "ada@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: null,
    });
    expect(mockAuthAccountRepository.replacePasswordResetToken).toHaveBeenCalledOnce();
    expect(mockEmailSender.send).toHaveBeenCalledOnce();
  });

  it("returns the same success when the email is unknown", async () => {
    mockAuthAccountRepository.findPasswordResetTarget.mockResolvedValue(null);

    const response = await request(app).post("/api/v1/auth/password/forgot").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(mockAuthAccountRepository.replacePasswordResetToken).not.toHaveBeenCalled();
    expect(mockEmailSender.send).not.toHaveBeenCalled();
  });

  it("returns 422 when email is invalid", async () => {
    const response = await request(app).post("/api/v1/auth/password/forgot").send({
      email: "not-an-email",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
