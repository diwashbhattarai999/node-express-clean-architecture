import type { TEnv } from "@/config/env-schema";
import { Environment } from "@/config/environment";
import {
  type CredentialsModule,
  createCredentialsModule,
} from "@/modules/auth/credentials/credentials.module";
import { PostgresCredentialsRepository } from "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository";
import { createIdentityModule, type IdentityModule } from "@/modules/auth/identity/identity.module";
import { createOAuthModule, type OAuthModule } from "@/modules/auth/oauth/oauth.module";
import { PostgresSessionRepository } from "@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository";
import { createSessionsModule, type SessionsModule } from "@/modules/auth/sessions/sessions.module";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { JoseAccessTokenSigner } from "@/modules/auth/shared/infrastructure/security/jose-access-token.signer";
import {
  type AuthHttpGuards,
  createAuthHttpGuards,
} from "@/modules/auth/shared/presentation/http/auth-http-guards";
import {
  createVerificationModule,
  type VerificationModule,
} from "@/modules/auth/verification/verification.module";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import type { IHttpClient } from "@/shared/http-client/http-client.port";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

export type CreateAuthModuleOptions = {
  emailSender: IEmailSender;
  passwordHasher: IPasswordHasher;
  accessTokenSigner?: IAccessTokenSigner;
  httpClient: IHttpClient;
  jobQueue: IJobQueue;
  env: TEnv;
};

export type AuthModule = IdentityModule &
  CredentialsModule &
  VerificationModule &
  SessionsModule &
  OAuthModule &
  AuthHttpGuards;

export function createAuthModule(options: CreateAuthModuleOptions): AuthModule {
  const credentialsRepository = new PostgresCredentialsRepository();
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

  return {
    ...createIdentityModule({
      credentialsRepository,
      passwordHasher: options.passwordHasher,
      emailSender: options.emailSender,
      jobQueue: options.jobQueue,
      emailOptions,
      accountDeletionGraceDays: options.env.AUTH_ACCOUNT_DELETION_GRACE_DAYS,
    }),
    ...createCredentialsModule({
      credentialsRepository,
      sessionRepository,
      passwordHasher: options.passwordHasher,
      accessTokenSigner,
      emailSender: options.emailSender,
      emailOptions,
      sessionOptions,
      cookieOptions,
    }),
    ...createVerificationModule({
      accessTokenSigner,
      emailSender: options.emailSender,
      emailOptions,
      sessionOptions,
      cookieOptions,
    }),
    ...createSessionsModule({
      sessionRepository,
      accessTokenSigner,
      sessionOptions,
      cookieOptions,
    }),
    ...createOAuthModule({
      env: options.env,
      httpClient: options.httpClient,
      sessionRepository,
      accessTokenSigner,
      sessionOptions,
      cookieOptions,
    }),
    ...createAuthHttpGuards(accessTokenSigner),
  };
}
