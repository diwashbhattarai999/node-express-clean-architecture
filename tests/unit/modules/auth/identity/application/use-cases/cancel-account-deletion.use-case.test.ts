import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountDeletionNotFoundError } from "@/modules/auth/identity/application/errors/account-deletion-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { CancelAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/cancel-account-deletion.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

describe("CancelAccountDeletionUseCase", () => {
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
    cancelAccountDeletion: vi.fn(),
    applyDueAccountDeletions: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const jobQueue: IJobQueue = {
    enqueue: vi.fn(),
    upsertRepeatable: vi.fn(),
    remove: vi.fn(),
    close: vi.fn(),
  };

  const useCase = new CancelAccountDeletionUseCase(identityRepository, jobQueue);

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
    vi.mocked(identityRepository.cancelAccountDeletion).mockResolvedValue({
      outcome: "cancelled",
    });
  });

  it("clears pending deletion and removes the delayed job", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
      }),
    ).resolves.toBeUndefined();

    expect(identityRepository.cancelAccountDeletion).toHaveBeenCalledWith("user-1");
    expect(jobQueue.remove).toHaveBeenCalledWith("apply-account-deletion__user-1");
  });

  it("throws AccountDeletionNotFoundError when nothing is pending", async () => {
    vi.mocked(identityRepository.cancelAccountDeletion).mockResolvedValue({
      outcome: "not_found",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
      }),
    ).rejects.toBeInstanceOf(AccountDeletionNotFoundError);
    expect(jobQueue.remove).not.toHaveBeenCalled();
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
    expect(identityRepository.cancelAccountDeletion).not.toHaveBeenCalled();
    expect(jobQueue.remove).not.toHaveBeenCalled();
  });
});
