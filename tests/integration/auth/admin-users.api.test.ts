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

const mockCredentialsRepository = {
  findPasswordLoginCandidate: vi.fn(),
  findPasswordResetTarget: vi.fn(),
  findPasswordResetTargetByUserId: vi.fn(),
  replacePasswordResetToken: vi.fn(),
  validatePasswordResetTokenHash: vi.fn(),
  resetPasswordByTokenHash: vi.fn(),
  findPasswordHashForUser: vi.fn(),
  changePasswordForUser: vi.fn(),
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
      return mockCredentialsRepository;
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

describe("Admin user management APIs", () => {
  const app = createApp();
  const actorId = "550e8400-e29b-41d4-a716-446655440000";
  const targetUserId = "550e8400-e29b-41d4-a716-446655440010";
  const roleId = "550e8400-e29b-41d4-a716-446655440030";

  const targetUser = {
    id: targetUserId,
    status: "active" as const,
    displayName: "Grace Hopper",
    avatarUrl: null,
    email: "grace@example.com",
    username: "grace",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  const publicUser = {
    id: targetUserId,
    status: "active",
    displayName: "Grace Hopper",
    avatarUrl: null,
    email: "grace@example.com",
    username: "grace",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

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
    mockIdentityRepository.listUsers.mockResolvedValue({ total: 1, items: [targetUser] });
    mockIdentityRepository.findAdminDetails.mockResolvedValue({
      user: targetUser,
      profile: {
        firstName: "Grace",
        lastName: "Hopper",
        locale: "en-US",
        timezone: "UTC",
        bio: null,
      },
      identities: [
        {
          id: "550e8400-e29b-41d4-a716-446655440040",
          type: "email",
          identifier: "grace@example.com",
          verifiedAt: new Date("2026-01-01T00:00:00.000Z"),
          isPrimary: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    });
    mockRoleRepository.listForUser.mockResolvedValue([
      {
        id: roleId,
        key: "member",
        name: "Member",
        description: "Default member role",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);
    mockIdentityRepository.updateOwnProfile.mockResolvedValue({
      user: { ...targetUser, displayName: "Dr. Hopper" },
      profile: {
        firstName: "Grace",
        lastName: "Hopper",
        locale: "en-US",
        timezone: "UTC",
        bio: "Navy",
      },
    });
    mockIdentityRepository.setUserStatus.mockResolvedValue({ ...targetUser, status: "suspended" });
    mockSessionRepository.revokeAllSessionsForUser.mockResolvedValue(2);
    mockIdentityRepository.hardDeleteById.mockResolvedValue("deleted");
    mockCredentialsRepository.findPasswordResetTargetByUserId.mockResolvedValue({
      userId: targetUserId,
      identityId: "550e8400-e29b-41d4-a716-446655440040",
      email: "grace@example.com",
    });
    mockCredentialsRepository.replacePasswordResetToken.mockResolvedValue(undefined);
    mockEmailSender.send.mockResolvedValue({ id: "mail-1" });
  });

  it("lists users when the caller has users.read", async () => {
    const response = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", "Bearer access.jwt")
      .query({ search: "grace", status: "active", sortBy: "displayName", sortOrder: "asc" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Users retrieved.",
      data: [publicUser],
      meta: {
        totalRecords: 1,
        perPage: 10,
        currentPage: 1,
        recordShown: 1,
      },
    });
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "users.read");
    expect(mockIdentityRepository.listUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "grace",
      status: "active",
      sortBy: "displayName",
      sortOrder: "asc",
    });
  });

  it("returns the user, profile, roles, and identities", async () => {
    const response = await request(app)
      .get(`/api/v1/admin/users/${targetUserId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "User retrieved.",
      data: {
        user: publicUser,
        profile: {
          firstName: "Grace",
          lastName: "Hopper",
          locale: "en-US",
          timezone: "UTC",
          bio: null,
        },
        roles: [
          {
            id: roleId,
            key: "member",
            name: "Member",
            description: "Default member role",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        identities: [
          {
            id: "550e8400-e29b-41d4-a716-446655440040",
            type: "email",
            identifier: "grace@example.com",
            verifiedAt: "2026-01-01T00:00:00.000Z",
            isPrimary: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    });
  });

  it("updates the user's profile", async () => {
    const response = await request(app)
      .patch(`/api/v1/admin/users/${targetUserId}`)
      .set("Authorization", "Bearer access.jwt")
      .send({ displayName: "Dr. Hopper", bio: "Navy" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User updated.");
    expect(response.body.data.user.displayName).toBe("Dr. Hopper");
    expect(response.body.data.profile.bio).toBe("Navy");
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "users.update");
    expect(mockIdentityRepository.updateOwnProfile).toHaveBeenCalledWith({
      userId: targetUserId,
      displayName: "Dr. Hopper",
      bio: "Navy",
    });
  });

  it("suspends the user and revokes sessions", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/suspend`)
      .set("Authorization", "Bearer access.jwt")
      .send({ reason: "Policy violation" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User suspended.");
    expect(response.body.data.status).toBe("suspended");
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "users.suspend");
    expect(mockIdentityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: targetUserId,
      status: "suspended",
    });
    expect(mockSessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith(targetUserId);
  });

  it("reactivates the user", async () => {
    mockIdentityRepository.setUserStatus.mockResolvedValue({ ...targetUser, status: "active" });

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/reactivate`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User reactivated.");
    expect(mockIdentityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: targetUserId,
      status: "active",
    });
    expect(mockSessionRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("disables the user and revokes sessions", async () => {
    mockIdentityRepository.setUserStatus.mockResolvedValue({ ...targetUser, status: "disabled" });

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/disable`)
      .set("Authorization", "Bearer access.jwt")
      .send({ reason: "Inactive" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User disabled.");
    expect(mockIdentityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: targetUserId,
      status: "disabled",
    });
    expect(mockSessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith(targetUserId);
  });

  it("enables the user", async () => {
    mockIdentityRepository.setUserStatus.mockResolvedValue({ ...targetUser, status: "active" });

    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/enable`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User enabled.");
    expect(mockIdentityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: targetUserId,
      status: "active",
    });
  });

  it("revokes all sessions for the user", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/sessions/revoke-all`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Sessions revoked.",
      data: { revokedCount: 2 },
    });
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "sessions.revoke");
    expect(mockSessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith(targetUserId);
  });

  it("sends a password-reset email without returning a token", async () => {
    const response = await request(app)
      .post(`/api/v1/admin/users/${targetUserId}/password-reset`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Password reset email sent.",
      data: null,
    });
    expect(response.body.data).toBeNull();
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "users.update");
    expect(mockCredentialsRepository.findPasswordResetTargetByUserId).toHaveBeenCalledWith(
      targetUserId,
    );
    expect(mockCredentialsRepository.replacePasswordResetToken).toHaveBeenCalledOnce();
    expect(mockEmailSender.send).toHaveBeenCalledOnce();
  });

  it("hard-deletes the user when hard=true", async () => {
    const response = await request(app)
      .delete(`/api/v1/admin/users/${targetUserId}`)
      .set("Authorization", "Bearer access.jwt")
      .query({ hard: "true" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "User deleted.",
      data: null,
    });
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "users.delete");
    expect(mockIdentityRepository.hardDeleteById).toHaveBeenCalledWith(targetUserId);
  });

  it("returns 422 when hard delete is missing hard=true", async () => {
    const response = await request(app)
      .delete(`/api/v1/admin/users/${targetUserId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(mockIdentityRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is missing", async () => {
    mockIdentityRepository.findAdminDetails.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/v1/admin/users/${targetUserId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("returns 403 without the required permission", async () => {
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(false);

    const response = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("PERMISSION_DENIED");
    expect(mockIdentityRepository.listUsers).not.toHaveBeenCalled();
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).get("/api/v1/admin/users");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
