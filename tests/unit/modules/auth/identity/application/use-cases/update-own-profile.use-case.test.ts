import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { UpdateOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/update-own-profile.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("UpdateOwnProfileUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    addEmailIdentity: vi.fn(),
    verifyAddedEmailByTokenHash: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const useCase = new UpdateOwnProfileUseCase(identityRepository);

  const user = {
    id: "user-1",
    status: "active" as const,
    displayName: "Ada",
    avatarUrl: null,
    email: "ada@example.com",
    username: "ada",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  const profile = {
    firstName: "Ada",
    lastName: "Lovelace",
    locale: "en-US",
    timezone: "UTC",
    bio: "Math",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      user,
      roles: ["member"],
    });
    vi.mocked(identityRepository.updateOwnProfile).mockResolvedValue({
      user,
      profile,
    });
  });

  it("updates the profile after verifying the session", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        firstName: "Ada",
        lastName: "Lovelace",
      }),
    ).resolves.toEqual({ user, profile });

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(identityRepository.updateOwnProfile).toHaveBeenCalledWith({
      userId: "user-1",
      firstName: "Ada",
      lastName: "Lovelace",
    });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad", displayName: "Ada" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.updateOwnProfile).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired", displayName: "Ada" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked", displayName: "Ada" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
