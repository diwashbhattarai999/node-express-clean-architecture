import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DeleteUserUseCase } from "@/modules/users/application/use-cases/delete-user.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

import type { DeleteUserSchema } from "../validators/delete-user.validator";

export class DeleteUserController {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {}

  async handle(req: ValidatedRequest<DeleteUserSchema>, res: Response): Promise<void> {
    await this.deleteUserUseCase.execute(req.params.id);

    sendSuccess<null>(res, HttpStatus.OK, "User deleted successfully.", null);
  }
}
