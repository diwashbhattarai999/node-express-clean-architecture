import { describe, expect, it, vi } from "vitest";

import { FileNotFoundError } from "@/modules/uploads/application/errors/file-not-found.error";
import { DeleteFileUseCase } from "@/modules/uploads/application/use-cases/delete-file.use-case";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

describe("DeleteFileUseCase", () => {
  it("deletes an existing object", async () => {
    const objectStorage = {
      exists: vi.fn().mockResolvedValue(true),
      deleteObject: vi.fn().mockResolvedValue(undefined),
    } as unknown as IObjectStorage;

    const useCase = new DeleteFileUseCase(objectStorage);

    await expect(useCase.execute("uploads/a.png")).resolves.toBeUndefined();
    expect(objectStorage.deleteObject).toHaveBeenCalledWith("uploads/a.png");
  });

  it("throws when the object does not exist", async () => {
    const objectStorage = {
      exists: vi.fn().mockResolvedValue(false),
      deleteObject: vi.fn(),
    } as unknown as IObjectStorage;

    const useCase = new DeleteFileUseCase(objectStorage);

    await expect(useCase.execute("uploads/missing.png")).rejects.toBeInstanceOf(FileNotFoundError);
    expect(objectStorage.deleteObject).not.toHaveBeenCalled();
  });
});
