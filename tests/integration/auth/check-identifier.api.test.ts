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
vi.mock("@/modules/auth/mfa/infrastructure/repositories/postgres-mfa.repository", () => ({
  PostgresMfaRepository: vi.fn(function PostgresMfaRepository() {
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

vi.mock("@/infrastructure/email", () => ({
  createEmailSender: vi.fn(() => mockEmailSender),
}));

const { createApp } = await import("@/app/create-app");

describe("Auth check identifier API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue({
      userId: "existing",
    });
  });

  it("returns available true for a taken email", async () => {
    const response = await request(app).post("/api/v1/auth/identifiers/check").send({
      type: "email",
      identifier: "ada@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Identifier availability checked.",
      data: { available: true },
    });
    expect(mockAuthAccountRepository.findIdentityByNormalized).toHaveBeenCalledWith(
      "email",
      "ada@example.com",
    );
  });

  it("returns available false for a reserved username", async () => {
    const response = await request(app).post("/api/v1/auth/identifiers/check").send({
      type: "username",
      identifier: "admin",
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ available: false });
    expect(mockAuthAccountRepository.findIdentityByNormalized).not.toHaveBeenCalled();
  });

  it("returns 422 for an invalid phone", async () => {
    const response = await request(app).post("/api/v1/auth/identifiers/check").send({
      type: "phone",
      identifier: "9812345678",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
