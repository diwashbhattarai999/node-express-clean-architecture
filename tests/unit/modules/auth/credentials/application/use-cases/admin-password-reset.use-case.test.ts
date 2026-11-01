import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { AdminPasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/admin-password-reset.use-case";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("AdminPasswordResetUseCase", () => {
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

  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    findPasswordResetTargetByUserId: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    validatePasswordResetTokenHash: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
    findMagicLinkTarget: vi.fn(),
    replaceMagicLinkToken: vi.fn(),
    consumeMagicLinkByTokenHash: vi.fn(),
  };

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new AdminPasswordResetUseCase(
    identityRepository,
    permissionRepository,
    credentialsRepository,
    emailSender,
    {
      frontendBaseUrl: "http://localhost:5173",
      brandName: "Node Express Clean Architecture",
    },
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
    vi.mocked(credentialsRepository.findPasswordResetTargetByUserId).mockResolvedValue({
      userId: "user-2",
      identityId: "identity-1",
      email: "grace@example.com",
    });
    vi.mocked(credentialsRepository.replacePasswordResetToken).mockResolvedValue(undefined);
    vi.mocked(emailSender.send).mockResolvedValue({ id: "mail-1" });
  });

  it("rotates a reset token and emails a link after verifying users.update", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toBeUndefined();

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "users.update");
    expect(credentialsRepository.findPasswordResetTargetByUserId).toHaveBeenCalledWith("user-2");
    expect(credentialsRepository.replacePasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-2",
        identityId: "identity-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(emailSender.send).toHaveBeenCalledOnce();
  });

  it("succeeds without emailing when the user has no reset target", async () => {
    vi.mocked(credentialsRepository.findPasswordResetTargetByUserId).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toBeUndefined();

    expect(credentialsRepository.replacePasswordResetToken).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("still succeeds when sending the email fails after token rotation", async () => {
    vi.mocked(emailSender.send).mockRejectedValue(new Error("smtp down"));

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        targetUserId: "user-2",
      }),
    ).resolves.toBeUndefined();
    expect(credentialsRepository.replacePasswordResetToken).toHaveBeenCalledOnce();
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
    expect(credentialsRepository.findPasswordResetTargetByUserId).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without users.update", async () => {
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
