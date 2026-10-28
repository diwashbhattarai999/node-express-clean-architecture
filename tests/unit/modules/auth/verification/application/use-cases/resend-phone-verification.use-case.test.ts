import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IVerificationRepository } from "@/modules/auth/verification/application/ports/verification.repository";
import { ResendPhoneVerificationUseCase } from "@/modules/auth/verification/application/use-cases/resend-phone-verification.use-case";

describe("ResendPhoneVerificationUseCase", () => {
  const verificationRepository: IVerificationRepository = {
    verifyEmailByTokenHash: vi.fn(),
    findUnverifiedEmailIdentity: vi.fn(),
    replaceEmailVerificationToken: vi.fn(),
    verifyPhoneByCodeHash: vi.fn(),
    findUnverifiedPhoneIdentity: vi.fn(),
    replacePhoneVerificationToken: vi.fn(),
  };

  const useCase = new ResendPhoneVerificationUseCase(verificationRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rotates the OTP when an unverified phone identity exists", async () => {
    vi.mocked(verificationRepository.findUnverifiedPhoneIdentity).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      phone: "+9779812345678",
    });

    await useCase.execute({ phone: "+9779812345678" });

    expect(verificationRepository.findUnverifiedPhoneIdentity).toHaveBeenCalledWith(
      "+9779812345678",
    );
    expect(verificationRepository.replacePhoneVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        identityId: "identity-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });

  it("no-ops when the phone is unknown or already verified", async () => {
    vi.mocked(verificationRepository.findUnverifiedPhoneIdentity).mockResolvedValue(null);

    await useCase.execute({ phone: "+9779800000000" });

    expect(verificationRepository.replacePhoneVerificationToken).not.toHaveBeenCalled();
  });
});
