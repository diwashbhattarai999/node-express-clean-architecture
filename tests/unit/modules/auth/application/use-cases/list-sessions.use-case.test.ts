import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { ListSessionsUseCase } from "@/modules/auth/application/use-cases/list-sessions.use-case";

describe("ListSessionsUseCase", () => {
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
    listSessionsForUser: vi.fn(),
  };

  const useCase = new ListSessionsUseCase(authAccountRepository);

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

    vi.mocked(authAccountRepository.listSessionsForUser).mockResolvedValue({
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

    expect(authAccountRepository.listSessionsForUser).toHaveBeenCalledWith({
      userId: "user-1",
      currentSessionId: "session-1",
      includeRevoked: false,
      page: 1,
      limit: 10,
    });
  });
});
