import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DeletePasskeyUseCase } from "@/modules/auth/passkeys/application/use-cases/delete-passkey.use-case";
import type { DeletePasskeySchema } from "@/modules/auth/passkeys/presentation/http/validators/delete-passkey.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class DeletePasskeyController {
  public constructor(private readonly deletePasskeyUseCase: DeletePasskeyUseCase) {}

  public async handle(req: ValidatedRequest<DeletePasskeySchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    await this.deletePasskeyUseCase.execute(userId, req.params.passkeyId);

    sendSuccess(res, HttpStatus.OK, "Passkey removed.", null);
  }
}
