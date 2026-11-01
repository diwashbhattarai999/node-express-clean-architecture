import { PermissionKey } from "@/modules/auth/authorization/application/constants/permission-keys";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import {
  pickDefinedProfileFields,
  type UpdateOwnProfileDto,
} from "@/modules/auth/identity/application/dto/update-own-profile.dto";
import { UserNotFoundError } from "@/modules/auth/identity/application/errors/user-not-found.error";
import type {
  IIdentityRepository,
  UpdateOwnProfileResult,
} from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

export type UpdateAdminUserInput = UpdateOwnProfileDto & {
  userId: string;
  sessionId: string;
  targetUserId: string;
};

export class UpdateAdminUserUseCase {
  public constructor(
    private readonly identityRepository: Pick<
      IIdentityRepository,
      "findAuthenticatedPrincipal" | "existsById" | "updateOwnProfile"
    >,
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  public async execute(input: UpdateAdminUserInput): Promise<UpdateOwnProfileResult> {
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

    return this.identityRepository.updateOwnProfile({
      userId: input.targetUserId,
      ...pickDefinedProfileFields(input),
    });
  }
}
