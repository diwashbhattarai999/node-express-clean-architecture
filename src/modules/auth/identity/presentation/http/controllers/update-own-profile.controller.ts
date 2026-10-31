import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { pickDefinedProfileFields } from "@/modules/auth/identity/application/dto/update-own-profile.dto";
import type { UpdateOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/update-own-profile.use-case";
import type { UpdateOwnProfileSchema } from "@/modules/auth/identity/presentation/http/validators/update-own-profile.validator";
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

export type UpdateOwnProfileResponseData = {
  user: UserPublicResponse;
  profile: UserProfileResponse;
};

export class UpdateOwnProfileController {
  public constructor(private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase) {}

  public async handle(req: ValidatedRequest<UpdateOwnProfileSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.updateOwnProfileUseCase.execute({
      userId,
      sessionId,
      ...pickDefinedProfileFields(req.body),
    });

    sendSuccess<UpdateOwnProfileResponseData>(res, HttpStatus.OK, "Profile updated.", {
      user: toUserPublicResponse(result.user),
      profile: toUserProfileResponse(result.profile),
    });
  }
}
