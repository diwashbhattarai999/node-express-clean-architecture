import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { CheckIdentifierUseCase } from "@/modules/auth/identity/application/use-cases/check-identifier.use-case";

describe("CheckIdentifierUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findIdentityByNormalized"> = {
    findIdentityByNormalized: vi.fn(),
  };

  const useCase = new CheckIdentifierUseCase(identityRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "user-1",
    });
  });

  it("always reports taken emails as available", async () => {
    await expect(
      useCase.execute({ type: "email", identifier: "Ada@Example.com" }),
    ).resolves.toEqual({ available: true });

    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith(
      "email",
      "ada@example.com",
    );
  });

  it("always reports taken phones as available", async () => {
    await expect(
      useCase.execute({ type: "phone", identifier: "+9779812345678" }),
    ).resolves.toEqual({ available: true });

    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith(
      "phone",
      "+9779812345678",
    );
  });

  it("returns available false for reserved usernames without looking up", async () => {
    await expect(useCase.execute({ type: "username", identifier: "Admin" })).resolves.toEqual({
      available: false,
    });
    expect(identityRepository.findIdentityByNormalized).not.toHaveBeenCalled();
  });

  it("always reports taken usernames as available", async () => {
    await expect(useCase.execute({ type: "username", identifier: "Ada" })).resolves.toEqual({
      available: true,
    });
    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith("username", "ada");
  });
});
