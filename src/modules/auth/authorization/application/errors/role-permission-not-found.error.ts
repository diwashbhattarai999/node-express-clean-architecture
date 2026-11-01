import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class RolePermissionNotFoundError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "This permission is not assigned to the role.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "RolePermissionNotFoundError";
  }
}
