import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetAdminAuditExportUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-export.use-case";
import type { GetAdminAuditExportSchema } from "@/modules/auth/audit/presentation/http/validators/get-admin-audit-export.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";

export class GetAdminAuditExportController {
  public constructor(private readonly getAdminAuditExportUseCase: GetAdminAuditExportUseCase) {}

  public async handle(
    req: ValidatedRequest<GetAdminAuditExportSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.getAdminAuditExportUseCase.execute({
      userId,
      sessionId,
      exportId: req.params.exportId,
    });

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.status(HttpStatus.OK).send(result.body);
  }
}
