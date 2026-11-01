import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityNotFoundError } from "@/modules/auth/identity/application/errors/identity-not-found.error";
import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { RemovePhoneUseCase } from "@/modules/auth/identity/application/use-cases/remove-phone.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("RemovePhoneUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    existsById: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    addEmailIdentity: vi.fn(),
    addPhoneIdentity: vi.fn(),
    verifyAddedEmailByTokenHash: vi.fn(),
    removeEmailIdentity: vi.fn(),
    removePhoneIdentity: vi.fn(),
    scheduleAccountDeletion: vi.fn(),
    cancelAccountDeletion: vi.fn(),
    applyDueAccountDeletions: vi.fn(),
    upsertUsername: vi.fn(),
    listUsers: vi.fn(),
    findAdminDetails: vi.fn(),
    setUserStatus: vi.fn(),
    hardDeleteById: vi.fn(),
  };

  const useCase = new RemovePhoneUseCase(identityRepository);

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
    vi.mocked(identityRepository.removePhoneIdentity).mockResolvedValue({
      outcome: "removed",
    });
  });

  it("removes a phone identity", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        identityId: "identity-2",
      }),
    ).resolves.toBeUndefined();

    expect(identityRepository.removePhoneIdentity).toHaveBeenCalledWith({
      userId: "user-1",
      identityId: "identity-2",
    });
  });

  it("throws LastAuthMethodError when the phone is the last sign-in method", async () => {
    vi.mocked(identityRepository.removePhoneIdentity).mockResolvedValue({
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
    vi.mocked(identityRepository.removePhoneIdentity).mockResolvedValue({
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
    expect(identityRepository.removePhoneIdentity).not.toHaveBeenCalled();
  });
});
