import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenReusedError } from "@/modules/auth/shared/application/errors/token-reused.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { RefreshUseCase } from "@/modules/auth/sessions/application/use-cases/refresh.use-case";

describe("RefreshUseCase", () => {
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

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
  verify: vi.fn(),
  };

  const useCase = new RefreshUseCase(sessionRepository, accessTokenSigner, {
    refreshTokenTtlSeconds: 2_592_000,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("rotates a valid refresh token and returns new tokens", async () => {
    vi.mocked(sessionRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "rotated",
      sessionId: "session-2",
      user: {
        id: "user-1",
        status: "active",
        displayName: "Ada",
        avatarUrl: null,
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    const result = await useCase.execute("raw-refresh-token");

    expect(sessionRepository.rotateRefreshSession).toHaveBeenCalledOnce();
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-2",
    });
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
    });
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe("raw-refresh-token");
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(sessionRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(sessionRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "expired",
    });

    await expect(useCase.execute("expired")).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(sessionRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "revoked",
    });

    await expect(useCase.execute("revoked")).rejects.toBeInstanceOf(TokenRevokedError);
  });

  it("throws TokenReusedError when reuse is detected", async () => {
    vi.mocked(sessionRepository.rotateRefreshSession).mockResolvedValue({
      outcome: "reused",
    });

    await expect(useCase.execute("reused")).rejects.toBeInstanceOf(TokenReusedError);
  });
});
