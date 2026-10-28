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

describe("Auth resend email verification API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailSender.send.mockResolvedValue({ id: "mail-1" });
    mockAuthAccountRepository.replaceEmailVerificationToken.mockResolvedValue(undefined);
  });

  it("returns the same success envelope when an unverified email exists", async () => {
    mockAuthAccountRepository.findUnverifiedEmailIdentity.mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });

    const response = await request(app).post("/api/v1/auth/email/verification/resend").send({
      email: "ada@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: null,
      message: "If an account needs verification, a new email has been sent.",
    });
    expect(mockEmailSender.send).toHaveBeenCalledOnce();
  });

  it("returns the same success envelope when the email is unknown", async () => {
    mockAuthAccountRepository.findUnverifiedEmailIdentity.mockResolvedValue(null);

    const response = await request(app).post("/api/v1/auth/email/verification/resend").send({
      email: "missing@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: null,
      message: "If an account needs verification, a new email has been sent.",
    });
    expect(mockEmailSender.send).not.toHaveBeenCalled();
  });

  it("returns 422 when email is invalid", async () => {
    const response = await request(app).post("/api/v1/auth/email/verification/resend").send({
      email: "not-an-email",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
