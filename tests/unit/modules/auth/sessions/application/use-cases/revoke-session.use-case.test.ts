import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { RevokeSessionUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-session.use-case";

describe("RevokeSessionUseCase", () => {
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

  const useCase = new RevokeSessionUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes an owned session", async () => {
    vi.mocked(sessionRepository.revokeSessionForUser).mockResolvedValue("revoked");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-2",
        currentSessionId: "session-1",
      }),
    ).resolves.toEqual({ wasCurrent: false });

    expect(sessionRepository.revokeSessionForUser).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-2",
    });
  });

  it("marks wasCurrent when revoking the active session", async () => {
    vi.mocked(sessionRepository.revokeSessionForUser).mockResolvedValue("revoked");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        currentSessionId: "session-1",
      }),
    ).resolves.toEqual({ wasCurrent: true });
  });

  it("treats already_revoked as success", async () => {
    vi.mocked(sessionRepository.revokeSessionForUser).mockResolvedValue("already_revoked");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-2",
        currentSessionId: "session-1",
      }),
    ).resolves.toEqual({ wasCurrent: false });
  });

  it("throws SessionNotFoundError when missing", async () => {
    vi.mocked(sessionRepository.revokeSessionForUser).mockResolvedValue("not_found");

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-missing",
        currentSessionId: "session-1",
      }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});
