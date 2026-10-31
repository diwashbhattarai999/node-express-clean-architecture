import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { ListOwnIdentitiesUseCase } from "@/modules/auth/identity/application/use-cases/list-own-identities.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListOwnIdentitiesUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    addEmailIdentity: vi.fn(),
    verifyAddedEmailByTokenHash: vi.fn(),
    removeEmailIdentity: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const useCase = new ListOwnIdentitiesUseCase(identityRepository);

  const identities = [
    {
      id: "identity-1",
      type: "email" as const,
      identifier: "ada@example.com",
      verifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      isPrimary: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
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
    vi.mocked(identityRepository.listIdentitiesForUser).mockResolvedValue(identities);
  });

  it("lists identities after verifying the session", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).resolves.toEqual({ identities });

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(identityRepository.listIdentitiesForUser).toHaveBeenCalledWith("user-1");
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.listIdentitiesForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
