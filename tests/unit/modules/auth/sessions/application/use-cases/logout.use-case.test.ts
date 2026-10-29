import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { LogoutUseCase } from "@/modules/auth/sessions/application/use-cases/logout.use-case";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

describe("LogoutUseCase", () => {
  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
  };

  const useCase = new LogoutUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionRepository.revokeSessionByRefreshTokenHash).mockResolvedValue(true);
    vi.mocked(sessionRepository.revokeSessionById).mockResolvedValue(true);
  });

  it("revokes the session by refresh token hash", async () => {
    await useCase.execute({ refreshToken: "raw-refresh" });

    expect(sessionRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
    expect(sessionRepository.revokeSessionById).not.toHaveBeenCalled();
  });

  it("revokes the session by session id from bearer auth", async () => {
    await useCase.execute({ sessionId: "session-1" });

    expect(sessionRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(sessionRepository.revokeSessionByRefreshTokenHash).not.toHaveBeenCalled();
  });

  it("revokes using both refresh and session id when provided", async () => {
    await useCase.execute({ refreshToken: "raw-refresh", sessionId: "session-1" });

    expect(sessionRepository.revokeSessionByRefreshTokenHash).toHaveBeenCalledOnce();
    expect(sessionRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
  });

  it("throws UnauthorizedError when no credentials are provided", async () => {
    await expect(useCase.execute({})).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
