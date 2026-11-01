import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { GetAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/get-admin-user.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("GetAdminUserUseCase", () => {
  const identityRepository: Pick<
    IIdentityRepository,
    "findAuthenticatedPrincipal" | "findAdminDetails"
  > = {
    findAuthenticatedPrincipal: vi.fn(),
    findAdminDetails: vi.fn(),
  };

  const permissionRepository: IPermissionRepository = {
    listKeysForUser: vi.fn(),
    hasKeyForUser: vi.fn(),
    listForRole: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    replaceForRole: vi.fn(),
    removeFromRole: vi.fn(),
  };

  const roleRepository: IRoleRepository = {
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

  const useCase = new GetAdminUserUseCase(
    identityRepository,
    permissionRepository,
    roleRepository,
  );

  const details = {
    user: {
      id: "user-2",
      status: "active" as const,
      displayName: "Grace",
      avatarUrl: null,
      email: "grace@example.com",
      username: "grace",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    profile: {
      firstName: "Grace",
      lastName: "Hopper",
      locale: "en-US",
      timezone: "UTC",
      bio: null,
    },
    identities: [
      {
        id: "identity-1",
        type: "email" as const,
        identifier: "grace@example.com",
        verifiedAt: new Date("2026-01-01T00:00:00.000Z"),
        isPrimary: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
  };

  const roles = [
    {
      id: "role-1",
      key: "member",
      name: "Member",
      description: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["admin"],
      user: {
        id: "user-1",
        status: "active",
        displayName: "Ada",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(true);
    vi.mocked(identityRepository.findAdminDetails).mockResolvedValue(details);
    vi.mocked(roleRepository.listForUser).mockResolvedValue(roles);
  });

  it("returns user details and roles after verifying users.read", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toEqual({ ...details, roles });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.read");
    expect(identityRepository.findAdminDetails).toHaveBeenCalledWith("user-2");
    expect(roleRepository.listForUser).toHaveBeenCalledWith("user-2");
  });

  it("throws UserNotFoundError when the target user is missing", async () => {
    vi.mocked(identityRepository.findAdminDetails).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(roleRepository.listForUser).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without users.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.findAdminDetails).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "expired",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "revoked",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
