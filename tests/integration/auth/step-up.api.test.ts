import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "550e8400-e29b-41d4-a716-446655440000";
const stepUpId = "880e8400-e29b-41d4-a716-446655440000";

const mockStepUpRepository = {
  insertChallenge: vi.fn(),
  findChallengeById: vi.fn(),
  markChallengeVerified: vi.fn(),
  consumeOpenChallenges: vi.fn(),
};

const mockAuthAccountRepository = {
  findAuthenticatedPrincipal: vi.fn(),
  findPasswordHashForUser: vi.fn(),
  hasVerifiedFactor: vi.fn(),
  listVerifiedFactors: vi.fn(),
};

const mockPasswordHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const mockAccessTokenSigner = {
  sign: vi.fn(),
  verify: vi.fn(),
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

vi.mock("@/modules/auth/step-up/infrastructure/repositories/postgres-step-up.repository", () => ({
  PostgresStepUpRepository: vi.fn(function PostgresStepUpRepository() {
    return mockStepUpRepository;
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

const { createApp } = await import("@/app/create-app");

describe("Auth step-up API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId,
      sessionId: "session-1",
      jti: "jti-1",
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
    mockStepUpRepository.consumeOpenChallenges.mockResolvedValue(undefined);
  });

  it("creates a password step-up challenge", async () => {
    mockAuthAccountRepository.findPasswordHashForUser.mockResolvedValue("hashed");
    mockStepUpRepository.insertChallenge.mockResolvedValue({
      id: stepUpId,
      userId,
      sessionId: "session-1",
      method: "password",
      mfaChallengeId: null,
      webauthnChallenge: null,
      expiresAt: new Date("2026-01-01T00:05:00.000Z"),
      verifiedAt: null,
    });

    const response = await request(app)
      .post("/api/v1/auth/step-up/challenge")
      .set("Authorization", "Bearer access.jwt")
      .send({ method: "password" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      stepUpId,
      method: "password",
      expiresAt: "2026-01-01T00:05:00.000Z",
    });
  });

  it("verifies a password step-up challenge and returns a step-up token", async () => {
    mockStepUpRepository.findChallengeById.mockResolvedValue({
      id: stepUpId,
      userId,
      sessionId: "session-1",
      method: "password",
      mfaChallengeId: null,
      webauthnChallenge: null,
      expiresAt: new Date(Date.now() + 60_000),
      verifiedAt: null,
    });
    mockAuthAccountRepository.findPasswordHashForUser.mockResolvedValue("hashed");
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockStepUpRepository.markChallengeVerified.mockResolvedValue(true);

    const response = await request(app)
      .post("/api/v1/auth/step-up/verify")
      .set("Authorization", "Bearer access.jwt")
      .send({ stepUpId, password: "StrongPassword123!" });

    expect(response.status).toBe(200);
    expect(response.body.data.stepUpToken).toEqual(expect.any(String));
    expect(response.body.data.expiresIn).toBe(300);
  });

  it("returns 403 STEP_UP_REQUIRED when disabling MFA without a step-up token", async () => {
    const response = await request(app)
      .delete("/api/v1/users/me/mfa")
      .set("Authorization", "Bearer access.jwt")
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("STEP_UP_REQUIRED");
  });
});
