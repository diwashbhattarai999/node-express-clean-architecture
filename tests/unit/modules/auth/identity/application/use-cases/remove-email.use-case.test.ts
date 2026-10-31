import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityNotFoundError } from "@/modules/auth/identity/application/errors/identity-not-found.error";
import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { RemoveEmailUseCase } from "@/modules/auth/identity/application/use-cases/remove-email.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("RemoveEmailUseCase", () => {
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

  const useCase = new RemoveEmailUseCase(identityRepository);

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
    vi.mocked(identityRepository.removeEmailIdentity).mockResolvedValue({
      outcome: "removed",
    });
  });

  it("removes an email identity", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        identityId: "identity-2",
      }),
    ).resolves.toBeUndefined();

    expect(identityRepository.removeEmailIdentity).toHaveBeenCalledWith({
      userId: "user-1",
      identityId: "identity-2",
    });
  });

  it("throws LastAuthMethodError when the email is the last sign-in method", async () => {
    vi.mocked(identityRepository.removeEmailIdentity).mockResolvedValue({
      outcome: "last_auth_method",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        identityId: "identity-1",
      }),
    ).rejects.toBeInstanceOf(LastAuthMethodError);
  });

  it("throws IdentityNotFoundError when the identity is missing", async () => {
    vi.mocked(identityRepository.removeEmailIdentity).mockResolvedValue({
      outcome: "not_found",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        identityId: "missing",
      }),
    ).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        identityId: "identity-2",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.removeEmailIdentity).not.toHaveBeenCalled();
  });
});
