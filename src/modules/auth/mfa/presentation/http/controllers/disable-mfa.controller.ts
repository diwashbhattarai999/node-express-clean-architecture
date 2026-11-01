import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DisableMfaUseCase } from "@/modules/auth/mfa/application/use-cases/disable-mfa.use-case";
import type { DisableMfaSchema } from "@/modules/auth/mfa/presentation/http/validators/disable-mfa.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class DisableMfaController {
  public constructor(private readonly disableMfaUseCase: DisableMfaUseCase) {}

  public async handle(req: ValidatedRequest<DisableMfaSchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    await this.disableMfaUseCase.execute(userId, req.body);

    sendSuccess(res, HttpStatus.OK, "MFA disabled.", null);
  }
}
