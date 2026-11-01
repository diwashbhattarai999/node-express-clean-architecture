import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionNotFoundError } from "@/modules/auth/sessions/application/errors/session-not-found.error";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { UpdateSessionLabelUseCase } from "@/modules/auth/sessions/application/use-cases/update-session-label.use-case";

describe("UpdateSessionLabelUseCase", () => {
  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    revokeOtherSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
    updateSessionLabelForUser: vi.fn(),
    revokeSessionForUser: vi.fn(),
  };

  const useCase = new UpdateSessionLabelUseCase(sessionRepository);

  const session = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
    expiresAt: new Date("2026-02-01T00:00:00.000Z"),
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    deviceName: "MacBook Pro",
    isCurrent: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionRepository.updateSessionLabelForUser).mockResolvedValue(session);
  });

  it("updates the device name for the authenticated user's session", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: session.id,
        currentSessionId: session.id,
        deviceName: "MacBook Pro",
      }),
    ).resolves.toEqual(session);

    expect(sessionRepository.updateSessionLabelForUser).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: session.id,
      currentSessionId: session.id,
      deviceName: "MacBook Pro",
    });
  });

  it("throws SessionNotFoundError when missing", async () => {
    vi.mocked(sessionRepository.updateSessionLabelForUser).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "550e8400-e29b-41d4-a716-446655440099",
        currentSessionId: "session-1",
        deviceName: "Phone",
      }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });
});
