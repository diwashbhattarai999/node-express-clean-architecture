import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class RoleAlreadyExistsError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.CONFLICT,
      message: "A role with this key already exists.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "RoleAlreadyExistsError";
  }
}
