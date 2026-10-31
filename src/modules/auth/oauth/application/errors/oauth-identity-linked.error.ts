import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class OAuthIdentityLinkedError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.CONFLICT,
      message: "This identity is already linked to another account.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "OAuthIdentityLinkedError";
  }
}
