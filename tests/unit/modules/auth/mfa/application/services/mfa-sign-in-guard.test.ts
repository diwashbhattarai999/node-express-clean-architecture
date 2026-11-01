import { describe, expect, it, vi } from "vitest";

import { MfaRequiredError } from "@/modules/auth/mfa/application/errors/mfa-required.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import { MfaSignInGuard } from "@/modules/auth/mfa/application/services/mfa-sign-in-guard";

describe("MfaSignInGuard", () => {
  it("no-ops when MFA is not enabled", async () => {
    const mfaRepository = {
      hasVerifiedFactor: vi.fn().mockResolvedValue(false),
      insertChallenge: vi.fn(),
    } as unknown as IMfaRepository;
    const guard = new MfaSignInGuard(mfaRepository);

    await expect(guard.assertNotRequired("user-1")).resolves.toBeUndefined();
    expect(mfaRepository.insertChallenge).not.toHaveBeenCalled();
  });

  it("creates a pending login and throws MFA_REQUIRED", async () => {
    const mfaRepository = {
      hasVerifiedFactor: vi.fn().mockResolvedValue(true),
      insertChallenge: vi.fn().mockResolvedValue({ id: "pending-1" }),
    } as unknown as IMfaRepository;
    const guard = new MfaSignInGuard(mfaRepository);

    await expect(guard.assertNotRequired("user-1")).rejects.toBeInstanceOf(MfaRequiredError);
    expect(mfaRepository.insertChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        challengeHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });
});
