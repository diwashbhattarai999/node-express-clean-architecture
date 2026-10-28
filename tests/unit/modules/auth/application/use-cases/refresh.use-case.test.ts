import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { TokenReusedError } from "@/modules/auth/application/errors/token-reused.error";
import { TokenRevokedError } from "@/modules/auth/application/errors/token-revoked.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { RefreshUseCase } from "@/modules/auth/application/use-cases/refresh.use-case";

describe("RefreshUseCase", () => {
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
    findAuthenticatedPrincipal: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
  };

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
  verify: vi.fn(),
  };

  const useCase = new RefreshUseCase(authAccountRepository, accessTokenSigner, {
    refreshTokenTtlSeconds: 2_592_000,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("rotates a valid refresh token and returns new tokens", async () => {
    vi.mocked(authAccountRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "rotated",
      sessionId: "session-2",
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

    const result = await useCase.execute("raw-refresh-token");

    expect(authAccountRepository.rotateRefreshSession).toHaveBeenCalledOnce();
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-2",
    });
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
    });
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe("raw-refresh-token");
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(authAccountRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(authAccountRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "expired",
    });

    await expect(useCase.execute("expired")).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(authAccountRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "revoked",
    });

    await expect(useCase.execute("revoked")).rejects.toBeInstanceOf(TokenRevokedError);
  });

  it("throws TokenReusedError when reuse is detected", async () => {
    vi.mocked(authAccountRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "reused",
    });

    await expect(useCase.execute("reused")).rejects.toBeInstanceOf(TokenReusedError);
  });
});
