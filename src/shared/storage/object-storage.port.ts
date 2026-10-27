import type {
  GetObjectResult,
  GetSignedUrlInput,
  PutObjectInput,
  PutObjectResult,
} from "@/shared/storage/storage.types";

export interface IObjectStorage {
  putObject(input: PutObjectInput): Promise<PutObjectResult>;
  getObject(key: string): Promise<GetObjectResult>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(input: GetSignedUrlInput): Promise<string>;
  /** Returns a public URL when configured; otherwise `null`. */
  getPublicUrl(key: string): string | null;
}
