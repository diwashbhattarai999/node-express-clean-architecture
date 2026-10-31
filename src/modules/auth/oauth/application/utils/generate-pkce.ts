import { createHash, randomBytes } from "node:crypto";

export const generateOAuthState = (): string => randomBytes(32).toString("base64url");

export const generateCodeVerifier = (): string => randomBytes(32).toString("base64url");

export const toS256CodeChallenge = (verifier: string): string =>
  createHash("sha256").update(verifier).digest("base64url");
