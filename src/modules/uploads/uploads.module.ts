import type { IObjectStorage } from "@/modules/uploads/application/ports/object-storage.port";
import { DeleteFileUseCase } from "@/modules/uploads/application/use-cases/delete-file.use-case";
import { GetFileMetaUseCase } from "@/modules/uploads/application/use-cases/get-file-meta.use-case";
import { UploadFileUseCase } from "@/modules/uploads/application/use-cases/upload-file.use-case";
import { DeleteFileController } from "@/modules/uploads/presentation/http/controllers/delete-file.controller";
import { GetFileMetaController } from "@/modules/uploads/presentation/http/controllers/get-file-meta.controller";
import { UploadFileController } from "@/modules/uploads/presentation/http/controllers/upload-file.controller";

export interface CreateUploadsModuleOptions {
  objectStorage: IObjectStorage;
}

export function createUploadsModule(options: CreateUploadsModuleOptions) {
  const { objectStorage } = options;

  const uploadFileUseCase = new UploadFileUseCase(objectStorage);
  const deleteFileUseCase = new DeleteFileUseCase(objectStorage);
  const getFileMetaUseCase = new GetFileMetaUseCase(objectStorage);

  return {
    uploadFileController: new UploadFileController(uploadFileUseCase),
    deleteFileController: new DeleteFileController(deleteFileUseCase),
    getFileMetaController: new GetFileMetaController(getFileMetaUseCase),
  };
}
