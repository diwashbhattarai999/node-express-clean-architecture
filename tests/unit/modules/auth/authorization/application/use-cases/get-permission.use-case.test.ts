import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { PermissionNotFoundError } from "@/modules/auth/authorization/application/errors/permission-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { GetPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/get-permission.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("GetPermissionUseCase", () => {
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

  const useCase = new GetPermissionUseCase(identityRepository, permissionRepository);

  const permission = {
    id: "perm-1",
    key: "roles.read",
    name: "Read roles",
    description: "List and view roles",
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
    vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
  });

  it("returns the permission after verifying the session and permissions.read", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", permissionId: "perm-1" }),
    ).resolves.toEqual(permission);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "permissions.read");
    expect(permissionRepository.findById).toHaveBeenCalledWith("perm-1");
  });

  it("throws PermissionNotFoundError when the permission does not exist", async () => {
    vi.mocked(permissionRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", permissionId: "missing" }),
    ).rejects.toBeInstanceOf(PermissionNotFoundError);
  });

  it("throws PermissionDeniedError without permissions.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", permissionId: "perm-1" }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(permissionRepository.findById).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad", permissionId: "perm-1" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired", permissionId: "perm-1" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked", permissionId: "perm-1" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
