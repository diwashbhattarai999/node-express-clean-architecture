import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DeleteFileUseCase } from "@/modules/uploads/application/use-cases/delete-file.use-case";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

import type { UploadKeySchema } from "../validators/upload-key.validator";

export class DeleteFileController {
  public constructor(private readonly deleteFileUseCase: DeleteFileUseCase) {}

  public async handle(req: ValidatedRequest<UploadKeySchema>, res: Response): Promise<void> {
    await this.deleteFileUseCase.execute(req.params.key);

    sendSuccess<null>(res, HttpStatus.OK, "File deleted.", null);
  }
}
