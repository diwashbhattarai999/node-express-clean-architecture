import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { pickDefinedProfileFields } from "@/modules/auth/identity/application/dto/update-own-profile.dto";
import type { UpdateAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/update-admin-user.use-case";
import type { UpdateAdminUserSchema } from "@/modules/auth/identity/presentation/http/validators/update-admin-user.validator";
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

export type UpdateAdminUserResponseData = {
  user: UserPublicResponse;
  profile: UserProfileResponse;
};

export class UpdateAdminUserController {
  public constructor(private readonly updateAdminUserUseCase: UpdateAdminUserUseCase) {}

  public async handle(req: ValidatedRequest<UpdateAdminUserSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.updateAdminUserUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
      ...pickDefinedProfileFields(req.body),
    });

    sendSuccess<UpdateAdminUserResponseData>(res, HttpStatus.OK, "User updated.", {
      user: toUserPublicResponse(result.user),
      profile: toUserProfileResponse(result.profile),
    });
  }
}
