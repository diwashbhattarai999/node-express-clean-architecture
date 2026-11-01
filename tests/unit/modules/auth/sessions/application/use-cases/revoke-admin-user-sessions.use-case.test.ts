import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { RevokeAdminUserSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-admin-user-sessions.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("RevokeAdminUserSessionsUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal" | "existsById"> =
    {
      findAuthenticatedPrincipal: vi.fn(),
      existsById: vi.fn(),
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

  const sessionRepository: Pick<ISessionRepository, "revokeAllSessionsForUser"> = {
    revokeAllSessionsForUser: vi.fn(),
  };

  const useCase = new RevokeAdminUserSessionsUseCase(
    identityRepository,
    permissionRepository,
    sessionRepository,
  );

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
    vi.mocked(sessionRepository.revokeAllSessionsForUser).mockResolvedValue(2);
  });

  it("revokes all sessions after verifying sessions.revoke", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toEqual({ revokedCount: 2 });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "sessions.revoke");
    expect(identityRepository.existsById).toHaveBeenCalledWith("user-2");
    expect(sessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith("user-2");
  });

  it("throws UserNotFoundError when the target user is missing", async () => {
    vi.mocked(identityRepository.existsById).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(sessionRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without sessions.revoke", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
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
