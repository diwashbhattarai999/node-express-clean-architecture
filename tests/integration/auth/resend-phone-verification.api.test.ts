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

describe("Auth resend phone verification API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthAccountRepository.replacePhoneVerificationToken.mockResolvedValue(undefined);
  });

  it("returns the same success envelope when an unverified phone exists", async () => {
    mockAuthAccountRepository.findUnverifiedPhoneIdentity.mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      phone: "+9779812345678",
    });

    const response = await request(app).post("/api/v1/auth/phone/verification/resend").send({
      phone: "+9779812345678",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: null,
      message: "If an account needs verification, a new code has been sent.",
    });
    expect(mockAuthAccountRepository.replacePhoneVerificationToken).toHaveBeenCalledOnce();
  });

  it("returns the same success envelope when the phone is unknown", async () => {
    mockAuthAccountRepository.findUnverifiedPhoneIdentity.mockResolvedValue(null);

    const response = await request(app).post("/api/v1/auth/phone/verification/resend").send({
      phone: "+9779800000000",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: null,
    });
    expect(mockAuthAccountRepository.replacePhoneVerificationToken).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid phone", async () => {
    const response = await request(app).post("/api/v1/auth/phone/verification/resend").send({
      phone: "9812345678",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
