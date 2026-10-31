import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type {
  AuthCookieOptions,
  AuthEmailOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";
import { ResendEmailVerificationUseCase } from "@/modules/auth/verification/application/use-cases/resend-email-verification.use-case";
import { ResendPhoneVerificationUseCase } from "@/modules/auth/verification/application/use-cases/resend-phone-verification.use-case";
import { VerifyEmailUseCase } from "@/modules/auth/verification/application/use-cases/verify-email.use-case";
import { VerifyPhoneUseCase } from "@/modules/auth/verification/application/use-cases/verify-phone.use-case";
import { PostgresVerificationRepository } from "@/modules/auth/verification/infrastructure/repositories/postgres-verification.repository";
import { ResendEmailVerificationController } from "@/modules/auth/verification/presentation/http/controllers/resend-email-verification.controller";
import { ResendPhoneVerificationController } from "@/modules/auth/verification/presentation/http/controllers/resend-phone-verification.controller";
import { VerifyEmailController } from "@/modules/auth/verification/presentation/http/controllers/verify-email.controller";
import { VerifyPhoneController } from "@/modules/auth/verification/presentation/http/controllers/verify-phone.controller";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateVerificationModuleOptions = {
  accessTokenSigner: IAccessTokenSigner;
  emailSender: IEmailSender;
  emailOptions: AuthEmailOptions;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type VerificationModule = {
  verifyEmailController: VerifyEmailController;
  resendEmailVerificationController: ResendEmailVerificationController;
  verifyPhoneController: VerifyPhoneController;
  resendPhoneVerificationController: ResendPhoneVerificationController;
};

export function createVerificationModule(
  options: CreateVerificationModuleOptions,
): VerificationModule {
  const verificationRepository = new PostgresVerificationRepository();

  return {
    verifyEmailController: new VerifyEmailController(
      new VerifyEmailUseCase(
        verificationRepository,
        options.accessTokenSigner,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    resendEmailVerificationController: new ResendEmailVerificationController(
      new ResendEmailVerificationUseCase(
        verificationRepository,
        options.emailSender,
        options.emailOptions,
      ),
    ),
    verifyPhoneController: new VerifyPhoneController(
      new VerifyPhoneUseCase(
        verificationRepository,
        options.accessTokenSigner,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    resendPhoneVerificationController: new ResendPhoneVerificationController(
      new ResendPhoneVerificationUseCase(verificationRepository),
    ),
  };
}
