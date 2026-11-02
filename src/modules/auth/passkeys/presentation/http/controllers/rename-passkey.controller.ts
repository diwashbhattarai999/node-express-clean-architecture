import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RenamePasskeyUseCase } from "@/modules/auth/passkeys/application/use-cases/rename-passkey.use-case";
import {
  type PasskeyResponse,
  toPasskeyResponse,
} from "@/modules/auth/passkeys/presentation/http/mappers/passkey.response";
import type { RenamePasskeySchema } from "@/modules/auth/passkeys/presentation/http/validators/rename-passkey.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RenamePasskeyController {
  public constructor(private readonly renamePasskeyUseCase: RenamePasskeyUseCase) {}

  public async handle(req: ValidatedRequest<RenamePasskeySchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const passkey = await this.renamePasskeyUseCase.execute(userId, req.params.passkeyId, req.body);

    sendSuccess<PasskeyResponse>(
      res,
      HttpStatus.OK,
      "Passkey renamed.",
      toPasskeyResponse(passkey),
    );
  }
}
