import { ErrorCode } from "@/shared/errors/error-code";
import { TokenError } from "@/shared/errors/token-error";

export class TokenInvalidError extends TokenError {
  constructor(message = "The token is invalid.") {
    super(ErrorCode.TOKEN_INVALID, message);
    this.name = "TokenInvalidError";
  }
}
