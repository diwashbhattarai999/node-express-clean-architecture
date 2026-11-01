import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetAdminAuditLogUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-log.use-case";
import {
  type SecurityEventResponse,
  toSecurityEventResponse,
} from "@/modules/auth/audit/presentation/http/mappers/security-event.response";
import type { GetAdminAuditLogSchema } from "@/modules/auth/audit/presentation/http/validators/get-admin-audit-log.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class GetAdminAuditLogController {
  public constructor(private readonly getAdminAuditLogUseCase: GetAdminAuditLogUseCase) {}

  public async handle(req: ValidatedRequest<GetAdminAuditLogSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const event = await this.getAdminAuditLogUseCase.execute({
      userId,
      sessionId,
      eventId: req.params.eventId,
    });

    sendSuccess<SecurityEventResponse>(
      res,
      HttpStatus.OK,
      "Audit log retrieved.",
      toSecurityEventResponse(event),
    );
  }
}
