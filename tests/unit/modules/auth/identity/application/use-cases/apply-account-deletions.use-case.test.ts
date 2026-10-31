import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { ApplyAccountDeletionsUseCase } from "@/modules/auth/identity/application/use-cases/apply-account-deletions.use-case";

describe("ApplyAccountDeletionsUseCase", () => {
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
    applyDueAccountDeletions: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const useCase = new ApplyAccountDeletionsUseCase(identityRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.applyDueAccountDeletions).mockResolvedValue(["user-1"]);
  });

  it("applies all due deletions", async () => {
    await expect(useCase.execute()).resolves.toEqual({ appliedUserIds: ["user-1"] });

    expect(identityRepository.applyDueAccountDeletions).toHaveBeenCalledWith({
      now: expect.any(Date),
    });
  });

  it("applies a single due user deletion", async () => {
    await expect(useCase.execute({ userId: "user-1" })).resolves.toEqual({
      appliedUserIds: ["user-1"],
    });

    expect(identityRepository.applyDueAccountDeletions).toHaveBeenCalledWith({
      now: expect.any(Date),
      userId: "user-1",
    });
  });
});
