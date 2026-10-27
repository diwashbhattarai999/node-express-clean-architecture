export type StorageBody = Buffer | Uint8Array | string;

export interface PutObjectInput {
  key: string;
  body: StorageBody;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface PutObjectResult {
  key: string;
}

export interface GetObjectResult {
  key: string;
  body: Buffer;
  contentType?: string;
  contentLength?: number;
}

export type SignedUrlOperation = "get" | "put";

export interface GetSignedUrlInput {
  key: string;
  expiresInSeconds?: number;
  operation?: SignedUrlOperation;
}
