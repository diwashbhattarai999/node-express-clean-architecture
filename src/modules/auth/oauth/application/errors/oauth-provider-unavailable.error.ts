import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class OAuthProviderUnavailableError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "OAuth provider is not available.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "OAuthProviderUnavailableError";
  }
}
