import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { ResendPhoneVerificationUseCase } from "@/modules/auth/application/use-cases/resend-phone-verification.use-case";

describe("ResendPhoneVerificationUseCase", () => {
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

  const useCase = new ResendPhoneVerificationUseCase(authAccountRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rotates the OTP when an unverified phone identity exists", async () => {
    vi.mocked(authAccountRepository.findUnverifiedPhoneIdentity).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      phone: "+9779812345678",
    });

    await useCase.execute({ phone: "+9779812345678" });

    expect(authAccountRepository.findUnverifiedPhoneIdentity).toHaveBeenCalledWith(
      "+9779812345678",
    );
    expect(authAccountRepository.replacePhoneVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        identityId: "identity-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });

  it("no-ops when the phone is unknown or already verified", async () => {
    vi.mocked(authAccountRepository.findUnverifiedPhoneIdentity).mockResolvedValue(null);

    await useCase.execute({ phone: "+9779800000000" });

    expect(authAccountRepository.replacePhoneVerificationToken).not.toHaveBeenCalled();
  });
});
