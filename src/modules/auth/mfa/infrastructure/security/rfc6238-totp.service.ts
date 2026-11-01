import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import {
  MFA_TOTP_DIGITS,
  MFA_TOTP_PERIOD_SECONDS,
  MFA_TOTP_SECRET_BYTES,
  MFA_TOTP_WINDOW,
} from "@/modules/auth/mfa/application/constants/mfa";
import type {
  BuildOtpauthUrlParams,
  GenerateTotpSecretResult,
  ITotpService,
} from "@/modules/auth/mfa/application/ports/totp.service";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (bytes: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const base32Decode = (input: string): Buffer => {
  const cleaned = input.replace(/=+$/g, "").toUpperCase().replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);

    if (idx === -1) {
      throw new Error("Invalid TOTP secret.");
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const hotp = (secret: Buffer, counter: number, digits: number): string => {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac("sha1", secret).update(buffer).digest();
  const offset = (hmac.at(-1) ?? 0) & 0x0f;
  const binary =
    (((hmac.at(offset) ?? 0) & 0x7f) << 24) |
    (((hmac.at(offset + 1) ?? 0) & 0xff) << 16) |
    (((hmac.at(offset + 2) ?? 0) & 0xff) << 8) |
    ((hmac.at(offset + 3) ?? 0) & 0xff);
  const otp = binary % 10 ** digits;

  return String(otp).padStart(digits, "0");
};

const safeEqualDigits = (left: string, right: string): boolean => {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);

  if (leftBuf.length !== rightBuf.length) {
    return false;
  }

  return timingSafeEqual(leftBuf, rightBuf);
};

export class Rfc6238TotpService implements ITotpService {
  public generateSecret(): GenerateTotpSecretResult {
    return { secret: base32Encode(randomBytes(MFA_TOTP_SECRET_BYTES)) };
  }

  public buildOtpauthUrl(params: BuildOtpauthUrlParams): string {
    const issuer = encodeURIComponent(params.issuer);
    const account = encodeURIComponent(params.accountName);
    const query = new URLSearchParams({
      secret: params.secret,
      issuer: params.issuer,
      algorithm: "SHA1",
      digits: String(MFA_TOTP_DIGITS),
      period: String(MFA_TOTP_PERIOD_SECONDS),
    });

    return `otpauth://totp/${issuer}:${account}?${query.toString()}`;
  }

  public generate(secret: string, at: Date = new Date()): string {
    const key = base32Decode(secret);
    const counter = Math.floor(at.getTime() / 1000 / MFA_TOTP_PERIOD_SECONDS);
    return hotp(key, counter, MFA_TOTP_DIGITS);
  }

  public verify(secret: string, code: string, at: Date = new Date()): boolean {
    const trimmed = code.trim();

    if (!/^\d{6}$/.test(trimmed)) {
      return false;
    }

    const key = base32Decode(secret);
    const counter = Math.floor(at.getTime() / 1000 / MFA_TOTP_PERIOD_SECONDS);

    for (let window = -MFA_TOTP_WINDOW; window <= MFA_TOTP_WINDOW; window += 1) {
      if (safeEqualDigits(hotp(key, counter + window, MFA_TOTP_DIGITS), trimmed)) {
        return true;
      }
    }

    return false;
  }
}
