import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { VerifyAddedEmailUseCase } from "@/modules/auth/identity/application/use-cases/verify-added-email.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("VerifyAddedEmailUseCase", () => {
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

  const useCase = new VerifyAddedEmailUseCase(identityRepository);

  const identity = {
    id: "identity-1",
    type: "email" as const,
    identifier: "second@example.com",
    verifiedAt: new Date("2026-01-03T00:00:00.000Z"),
    isPrimary: false,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.verifyAddedEmailByTokenHash).mockResolvedValue({
      outcome: "verified",
      userId: "user-1",
      identity,
    });
  });

  it("verifies the email from a public token", async () => {
    await expect(useCase.execute({ token: "verify-token" })).resolves.toEqual(identity);
    expect(identityRepository.verifyAddedEmailByTokenHash).toHaveBeenCalledWith(expect.any(String));
  });

  it("allows a matching bearer actor", async () => {
    await expect(
      useCase.execute({ token: "verify-token", actorUserId: "user-1" }),
    ).resolves.toEqual(identity);
  });

  it("rejects a bearer actor that does not own the token", async () => {
    await expect(
      useCase.execute({ token: "verify-token", actorUserId: "other-user" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenInvalidError for unknown tokens", async () => {
    vi.mocked(identityRepository.verifyAddedEmailByTokenHash).mockResolvedValue({
      outcome: "invalid",
    });

    await expect(useCase.execute({ token: "bad" })).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it("throws TokenExpiredError for expired tokens", async () => {
    vi.mocked(identityRepository.verifyAddedEmailByTokenHash).mockResolvedValue({
      outcome: "expired",
    });

    await expect(useCase.execute({ token: "expired" })).rejects.toBeInstanceOf(TokenExpiredError);
  });
});
