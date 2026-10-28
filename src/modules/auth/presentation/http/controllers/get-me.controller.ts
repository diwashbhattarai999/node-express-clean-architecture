import type { Response } from "express";

import type { GetMeUseCase } from "@/modules/auth/application/use-cases/get-me.use-case";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/presentation/http/mappers/user-public.response";
import type { RequestWithBearerAuth } from "@/modules/auth/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type GetMeResponseData = {
  user: UserPublicResponse;
  roles: string[];
  permissions: string[];
};

export class GetMeController {
  public constructor(private readonly getMeUseCase: GetMeUseCase) {}

  public async handle(req: RequestWithBearerAuth, res: Response): Promise<void> {
    const { userId, sessionId } = req.auth.bearer;

    const result = await this.getMeUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<GetMeResponseData>(res, HttpStatus.OK, "Authenticated user.", {
      user: toUserPublicResponse(result.user),
      roles: result.roles,
      permissions: result.permissions,
    });
  }
}
