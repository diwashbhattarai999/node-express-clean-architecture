import type { Request, Response } from "express";

import type { RegenerateMfaRecoveryCodesUseCase } from "@/modules/auth/mfa/application/use-cases/regenerate-mfa-recovery-codes.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RegenerateMfaRecoveryCodesResponseData = {
  recoveryCodes: string[];
};

export class RegenerateMfaRecoveryCodesController {
  public constructor(
    private readonly regenerateMfaRecoveryCodesUseCase: RegenerateMfaRecoveryCodesUseCase,
  ) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.regenerateMfaRecoveryCodesUseCase.execute(userId);

    sendSuccess<RegenerateMfaRecoveryCodesResponseData>(
      res,
      HttpStatus.OK,
      "Recovery codes regenerated. Store them; they will not be shown again.",
      { recoveryCodes: result.recoveryCodes },
    );
  }
}
