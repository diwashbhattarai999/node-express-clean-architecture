import type { RequestHandler } from "express";

import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type { AuthEmailOptions } from "@/modules/auth/shared/application/types/auth-composition";
import type { IStepUpRepository } from "@/modules/auth/step-up/application/ports/step-up.repository";
import type { IStepUpTokenSigner } from "@/modules/auth/step-up/application/ports/step-up-token.signer";
import { BeginStepUpUseCase } from "@/modules/auth/step-up/application/use-cases/begin-step-up.use-case";
import { VerifyStepUpUseCase } from "@/modules/auth/step-up/application/use-cases/verify-step-up.use-case";
import { BeginStepUpController } from "@/modules/auth/step-up/presentation/http/controllers/begin-step-up.controller";
import { VerifyStepUpController } from "@/modules/auth/step-up/presentation/http/controllers/verify-step-up.controller";
import { createRequireStepUp } from "@/modules/auth/step-up/presentation/http/middleware/require-step-up.middleware";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateStepUpModuleOptions = {
  stepUpRepository: IStepUpRepository;
  stepUpTokenSigner: IStepUpTokenSigner;
  credentialsRepository: Pick<ICredentialsRepository, "findPasswordHashForUser">;
  passwordHasher: IPasswordHasher;
  mfaRepository: IMfaRepository;
  totpService: ITotpService;
  secretEncryptor: ISecretEncryptor;
  passkeyRepository: IPasskeyRepository;
  webAuthnService: IWebAuthnService;
  emailSender: IEmailSender;
  emailOptions: AuthEmailOptions;
};

export type StepUpModule = {
  beginStepUpController: BeginStepUpController;
  verifyStepUpController: VerifyStepUpController;
  requireStepUp: RequestHandler;
};

export function createStepUpModule(options: CreateStepUpModuleOptions): StepUpModule {
  const otpDispatcher = new MfaOtpDispatcher(options.emailSender, {
    brandName: options.emailOptions.brandName,
  });

  return {
    beginStepUpController: new BeginStepUpController(
      new BeginStepUpUseCase(
        options.stepUpRepository,
        options.credentialsRepository,
        options.mfaRepository,
        options.passkeyRepository,
        options.webAuthnService,
        otpDispatcher,
      ),
    ),
    verifyStepUpController: new VerifyStepUpController(
      new VerifyStepUpUseCase(
        options.stepUpRepository,
        options.stepUpTokenSigner,
        options.credentialsRepository,
        options.passwordHasher,
        options.mfaRepository,
        options.totpService,
        options.secretEncryptor,
        options.passkeyRepository,
        options.webAuthnService,
      ),
    ),
    requireStepUp: createRequireStepUp(options.stepUpTokenSigner),
  };
}
