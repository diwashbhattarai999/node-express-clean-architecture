import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer, { MulterError } from "multer";

import { UploadValidationError } from "@/modules/uploads/application/errors/upload-validation.error";
import { assertValidUploadedFile } from "@/modules/uploads/presentation/http/middleware/assert-valid-uploaded-file";
import type { FieldError } from "@/shared/http/field-error";

export interface UploadMultipartOptions {
  maxFileSizeBytes: number;
  allowedMimeTypes: readonly string[];
}

const fieldError = (message: string, value?: unknown): FieldError => ({
  type: "field",
  path: "file",
  location: "body",
  message,
  value,
});

/**
 * Parses a single multipart field named `file` into memory and enforces size/MIME rules.
 */
export const createUploadMultipartMiddleware = (
  options: UploadMultipartOptions,
): RequestHandler => {
  const allowedMimeTypes = new Set(options.allowedMimeTypes.map((mime) => mime.toLowerCase()));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: options.maxFileSizeBytes,
      files: 1,
    },
  }).single("file");

  return (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (error: unknown) => {
      if (error instanceof MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          next(
            new UploadValidationError([
              fieldError(
                `File exceeds the maximum size of ${options.maxFileSizeBytes} bytes.`,
                undefined,
              ),
            ]),
          );

          return;
        }

        next(new UploadValidationError([fieldError(error.message)]));

        return;
      }

      if (error) {
        next(error);

        return;
      }

      try {
        assertValidUploadedFile(req.file, {
          maxFileSizeBytes: options.maxFileSizeBytes,
          allowedMimeTypes,
        });
        next();
      } catch (validationError) {
        next(validationError);
      }
    });
  };
};
