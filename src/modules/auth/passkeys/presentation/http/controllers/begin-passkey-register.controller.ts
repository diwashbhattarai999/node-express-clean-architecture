import type { Request, Response } from "express";

import type { BeginPasskeyRegisterUseCase } from "@/modules/auth/passkeys/application/use-cases/begin-passkey-register.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class BeginPasskeyRegisterController {
  public constructor(private readonly beginPasskeyRegisterUseCase: BeginPasskeyRegisterUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const options = await this.beginPasskeyRegisterUseCase.execute(userId);

    sendSuccess<Record<string, unknown>>(
      res,
      HttpStatus.OK,
      "Passkey registration options created.",
      options,
    );
  }
}
