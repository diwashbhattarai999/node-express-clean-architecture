import { describe, expect, it, vi } from "vitest";

import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import { GetMfaStatusUseCase } from "@/modules/auth/mfa/application/use-cases/get-mfa-status.use-case";

describe("GetMfaStatusUseCase", () => {
  it("returns disabled when no verified factors exist", async () => {
    const mfaRepository = {
      listVerifiedFactors: vi.fn().mockResolvedValue([]),
    } as unknown as IMfaRepository;
    const useCase = new GetMfaStatusUseCase(mfaRepository);

    await expect(useCase.execute("user-1")).resolves.toEqual({ enabled: false, factors: [] });
  });

  it("returns enabled factors", async () => {
    const verifiedAt = new Date("2026-01-01T00:00:00.000Z");
    const mfaRepository = {
      listVerifiedFactors: vi.fn().mockResolvedValue([
        {
          id: "factor-1",
          userId: "user-1",
          type: "totp",
          label: "Authenticator app",
          secretEncrypted: "enc",
          destination: null,
          isVerified: true,
          verifiedAt,
          lastUsedAt: null,
          disabledAt: null,
        },
      ]),
    } as unknown as IMfaRepository;
    const useCase = new GetMfaStatusUseCase(mfaRepository);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      enabled: true,
      factors: [
        {
          id: "factor-1",
          type: "totp",
          label: "Authenticator app",
          verifiedAt,
        },
      ],
    });
  });
});
