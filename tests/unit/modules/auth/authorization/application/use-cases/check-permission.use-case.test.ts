import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { CheckPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/check-permission.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("CheckPermissionUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const permissionRepository: IPermissionRepository = {
    listKeysForUser: vi.fn(),
    hasKeyForUser: vi.fn(),
  };

  const useCase = new CheckPermissionUseCase(identityRepository, permissionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
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
  });

  it("returns allowed when the user has the permission key", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", permission: "users.read" }),
    ).resolves.toEqual({ allowed: true });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.read");
  });

  it("returns denied when the user lacks the permission key", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", permission: "roles.delete" }),
    ).resolves.toEqual({ allowed: false });
  });

  it("ignores resourceId until resource ACLs exist", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        permission: "users.read",
        resourceId: "res-1",
      }),
    ).resolves.toEqual({ allowed: true });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.read");
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad", permission: "users.read" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired", permission: "users.read" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked", permission: "users.read" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
