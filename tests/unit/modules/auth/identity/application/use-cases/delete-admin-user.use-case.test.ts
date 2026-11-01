import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { DeleteAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/delete-admin-user.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("DeleteAdminUserUseCase", () => {
  const identityRepository: Pick<
    IIdentityRepository,
    "findAuthenticatedPrincipal" | "hardDeleteById"
  > = {
    findAuthenticatedPrincipal: vi.fn(),
    hardDeleteById: vi.fn(),
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

  const useCase = new DeleteAdminUserUseCase(identityRepository, permissionRepository);

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
    vi.mocked(identityRepository.hardDeleteById).mockResolvedValue("deleted");
  });

  it("hard-deletes the user after verifying users.delete", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toBeUndefined();

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.delete");
    expect(identityRepository.hardDeleteById).toHaveBeenCalledWith("user-2");
  });

  it("throws UserNotFoundError when the target user is missing", async () => {
    vi.mocked(identityRepository.hardDeleteById).mockResolvedValue("not_found");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("throws PermissionDeniedError without users.delete", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "expired",
        targetUserId: "user-2",
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
        targetUserId: "user-2",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
