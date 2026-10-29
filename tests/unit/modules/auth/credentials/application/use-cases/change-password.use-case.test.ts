import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { ChangePasswordUseCase } from "@/modules/auth/credentials/application/use-cases/change-password.use-case";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";

describe("ChangePasswordUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    validatePasswordResetTokenHash: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
  };

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const useCase = new ChangePasswordUseCase(credentialsRepository, passwordHasher);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue("current-hash");
    vi.mocked(passwordHasher.compare).mockResolvedValue(true);
    vi.mocked(passwordHasher.hash).mockResolvedValue("new-hash");
    vi.mocked(credentialsRepository.changePasswordForUser).mockResolvedValue(true);
  });

  it("verifies the current password, hashes the new one, and updates", async () => {
    await useCase.execute({
      userId: "user-1",
      currentSessionId: "session-1",
      currentPassword: "OldSecret123!",
      password: "NewSecret123!",
      confirmPassword: "NewSecret123!",
    });

    expect(credentialsRepository.findPasswordHashForUser).toHaveBeenCalledWith("user-1");
    expect(passwordHasher.compare).toHaveBeenCalledWith("OldSecret123!", "current-hash");
    expect(passwordHasher.hash).toHaveBeenCalledWith("NewSecret123!");
    expect(credentialsRepository.changePasswordForUser).toHaveBeenCalledWith(
      "user-1",
      "new-hash",
      "session-1",
    );
  });

  it("throws InvalidCredentialsError when the current password is wrong", async () => {
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
        currentPassword: "WrongSecret123!",
        password: "NewSecret123!",
        confirmPassword: "NewSecret123!",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(credentialsRepository.changePasswordForUser).not.toHaveBeenCalled();
  });

  it("throws InvalidCredentialsError when the user has no password credential", async () => {
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue(null);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
        currentPassword: "Anything123!",
        password: "NewSecret123!",
        confirmPassword: "NewSecret123!",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(credentialsRepository.changePasswordForUser).not.toHaveBeenCalled();
  });
});
