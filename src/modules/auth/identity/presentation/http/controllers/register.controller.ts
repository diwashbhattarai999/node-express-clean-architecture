import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RegisterUseCase } from "@/modules/auth/identity/application/use-cases/register.use-case";
import type { RegisterSchema } from "@/modules/auth/identity/presentation/http/validators/register.validator";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RegisterController {
  public constructor(private readonly registerUseCase: RegisterUseCase) {}

  public async handle(req: ValidatedRequest<RegisterSchema>, res: Response): Promise<void> {
    const account = await this.registerUseCase.execute(req.body);

    sendSuccess<{ user: UserPublicResponse }>(
      res,
      HttpStatus.CREATED,
      "Account registered. Please verify your identity to activate the account.",
      { user: toUserPublicResponse(account) },
    );
  }
}
