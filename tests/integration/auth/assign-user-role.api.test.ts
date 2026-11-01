import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRoleRepository = {
  listForUser: vi.fn(),
  list: vi.fn(),
  findById: vi.fn(),
  findByKey: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  listUsersForRole: vi.fn(),
  assignToUser: vi.fn(),
  removeFromUser: vi.fn(),
  replaceForUser: vi.fn(),
};

const mockPermissionRepository = {
  listKeysForUser: vi.fn(),
  hasKeyForUser: vi.fn(),
  listForRole: vi.fn(),
  list: vi.fn(),
  findById: vi.fn(),
  replaceForRole: vi.fn(),
  removeFromRole: vi.fn(),
};

const mockSessionRepository = {
  createSession: vi.fn(),
  rotateRefreshSession: vi.fn(),
  revokeSessionByRefreshTokenHash: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeAllSessionsForUser: vi.fn(),
  revokeOtherSessionsForUser: vi.fn(),
  listSessionsForUser: vi.fn(),
  findSessionForUser: vi.fn(),
  revokeSessionForUser: vi.fn(),
};

const mockAccessTokenSigner = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockPasswordHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

const mockEmailSender = {
  send: vi.fn(),
};

const mockIdentityRepository = {
  findIdentityByNormalized: vi.fn(),
  register: vi.fn(),
  existsById: vi.fn(),
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
};

vi.mock("@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository", () => ({
  PostgresIdentityRepository: vi.fn(function PostgresIdentityRepository() {
    return mockIdentityRepository;
  }),
}));

vi.mock(
  "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository",
  () => ({
    PostgresCredentialsRepository: vi.fn(function PostgresCredentialsRepository() {
      return mockIdentityRepository;
    }),
  }),
);

vi.mock(
  "@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository",
  () => ({
    PostgresVerificationRepository: vi.fn(function PostgresVerificationRepository() {
      return mockIdentityRepository;
    }),
  }),
);

vi.mock("@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository", () => ({
  PostgresSessionRepository: vi.fn(function PostgresSessionRepository() {
    return mockSessionRepository;
  }),
}));

vi.mock("@/modules/auth/authorization/infrastructure/repositories/postgres-role.repository", () => ({
  PostgresRoleRepository: vi.fn(function PostgresRoleRepository() {
    return mockRoleRepository;
  }),
}));

vi.mock(
  "@/modules/auth/authorization/infrastructure/repositories/postgres-permission.repository",
  () => ({
    PostgresPermissionRepository: vi.fn(function PostgresPermissionRepository() {
      return mockPermissionRepository;
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

describe("Admin assign user role API", () => {
  const app = createApp();
  const targetUserId = "550e8400-e29b-41d4-a716-446655440010";
  const roleId = "550e8400-e29b-41d4-a716-446655440030";
  const actorId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: actorId,
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockIdentityRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["admin"],
      user: {
        id: actorId,
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: "ada",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(true);
    mockIdentityRepository.existsById.mockResolvedValue(true);
    mockRoleRepository.assignToUser.mockResolvedValue({
      outcome: "assigned",
      role: {
        id: roleId,
        key: "member",
        name: "Member",
        description: "Default member role",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
  });

  it("assigns the role when the caller has roles.assign", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Role assigned.",
      data: {
        id: roleId,
        key: "member",
        name: "Member",
        description: "Default member role",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "roles.assign");
    expect(mockRoleRepository.assignToUser).toHaveBeenCalledWith({
      userId: targetUserId,
      roleId,
      assignedBy: actorId,
    });
  });

  it("returns 404 when the user is missing", async () => {
    mockIdentityRepository.existsById.mockResolvedValue(false);

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
    expect(mockRoleRepository.assignToUser).not.toHaveBeenCalled();
  });

  it("returns 404 when the role is missing", async () => {
    mockRoleRepository.assignToUser.mockResolvedValue({ outcome: "role_not_found" });

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("returns 409 when the role is already assigned", async () => {
    mockRoleRepository.assignToUser.mockResolvedValue({ outcome: "already_assigned" });

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CONFLICT");
  });

  it("returns 403 without roles.assign", async () => {
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(false);

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("PERMISSION_DENIED");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .send({ roleId });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 422 for an invalid role id", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/roles`)
      .set("Authorization", "Bearer access.jwt")
      .send({ roleId: "not-a-uuid" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
