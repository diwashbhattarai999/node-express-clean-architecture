import { AppError } from "@/shared/errors/app-error";
import type { TErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

type AuthForbiddenCode = Extract<
  TErrorCode,
  "ACCOUNT_NOT_VERIFIED" | "ACCOUNT_SUSPENDED" | "ACCOUNT_DISABLED"
>;

export class AuthForbiddenError extends AppError {
  constructor(code: AuthForbiddenCode, message: string) {
    super({
      code,
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });

    this.name = "AuthForbiddenError";
  }
}
