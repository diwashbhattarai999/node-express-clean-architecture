import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { LogoutAllUseCase } from "@/modules/auth/application/use-cases/logout-all.use-case";

describe("LogoutAllUseCase", () => {
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

  const useCase = new LogoutAllUseCase(authAccountRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authAccountRepository.revokeAllSessionsForUser).mockResolvedValue(3);
  });

  it("revokes all sessions for the user and returns the count", async () => {
    await expect(useCase.execute("user-1")).resolves.toEqual({ revokedCount: 3 });
    expect(authAccountRepository.revokeAllSessionsForUser).toHaveBeenCalledWith("user-1");
  });
});
