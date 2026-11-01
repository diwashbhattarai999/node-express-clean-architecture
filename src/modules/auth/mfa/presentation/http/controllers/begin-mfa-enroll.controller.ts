import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { BeginMfaEnrollUseCase } from "@/modules/auth/mfa/application/use-cases/begin-mfa-enroll.use-case";
import type { BeginMfaEnrollSchema } from "@/modules/auth/mfa/presentation/http/validators/begin-mfa-enroll.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type BeginMfaEnrollResponseData = {
  factorId: string;
  secret?: string;
  otpauthUrl?: string;
};

export class BeginMfaEnrollController {
  public constructor(private readonly beginMfaEnrollUseCase: BeginMfaEnrollUseCase) {}

  public async handle(req: ValidatedRequest<BeginMfaEnrollSchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.beginMfaEnrollUseCase.execute(userId, req.body);

    sendSuccess<BeginMfaEnrollResponseData>(res, HttpStatus.OK, "MFA enrollment started.", {
      factorId: result.factorId,
      ...(result.secret !== undefined ? { secret: result.secret } : {}),
      ...(result.otpauthUrl !== undefined ? { otpauthUrl: result.otpauthUrl } : {}),
    });
  }
}
