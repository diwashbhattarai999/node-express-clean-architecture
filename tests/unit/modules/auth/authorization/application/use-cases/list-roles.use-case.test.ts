import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { ListRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-roles.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListRolesUseCase", () => {
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
  };

  const useCase = new ListRolesUseCase(identityRepository, permissionRepository, roleRepository);

  const roles = {
    items: [
      {
        id: "role-1",
        key: "member",
        name: "Member",
        description: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    total: 1,
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
    vi.mocked(roleRepository.list).mockResolvedValue(roles);
  });

  it("lists roles after verifying the session and roles.read", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", page: 1, limit: 10 }),
    ).resolves.toEqual(roles);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.read");
    expect(roleRepository.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("forwards search to the repository", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      page: 2,
      limit: 20,
      search: "admin",
    });

    expect(roleRepository.list).toHaveBeenCalledWith({ page: 2, limit: 20, search: "admin" });
  });

  it("throws PermissionDeniedError without roles.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(roleRepository.list).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad", page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired", page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked", page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
