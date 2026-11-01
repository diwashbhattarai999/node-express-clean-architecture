import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { ConsumeMagicLinkUseCase } from "@/modules/auth/credentials/application/use-cases/consume-magic-link.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";

describe("ConsumeMagicLinkUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    findPasswordResetTargetByUserId: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    validatePasswordResetTokenHash: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
    findMagicLinkTarget: vi.fn(),
    replaceMagicLinkToken: vi.fn(),
    consumeMagicLinkByTokenHash: vi.fn(),
  };

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  const useCase = new ConsumeMagicLinkUseCase(credentialsRepository, accessTokenSigner, {
    refreshTokenTtlSeconds: 2_592_000,
  });

  const consumedUser = {
    id: "user-1",
    status: "active" as const,
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
  });

  it("consumes a valid token and returns a session", async () => {
    vi.mocked(credentialsRepository.consumeMagicLinkByTokenHash).mockResolvedValue({
      outcome: "consumed",
      sessionId: "session-1",
      user: consumedUser,
    });

    const result = await useCase.execute(
      { token: " magic-token " },
      { ipAddress: "127.0.0.1", userAgent: "vitest" },
    );

    expect(credentialsRepository.consumeMagicLinkByTokenHash).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        refreshTokenHash: expect.any(String),
        expiresAt: expect.any(Date),
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      }),
    );
    expect(accessTokenSigner.sign).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-1",
    });
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      expiresIn: 600,
      user: { id: "user-1", email: "ada@example.com", status: "active" },
    });
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(credentialsRepository.consumeMagicLinkByTokenHash).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(useCase.execute({ token: "nope" })).rejects.toBeInstanceOf(TokenInvalidError);
    expect(accessTokenSigner.sign).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired tokens", async () => {
    vi.mocked(credentialsRepository.consumeMagicLinkByTokenHash).mockResolvedValue({
      outcome: "expired",
    });

    await expect(useCase.execute({ token: "expired" })).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("blocks suspended accounts without signing a session", async () => {
    vi.mocked(credentialsRepository.consumeMagicLinkByTokenHash).mockResolvedValue({
      outcome: "suspended",
    });

    await expect(useCase.execute({ token: "magic-token" })).rejects.toMatchObject({
      code: "ACCOUNT_SUSPENDED",
    });
    expect(accessTokenSigner.sign).not.toHaveBeenCalled();
  });

  it("blocks disabled accounts", async () => {
    vi.mocked(credentialsRepository.consumeMagicLinkByTokenHash).mockResolvedValue({
      outcome: "disabled",
    });

    await expect(useCase.execute({ token: "magic-token" })).rejects.toBeInstanceOf(
      AuthForbiddenError,
    );
    await expect(useCase.execute({ token: "magic-token" })).rejects.toMatchObject({
      code: "ACCOUNT_DISABLED",
    });
  });
});
