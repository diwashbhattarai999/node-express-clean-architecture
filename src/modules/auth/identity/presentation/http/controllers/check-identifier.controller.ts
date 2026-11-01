import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { CheckIdentifierUseCase } from "@/modules/auth/identity/application/use-cases/check-identifier.use-case";
import type { CheckIdentifierSchema } from "@/modules/auth/identity/presentation/http/validators/check-identifier.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class CheckIdentifierController {
  public constructor(private readonly checkIdentifierUseCase: CheckIdentifierUseCase) {}

  public async handle(req: ValidatedRequest<CheckIdentifierSchema>, res: Response): Promise<void> {
    const result = await this.checkIdentifierUseCase.execute({
      type: req.body.type,
      identifier: req.body.identifier,
    });

    sendSuccess(res, HttpStatus.OK, "Identifier availability checked.", result);
  }
}
