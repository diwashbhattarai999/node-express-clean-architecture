import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import { RolePermissionNotFoundError } from "@/modules/auth/authorization/application/errors/role-permission-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { RemoveRolePermissionUseCase } from "@/modules/auth/authorization/application/use-cases/remove-role-permission.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("RemoveRolePermissionUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
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

  const useCase = new RemoveRolePermissionUseCase(identityRepository, permissionRepository);

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
    vi.mocked(permissionRepository.removeFromRole).mockResolvedValue("removed");
  });

  it("removes the assignment after verifying the session and permissions.assign", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionId: "perm-1",
      }),
    ).resolves.toBeUndefined();

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "permissions.assign");
    expect(permissionRepository.removeFromRole).toHaveBeenCalledWith("role-1", "perm-1");
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(permissionRepository.removeFromRole).mockResolvedValue("role_not_found");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "missing",
        permissionId: "perm-1",
      }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws RolePermissionNotFoundError when the permission is not assigned", async () => {
    vi.mocked(permissionRepository.removeFromRole).mockResolvedValue("assignment_not_found");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionId: "perm-1",
      }),
    ).rejects.toBeInstanceOf(RolePermissionNotFoundError);
  });

  it("throws PermissionDeniedError without permissions.assign", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionId: "perm-1",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(permissionRepository.removeFromRole).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        roleId: "role-1",
        permissionId: "perm-1",
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
        roleId: "role-1",
        permissionId: "perm-1",
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
        roleId: "role-1",
        permissionId: "perm-1",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
