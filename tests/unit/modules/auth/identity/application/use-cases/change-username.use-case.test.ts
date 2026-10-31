import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import { UsernameReservedError } from "@/modules/auth/identity/application/errors/username-reserved.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { ChangeUsernameUseCase } from "@/modules/auth/identity/application/use-cases/change-username.use-case";

describe("ChangeUsernameUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const useCase = new ChangeUsernameUseCase(identityRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue(null);
    vi.mocked(identityRepository.upsertUsername).mockResolvedValue({
      id: "user-1",
      status: "active",
      displayName: "Ada",
      avatarUrl: null,
      email: "ada@example.com",
      username: "ada",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("normalizes and upserts a username", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      username: "Ada",
    });

    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith("username", "ada");
    expect(identityRepository.upsertUsername).toHaveBeenCalledWith({
      userId: "user-1",
      identifier: "Ada",
      normalizedIdentifier: "ada",
    });
    expect(result.user.username).toBe("ada");
  });

  it("allows the same user to keep their username", async () => {
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "user-1",
    });

    await useCase.execute({ userId: "user-1", username: "ada" });

    expect(identityRepository.upsertUsername).toHaveBeenCalledOnce();
  });

  it("throws when the username belongs to another user", async () => {
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "user-2",
    });

    await expect(useCase.execute({ userId: "user-1", username: "ada" })).rejects.toBeInstanceOf(
      IdentityAlreadyExistsError,
    );
    expect(identityRepository.upsertUsername).not.toHaveBeenCalled();
  });

  it("throws when the username is reserved", async () => {
    await expect(useCase.execute({ userId: "user-1", username: "Admin" })).rejects.toBeInstanceOf(
      UsernameReservedError,
    );
    expect(identityRepository.upsertUsername).not.toHaveBeenCalled();
  });
});
