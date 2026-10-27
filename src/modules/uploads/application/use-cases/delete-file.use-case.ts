import { FileNotFoundError } from "@/modules/uploads/application/errors/file-not-found.error";
import type { IObjectStorage } from "@/modules/uploads/application/ports/object-storage.port";
import { normalizeStorageKey } from "@/shared/storage/normalize-storage-key";

export class DeleteFileUseCase {
  public constructor(private readonly objectStorage: IObjectStorage) {}

  public async execute(key: string): Promise<void> {
    const normalizedKey = normalizeStorageKey(key);
    const exists = await this.objectStorage.exists(normalizedKey);

    if (!exists) {
      throw new FileNotFoundError(normalizedKey);
    }

    await this.objectStorage.deleteObject(normalizedKey);
  }
}
