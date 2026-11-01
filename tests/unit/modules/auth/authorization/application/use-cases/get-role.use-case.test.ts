import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { GetRoleUseCase } from "@/modules/auth/authorization/application/use-cases/get-role.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("GetRoleUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const permissionRepository: IPermissionRepository = {
    listKeysForUser: vi.fn(),
    hasKeyForUser: vi.fn(),
    listForRole: vi.fn(),
  };

  const roleRepository: IRoleRepository = {
    listForUser: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const useCase = new GetRoleUseCase(identityRepository, permissionRepository, roleRepository);

  const role = {
    id: "role-1",
    key: "admin",
    name: "Admin",
    description: "Administrator",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

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
    vi.mocked(roleRepository.findById).mockResolvedValue(role);
    vi.mocked(permissionRepository.listForRole).mockResolvedValue(permissions);
  });

  it("returns the role and its permissions after verifying the session and roles.read", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).resolves.toEqual({ role, permissions });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.read");
    expect(roleRepository.findById).toHaveBeenCalledWith("role-1");
    expect(permissionRepository.listForRole).toHaveBeenCalledWith("role-1");
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(roleRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "missing" }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
    expect(permissionRepository.listForRole).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without roles.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(roleRepository.findById).not.toHaveBeenCalled();
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
