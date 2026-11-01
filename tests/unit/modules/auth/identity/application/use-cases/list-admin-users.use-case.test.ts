import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { ListAdminUsersUseCase } from "@/modules/auth/identity/application/use-cases/list-admin-users.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListAdminUsersUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal" | "listUsers"> = {
    findAuthenticatedPrincipal: vi.fn(),
    listUsers: vi.fn(),
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

  const useCase = new ListAdminUsersUseCase(identityRepository, permissionRepository);

  const users = {
    items: [
      {
        id: "user-2",
        status: "active" as const,
        displayName: "Grace",
        avatarUrl: null,
        email: "grace@example.com",
        username: "grace",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
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
    vi.mocked(identityRepository.listUsers).mockResolvedValue(users);
  });

  it("lists users after verifying the session and users.read", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ).resolves.toEqual(users);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.read");
    expect(identityRepository.listUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("forwards search and status to the repository", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      page: 2,
      limit: 20,
      search: "grace",
      status: "suspended",
      sortBy: "displayName",
      sortOrder: "asc",
    });

    expect(identityRepository.listUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: "grace",
      status: "suspended",
      sortBy: "displayName",
      sortOrder: "asc",
    });
  });

  it("throws PermissionDeniedError without users.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.listUsers).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
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
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
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
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
