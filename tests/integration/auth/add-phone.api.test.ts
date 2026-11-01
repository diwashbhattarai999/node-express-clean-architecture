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
  addPhoneIdentity: vi.fn(),
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
  removePhoneIdentity: vi.fn(),
  scheduleAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
  upsertUsername: vi.fn(),
  listUsers: vi.fn(),
  findAdminDetails: vi.fn(),
  setUserStatus: vi.fn(),
  hardDeleteById: vi.fn(),
  findPasswordResetTarget: vi.fn(),
  findPasswordResetTargetByUserId: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  validatePasswordResetTokenHash: vi.fn(),
  resetPasswordByTokenHash: vi.fn(),
  findPasswordHashForUser: vi.fn(),
  changePasswordForUser: vi.fn(),
  findMagicLinkTarget: vi.fn(),
  replaceMagicLinkToken: vi.fn(),
  consumeMagicLinkByTokenHash: vi.fn(),
    findAuthUserById: vi.fn(),
    hasVerifiedFactor: vi.fn(),
    listVerifiedFactors: vi.fn(),
    findFactorForUser: vi.fn(),
    findFactorByType: vi.fn(),
    insertFactor: vi.fn(),
    updateFactor: vi.fn(),
    markFactorVerified: vi.fn(),
    disableFactorsForUser: vi.fn(),
    insertChallenge: vi.fn(),
    findChallengeById: vi.fn(),
    findLatestChallengeForFactor: vi.fn(),
    findPendingLoginByTokenHash: vi.fn(),
    updateChallenge: vi.fn(),
    incrementChallengeAttempts: vi.fn(),
    consumePendingLoginsForUser: vi.fn(),
    replaceRecoveryCodes: vi.fn(),
    findUnusedRecoveryCodes: vi.fn(),
    markRecoveryCodeUsed: vi.fn(),
    revokeUnusedRecoveryCodes: vi.fn(),
  listSessionsForUser: vi.fn(),
  findSessionForUser: vi.fn(),
  updateSessionLabelForUser: vi.fn(),
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

vi.mock("@/modules/auth/mfa/infrastructure/repositories/postgres-mfa.repository", () => ({
  PostgresMfaRepository: vi.fn(function PostgresMfaRepository() {
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

describe("Auth add phone API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
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
    mockAuthAccountRepository.addPhoneIdentity.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440021",
      type: "phone",
      identifier: "+9779812345678",
      verifiedAt: null,
      isPrimary: false,
      createdAt: new Date("2026-01-03T00:00:00.000Z"),
    });
  });

  it("adds an unverified phone identity", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/phones")
      .set("Authorization", "Bearer access.jwt")
      .send({ phone: "+9779812345678" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Phone added. Please verify it.",
      data: {
        id: "550e8400-e29b-41d4-a716-446655440021",
        type: "phone",
        identifier: "+9779812345678",
        verifiedAt: null,
        isPrimary: false,
      },
    });
    expect(mockAuthAccountRepository.addPhoneIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        identifier: "+9779812345678",
        normalizedIdentifier: "+9779812345678",
      }),
    );
  });

  it("returns 409 when the phone is already taken", async () => {
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue({
      userId: "other-user",
    });

    const response = await request(app)
      .post("/api/v1/users/me/phones")
      .set("Authorization", "Bearer access.jwt")
      .send({ phone: "+9779812345678" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CONFLICT");
    expect(mockAuthAccountRepository.addPhoneIdentity).not.toHaveBeenCalled();
  });

  it("returns 422 for an invalid phone", async () => {
    const response = await request(app)
      .post("/api/v1/users/me/phones")
      .set("Authorization", "Bearer access.jwt")
      .send({ phone: "9812345678" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).post("/api/v1/users/me/phones").send({
      phone: "+9779812345678",
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
