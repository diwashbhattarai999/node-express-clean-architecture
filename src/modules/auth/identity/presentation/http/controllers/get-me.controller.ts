import type { Request, Response } from "express";

import type { GetMeUseCase } from "@/modules/auth/identity/application/use-cases/get-me.use-case";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type GetMeResponseData = {
  user: UserPublicResponse;
  roles: string[];
  permissions: string[];
};

export class GetMeController {
  public constructor(private readonly getMeUseCase: GetMeUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

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
