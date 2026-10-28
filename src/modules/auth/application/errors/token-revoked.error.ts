import { ErrorCode } from "@/shared/errors/error-code";
import { TokenError } from "@/shared/errors/token-error";

export class TokenRevokedError extends TokenError {
  constructor(message = "The token has been revoked.") {
    super(ErrorCode.TOKEN_REVOKED, message);
    this.name = "TokenRevokedError";
  }
}
