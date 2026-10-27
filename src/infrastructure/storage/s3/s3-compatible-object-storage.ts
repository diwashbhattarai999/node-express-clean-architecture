import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl as createSignedUrl } from "@aws-sdk/s3-request-presigner";

import { StorageError, StorageObjectNotFoundError } from "@/shared/storage/errors/storage.error";
import { normalizeStorageKey } from "@/shared/storage/normalize-storage-key";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";
import type {
  GetObjectResult,
  GetSignedUrlInput,
  PutObjectInput,
  PutObjectResult,
} from "@/shared/storage/storage.types";

export interface S3CompatibleObjectStorageOptions {
  client: S3Client;
  bucket: string;
  publicBaseUrl?: string;
}

export interface CreateS3CompatibleClientOptions {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export const createS3CompatibleClient = (options: CreateS3CompatibleClientOptions): S3Client => {
  const config: S3ClientConfig = {
    region: options.region,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    },
  };

  if (options.endpoint) {
    config.endpoint = options.endpoint;
  }

  if (options.forcePathStyle !== undefined) {
    config.forcePathStyle = options.forcePathStyle;
  }

  return new S3Client(config);
};

const toUint8Array = (body: PutObjectInput["body"]): Uint8Array => {
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }

  return body instanceof Buffer ? body : new Uint8Array(body);
};

const streamToBuffer = async (body: unknown): Promise<Buffer> => {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }

  if (
    typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray ===
    "function"
  ) {
    const bytes = await (
      body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();

    return Buffer.from(bytes);
  }

  throw new StorageError("Unsupported S3 object body type.");
};

const isNotFoundError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.Code === "NoSuchKey" ||
    candidate.$metadata?.httpStatusCode === 404
  );
};

export class S3CompatibleObjectStorage implements IObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;

  public constructor(options: S3CompatibleObjectStorageOptions) {
    this.client = options.client;
    this.bucket = options.bucket;

    if (options.publicBaseUrl) {
      this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
    }
  }

  public async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const key = normalizeStorageKey(input.key);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: toUint8Array(input.body),
          ...(input.contentType ? { ContentType: input.contentType } : {}),
          ...(input.metadata ? { Metadata: input.metadata } : {}),
        }),
      );
    } catch (error) {
      throw new StorageError("Failed to upload object to S3-compatible storage.", error);
    }

    return { key };
  }

  public async getObject(key: string): Promise<GetObjectResult> {
    const normalizedKey = normalizeStorageKey(key);

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        }),
      );

      const body = await streamToBuffer(response.Body);

      return {
        key: normalizedKey,
        body,
        ...(response.ContentType ? { contentType: response.ContentType } : {}),
        ...(typeof response.ContentLength === "number"
          ? { contentLength: response.ContentLength }
          : {}),
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new StorageObjectNotFoundError(normalizedKey, error);
      }

      throw new StorageError("Failed to download object from S3-compatible storage.", error);
    }
  }

  public async deleteObject(key: string): Promise<void> {
    const normalizedKey = normalizeStorageKey(key);

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        }),
      );
    } catch (error) {
      throw new StorageError("Failed to delete object from S3-compatible storage.", error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    const normalizedKey = normalizeStorageKey(key);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        }),
      );

      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new StorageError("Failed to check object existence in S3-compatible storage.", error);
    }
  }

  public async getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    const key = normalizeStorageKey(input.key);
    const expiresIn = input.expiresInSeconds ?? 3600;
    const operation = input.operation ?? "get";

    const command =
      operation === "put"
        ? new PutObjectCommand({ Bucket: this.bucket, Key: key })
        : new GetObjectCommand({ Bucket: this.bucket, Key: key });

    try {
      return await createSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      throw new StorageError("Failed to create signed URL for S3-compatible storage.", error);
    }
  }

  public getPublicUrl(key: string): string | null {
    if (!this.publicBaseUrl) {
      return null;
    }

    return `${this.publicBaseUrl}/${normalizeStorageKey(key)}`;
  }
}
