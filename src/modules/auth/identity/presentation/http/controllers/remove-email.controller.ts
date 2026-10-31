import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RemoveEmailUseCase } from "@/modules/auth/identity/application/use-cases/remove-email.use-case";
import type { RemoveEmailSchema } from "@/modules/auth/identity/presentation/http/validators/remove-email.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RemoveEmailController {
  public constructor(private readonly removeEmailUseCase: RemoveEmailUseCase) {}

  public async handle(req: ValidatedRequest<RemoveEmailSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.removeEmailUseCase.execute({
      userId,
      sessionId,
      identityId: req.params.identityId,
    });

    sendSuccess(res, HttpStatus.OK, "Email removed.", null);
  }
}
