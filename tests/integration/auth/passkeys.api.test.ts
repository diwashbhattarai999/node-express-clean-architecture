import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "550e8400-e29b-41d4-a716-446655440000";
const passkeyId = "660e8400-e29b-41d4-a716-446655440000";
const challengeValue = "dGVzdC1jaGFsbGVuZ2U";

const mockPasskeyRepository = {
  findAuthUserById: vi.fn(),
  listPasskeysForUser: vi.fn(),
  findPasskeyForUser: vi.fn(),
  findPasskeyByCredentialId: vi.fn(),
  insertPasskey: vi.fn(),
  updatePasskeyName: vi.fn(),
  markPasskeyUsed: vi.fn(),
  revokePasskey: vi.fn(),
  countViableAuthMethods: vi.fn(),
  insertChallenge: vi.fn(),
  consumeOpenChallenges: vi.fn(),
  findUsableChallenge: vi.fn(),
  consumeChallenge: vi.fn(),
};

const mockWebAuthnService = {
  generateRegistrationOptions: vi.fn(),
  verifyRegistration: vi.fn(),
  generateAuthenticationOptions: vi.fn(),
  verifyAuthentication: vi.fn(),
};

const mockAuthAccountRepository = {
  findAuthenticatedPrincipal: vi.fn(),
  findIdentityByNormalized: vi.fn(),
  hasVerifiedFactor: vi.fn(),
  createSession: vi.fn(),
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

vi.mock("@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository", () => ({
  PostgresSessionRepository: vi.fn(function PostgresSessionRepository() {
    return mockAuthAccountRepository;
  }),
}));

vi.mock("@/modules/auth/passkeys/infrastructure/repositories/postgres-passkey.repository", () => ({
  PostgresPasskeyRepository: vi.fn(function PostgresPasskeyRepository() {
    return mockPasskeyRepository;
  }),
}));

vi.mock("@/modules/auth/passkeys/infrastructure/webauthn/simple-webauthn.service", () => ({
  SimpleWebAuthnService: vi.fn(function SimpleWebAuthnService() {
    return mockWebAuthnService;
  }),
}));

vi.mock("@/modules/auth/shared/infrastructure/security/jose-access-token.signer", () => ({
  JoseAccessTokenSigner: vi.fn(function JoseAccessTokenSigner() {
    return mockAccessTokenSigner;
  }),
}));

const { createApp } = await import("@/app/create-app");

const clientDataJSON = Buffer.from(
  JSON.stringify({
    type: "webauthn.create",
    challenge: challengeValue,
    origin: "http://localhost:5173",
  }),
).toString("base64url");

describe("Auth passkeys API", () => {
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
    mockPasskeyRepository.findAuthUserById.mockResolvedValue({
      id: userId,
      status: "active",
      displayName: "Ada Lovelace",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    mockPasskeyRepository.listPasskeysForUser.mockResolvedValue([]);
    mockPasskeyRepository.consumeOpenChallenges.mockResolvedValue(undefined);
    mockPasskeyRepository.insertChallenge.mockResolvedValue({
      id: "challenge-1",
      userId,
      type: "register",
      challenge: challengeValue,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    });
  });

  it("lists passkeys for the current user", async () => {
    mockPasskeyRepository.listPasskeysForUser.mockResolvedValue([
      {
        id: passkeyId,
        userId,
        credentialId: "cred-1",
        publicKey: Buffer.from("pk"),
        signCount: 0,
        transports: ["internal"],
        aaguid: null,
        backedUp: true,
        name: "Laptop",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        lastUsedAt: null,
        revokedAt: null,
      },
    ]);

    const response = await request(app)
      .get("/api/v1/users/me/passkeys")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: passkeyId,
        name: "Laptop",
        createdAt: "2026-01-01T00:00:00.000Z",
        lastUsedAt: null,
      },
    ]);
  });

  it("starts passkey registration and verifies the attestation", async () => {
    mockWebAuthnService.generateRegistrationOptions.mockResolvedValue({
      challenge: challengeValue,
      options: { challenge: challengeValue, rp: { id: "localhost", name: "Acme" } },
    });

    const options = await request(app)
      .post("/api/v1/users/me/passkeys/register/options")
      .set("Authorization", "Bearer access.jwt");

    expect(options.status).toBe(200);
    expect(options.body.data.challenge).toBe(challengeValue);

    mockPasskeyRepository.findUsableChallenge.mockResolvedValue({
      id: "challenge-1",
      userId,
      type: "register",
      challenge: challengeValue,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    });
    mockWebAuthnService.verifyRegistration.mockResolvedValue({
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 0,
      transports: ["internal"],
      aaguid: null,
      backedUp: true,
    });
    mockPasskeyRepository.findPasskeyByCredentialId.mockResolvedValue(null);
    mockPasskeyRepository.consumeChallenge.mockResolvedValue(true);
    mockPasskeyRepository.insertPasskey.mockResolvedValue({
      id: passkeyId,
      userId,
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 0,
      transports: ["internal"],
      aaguid: null,
      backedUp: true,
      name: "Laptop",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: null,
    });

    const verify = await request(app)
      .post("/api/v1/users/me/passkeys/register/verify")
      .set("Authorization", "Bearer access.jwt")
      .send({
        id: "cred-1",
        rawId: "cred-1",
        type: "public-key",
        response: {
          clientDataJSON,
          attestationObject: "attestation",
          transports: ["internal"],
        },
        name: "Laptop",
      });

    expect(verify.status).toBe(201);
    expect(verify.body.data).toMatchObject({
      id: passkeyId,
      name: "Laptop",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("starts and verifies a passkey login", async () => {
    mockWebAuthnService.generateAuthenticationOptions.mockResolvedValue({
      challenge: challengeValue,
      options: { challenge: challengeValue, rpId: "localhost" },
    });
    mockAuthAccountRepository.findIdentityByNormalized.mockResolvedValue({ userId });
    mockPasskeyRepository.listPasskeysForUser.mockResolvedValue([
      {
        id: passkeyId,
        userId,
        credentialId: "cred-1",
        publicKey: Buffer.from("pk"),
        signCount: 1,
        transports: ["internal"],
        aaguid: null,
        backedUp: true,
        name: "Laptop",
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: null,
      },
    ]);

    const begin = await request(app).post("/api/v1/auth/passkeys/login/options").send({
      identifier: "ada@example.com",
    });

    expect(begin.status).toBe(200);
    expect(begin.body.data.challenge).toBe(challengeValue);

    mockPasskeyRepository.findUsableChallenge.mockResolvedValue({
      id: "challenge-1",
      userId,
      type: "login",
      challenge: challengeValue,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    });
    mockPasskeyRepository.findPasskeyByCredentialId.mockResolvedValue({
      id: passkeyId,
      userId,
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 1,
      transports: ["internal"],
      aaguid: null,
      backedUp: true,
      name: "Laptop",
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
    });
    mockWebAuthnService.verifyAuthentication.mockResolvedValue({ newSignCount: 2 });
    mockPasskeyRepository.consumeChallenge.mockResolvedValue(true);
    mockPasskeyRepository.markPasskeyUsed.mockResolvedValue(undefined);
    mockAuthAccountRepository.createSession.mockResolvedValue(undefined);

    const assertionClientData = Buffer.from(
      JSON.stringify({
        type: "webauthn.get",
        challenge: challengeValue,
        origin: "http://localhost:5173",
      }),
    ).toString("base64url");

    const verify = await request(app).post("/api/v1/auth/passkeys/login/verify").send({
      id: "cred-1",
      rawId: "cred-1",
      type: "public-key",
      response: {
        clientDataJSON: assertionClientData,
        authenticatorData: "auth-data",
        signature: "signature",
      },
    });

    expect(verify.status).toBe(200);
    expect(verify.body.message).toBe("Signed in.");
    expect(verify.body.data.accessToken).toBe("access.jwt");
    expect(verify.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refresh_token=")]),
    );
    expect(mockAuthAccountRepository.createSession).toHaveBeenCalled();
  });

  it("renames and deletes a passkey", async () => {
    mockPasskeyRepository.updatePasskeyName.mockResolvedValue({
      id: passkeyId,
      userId,
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 0,
      transports: null,
      aaguid: null,
      backedUp: null,
      name: "Phone",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: null,
    });

    const renamed = await request(app)
      .patch(`/api/v1/users/me/passkeys/${passkeyId}`)
      .set("Authorization", "Bearer access.jwt")
      .send({ name: "Phone" });

    expect(renamed.status).toBe(200);
    expect(renamed.body.data.name).toBe("Phone");

    mockPasskeyRepository.findPasskeyForUser.mockResolvedValue({
      id: passkeyId,
      userId,
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 0,
      transports: null,
      aaguid: null,
      backedUp: null,
      name: "Phone",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: null,
    });
    mockPasskeyRepository.countViableAuthMethods.mockResolvedValue(1);
    mockPasskeyRepository.revokePasskey.mockResolvedValue({
      id: passkeyId,
      userId,
      credentialId: "cred-1",
      publicKey: Buffer.from("pk"),
      signCount: 0,
      transports: null,
      aaguid: null,
      backedUp: null,
      name: "Phone",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: new Date(),
    });

    const deleted = await request(app)
      .delete(`/api/v1/users/me/passkeys/${passkeyId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(deleted.status).toBe(200);
    expect(deleted.body.data).toBeNull();
  });
});
