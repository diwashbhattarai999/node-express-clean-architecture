import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuthAccountRepository = {
  findIdentityByNormalized: vi.fn(),
  register: vi.fn(),
  findAuthenticatedPrincipal: vi.fn(),
  findOwnProfile: vi.fn(),
  updateOwnProfile: vi.fn(),
  listIdentitiesForUser: vi.fn(),
  addEmailIdentity: vi.fn(),
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
  scheduleAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
  upsertUsername: vi.fn(),
};

const mockOAuthAuthorizationStateRepository = {
  save: vi.fn(),
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

vi.mock(
  "@/modules/auth/oauth/infrastructure/repositories/postgres-oauth-authorization-state.repository",
  () => ({
    PostgresOAuthAuthorizationStateRepository: vi.fn(function PostgresOAuthAuthorizationStateRepository() {
      return mockOAuthAuthorizationStateRepository;
    }),
  }),
);

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

describe("Auth start OAuth authorization API", () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOAuthAuthorizationStateRepository.save.mockResolvedValue(undefined);
  });

  it("redirects to the Google authorization URL", async () => {
    const response = await request(app)
      .get("/api/v1/auth/oauth/google/authorize")
      .query({
        redirectUri: "http://localhost:5173/auth/callback",
        state: "client-csrf-state",
      })
      .redirects(0);

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(
      /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/,
    );
    expect(response.headers.location).toContain("client_id=test-google-client-id");
    expect(response.headers.location).toContain(
      encodeURIComponent("http://localhost:4000/api/v1/auth/oauth/google/callback"),
    );
    expect(mockOAuthAuthorizationStateRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        intent: "login",
        redirectUri: "http://localhost:5173/auth/callback",
        clientState: "client-csrf-state",
      }),
    );
  });

  it("returns the authorization URL as JSON when response=json", async () => {
    const response = await request(app).get("/api/v1/auth/oauth/google/authorize").query({
      redirectUri: "http://localhost:5173/auth/callback",
      state: "client-csrf-state",
      response: "json",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.authorizationUrl).toMatch(
      /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/,
    );
  });

  it("returns 404 when the provider is not configured", async () => {
    const response = await request(app).get("/api/v1/auth/oauth/github/authorize").query({
      redirectUri: "http://localhost:5173/auth/callback",
      state: "client-csrf-state",
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
    expect(mockOAuthAuthorizationStateRepository.save).not.toHaveBeenCalled();
  });

  it("returns 422 when redirectUri is not allow-listed", async () => {
    const response = await request(app).get("/api/v1/auth/oauth/google/authorize").query({
      redirectUri: "https://evil.example/callback",
      state: "client-csrf-state",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockOAuthAuthorizationStateRepository.save).not.toHaveBeenCalled();
  });

  it("returns 422 for an unknown provider", async () => {
    const response = await request(app).get("/api/v1/auth/oauth/facebook/authorize").query({
      redirectUri: "http://localhost:5173/auth/callback",
      state: "client-csrf-state",
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
