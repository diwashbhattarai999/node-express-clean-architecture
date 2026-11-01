import { PostgresPermissionRepository } from "@/modules/auth/authorization/infrastructure/repositories/postgres-permission.repository";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { AdminPasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/admin-password-reset.use-case";
import { ChangePasswordUseCase } from "@/modules/auth/credentials/application/use-cases/change-password.use-case";
import { ConsumeMagicLinkUseCase } from "@/modules/auth/credentials/application/use-cases/consume-magic-link.use-case";
import { ForgotPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/forgot-password.use-case";
import { LoginUseCase } from "@/modules/auth/credentials/application/use-cases/login.use-case";
import { RequestMagicLinkUseCase } from "@/modules/auth/credentials/application/use-cases/request-magic-link.use-case";
import { ResetPasswordUseCase } from "@/modules/auth/credentials/application/use-cases/reset-password.use-case";
import { ValidatePasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/validate-password-reset.use-case";
import { AdminPasswordResetController } from "@/modules/auth/credentials/presentation/http/controllers/admin-password-reset.controller";
import { ChangePasswordController } from "@/modules/auth/credentials/presentation/http/controllers/change-password.controller";
import { ConsumeMagicLinkController } from "@/modules/auth/credentials/presentation/http/controllers/consume-magic-link.controller";
import { ForgotPasswordController } from "@/modules/auth/credentials/presentation/http/controllers/forgot-password.controller";
import { LoginController } from "@/modules/auth/credentials/presentation/http/controllers/login.controller";
import { RequestMagicLinkController } from "@/modules/auth/credentials/presentation/http/controllers/request-magic-link.controller";
import { ResetPasswordController } from "@/modules/auth/credentials/presentation/http/controllers/reset-password.controller";
import { ValidatePasswordResetController } from "@/modules/auth/credentials/presentation/http/controllers/validate-password-reset.controller";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type {
  AuthCookieOptions,
  AuthEmailOptions,
  AuthSessionOptions,
} from "@/modules/auth/shared/application/types/auth-composition";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateCredentialsModuleOptions = {
  identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal" | "existsById">;
  credentialsRepository: ICredentialsRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  accessTokenSigner: IAccessTokenSigner;
  emailSender: IEmailSender;
  emailOptions: AuthEmailOptions;
  sessionOptions: AuthSessionOptions;
  cookieOptions: AuthCookieOptions;
};

export type CredentialsModule = {
  loginController: LoginController;
  requestMagicLinkController: RequestMagicLinkController;
  consumeMagicLinkController: ConsumeMagicLinkController;
  forgotPasswordController: ForgotPasswordController;
  validatePasswordResetController: ValidatePasswordResetController;
  resetPasswordController: ResetPasswordController;
  changePasswordController: ChangePasswordController;
  adminPasswordResetController: AdminPasswordResetController;
};

export function createCredentialsModule(
  options: CreateCredentialsModuleOptions,
): CredentialsModule {
  const permissionRepository = new PostgresPermissionRepository();

  return {
    loginController: new LoginController(
      new LoginUseCase(
        options.credentialsRepository,
        options.sessionRepository,
        options.passwordHasher,
        options.accessTokenSigner,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    requestMagicLinkController: new RequestMagicLinkController(
      new RequestMagicLinkUseCase(
        options.credentialsRepository,
        options.emailSender,
        options.emailOptions,
      ),
    ),
    consumeMagicLinkController: new ConsumeMagicLinkController(
      new ConsumeMagicLinkUseCase(
        options.credentialsRepository,
        options.accessTokenSigner,
        options.sessionOptions,
      ),
      options.cookieOptions,
    ),
    forgotPasswordController: new ForgotPasswordController(
      new ForgotPasswordUseCase(
        options.credentialsRepository,
        options.emailSender,
        options.emailOptions,
      ),
    ),
    validatePasswordResetController: new ValidatePasswordResetController(
      new ValidatePasswordResetUseCase(options.credentialsRepository),
    ),
    resetPasswordController: new ResetPasswordController(
      new ResetPasswordUseCase(options.credentialsRepository, options.passwordHasher),
      { secureCookies: options.cookieOptions.secureCookies },
    ),
    changePasswordController: new ChangePasswordController(
      new ChangePasswordUseCase(options.credentialsRepository, options.passwordHasher),
    ),
    adminPasswordResetController: new AdminPasswordResetController(
      new AdminPasswordResetUseCase(
        options.identityRepository,
        permissionRepository,
        options.credentialsRepository,
        options.emailSender,
        options.emailOptions,
      ),
    ),
  };
}
