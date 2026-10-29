import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { ValidatePasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/validate-password-reset.use-case";

describe("ValidatePasswordResetUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    validatePasswordResetTokenHash: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
  };

  const useCase = new ValidatePasswordResetUseCase(credentialsRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid with ISO expiresAt for an active token", async () => {
    const expiresAt = new Date("2026-11-01T12:00:00.000Z");
    vi.mocked(credentialsRepository.validatePasswordResetTokenHash).mockResolvedValue({
      valid: true,
      expiresAt,
    });

    await expect(useCase.execute({ token: "reset-token" })).resolves.toEqual({
      valid: true,
      expiresAt: "2026-11-01T12:00:00.000Z",
    });

    expect(credentialsRepository.validatePasswordResetTokenHash).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  it("returns valid false for unknown or unusable tokens", async () => {
    vi.mocked(credentialsRepository.validatePasswordResetTokenHash).mockResolvedValue({
      valid: false,
    });

    await expect(useCase.execute({ token: "bad-token" })).resolves.toEqual({ valid: false });
  });

  it("returns valid false for blank tokens without hitting the repository", async () => {
    await expect(useCase.execute({ token: "   " })).resolves.toEqual({ valid: false });
    expect(credentialsRepository.validatePasswordResetTokenHash).not.toHaveBeenCalled();
  });
});
