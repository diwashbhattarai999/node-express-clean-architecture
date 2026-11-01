import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import { MfaSignInGuard } from "@/modules/auth/mfa/application/services/mfa-sign-in-guard";
import { BeginMfaChallengeUseCase } from "@/modules/auth/mfa/application/use-cases/begin-mfa-challenge.use-case";
import { BeginMfaEnrollUseCase } from "@/modules/auth/mfa/application/use-cases/begin-mfa-enroll.use-case";
import { ConfirmMfaEnrollUseCase } from "@/modules/auth/mfa/application/use-cases/confirm-mfa-enroll.use-case";
import { DisableMfaUseCase } from "@/modules/auth/mfa/application/use-cases/disable-mfa.use-case";
import { GetMfaStatusUseCase } from "@/modules/auth/mfa/application/use-cases/get-mfa-status.use-case";
import { RegenerateMfaRecoveryCodesUseCase } from "@/modules/auth/mfa/application/use-cases/regenerate-mfa-recovery-codes.use-case";
import { VerifyMfaChallengeUseCase } from "@/modules/auth/mfa/application/use-cases/verify-mfa-challenge.use-case";
import { BeginMfaChallengeController } from "@/modules/auth/mfa/presentation/http/controllers/begin-mfa-challenge.controller";
import { BeginMfaEnrollController } from "@/modules/auth/mfa/presentation/http/controllers/begin-mfa-enroll.controller";
import { ConfirmMfaEnrollController } from "@/modules/auth/mfa/presentation/http/controllers/confirm-mfa-enroll.controller";
import { DisableMfaController } from "@/modules/auth/mfa/presentation/http/controllers/disable-mfa.controller";
import { GetMfaStatusController } from "@/modules/auth/mfa/presentation/http/controllers/get-mfa-status.controller";
import { RegenerateMfaRecoveryCodesController } from "@/modules/auth/mfa/presentation/http/controllers/regenerate-mfa-recovery-codes.controller";
import { VerifyMfaChallengeController } from "@/modules/auth/mfa/presentation/http/controllers/verify-mfa-challenge.controller";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type {
  AuthCookieOptions,
  AuthEmailOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateMfaModuleOptions = {
  mfaRepository: IMfaRepository;
  identityRepository: Pick<IIdentityRepository, "listIdentitiesForUser">;
  credentialsRepository: Pick<ICredentialsRepository, "findPasswordHashForUser">;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  accessTokenSigner: IAccessTokenSigner;
  totpService: ITotpService;
  secretEncryptor: ISecretEncryptor;
  emailSender: IEmailSender;
  emailOptions: AuthEmailOptions;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type MfaModule = {
  mfaSignInGuard: MfaSignInGuard;
  getMfaStatusController: GetMfaStatusController;
  beginMfaEnrollController: BeginMfaEnrollController;
  confirmMfaEnrollController: ConfirmMfaEnrollController;
  disableMfaController: DisableMfaController;
  beginMfaChallengeController: BeginMfaChallengeController;
  verifyMfaChallengeController: VerifyMfaChallengeController;
  regenerateMfaRecoveryCodesController: RegenerateMfaRecoveryCodesController;
};

export function createMfaModule(options: CreateMfaModuleOptions): MfaModule {
  const otpDispatcher = new MfaOtpDispatcher(options.emailSender, {
    brandName: options.emailOptions.brandName,
  });
  const mfaSignInGuard = new MfaSignInGuard(options.mfaRepository);

  return {
    mfaSignInGuard,
    getMfaStatusController: new GetMfaStatusController(
      new GetMfaStatusUseCase(options.mfaRepository),
    ),
    beginMfaEnrollController: new BeginMfaEnrollController(
      new BeginMfaEnrollUseCase(
        options.mfaRepository,
        options.identityRepository,
        options.totpService,
        options.secretEncryptor,
        otpDispatcher,
        { brandName: options.emailOptions.brandName },
      ),
    ),
    confirmMfaEnrollController: new ConfirmMfaEnrollController(
      new ConfirmMfaEnrollUseCase(
        options.mfaRepository,
        options.totpService,
        options.secretEncryptor,
      ),
    ),
    disableMfaController: new DisableMfaController(
      new DisableMfaUseCase(
        options.mfaRepository,
        options.credentialsRepository,
        options.passwordHasher,
        options.totpService,
        options.secretEncryptor,
      ),
    ),
    beginMfaChallengeController: new BeginMfaChallengeController(
      new BeginMfaChallengeUseCase(options.mfaRepository, otpDispatcher),
    ),
    verifyMfaChallengeController: new VerifyMfaChallengeController(
      new VerifyMfaChallengeUseCase(
        options.mfaRepository,
        options.sessionRepository,
        options.accessTokenSigner,
        options.totpService,
        options.secretEncryptor,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    regenerateMfaRecoveryCodesController: new RegenerateMfaRecoveryCodesController(
      new RegenerateMfaRecoveryCodesUseCase(options.mfaRepository),
    ),
  };
}
