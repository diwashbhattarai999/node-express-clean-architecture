import type { Request, Response } from "express";

import type { GetOwnProfileUseCase } from "@/modules/auth/identity/application/use-cases/get-own-profile.use-case";
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

export type GetOwnProfileResponseData = {
  user: UserPublicResponse;
  profile: UserProfileResponse;
};

export class GetOwnProfileController {
  public constructor(private readonly getOwnProfileUseCase: GetOwnProfileUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.getOwnProfileUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<GetOwnProfileResponseData>(res, HttpStatus.OK, "Profile loaded.", {
      user: toUserPublicResponse(result.user),
      profile: toUserProfileResponse(result.profile),
    });
  }
}
