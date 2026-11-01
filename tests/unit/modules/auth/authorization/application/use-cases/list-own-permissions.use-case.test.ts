import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { ListOwnPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-permissions.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListOwnPermissionsUseCase", () => {
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
  };

  const useCase = new ListOwnPermissionsUseCase(identityRepository, permissionRepository);

  const permissions = ["roles.read", "users.read"];

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
    vi.mocked(permissionRepository.listKeysForUser).mockResolvedValue(permissions);
  });

  it("lists distinct permission keys after verifying the session", async () => {
    await expect(useCase.execute({ userId: "user-1", sessionId: "session-1" })).resolves.toEqual({
      permissions,
    });

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(permissionRepository.listKeysForUser).toHaveBeenCalledWith("user-1");
  });

  it("returns an empty list when no permissions are assigned", async () => {
    vi.mocked(permissionRepository.listKeysForUser).mockResolvedValue([]);

    await expect(useCase.execute({ userId: "user-1", sessionId: "session-1" })).resolves.toEqual({
      permissions: [],
    });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute({ userId: "user-1", sessionId: "bad" })).rejects.toBeInstanceOf(
      TokenInvalidError,
    );
    expect(permissionRepository.listKeysForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
