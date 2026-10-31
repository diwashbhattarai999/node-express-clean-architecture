import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { AuthLoginIdentity } from "@/modules/auth/shared/application/types/auth.types";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type VerifyAddedEmailInput = {
  token: string;
  actorUserId?: string;
};

export class VerifyAddedEmailUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: VerifyAddedEmailInput): Promise<AuthLoginIdentity> {
    const token = input.token.trim();
    if (token.length === 0) {
      throw new TokenInvalidError("The email verification token is invalid.");
    }

    const result = await this.identityRepository.verifyAddedEmailByTokenHash(hashToken(token));

    switch (result.outcome) {
      case "invalid":
        throw new TokenInvalidError("The email verification token is invalid.");
      case "expired":
        throw new TokenExpiredError("The email verification token has expired.");
      case "verified":
        if (input.actorUserId && input.actorUserId !== result.userId) {
          throw new TokenInvalidError("This email verification token is not for your account.");
        }

        return result.identity;
    }
  }
}
