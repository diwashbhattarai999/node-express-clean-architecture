import { describe, expect, it, vi } from "vitest";

import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import { ListPasskeysUseCase } from "@/modules/auth/passkeys/application/use-cases/list-passkeys.use-case";

describe("ListPasskeysUseCase", () => {
  it("returns passkeys for the user", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const passkeyRepository = {
      listPasskeysForUser: vi.fn().mockResolvedValue([
        {
          id: "passkey-1",
          userId: "user-1",
          credentialId: "cred-1",
          publicKey: Buffer.from("pk"),
          signCount: 0,
          transports: ["internal"],
          aaguid: null,
          backedUp: true,
          name: "Laptop",
          createdAt,
          lastUsedAt: null,
          revokedAt: null,
        },
      ]),
    } as unknown as IPasskeyRepository;

    const useCase = new ListPasskeysUseCase(passkeyRepository);
    const result = await useCase.execute("user-1");

    expect(result.passkeys).toHaveLength(1);
    expect(result.passkeys[0]?.name).toBe("Laptop");
  });
});
