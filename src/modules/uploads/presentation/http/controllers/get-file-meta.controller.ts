import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { FileMetaResultDto } from "@/modules/uploads/application/dto/file-meta-result.dto";
import type { GetFileMetaUseCase } from "@/modules/uploads/application/use-cases/get-file-meta.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

import type { UploadKeySchema } from "../validators/upload-key.validator";

export class GetFileMetaController {
  public constructor(private readonly getFileMetaUseCase: GetFileMetaUseCase) {}

  public async handle(req: ValidatedRequest<UploadKeySchema>, res: Response): Promise<void> {
    const result = await this.getFileMetaUseCase.execute(req.params.key);

    sendSuccess<FileMetaResultDto>(res, HttpStatus.OK, "File metadata retrieved.", result);
  }
}
