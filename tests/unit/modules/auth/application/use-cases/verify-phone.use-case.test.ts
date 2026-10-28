import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { VerifyPhoneUseCase } from "@/modules/auth/application/use-cases/verify-phone.use-case";
import { RateLimitExceededError } from "@/shared/errors/rate-limit-error";

describe("VerifyPhoneUseCase", () => {
  const authAccountRepository: IAuthAccountRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    verifyEmailByTokenHash: vi.fn(),
    findUnverifiedEmailIdentity: vi.fn(),
    replaceEmailVerificationToken: vi.fn(),
    verifyPhoneByCodeHash: vi.fn(),
    findUnverifiedPhoneIdentity: vi.fn(),
    replacePhoneVerificationToken: vi.fn(),
  };

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
  };

  const useCase = new VerifyPhoneUseCase(authAccountRepository, accessTokenSigner, {
    refreshTokenTtlSeconds: 2_592_000,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("verifies phone OTP and returns session tokens", async () => {
    vi.mocked(authAccountRepository.verifyPhoneByCodeHash).mockResolvedValue({
      outcome: "verified",
      sessionId: "session-1",
      user: {
        id: "user-1",
        status: "active",
        displayName: null,
        avatarUrl: null,
        email: null,
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });

    const result = await useCase.execute({
      phone: "+9779812345678",
      code: "123456",
    });

    expect(authAccountRepository.verifyPhoneByCodeHash).toHaveBeenCalledWith(
      "+9779812345678",
      expect.any(String),
      expect.objectContaining({
        refreshTokenHash: expect.any(String),
      }),
      5,
    );
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
      user: { id: "user-1", status: "active" },
    });
  });

  it("throws TokenInvalidError for bad codes", async () => {
    vi.mocked(authAccountRepository.verifyPhoneByCodeHash).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(
      useCase.execute({ phone: "+9779812345678", code: "000000" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired codes", async () => {
    vi.mocked(authAccountRepository.verifyPhoneByCodeHash).mockResolvedValue({
      outcome: "expired",
    });

    await expect(
      useCase.execute({ phone: "+9779812345678", code: "123456" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws RateLimitExceededError when attempts are exhausted", async () => {
    vi.mocked(authAccountRepository.verifyPhoneByCodeHash).mockResolvedValue({
      outcome: "too_many_attempts",
    });

    await expect(
      useCase.execute({ phone: "+9779812345678", code: "123456" }),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
