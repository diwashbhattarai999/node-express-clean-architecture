import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/application/errors/token-revoked.error";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { ResetPasswordUseCase } from "@/modules/auth/application/use-cases/reset-password.use-case";

describe("ResetPasswordUseCase", () => {
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

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const useCase = new ResetPasswordUseCase(authAccountRepository, passwordHasher);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(passwordHasher.hash).mockResolvedValue("new-hash");
    vi.mocked(authAccountRepository.resetPasswordByTokenHash).mockResolvedValue({
      outcome: "reset",
    });
  });

  it("hashes the password and resets via the repository", async () => {
    await useCase.execute({
      token: "reset-token",
      password: "NewSecret123!",
      confirmPassword: "NewSecret123!",
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("NewSecret123!");
    expect(authAccountRepository.resetPasswordByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      "new-hash",
    );
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(authAccountRepository.resetPasswordByTokenHash).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(
      useCase.execute({
        token: "bad",
        password: "NewSecret123!",
        confirmPassword: "NewSecret123!",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired tokens", async () => {
    vi.mocked(authAccountRepository.resetPasswordByTokenHash).mockResolvedValue({
      outcome: "expired",
    });

    await expect(
      useCase.execute({
        token: "expired",
        password: "NewSecret123!",
        confirmPassword: "NewSecret123!",
      }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked or consumed tokens", async () => {
    vi.mocked(authAccountRepository.resetPasswordByTokenHash).mockResolvedValue({
      outcome: "revoked",
    });

    await expect(
      useCase.execute({
        token: "used",
        password: "NewSecret123!",
        confirmPassword: "NewSecret123!",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
