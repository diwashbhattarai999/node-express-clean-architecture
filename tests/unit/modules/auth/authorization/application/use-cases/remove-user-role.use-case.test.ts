import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import { UserRoleNotFoundError } from "@/modules/auth/authorization/application/errors/user-role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { RemoveUserRoleUseCase } from "@/modules/auth/authorization/application/use-cases/remove-user-role.use-case";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("RemoveUserRoleUseCase", () => {
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

  const useCase = new RemoveUserRoleUseCase(
    identityRepository,
    permissionRepository,
    roleRepository,
  );

  const input = {
    userId: "user-1",
    sessionId: "session-1",
    targetUserId: "user-2",
    roleId: "role-1",
  };

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
    vi.mocked(roleRepository.removeFromUser).mockResolvedValue("removed");
  });

  it("removes the assignment after verifying the session and roles.assign", async () => {
    await expect(useCase.execute(input)).resolves.toBeUndefined();

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.assign");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(roleRepository.removeFromUser).toHaveBeenCalledWith("user-2", "role-1");
  });

  it("throws UserNotFoundError when the target user does not exist", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UserNotFoundError);
    expect(roleRepository.removeFromUser).not.toHaveBeenCalled();
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(roleRepository.removeFromUser).mockResolvedValue("role_not_found");

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws UserRoleNotFoundError when the role is not assigned", async () => {
    vi.mocked(roleRepository.removeFromUser).mockResolvedValue("assignment_not_found");

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UserRoleNotFoundError);
  });

  it("throws PermissionDeniedError without roles.assign", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
