import type { TEnv } from "@/config/env-schema";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { RegisterUseCase } from "@/modules/auth/application/use-cases/register.use-case";
import { ResendEmailVerificationUseCase } from "@/modules/auth/application/use-cases/resend-email-verification.use-case";
import { ResendPhoneVerificationUseCase } from "@/modules/auth/application/use-cases/resend-phone-verification.use-case";
import { VerifyEmailUseCase } from "@/modules/auth/application/use-cases/verify-email.use-case";
import { VerifyPhoneUseCase } from "@/modules/auth/application/use-cases/verify-phone.use-case";
import { PostgresAuthAccountRepository } from "@/modules/auth/infrastructure/repositories/postgres-auth-account.repository";
import { JoseAccessTokenSigner } from "@/modules/auth/infrastructure/security/jose-access-token.signer";
import { RegisterController } from "@/modules/auth/presentation/http/controllers/register.controller";
import { ResendEmailVerificationController } from "@/modules/auth/presentation/http/controllers/resend-email-verification.controller";
import { ResendPhoneVerificationController } from "@/modules/auth/presentation/http/controllers/resend-phone-verification.controller";
import { VerifyEmailController } from "@/modules/auth/presentation/http/controllers/verify-email.controller";
import { VerifyPhoneController } from "@/modules/auth/presentation/http/controllers/verify-phone.controller";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateAuthModuleOptions = {
  emailSender: IEmailSender;
  passwordHasher: IPasswordHasher;
  accessTokenSigner?: IAccessTokenSigner;
  env: TEnv;
};

export function createAuthModule(options: CreateAuthModuleOptions) {
  const authAccountRepository = new PostgresAuthAccountRepository();
  const accessTokenSigner =
    options.accessTokenSigner ??
    new JoseAccessTokenSigner({
      secret: options.env.AUTH_JWT_SECRET,
      issuer: options.env.AUTH_JWT_ISSUER,
      audience: options.env.AUTH_JWT_AUDIENCE,
      expiresInSeconds: options.env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    });

  const emailVerificationOptions = {
    frontendBaseUrl: options.env.FRONTEND_BASE_URL,
    brandName: options.env.APP_NAME,
  };

  const sessionOptions = {
    refreshTokenTtlSeconds: options.env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  };

  const registerUseCase = new RegisterUseCase(
    authAccountRepository,
    options.passwordHasher,
    options.emailSender,
    emailVerificationOptions,
  );

  const verifyEmailUseCase = new VerifyEmailUseCase(
    authAccountRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendEmailVerificationUseCase = new ResendEmailVerificationUseCase(
    authAccountRepository,
    options.emailSender,
    emailVerificationOptions,
  );

  const verifyPhoneUseCase = new VerifyPhoneUseCase(
    authAccountRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendPhoneVerificationUseCase = new ResendPhoneVerificationUseCase(authAccountRepository);

  return {
    registerController: new RegisterController(registerUseCase),
    verifyEmailController: new VerifyEmailController(verifyEmailUseCase),
    resendEmailVerificationController: new ResendEmailVerificationController(
      resendEmailVerificationUseCase,
    ),
    verifyPhoneController: new VerifyPhoneController(verifyPhoneUseCase),
    resendPhoneVerificationController: new ResendPhoneVerificationController(
      resendPhoneVerificationUseCase,
    ),
  };
}
