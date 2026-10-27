import { createHash } from "node:crypto";

export const hashToken = (rawToken: string): string =>
  createHash("sha256").update(rawToken).digest("hex");
