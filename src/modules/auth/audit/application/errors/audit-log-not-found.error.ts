import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class AuditLogNotFoundError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "Audit log not found.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "AuditLogNotFoundError";
  }
}
