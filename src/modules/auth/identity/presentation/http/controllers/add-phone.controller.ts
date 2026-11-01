import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AddPhoneUseCase } from "@/modules/auth/identity/application/use-cases/add-phone.use-case";
import type { AddPhoneSchema } from "@/modules/auth/identity/presentation/http/validators/add-phone.validator";
import {
  type LoginIdentityResponse,
  toLoginIdentityResponse,
} from "@/modules/auth/shared/presentation/http/mappers/login-identity.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class AddPhoneController {
  public constructor(private readonly addPhoneUseCase: AddPhoneUseCase) {}

  public async handle(req: ValidatedRequest<AddPhoneSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const identity = await this.addPhoneUseCase.execute({
      userId,
      sessionId,
      phone: req.body.phone,
    });

    sendSuccess<LoginIdentityResponse>(
      res,
      HttpStatus.CREATED,
      "Phone added. Please verify it.",
      toLoginIdentityResponse(identity),
    );
  }
}
