import { describe, expect, it, vi } from "vitest";

import { S3CompatibleObjectStorage } from "@/infrastructure/storage/s3/s3-compatible-object-storage";
import { StorageObjectNotFoundError } from "@/shared/storage/errors/storage.error";

describe("S3CompatibleObjectStorage", () => {
  it("uploads and downloads objects through the S3 client", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Body: {
          transformToByteArray: async () => new TextEncoder().encode("payload"),
        },
        ContentType: "text/plain",
        ContentLength: 7,
      });

    const storage = new S3CompatibleObjectStorage({
      client: { send } as never,
      bucket: "test-bucket",
      publicBaseUrl: "https://cdn.example.com",
    });

    await expect(
      storage.putObject({
        key: "a/b.txt",
        body: "payload",
        contentType: "text/plain",
      }),
    ).resolves.toEqual({ key: "a/b.txt" });

    const object = await storage.getObject("a/b.txt");

    expect(object.body.toString("utf8")).toBe("payload");
    expect(object.contentType).toBe("text/plain");
    expect(storage.getPublicUrl("a/b.txt")).toBe("https://cdn.example.com/a/b.txt");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("maps missing objects to StorageObjectNotFoundError", async () => {
    const send = vi.fn().mockRejectedValue({
      name: "NoSuchKey",
      $metadata: { httpStatusCode: 404 },
    });

    const storage = new S3CompatibleObjectStorage({
      client: { send } as never,
      bucket: "test-bucket",
    });

    await expect(storage.getObject("missing.txt")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });

  it("reports exists=false for missing heads", async () => {
    const send = vi.fn().mockRejectedValue({
      name: "NotFound",
      $metadata: { httpStatusCode: 404 },
    });

    const storage = new S3CompatibleObjectStorage({
      client: { send } as never,
      bucket: "test-bucket",
    });

    await expect(storage.exists("missing.txt")).resolves.toBe(false);
  });
});
