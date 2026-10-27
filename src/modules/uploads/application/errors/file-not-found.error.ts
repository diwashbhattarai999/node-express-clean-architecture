import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class FileNotFoundError extends AppError {
  public constructor(key: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      message: `File not found: ${key}`,
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "FileNotFoundError";
  }
}
