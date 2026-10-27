import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import { createUploadMultipartMiddleware } from "@/modules/uploads/presentation/http/middleware/upload-multipart.middleware";
import { uploadFileSchema, uploadKeySchema } from "@/modules/uploads/presentation/http/validators";
import {
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_FILE_SIZE_BYTES,
} from "@/modules/uploads/uploads.constants";
import type { createUploadsModule } from "@/modules/uploads/uploads.module";

export function createUploadsRouter(
  uploadsModule: ReturnType<typeof createUploadsModule>,
): IRouter {
  const router = Router();
  const uploadMultipartMiddleware = createUploadMultipartMiddleware({
    maxFileSizeBytes: UPLOAD_MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: UPLOAD_ALLOWED_MIME_TYPES,
  });

  router.post(
    "/",
    uploadMultipartMiddleware,
    validate(uploadFileSchema),
    asHandler(uploadsModule.uploadFileController),
  );

  router.get("/:key", validate(uploadKeySchema), asHandler(uploadsModule.getFileMetaController));

  router.delete("/:key", validate(uploadKeySchema), asHandler(uploadsModule.deleteFileController));

  return router;
}
