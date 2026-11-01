import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleAlreadyAssignedError } from "@/modules/auth/authorization/application/errors/role-already-assigned.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { AssignUserRoleUseCase } from "@/modules/auth/authorization/application/use-cases/assign-user-role.use-case";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("AssignUserRoleUseCase", () => {
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

  const useCase = new AssignUserRoleUseCase(
    identityRepository,
    permissionRepository,
    roleRepository,
  );

  const role = {
    id: "role-1",
    key: "member",
    name: "Member",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

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
    vi.mocked(roleRepository.assignToUser).mockResolvedValue({ outcome: "assigned", role });
  });

  it("assigns the role after verifying the session and roles.assign", async () => {
    await expect(useCase.execute(input)).resolves.toEqual(role);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.assign");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(roleRepository.assignToUser).toHaveBeenCalledWith({
      userId: "user-2",
      roleId: "role-1",
      assignedBy: "user-1",
    });
  });

  it("throws UserNotFoundError when the target user does not exist", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UserNotFoundError);
    expect(roleRepository.assignToUser).not.toHaveBeenCalled();
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(roleRepository.assignToUser).mockResolvedValue({ outcome: "role_not_found" });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws RoleAlreadyAssignedError when the role is already assigned", async () => {
    vi.mocked(roleRepository.assignToUser).mockResolvedValue({ outcome: "already_assigned" });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(RoleAlreadyAssignedError);
  });

  it("throws PermissionDeniedError without roles.assign", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.existsById).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute({ ...input, sessionId: "bad" })).rejects.toBeInstanceOf(
      TokenInvalidError,
    );
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
