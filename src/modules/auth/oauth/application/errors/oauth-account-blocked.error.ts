import { AppError } from "@/shared/errors/app-error";
import type { TErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

type OAuthAccountBlockedCode = Extract<TErrorCode, "ACCOUNT_SUSPENDED" | "ACCOUNT_DISABLED">;

export class OAuthAccountBlockedError extends AppError {
  public constructor(code: OAuthAccountBlockedCode, message: string) {
    super({
      code,
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });

    this.name = "OAuthAccountBlockedError";
  }
}
