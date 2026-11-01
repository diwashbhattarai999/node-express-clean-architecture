import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { ListUserPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-user-permissions.use-case";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListUserPermissionsUseCase", () => {
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

  const useCase = new ListUserPermissionsUseCase(identityRepository, permissionRepository);

  const input = {
    userId: "user-1",
    sessionId: "session-1",
    targetUserId: "user-2",
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
    vi.mocked(permissionRepository.listKeysForUser).mockResolvedValue(["roles.read"]);
  });

  it("lists effective permission keys after verifying the session and permissions.read", async () => {
    await expect(useCase.execute(input)).resolves.toEqual({ permissions: ["roles.read"] });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "permissions.read");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(permissionRepository.listKeysForUser).toHaveBeenCalledWith("user-2");
  });

  it("throws UserNotFoundError when the target user does not exist", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(UserNotFoundError);
    expect(permissionRepository.listKeysForUser).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without permissions.read", async () => {
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
