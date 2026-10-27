import type { TEnv } from "@/config/env-schema";
import { StorageProvider } from "@/config/storage-provider";
import { LocalObjectStorage } from "@/infrastructure/storage/local/local-object-storage";
import {
  createS3CompatibleClient,
  S3CompatibleObjectStorage,
} from "@/infrastructure/storage/s3/s3-compatible-object-storage";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

export const createObjectStorage = (env: TEnv): IObjectStorage => {
  // If the storage provider is local, return a new local object storage.
  if (env.STORAGE_PROVIDER === StorageProvider.LOCAL) {
    return new LocalObjectStorage({
      rootDirectory: env.STORAGE_LOCAL_PATH,
      ...(env.STORAGE_PUBLIC_BASE_URL ? { publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL } : {}),
    });
  }

  // If the storage provider is s3, return a new s3 compatible object storage.
  if (env.STORAGE_PROVIDER === StorageProvider.S3) {
    if (!env.STORAGE_BUCKET || !env.STORAGE_ACCESS_KEY_ID || !env.STORAGE_SECRET_ACCESS_KEY) {
      throw new Error(
        "STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY are required for s3.",
      );
    }

    const client = createS3CompatibleClient({
      region: env.STORAGE_REGION ?? "us-east-1",
      accessKeyId: env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      ...(env.STORAGE_ENDPOINT ? { endpoint: env.STORAGE_ENDPOINT } : {}),
      ...(env.STORAGE_FORCE_PATH_STYLE !== undefined
        ? { forcePathStyle: env.STORAGE_FORCE_PATH_STYLE }
        : {}),
    });

    return new S3CompatibleObjectStorage({
      client,
      bucket: env.STORAGE_BUCKET,
      ...(env.STORAGE_PUBLIC_BASE_URL ? { publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL } : {}),
    });
  }

  throw new Error(`Invalid storage provider: ${env.STORAGE_PROVIDER}`);
};
