import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { VerifyEmailUseCase } from "@/modules/auth/application/use-cases/verify-email.use-case";

describe("VerifyEmailUseCase", () => {
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

  const useCase = new VerifyEmailUseCase(authAccountRepository, accessTokenSigner, {
    refreshTokenTtlSeconds: 2_592_000,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("verifies email, creates session tokens, and returns AuthTokensData", async () => {
    vi.mocked(authAccountRepository.verifyEmailByTokenHash).mockResolvedValue({
      outcome: "verified",
      sessionId: "session-1",
      user: {
        id: "user-1",
        status: "active",
        displayName: "Ada",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });

    const result = await useCase.execute({ token: " raw-token " });

    expect(authAccountRepository.verifyEmailByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        refreshTokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
    });
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
      user: { id: "user-1", status: "active", email: "ada@example.com" },
    });
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it("throws TokenInvalidError when the token is unknown", async () => {
    vi.mocked(authAccountRepository.verifyEmailByTokenHash).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(useCase.execute({ token: "bad" })).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError when the token is expired", async () => {
    vi.mocked(authAccountRepository.verifyEmailByTokenHash).mockResolvedValue({
      outcome: "expired",
    });

    await expect(useCase.execute({ token: "old" })).rejects.toBeInstanceOf(TokenExpiredError);
  });
});
