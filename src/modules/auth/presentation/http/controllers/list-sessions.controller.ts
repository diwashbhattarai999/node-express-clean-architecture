import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListSessionsUseCase } from "@/modules/auth/application/use-cases/list-sessions.use-case";
import {
  type SessionSummaryResponse,
  toSessionSummaryResponseList,
} from "@/modules/auth/presentation/http/mappers/session-summary.response";
import { getBearerAuth } from "@/modules/auth/presentation/http/middleware/auth-context";
import type { ListSessionsSchema } from "@/modules/auth/presentation/http/validators/list-sessions.validator";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListSessionsController {
  public constructor(private readonly listSessionsUseCase: ListSessionsUseCase) {}

  public async handle(req: ValidatedRequest<ListSessionsSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listSessionsUseCase.execute({
      userId,
      currentSessionId: sessionId,
      query,
    });

    sendSuccessWithMeta<SessionSummaryResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Sessions retrieved.",
      toSessionSummaryResponseList(result.items),
      createPaginationMeta({
        totalRecords: result.total,
        page: query.page,
        limit: query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
