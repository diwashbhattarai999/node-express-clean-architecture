import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyAddedEmailUseCase } from "@/modules/auth/identity/application/use-cases/verify-added-email.use-case";
import type { VerifyAddedEmailSchema } from "@/modules/auth/identity/presentation/http/validators/verify-added-email.validator";
import {
  type LoginIdentityResponse,
  toLoginIdentityResponse,
} from "@/modules/auth/shared/presentation/http/mappers/login-identity.response";
import { getAuthContext } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class VerifyAddedEmailController {
  public constructor(private readonly verifyAddedEmailUseCase: VerifyAddedEmailUseCase) {}

  public async handle(req: ValidatedRequest<VerifyAddedEmailSchema>, res: Response): Promise<void> {
    const actorUserId = getAuthContext(req)?.bearer?.userId;
    const identity = await this.verifyAddedEmailUseCase.execute({
      token: req.body.token,
      ...(actorUserId ? { actorUserId } : {}),
    });

    sendSuccess<LoginIdentityResponse>(
      res,
      HttpStatus.OK,
      "Email verified.",
      toLoginIdentityResponse(identity),
    );
  }
}
