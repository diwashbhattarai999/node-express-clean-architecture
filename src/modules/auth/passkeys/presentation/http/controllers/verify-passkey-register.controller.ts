import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyPasskeyRegisterUseCase } from "@/modules/auth/passkeys/application/use-cases/verify-passkey-register.use-case";
import {
  type PasskeyCreatedResponse,
  toPasskeyCreatedResponse,
} from "@/modules/auth/passkeys/presentation/http/mappers/passkey.response";
import type { VerifyPasskeyRegisterSchema } from "@/modules/auth/passkeys/presentation/http/validators/verify-passkey-register.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class VerifyPasskeyRegisterController {
  public constructor(private readonly verifyPasskeyRegisterUseCase: VerifyPasskeyRegisterUseCase) {}

  public async handle(
    req: ValidatedRequest<VerifyPasskeyRegisterSchema>,
    res: Response,
  ): Promise<void> {
    const { userId } = getBearerAuth(req);
    const passkey = await this.verifyPasskeyRegisterUseCase.execute(userId, req.body);

    sendSuccess<PasskeyCreatedResponse>(
      res,
      HttpStatus.CREATED,
      "Passkey registered.",
      toPasskeyCreatedResponse(passkey),
    );
  }
}
