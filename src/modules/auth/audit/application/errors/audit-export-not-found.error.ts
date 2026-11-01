import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class AuditExportNotFoundError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "Audit export not found. It may still be processing.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "AuditExportNotFoundError";
  }
}
