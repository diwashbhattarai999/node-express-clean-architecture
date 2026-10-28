import { ErrorCode } from "@/shared/errors/error-code";
import { TokenError } from "@/shared/errors/token-error";

export class TokenReusedError extends TokenError {
  constructor(message = "The refresh token was reused.") {
    super(ErrorCode.TOKEN_REUSED, message);
    this.name = "TokenReusedError";
  }
}
