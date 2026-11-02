import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { StepUpMethodUnavailableError } from "@/modules/auth/step-up/application/errors/step-up-method-unavailable.error";
import type { IStepUpRepository } from "@/modules/auth/step-up/application/ports/step-up.repository";
import { BeginStepUpUseCase } from "@/modules/auth/step-up/application/use-cases/begin-step-up.use-case";

describe("BeginStepUpUseCase", () => {
  const stepUpRepository = {
    consumeOpenChallenges: vi.fn(),
    insertChallenge: vi.fn(),
  } as unknown as IStepUpRepository;

  const credentialsRepository = {
    findPasswordHashForUser: vi.fn(),
  } as unknown as Pick<ICredentialsRepository, "findPasswordHashForUser">;

  const mfaRepository = {
    listVerifiedFactors: vi.fn(),
    insertChallenge: vi.fn(),
  } as unknown as IMfaRepository;

  const passkeyRepository = {
    listPasskeysForUser: vi.fn(),
  } as unknown as Pick<IPasskeyRepository, "listPasskeysForUser">;

  const webAuthnService = {
    generateAuthenticationOptions: vi.fn(),
  } as unknown as IWebAuthnService;

  const otpDispatcher = {
    send: vi.fn(),
  } as unknown as MfaOtpDispatcher;

  const useCase = new BeginStepUpUseCase(
    stepUpRepository,
    credentialsRepository,
    mfaRepository,
    passkeyRepository,
    webAuthnService,
    otpDispatcher,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stepUpRepository.consumeOpenChallenges).mockResolvedValue(undefined);
  });

  it("starts a password step-up challenge", async () => {
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue("hash");
    vi.mocked(stepUpRepository.insertChallenge).mockResolvedValue({
      id: "step-1",
      userId: "user-1",
      sessionId: "session-1",
      method: "password",
      mfaChallengeId: null,
      webauthnChallenge: null,
      expiresAt: new Date("2026-01-01T00:05:00.000Z"),
      verifiedAt: null,
    });

    await expect(
      useCase.execute("user-1", "session-1", { method: "password" }),
    ).resolves.toMatchObject({
      stepUpId: "step-1",
      method: "password",
    });
  });

  it("rejects password step-up when no password exists", async () => {
    vi.mocked(credentialsRepository.findPasswordHashForUser).mockResolvedValue(null);

    await expect(
      useCase.execute("user-1", "session-1", { method: "password" }),
    ).rejects.toBeInstanceOf(StepUpMethodUnavailableError);
  });
});
