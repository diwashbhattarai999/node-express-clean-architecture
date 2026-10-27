import type { Express } from "express";

import { UploadValidationError } from "@/modules/uploads/application/errors/upload-validation.error";
import type { FieldError } from "@/shared/http/field-error";

export interface AssertValidUploadedFileOptions {
  maxFileSizeBytes: number;
  allowedMimeTypes: ReadonlySet<string>;
}

const fieldError = (message: string, value?: unknown): FieldError => ({
  type: "field",
  path: "file",
  location: "body",
  message,
  value,
});

/**
 * Validates a multer memory file for presence, size, and allowed MIME type.
 *
 * @throws {UploadValidationError} when validation fails
 */
export const assertValidUploadedFile = (
  file: Express.Multer.File | undefined,
  options: AssertValidUploadedFileOptions,
): Express.Multer.File => {
  if (!file) {
    throw new UploadValidationError([fieldError("File is required.")]);
  }

  if (file.size > options.maxFileSizeBytes) {
    throw new UploadValidationError([
      fieldError(`File exceeds the maximum size of ${options.maxFileSizeBytes} bytes.`, file.size),
    ]);
  }

  const mimeType = file.mimetype.trim().toLowerCase();

  if (!options.allowedMimeTypes.has(mimeType)) {
    throw new UploadValidationError([
      fieldError(`MIME type "${file.mimetype}" is not allowed.`, file.mimetype),
    ]);
  }

  return file;
};
