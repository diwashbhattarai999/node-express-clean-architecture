import { beforeEach, describe, expect, it, vi } from "vitest";

import { issueAuthSession } from "@/modules/auth/shared/application/services/issue-auth-session";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";

describe("issueAuthSession", () => {
  const user: AuthUser = {
    id: "user-1",
    status: "active",
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: "ada",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const sessionRepository = {
    createSession: vi.fn(),
  };

  const accessTokenSigner = {
    sign: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionRepository.createSession.mockResolvedValue(undefined);
    accessTokenSigner.sign.mockResolvedValue({ accessToken: "access", expiresIn: 900 });
  });

  it("creates a session and returns signed tokens", async () => {
    const result = await issueAuthSession(
      {
        sessionRepository: sessionRepository as never,
        accessTokenSigner: accessTokenSigner as never,
        refreshTokenTtlSeconds: 3600,
      },
      user,
      { ipAddress: "127.0.0.1", userAgent: "vitest" },
    );

    expect(sessionRepository.createSession).toHaveBeenCalledOnce();
    expect(accessTokenSigner.sign).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      user,
      accessToken: "access",
      tokenType: "Bearer",
      expiresIn: 900,
    });
    expect(result.refreshToken.length).toBeGreaterThan(20);
  });
});
