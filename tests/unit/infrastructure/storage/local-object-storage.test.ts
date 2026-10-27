import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocalObjectStorage } from "@/infrastructure/storage/local/local-object-storage";
import {
  StorageError,
  StorageObjectNotFoundError,
} from "@/shared/storage/errors/storage.error";

describe("LocalObjectStorage", () => {
  let rootDirectory: string;
  let storage: LocalObjectStorage;

  beforeEach(async () => {
    rootDirectory = await mkdtemp(path.join(tmpdir(), "storage-local-"));
    storage = new LocalObjectStorage({
      rootDirectory,
      publicBaseUrl: "http://localhost:3000/uploads",
    });
  });

  afterEach(async () => {
    await rm(rootDirectory, { recursive: true, force: true });
  });

  it("writes, reads, checks existence, and deletes objects", async () => {
    await storage.putObject({
      key: "docs/hello.txt",
      body: "hello world",
      contentType: "text/plain",
    });

    await expect(storage.exists("docs/hello.txt")).resolves.toBe(true);

    const object = await storage.getObject("docs/hello.txt");

    expect(object.body.toString("utf8")).toBe("hello world");
    expect(storage.getPublicUrl("docs/hello.txt")).toBe(
      "http://localhost:3000/uploads/docs/hello.txt",
    );
    await expect(storage.getSignedUrl({ key: "docs/hello.txt" })).resolves.toBe(
      "http://localhost:3000/uploads/docs/hello.txt",
    );

    await storage.deleteObject("docs/hello.txt");
    await expect(storage.exists("docs/hello.txt")).resolves.toBe(false);
  });

  it("rejects path traversal keys", async () => {
    await expect(
      storage.putObject({
        key: "../outside.txt",
        body: "nope",
      }),
    ).rejects.toBeInstanceOf(StorageError);
  });

  it("throws not found for missing objects", async () => {
    await expect(storage.getObject("missing.txt")).rejects.toBeInstanceOf(
      StorageObjectNotFoundError,
    );
  });
});
