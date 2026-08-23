import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import {
  toUserResponse,
  type UserResponse,
} from "@/modules/users/presentation/http/mappers/user.response";
import type { GetUserByIdSchema } from "@/modules/users/presentation/http/validators/user.schema";
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
