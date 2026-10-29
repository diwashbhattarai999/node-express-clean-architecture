import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { RevokeOtherSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-other-sessions.use-case";

describe("RevokeOtherSessionsUseCase", () => {
  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    revokeOtherSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
    revokeSessionForUser: vi.fn(),
  };

  const useCase = new RevokeOtherSessionsUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes every active session except the current one", async () => {
    vi.mocked(sessionRepository.revokeOtherSessionsForUser).mockResolvedValue(2);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
      }),
    ).resolves.toEqual({ revokedCount: 2 });

    expect(sessionRepository.revokeOtherSessionsForUser).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
  });
});
