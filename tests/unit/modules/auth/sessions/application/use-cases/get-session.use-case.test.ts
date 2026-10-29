import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { GetSessionUseCase } from "@/modules/auth/sessions/application/use-cases/get-session.use-case";

describe("GetSessionUseCase", () => {
  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
    revokeSessionForUser: vi.fn(),
  };

  const useCase = new GetSessionUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the session for the authenticated user", async () => {
    const session = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
      expiresAt: new Date("2026-02-01T00:00:00.000Z"),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      deviceName: null,
      isCurrent: true,
    };

    vi.mocked(sessionRepository.findSessionForUser).mockResolvedValue(session);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: session.id,
        currentSessionId: session.id,
      }),
    ).resolves.toEqual(session);

    expect(sessionRepository.findSessionForUser).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: session.id,
      currentSessionId: session.id,
    });
  });

  it("throws SessionNotFoundError when missing", async () => {
    vi.mocked(sessionRepository.findSessionForUser).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "550e8400-e29b-41d4-a716-446655440099",
        currentSessionId: "session-1",
      }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});
