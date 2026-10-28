import { AppError } from "@/shared/errors/app-error";
import type { TErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

type TokenErrorCode = Extract<
  TErrorCode,
  "TOKEN_INVALID" | "TOKEN_EXPIRED" | "TOKEN_REVOKED" | "TOKEN_REUSED"
>;

export class TokenError extends AppError {
  constructor(code: TokenErrorCode, message: string) {
    super({
      code,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });

    this.name = "TokenError";
  }
}
