import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import type { GetUserByIdSchema } from "@/modules/users/presentation/http/schemas/user.schema";
import { toUserResponse, type UserResponse } from "@/modules/users/presentation/http/user.response";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class GetUserByIdController {
  constructor(private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  async handle(req: ValidatedRequest<GetUserByIdSchema>, res: Response): Promise<void> {
    const user = await this.getUserByIdUseCase.execute(req.params.id);

    sendSuccess<UserResponse>(
      res,
      HttpStatus.OK,
      "User retrieved successfully.",
      toUserResponse(user),
    );
  }
}
