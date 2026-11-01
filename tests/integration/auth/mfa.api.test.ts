import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AesGcmSecretEncryptor } from "@/modules/auth/mfa/infrastructure/security/aes-gcm-secret.encryptor";
import { Rfc6238TotpService } from "@/modules/auth/mfa/infrastructure/security/rfc6238-totp.service";

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

vi.mock("@/modules/auth/shared/infrastructure/security/jose-access-token.signer", () => ({
  JoseAccessTokenSigner: vi.fn(function JoseAccessTokenSigner() {
    return mockAccessTokenSigner;
  }),
}));

vi.mock("@/infrastructure/email", () => ({
  createEmailSender: vi.fn(() => mockEmailSender),
}));

const { createApp } = await import("@/app/create-app");

const userId = "550e8400-e29b-41d4-a716-446655440000";
const factorId = "660e8400-e29b-41d4-a716-446655440000";
const challengeId = "770e8400-e29b-41d4-a716-446655440000";
const totp = new Rfc6238TotpService();
const encryptor = new AesGcmSecretEncryptor("test-auth-jwt-secret-at-least-32-chars");

describe("Auth MFA API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId,
      sessionId: "session-1",
      jti: "jti-1",
    });
    mockAccessTokenSigner.sign.mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
    mockAuthAccountRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
      user: {
        id: userId,
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
    mockAuthAccountRepository.hasVerifiedFactor.mockResolvedValue(false);
    mockAuthAccountRepository.listVerifiedFactors.mockResolvedValue([]);
    mockAuthAccountRepository.findUnusedRecoveryCodes.mockResolvedValue([]);
    mockAuthAccountRepository.findFactorByType.mockResolvedValue(null);
    mockAuthAccountRepository.findAuthUserById.mockResolvedValue({
      id: userId,
      status: "active",
      displayName: "Ada Lovelace",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });

  it("returns MFA status for the current user", async () => {
    const response = await request(app)
      .get("/api/v1/users/me/mfa")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { enabled: false, factors: [] },
    });
  });

  it("starts TOTP enrollment and confirms with a valid authenticator code", async () => {
    mockAuthAccountRepository.insertFactor.mockImplementation(async (input) => ({
      id: factorId,
      userId,
      type: input.type,
      label: input.label,
      secretEncrypted: input.secretEncrypted,
      destination: input.destination,
      isVerified: false,
      verifiedAt: null,
      lastUsedAt: null,
      disabledAt: null,
    }));

    const enroll = await request(app)
      .post("/api/v1/users/me/mfa/enroll")
      .set("Authorization", "Bearer access.jwt")
      .send({ type: "totp" });

    expect(enroll.status).toBe(200);
    expect(enroll.body.data.factorId).toBe(factorId);
    expect(enroll.body.data.secret).toEqual(expect.any(String));
    expect(enroll.body.data.otpauthUrl).toContain("otpauth://totp/");

    const secret = enroll.body.data.secret as string;
    const factor = {
      id: factorId,
      userId,
      type: "totp" as const,
      label: "Authenticator app",
      secretEncrypted: mockAuthAccountRepository.insertFactor.mock.calls[0]?.[0].secretEncrypted,
      destination: null,
      isVerified: false,
      verifiedAt: null,
      lastUsedAt: null,
      disabledAt: null,
    };
    mockAuthAccountRepository.findFactorForUser.mockResolvedValue(factor);
    mockAuthAccountRepository.markFactorVerified.mockResolvedValue({ ...factor, isVerified: true });
    mockAuthAccountRepository.listVerifiedFactors.mockResolvedValue([{ ...factor, isVerified: true }]);
    mockAuthAccountRepository.replaceRecoveryCodes.mockResolvedValue(undefined);

    const confirm = await request(app)
      .post("/api/v1/users/me/mfa/enroll/confirm")
      .set("Authorization", "Bearer access.jwt")
      .send({ factorId, code: totp.generate(secret) });

    expect(confirm.status).toBe(200);
    expect(confirm.body.data.recoveryCodes).toEqual(
      expect.arrayContaining([expect.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)]),
    );
    expect(confirm.body.data.recoveryCodes).toHaveLength(10);
  });

  it("returns 403 MFA_REQUIRED with mfaToken when the account has MFA enabled", async () => {
    mockAuthAccountRepository.findPasswordLoginCandidate.mockResolvedValue({
      userId,
      status: "active",
      passwordHash: "hashed",
      displayName: "Ada Lovelace",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockAuthAccountRepository.hasVerifiedFactor.mockResolvedValue(true);
    mockAuthAccountRepository.insertChallenge.mockResolvedValue({
      id: "pending-1",
      userId,
      factorId: null,
      challengeHash: "hash",
      expiresAt: new Date(Date.now() + 600_000),
      verifiedAt: null,
      attemptCount: 0,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      identifier: "ada@example.com",
      password: "StrongPassword123!",
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("MFA_REQUIRED");
    expect(response.body.details.mfaToken).toEqual(expect.any(String));
    expect(mockAuthAccountRepository.createSession).not.toHaveBeenCalled();
  });

  it("starts and verifies an MFA challenge", async () => {
    mockAuthAccountRepository.findPendingLoginByTokenHash.mockResolvedValue({
      id: "pending-1",
      userId,
      factorId: null,
      challengeHash: "token-hash",
      expiresAt: new Date(Date.now() + 600_000),
      verifiedAt: null,
      attemptCount: 0,
    });
    mockAuthAccountRepository.listVerifiedFactors.mockResolvedValue([
      {
        id: factorId,
        userId,
        type: "totp",
        label: "Authenticator app",
        secretEncrypted: "v1.invalid",
        destination: null,
        isVerified: true,
        verifiedAt: new Date(),
        lastUsedAt: null,
        disabledAt: null,
      },
    ]);
    mockAuthAccountRepository.insertChallenge.mockResolvedValue({
      id: challengeId,
      userId,
      factorId,
      challengeHash: null,
      expiresAt: new Date(Date.now() + 600_000),
      verifiedAt: null,
      attemptCount: 0,
    });

    const begin = await request(app).post("/api/v1/auth/mfa/challenge").send({
      mfaToken: "continuation-token",
    });

    expect(begin.status).toBe(200);
    expect(begin.body.data).toMatchObject({
      challengeId,
      expiresAt: expect.any(String),
    });
  });

  it("verifies a TOTP challenge and issues a session", async () => {
    const { secret } = totp.generateSecret();
    const secretEncrypted = encryptor.encrypt(secret);
    mockAuthAccountRepository.findChallengeById.mockResolvedValue({
      id: challengeId,
      userId,
      factorId,
      challengeHash: null,
      expiresAt: new Date(Date.now() + 600_000),
      verifiedAt: null,
      attemptCount: 0,
    });
    mockAuthAccountRepository.findFactorForUser.mockResolvedValue({
      id: factorId,
      userId,
      type: "totp",
      label: "Authenticator app",
      secretEncrypted,
      destination: null,
      isVerified: true,
      verifiedAt: new Date(),
      lastUsedAt: null,
      disabledAt: null,
    });
    mockAuthAccountRepository.updateChallenge.mockResolvedValue(undefined);
    mockAuthAccountRepository.updateFactor.mockResolvedValue(undefined);
    mockAuthAccountRepository.consumePendingLoginsForUser.mockResolvedValue(undefined);
    mockAuthAccountRepository.createSession.mockResolvedValue(undefined);
    mockAuthAccountRepository.findUnusedRecoveryCodes.mockResolvedValue([]);

    const response = await request(app).post("/api/v1/auth/mfa/challenge/verify").send({
      challengeId,
      code: totp.generate(secret),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Signed in.",
      data: {
        user: { id: userId, email: "ada@example.com" },
        accessToken: "access.jwt",
        tokenType: "Bearer",
        expiresIn: 600,
      },
    });
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refresh_token=")]),
    );
    expect(mockAuthAccountRepository.createSession).toHaveBeenCalled();
    expect(mockAuthAccountRepository.consumePendingLoginsForUser).toHaveBeenCalledWith(userId);
  });

  it("regenerates recovery codes when MFA is enabled", async () => {
    mockAuthAccountRepository.hasVerifiedFactor.mockResolvedValue(true);
    mockAuthAccountRepository.replaceRecoveryCodes.mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/v1/users/me/mfa/recovery-codes/regenerate")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body.data.recoveryCodes).toHaveLength(10);
    expect(mockAuthAccountRepository.replaceRecoveryCodes).toHaveBeenCalledWith(
      userId,
      expect.arrayContaining([expect.any(String)]),
    );
  });

  it("disables MFA with the current password", async () => {
    mockAuthAccountRepository.hasVerifiedFactor.mockResolvedValue(true);
    mockAuthAccountRepository.findPasswordHashForUser.mockResolvedValue("hashed");
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockAuthAccountRepository.disableFactorsForUser.mockResolvedValue(1);
    mockAuthAccountRepository.revokeUnusedRecoveryCodes.mockResolvedValue(undefined);

    const response = await request(app)
      .delete("/api/v1/users/me/mfa")
      .set("Authorization", "Bearer access.jwt")
      .send({ password: "StrongPassword123!" });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(mockAuthAccountRepository.disableFactorsForUser).toHaveBeenCalledWith(userId);
  });
});
