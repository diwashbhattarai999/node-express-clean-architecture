import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { ListUserRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-user-roles.use-case";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListUserRolesUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "existsById" | "findAuthenticatedPrincipal"> =
    {
      existsById: vi.fn(),
      findAuthenticatedPrincipal: vi.fn(),
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

  const useCase = new ListUserRolesUseCase(identityRepository, permissionRepository, roleRepository);

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
    vi.mocked(identityRepository.existsById).mockResolvedValue(true);
    vi.mocked(roleRepository.listForUser).mockResolvedValue(roles);
  });

  it("lists the target user's roles after verifying the session and roles.read", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toEqual(roles);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.read");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(roleRepository.listForUser).toHaveBeenCalledWith("user-2");
  });

  it("throws UserNotFoundError when the target user does not exist", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(roleRepository.listForUser).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without roles.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.existsById).not.toHaveBeenCalled();
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
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
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
