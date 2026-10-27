import type { FileMetaResultDto } from "@/modules/uploads/application/dto/file-meta-result.dto";
import type { IObjectStorage } from "@/modules/uploads/application/ports/object-storage.port";
import { logger } from "@/shared/logger/logger";
import { normalizeStorageKey } from "@/shared/storage/normalize-storage-key";

export class GetFileMetaUseCase {
  public constructor(private readonly objectStorage: IObjectStorage) {}

  public async execute(key: string): Promise<FileMetaResultDto> {
    const normalizedKey = normalizeStorageKey(key);
    const exists = await this.objectStorage.exists(normalizedKey);
    const publicUrl = this.objectStorage.getPublicUrl(normalizedKey);

    let signedUrl: string | null = null;

    if (exists) {
      try {
        signedUrl = await this.objectStorage.getSignedUrl({
          key: normalizedKey,
          expiresInSeconds: 900,
          operation: "get",
        });
      } catch (error) {
        logger.debug({ err: error, key: normalizedKey }, "Signed URL unavailable for file meta");
      }
    }

    return {
      key: normalizedKey,
      exists,
      publicUrl,
      signedUrl,
    };
  }
}
