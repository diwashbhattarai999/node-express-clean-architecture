import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { UploadFileResultDto } from "@/modules/uploads/application/dto/upload-file-result.dto";
import { UploadValidationError } from "@/modules/uploads/application/errors/upload-validation.error";
import type { UploadFileUseCase } from "@/modules/uploads/application/use-cases/upload-file.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

import type { UploadFileSchema } from "../validators/upload-file.validator";

export class UploadFileController {
  public constructor(private readonly uploadFileUseCase: UploadFileUseCase) {}

  public async handle(req: ValidatedRequest<UploadFileSchema>, res: Response): Promise<void> {
    const file = req.file;

    if (!file) {
      throw new UploadValidationError([
        {
          type: "field",
          path: "file",
          location: "body",
          message: "File is required.",
          value: undefined,
        },
      ]);
    }

    const result = await this.uploadFileUseCase.execute({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    sendSuccess<UploadFileResultDto>(res, HttpStatus.CREATED, "File uploaded.", result);
  }
}
