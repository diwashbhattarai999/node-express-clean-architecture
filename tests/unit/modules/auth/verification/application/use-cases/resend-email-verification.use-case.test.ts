import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IVerificationRepository } from "@/modules/auth/verification/application/ports/verification.repository";
import { ResendEmailVerificationUseCase } from "@/modules/auth/verification/application/use-cases/resend-email-verification.use-case";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("ResendEmailVerificationUseCase", () => {
  const verificationRepository: IVerificationRepository = {
    verifyEmailByTokenHash: vi.fn(),
    findUnverifiedEmailIdentity: vi.fn(),
    replaceEmailVerificationToken: vi.fn(),
    verifyPhoneByCodeHash: vi.fn(),
    findUnverifiedPhoneIdentity: vi.fn(),
    replacePhoneVerificationToken: vi.fn(),
  };

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new ResendEmailVerificationUseCase(verificationRepository, emailSender, {
    frontendBaseUrl: "http://localhost:5173",
    brandName: "Node Express Clean Architecture",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(emailSender.send).mockResolvedValue({ id: "mail-1" });
  });

  it("rotates the token and sends email when an unverified identity exists", async () => {
    vi.mocked(verificationRepository.findUnverifiedEmailIdentity).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });

    await useCase.execute({ email: "Ada@Example.com" });

    expect(verificationRepository.findUnverifiedEmailIdentity).toHaveBeenCalledWith(
      "ada@example.com",
    );
    expect(verificationRepository.replaceEmailVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        identityId: "identity-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(emailSender.send).toHaveBeenCalledOnce();
  });

  it("no-ops without revealing when the email is unknown or already verified", async () => {
    vi.mocked(verificationRepository.findUnverifiedEmailIdentity).mockResolvedValue(null);

    await useCase.execute({ email: "missing@example.com" });

    expect(verificationRepository.replaceEmailVerificationToken).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("still succeeds when sending the email fails after token rotation", async () => {
    vi.mocked(verificationRepository.findUnverifiedEmailIdentity).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });
    vi.mocked(emailSender.send).mockRejectedValue(new Error("smtp down"));

    await expect(useCase.execute({ email: "ada@example.com" })).resolves.toBeUndefined();
    expect(verificationRepository.replaceEmailVerificationToken).toHaveBeenCalledOnce();
  });
});
