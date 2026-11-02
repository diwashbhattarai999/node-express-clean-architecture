import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { BeginPasskeyLoginUseCase } from "@/modules/auth/passkeys/application/use-cases/begin-passkey-login.use-case";
import type { BeginPasskeyLoginSchema } from "@/modules/auth/passkeys/presentation/http/validators/begin-passkey-login.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class BeginPasskeyLoginController {
  public constructor(private readonly beginPasskeyLoginUseCase: BeginPasskeyLoginUseCase) {}

  public async handle(
    req: ValidatedRequest<BeginPasskeyLoginSchema>,
    res: Response,
  ): Promise<void> {
    const options = await this.beginPasskeyLoginUseCase.execute(req.body);

    sendSuccess<Record<string, unknown>>(
      res,
      HttpStatus.OK,
      "Passkey login options created.",
      options,
    );
  }
}
