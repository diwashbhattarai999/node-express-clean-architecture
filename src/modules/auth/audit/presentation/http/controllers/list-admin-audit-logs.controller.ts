import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/list-admin-audit-logs.use-case";
import {
  type SecurityEventResponse,
  toSecurityEventResponseList,
} from "@/modules/auth/audit/presentation/http/mappers/security-event.response";
import type { ListAdminAuditLogsSchema } from "@/modules/auth/audit/presentation/http/validators/list-admin-audit-logs.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { IPagination } from "@/shared/http/api-response";
import { HttpStatus } from "@/shared/http/http-status";
import { createPaginationMeta } from "@/shared/http/pagination";
import { sendSuccessWithMeta } from "@/shared/http/send-response";

export class ListAdminAuditLogsController {
  public constructor(private readonly listAdminAuditLogsUseCase: ListAdminAuditLogsUseCase) {}

  public async handle(
    req: ValidatedRequest<ListAdminAuditLogsSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const query = req.query;

    const result = await this.listAdminAuditLogsUseCase.execute({
      userId,
      sessionId,
      page: query.page,
      limit: query.limit,
      ...(query.userId !== undefined ? { targetUserId: query.userId } : {}),
      ...(query.eventType !== undefined ? { eventType: query.eventType } : {}),
      ...(query.outcome !== undefined ? { outcome: query.outcome } : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });

    sendSuccessWithMeta<SecurityEventResponse[], IPagination>(
      res,
      HttpStatus.OK,
      "Audit logs retrieved.",
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
