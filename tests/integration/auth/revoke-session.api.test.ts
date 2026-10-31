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

const otherSessionId = "550e8400-e29b-41d4-a716-446655440001";
const currentSessionId = "550e8400-e29b-41d4-a716-446655440002";

describe("Auth revoke session API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: currentSessionId,
      jti: "jti-1",
    });
    mockAuthAccountRepository.revokeSessionForUser.mockResolvedValue("revoked");
  });

  it("revokes another session for the bearer user", async () => {
    const response = await request(app)
      .delete(`/api/v1/auth/sessions/${otherSessionId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Session revoked.",
      data: null,
    });
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(mockAuthAccountRepository.revokeSessionForUser).toHaveBeenCalledWith({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: otherSessionId,
    });
  });

  it("clears auth cookies when revoking the current session", async () => {
    const response = await request(app)
      .delete(`/api/v1/auth/sessions/${currentSessionId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie);
    expect(cookieHeader).toMatch(/refresh_token=/);
    expect(cookieHeader).toMatch(/csrf_token=/);
  });

  it("returns 404 when the session is missing", async () => {
    mockAuthAccountRepository.revokeSessionForUser.mockResolvedValue("not_found");

    const response = await request(app)
      .delete(`/api/v1/auth/sessions/${otherSessionId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).delete(`/api/v1/auth/sessions/${otherSessionId}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
