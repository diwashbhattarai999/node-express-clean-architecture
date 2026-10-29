import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { LoginUseCase } from "@/modules/auth/credentials/application/use-cases/login.use-case";

describe("LoginUseCase", () => {
  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
  };

  const sessionRepository: ISessionRepository = {
    createSession: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeSessionByRefreshTokenHash: vi.fn(),
    revokeSessionById: vi.fn(),
    revokeAllSessionsForUser: vi.fn(),
    listSessionsForUser: vi.fn(),
    findSessionForUser: vi.fn(),
  };

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const accessTokenSigner: IAccessTokenSigner = {
    sign: vi.fn(),
  verify: vi.fn(),
  };

  const useCase = new LoginUseCase(
    credentialsRepository,
    sessionRepository,
    passwordHasher,
    accessTokenSigner,
    { refreshTokenTtlSeconds: 2_592_000 },
  );

  const activeCandidate = {
    userId: "user-1",
    status: "active" as const,
    passwordHash: "hashed",
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(passwordHasher.compare).mockResolvedValue(true);
    vi.mocked(accessTokenSigner.sign).mockResolvedValue({
      accessToken: "access.jwt",
      expiresIn: 600,
    });
    vi.mocked(sessionRepository.createSession).mockResolvedValue(undefined);
  });

  it("logs in an active user and creates a session", async () => {
    vi.mocked(credentialsRepository.findPasswordLoginCandidate).mockResolvedValue(activeCandidate);

    const result = await useCase.execute({
      identifier: "Ada@Example.com",
      password: "StrongPassword123!",
    });

    expect(credentialsRepository.findPasswordLoginCandidate).toHaveBeenCalledWith(
      "email",
      "ada@example.com",
    );
    expect(sessionRepository.createSession).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      accessToken: "access.jwt",
      tokenType: "Bearer",
      user: { id: "user-1", email: "ada@example.com", status: "active" },
    });
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it("throws InvalidCredentialsError for unknown identifiers", async () => {
    vi.mocked(credentialsRepository.findPasswordLoginCandidate).mockResolvedValue(null);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: "missing@example.com", password: "x" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(sessionRepository.createSession).not.toHaveBeenCalled();
  });

  it("throws InvalidCredentialsError for wrong passwords", async () => {
    vi.mocked(credentialsRepository.findPasswordLoginCandidate).mockResolvedValue(activeCandidate);
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({ identifier: "ada@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("blocks pending_verification accounts", async () => {
    vi.mocked(credentialsRepository.findPasswordLoginCandidate).mockResolvedValue({
      ...activeCandidate,
      status: "pending_verification",
    });

    await expect(
      useCase.execute({ identifier: "ada@example.com", password: "StrongPassword123!" }),
    ).rejects.toBeInstanceOf(AuthForbiddenError);

    await expect(
      useCase.execute({ identifier: "ada@example.com", password: "StrongPassword123!" }),
    ).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("blocks suspended accounts", async () => {
    vi.mocked(credentialsRepository.findPasswordLoginCandidate).mockResolvedValue({
      ...activeCandidate,
      status: "suspended",
    });

    await expect(
      useCase.execute({ identifier: "ada@example.com", password: "StrongPassword123!" }),
    ).rejects.toMatchObject({ code: "ACCOUNT_SUSPENDED" });
  });
});
