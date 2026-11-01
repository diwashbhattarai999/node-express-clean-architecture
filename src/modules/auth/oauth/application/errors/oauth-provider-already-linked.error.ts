import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class OAuthProviderAlreadyLinkedError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.CONFLICT,
      message: "This provider is already linked to your account.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "OAuthProviderAlreadyLinkedError";
  }
}
