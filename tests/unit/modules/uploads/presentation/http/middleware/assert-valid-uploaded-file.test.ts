import type { Express } from "express";
import { describe, expect, it } from "vitest";

import { UploadValidationError } from "@/modules/uploads/application/errors/upload-validation.error";
import { assertValidUploadedFile } from "@/modules/uploads/presentation/http/middleware/assert-valid-uploaded-file";

const createFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: "file",
    originalname: "photo.png",
    encoding: "7bit",
    mimetype: "image/png",
    size: 12,
    buffer: Buffer.from("png-bytes"),
    destination: "",
    filename: "",
    path: "",
    stream: undefined as never,
    ...overrides,
  }) as Express.Multer.File;

describe("assertValidUploadedFile", () => {
  const options = {
    maxFileSizeBytes: 1024,
    allowedMimeTypes: new Set(["image/png", "image/jpeg"]),
  };

  it("returns the file when valid", () => {
    const file = createFile();

    expect(assertValidUploadedFile(file, options)).toBe(file);
  });

  it("rejects a missing file", () => {
    expect(() => assertValidUploadedFile(undefined, options)).toThrow(UploadValidationError);
  });

  it("rejects oversized files", () => {
    expect(() =>
      assertValidUploadedFile(createFile({ size: 2048 }), options),
    ).toThrow(UploadValidationError);
  });

  it("rejects disallowed MIME types", () => {
    expect(() =>
      assertValidUploadedFile(createFile({ mimetype: "text/plain" }), options),
    ).toThrow(UploadValidationError);
  });
});
