import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { ListPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-permissions.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListPermissionsUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const permissionRepository: IPermissionRepository = {
    listKeysForUser: vi.fn(),
    hasKeyForUser: vi.fn(),
    listForRole: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
  };

  const useCase = new ListPermissionsUseCase(identityRepository, permissionRepository);

  const permissions = {
    items: [
      {
        id: "perm-1",
        key: "roles.read",
        name: "Read roles",
        description: null,
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
    vi.mocked(permissionRepository.list).mockResolvedValue(permissions);
  });

  it("lists permissions after verifying the session and permissions.read", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", page: 1, limit: 10 }),
    ).resolves.toEqual(permissions);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "permissions.read");
    expect(permissionRepository.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("forwards search to the repository", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      page: 2,
      limit: 20,
      search: "roles",
    });

    expect(permissionRepository.list).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: "roles",
    });
  });

  it("throws PermissionDeniedError without permissions.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", page: 1, limit: 10 }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(permissionRepository.list).not.toHaveBeenCalled();
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
