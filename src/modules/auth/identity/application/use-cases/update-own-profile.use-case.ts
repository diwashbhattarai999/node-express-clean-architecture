import {
  pickDefinedProfileFields,
  type UpdateOwnProfileDto,
} from "@/modules/auth/identity/application/dto/update-own-profile.dto";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthUser, AuthUserProfile } from "@/modules/auth/shared/application/types/auth.types";

export type UpdateOwnProfileInput = UpdateOwnProfileDto & {
  userId: string;
  sessionId: string;
};

export type UpdateOwnProfileResult = {
  user: AuthUser;
  profile: AuthUserProfile;
};

export class UpdateOwnProfileUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: UpdateOwnProfileInput): Promise<UpdateOwnProfileResult> {
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

    return this.identityRepository.updateOwnProfile({
      userId: input.userId,
      ...pickDefinedProfileFields(input),
    });
  }
}
