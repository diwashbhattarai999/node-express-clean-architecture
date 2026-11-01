import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class RoleAssignedError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.CONFLICT,
      message: "This role is assigned to users and cannot be deleted.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "RoleAssignedError";
  }
}
