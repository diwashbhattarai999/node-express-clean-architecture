import type { TEnv } from "@/config/env-schema";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { RegisterUseCase } from "@/modules/auth/application/use-cases/register.use-case";
import { PostgresAuthAccountRepository } from "@/modules/auth/infrastructure/repositories/postgres-auth-account.repository";
import { RegisterController } from "@/modules/auth/presentation/http/controllers/register.controller";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export type CreateAuthModuleOptions = {
  emailSender: IEmailSender;
  passwordHasher: IPasswordHasher;
  env: Pick<TEnv, "BASE_URL">;
};

export function createAuthModule(options: CreateAuthModuleOptions) {
  const authAccountRepository = new PostgresAuthAccountRepository();

  const registerUseCase = new RegisterUseCase(
    authAccountRepository,
    options.passwordHasher,
    options.emailSender,
    { appBaseUrl: options.env.BASE_URL },
  );

  return {
    registerController: new RegisterController(registerUseCase),
  };
}
