import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleAssignedError } from "@/modules/auth/authorization/application/errors/role-assigned.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { DeleteRoleUseCase } from "@/modules/auth/authorization/application/use-cases/delete-role.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("DeleteRoleUseCase", () => {
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

  const useCase = new DeleteRoleUseCase(identityRepository, permissionRepository, roleRepository);

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
    vi.mocked(roleRepository.deleteById).mockResolvedValue("deleted");
  });

  it("deletes a role after verifying the session and roles.delete", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).resolves.toBeUndefined();

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.delete");
    expect(roleRepository.deleteById).toHaveBeenCalledWith("role-1");
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(roleRepository.deleteById).mockResolvedValue("not_found");

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "missing" }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws RoleAssignedError when the role is still assigned", async () => {
    vi.mocked(roleRepository.deleteById).mockResolvedValue("assigned");

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(RoleAssignedError);
  });

  it("throws PermissionDeniedError without roles.delete", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(roleRepository.deleteById).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
