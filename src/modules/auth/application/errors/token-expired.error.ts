import { ErrorCode } from "@/shared/errors/error-code";
import { TokenError } from "@/shared/errors/token-error";

export class TokenExpiredError extends TokenError {
  constructor(message = "The token has expired.") {
    super(ErrorCode.TOKEN_EXPIRED, message);
    this.name = "TokenExpiredError";
  }
}
