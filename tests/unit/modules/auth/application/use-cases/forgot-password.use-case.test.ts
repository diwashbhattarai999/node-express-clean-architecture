import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { ForgotPasswordUseCase } from "@/modules/auth/application/use-cases/forgot-password.use-case";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("ForgotPasswordUseCase", () => {
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

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new ForgotPasswordUseCase(authAccountRepository, emailSender, {
    frontendBaseUrl: "http://localhost:5173",
    brandName: "Node Express Clean Architecture",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(emailSender.send).mockResolvedValue({ id: "mail-1" });
    vi.mocked(authAccountRepository.replacePasswordResetToken).mockResolvedValue(undefined);
  });

  it("rotates the reset token and sends email for an eligible account", async () => {
    vi.mocked(authAccountRepository.findPasswordResetTarget).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });

    await useCase.execute({ email: "Ada@Example.com" });

    expect(authAccountRepository.findPasswordResetTarget).toHaveBeenCalledWith("ada@example.com");
    expect(authAccountRepository.replacePasswordResetToken).toHaveBeenCalledWith(
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
    vi.mocked(authAccountRepository.findPasswordResetTarget).mockResolvedValue(null);

    await useCase.execute({ email: "missing@example.com" });

    expect(authAccountRepository.replacePasswordResetToken).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("still succeeds when sending the email fails after token rotation", async () => {
    vi.mocked(authAccountRepository.findPasswordResetTarget).mockResolvedValue({
      userId: "user-1",
      identityId: "identity-1",
      email: "ada@example.com",
    });
    vi.mocked(emailSender.send).mockRejectedValue(new Error("smtp down"));

    await expect(useCase.execute({ email: "ada@example.com" })).resolves.toBeUndefined();
    expect(authAccountRepository.replacePasswordResetToken).toHaveBeenCalledOnce();
  });
});
