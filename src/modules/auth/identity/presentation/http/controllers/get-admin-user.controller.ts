import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import {
  type RoleResponse,
  toRoleResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { GetAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/get-admin-user.use-case";
import type { AdminUserIdSchema } from "@/modules/auth/identity/presentation/http/validators/admin-user-id.validator";
import {
  type LoginIdentityResponse,
  toLoginIdentityResponseList,
} from "@/modules/auth/shared/presentation/http/mappers/login-identity.response";
import {
  toUserProfileResponse,
  type UserProfileResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-profile.response";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type GetAdminUserResponseData = {
  user: UserPublicResponse;
  profile: UserProfileResponse;
  roles: RoleResponse[];
  identities: LoginIdentityResponse[];
};

export class GetAdminUserController {
  public constructor(private readonly getAdminUserUseCase: GetAdminUserUseCase) {}

  public async handle(req: ValidatedRequest<AdminUserIdSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.getAdminUserUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess<GetAdminUserResponseData>(res, HttpStatus.OK, "User retrieved.", {
      user: toUserPublicResponse(result.user),
      profile: toUserProfileResponse(result.profile),
      roles: toRoleResponseList(result.roles),
      identities: toLoginIdentityResponseList(result.identities),
    });
  }
}
