import type { RequestHandler } from "express";

import type { TEnv } from "@/config/env-schema";
import { Environment } from "@/config/environment";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { ForgotPasswordUseCase } from "@/modules/auth/application/use-cases/forgot-password.use-case";
import { GetMeUseCase } from "@/modules/auth/application/use-cases/get-me.use-case";
import { ListSessionsUseCase } from "@/modules/auth/application/use-cases/list-sessions.use-case";
import { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";
import { LogoutUseCase } from "@/modules/auth/application/use-cases/logout.use-case";
import { LogoutAllUseCase } from "@/modules/auth/application/use-cases/logout-all.use-case";
import { RefreshUseCase } from "@/modules/auth/application/use-cases/refresh.use-case";
import { RegisterUseCase } from "@/modules/auth/application/use-cases/register.use-case";
import { ResendEmailVerificationUseCase } from "@/modules/auth/application/use-cases/resend-email-verification.use-case";
import { ResendPhoneVerificationUseCase } from "@/modules/auth/application/use-cases/resend-phone-verification.use-case";
import { ResetPasswordUseCase } from "@/modules/auth/application/use-cases/reset-password.use-case";
import { VerifyEmailUseCase } from "@/modules/auth/application/use-cases/verify-email.use-case";
import { VerifyPhoneUseCase } from "@/modules/auth/application/use-cases/verify-phone.use-case";
import { PostgresAuthAccountRepository } from "@/modules/auth/infrastructure/repositories/postgres-auth-account.repository";
import { JoseAccessTokenSigner } from "@/modules/auth/infrastructure/security/jose-access-token.signer";
import { ForgotPasswordController } from "@/modules/auth/presentation/http/controllers/forgot-password.controller";
import { GetMeController } from "@/modules/auth/presentation/http/controllers/get-me.controller";
import { ListSessionsController } from "@/modules/auth/presentation/http/controllers/list-sessions.controller";
import { LoginController } from "@/modules/auth/presentation/http/controllers/login.controller";
import { LogoutController } from "@/modules/auth/presentation/http/controllers/logout.controller";
import { LogoutAllController } from "@/modules/auth/presentation/http/controllers/logout-all.controller";
import { RefreshController } from "@/modules/auth/presentation/http/controllers/refresh.controller";
import { RegisterController } from "@/modules/auth/presentation/http/controllers/register.controller";
import { ResendEmailVerificationController } from "@/modules/auth/presentation/http/controllers/resend-email-verification.controller";
import { ResendPhoneVerificationController } from "@/modules/auth/presentation/http/controllers/resend-phone-verification.controller";
import { ResetPasswordController } from "@/modules/auth/presentation/http/controllers/reset-password.controller";
import { VerifyEmailController } from "@/modules/auth/presentation/http/controllers/verify-email.controller";
import { VerifyPhoneController } from "@/modules/auth/presentation/http/controllers/verify-phone.controller";
import { assertCsrfWhenRefreshCookie } from "@/modules/auth/presentation/http/middleware/assert-csrf-when-refresh-cookie.middleware";
import { createRequireBearerAuth } from "@/modules/auth/presentation/http/middleware/require-bearer-auth.middleware";
import { requireRefreshAuth } from "@/modules/auth/presentation/http/middleware/require-refresh-auth.middleware";
import { createRequireRefreshOrBearerAuth } from "@/modules/auth/presentation/http/middleware/require-refresh-or-bearer-auth.middleware";
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
  forgotPasswordController: ForgotPasswordController;
  resetPasswordController: ResetPasswordController;
  requireRefreshAuth: RequestHandler;
  requireRefreshOrBearerAuth: RequestHandler;
  requireBearerAuth: RequestHandler;
  assertCsrfWhenRefreshCookie: RequestHandler;
};

export function createAuthModule(options: CreateAuthModuleOptions): AuthModule {
  const authAccountRepository = new PostgresAuthAccountRepository();
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
    authAccountRepository,
    options.passwordHasher,
    options.emailSender,
    emailOptions,
  );

  const verifyEmailUseCase = new VerifyEmailUseCase(
    authAccountRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendEmailVerificationUseCase = new ResendEmailVerificationUseCase(
    authAccountRepository,
    options.emailSender,
    emailOptions,
  );

  const verifyPhoneUseCase = new VerifyPhoneUseCase(
    authAccountRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const resendPhoneVerificationUseCase = new ResendPhoneVerificationUseCase(authAccountRepository);

  const loginUseCase = new LoginUseCase(
    authAccountRepository,
    options.passwordHasher,
    accessTokenSigner,
    sessionOptions,
  );

  const refreshUseCase = new RefreshUseCase(
    authAccountRepository,
    accessTokenSigner,
    sessionOptions,
  );

  const logoutUseCase = new LogoutUseCase(authAccountRepository);
  const logoutAllUseCase = new LogoutAllUseCase(authAccountRepository);
  const getMeUseCase = new GetMeUseCase(authAccountRepository);
  const listSessionsUseCase = new ListSessionsUseCase(authAccountRepository);
  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    authAccountRepository,
    options.emailSender,
    emailOptions,
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    authAccountRepository,
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
