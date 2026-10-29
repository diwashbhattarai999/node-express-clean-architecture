import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { ListSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/list-sessions.use-case";

describe("ListSessionsUseCase", () => {
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

  const useCase = new ListSessionsUseCase(sessionRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists sessions for the authenticated user", async () => {
    const session = {
      id: "session-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
      expiresAt: new Date("2026-02-01T00:00:00.000Z"),
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      deviceName: null,
      isCurrent: true,
    };

    vi.mocked(sessionRepository.listSessionsForUser).mockResolvedValue({
      items: [session],
      total: 1,
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
        query: { page: 1, limit: 10, includeRevoked: false },
      }),
    ).resolves.toEqual({ items: [session], total: 1 });

    expect(sessionRepository.listSessionsForUser).toHaveBeenCalledWith({
      userId: "user-1",
      currentSessionId: "session-1",
      includeRevoked: false,
      page: 1,
      limit: 10,
    });
  });
});
