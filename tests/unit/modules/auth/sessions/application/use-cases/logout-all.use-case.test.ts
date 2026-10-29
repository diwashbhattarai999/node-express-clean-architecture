import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { LogoutAllUseCase } from "@/modules/auth/sessions/application/use-cases/logout-all.use-case";

describe("LogoutAllUseCase", () => {
  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
  };

  const useCase = new LogoutAllUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionRepository.revokeAllSessionsForUser).mockResolvedValue(3);
  });

  it("revokes all sessions for the user and returns the count", async () => {
    await expect(useCase.execute("user-1")).resolves.toEqual({ revokedCount: 3 });
    expect(sessionRepository.revokeAllSessionsForUser).toHaveBeenCalledWith("user-1");
  });
});
