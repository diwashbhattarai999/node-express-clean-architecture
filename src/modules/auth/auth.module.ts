import type { RequestHandler } from "express";

import type { TEnv } from "@/config/env-schema";
import { Environment } from "@/config/environment";
import { ForgotPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/forgot-password.use-case";
import { LoginUseCase } from "@/modules/auth/credentials/application/use-cases/login.use-case";
import { ResetPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/reset-password.use-case";
import { PostgresCredentialsRepository } from "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository";
import { ForgotPasswordController } from "@/modules/auth/credentials/presentation/http/controllers/forgot-password.controller";
import { LoginController } from "@/modules/auth/credentials/presentation/http/controllers/login.controller";
import { ResetPasswordController } from "@/modules/auth/credentials/presentation/http/controllers/reset-password.controller";
import { GetMeUseCase } from "@/modules/auth/identity/application/use-cases/get-me.use-case";
import { RegisterUseCase } from "@/modules/auth/identity/application/use-cases/register.use-case";
import { PostgresIdentityRepository } from "@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository";
import { GetMeController } from "@/modules/auth/identity/presentation/http/controllers/get-me.controller";
import { RegisterController } from "@/modules/auth/identity/presentation/http/controllers/register.controller";
import { GetSessionUseCase } from "@/modules/auth/sessions/application/use-cases/get-session.use-case";
import { ListSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/list-sessions.use-case";
import { LogoutUseCase } from "@/modules/auth/sessions/application/use-cases/logout.use-case";
import { LogoutAllUseCase } from "@/modules/auth/sessions/application/use-cases/logout-all.use-case";
import { RefreshUseCase } from "@/modules/auth/sessions/application/use-cases/refresh.use-case";
import { RevokeOtherSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-other-sessions.use-case";
import { RevokeSessionUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-session.use-case";
import { PostgresSessionRepository } from "@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository";
import { GetSessionController } from "@/modules/auth/sessions/presentation/http/controllers/get-session.controller";
import { ListSessionsController } from "@/modules/auth/sessions/presentation/http/controllers/list-sessions.controller";
import { LogoutController } from "@/modules/auth/sessions/presentation/http/controllers/logout.controller";
import { LogoutAllController } from "@/modules/auth/sessions/presentation/http/controllers/logout-all.controller";
import { RefreshController } from "@/modules/auth/sessions/presentation/http/controllers/refresh.controller";
import { RevokeOtherSessionsController } from "@/modules/auth/sessions/presentation/http/controllers/revoke-other-sessions.controller";
import { RevokeSessionController } from "@/modules/auth/sessions/presentation/http/controllers/revoke-session.controller";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { JoseAccessTokenSigner } from "@/modules/auth/shared/infrastructure/security/jose-access-token.signer";
import { assertCsrfWhenRefreshCookie } from "@/modules/auth/shared/presentation/http/middleware/assert-csrf-when-refresh-cookie.middleware";
import { createRequireBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/require-bearer-auth.middleware";
import { requireRefreshAuth } from "@/modules/auth/shared/presentation/http/middleware/require-refresh-auth.middleware";
import { createRequireRefreshOrBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/require-refresh-or-bearer-auth.middleware";
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

export type CreateAuthModuleOptions = {
  emailSender: IEmailSender;
  passwordHasher: IPasswordHasher;
  accessTokenSigner?: IAccessTokenSigner;
  env: TEnv;
};

export type AuthModule = {
  registerController: RegisterController;
  verifyEmailController: VerifyEmailController;
  resendEmailVerificationController: ResendEmailVerificationController;
  verifyPhoneController: VerifyPhoneController;
  resendPhoneVerificationController: ResendPhoneVerificationController;
  loginController: LoginController;
  refreshController: RefreshController;
  logoutController: LogoutController;
  logoutAllController: LogoutAllController;
  getMeController: GetMeController;
  listSessionsController: ListSessionsController;
  getSessionController: GetSessionController;
  revokeSessionController: RevokeSessionController;
  revokeOtherSessionsController: RevokeOtherSessionsController;
  forgotPasswordController: ForgotPasswordController;
  resetPasswordController: ResetPasswordController;
  requireRefreshAuth: RequestHandler;
  requireRefreshOrBearerAuth: RequestHandler;
  requireBearerAuth: RequestHandler;
  assertCsrfWhenRefreshCookie: RequestHandler;
};

export function createAuthModule(options: CreateAuthModuleOptions): AuthModule {
  const identityRepository = new PostgresIdentityRepository();
  const credentialsRepository = new PostgresCredentialsRepository();
  const verificationRepository = new PostgresVerificationRepository();
  const sessionRepository = new PostgresSessionRepository();

  const accessTokenSigner =
    options.accessTokenSigner ??
    new JoseAccessTokenSigner({
      secret: options.env.AUTH_JWT_SECRET,
      issuer: options.env.AUTH_JWT_ISSUER,
      audience: options.env.AUTH_JWT_AUDIENCE,
      expiresInSeconds: options.env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    });

  const emailOptions = {
    frontendBaseUrl: options.env.FRONTEND_BASE_URL,
    brandName: options.env.APP_NAME,
  };

  const sessionOptions = {
    refreshTokenTtlSeconds: options.env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  };

  const cookieOptions = {
    refreshTokenTtlSeconds: options.env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
    secureCookies:
      options.env.NODE_ENV === Environment.PRODUCTION ||
      options.env.NODE_ENV === Environment.STAGING,
  };

  const registerUseCase = new RegisterUseCase(
    identityRepository,
    options.passwordHasher,
    options.emailSender,
    emailOptions,
  );

  const verifyEmailUseCase = new VerifyEmailUseCase(
    verificationRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendEmailVerificationUseCase = new ResendEmailVerificationUseCase(
    verificationRepository,
    options.emailSender,
    emailOptions,
  );

  const verifyPhoneUseCase = new VerifyPhoneUseCase(
    verificationRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendPhoneVerificationUseCase = new ResendPhoneVerificationUseCase(verificationRepository);

  const loginUseCase = new LoginUseCase(
    credentialsRepository,
    sessionRepository,
    options.passwordHasher,
    accessTokenSigner,
    sessionOptions,
  );

  const refreshUseCase = new RefreshUseCase(sessionRepository, accessTokenSigner, sessionOptions);

  const logoutUseCase = new LogoutUseCase(sessionRepository);
  const logoutAllUseCase = new LogoutAllUseCase(sessionRepository);
  const getMeUseCase = new GetMeUseCase(identityRepository);
  const listSessionsUseCase = new ListSessionsUseCase(sessionRepository);
  const getSessionUseCase = new GetSessionUseCase(sessionRepository);
  const revokeSessionUseCase = new RevokeSessionUseCase(sessionRepository);
  const revokeOtherSessionsUseCase = new RevokeOtherSessionsUseCase(sessionRepository);
  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    credentialsRepository,
    options.emailSender,
    emailOptions,
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    credentialsRepository,
    options.passwordHasher,
  );

  return {
    registerController: new RegisterController(registerUseCase),
    verifyEmailController: new VerifyEmailController(verifyEmailUseCase, cookieOptions),
    resendEmailVerificationController: new ResendEmailVerificationController(
      resendEmailVerificationUseCase,
    ),
    verifyPhoneController: new VerifyPhoneController(verifyPhoneUseCase, cookieOptions),
    resendPhoneVerificationController: new ResendPhoneVerificationController(
      resendPhoneVerificationUseCase,
    ),
    loginController: new LoginController(loginUseCase, cookieOptions),
    refreshController: new RefreshController(refreshUseCase, cookieOptions),
    logoutController: new LogoutController(logoutUseCase, {
      secureCookies: cookieOptions.secureCookies,
    }),
    logoutAllController: new LogoutAllController(logoutAllUseCase, {
      secureCookies: cookieOptions.secureCookies,
    }),
    getMeController: new GetMeController(getMeUseCase),
    listSessionsController: new ListSessionsController(listSessionsUseCase),
    getSessionController: new GetSessionController(getSessionUseCase),
    revokeSessionController: new RevokeSessionController(revokeSessionUseCase, {
      secureCookies: cookieOptions.secureCookies,
    }),
    revokeOtherSessionsController: new RevokeOtherSessionsController(revokeOtherSessionsUseCase),
    forgotPasswordController: new ForgotPasswordController(forgotPasswordUseCase),
    resetPasswordController: new ResetPasswordController(resetPasswordUseCase, {
      secureCookies: cookieOptions.secureCookies,
    }),
    requireRefreshAuth,
    requireRefreshOrBearerAuth: createRequireRefreshOrBearerAuth(accessTokenSigner),
    requireBearerAuth: createRequireBearerAuth(accessTokenSigner),
    assertCsrfWhenRefreshCookie,
  };
}
