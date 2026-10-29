import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { ResetPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/reset-password.use-case";

describe("ResetPasswordUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
  };

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const useCase = new ResetPasswordUseCase(credentialsRepository, passwordHasher);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(passwordHasher.hash).mockResolvedValue("new-hash");
    vi.mocked(credentialsRepository.resetPasswordByTokenHash).mockResolvedValue({
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
    expect(credentialsRepository.resetPasswordByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      "new-hash",
    );
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(credentialsRepository.resetPasswordByTokenHash).mockResolvedValue({
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
    vi.mocked(credentialsRepository.resetPasswordByTokenHash).mockResolvedValue({
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
    vi.mocked(credentialsRepository.resetPasswordByTokenHash).mockResolvedValue({
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
