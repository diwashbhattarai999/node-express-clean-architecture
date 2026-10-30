import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ChangeUsernameUseCase } from "@/modules/auth/identity/application/use-cases/change-username.use-case";
import type { ChangeUsernameSchema } from "@/modules/auth/identity/presentation/http/validators/change-username.validator";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ChangeUsernameResponseData = {
  user: UserPublicResponse;
};

export class ChangeUsernameController {
  public constructor(private readonly changeUsernameUseCase: ChangeUsernameUseCase) {}

  public async handle(req: ValidatedRequest<ChangeUsernameSchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);

    const result = await this.changeUsernameUseCase.execute({
      userId,
      username: req.body.username,
    });

    sendSuccess<ChangeUsernameResponseData>(res, HttpStatus.OK, "Username updated.", {
      user: toUserPublicResponse(result.user),
    });
  }
}
