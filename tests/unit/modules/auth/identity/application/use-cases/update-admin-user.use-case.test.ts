import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { UpdateAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/update-admin-user.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("UpdateAdminUserUseCase", () => {
  const identityRepository: Pick<
    IIdentityRepository,
    "findAuthenticatedPrincipal" | "existsById" | "updateOwnProfile"
  > = {
    findAuthenticatedPrincipal: vi.fn(),
    existsById: vi.fn(),
    updateOwnProfile: vi.fn(),
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

  const useCase = new UpdateAdminUserUseCase(identityRepository, permissionRepository);

  const result = {
    user: {
      id: "user-2",
      status: "active" as const,
      displayName: "Grace Hopper",
      avatarUrl: null,
      email: "grace@example.com",
      username: "grace",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
    profile: {
      firstName: "Grace",
      lastName: "Hopper",
      locale: null,
      timezone: null,
      bio: null,
    },
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
    vi.mocked(identityRepository.updateOwnProfile).mockResolvedValue(result);
  });

  it("updates the target user's profile after verifying users.update", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
        displayName: "Grace Hopper",
        firstName: "Grace",
      }),
    ).resolves.toEqual(result);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.update");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(identityRepository.updateOwnProfile).toHaveBeenCalledWith({
      userId: "user-2",
      displayName: "Grace Hopper",
      firstName: "Grace",
    });
  });

  it("throws UserNotFoundError when the target user is missing", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
        displayName: "Grace",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(identityRepository.updateOwnProfile).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without users.update", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
        displayName: "Grace",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.existsById).not.toHaveBeenCalled();
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
        displayName: "Grace",
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
        displayName: "Grace",
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
        displayName: "Grace",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
