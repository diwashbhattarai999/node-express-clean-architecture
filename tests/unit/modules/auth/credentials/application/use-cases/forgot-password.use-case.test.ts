import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { ForgotPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/forgot-password.use-case";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("ForgotPasswordUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
  };

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new ForgotPasswordUseCase(credentialsRepository, emailSender, {
    frontendBaseUrl: "http://localhost:5173",
    brandName: "Node Express Clean Architecture",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(emailSender.send).mockResolvedValue({ id: "mail-1" });
    vi.mocked(credentialsRepository.replacePasswordResetToken).mockResolvedValue(undefined);
  });

  it("rotates the reset token and sends email for an eligible account", async () => {
    vi.mocked(credentialsRepository.findPasswordResetTarget).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });

    await useCase.execute({ email: "Ada@Example.com" });

    expect(credentialsRepository.findPasswordResetTarget).toHaveBeenCalledWith("ada@example.com");
    expect(credentialsRepository.replacePasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        identityId: "identity-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(emailSender.send).toHaveBeenCalledOnce();
  });

  it("no-ops without revealing when the email is unknown", async () => {
    vi.mocked(credentialsRepository.findPasswordResetTarget).mockResolvedValue(null);

    await useCase.execute({ email: "missing@example.com" });

    expect(credentialsRepository.replacePasswordResetToken).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("still succeeds when sending the email fails after token rotation", async () => {
    vi.mocked(credentialsRepository.findPasswordResetTarget).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });
    vi.mocked(emailSender.send).mockRejectedValue(new Error("smtp down"));

    await expect(useCase.execute({ email: "ada@example.com" })).resolves.toBeUndefined();
    expect(credentialsRepository.replacePasswordResetToken).toHaveBeenCalledOnce();
  });
});
