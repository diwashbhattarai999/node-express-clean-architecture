import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/application/errors/token-revoked.error";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { GetMeUseCase } from "@/modules/auth/application/use-cases/get-me.use-case";

describe("GetMeUseCase", () => {
  const authAccountRepository: IAuthAccountRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    verifyEmailByTokenHash: vi.fn(),
    findUnverifiedEmailIdentity: vi.fn(),
    replaceEmailVerificationToken: vi.fn(),
    verifyPhoneByCodeHash: vi.fn(),
    findUnverifiedPhoneIdentity: vi.fn(),
    replacePhoneVerificationToken: vi.fn(),
    findPasswordLoginCandidate: vi.fn(),
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
  };

  const useCase = new GetMeUseCase(authAccountRepository);

  const user = {
    id: "user-1",
    status: "active" as const,
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user with roles and empty permissions", async () => {
    vi.mocked(authAccountRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      user,
      roles: ["admin"],
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).resolves.toEqual({
      user,
      roles: ["admin"],
      permissions: [],
    });
  });

  it("throws TokenInvalidError for unknown sessions", async () => {
    vi.mocked(authAccountRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "missing" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(authAccountRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(authAccountRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
