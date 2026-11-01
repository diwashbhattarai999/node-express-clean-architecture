import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { AssignRolePermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/assign-role-permissions.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { ValidationError } from "@/shared/errors/validation-error";

describe("AssignRolePermissionsUseCase", () => {
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

  const useCase = new AssignRolePermissionsUseCase(identityRepository, permissionRepository);

  const permissions = [
    {
      id: "perm-1",
      key: "roles.read",
      name: "Read roles",
      description: null,
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
    vi.mocked(permissionRepository.replaceForRole).mockResolvedValue({
      outcome: "replaced",
      permissions,
    });
  });

  it("replaces the role permission set after verifying the session and permissions.assign", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionIds: ["perm-1", "perm-1"],
      }),
    ).resolves.toEqual(permissions);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "permissions.assign");
    expect(permissionRepository.replaceForRole).toHaveBeenCalledWith({
      roleId: "role-1",
      permissionIds: ["perm-1"],
      assignedBy: "user-1",
    });
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(permissionRepository.replaceForRole).mockResolvedValue({
      outcome: "role_not_found",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "missing",
        permissionIds: ["perm-1"],
      }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws ValidationError when a permission id is unknown", async () => {
    vi.mocked(permissionRepository.replaceForRole).mockResolvedValue({
      outcome: "permissions_not_found",
      missingIds: ["missing"],
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionIds: ["missing"],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws PermissionDeniedError without permissions.assign", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        permissionIds: ["perm-1"],
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(permissionRepository.replaceForRole).not.toHaveBeenCalled();
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
        permissionIds: [],
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
        permissionIds: [],
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
        permissionIds: [],
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
