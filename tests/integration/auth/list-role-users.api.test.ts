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
  updateSessionLabelForUser: vi.fn(),
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
  findOwnProfile: vi.fn(),
  findAuthenticatedPrincipal: vi.fn(),
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
  hasVerifiedFactor: vi.fn(),
  insertChallenge: vi.fn(),
  findAuthUserById: vi.fn(),
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

vi.mock("@/modules/auth/mfa/infrastructure/repositories/postgres-mfa.repository", () => ({
  PostgresMfaRepository: vi.fn(function PostgresMfaRepository() {
    return mockIdentityRepository;
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

describe("Admin list role users API", () => {
  const app = createApp();
  const roleId = "550e8400-e29b-41d4-a716-446655440030";
  const userId = "550e8400-e29b-41d4-a716-446655440010";

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockIdentityRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["admin"],
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
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(true);
    mockRoleRepository.findById.mockResolvedValue({
      id: roleId,
      key: "member",
      name: "Member",
      description: "Default member role",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    mockRoleRepository.listUsersForRole.mockResolvedValue({
      total: 1,
      items: [
        {
          id: userId,
          status: "active",
          displayName: "Grace Hopper",
          avatarUrl: null,
          email: "grace@example.com",
          username: "grace",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          updatedAt: new Date("2026-01-03T00:00:00.000Z"),
        },
      ],
    });
  });

  it("returns paginated users when the caller has roles.read", async () => {
    const response = await request(app)
      .get(`/api/v1/admin/roles/${roleId}/users`)
      .set("Authorization", "Bearer access.jwt")
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Role users retrieved.",
      data: [
        {
          id: userId,
          status: "active",
          displayName: "Grace Hopper",
          avatarUrl: null,
          email: "grace@example.com",
          username: "grace",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
      ],
      meta: {
        totalRecords: 1,
        perPage: 10,
        currentPage: 1,
        recordShown: 1,
      },
    });
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      "roles.read",
    );
    expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId);
    expect(mockRoleRepository.listUsersForRole).toHaveBeenCalledWith(roleId, { page: 1, limit: 10 });
  });

  it("returns an empty page when the role has no users", async () => {
    mockRoleRepository.listUsersForRole.mockResolvedValue({ total: 0, items: [] });

    const response = await request(app)
      .get(`/api/v1/admin/roles/${roleId}/users`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.totalRecords).toBe(0);
  });

  it("returns 404 when the role is missing", async () => {
    mockRoleRepository.findById.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/v1/admin/roles/${roleId}/users`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
    expect(mockRoleRepository.listUsersForRole).not.toHaveBeenCalled();
  });

  it("returns 403 without roles.read", async () => {
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(false);

    const response = await request(app)
      .get(`/api/v1/admin/roles/${roleId}/users`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("PERMISSION_DENIED");
    expect(mockRoleRepository.findById).not.toHaveBeenCalled();
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).get(`/api/v1/admin/roles/${roleId}/users`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });

  it("returns 422 for an invalid role id", async () => {
    const response = await request(app)
      .get("/api/v1/admin/roles/not-a-uuid/users")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
