import { beforeEach, describe, expect, it, vi } from "vitest";

import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { RequestAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/request-account-deletion.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";

describe("RequestAccountDeletionUseCase", () => {
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
    scheduleAccountDeletion: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const credentialsRepository: ICredentialsRepository = {
    findPasswordLoginCandidate: vi.fn(),
    findPasswordResetTarget: vi.fn(),
    replacePasswordResetToken: vi.fn(),
    validatePasswordResetTokenHash: vi.fn(),
    resetPasswordByTokenHash: vi.fn(),
    findPasswordHashForUser: vi.fn(),
    changePasswordForUser: vi.fn(),
  };

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const useCase = new RequestAccountDeletionUseCase(
    identityRepository,
    credentialsRepository,
    passwordHasher,
    { graceDays: 14 },
  );

  const scheduledFor = new Date("2026-11-14T00:00:00.000Z");

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
    vi.mocked(identityRepository.scheduleAccountDeletion).mockResolvedValue({
      outcome: "scheduled",
      scheduledFor,
    });
  });

  it("schedules deletion without a password", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
      }),
    ).resolves.toEqual(scheduledFor);

    expect(credentialsRepository.findPasswordHashForUser).not.toHaveBeenCalled();
    expect(identityRepository.scheduleAccountDeletion).toHaveBeenCalledWith({
      userId: "user-1",
      scheduledFor: expect.any(Date),
    });
  });

  it("verifies an optional password before scheduling", async () => {
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue("hash");
    vi.mocked(passwordHasher.compare).mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        password: "Secret1!",
        reason: "Leaving",
      }),
    ).resolves.toEqual(scheduledFor);

    expect(credentialsRepository.findPasswordHashForUser).toHaveBeenCalledWith("user-1");
    expect(passwordHasher.compare).toHaveBeenCalledWith("Secret1!", "hash");
    expect(identityRepository.scheduleAccountDeletion).toHaveBeenCalledWith({
      userId: "user-1",
      scheduledFor: expect.any(Date),
      reason: "Leaving",
    });
  });

  it("throws InvalidCredentialsError when the password does not match", async () => {
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue("hash");
    vi.mocked(passwordHasher.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        password: "Wrong1!",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(identityRepository.scheduleAccountDeletion).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.scheduleAccountDeletion).not.toHaveBeenCalled();
  });
});
