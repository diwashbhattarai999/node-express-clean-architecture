import type { AddEmailDto } from "@/modules/auth/identity/application/dto/add-email.dto";
import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthLoginIdentity } from "@/modules/auth/shared/application/types/auth.types";
import { generateEmailVerificationToken } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { EMAIL_VERIFICATION_TTL_MS } from "@/modules/auth/verification/application/constants/email-verification";
import { buildEmailVerificationMessage } from "@/modules/auth/verification/application/emails/email-verification.message";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type AddEmailUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

export type AddEmailInput = AddEmailDto & {
  userId: string;
  sessionId: string;
};

export class AddEmailUseCase {
  public constructor(
    private readonly identityRepository: IIdentityRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: AddEmailUseCaseOptions,
  ) {}

  public async execute(input: AddEmailInput): Promise<AuthLoginIdentity> {
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

    const email = input.email.trim().toLowerCase();
    const existing = await this.identityRepository.findIdentityByNormalized("email", email);

    if (existing) {
      throw new IdentityAlreadyExistsError();
    }

    const rawToken = generateEmailVerificationToken();
    const identity = await this.identityRepository.addEmailIdentity({
      userId: input.userId,
      identifier: email,
      normalizedIdentifier: email,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    try {
      await this.emailSender.send(
        buildEmailVerificationMessage({
          email,
          token: rawToken,
          frontendBaseUrl: this.options.frontendBaseUrl,
          brandName: this.options.brandName,
        }),
      );
    } catch (error) {
      logger.warn(
        { err: error, userId: input.userId, identityId: identity.id },
        "Failed to send add-email verification; identity was created",
      );
    }

    return identity;
  }
}
