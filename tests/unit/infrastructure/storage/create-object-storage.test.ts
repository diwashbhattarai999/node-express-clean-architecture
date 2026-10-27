import { describe, expect, it } from "vitest";

import type { TEnv } from "@/config/env-schema";
import { StorageProvider } from "@/config/storage-provider";
import { createObjectStorage } from "@/infrastructure/storage/create-object-storage";
import { LocalObjectStorage } from "@/infrastructure/storage/local/local-object-storage";
import { S3CompatibleObjectStorage } from "@/infrastructure/storage/s3/s3-compatible-object-storage";

const baseEnv = {
  STORAGE_PROVIDER: StorageProvider.LOCAL,
  STORAGE_LOCAL_PATH: "./uploads",
  STORAGE_PUBLIC_BASE_URL: undefined,
  STORAGE_BUCKET: undefined,
  STORAGE_REGION: undefined,
  STORAGE_ENDPOINT: undefined,
  STORAGE_ACCESS_KEY_ID: undefined,
  STORAGE_SECRET_ACCESS_KEY: undefined,
  STORAGE_FORCE_PATH_STYLE: undefined,
} as TEnv;

describe("createObjectStorage", () => {
  it("creates local storage by default", () => {
    const storage = createObjectStorage({
      ...baseEnv,
      STORAGE_PROVIDER: StorageProvider.LOCAL,
    });

    expect(storage).toBeInstanceOf(LocalObjectStorage);
  });

  it("creates S3 storage when STORAGE_PROVIDER is s3", () => {
    const storage = createObjectStorage({
      ...baseEnv,
      STORAGE_PROVIDER: StorageProvider.S3,
      STORAGE_BUCKET: "my-bucket",
      STORAGE_ACCESS_KEY_ID: "akid",
      STORAGE_SECRET_ACCESS_KEY: "secret",
      STORAGE_REGION: "us-east-1",
    });

    expect(storage).toBeInstanceOf(S3CompatibleObjectStorage);
  });

  it("throws when s3 is selected without credentials", () => {
    expect(() =>
      createObjectStorage({
        ...baseEnv,
        STORAGE_PROVIDER: StorageProvider.S3,
      }),
    ).toThrow(/STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY are required/);
  });
});
