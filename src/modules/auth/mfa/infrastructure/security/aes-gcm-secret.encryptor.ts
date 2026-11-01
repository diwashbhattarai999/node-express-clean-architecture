import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION = "v1";

export class AesGcmSecretEncryptor implements ISecretEncryptor {
  private readonly key: Buffer;

  public constructor(secret: string) {
    this.key = createHash("sha256").update(secret).digest();
  }

  public encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString("base64url"),
      tag.toString("base64url"),
      encrypted.toString("base64url"),
    ].join(".");
  }

  public decrypt(payload: string): string {
    const [version, ivPart, tagPart, dataPart] = payload.split(".");

    if (version !== VERSION || !ivPart || !tagPart || !dataPart) {
      throw new Error("Invalid encrypted secret payload.");
    }

    const iv = Buffer.from(ivPart, "base64url");
    const tag = Buffer.from(tagPart, "base64url");
    const data = Buffer.from(dataPart, "base64url");

    if (iv.length !== IV_LENGTH || tag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Invalid encrypted secret payload.");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }
}
