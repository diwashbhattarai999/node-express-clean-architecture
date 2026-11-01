import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ExportAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/export-admin-audit-logs.use-case";
import type { ExportAdminAuditLogsSchema } from "@/modules/auth/audit/presentation/http/validators/export-admin-audit-logs.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ExportAdminAuditLogsResponseData = {
  exportId: string;
  status: "pending";
};

export class ExportAdminAuditLogsController {
  public constructor(private readonly exportAdminAuditLogsUseCase: ExportAdminAuditLogsUseCase) {}

  public async handle(
    req: ValidatedRequest<ExportAdminAuditLogsSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const filters = req.body.filters;

    const result = await this.exportAdminAuditLogsUseCase.execute({
      userId,
      sessionId,
      from: req.body.from,
      to: req.body.to,
      format: req.body.format,
      ...(filters?.userId !== undefined ? { targetUserId: filters.userId } : {}),
      ...(filters?.eventType !== undefined ? { eventType: filters.eventType } : {}),
      ...(filters?.outcome !== undefined ? { outcome: filters.outcome } : {}),
    });

    sendSuccess<ExportAdminAuditLogsResponseData>(
      res,
      HttpStatus.ACCEPTED,
      "Audit log export queued.",
      result,
    );
  }
}
