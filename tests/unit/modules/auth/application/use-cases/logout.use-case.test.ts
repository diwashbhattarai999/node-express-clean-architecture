import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { LogoutUseCase } from "@/modules/auth/application/use-cases/logout.use-case";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

describe("LogoutUseCase", () => {
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
    findAuthenticatedPrincipal: vi.fn(),
  };

  const useCase = new LogoutUseCase(authAccountRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authAccountRepository.revokeSessionByRefreshTokenHash).mockResolvedValue(true);
    vi.mocked(authAccountRepository.revokeSessionById).mockResolvedValue(true);
  });

  it("revokes the session by refresh token hash", async () => {
    await useCase.execute({ refreshToken: "raw-refresh" });

    expect(authAccountRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
    expect(authAccountRepository.revokeSessionById).not.toHaveBeenCalled();
  });

  it("revokes the session by session id from bearer auth", async () => {
    await useCase.execute({ sessionId: "session-1" });

    expect(authAccountRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(authAccountRepository.revokeSessionByRefreshTokenHash).not.toHaveBeenCalled();
  });

  it("revokes using both refresh and session id when provided", async () => {
    await useCase.execute({ refreshToken: "raw-refresh", sessionId: "session-1" });

    expect(authAccountRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
    expect(authAccountRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
  });

  it("throws UnauthorizedError when no credentials are provided", async () => {
    await expect(useCase.execute({})).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
