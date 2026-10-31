import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AddEmailUseCase } from "@/modules/auth/identity/application/use-cases/add-email.use-case";
import type { AddEmailSchema } from "@/modules/auth/identity/presentation/http/validators/add-email.validator";
import {
  type LoginIdentityResponse,
  toLoginIdentityResponse,
} from "@/modules/auth/shared/presentation/http/mappers/login-identity.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class AddEmailController {
  public constructor(private readonly addEmailUseCase: AddEmailUseCase) {}

  public async handle(req: ValidatedRequest<AddEmailSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const identity = await this.addEmailUseCase.execute({
      userId,
      sessionId,
      email: req.body.email,
    });

    sendSuccess<LoginIdentityResponse>(
      res,
      HttpStatus.CREATED,
      "Email added. Please verify it.",
      toLoginIdentityResponse(identity),
    );
  }
}
