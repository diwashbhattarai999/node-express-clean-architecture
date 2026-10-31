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

vi.mock("@/infrastructure/email", () => ({
  createEmailSender: vi.fn(() => mockEmailSender),
}));

const { createApp } = await import("@/app/create-app");

describe("Auth register API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPasswordHasher.hash.mockResolvedValue("hashed-password");
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue(null);
    mockEmailSender.send.mockResolvedValue({ id: "mail-1" });
    mockAuthAccountRepository.register.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "pending_verification",
      displayName: "Ada Lovelace",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("registers an account and returns UserPublic without a session", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "ada@example.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
      displayName: "Ada Lovelace",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          status: "pending_verification",
          displayName: "Ada Lovelace",
          email: "ada@example.com",
          username: null,
          avatarUrl: null,
        },
      },
    });
    expect(response.body.data.accessToken).toBeUndefined();
    expect(mockEmailSender.send).toHaveBeenCalledOnce();
  });

  it("returns 409 when the identity already exists", async () => {
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue({
      userId: "existing",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      email: "ada@example.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      code: "CONFLICT",
    });
  });

  it("returns 422 when email and phone are missing", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when passwords do not match", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "ada@example.com",
      password: "StrongPassword123!",
      confirmPassword: "DifferentPassword123!",
    });

    expect(response.status).toBe(422);
  });
});
