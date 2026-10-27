import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class StorageError extends AppError {
  public constructor(message = "Storage operation failed.", cause?: unknown) {
    super({
      code: ErrorCode.STORAGE_ERROR,
      message,
      statusCode: HttpStatus.BAD_GATEWAY,
      cause,
    });

    this.name = "StorageError";
  }
}

export class StorageObjectNotFoundError extends AppError {
  public constructor(key: string, cause?: unknown) {
    super({
      code: ErrorCode.STORAGE_OBJECT_NOT_FOUND,
      message: `Storage object not found: ${key}`,
      statusCode: HttpStatus.NOT_FOUND,
      cause,
    });

    this.name = "StorageObjectNotFoundError";
  }
}
