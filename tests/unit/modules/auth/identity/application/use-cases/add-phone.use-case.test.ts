import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { AddPhoneUseCase } from "@/modules/auth/identity/application/use-cases/add-phone.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("AddPhoneUseCase", () => {
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

  const useCase = new AddPhoneUseCase(identityRepository);

  const identity = {
    id: "identity-1",
    type: "phone" as const,
    identifier: "+9779812345678",
    verifiedAt: null,
    isPrimary: false,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
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
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue(null);
    vi.mocked(identityRepository.addPhoneIdentity).mockResolvedValue(identity);
  });

  it("adds an unverified phone identity", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        phone: " +9779812345678 ",
      }),
    ).resolves.toEqual(identity);

    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith(
      "phone",
      "+9779812345678",
    );
    expect(identityRepository.addPhoneIdentity).toHaveBeenCalledWith({
      userId: "user-1",
      identifier: "+9779812345678",
      normalizedIdentifier: "+9779812345678",
      tokenHash: expect.any(String),
      expiresAt: expect.any(Date),
    });
  });

  it("throws when the phone is already taken", async () => {
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "other-user",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        phone: "+9779812345678",
      }),
    ).rejects.toBeInstanceOf(IdentityAlreadyExistsError);
    expect(identityRepository.addPhoneIdentity).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        phone: "+9779812345678",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.addPhoneIdentity).not.toHaveBeenCalled();
  });
});
