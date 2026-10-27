import { describe, expect, it, vi } from "vitest";

import { UploadFileUseCase } from "@/modules/uploads/application/use-cases/upload-file.use-case";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

describe("UploadFileUseCase", () => {
  it("stores the file and returns urls when signed URL is available", async () => {
    const objectStorage = {
      putObject: vi.fn().mockResolvedValue({ key: "uploads/ignored" }),
      getPublicUrl: vi.fn().mockReturnValue("https://cdn.example/uploads/file.png"),
      getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/uploads/file.png"),
    } as unknown as IObjectStorage;

    const useCase = new UploadFileUseCase(objectStorage);
    const buffer = Buffer.from("png-bytes");

    const result = await useCase.execute({
      buffer,
      originalName: "photo.png",
      mimeType: "image/png",
      size: buffer.length,
    });

    expect(objectStorage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        body: buffer,
        contentType: "image/png",
        key: expect.stringMatching(/^uploads\/[0-9a-f-]{36}-photo\.png$/),
      }),
    );
    expect(result).toEqual({
      key: expect.stringMatching(/^uploads\/[0-9a-f-]{36}-photo\.png$/),
      contentType: "image/png",
      size: buffer.length,
      publicUrl: "https://cdn.example/uploads/file.png",
      signedUrl: "https://signed.example/uploads/file.png",
    });
  });

  it("returns null signedUrl when signed URL generation fails", async () => {
    const objectStorage = {
      putObject: vi.fn().mockResolvedValue({ key: "uploads/ignored" }),
      getPublicUrl: vi.fn().mockReturnValue(null),
      getSignedUrl: vi.fn().mockRejectedValue(new Error("no public base url")),
    } as unknown as IObjectStorage;

    const useCase = new UploadFileUseCase(objectStorage);
    const buffer = Buffer.from("%PDF");

    const result = await useCase.execute({
      buffer,
      originalName: "doc.pdf",
      mimeType: "application/pdf",
      size: buffer.length,
    });

    expect(result.publicUrl).toBeNull();
    expect(result.signedUrl).toBeNull();
    expect(result.key).toMatch(/^uploads\/[0-9a-f-]{36}-doc\.pdf$/);
  });
});
