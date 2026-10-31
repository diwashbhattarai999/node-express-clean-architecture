import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { GetOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/get-own-profile.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { EMPTY_AUTH_USER_PROFILE } from "@/modules/auth/shared/application/types/auth.types";

describe("GetOwnProfileUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const useCase = new GetOwnProfileUseCase(identityRepository);

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user and profile", async () => {
    vi.mocked(identityRepository.findOwnProfile).mockResolvedValue({
      outcome: "ok",
      user,
      profile: {
        firstName: "Ada",
        lastName: "Lovelace",
        locale: "en-US",
        timezone: "UTC",
        bio: "Math",
      },
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).resolves.toEqual({
      user,
      profile: {
        firstName: "Ada",
        lastName: "Lovelace",
        locale: "en-US",
        timezone: "UTC",
        bio: "Math",
      },
    });
  });

  it("returns an empty profile when none is stored", async () => {
    vi.mocked(identityRepository.findOwnProfile).mockResolvedValue({
      outcome: "ok",
      user,
      profile: EMPTY_AUTH_USER_PROFILE,
    });

    const result = await useCase.execute({ userId: "user-1", sessionId: "session-1" });

    expect(result.profile).toEqual(EMPTY_AUTH_USER_PROFILE);
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findOwnProfile).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findOwnProfile).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findOwnProfile).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
