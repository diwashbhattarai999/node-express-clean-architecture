import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import {
  toUserResponse,
  type UserResponse,
} from "@/modules/users/presentation/http/mappers/user.response";
import type { CreateUserSchema } from "@/modules/users/presentation/http/validators/user.schema";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class CreateUserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async handle(req: ValidatedRequest<CreateUserSchema>, res: Response): Promise<void> {
    const user = await this.createUserUseCase.execute(req.body);

    sendSuccess<UserResponse>(
      res,
      HttpStatus.CREATED,
      "User created successfully.",
      toUserResponse(user),
    );
  }
}
