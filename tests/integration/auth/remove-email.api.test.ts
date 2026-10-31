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

const identityId = "550e8400-e29b-41d4-a716-446655440020";

describe("Auth remove email API", () => {
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
    mockAuthAccountRepository.removeEmailIdentity.mockResolvedValue({ outcome: "removed" });
  });

  it("removes an email identity", async () => {
    const response = await request(app)
      .delete(`/api/v1/users/me/emails/${identityId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Email removed.",
      data: null,
    });
    expect(mockAuthAccountRepository.removeEmailIdentity).toHaveBeenCalledWith({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      identityId,
    });
  });

  it("returns 409 LAST_AUTH_METHOD when it is the last sign-in method", async () => {
    mockAuthAccountRepository.removeEmailIdentity.mockResolvedValue({
      outcome: "last_auth_method",
    });

    const response = await request(app)
      .delete(`/api/v1/users/me/emails/${identityId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("LAST_AUTH_METHOD");
  });

  it("returns 404 when the identity is missing", async () => {
    mockAuthAccountRepository.removeEmailIdentity.mockResolvedValue({
      outcome: "not_found",
    });

    const response = await request(app)
      .delete(`/api/v1/users/me/emails/${identityId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("returns 422 for an invalid identity id", async () => {
    const response = await request(app)
      .delete("/api/v1/users/me/emails/not-a-uuid")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockAuthAccountRepository.removeEmailIdentity).not.toHaveBeenCalled();
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).delete(`/api/v1/users/me/emails/${identityId}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
