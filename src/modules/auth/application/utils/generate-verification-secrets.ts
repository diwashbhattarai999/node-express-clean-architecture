import { randomBytes, randomInt } from "node:crypto";

export const generateEmailVerificationToken = (): string => randomBytes(32).toString("base64url");

export const generatePhoneOtp = (): string => String(randomInt(0, 1_000_000)).padStart(6, "0");
