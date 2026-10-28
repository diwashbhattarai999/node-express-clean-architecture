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
