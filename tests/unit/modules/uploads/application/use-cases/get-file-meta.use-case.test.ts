import { describe, expect, it, vi } from "vitest";

import { GetFileMetaUseCase } from "@/modules/uploads/application/use-cases/get-file-meta.use-case";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

describe("GetFileMetaUseCase", () => {
  it("returns metadata when the object exists", async () => {
    const objectStorage = {
      exists: vi.fn().mockResolvedValue(true),
      getPublicUrl: vi.fn().mockReturnValue("https://cdn.example/uploads/a.png"),
      getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/uploads/a.png"),
    } as unknown as IObjectStorage;

    const useCase = new GetFileMetaUseCase(objectStorage);
    const result = await useCase.execute("uploads/a.png");

    expect(result).toEqual({
      key: "uploads/a.png",
      exists: true,
      publicUrl: "https://cdn.example/uploads/a.png",
      signedUrl: "https://signed.example/uploads/a.png",
    });
  });

  it("skips signed URL when the object does not exist", async () => {
    const objectStorage = {
      exists: vi.fn().mockResolvedValue(false),
      getPublicUrl: vi.fn().mockReturnValue(null),
      getSignedUrl: vi.fn(),
    } as unknown as IObjectStorage;

    const useCase = new GetFileMetaUseCase(objectStorage);
    const result = await useCase.execute("uploads/missing.png");

    expect(result).toEqual({
      key: "uploads/missing.png",
      exists: false,
      publicUrl: null,
      signedUrl: null,
    });
    expect(objectStorage.getSignedUrl).not.toHaveBeenCalled();
  });
});
