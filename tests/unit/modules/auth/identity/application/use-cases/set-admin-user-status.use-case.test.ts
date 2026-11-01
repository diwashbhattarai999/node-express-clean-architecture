import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { SetAdminUserStatusUseCase } from "@/modules/auth/identity/application/use-cases/set-admin-user-status.use-case";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("SetAdminUserStatusUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal" | "setUserStatus"> =
    {
      findAuthenticatedPrincipal: vi.fn(),
      setUserStatus: vi.fn(),
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

  const useCase = new SetAdminUserStatusUseCase(
    identityRepository,
    permissionRepository,
    sessionRepository,
  );

  const user = {
    id: "user-2",
    status: "suspended" as const,
    displayName: "Grace",
    avatarUrl: null,
    email: "grace@example.com",
    username: "grace",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
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
    vi.mocked(identityRepository.setUserStatus).mockResolvedValue(user);
    vi.mocked(sessionRepository.revokeAllSessionsForUser).mockResolvedValue(3);
  });

  it("suspends the user and revokes sessions", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
        action: "suspend",
      }),
    ).resolves.toEqual(user);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.suspend");
    expect(identityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: "user-2",
      status: "suspended",
    });
    expect(sessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith("user-2");
  });

  it("disables the user and revokes sessions", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      targetUserId: "user-2",
      action: "disable",
    });

    expect(identityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: "user-2",
      status: "disabled",
    });
    expect(sessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith("user-2");
  });

  it("reactivates the user without revoking sessions", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      targetUserId: "user-2",
      action: "reactivate",
    });

    expect(identityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: "user-2",
      status: "active",
    });
    expect(sessionRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("enables the user without revoking sessions", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      targetUserId: "user-2",
      action: "enable",
    });

    expect(identityRepository.setUserStatus).toHaveBeenCalledWith({
      userId: "user-2",
      status: "active",
    });
    expect(sessionRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("throws UserNotFoundError when the target user is missing", async () => {
    vi.mocked(identityRepository.setUserStatus).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "missing",
        action: "suspend",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
    expect(sessionRepository.revokeAllSessionsForUser).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without users.suspend", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
        action: "suspend",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(identityRepository.setUserStatus).not.toHaveBeenCalled();
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
        action: "suspend",
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
        action: "suspend",
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
        action: "suspend",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
