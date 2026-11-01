import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { UpdateSessionLabelUseCase } from "@/modules/auth/sessions/application/use-cases/update-session-label.use-case";
import {
  type SessionSummaryResponse,
  toSessionSummaryResponse,
} from "@/modules/auth/sessions/presentation/http/mappers/session-summary.response";
import type { UpdateSessionLabelSchema } from "@/modules/auth/sessions/presentation/http/validators/update-session-label.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class UpdateSessionLabelController {
  public constructor(private readonly updateSessionLabelUseCase: UpdateSessionLabelUseCase) {}

  public async handle(
    req: ValidatedRequest<UpdateSessionLabelSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId: currentSessionId } = getBearerAuth(req);

    const session = await this.updateSessionLabelUseCase.execute({
      userId,
      sessionId: req.params.sessionId,
      currentSessionId,
      deviceName: req.body.deviceName,
    });

    sendSuccess<SessionSummaryResponse>(
      res,
      HttpStatus.OK,
      "Session updated.",
      toSessionSummaryResponse(session),
    );
  }
}
