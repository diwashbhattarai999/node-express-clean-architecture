import type { TEnv } from "@/config/env-schema";
import { Environment } from "@/config/environment";
import { type AuditModule, createAuditModule } from "@/modules/auth/audit/audit.module";
import {
  type AuthorizationModule,
  createAuthorizationModule,
} from "@/modules/auth/authorization/authorization.module";
import {
  type CredentialsModule,
  createCredentialsModule,
} from "@/modules/auth/credentials/credentials.module";
import { PostgresCredentialsRepository } from "@/modules/auth/credentials/infrastructure/repositories/postgres-credentials.repository";
import { createIdentityModule, type IdentityModule } from "@/modules/auth/identity/identity.module";
import { PostgresIdentityRepository } from "@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository";
import { PostgresMfaRepository } from "@/modules/auth/mfa/infrastructure/repositories/postgres-mfa.repository";
import { AesGcmSecretEncryptor } from "@/modules/auth/mfa/infrastructure/security/aes-gcm-secret.encryptor";
import { Rfc6238TotpService } from "@/modules/auth/mfa/infrastructure/security/rfc6238-totp.service";
import { createMfaModule, type MfaModule } from "@/modules/auth/mfa/mfa.module";
import { createOAuthModule, type OAuthModule } from "@/modules/auth/oauth/oauth.module";
import { PostgresPasskeyRepository } from "@/modules/auth/passkeys/infrastructure/repositories/postgres-passkey.repository";
import { SimpleWebAuthnService } from "@/modules/auth/passkeys/infrastructure/webauthn/simple-webauthn.service";
import { createPasskeysModule, type PasskeysModule } from "@/modules/auth/passkeys/passkeys.module";
import { PostgresSessionRepository } from "@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository";
import { createSessionsModule, type SessionsModule } from "@/modules/auth/sessions/sessions.module";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { JoseAccessTokenSigner } from "@/modules/auth/shared/infrastructure/security/jose-access-token.signer";
import {
  type AuthHttpGuards,
  createAuthHttpGuards,
} from "@/modules/auth/shared/presentation/http/auth-http-guards";
import { PostgresStepUpRepository } from "@/modules/auth/step-up/infrastructure/repositories/postgres-step-up.repository";
import { JoseStepUpTokenSigner } from "@/modules/auth/step-up/infrastructure/security/jose-step-up-token.signer";
import { createStepUpModule, type StepUpModule } from "@/modules/auth/step-up/step-up.module";
import {
  createVerificationModule,
  type VerificationModule,
} from "@/modules/auth/verification/verification.module";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import type { IHttpClient } from "@/shared/http-client/http-client.port";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

export type CreateAuthModuleOptions = {
  emailSender: IEmailSender;
  passwordHasher: IPasswordHasher;
  accessTokenSigner?: IAccessTokenSigner;
  httpClient: IHttpClient;
  jobQueue: IJobQueue;
  objectStorage: IObjectStorage;
  env: TEnv;
};

export type AuthModule = IdentityModule &
  CredentialsModule &
  VerificationModule &
  SessionsModule &
  OAuthModule &
  AuthorizationModule &
  AuditModule &
  MfaModule &
  PasskeysModule &
  StepUpModule &
  AuthHttpGuards;

export function createAuthModule(options: CreateAuthModuleOptions): AuthModule {
  const credentialsRepository = new PostgresCredentialsRepository();
  const identityRepository = new PostgresIdentityRepository();
  const sessionRepository = new PostgresSessionRepository();
  const mfaRepository = new PostgresMfaRepository();
  const totpService = new Rfc6238TotpService();
  const secretEncryptor = new AesGcmSecretEncryptor(
    options.env.AUTH_MFA_ENCRYPTION_KEY ?? options.env.AUTH_JWT_SECRET,
  );

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

  const frontendOrigin = new URL(options.env.FRONTEND_BASE_URL).origin;
  const webAuthnOrigins = [...new Set([frontendOrigin, ...options.env.CORS_ORIGINS])];
  const passkeyRepository = new PostgresPasskeyRepository();
  const webAuthnService = new SimpleWebAuthnService({
    rpID: new URL(options.env.FRONTEND_BASE_URL).hostname,
    rpName: options.env.APP_NAME,
    origin: webAuthnOrigins.length === 1 ? (webAuthnOrigins[0] ?? frontendOrigin) : webAuthnOrigins,
  });
  const passkeysModule = createPasskeysModule({
    passkeyRepository,
    identityRepository,
    sessionRepository,
    accessTokenSigner,
    webAuthnService,
    sessionOptions,
    cookieOptions,
  });

  const mfaModule = createMfaModule({
    mfaRepository,
    identityRepository,
    credentialsRepository,
    sessionRepository,
    passwordHasher: options.passwordHasher,
    accessTokenSigner,
    totpService,
    secretEncryptor,
    emailSender: options.emailSender,
    emailOptions,
    sessionOptions,
    cookieOptions,
  });

  const stepUpModule = createStepUpModule({
    stepUpRepository: new PostgresStepUpRepository(),
    stepUpTokenSigner: new JoseStepUpTokenSigner({
      secret: options.env.AUTH_JWT_SECRET,
      issuer: options.env.AUTH_JWT_ISSUER,
      audience: options.env.AUTH_JWT_AUDIENCE,
      expiresInSeconds: options.env.AUTH_STEP_UP_TOKEN_TTL_SECONDS,
    }),
    credentialsRepository,
    passwordHasher: options.passwordHasher,
    mfaRepository,
    totpService,
    secretEncryptor,
    passkeyRepository,
    webAuthnService,
    emailSender: options.emailSender,
    emailOptions,
  });

  return {
    ...createIdentityModule({
      identityRepository,
      credentialsRepository,
      sessionRepository,
      passwordHasher: options.passwordHasher,
      emailSender: options.emailSender,
      jobQueue: options.jobQueue,
      emailOptions,
      accountDeletionGraceDays: options.env.AUTH_ACCOUNT_DELETION_GRACE_DAYS,
    }),
    ...createCredentialsModule({
      identityRepository,
      credentialsRepository,
      sessionRepository,
      passwordHasher: options.passwordHasher,
      accessTokenSigner,
      mfaSignInGuard: mfaModule.mfaSignInGuard,
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
      identityRepository,
      sessionRepository,
      accessTokenSigner,
      sessionOptions,
      cookieOptions,
    }),
    ...createOAuthModule({
      env: options.env,
      httpClient: options.httpClient,
      identityRepository,
      sessionRepository,
      accessTokenSigner,
      mfaSignInGuard: mfaModule.mfaSignInGuard,
      sessionOptions,
      cookieOptions,
    }),
    ...createAuthorizationModule({
      identityRepository,
    }),
    ...createAuditModule({
      identityRepository,
      jobQueue: options.jobQueue,
      objectStorage: options.objectStorage,
    }),
    ...mfaModule,
    ...passkeysModule,
    ...stepUpModule,
    ...createAuthHttpGuards(accessTokenSigner),
  };
}
