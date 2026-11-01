import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListOwnSecurityEventsUseCase } from "@/modules/auth/audit/application/use-cases/list-own-security-events.use-case";
import {
  type SecurityEventResponse,
  toSecurityEventResponseList,
} from "@/modules/auth/audit/presentation/http/mappers/security-event.response";
import type { ListOwnSecurityEventsSchema } from "@/modules/auth/audit/presentation/http/validators/list-own-security-events.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListOwnSecurityEventsController {
  public constructor(private readonly listOwnSecurityEventsUseCase: ListOwnSecurityEventsUseCase) {}

  public async handle(
    req: ValidatedRequest<ListOwnSecurityEventsSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listOwnSecurityEventsUseCase.execute({
      userId,
      sessionId,
      page: query.page,
      limit: query.limit,
      ...(query.eventType !== undefined ? { eventType: query.eventType } : {}),
      ...(query.outcome !== undefined ? { outcome: query.outcome } : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });

    sendSuccessWithMeta<SecurityEventResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Security events retrieved.",
      toSecurityEventResponseList(result.items),
      createPaginationMeta({
        totalRecords: result.total,
        page: query.page,
        limit: query.limit,
        recordShown: result.items.length,
      }),
    );
  }
}
