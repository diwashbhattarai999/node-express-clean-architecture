import type { UploadFileDto } from "@/modules/uploads/application/dto/upload-file.dto";
import type { UploadFileResultDto } from "@/modules/uploads/application/dto/upload-file-result.dto";
import type { IObjectStorage } from "@/modules/uploads/application/ports/object-storage.port";
import { buildUploadObjectKey } from "@/modules/uploads/application/utils/build-upload-object-key";
import { logger } from "@/shared/logger/logger";

export class UploadFileUseCase {
  public constructor(private readonly objectStorage: IObjectStorage) {}

  public async execute(dto: UploadFileDto): Promise<UploadFileResultDto> {
    const key = buildUploadObjectKey(dto.originalName);

    await this.objectStorage.putObject({
      key,
      body: dto.buffer,
      contentType: dto.mimeType,
    });

    const publicUrl = this.objectStorage.getPublicUrl(key);
    let signedUrl: string | null = null;

    try {
      signedUrl = await this.objectStorage.getSignedUrl({
        key,
        expiresInSeconds: 900,
        operation: "get",
      });
    } catch (error) {
      logger.debug({ err: error, key }, "Signed URL unavailable after upload");
    }

    return {
      key,
      contentType: dto.mimeType,
      size: dto.size,
      publicUrl,
      signedUrl,
    };
  }
}
