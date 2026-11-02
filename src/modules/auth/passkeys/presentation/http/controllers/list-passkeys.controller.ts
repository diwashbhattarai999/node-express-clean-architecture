import type { Request, Response } from "express";

import type { ListPasskeysUseCase } from "@/modules/auth/passkeys/application/use-cases/list-passkeys.use-case";
import {
  type PasskeyResponse,
  toPasskeyResponse,
} from "@/modules/auth/passkeys/presentation/http/mappers/passkey.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListPasskeysController {
  public constructor(private readonly listPasskeysUseCase: ListPasskeysUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.listPasskeysUseCase.execute(userId);

    sendSuccess<PasskeyResponse[]>(
      res,
      HttpStatus.OK,
      "Passkeys retrieved.",
      result.passkeys.map(toPasskeyResponse),
    );
  }
}
