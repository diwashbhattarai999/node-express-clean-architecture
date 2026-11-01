import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RemovePhoneUseCase } from "@/modules/auth/identity/application/use-cases/remove-phone.use-case";
import type { RemovePhoneSchema } from "@/modules/auth/identity/presentation/http/validators/remove-phone.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RemovePhoneController {
  public constructor(private readonly removePhoneUseCase: RemovePhoneUseCase) {}

  public async handle(req: ValidatedRequest<RemovePhoneSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.removePhoneUseCase.execute({
      userId,
      sessionId,
      identityId: req.params.identityId,
    });

    sendSuccess(res, HttpStatus.OK, "Phone removed.", null);
  }
}
