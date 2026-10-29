import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetSessionUseCase } from "@/modules/auth/sessions/application/use-cases/get-session.use-case";
import {
  type SessionSummaryResponse,
  toSessionSummaryResponse,
} from "@/modules/auth/sessions/presentation/http/mappers/session-summary.response";
import type { GetSessionSchema } from "@/modules/auth/sessions/presentation/http/validators/get-session.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class GetSessionController {
  public constructor(private readonly getSessionUseCase: GetSessionUseCase) {}

  public async handle(req: ValidatedRequest<GetSessionSchema>, res: Response): Promise<void> {
    const { userId, sessionId: currentSessionId } = getBearerAuth(req);

    const session = await this.getSessionUseCase.execute({
      userId,
      sessionId: req.params.sessionId,
      currentSessionId,
    });

    sendSuccess<SessionSummaryResponse>(
      res,
      HttpStatus.OK,
      "Session retrieved.",
      toSessionSummaryResponse(session),
    );
  }
}
