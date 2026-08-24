import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { UpdateUserUseCase } from "@/modules/users/application/use-cases/update-user.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

import { toUserResponse, type UserResponse } from "../mappers/user.response";
import type { UpdateUserSchema } from "../validators/update-user.validator";

export class UpdateUserController {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  async handle(req: ValidatedRequest<UpdateUserSchema>, res: Response): Promise<void> {
    const user = await this.updateUserUseCase.execute(req.params.id, req.body);

    sendSuccess<UserResponse>(
      res,
      HttpStatus.OK,
      "User updated successfully.",
      toUserResponse(user),
    );
  }
}
