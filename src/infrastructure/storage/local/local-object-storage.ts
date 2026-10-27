import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { StorageError, StorageObjectNotFoundError } from "@/shared/storage/errors/storage.error";
import { normalizeStorageKey } from "@/shared/storage/normalize-storage-key";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";
import type {
  GetObjectResult,
  GetSignedUrlInput,
  PutObjectInput,
  PutObjectResult,
} from "@/shared/storage/storage.types";

export interface LocalObjectStorageOptions {
  rootDirectory: string;
  publicBaseUrl?: string;
}

const toBuffer = (body: PutObjectInput["body"]): Buffer => {
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }

  return Buffer.from(body);
};

export class LocalObjectStorage implements IObjectStorage {
  private readonly rootDirectory: string;
  private readonly publicBaseUrl?: string;

  public constructor(options: LocalObjectStorageOptions) {
    this.rootDirectory = path.resolve(options.rootDirectory);

    if (options.publicBaseUrl) {
      this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, "");
    }
  }

  private resolveKeyPath(key: string): string {
    const normalizedKey = normalizeStorageKey(key);
    const absolutePath = path.resolve(this.rootDirectory, normalizedKey);

    if (
      absolutePath !== this.rootDirectory &&
      !absolutePath.startsWith(`${this.rootDirectory}${path.sep}`)
    ) {
      throw new StorageError("Storage object key resolves outside the storage root.");
    }

    return absolutePath;
  }

  public async putObject(input: PutObjectInput): Promise<PutObjectResult> {
    const key = normalizeStorageKey(input.key);
    const filePath = this.resolveKeyPath(key);

    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, toBuffer(input.body));
    } catch (error) {
      throw new StorageError("Failed to write object to local storage.", error);
    }

    return { key };
  }

  public async getObject(key: string): Promise<GetObjectResult> {
    const normalizedKey = normalizeStorageKey(key);
    const filePath = this.resolveKeyPath(normalizedKey);

    try {
      const body = await readFile(filePath);
      const fileStat = await stat(filePath);

      return {
        key: normalizedKey,
        body,
        contentLength: fileStat.size,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new StorageObjectNotFoundError(normalizedKey, error);
      }

      throw new StorageError("Failed to read object from local storage.", error);
    }
  }

  public async deleteObject(key: string): Promise<void> {
    const normalizedKey = normalizeStorageKey(key);
    const filePath = this.resolveKeyPath(normalizedKey);

    try {
      await rm(filePath, { force: true });
    } catch (error) {
      throw new StorageError("Failed to delete object from local storage.", error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    const filePath = this.resolveKeyPath(key);

    try {
      await stat(filePath);

      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw new StorageError("Failed to check object existence in local storage.", error);
    }
  }

  public async getSignedUrl(input: GetSignedUrlInput): Promise<string> {
    const publicUrl = this.getPublicUrl(input.key);

    if (!publicUrl) {
      throw new StorageError("STORAGE_PUBLIC_BASE_URL is required to generate local storage URLs.");
    }

    return publicUrl;
  }

  public getPublicUrl(key: string): string | null {
    if (!this.publicBaseUrl) {
      return null;
    }

    return `${this.publicBaseUrl}/${normalizeStorageKey(key)}`;
  }
}
