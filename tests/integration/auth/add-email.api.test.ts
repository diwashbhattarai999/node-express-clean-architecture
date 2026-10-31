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
  scheduleAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
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

vi.mock(
  "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository",
  () => ({
    PostgresCredentialsRepository: vi.fn(function PostgresCredentialsRepository() {
      return mockAuthAccountRepository;
    }),
  }),
);

vi.mock(
  "@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository",
  () => ({
    PostgresVerificationRepository: vi.fn(function PostgresVerificationRepository() {
      return mockAuthAccountRepository;
    }),
  }),
);

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

describe("Auth add email API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockAuthAccountRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: "ada",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue(null);
    mockAuthAccountRepository.addEmailIdentity.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440020",
      type: "email",
      identifier: "second@example.com",
      verifiedAt: null,
      isPrimary: false,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    });
    mockEmailSender.send.mockResolvedValue({ id: "msg-1" });
  });

  it("adds an unverified email identity", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/emails")
      .set("Authorization", "Bearer access.jwt")
      .send({ email: "second@example.com" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Email added. Please verify it.",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440020",
        type: "email",
        identifier: "second@example.com",
        verifiedAt: null,
        isPrimary: false,
      },
    });
    expect(mockAuthAccountRepository.addEmailIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        identifier: "second@example.com",
        normalizedIdentifier: "second@example.com",
      }),
    );
    expect(mockEmailSender.send).toHaveBeenCalledOnce();
  });

  it("returns 409 when the email is already taken", async () => {
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue({
      userId: "other-user",
    });

    const response = await request(app)
      .post("/api/v1/users/me/emails")
      .set("Authorization", "Bearer access.jwt")
      .send({ email: "taken@example.com" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CONFLICT");
    expect(mockAuthAccountRepository.addEmailIdentity).not.toHaveBeenCalled();
  });

  it("returns 422 for an invalid email", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/emails")
      .set("Authorization", "Bearer access.jwt")
      .send({ email: "not-an-email" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).post("/api/v1/users/me/emails").send({
      email: "second@example.com",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
