import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import { PASSWORD_RESET_TTL_MS } from "@/modules/auth/credentials/application/constants/password-reset";
import { buildPasswordResetMessage } from "@/modules/auth/credentials/application/emails/password-reset.message";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { generatePasswordResetToken } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type AdminPasswordResetInput = {
  userId: string;
  sessionId: string;
  targetUserId: string;
};

export type AdminPasswordResetUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

export class AdminPasswordResetUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "existsById"
    >,
    private readonly permissionRepository: IPermissionRepository,
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: AdminPasswordResetUseCaseOptions,
  ) {}

  public async execute(input: AdminPasswordResetInput): Promise<void> {
    const principal = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (principal.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        break;
    }

    const allowed = await this.permissionRepository.hasKeyForUser(
      input.userId,
      PermissionKey.USERS_UPDATE,
    );

    if (!allowed) {
      throw new PermissionDeniedError();
    }

    const exists = await this.identityRepository.existsById(input.targetUserId);

    if (!exists) {
      throw new UserNotFoundError();
    }

    const target = await this.credentialsRepository.findPasswordResetTargetByUserId(
      input.targetUserId,
    );

    if (!target) {
      return;
    }

    const rawToken = generatePasswordResetToken();

    await this.credentialsRepository.replacePasswordResetToken({
      userId: target.userId,
      identityId: target.identityId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    try {
      await this.emailSender.send(
        buildPasswordResetMessage({
          email: target.email,
          token: rawToken,
          frontendBaseUrl: this.options.frontendBaseUrl,
          brandName: this.options.brandName,
        }),
      );
    } catch (error) {
      logger.warn(
        { err: error, userId: target.userId },
        "Failed to send admin password-reset email; token was rotated",
      );
    }
  }
}
