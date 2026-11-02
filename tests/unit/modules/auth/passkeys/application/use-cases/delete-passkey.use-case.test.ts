import { describe, expect, it, vi } from "vitest";

import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import { PasskeyNotFoundError } from "@/modules/auth/passkeys/application/errors/passkey-not-found.error";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import { DeletePasskeyUseCase } from "@/modules/auth/passkeys/application/use-cases/delete-passkey.use-case";

const passkey = {
  id: "passkey-1",
  userId: "user-1",
  credentialId: "cred-1",
  publicKey: Buffer.from("pk"),
  signCount: 1,
  transports: null,
  aaguid: null,
  backedUp: null,
  name: "Passkey",
  createdAt: new Date(),
  lastUsedAt: null,
  revokedAt: null,
};

describe("DeletePasskeyUseCase", () => {
  it("revokes a passkey when another sign-in method remains", async () => {
    const passkeyRepository = {
      findPasskeyForUser: vi.fn().mockResolvedValue(passkey),
      countViableAuthMethods: vi.fn().mockResolvedValue(1),
      revokePasskey: vi.fn().mockResolvedValue({ ...passkey, revokedAt: new Date() }),
    } as unknown as IPasskeyRepository;
    const useCase = new DeletePasskeyUseCase(passkeyRepository);

    await useCase.execute("user-1", "passkey-1");

    expect(passkeyRepository.revokePasskey).toHaveBeenCalledWith("user-1", "passkey-1");
  });

  it("rejects deleting the last sign-in method", async () => {
    const passkeyRepository = {
      findPasskeyForUser: vi.fn().mockResolvedValue(passkey),
      countViableAuthMethods: vi.fn().mockResolvedValue(0),
      revokePasskey: vi.fn(),
    } as unknown as IPasskeyRepository;
    const useCase = new DeletePasskeyUseCase(passkeyRepository);

    await expect(useCase.execute("user-1", "passkey-1")).rejects.toBeInstanceOf(LastAuthMethodError);
    expect(passkeyRepository.revokePasskey).not.toHaveBeenCalled();
  });

  it("rejects a missing passkey", async () => {
    const passkeyRepository = {
      findPasskeyForUser: vi.fn().mockResolvedValue(null),
    } as unknown as IPasskeyRepository;
    const useCase = new DeletePasskeyUseCase(passkeyRepository);

    await expect(useCase.execute("user-1", "passkey-1")).rejects.toBeInstanceOf(PasskeyNotFoundError);
  });
});
